import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { loadDeities, type Deity } from '../data/deities'
import { loadAllKits } from '../data/kits'
import { genderOf, heroImages } from '../lib/forgeImages'
import { alignmentCode } from '../rules/alignment'
import {
  agingStage,
  agingThresholds,
  averageMeasure,
  bodyTable,
  deityFits,
  deitySetting,
  feetAndInches,
  measureDice,
  parseInches,
  rollMeasure,
  type Measure,
} from '../rules/description'
import { matchRace } from '../rules/raceKit'
import { canonicalClass, classGroup } from '../rules/rules'
import type { PlayerCharacter } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage } from './ForgeParts'

// Última etapa do The Forge, "Tell Your Tale" (protótipo "Last step ·
// Description" no canvas): o espelho com o retrato e os selos de idade, altura
// e peso (PHB Tabelas 10–12; PWH), a aparência em amostras de cor, o patrono
// (deities.json, com o deus do kit já escolhido) e a história — traços, terra
// natal e o pergaminho com "Spark an idea". Regras em src/rules/description.ts.
// O retrato escolhido fica no CharacterForge e sobe para o Storage depois do
// "Create character" (o personagem precisa existir).

const hair: [string, string][] = [
  ['Black', '#1a1410'],
  ['Dark brown', '#3b2414'],
  ['Chestnut', '#6b3a1e'],
  ['Auburn', '#8f3a1c'],
  ['Red', '#b8471f'],
  ['Blond', '#d9b45a'],
  ['Ash', '#b9ab8f'],
  ['Grey', '#8f8f8f'],
  ['White', '#eeeae0'],
]
const eyes: [string, string][] = [
  ['Brown', '#5a3418'],
  ['Hazel', '#8a6a2a'],
  ['Amber', '#c98a1c'],
  ['Green', '#3f7f4a'],
  ['Blue', '#3f6fb0'],
  ['Grey', '#8a96a2'],
  ['Violet', '#7a4fb0'],
  ['Black', '#141010'],
]
const skin: [string, string][] = [
  ['Pale', '#f1d9c4'],
  ['Fair', '#e7c2a2'],
  ['Olive', '#c49a6c'],
  ['Tan', '#a87a52'],
  ['Bronze', '#8a5a34'],
  ['Brown', '#6a4026'],
  ['Dark', '#3f2414'],
]
const traits = ['Brave', 'Cautious', 'Curious', 'Greedy', 'Honest', 'Hot-headed', 'Kind', 'Loyal', 'Proud', 'Reckless', 'Secretive', 'Stubborn', 'Witty', 'Pious', 'Melancholy', 'Cheerful']

type Hook = { name: string; origin: string; race: string; cls: string; trait: string; they: string; their: string }
const hooks: ((x: Hook) => string)[] = [
  (x) => `Born in ${x.origin}, ${x.name} left home the day ${x.they} realized ${x.trait} hearts don’t grow old in small villages.`,
  (x) => `${x.name} was a ${x.race} of no account in ${x.origin} — until a stranger’s debt fell on ${x.their} shoulders, and the road was the only way to pay it.`,
  (x) => `The ${x.cls.toLowerCase()}s of ${x.origin} still tell how a ${x.trait} young ${x.race} walked in one winter and walked out with a purpose.`,
  (x) => `${x.name} keeps a letter ${x.they} never sent. Somewhere beyond ${x.origin}, someone is still waiting for it.`,
]

const measureField: Record<Measure, 'age' | 'height' | 'weight'> = { age: 'age', height: 'height', weight: 'weight' }
/** O número gravado na ficha (texto) para a medida. */
const storedNumber = (measure: Measure, text: string) => (measure === 'height' ? parseInches(text) : Number.parseInt(text, 10) || null)
const shownMeasure = (measure: Measure, n: number) => (measure === 'height' ? feetAndInches(n) : String(n))

