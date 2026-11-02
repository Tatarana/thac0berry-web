import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { isGenericSetting, loadSpell, loadSpellIndex, type Spell, type SpellIndexEntry } from '../data/spells'
import { classImages, genderOf, raceImages } from '../lib/forgeImages'
import { allowedBySettings } from '../rules/campaignFilter'
import { levelOf } from '../rules/multiclass'
import { matchRace } from '../rules/raceKit'
import { isGypsySpell } from '../rules/ravenloft'
import { bardSpellProgression, gypsySpellProgression, maxSpellLevelInt, priestSpellProgression, wizardLearning, wizardSpellProgression } from '../rules/rules'
import {
  bookContext,
  bookEntries,
  bookRoom,
  chooseMethod,
  chooseSchool,
  circleCounts,
  circleName,
  anchoriteAlignments,
  coreSpheres,
  cycleSphere,
  defaultSphereAccess,
  freeStudy,
  learnChance,
  opposedSpell,
  isWarriorCaster,
  warriorCasters,
  warriorCastingLevel,
  warriorSpellProgression,
  sphereGrants,
  sphereOf,
  spellCasting,
  spellVerdict,
  studySpell,
  tomeSpheres,
  trainingSpells,
  type ArcaneCaster,
  type BookMethod,
  type BookSpell,
  type BookState,
  type DivineCaster,
  type WarriorCaster,
  type LaterRule,
} from '../rules/spellbook'
import { wizardSchools } from '../rules/spellSheets'
import type { PlayerCharacter, WizardSchool } from '../types/library'
import { ForgeDice, type DieSpec } from './ForgeDice'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage, ForgeSlotSockets } from './ForgeParts'
import { SpellDetail } from './SpellDetail'

// Etapa de magias do The Forge (protótipo "Step 9 · Spells" no canvas). Mago e
// bardo: o grimório inicial — escola, o jeito do DMG de encher o livro, a
// biblioteca de pergaminhos e a rolagem de "chance to learn" com dados na
// mesa (ForgeDice). Sacerdote: a constelação de esferas da classe. Regras em
// src/rules/spellbook.ts; grava `wizardSchool`, `wizardSpellbook` e
// `sphereAccess`, os mesmos campos da ficha. O estado do livro (método,
// dados, falhas) vive no CharacterForge, para voltar à etapa sem rolar de novo.

