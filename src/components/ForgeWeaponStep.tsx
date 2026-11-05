import { useEffect, useState } from 'react'
import { formattedRange, type Weapon } from '../data/gear'
import { loadAllKits, type Kit } from '../data/kits'
import { loadData } from '../data/load'
import { forgeImage } from '../lib/forgeImages'
import { classGear, fitsFirst, isSpecialtyKit, outsideRuleLine } from '../rules/classGear'
import { isMultiClass, weaponProficiencySlots } from '../rules/multiclass'
import { kitWeaponHints } from '../rules/proficiencyCost'
import { gypsyCanSpecialize } from '../rules/ravenloft'
import { canonicalClass, weaponProficiencyKey, weaponSlotsSpent } from '../rules/rules'
import { toggleSpecialization, weaponFromCompendium } from '../rules/sheetEdits'
import type { PlayerCharacter } from '../types/library'
import { ForgeCarousel, ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeSlotSockets } from './ForgeParts'

// Etapa 6 do The Forge: proficiências de arma. Slots pela classe e nível
// (Tabela 34; multiclasse e classe dupla como na ficha; o kit pode trocar a
// tabela). Uma arma é uma proficiência só, qualquer que seja a munição
// (weaponSlotsSpent). Gastar além dos slots só avisa — o mestre decide. A arma
// vai para a ficha do mesmo jeito que pelo seletor dela (weaponFromCompendium).

/** Uma proficiência de arma: as linhas do compêndio da mesma arma (munição, empunhadura) juntas. */
interface WeaponGroup {
  key: string
  label: string
  variants: Weapon[]
  type: string | null
  /** Arma de disparo (arco, besta, funda…): fica na seção de projéteis. */
  missile: boolean
  /** Tem alcance: de disparo ou de arremesso (adaga, lança, machadinha…). */
  ranged: boolean
}

// Os dados não separam "de disparo" de "corpo a corpo que também se arremessa";
// o nome resolve. As de arremesso ficam na seção do seu tipo de dano, com o alcance.
const launcher = /\b(bow|crossbow|sling|blowgun|arquebus)\b/i

/** Seções da etapa (um carrossel cada): armas de disparo primeiro, depois as demais pelo tipo de dano. */
const weaponSections: { id: string; title: string; art: string; test: (g: WeaponGroup) => boolean }[] = [
  { id: 'missile', title: 'Missile weapons · bows, crossbows & slings', art: 'weapons-missile', test: (g) => g.missile },
  { id: 'S', title: 'Slashing', art: 'weapons-slashing', test: (g) => !g.missile && g.type === 'S' },
  { id: 'P', title: 'Piercing', art: 'weapons-piercing', test: (g) => !g.missile && g.type === 'P' },
  { id: 'B', title: 'Bludgeoning', art: 'weapons-bludgeoning', test: (g) => !g.missile && g.type === 'B' },
  { id: 'P/S', title: 'Piercing or slashing', art: 'weapons-piercing-slashing', test: (g) => !g.missile && g.type === 'P/S' },
  { id: 'P/B', title: 'Piercing or bludgeoning', art: 'weapons-piercing-bludgeoning', test: (g) => !g.missile && g.type === 'P/B' },
  { id: 'other', title: 'Other', art: 'weapons-other', test: (g) => !g.missile && !['S', 'P', 'B', 'P/S', 'P/B'].includes(g.type ?? '') },
]

const variantLabel = (w: Weapon) => /\(([^)]*)\)\s*$/.exec(w.name)?.[1] ?? ''

