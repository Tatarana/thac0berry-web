import { useEffect, useState, type CSSProperties } from 'react'
import { classImages, genderOf, raceImages } from '../lib/forgeImages'
import { allClasses, classLabel, hasSpellSheetAny, levelLabel } from '../rules/multiclass'
import { matchRace } from '../rules/raceKit'
import { canonicalClass } from '../rules/rules'
import type { PlayerCharacter } from '../types/library'
import { ForgeImage } from './ForgeParts'

// O fechamento do The Forge (protótipo "Finale · Reveal" no canvas): depois do
// "Create character", o herói se monta em cena — retrato e nome, os selos de
// quem ele é, os atributos cunhados, os números do combate, o pergaminho do
// que leva e as páginas da ficha — enquanto o CharacterForge grava no
// Supabase. O botão "Open your sheet" espera a gravação; se ela falha, a cena
// mostra o erro com "Try again" (o personagem continua em memória). Com
// movimento reduzido, tudo aparece de uma vez (CSS).

/** Quando cada peça entra (segundos), como no protótipo. */
const at = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` })
const sceneLength = 8400

const abilityKeys = [
  ['STR', 'strength'],
  ['DEX', 'dexterity'],
  ['CON', 'constitution'],
  ['INT', 'intelligence'],
  ['WIS', 'wisdom'],
  ['CHA', 'charisma'],
] as const

export function ForgeReveal({
  character: c,
  portraitURL,
  savedID,
  error,
  onOpen,
  onRetry,
  onBack,
}: {
  character: PlayerCharacter
  portraitURL: string | null
  /** O id do personagem já gravado; null enquanto grava. */
  savedID: string | null
  error: string | null
  onOpen: (id: string) => void
  onRetry: () => void
  onBack: () => void
}) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = window.setTimeout(() => setDone(true), reduce ? 0 : sceneLength)
    return () => window.clearTimeout(t)
  }, [])

  const gender = genderOf(c.sex)
  const race = matchRace(c.race)
  const portrait = portraitURL ? [portraitURL] : [...classImages(canonicalClass(c.characterClass), gender), ...(race ? raceImages(race, gender) : [])]
  const who = [c.race, classLabel(c), c.alignment, `Level ${levelLabel(c)}`, c.kit].filter((t): t is string => !!t)
  const str = c.abilities.strength === 18 && c.abilities.exceptionalStrength ? `18/${String(c.abilities.exceptionalStrength).padStart(2, '0')}` : String(c.abilities.strength)
  const bestSave = Math.min(c.saves.paralyzationPoisonDeath, c.saves.rodStaffWand, c.saves.petrificationPolymorph, c.saves.breathWeapon, c.saves.spell)

  // O pergaminho: só o que o personagem tem.
  const list = (items: string[], max = 4) => (items.length > max ? `${items.slice(0, max).join(', ')}…` : items.join(', '))
  const trained = [...c.weapons.map((w) => w.name), ...(c.proficiencies ?? []).map((p) => p.name)].filter((n): n is string => !!n)
  const magic: string[] = []
  if ((c.wizardSpellbook ?? []).length) magic.push(`${c.wizardSpellbook.length} spells in the book`)
  if (c.sphereAccess && Object.keys(c.sphereAccess).length) magic.push(`the ${list(Object.keys(c.sphereAccess), 3)} spheres`)
  if ((c.psionics?.powers ?? []).length) magic.push(`${c.psionics!.powers!.length} psionic powers`)
  const carried = (c.page2Equipment ?? []).map((e) => e.item).filter(Boolean)
  const purse = [c.treasure.gold ? `${c.treasure.gold} gp` : '', c.treasure.silver ? `${c.treasure.silver} sp` : '', c.treasure.copper ? `${c.treasure.copper} cp` : ''].filter(Boolean).join(' ')
  const carry = [
    trained.length ? ['Trained', list(trained)] : null,
    magic.length ? ['Magic', magic.join(' · ')] : null,
    carried.length ? ['Carries', list(carried)] : null,
    purse ? ['Purse', purse] : null,
  ].filter((x): x is [string, string] => !!x)

  const pages = ['Sheet', 'Equipment', 'Story', ...(hasSpellSheetAny(c) ? ['Spells'] : []), ...(allClasses(c).some((k) => canonicalClass(k.characterClass) === 'Psionicist') ? ['Psionics'] : [])]

  return (
    <section className="rv" aria-live="polite">
      <div className="rv-bg" aria-hidden="true" />
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="rv-ember" aria-hidden="true" style={{ left: `${8 + i * 6.5}%`, bottom: `${4 + (i % 4) * 6}%`, animationDelay: `${(i * 0.27).toFixed(2)}s` }} />
      ))}

      <p className="forge-kicker rv-in" style={at(0.1)}>
        The Forge
      </p>
      <h2 className="rv-title rv-in" style={at(0.3)}>
        Your hero is forged
      </h2>

      <div className="rv-stage">
        <div className="rv-hero">
          <div className="rv-portrait rv-in" style={at(0.5)}>
            <ForgeImage images={portrait} alt={`Portrait of ${c.name || 'your hero'}`} />
          </div>
          <div className="rv-banner rv-in" style={at(1.3)}>
            {c.name || 'Your hero'}
          </div>
          <div className="rv-who">
            {who.map((t, i) => (
              <span key={t} className="rv-stamp" style={at(1.8 + i * 0.25)}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="rv-coins">
            {abilityKeys.map(([label, key], i) => (
              <div key={key} className="rv-coin rv-stamp" style={at(3.1 + i * 0.2)}>
                <b>{key === 'strength' ? str : c.abilities[key]}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="rv-stats">
            {(
              [
                [c.hitPointsMax, 'Hit points'],
                [c.armorClass, 'Armor class'],
                [c.thac0, 'THAC0'],
                [bestSave, 'Best save'],
              ] as const
            ).map(([v, k], i) => (
              <div key={k} className="rv-stat rv-in" style={at(4.4 + i * 0.15)}>
                <b>{v}</b>
                <span>{k}</span>
              </div>
            ))}
          </div>
          {carry.length > 0 && (
            <div className="rv-carry rv-in" style={at(5.2)}>
              {carry.map(([k, v], i) => (
                <p key={k} className="rv-ink" style={at(5.6 + i * 0.45)}>
                  <b>{k}</b>
                  {v}
                </p>
              ))}
            </div>
          )}
          <div className="rv-pages" aria-hidden="true">
            {pages.map((t, i) => (
              <div key={t} className="rv-page rv-slide" style={{ ...at(7.4 + i * 0.18), left: i * 92, ['--r' as string]: `${(i - (pages.length - 1) / 2) * 4}deg` }}>
                {t}
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>

          {done && (
            <div className="rv-cta">
              {error ? (
                <>
                  <p className="rv-error">Could not save your hero: {error}</p>
                  <button type="button" className="rv-open" onClick={onRetry}>
                    Try again
                  </button>
                  <button type="button" className="rv-back" onClick={onBack}>
                    Back to the Forge
                  </button>
                </>
              ) : savedID ? (
                <>
                  <button type="button" className="rv-open" onClick={() => onOpen(savedID)}>
                    Open your sheet
                  </button>
                  <p className="rv-saved">Saved to your characters. You can change anything on the sheet.</p>
                </>
              ) : (
                <p className="rv-saved rv-saving">The forge is still cooling — saving your hero…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