const schoolArt: Record<string, { short: string; color: string; icon: string }> = {
  Abjuration: { short: 'Abjuration', color: '#7fb3e0', icon: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.9-4.3-1.9-7.5-5.3-7.5-9.9V6Z M12 8v8M8.5 12h7' },
  Alteration: { short: 'Alteration', color: '#6fbf8e', icon: 'M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6 M17.7 3v3.4h-3.4 M6.3 21v-3.4h3.4' },
  'Conjuration/Summoning': { short: 'Conjuration', color: '#c98bff', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7l1.5 3.3 3.5.4-2.6 2.4.7 3.5L12 14.8 8.9 16.6l.7-3.5L7 10.7l3.5-.4Z' },
  Divination: { short: 'Divination', color: '#ffd27a', icon: 'M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z M9.4 12a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0' },
  'Enchantment/Charm': { short: 'Enchantment', color: '#ff8fb3', icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z M9.5 11.5q2.5 2 5 0' },
  'Illusion/Phantasm': { short: 'Illusion', color: '#a58bff', icon: 'M4 5c5 1.5 11 1.5 16 0v6c0 5-3.6 9-8 9s-8-4-8-9Z M8 10.5h2.5M13.5 10.5H16 M9.5 15q2.5 1.5 5 0' },
  'Invocation/Evocation': { short: 'Invocation', color: '#ff7a45', icon: 'M13 2 5 13.5h6L10 22l9-12h-6Z' },
  Necromancy: { short: 'Necromancy', color: '#b4c99a', icon: 'M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.2 3 5.3V19h9v-3.2c1.7-1.1 3-2.7 3-5.3A7.5 7.5 0 0 0 12 3Z M9 10.5h.01M15 10.5h.01 M10.5 19v-2M13.5 19v-2' },
  All: { short: 'All schools', color: '#efe4d3', icon: 'M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5Z' },
}
const bookIcon = 'M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0Z M12 5.5V19'
const specialistNeeds: Record<string, string> = {
  Abjuration: 'Wis 15',
  Alteration: 'Dex 15',
  'Conjuration/Summoning': 'Con 15',
  Divination: 'Wis 16',
  'Enchantment/Charm': 'Cha 16',
  'Illusion/Phantasm': 'Dex 16',
  'Invocation/Evocation': 'Con 16',
  Necromancy: 'Wis 16',
}
const artOf = (s: BookSpell) => schoolArt[s.schools[0]] ?? schoolArt.All

/** "Read Magic and Detect Magic" / "Detect Magic". */
const listed = (names: string[]) => names.join(' and ')
const numberWords = ['no', 'one', 'two', 'three', 'four', 'five', 'six']

const methods: { id: BookMethod; name: string; source: string; text: (specialist: boolean, training: string[]) => string }[] = [
  {
    id: 'trial',
    name: 'The Apprentice’s Trial',
    source: 'Player / DM collaboration',
    text: (sp, tr) =>
      `Roll 3d4 for the size of the book. ${listed(tr)} ${tr.length > 1 ? 'are' : 'is'} already there${sp ? ', and one spell of your school is a gift' : ''}; every other spell you choose must pass your chance to learn.`,
  },
  {
    id: 'gift',
    name: 'The Master’s Gift',
    source: 'DM choice',
    text: (_, tr) => `${listed(tr)} and ${numberWords[6 - tr.length]} more spells you choose. No rolls — you mastered them all during your apprenticeship.`,
  },
  {
    id: 'library',
    name: 'The Open Library',
    source: 'Player choice',
    text: (_, tr) => `Choose any spell and roll to learn it, one by one, until your Intelligence allows no more. Nothing is given — not even ${tr[0]}.`,
  },
]

// Paladino e ranger: as esferas fixas do PHB cap. 3 e o que a tela diz deles.
const warriorText: Record<WarriorCaster, { spheres: string; intro: string; help: string; ruleID: string; laws: string[] }> = {
  Paladin: {
    spheres: 'four spheres: combat, divination, healing and protection',
    intro: 'A paladin’s devotion is answered at 9th level: prayers from the combat, divination, healing and protection spheres, up to the 4th spell level.',
    help: 'From 9th level a paladin casts priest spells of four spheres, by PHB Table 17. Casting level is the paladin’s level minus 8, and a high Wisdom gives no bonus spells.',
    ruleID: 'phb_ch03_paladin',
    laws: [
      'Spells come at 9th level; your casting level is your level minus 8.',
      'Only the combat, divination, healing and protection spheres — never above the 4th spell level.',
      'A high Wisdom gives a paladin no bonus spells.',
      'No priest scrolls, and only the magic items the warrior group may use.',
    ],
  },
  Ranger: {
    spheres: 'two spheres: plant and animal',
    intro: 'The wild answers a ranger at 8th level: priest spells from the plant and animal spheres, up to the 3rd spell level.',
    help: 'From 8th level a ranger casts priest spells of the plant and animal spheres, by PHB Table 18, and gains and uses them by the rules for priests. Casting level is the ranger’s level minus 7.',
    ruleID: 'phb_ch03_ranger',
    laws: [
      'Spells come at 8th level; your casting level is your level minus 7.',
      'Only the plant and animal spheres — never above the 3rd spell level.',
      'You gain and use your spells by the rules for priests.',
    ],
  },
}

const newID = () => crypto.randomUUID().toUpperCase()
const rollD = (sides: number) => 1 + Math.floor(Math.random() * sides)
const rad = (deg: number) => (deg * Math.PI) / 180

type Rolling = { kind: 'book'; dice: number[] } | { kind: 'study'; spell: BookSpell; roll: number; chance: number; done: boolean; ok: boolean }

export function ForgeSpellStep({
  draft,
  mutate,
  settings,
  book,
  onBook,
  sphereFor,
  onSphereFor,
  onBack,
  onFinish,
  creating,
  stepNumber,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  stepNumber: number
  book: BookState | null
  onBook: (next: BookState) => void
  /** Para que classe (e alinhamento, no anchorite) as esferas gravadas foram feitas: trocou, refaz. */
  sphereFor: string | null
  onSphereFor: (key: string) => void
  onBack: () => void
  onFinish: () => void
  creating: boolean
}) {
  const casting = spellCasting(draft)
  const [view, setView] = useState<'arcane' | 'divine'>(casting.arcane ? 'arcane' : 'divine')
  const [help, setHelp] = useState(false)
  const [index, setIndex] = useState<{ arcane: SpellIndexEntry[]; divine: SpellIndexEntry[] } | null>(null)

  useEffect(() => {
    void loadSpellIndex().then(setIndex)
  }, [])

  const nav = { onBack, onNext: onFinish, nextLabel: creating ? 'Creating…' : 'Create character', ready: !creating }
  const gender = genderOf(draft.sex)
  const race = matchRace(draft.race)
  const showArcane = view === 'arcane' && !!casting.arcane
  const cls = showArcane ? casting.arcane : casting.divine
  // Sem classe que conjure (não deveria chegar aqui: o CharacterForge só abre a etapa para conjuradores).
  if (!cls) return null
  const portrait = [...classImages(cls, gender), ...(race ? raceImages(race, gender) : [])]

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step {stepNumber}</p>
      <h2 className="forge-title">
        {showArcane ? (casting.arcane === 'Gypsy' ? 'Read the Signs' : 'Open Your Spellbook') : 'Commune with the Spheres'}
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">
        {showArcane
          ? casting.arcane === 'Mage'
            ? 'Every wizard leaves apprenticeship with a book of spells. Choose your school, choose how your master filled the book — then study the library, one spell at a time.'
            : casting.arcane === 'Gypsy'
              ? 'A gypsy keeps no spellbook: the tribe’s divinations live in memory. Choose how the elders taught you, then learn the signs one at a time — only lesser and greater divinations.'
              : 'A bard collects spells along the road, never by right. Roll for the spells you picked up, then study each one — your wits decide what sticks.'
          : casting.divine && isWarriorCaster(casting.divine)
            ? warriorText[casting.divine].intro
            : casting.divine === 'Anchorite'
              ? 'An anchorite of Ezra keeps no spellbook: Ezra grants every spell of the spheres the anchorite’s alignment reaches — lawful good, lawful neutral or true neutral.'
              : 'A priest keeps no spellbook: the god grants every spell of the spheres the priest can reach. Major access opens a sphere at every level; minor, only up to the 3rd.'}
      </p>
      {help &&
        (showArcane ? (
          <ForgeHelpNote ruleID={casting.arcane === 'Gypsy' ? 'dod_ch00_gypsy' : 'dmg_ch07_magic'}>
            {casting.arcane === 'Gypsy'
              ? 'Gypsies cast wizard spells of the lesser and greater divination schools only (Domains of Dread, Table 104). They keep no spellbook and need not choose their spells ahead of time, but every casting takes three turns. They learn their spells much as wizards do: here, by the DMG’s three ways, with your Intelligence setting the chance to learn.'
              : 'The DMG gives three ways to fill a starting spellbook, and you pick one. Your Intelligence (PHB Table 4) sets the chance to learn each spell, the most spells per circle and the highest circle you can understand. A specialist adds 15% for their own school, loses 15% for the others, and can never learn the opposed schools.'}
          </ForgeHelpNote>
        ) : (
          <ForgeHelpNote
            ruleID={
              casting.divine && isWarriorCaster(casting.divine)
                ? warriorText[casting.divine].ruleID
                : casting.divine === 'Anchorite'
                  ? 'dod_ch00_anchorite'
                  : 'phb_ch03_priests_of_specific_mythoi'
            }
          >
            {casting.divine && isWarriorCaster(casting.divine)
              ? warriorText[casting.divine].help
              : casting.divine === 'Anchorite'
                ? 'Domains of Dread gives each anchorite of Ezra the spheres of their alignment (Table 92): lawful good, lawful neutral or true neutral. Wards, Law and Chaos come from the Tome of Magic.'
                : 'Clerics and druids reach a fixed set of spheres (PHB chapter 3). A specialty priest of a particular god has spheres of their own — set them here.'}
          </ForgeHelpNote>
        ))}

      {casting.arcane && casting.divine && (
        <div className="sp-views" role="tablist" aria-label="Kind of magic">
          <button type="button" role="tab" aria-selected={view === 'arcane'} className={view === 'arcane' ? 'mm-chip mm-chip-on' : 'mm-chip'} onClick={() => setView('arcane')}>
            Spellbook ({casting.arcane})
          </button>
          <button type="button" role="tab" aria-selected={view === 'divine'} className={view === 'divine' ? 'mm-chip mm-chip-on' : 'mm-chip'} onClick={() => setView('divine')}>
            Spheres ({casting.divine})
          </button>
        </div>
      )}

      {index === null ? (
        <p className="mm-loading sp-loading">Opening the library…</p>
      ) : showArcane ? (
        <ArcaneBook draft={draft} mutate={mutate} settings={settings} index={index.arcane} cls={casting.arcane!} book={book} onBook={onBook} portrait={portrait} />
      ) : (
        <SphereSky
          draft={draft}
          mutate={mutate}
          settings={settings}
          index={index.divine}
          cls={casting.divine!}
          portrait={portrait}
          sphereFor={sphereFor}
          onSphereFor={onSphereFor}
        />
      )}

      <ForgeFooter {...nav} />
    </section>
  )
}

function SchoolIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function ArcaneBook({
  draft,
  mutate,
  settings,
  index,
  cls,
  book,
  onBook,
  portrait,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  index: SpellIndexEntry[]
  cls: ArcaneCaster
  book: BookState | null
  onBook: (next: BookState) => void
  portrait: string[]
}) {
  // mage: a escola. book: o livro pelos três jeitos do DMG (mago e gypsy); o bardo rola 1d4.
  const mage = cls === 'Mage'
  const gypsy = cls === 'Gypsy'
  const book3 = cls !== 'Bard'
  const training = trainingSpells(cls)
  const level = levelOf(draft, cls) ?? draft.level
  const intelligence = draft.abilities.intelligence
  const learning = wizardLearning(intelligence)
  const progression = gypsy
    ? gypsySpellProgression(level).slice(0, Math.max(1, maxSpellLevelInt(intelligence)))
    : (mage ? wizardSpellProgression : bardSpellProgression)(level, intelligence)
  const castable = progression.filter((n) => n > 0).length
  const school = mage ? (draft.wizardSchool ?? null) : null

  const spells = useMemo(
    () =>
      index.flatMap((e): BookSpell[] => {
        if (e.level < 1 || e.level > 9 || !(isGenericSetting(e.setting) || allowedBySettings(e.setting, settings))) return []
        // Gypsy: só adivinhação (lesser e greater divination).
        if (gypsy && !isGypsySpell(e.schools)) return []
        const schools = e.schools.filter((s) => s in schoolArt || s === 'All Schools').map((s) => (s === 'All Schools' ? 'All' : s))
        // Para o gypsy, a adivinhação vem primeiro (é ela que dá a cor e o emblema do pergaminho).
        if (gypsy) schools.sort((a, b) => Number(b === 'Divination') - Number(a === 'Divination'))
        return schools.length ? [{ id: e.id, name: e.name, level: e.level, schools }] : []
      }),
    [index, settings, gypsy],
  )
  const byID = useMemo(() => new Map(spells.map((s) => [s.id, s])), [spells])
  const entryByID = useMemo(() => new Map(index.map((e) => [e.id, e])), [index])

  const [circle, setCircle] = useState(1)
  const [filter, setFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<Spell | null>(null)
  const [reading, setReading] = useState<SpellIndexEntry | null>(null)
  const [rolling, setRolling] = useState<Rolling | null>(null)
  const [rollKey, setRollKey] = useState(0)

  const state = book ?? chooseMethod('trial', 'perLevel', training, spells)
  // Primeira visita: o livro nasce no "trial" (com as magias de treino da classe).
  const started = useRef(false)
  useEffect(() => {
    if (book || started.current || spells.length === 0) return
    started.current = true
    commit(chooseMethod('trial', 'perLevel', training, spells))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, spells.length])

  useEffect(() => {
    const entry = selected ? entryByID.get(selected) : undefined
    if (!entry) return
    let live = true
    void loadSpell(entry).then((s) => live && setDetail(s ?? null))
    return () => {
      live = false
    }
  }, [selected, entryByID])

  if (!learning) {
    return (
      <div className="sp-empty">
        <p className="hint">Intelligence {intelligence} is too low to learn wizard spells (PHB Table 4 starts at 9).</p>
      </div>
    )
  }
  const ctx = bookContext({ mage: book3, level, castable, chance: learning.chance, perCircle: learning.perCircle, school }, state)
  const counts = circleCounts(state, byID)
  const total = Object.keys(state.book).length

  function commit(next: BookState) {
    onBook(next)
    mutate((c) => {
      c.wizardSpellbook = bookEntries(next, byID, c.wizardSpellbook ?? [], newID)
    })
  }

  const setMethod = (m: BookMethod) => {
    if (m === state.method) return
    commit({ ...chooseMethod(m, state.later, training, spells) })
    setSelected(null)
    setRolling(null)
  }
  const setLater = (later: LaterRule) => commit({ ...state, later })
  const setSchool = (k: string | null) => {
    mutate((c) => {
      c.wizardSchool = k as WizardSchool | null
    })
    commit(chooseSchool(state, k, byID))
    setSelected(null)
  }

  const rollBook = () => {
    const dice = book3 ? [rollD(4), rollD(4), rollD(4)] : [rollD(4)]
    setRolling({ kind: 'book', dice })
    setRollKey((k) => k + 1)
  }
  const study = (s: BookSpell) => {
    const v = spellVerdict(s, ctx, state, byID)
    if (!v.ok) return
    if (v.erase || freeStudy(s, ctx, state)) {
      commit(studySpell(state, s, ctx, null).state)
      if (v.erase) setSelected(null)
      return
    }
    const chance = learnChance(s, ctx)
    setRolling({ kind: 'study', spell: s, roll: rollD(100), chance, done: false, ok: false })
    setRollKey((k) => k + 1)
  }
  const settled = () => {
    if (!rolling) return
    if (rolling.kind === 'book') {
      commit({ ...state, dice: rolling.dice })
      setRolling(null)
      return
    }
    const r = studySpell(state, rolling.spell, ctx, rolling.roll)
    commit(r.state)
    setRolling({ ...rolling, done: true, ok: r.ok })
  }

  // Dados na mesa: o tamanho do livro (antes de rolar e rolando) ou o d100 de uma magia.
  let dice: DieSpec[] = []
  if (rolling?.kind === 'study') dice = [{ kind: 'd10x10', value: Math.floor((rolling.roll % 100) / 10) }, { kind: 'd10', value: rolling.roll % 10 }]
  else if (rolling?.kind === 'book') dice = rolling.dice.map((v) => ({ kind: 'd4', value: v }))
  else if (ctx.first === null) dice = (book3 ? [0, 0, 0] : [0]).map(() => ({ kind: 'd4' as const, value: 1 }))
  const trayOpen = !!rolling || ctx.first === null || (!book3 && level < 2)

  // Página do círculo: magias escritas e linhas em branco até a capacidade.
  const shownCircles = Math.max(1, ctx.castable)
  const page = Math.min(circle, shownCircles)
  const room = bookRoom(page, ctx, state.later)
  const inked = Object.keys(state.book)
    .flatMap((id) => (byID.get(id)?.level === page ? [byID.get(id)!] : []))
    .sort((a, b) => a.name.localeCompare(b.name))
  const blanks = room === null ? 4 : Math.max(0, Math.min(room, 22) - inked.length)
  type Line = { spell: BookSpell | null; key: string }
  const lines: Line[] = [...inked.map((s) => ({ spell: s, key: s.id })), ...Array.from({ length: Math.min(blanks, 22 - inked.length) }, (_, i) => ({ spell: null, key: `blank${i}` }))]
  const tagLabel = { auto: 'training', gift: 'school gift', given: 'mastered', roll: 'learned' } as const
  const failedHere = Object.keys(state.failed).filter((id) => byID.get(id)?.level === page).length

  // Biblioteca do círculo.
  const q = query.trim().toLowerCase()
  const rank = (s: BookSpell) => (state.book[s.id] ? 0 : spellVerdict(s, ctx, state, byID).ok ? 1 : state.failed[s.id] ? 3 : 2)
  const shelf = spells
    .filter((s) => s.level === page && (!filter || s.schools.includes(filter)) && (!q || s.name.toLowerCase().includes(q)))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))

  const chosen = selected ? byID.get(selected) : undefined
  const verdict = chosen ? spellVerdict(chosen, ctx, state, byID) : null
  const extraUsed = Math.max(0, total - (ctx.first ?? 0))
  const lineButton = (l: Line) => {
    if (!l.spell) {
      return (
        <span key={l.key} className="sp-line sp-line-blank">
          {room === null ? '…' : 'a blank line'}
        </span>
      )
    }
    const s = l.spell
    return (
      <button key={l.key} type="button" className={selected === s.id ? 'sp-line sp-line-ink sp-line-sel' : 'sp-line sp-line-ink'} style={{ '--c': artOf(s).color } as CSSProperties} onClick={() => setSelected(s.id)}>
        <SchoolIcon path={artOf(s).icon} />
        <span className="sp-line-name">{s.name}</span>
        <em>{tagLabel[state.book[s.id]]}</em>
      </button>
    )
  }

  return (
    <div className="sp-layout">
      <div className="sp-col">
        {mage && (
          <div>
            <p className="sp-label">Your school</p>
            <div className="sp-seals" role="group" aria-label="School of magic">
              {[null, ...wizardSchools.map((w) => w.name)].map((k) => {
                const art = k ? schoolArt[k] : { short: 'Generalist', color: '#efe4d3', icon: bookIcon }
                const on = school === k
                const opposed = !!school && !!k && (wizardSchools.find((w) => w.name === school)?.opposition ?? []).includes(k)
                return (
                  <button
                    key={k ?? 'generalist'}
                    type="button"
                    className={['sp-seal', on ? 'sp-seal-on' : '', opposed ? 'sp-seal-opp' : ''].join(' ')}
                    style={{ '--c': art.color } as CSSProperties}
                    aria-pressed={on}
                    onClick={() => setSchool(k)}
                  >
                    <span className="sp-seal-orb">
                      <SchoolIcon path={art.icon} />
                    </span>
                    {k ? wizardSchools.find((w) => w.name === k)!.specialist : 'Generalist'}
                    <small>{k ? `${art.short} · ${specialistNeeds[k]}` : 'every school'}</small>
                  </button>
                )
              })}
            </div>
            <p className="sp-note">
              {school
                ? `${wizardSchools.find((w) => w.name === school)!.specialist}: +15% to learn ${schoolArt[school].short} spells, −15% to the rest, one extra spell per circle each day. Never: ${(wizardSchools.find((w) => w.name === school)?.opposition ?? []).map((o) => schoolArt[o].short).join(', ')}.`
                : 'A generalist learns from every school at the same chance. A specialist trades breadth for depth.'}
            </p>
          </div>
        )}

        <div>
          <p className="sp-label">
            {mage ? 'How your master filled the book (DMG, chapter 7)' : gypsy ? 'How the elders taught you (DMG, chapter 7)' : 'Spells of the road (PHB, chapter 3)'}
          </p>
          <div className="sp-paths">
            {book3 ? (
              methods.map((m) => (
                <button key={m.id} type="button" className={state.method === m.id ? 'sp-path sp-path-on' : 'sp-path'} aria-pressed={state.method === m.id} onClick={() => setMethod(m.id)}>
                  {state.method === m.id && <span className="sp-path-mark">Chosen</span>}
                  <b>{m.name}</b>
                  <i>{m.source}</i>
                  <span>{m.text(!!school, training)}</span>
                </button>
              ))
            ) : (
              <div className="sp-path sp-path-on">
                <b>One to four spells</b>
                <i>Bard, from 2nd level</i>
                <span>
                  {level < 2
                    ? 'A bard casts no spells at 1st level. At 2nd level the bard starts with 1d4 spells, each needing your chance to learn.'
                    : 'Roll 1d4 for the spells you picked up; each one still needs your chance to learn. No Read Magic is promised.'}
                </span>
              </div>
            )}
          </div>
          {ctx.extra > 0 && (
            <div className="sp-later">
              <span>Since level {book3 ? 1 : 2}:</span>
              {(
                [
                  ['perLevel', `One spell per level gained (${ctx.extra})`],
                  ['intMax', `Up to your Intelligence in every circle (${learning.perCircle ?? 'all'})`],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" className={state.later === id ? 'mm-chip mm-chip-on' : 'mm-chip'} aria-pressed={state.later === id} onClick={() => setLater(id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sp-work">
          <div className="sp-book-wrap">
            <div className="sp-ribbons" role="tablist" aria-label="Circles">
              {Array.from({ length: shownCircles }, (_, i) => i + 1).map((k) => {
                const r = bookRoom(k, ctx, state.later)
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={page === k}
                    className={page === k ? 'sp-ribbon sp-ribbon-on' : 'sp-ribbon'}
                    onClick={() => {
                      setCircle(k)
                      setSelected(null)
                    }}
                  >
                    {circleName(k)}
                    <small>
                      {counts[k] ?? 0}/{r === null ? '?' : r === Infinity ? '∞' : r}
                    </small>
                  </button>
                )
              })}
            </div>
            <div className="sp-book">
              <div className="sp-page sp-page-l">
                <h4>
                  Circle {circleName(page)}
                  <span>{room === null ? 'size not rolled yet' : `${inked.length} of ${room === Infinity ? '∞' : room} written`}</span>
                </h4>
                {lines.slice(0, 11).map(lineButton)}
              </div>
              <div className="sp-page sp-page-r">
                <h4>&nbsp;</h4>
                {lines.slice(11, 22).map(lineButton)}
                <p className="sp-page-foot">
                  {failedHere ? `${failedHere} spell${failedHere > 1 ? 's' : ''} beyond you for now` : `${total} spell${total === 1 ? '' : 's'} in the book`}
                </p>
              </div>

              {trayOpen && (
                <div className="sp-tray" role="dialog" aria-label="Dice">
                  <b>
                    {rolling?.kind === 'study'
                      ? `Studying ${rolling.spell.name}`
                      : !book3 && level < 2
                        ? 'No spells yet'
                        : gypsy
                          ? 'How much did the elders teach you?'
                          : mage
                            ? 'How thick is your book?'
                            : 'What did you pick up?'}
                  </b>
                  {dice.length > 0 && <ForgeDice dice={dice} rollKey={rolling ? rollKey : 0} onSettled={settled} />}
                  {rolling?.kind === 'study' && rolling.done && (
                    <span className={rolling.ok ? 'sp-verdict sp-verdict-ok' : 'sp-verdict sp-verdict-no'}>{rolling.ok ? 'The formula is yours!' : 'It slips away…'}</span>
                  )}
                  <p>
                    {rolling?.kind === 'study'
                      ? rolling.done
                        ? `Rolled ${rolling.roll} against ${rolling.chance}%. ${rolling.ok ? `${rolling.spell.name} is written into your book.` : `You can’t learn ${rolling.spell.name} until you gain a level.`}`
                        : `Chance to learn: ${rolling.chance}%`
                      : rolling?.kind === 'book'
                        ? 'The dice are rolling…'
                        : !book3 && level < 2
                          ? 'Bards cast their first spell at 2nd level. Come back when you level up — or start higher on the Starting point step.'
                          : book3
                            ? `${gypsy ? 'The elders taught you 3d4 divinations' : 'Your master taught you 3d4 spells'} of the first circle (at most ${learning.perCircle ?? 'all'}, for your Intelligence). ${listed(training)} ${training.length > 1 ? 'are two' : 'is one'} of them.`
                            : `Roll 1d4: that many first-circle spells crossed your path (at most ${learning.perCircle ?? 'all'}).`}
                  </p>
                  {!rolling && ctx.first === null && (
                    <button type="button" className="sp-roll" onClick={rollBook}>
                      {book3 ? 'Roll 3d4' : 'Roll 1d4'}
                    </button>
                  )}
                  {rolling?.kind === 'study' && rolling.done && (
                    <button
                      type="button"
                      className="sp-tray-close"
                      onClick={() => {
                        setRolling(null)
                        if (!rolling.ok) setSelected(rolling.spell.id)
                      }}
                    >
                      Back to the book
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sp-lib">
            <p className="sp-label">
              {gypsy ? 'The signs' : 'The library'} · Circle {circleName(page)}
            </p>
            <div className="sp-lib-bar" role="group" aria-label="Filter by school">
              {!gypsy && (
                <button type="button" className={!filter ? 'sp-sch sp-sch-all sp-sch-on' : 'sp-sch sp-sch-all'} aria-pressed={!filter} onClick={() => setFilter(null)}>
                  All
                </button>
              )}
              {/* Gypsy: só adivinhação, nada a filtrar por escola. */}
              {(gypsy ? [] : wizardSchools).map((w) => {
                const opp = !!school && opposedSpell(school, { level: 9, schools: [w.name] })
                return (
                  <button
                    key={w.name}
                    type="button"
                    className={filter === w.name ? 'sp-sch sp-sch-on' : 'sp-sch'}
                    style={{ '--c': schoolArt[w.name].color, opacity: opp ? 0.4 : undefined } as CSSProperties}
                    aria-pressed={filter === w.name}
                    aria-label={`${schoolArt[w.name].short}${opp ? ' (opposed)' : ''}`}
                    title={schoolArt[w.name].short}
                    onClick={() => setFilter(filter === w.name ? null : w.name)}
                  >
                    <SchoolIcon path={schoolArt[w.name].icon} />
                  </button>
                )
              })}
              <input className="sp-search" type="search" placeholder="Search the shelves…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search spells" />
            </div>
            <div className="sp-shelf">
              {shelf.slice(0, 160).map((s) => {
                const tag = state.book[s.id]
                const sealed = opposedSpell(school, s)
                const failed = state.failed[s.id]
                const v = spellVerdict(s, ctx, state, byID)
                const badge = tag ? 'In book' : sealed ? 'Sealed' : failed ? `Failed ${failed}` : freeStudy(s, ctx, state) ? 'Free' : `${learnChance(s, ctx)}%`
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={['sp-scroll', tag ? 'sp-scroll-ink' : sealed ? 'sp-scroll-sealed' : failed ? 'sp-scroll-fail' : '', selected === s.id ? 'sp-scroll-sel' : ''].join(' ')}
                    style={{ '--c': artOf(s).color } as CSSProperties}
                    onClick={() => {
                      if (selected === s.id && v.ok && !v.erase) study(s)
                      else setSelected(s.id)
                    }}
                  >
                    <span className="sp-scroll-top">
                      <SchoolIcon path={artOf(s).icon} />
                      {s.name}
                    </span>
                    <span className="sp-scroll-foot">
                      {artOf(s).short}
                      <span className={tag ? 'sp-badge sp-badge-ink' : sealed || failed ? 'sp-badge sp-badge-fail' : 'sp-badge sp-badge-pct'}>{badge}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="sp-note">{shelf.length > 160 ? `Showing 160 of ${shelf.length} — search to narrow the shelves.` : `${shelf.length} spells on this shelf. Tap one to read it; tap it again to study it.`}</p>
          </div>
        </div>
      </div>

      <aside className="sp-panel" aria-label="Your spellbook">
        <div className="mm-card">
          <div className="mm-who">
            <span className="mm-who-portrait">
              <ForgeImage images={portrait} alt="" compact />
            </span>
            <div>
              <b>
                {mage ? (school ? wizardSchools.find((w) => w.name === school)!.specialist : 'Mage') : cls}, level {level}
              </b>
              <span>Intelligence {intelligence} (PHB Table 4)</span>
            </div>
          </div>
          <div className="sp-stats">
            <div>
              <b>{learning.chance}%</b>
              <span>to learn</span>
            </div>
            <div>
              <b>{learning.perCircle ?? 'All'}</b>
              <span>per circle</span>
            </div>
            <div>
              <b>{circleName(ctx.castable || 1)}</b>
              <span>top circle now</span>
            </div>
          </div>
          <div className="slot-pools mm-pools">
            {state.later === 'intMax' && ctx.extra > 0 ? (
              Array.from({ length: ctx.castable }, (_, i) => i + 1).map((k) => <ForgeSlotSockets key={k} label={`Circle ${circleName(k)}`} used={counts[k] ?? 0} total={Math.min(learning.perCircle ?? 99, 18)} />)
            ) : (
              <>
                {ctx.first === null ? (
                  <p className="sp-note">{book3 ? 'First book: roll 3d4 on the book to see how many spells it holds.' : 'Roll 1d4 on the book to see how many spells you picked up.'}</p>
                ) : (
                  <ForgeSlotSockets label={mage ? 'First book' : gypsy ? 'Known spells' : 'Spells'} used={Math.min(total, ctx.first)} total={Math.min(ctx.first, learning.perCircle ?? 20, 20)} />
                )}
                {ctx.extra > 0 && <ForgeSlotSockets label="Since then" used={extraUsed} total={ctx.extra} />}
              </>
            )}
          </div>
        </div>

        {chosen ? (
          <div className="mm-card sp-detail" style={{ '--c': artOf(chosen).color } as CSSProperties}>
            <p className="mm-card-label">Circle {circleName(chosen.level)}</p>
            <h3>{chosen.name}</h3>
            <div className="sp-tags">
              {chosen.schools.map((k) => (
                <span key={k} className="sp-tag" style={{ '--c': (schoolArt[k] ?? schoolArt.All).color } as CSSProperties}>
                  <SchoolIcon path={(schoolArt[k] ?? schoolArt.All).icon} />
                  {(schoolArt[k] ?? schoolArt.All).short}
                </span>
              ))}
            </div>
            {detail && detail.id === chosen.id && (
              <>
                <dl className="sp-facts">
                  <div>
                    <dt>Casting time</dt>
                    <dd>{detail.castingTime || '—'}</dd>
                  </div>
                  <div>
                    <dt>Range</dt>
                    <dd>{detail.range || '—'}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{detail.duration || '—'}</dd>
                  </div>
                  <div>
                    <dt>Chance to learn</dt>
                    <dd>{freeStudy(chosen, ctx, state) ? 'No roll' : `${learnChance(chosen, ctx)}%`}</dd>
                  </div>
                </dl>
                <p className="sp-summary">{detail.summary}</p>
              </>
            )}
            <button type="button" className="sp-read" onClick={() => setReading(entryByID.get(chosen.id) ?? null)}>
              Read the whole spell
            </button>
            {verdict && (
              <>
                <button type="button" className={state.book[chosen.id] ? 'sp-act sp-act-erase' : 'sp-act'} disabled={!verdict.ok || !!rolling} onClick={() => study(chosen)}>
                  {state.book[chosen.id]
                    ? state.book[chosen.id] === 'auto'
                      ? 'Part of your training'
                      : 'Erase from the book'
                    : !ctx.rolls
                      ? 'Inscribe it'
                      : freeStudy(chosen, ctx, state)
                        ? 'Take it as your school’s gift'
                        : `Study it — ${learnChance(chosen, ctx)}%`}
                </button>
                {!verdict.ok && verdict.reason && <p className="sp-why">{verdict.reason}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="mm-card">
            <p className="mm-card-label">Where to begin</p>
            <p className="sp-hint">
              {ctx.first === null
                ? mage
                  ? 'Pick your school, then roll 3d4 on the book to learn how many spells your master gave you.'
                  : gypsy
                    ? 'Roll 3d4 on the book to learn how many divinations the elders taught you.'
                    : 'Roll 1d4 on the book, then study the library.'
                : 'Browse the library. Each scroll shows your chance to learn it; tap twice to study. A failed roll locks the spell until you gain a level.'}
            </p>
          </div>
        )}

        <div className="mm-card">
          <p className="mm-card-label">Laws of the art</p>
          <ul className="sp-rules">
            {(gypsy
              ? [
                  'Only lesser and greater divinations — no other school answers you.',
                  'No spellbook: you need not choose your spells ahead of time, but every casting takes three turns.',
                  'Your Intelligence sets your chance to learn and the most spells per circle.',
                  'A spell you fail to learn stays beyond you until you gain a level.',
                ]
              : [
                  'Your Intelligence sets your chance to learn, the most spells per circle and the highest circle you can ever understand.',
                  'A spell you fail to learn stays beyond you until you gain a level.',
                  'Specialists add 15% for their own school and lose 15% for the others; their opposed schools are sealed for good.',
                  'Lesser divinations — Read Magic, Detect Magic and the like — are open to every wizard.',
                ]
            ).map((law) => (
              <li key={law}>{law}</li>
            ))}
          </ul>
        </div>
      </aside>
      {reading && <SpellDetail entry={reading} onClose={() => setReading(null)} />}
    </div>
  )
}

function SphereSky({
  draft,
  mutate,
  settings,
  index,
  cls,
  portrait,
  sphereFor,
  onSphereFor,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  index: SpellIndexEntry[]
  cls: DivineCaster
  portrait: string[]
  sphereFor: string | null
  onSphereFor: (key: string) => void
}) {
  const level = levelOf(draft, cls) ?? draft.level
  // Anchorite: esferas pelo alinhamento (Domains of Dread, Table 92).
  const anchorite = cls === 'Anchorite'
  const alignment = anchorite && anchoriteAlignments.includes(draft.alignment) ? draft.alignment : null
  // Paladino e ranger: esferas fixas e magias só a partir de um nível (PHB Tabelas 17 e 18).
  const warrior = isWarriorCaster(cls) ? cls : null
  const start = warrior ? warriorCasters[warrior].start : 1
  const castable = (warrior ? warriorSpellProgression(warrior, level) : priestSpellProgression(level, draft.abilities.wisdom)).filter((n) => n > 0).length
  const access = useMemo(() => draft.sphereAccess ?? defaultSphereAccess(cls, draft.alignment), [draft.sphereAccess, cls, draft.alignment])
  const [custom, setCustom] = useState(false)
  const [tome, setTome] = useState(() => anchorite || Object.keys(access).some((k) => tomeSpheres.includes(k)))
  const [sphere, setSphere] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(820)

  // A ficha nasce com as esferas da classe, já gravadas; trocar de classe (ou o
  // alinhamento do anchorite) refaz. Ajuste à mão fica enquanto a chave não muda.
  const key = anchorite ? `Anchorite:${alignment ?? ''}` : cls
  useEffect(() => {
    if (draft.sphereAccess && sphereFor === key) return
    mutate((c) => void (c.sphereAccess = defaultSphereAccess(cls, c.alignment)))
    onSphereFor(key)
  }, [draft.sphereAccess, sphereFor, key, cls, mutate, onSphereFor])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const spells = useMemo(() => index.filter((e) => e.level >= 1 && e.level <= 7 && (isGenericSetting(e.setting) || allowedBySettings(e.setting, settings))), [index, settings])
  const list = tome ? [...coreSpheres, ...tomeSpheres] : coreSpheres
  const granted = new Set(spells.filter((s) => sphereGrants(s, access, castable)).map((s) => s.name))
  const majors = Object.values(access).filter((a) => a === 'major').length
  const minors = Object.values(access).filter((a) => a === 'minor').length
  const S = 820
  const C = S / 2
  const R = 300
  const scale = Math.min(1, (width - 8) / S)

  const tap = (k: string) => {
    setSphere(k)
    if (custom) mutate((c) => void (c.sphereAccess = cycleSphere(c.sphereAccess ?? defaultSphereAccess(cls, c.alignment), k)))
  }

  const levels = sphere
    ? Array.from({ length: 7 }, (_, i) => i + 1).flatMap((l) => {
        const names = spells.filter((s) => s.level === l && s.spheres.some((x) => sphereOf(x) === sphere)).map((s) => s.name)
        if (!names.length) return []
        const a = access[sphere]
        const open = !!a && l <= castable && (a === 'major' || l <= 3)
        const note = open ? '' : warrior && l > warriorCasters[warrior].topSpellLevel ? ` · beyond a ${warrior.toLowerCase()}` : a === 'minor' && l > 3 ? ' · beyond minor access' : !a ? '' : ' · not yet'
        return [{ l, names, open, note }]
      })
    : []

  return (
    <div className="sp-layout">
      <div className="sp-col">
        {!warrior && !anchorite && (
          <div className="sp-later">
            <button type="button" className={custom ? 'mm-chip mm-chip-on' : 'mm-chip'} aria-pressed={custom} onClick={() => setCustom(!custom)}>
              Specialty priest — set my own spheres
            </button>
            <button type="button" className={tome ? 'mm-chip mm-chip-on' : 'mm-chip'} aria-pressed={tome} onClick={() => setTome(!tome)}>
              Tome of Magic spheres
            </button>
            {custom && (
              <button type="button" className="mm-chip" onClick={() => mutate((c) => void (c.sphereAccess = defaultSphereAccess(cls, c.alignment)))}>
                Back to the {cls.toLowerCase()}’s spheres
              </button>
            )}
          </div>
        )}
        {anchorite && !alignment && (
          <p className="sp-provisional">
            Ezra’s anchorites are lawful good, lawful neutral or true neutral, and the alignment decides which spheres they reach (Domains of Dread,
            Table 92). {draft.alignment ? `${draft.alignment} isn’t one of them` : 'You haven’t chosen one yet'} — go back to Weigh Your Soul (step 4)
            and choose to light your spheres.
          </p>
        )}
        <div className="sp-sky" ref={box} style={{ height: S * scale }}>
          <div className="sp-sky-stage" style={{ width: S, height: S, transform: `scale(${scale})` }}>
            <div className="mm-ring" style={{ left: C - R, top: C - R, width: 2 * R, height: 2 * R }} />
            {list.map((k, i) => {
              const a = access[k]
              const deg = -90 + (i * 360) / list.length
              return <div key={`ray-${k}`} className={a ? `sp-ray sp-ray-${a}` : 'sp-ray'} style={{ left: C, top: C, width: R, transform: `rotate(${deg}deg)` }} />
            })}
            <div className="sp-soul" style={{ left: C - 84, top: C - 84 }}>
              <ForgeImage images={portrait} alt={`Your ${cls.toLowerCase()}`} compact />
            </div>
            {list.map((k, i) => {
              const a = access[k]
              const deg = -90 + (i * 360) / list.length
              const x = C + R * Math.cos(rad(deg))
              const y = C + R * Math.sin(rad(deg))
              const count = a ? spells.filter((s) => s.spheres.some((v) => sphereOf(v) === k) && sphereGrants({ level: s.level, spheres: [k] }, access, castable)).length : 0
              return (
                <div key={k}>
                  <button
                    type="button"
                    className={['sp-orb', a ? `sp-orb-${a}` : '', sphere === k ? 'sp-orb-sel' : ''].join(' ')}
                    style={{ left: x - 42, top: y - 42 }}
                    aria-label={`${k}: ${a ?? 'no'} access`}
                    onClick={() => tap(k)}
                  >
                    {k}
                  </button>
                  {a && (
                    <span className="sp-orb-tag" style={{ left: x - 60, top: y + 46 }}>
                      {castable === 0 ? `at ${start}th level` : `${count} spells`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="mm-legend">
          <span>
            <i className="sp-lg sp-lg-major" />
            Major access — every level
          </span>
          <span>
            <i className="sp-lg sp-lg-minor" />
            Minor access — up to 3rd level
          </span>
          <span>
            <i className="sp-lg" />
            No access
          </span>
        </div>
      </div>

      <aside className="sp-panel" aria-label="Your spheres">
        <div className="mm-card">
          <div className="mm-who">
            <span className="mm-who-portrait">
              <ForgeImage images={portrait} alt="" compact />
            </span>
            <div>
              <b>
                {cls}, level {level}
              </b>
              <span>
                {warrior
                  ? castable === 0
                    ? `Spells begin at ${start}th level (${warriorCasters[warrior].table})`
                    : `Casting level ${warriorCastingLevel(warrior, level)}, spells up to level ${castable} (${warriorCasters[warrior].table})`
                  : `Prays for spells up to level ${castable} (PHB Table 24)`}
              </span>
            </div>
          </div>
          <div className="sp-stats">
            <div>
              <b>{majors}</b>
              <span>major</span>
            </div>
            <div>
              <b>{minors}</b>
              <span>minor</span>
            </div>
            <div>
              <b>{granted.size}</b>
              <span>spells now</span>
            </div>
          </div>
        </div>

        {sphere ? (
          <div className="mm-card">
            <p className="mm-card-label">{access[sphere] ? `${access[sphere]} access` : 'no access'}</p>
            <h3 className="sp-sphere-name">{sphere}</h3>
            <p className="sp-hint">
              {custom
                ? 'Tap the orb again to change its access: none → minor → major.'
                : access[sphere]
                  ? anchorite
                    ? `Granted to a ${alignment?.toLowerCase()} anchorite (Domains of Dread, Table 92).`
                    : `Granted by your calling as a ${cls.toLowerCase()}.`
                  : `Not granted to ${anchorite ? (alignment ? `a ${alignment.toLowerCase()} anchorite` : 'an anchorite without an alignment') : `a ${cls.toLowerCase()}`}.${warrior || anchorite ? '' : ' A specialty priest may differ.'}`}
            </p>
            <div className="sp-levels">
              {levels.map((l) => (
                <div key={l.l}>
                  <h5>
                    Level {l.l}
                    {l.note}
                  </h5>
                  <p className={l.open ? '' : 'sp-dim'}>{l.names.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mm-card">
            <p className="mm-card-label">Your calling</p>
            <p className="sp-hint">
              {warrior
                ? `A ${warrior.toLowerCase()} reaches ${warriorText[warrior].spheres}. Tap one to see its spells.${castable === 0 ? ` Your first spell comes at ${start}th level.` : ''}`
                : anchorite
                  ? alignment
                    ? `The spheres of a ${alignment.toLowerCase()} anchorite of Ezra (Table 92). Tap one to see the spells it grants.`
                    : 'Your alignment decides your spheres — choose it on the Weigh Your Soul step.'
                  : `These are the spheres every ${cls.toLowerCase()} reaches (PHB chapter 3). Tap one to see the spells it grants. A specialty priest of a particular god? Turn on “set my own spheres” and tap the orbs.`}
            </p>
          </div>
        )}

        <div className="mm-card">
          <p className="mm-card-label">Laws of the faith</p>
          <ul className="sp-rules">
            {(warrior
              ? warriorText[warrior].laws
              : [
                  'Your god grants every spell in your spheres — there is nothing to study or roll.',
                  'Major access: all levels. Minor access: levels 1 to 3 only.',
                  'Your level sets the highest spell level you can pray for; Wisdom adds bonus spells.',
                  'All is the sphere of every priest: its spells are always yours.',
                ]
            ).map((law) => (
              <li key={law}>{law}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