function groupWeapons(weapons: Weapon[]): WeaponGroup[] {
  const map = new Map<string, WeaponGroup>()
  for (const w of weapons) {
    const key = weaponProficiencyKey(w.name)
    const group = map.get(key) ?? { key, label: w.name.replace(/\s*\([^)]*\)\s*$/, ''), variants: [], type: w.type ?? null, missile: false, ranged: false }
    group.variants.push(w)
    group.ranged ||= !!w.range
    group.missile ||= !!w.range && launcher.test(w.name)
    map.set(key, group)
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function ForgeWeaponStep({
  draft,
  mutate,
  onBack,
  onNext,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onBack: () => void
  onNext: () => void
}) {
  const [help, setHelp] = useState(false)
  const [search, setSearch] = useState('')
  const [weapons, setWeapons] = useState<Weapon[] | null>(null)
  const [kit, setKit] = useState<Kit | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadData<Weapon[]>('weapons.json'), loadAllKits()]).then(([arms, kits]) => {
      if (cancelled) return
      setWeapons(arms)
      setKit(kits.find((k) => k.name === draft.kit) ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [draft.kit])

  const multi = isMultiClass(draft)
  // Slots do kit, quando ele muda a Tabela 34 (classe única).
  const weaponTotal = weaponProficiencySlots(draft, kit?.mechanics.weaponSlots)
  const weaponUsed = weaponSlotsSpent(draft.weapons)
  const query = search.trim().toLowerCase()

  // Especialização: só guerreiro de classe única; Gypsy só na faca (como na ficha).
  const isFighter = canonicalClass(draft.characterClass) === 'Fighter' && !multi
  const isGypsy = canonicalClass(draft.characterClass) === 'Gypsy' && !multi
  const canSpecialize = (name: string) => isFighter || (isGypsy && gypsyCanSpecialize(name))
  const specializations = new Set(draft.weapons.filter((w) => w.isSpecialized).map((w) => weaponProficiencyKey(w.name))).size

  const weaponGroups = groupWeapons(weapons ?? [])
  const hints = kitWeaponHints(kit?.features.weaponProficiencies, weaponGroups.map((g) => g.key))
  // A regra da classe não proíbe: o que foge dela vem depois, apagado e com selo.
  const gear = classGear(draft, {
    specialtyPriest: isSpecialtyKit(kit?.classEligibility.allowedClasses),
    kitWeapons: new Set([...hints.required, ...hints.recommended]),
  })
  const fits = (g: WeaponGroup) => gear.weaponFits({ name: g.label, type: g.type })
  const groupIDs = (g: WeaponGroup) => new Set(g.variants.map((v) => v.id))
  const linesOf = (g: WeaponGroup) => draft.weapons.filter((x) => x.matchedWeaponID && groupIDs(g).has(x.matchedWeaponID))

  // Escolher a arma põe na ficha uma linha por variação (cada munição tem o seu dano), custando um slot só.
  const toggleWeapon = (g: WeaponGroup) =>
    mutate((c) => {
      const ids = groupIDs(g)
      const has = c.weapons.some((x) => x.matchedWeaponID && ids.has(x.matchedWeaponID))
      c.weapons = has
        ? c.weapons.filter((x) => !(x.matchedWeaponID && ids.has(x.matchedWeaponID)))
        : [...c.weapons, ...g.variants.map((w) => weaponFromCompendium({ ...w, formattedRange: formattedRange(w) }))]
    })

  const toggleSpec = (g: WeaponGroup) =>
    mutate((c) => {
      const ids = groupIDs(g)
      const on = !c.weapons.some((x) => x.matchedWeaponID && ids.has(x.matchedWeaponID) && x.isSpecialized)
      c.weapons = c.weapons.map((x) => {
        if (!(x.matchedWeaponID && ids.has(x.matchedWeaponID)) || !!x.isSpecialized === on) return x
        const copy = { ...x }
        toggleSpecialization(copy)
        return copy
      })
    })

  const shownWeapons = weaponGroups.filter((g) => query === '' || g.label.toLowerCase().includes(query))
  const chosen = new Set(draft.weapons.map((w) => weaponProficiencyKey(w.name)).filter((k) => k !== ''))
  const outside = weaponGroups.filter((g) => chosen.has(g.key) && !fits(g)).map((g) => g.label)
  // Com a classe restrita, abre com a seção que mais serve a ela; sem restrição, a ordem de sempre.
  const fitCount = (section: (typeof weaponSections)[number]) => weaponGroups.filter((g) => section.test(g) && fits(g)).length
  const sections = weaponGroups.every(fits) ? weaponSections : [...weaponSections].sort((a, b) => fitCount(b) - fitCount(a))

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext, nextLabel: 'Next: Nonweapon Proficiencies →', ready: true }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 7</p>
      <h2 className="forge-title">
        Arm Yourself
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Choose the weapons you trained with. A bow is one proficiency, whatever the arrow.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch05_proficiencies">
          Your class and level give the weapon slots (PHB Table 34); some kits change them. One slot buys one weapon — a bow with every kind of
          arrow, a sling with stones and bullets. Single-class fighters may specialize in a weapon for an extra slot (two for a bow). Going over
          your slots only warns you.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <div className="slot-pools">
        <ForgeSlotSockets label="Weapon slots" used={weaponUsed} total={weaponTotal} />
      </div>
      {weaponUsed > weaponTotal && <p className="forge-warn-line">! {weaponUsed - weaponTotal} weapon slot(s) over what your class and level give.</p>}
      {specializations > 1 && <p className="forge-warn-line">! Only one weapon specialization is allowed at character creation (PHB, Chapter 5).</p>}
      {outside.length > 0 && <p className="forge-warn-line">{outsideRuleLine(gear, outside)}</p>}
      {gear.weaponNotes.map((note) => (
        <p key={note} className="forge-class-law">
          {note}
        </p>
      ))}
      {kit?.features.weaponProficiencies && (
        <details className="forge-kit-law">
          <summary>What your kit says about weapons</summary>
          <p>{kit.features.weaponProficiencies}</p>
        </details>
      )}
      {hints.required.size > 0 && (
        <p className="forge-panel-note">
          Your kit requires: {weaponGroups.filter((g) => hints.required.has(g.key)).map((g) => g.label).join(', ')}.
        </p>
      )}

      <div className="forge-search">
        <input aria-label="Search weapons" placeholder="Search the armory…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {weapons === null && <p className="forge-panel-note">Opening the armory…</p>}
      {weapons !== null && shownWeapons.length === 0 && <p className="forge-panel-note">No weapon matches.</p>}

      {sections.map((section) => {
        const list = fitsFirst(shownWeapons.filter(section.test), fits)
        if (list.length === 0) return null
        const mine = list.filter((g) => chosen.has(g.key)).length
        return (
          <ForgeCarousel key={section.id} title={section.title} note={mine > 0 ? `${mine} chosen` : `${list.length}`} art={forgeImage(section.art)}>
            {list.map((g) => {
              const lines = linesOf(g)
              const picked = lines.length > 0
              const specialized = lines.some((x) => x.isSpecialized)
              const first = g.variants[0]
              const range = g.ranged ? formattedRange(first) : null
              const off = !fits(g)
              return (
                <div key={g.key} className={`kit-tile${picked ? ' kit-tile-chosen' : ''}${off ? ' kit-tile-outside' : ''}`}>
                  <button type="button" className="kit-tile-hit" aria-pressed={picked} onClick={() => toggleWeapon(g)}>
                    <span className="kit-tile-name">{g.label}</span>
                    <span className="weapon-variants">
                      {g.variants.map((v) => (
                        <span key={v.id} className="adj-pills adj-pills-left">
                          {variantLabel(v) && <span className="weapon-variant-name">{variantLabel(v)}</span>}
                          <span className="adj-pill">
                            S {v.damageSmall ?? '—'} · L {v.damageLarge ?? '—'}
                          </span>
                        </span>
                      ))}
                    </span>
                    <span className="adj-pills adj-pills-left">
                      <span className="adj-pill">speed {first.speedFactor}</span>
                      {range && <span className="adj-pill">{g.missile ? 'range' : 'thrown'} {range}</span>}
                      {g.missile && g.type && <span className="adj-pill">{g.type}</span>}
                      {off && <span className="adj-pill adj-down">Not for {gear.who}</span>}
                      {hints.required.has(g.key) && <span className="adj-pill adj-down">kit requires</span>}
                      {hints.recommended.has(g.key) && <span className="adj-pill adj-up">kit suggests</span>}
                    </span>
                  </button>
                  {picked && canSpecialize(g.label) && (
                    <button type="button" className={specialized ? 'kit-tile-about spec-chip spec-chip-on' : 'kit-tile-about spec-chip'} onClick={() => toggleSpec(g)}>
                      {specialized ? '★ specialized' : '☆ specialize'}
                    </button>
                  )}
                </div>
              )
            })}
          </ForgeCarousel>
        )
      })}

      {weaponUsed < weaponTotal && (
        <p className="forge-panel-note">
          {weaponTotal - weaponUsed} weapon slot{weaponTotal - weaponUsed > 1 ? 's' : ''} still open — spend {weaponTotal - weaponUsed > 1 ? 'them' : 'it'} now or save for
          later, if your DM allows.
        </p>
      )}

      <ForgeFooter {...nav} />
    </section>
  )
}