export function ForgeDescriptionStep({
  draft,
  mutate,
  portraitURL,
  onPortrait,
  creating,
  onBack,
  onFinish,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  /** O retrato escolhido (link local do arquivo); null = a arte da raça e da classe. */
  portraitURL: string | null
  onPortrait: (file: File | null) => void
  creating: boolean
  onBack: () => void
  onFinish: () => void
}) {
  const [help, setHelp] = useState(false)
  const [deities, setDeities] = useState<Deity[] | null>(null)
  const [filter, setFilter] = useState('fit')
  const [query, setQuery] = useState('')
  const [spin, setSpin] = useState<Measure | null>(null)
  const picker = useRef<HTMLInputElement>(null)

  const race = matchRace(draft.race)
  const gender = genderOf(draft.sex)
  const table = bodyTable(race)
  const mine = alignmentCode(draft.alignment)
  const priest = classGroup(draft.characterClass) === 'Priest' || canonicalClass(draft.characterClass) === 'Paladin'

  useEffect(() => {
    void loadDeities().then(setDeities)
  }, [])

  // Primeira visita: as medidas médias da raça; o deus do kit como patrono (decisão do usuário).
  useEffect(() => {
    mutate((c) => {
      for (const m of ['age', 'height', 'weight'] as Measure[]) {
        if ((c[measureField[m]] ?? '') !== '') continue
        const n = averageMeasure(table, m, gender)
        if (n !== null) c[measureField[m]] = shownMeasure(m, n)
      }
    })
    if (!draft.deity && draft.kit) {
      void loadAllKits().then((kits) => {
        const deity = kits.find((k) => k.name === draft.kit)?.deity
        if (deity) mutate((c) => void (c.deity ||= deity))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setMeasure = (m: Measure, n: number) => {
    setSpin(m)
    mutate((c) => void (c[measureField[m]] = shownMeasure(m, Math.max(1, n))))
  }
  const current = (m: Measure) => storedNumber(m, draft[measureField[m]] ?? '') ?? averageMeasure(table, m, gender) ?? 0
  const age = current('age')
  const stage = table.age ? agingStage(table, age) : null
  const thresholds = agingThresholds(table)

  const chosenTraits = (draft.personality ?? '').split(',').map((t) => t.trim()).filter((t) => traits.includes(t))
  const toggleTrait = (t: string) => {
    const next = chosenTraits.includes(t) ? chosenTraits.filter((x) => x !== t) : [...chosenTraits, t]
    mutate((c) => void (c.personality = next.length ? next.join(', ') : null))
  }

  const spark = () => {
    const pronoun = gender === 'female' ? { they: 'she', their: 'her' } : { they: 'he', their: 'his' }
    const x: Hook = {
      name: draft.name || 'Our hero',
      origin: draft.placeOfOrigin || 'a nameless village',
      race: (draft.race || 'human').toLowerCase(),
      cls: canonicalClass(draft.characterClass),
      trait: (chosenTraits[0] ?? 'restless').toLowerCase(),
      ...pronoun,
    }
    const hook = hooks[Math.floor(Math.random() * hooks.length)](x)
    mutate((c) => void (c.backgroundHistory = hook.charAt(0).toUpperCase() + hook.slice(1)))
  }

  const q = query.trim().toLowerCase()
  const gods = useMemo(
    () =>
      (deities ?? [])
        .filter((g) => {
          if (q && !`${g.name} ${g.portfolio ?? ''}`.toLowerCase().includes(q)) return false
          if (filter === 'fit') return deityFits(g.alignment, mine)
          if (filter === 'all') return true
          return deitySetting(g.book) === filter
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [deities, q, filter, mine],
  )
  const portrait = portraitURL ? [portraitURL] : heroImages(race, canonicalClass(draft.characterClass), gender)
  const nav = { onBack, onNext: onFinish, nextLabel: creating ? 'Creating…' : 'Create character', ready: !creating }

  const look = (label: string, list: [string, string][], key: 'hair' | 'eyes' | 'skin') => (
    <>
      <span className="ds-look-label">{label}</span>
      <div className="ds-swatches" role="radiogroup" aria-label={label}>
        {list.map(([name, color]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={draft[key] === name}
            aria-label={`${label}: ${name}`}
            title={name}
            className={draft[key] === name ? 'ds-sw ds-sw-on' : 'ds-sw'}
            style={{ background: color } as CSSProperties}
            onClick={() => mutate((c) => void (c[key] = name))}
          />
        ))}
      </div>
      <span className="ds-look-pick">{draft[key] || 'Choose one'}</span>
    </>
  )

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Last Step</p>
      <h2 className="forge-title">
        Tell Your Tale
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">One last look in the mirror before the road: how old you are, how you look, whom you pray to — and the story that brought you here.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch02_character_race_tables">
          Age, height and weight come from your race and gender (PHB Tables 10–12; The Planewalker’s Handbook for planar races). Past middle age,
          your ability scores start to change. Everything here can be changed later on the sheet.
        </ForgeHelpNote>
      )}

      <div className="ds-layout">
        <div className="ds-col">
          <div className="mm-card">
            <div className="ds-mirror">
              <div className="ds-mirror-glass">
                <ForgeImage images={portrait} alt="Your hero" />
              </div>
              <button type="button" className="ds-mirror-btn" onClick={() => picker.current?.click()}>
                {portraitURL ? 'Change the portrait…' : 'Use your own portrait…'}
              </button>
              <input
                ref={picker}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  e.target.value = ''
                  if (file) onPortrait(file)
                }}
              />
            </div>
            <div className="ds-banner">{draft.name || 'Your hero'}</div>
            {portraitURL && (
              <button type="button" className="al-link ds-remove" onClick={() => onPortrait(null)}>
                Take the portrait back
              </button>
            )}
            <div className="ds-seals">
              {(['age', 'height', 'weight'] as Measure[]).map((m) => {
                const value = current(m)
                const dice = measureDice(table, m)
                const fixed = m === 'age' && !table.age
                return (
                  <div key={m} className="ds-seal">
                    <div key={spin === m ? `${m}-${draft[measureField[m]]}` : m} className={spin === m ? 'ds-wax ds-wax-spin' : 'ds-wax'}>
                      <b>{fixed ? '—' : shownMeasure(m, value)}</b>
                      <span>{m === 'age' ? 'years' : m === 'height' ? 'tall' : 'lbs'}</span>
                    </div>
                    {!fixed && (
                      <div className="ds-seal-ctrl">
                        <button type="button" className="ds-mini" aria-label={`${m} down`} onClick={() => setMeasure(m, value - (m === 'weight' ? 5 : 1))}>
                          −
                        </button>
                        <button type="button" className="ds-mini" aria-label={`${m} up`} onClick={() => setMeasure(m, value + (m === 'weight' ? 5 : 1))}>
                          +
                        </button>
                      </div>
                    )}
                    {!fixed && dice && (
                      <button type="button" className="ds-dice" onClick={() => setMeasure(m, rollMeasure(table, m, gender) ?? value)}>
                        Roll {dice}
                      </button>
                    )}
                    <small>{m === 'age' ? 'Age' : m === 'height' ? 'Height' : 'Weight'}</small>
                  </div>
                )
              })}
            </div>
            <p className={stage ? 'ds-age-note ds-age-warn' : 'ds-age-note'}>
              {!thresholds
                ? 'Modrons do not age.'
                : stage
                  ? `At ${age} a ${(draft.race || 'human').toLowerCase()} is ${stage} — age starts to change the ability scores (PHB Table 12).`
                  : `Middle age comes at ${thresholds[0]}, old age at ${thresholds[1]} (PHB Table 12).`}
            </p>
          </div>

          <div className="mm-card">
            <p className="mm-card-label">Your looks</p>
            <div className="ds-look">
              {look('Hair', hair, 'hair')}
              {look('Eyes', eyes, 'eyes')}
              {look('Skin', skin, 'skin')}
            </div>
          </div>
        </div>

        <div className="ds-col">
          <div className="mm-card">
            <p className="mm-card-label ds-label-row">
              <span>Your patron · {priest ? 'your faith, by your alignment' : 'optional'}</span>
              <span>{draft.deity || ''}</span>
            </p>
            <div className="eq-bar">
              {(
                [
                  ['fit', 'Fits your alignment'],
                  ['Forgotten Realms', 'Forgotten Realms'],
                  ['Dragonlance', 'Dragonlance'],
                  ['all', 'All'],
                ] as const
              ).map(([id, name]) => (
                <button key={id} type="button" className={filter === id ? 'mm-chip mm-chip-on' : 'mm-chip'} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {name}
                </button>
              ))}
              <input className="sp-search" type="search" placeholder="Search the gods…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the gods" />
            </div>
            <div className="ds-gods">
              <button type="button" className={!draft.deity ? 'ds-god ds-god-none ds-god-on' : 'ds-god ds-god-none'} onClick={() => mutate((c) => void (c.deity = ''))}>
                No patron
                <br />— the gods can wait
              </button>
              {gods.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={['ds-god', deityFits(g.alignment, mine) ? 'ds-god-fit' : '', draft.deity === g.name ? 'ds-god-on' : ''].join(' ')}
                  aria-pressed={draft.deity === g.name}
                  onClick={() => mutate((c) => void (c.deity = g.name))}
                >
                  <span className="ds-god-al">{g.alignment && g.alignment !== 'None' ? g.alignment : '—'}</span>
                  <b>{g.name}</b>
                  <i>
                    {g.rank || 'Power'} · {deitySetting(g.book)}
                  </i>
                  {g.portfolio && <p>{g.portfolio.length > 90 ? `${g.portfolio.slice(0, 88).trimEnd()}…` : g.portfolio}</p>}
                  {g.symbol && <em>{g.symbol.length > 70 ? `${g.symbol.slice(0, 68).trimEnd()}…` : g.symbol}</em>}
                </button>
              ))}
            </div>
          </div>

          <div className="mm-card">
            <p className="mm-card-label ds-label-row">
              <span>Who you are · up to three traits</span>
              <span>{chosenTraits.length} / 3</span>
            </p>
            <div className="ds-traits">
              {traits.map((t) => {
                const on = chosenTraits.includes(t)
                return (
                  <button key={t} type="button" className={on ? 'ds-trait ds-trait-on' : 'ds-trait'} aria-pressed={on} disabled={!on && chosenTraits.length >= 3} onClick={() => toggleTrait(t)}>
                    {t}
                  </button>
                )
              })}
            </div>
            <label className="ds-origin">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
              </svg>
              <input
                type="text"
                placeholder="Where were you born?"
                value={draft.placeOfOrigin ?? ''}
                onChange={(e) => mutate((c) => void (c.placeOfOrigin = e.target.value || null))}
                aria-label="Place of origin"
              />
            </label>
            <div className="ds-scroll">
              <textarea
                placeholder="How did you come to the road?"
                aria-label="Background"
                value={draft.backgroundHistory ?? ''}
                onChange={(e) => mutate((c) => void (c.backgroundHistory = e.target.value || null))}
              />
            </div>
            <div className="eq-bar ds-spark-row">
              <button type="button" className="ds-spark" onClick={spark}>
                Spark an idea
              </button>
              <span className="ds-hint">A hook built from your race, class, traits and home — keep it, change it, or write your own.</span>
            </div>
          </div>
        </div>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
