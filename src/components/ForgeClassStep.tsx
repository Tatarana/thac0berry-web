import { useEffect, useState } from 'react'
import { loadAllKits, type Kit } from '../data/kits'
import { changeClass, setFormerClasses, setMultiClasses } from '../rules/consequences'
import {
  allClasses,
  bardCombosFor,
  classLevels,
  classWarnings,
  combosFor,
  dualClassOptions,
  dualHitPointsRule,
  hitPointsRule,
  isDualClass,
  isMultiClass,
  kitWarnings,
  multiClassOptions,
} from '../rules/multiclass'
import { classAlignmentWarning, kitAlignmentWarning } from '../rules/alignment'
import { allowedBySettings } from '../rules/campaignFilter'
import { kitsAllowedFor, levelLimit, matchRace } from '../rules/raceKit'
import { classCampaignSetting, ravenloftClasses, ravenloftWarnings } from '../rules/ravenloft'
import { canonicalClass, classGroup } from '../rules/rules'
import type { CharacterClass, ClassLevel, PlayerCharacter } from '../types/library'
import { classImages, comboImages, genderOf, type Gender } from '../lib/forgeImages'
import { ForgeCard, ForgeComboCard, ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeSettingsPicker, ForgeThumbButton } from './ForgeParts'
import { KitDetail } from './KitDetail'

// Etapa 5 do The Forge: a classe em cards ilustrados (o mesmo ForgeCard das
// etapas 2 e 3), com o limite de nível da raça em cada card; depois o ramo de
// multiclasse (semi-humano, também com as ilustrações) ou classe dupla
// (humano) e o kit. Classes e kits seguem os cenários da mesa escolhidos na
// etapa de raça. Regras de multiclass.ts / raceKit.ts / ravenloft.ts; avisos
// nunca bloqueiam.

const classOptions: CharacterClass[] = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', ...ravenloftClasses]

const KIT_PREVIEW = 12

export function ForgeClassStep({
  draft,
  mutate,
  settings,
  onSettings,
  chosen,
  onChoose,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  onSettings: (next: string[]) => void
  /** A classe já foi escolhida nesta criação (a ficha em branco nasce como Fighter). */
  chosen: boolean
  onChoose: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [help, setHelp] = useState(false)
  const race = matchRace(draft.race)
  const gender = genderOf(draft.sex)
  const primary = chosen ? canonicalClass(draft.characterClass) : null
  const shownClasses = classOptions.filter((cls) => canonicalClass(cls) === primary || allowedBySettings(classCampaignSetting(cls), settings))

  const selectPrimary = (cls: CharacterClass) => {
    mutate((c) => {
      changeClass(c, cls, null)
      c.multiClasses = null
      c.formerClasses = null
      c.kit = null
    })
    onChoose()
  }

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext, nextLabel: 'Next: Starting point →', ready: !!primary }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 5</p>
      <h2 className="forge-title">
        Choose Your Calling
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">The class decides how you fight, what you cast and how far your kindred can rise in it. Then pick a kit to give it a story.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch03_multi_class_and_dual_class_characters">
          Each card shows how high your kindred can rise in that class (PHB Table 7). A &ldquo;!&rdquo; marks a class your race can&rsquo;t normally
          take, one your alignment doesn&rsquo;t fit, or one whose setting rules you don&rsquo;t meet — you can still choose it. Demihumans may become multi-class; humans may already be
          dual-classed. The kit is optional.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <ForgeSettingsPicker settings={settings} onChange={onSettings} />

      <div className="forge-card-grid">
        {shownClasses.map((cls) => {
          const canonical = canonicalClass(cls)
          const limit = race ? levelLimit(race, cls) : 'unlimited'
          const warnings = [
            ...(limit === 'forbidden' && race ? [`${race} cannot normally be a ${canonical} (PHB Table 7).`] : []),
            ...ravenloftWarnings({ characterClass: cls, abilities: draft.abilities, race: draft.race }, null),
            ...[classAlignmentWarning(cls, draft.alignment)].filter((w): w is string => !!w),
          ]
          const group = (ravenloftClasses as string[]).includes(canonical) ? 'Ravenloft' : classGroup(cls)
          return (
            <ForgeCard
              key={cls}
              image={[...comboImages(race, canonical, gender), ...classImages(canonical, gender)]}
              alt={canonical}
              label={canonical}
              chosen={primary === canonical}
              dimmed={!!primary && primary !== canonical}
              flag={warnings.length > 0 ? warnings.join(' ') : undefined}
              onClick={() => selectPrimary(cls)}
            >
              <span className="adj-pills">
                <span className="adj-pill">{group}</span>
                <span className={limit === 'forbidden' ? 'adj-pill adj-down' : 'adj-pill adj-up'}>
                  {limit === 'unlimited' ? 'no level limit' : limit === 'forbidden' ? 'not for your race' : `max level ${limit}`}
                </span>
              </span>
            </ForgeCard>
          )
        })}
      </div>

      {primary && race === 'Human' && <DualClassBranch draft={draft} mutate={mutate} />}
      {primary && race && race !== 'Human' && <MultiClassBranch draft={draft} mutate={mutate} gender={gender} />}
      {primary && <KitGallery draft={draft} mutate={mutate} settings={settings} />}

      <ForgeFooter {...nav} />
    </section>
  )
}

/** Semi-humano: acrescentar classes (multiclasse), com as combinações padrão da raça como atalho. */
function MultiClassBranch({ draft, mutate, gender }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void; gender: Gender | null }) {
  const [open, setOpen] = useState(isMultiClass(draft))
  const extra = draft.multiClasses ?? []
  const all = classLevels(draft)
  const taken = new Set(all.map((k) => canonicalClass(k.characterClass)))
  const combos = combosFor(draft.race)
  const bardCombos = bardCombosFor(draft.race)
  const warnings = classWarnings(draft)
  const primary = canonicalClass(draft.characterClass)

  const change = (multiClasses: ClassLevel[]) => mutate((c) => setMultiClasses(c, multiClasses))

  const asClasses = (combo: string[]) => combo.map((n) => (n === 'Illusionist' ? 'Mage' : n))
  const isCurrent = (combo: string[]) => {
    const wanted = new Set(asClasses(combo))
    const have = new Set<string>(taken)
    return wanted.size === have.size && [...wanted].every((n) => have.has(n))
  }
  const comboParts = (combo: string[]) => asClasses(combo).map((n) => ({ images: classImages(n, gender), alt: n }))

  const adopt = (combo: string[]) => {
    const wanted = asClasses(combo).filter((n) => n !== primary)
    const keep = extra.filter((k) => wanted.includes(canonicalClass(k.characterClass)))
    const add = wanted.filter((n) => !keep.some((k) => canonicalClass(k.characterClass) === n)).map((n) => ({ characterClass: n as CharacterClass, level: 1 }))
    change([...keep, ...add])
  }

  return (
    <div className="forge-panel">
      <div className="method-row">
        <button
          type="button"
          className={open ? 'method-pill method-active' : 'method-pill'}
          onClick={() => {
            if (open) change([])
            setOpen(!open)
          }}
        >
          {open ? `Multi-class ${draft.race} — tap to cancel` : `Make this ${draft.race} multi-class`}
        </button>
      </div>
      {open && (
        <>
          <p className="forge-panel-note">Experience is split equally between the classes; the character uses the best THAC0 and the best saving throw among them.</p>
          {(combos.length > 0 || bardCombos.length > 0) && (
            <>
              <p className="forge-panel-label">Standard {draft.race} combinations</p>
              <div className="forge-card-grid forge-combo-grid">
                {combos.map((combo) => (
                  <ForgeComboCard
                    key={combo.join('/')}
                    parts={comboParts(combo)}
                    label={asClasses(combo).join(' / ')}
                    chosen={isCurrent(combo)}
                    dimmed={isMultiClass(draft) && !isCurrent(combo)}
                    onClick={() => adopt(combo)}
                  />
                ))}
                {bardCombos.map((combo) => (
                  <ForgeComboCard
                    key={combo.classes.join('/')}
                    parts={comboParts(combo.classes)}
                    label={asClasses(combo.classes).join(' / ')}
                    sub={`kit: ${combo.kits.join(' or ')}`}
                    chosen={isCurrent(combo.classes)}
                    dimmed={isMultiClass(draft) && !isCurrent(combo.classes)}
                    onClick={() => adopt(combo.classes)}
                  />
                ))}
              </div>
            </>
          )}
          <p className="forge-panel-label">Or build your own · tap a class to add or remove it</p>
          <div className="forge-thumbs">
            <ForgeThumbButton images={classImages(primary, gender)} label={primary} on />
            {extra.map((k, index) => (
              <ForgeThumbButton
                key={`${k.characterClass}-${index}`}
                images={classImages(canonicalClass(k.characterClass), gender)}
                label={canonicalClass(k.characterClass)}
                on
                onClick={() => change(extra.filter((_, i) => i !== index))}
              />
            ))}
            {multiClassOptions
              .filter((o) => !taken.has(canonicalClass(o)))
              .map((o) => (
                <ForgeThumbButton key={o} images={classImages(o, gender)} label={o} onClick={() => change([...extra, { characterClass: o, level: 1 }])} />
              ))}
          </div>
          {warnings.map((w) => (
            <p key={w} className="forge-warn-line">
              ! {w}
            </p>
          ))}
          {all.length > 1 && <p className="forge-panel-note">Hit points (worked out by hand on the sheet): {hitPointsRule(all)}</p>}
        </>
      )}
    </div>
  )
}

/** Humano: declarar classes anteriores (classe dupla já em andamento, trazida de outro lugar). */
function DualClassBranch({ draft, mutate }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void }) {
  const [open, setOpen] = useState(isDualClass(draft))
  const former = draft.formerClasses ?? []
  const current = canonicalClass(draft.characterClass)
  const taken = new Set(allClasses(draft).map((k) => canonicalClass(k.characterClass)))
  const options = dualClassOptions.filter((o) => !taken.has(canonicalClass(o)))
  const warnings = classWarnings(draft)

  const changeFormer = (formerClasses: ClassLevel[]) => mutate((c) => setFormerClasses(c, formerClasses))
  const setLevel = (index: number, level: number) => changeFormer(former.map((x, i) => (i === index ? { ...x, level: Math.max(1, Math.min(30, level)) } : x)))

  return (
    <div className="forge-panel">
      <div className="method-row">
        <button
          type="button"
          className={open ? 'method-pill method-active' : 'method-pill'}
          onClick={() => {
            if (open) changeFormer([])
            setOpen(!open)
          }}
        >
          {open ? 'Dual-classed human — tap to cancel' : 'This human is already dual-classed'}
        </button>
      </div>
      {open && (
        <>
          <p className="forge-panel-note">
            {current} keeps advancing; a former class freezes at the level it was left. The Starting point step sets the level of {current}.
          </p>
          <div className="method-row">
            {former.map((k, index) => (
              <span key={`${k.characterClass}-${index}`} className="former-class">
                <span className="former-class-name">ex-{canonicalClass(k.characterClass)}</span>
                <button type="button" className="former-step" aria-label="One level less" onClick={() => setLevel(index, k.level - 1)}>
                  −
                </button>
                <span className="former-level">{k.level}</span>
                <button type="button" className="former-step" aria-label="One level more" onClick={() => setLevel(index, k.level + 1)}>
                  +
                </button>
                <button type="button" className="former-step" aria-label={`Remove ex-${canonicalClass(k.characterClass)}`} onClick={() => changeFormer(former.filter((_, i) => i !== index))}>
                  ✕
                </button>
              </span>
            ))}
            {options.map((o) => (
              <button key={o} type="button" className="method-pill" onClick={() => changeFormer([...former, { characterClass: o, level: 2 }])}>
                + ex-{o}
              </button>
            ))}
          </div>
          {former.some((k) => canonicalClass(k.characterClass) === current) && (
            <p className="forge-warn-line">! {current} is already a former class: a dual-class character cannot go back to a class he left.</p>
          )}
          {warnings.map((w) => (
            <p key={w} className="forge-warn-line">
              ! {w}
            </p>
          ))}
          {former.length > 0 && <p className="forge-panel-note">Hit points (worked out by hand on the sheet): {dualHitPointsRule(draft)}</p>}
        </>
      )}
    </div>
  )
}

/** Kit da classe (ou de qualquer classe do personagem, no multiclasse/classe dupla) — igual ao KitPicker da ficha. */
function KitGallery({ draft, mutate, settings }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void; settings: string[] }) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [detail, setDetail] = useState<Kit | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const classes = allClasses(draft).map((k) => k.characterClass)
    void loadAllKits().then((all) => {
      const seen = new Set<string>()
      const list = classes.flatMap((cls) => kitsAllowedFor(all, cls)).filter((k) => (seen.has(k.id) ? false : (seen.add(k.id), true)))
      setKits(list.sort((a, b) => a.name.localeCompare(b.name)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.characterClass, JSON.stringify(draft.multiClasses ?? []), JSON.stringify(draft.formerClasses ?? [])])

  const chooseKit = (kit: Kit | null) => mutate((c) => { c.kit = kit ? kit.name : null })
  // Kits dos cenários da mesa (o já escolhido continua à vista).
  const list = (kits ?? []).filter((kit) => kit.name === draft.kit || allowedBySettings(kit.setting, settings))
  const visible = showAll ? list : list.slice(0, KIT_PREVIEW)

  return (
    <div className="kit-section">
      <p className="forge-kicker">Kit · optional</p>
      {kits === null && <p className="forge-panel-note">Opening the kit books…</p>}
      {kits !== null && (
        <div className="kit-grid">
          <div className={draft.kit ? 'kit-tile' : 'kit-tile kit-tile-chosen'}>
            <button type="button" className="kit-tile-hit" onClick={() => chooseKit(null)}>
              <span className="kit-tile-name">No kit</span>
              <span className="kit-tile-sub">the class as the Player&rsquo;s Handbook describes it</span>
            </button>
          </div>
          {visible.map((kit) => {
            const alignmentWarning = kitAlignmentWarning(kit.mechanics.requirements?.alignments, draft.alignment)
            const warnings = [...kitWarnings(kit, draft, null), ...(alignmentWarning ? [alignmentWarning] : [])]
            return (
              <div key={kit.id} className={draft.kit === kit.name ? 'kit-tile kit-tile-chosen' : 'kit-tile'}>
                <button type="button" className="kit-tile-hit" onClick={() => chooseKit(kit)}>
                  <span className="kit-tile-name">{kit.name}</span>
                  <span className="kit-tile-sub">{[kit.classEligibility.subclass, kit.deity].filter(Boolean).join(' · ') || kit.classEligibility.classGroup}</span>
                  {warnings.length > 0 && <span className="kit-tile-warn">! {warnings[0]}</span>}
                </button>
                <button type="button" className="kit-tile-about" onClick={() => setDetail(kit)}>
                  about
                </button>
              </div>
            )
          })}
        </div>
      )}
      {kits !== null && list.length > KIT_PREVIEW && (
        <div className="method-row">
          <button type="button" className="method-pill" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer kits' : `Show all ${list.length} kits`}
          </button>
        </div>
      )}
      {kits !== null && list.length === 0 && <p className="forge-panel-note">No kit for this class.</p>}
      {detail && <KitDetail kit={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
