// Etapa de magias do The Forge (protótipo "Step 9 · Spells" no canvas). Só
// funções puras.
//
// Mago e bardo: o grimório inicial. O DMG (cap. 7, "Initial Wizard Spells")
// dá três jeitos, e o jogador escolhe (decisão do usuário, 2026-11-02):
//   - trial (Player/DM Collaboration): 3d4 magias do 1º círculo, no máximo o
//     da Inteligência; Read Magic e Detect Magic vêm de graça e o
//     especialista ganha uma da sua escola; o resto rola a chance de aprender.
//   - gift (DM Choice): Read Magic, Detect Magic e mais 4, sem rolar.
//   - library (Player Choice): escolhe e rola uma a uma até o máximo da Int.
// O bardo (PHB cap. 3) começa no 2º nível com 1d4 magias, cada uma rolada.
// Acima do nível inicial, o jogador escolhe: uma magia por nível ganho
// (perLevel) ou até o máximo da Inteligência em todo círculo (intMax).
// Magia que falha na rolagem só pode ser tentada de novo no próximo nível.
//
// Sacerdote: sem grimório; as esferas da classe (PHB cap. 3), ajustáveis para
// sacerdote especialista.

import type { SphereAccessLevel, WizardSpellbookEntry } from '../types/library.ts'
import { hasClass } from './multiclass.ts'
import { isOpposedBySchool } from './spellSheets.ts'

export type DivineCaster = 'Cleric' | 'Druid' | 'Anchorite' | 'Paladin' | 'Ranger'

/** As classes da etapa: mago ou bardo (grimório) e clérigo, druida, anchorite, paladino ou ranger (esferas); multiclasse conta. */
export function spellCasting(c: Parameters<typeof hasClass>[0]): { arcane: 'Mage' | 'Bard' | null; divine: DivineCaster | null } {
  return {
    arcane: hasClass(c, 'Mage') ? 'Mage' : hasClass(c, 'Bard') ? 'Bard' : null,
    divine: hasClass(c, 'Cleric') ? 'Cleric' : hasClass(c, 'Druid') ? 'Druid' : hasClass(c, 'Anchorite') ? 'Anchorite' : hasClass(c, 'Paladin') ? 'Paladin' : hasClass(c, 'Ranger') ? 'Ranger' : null,
  }
}

export type BookMethod = 'trial' | 'gift' | 'library'
export type LaterRule = 'perLevel' | 'intMax'
/** Como a magia entrou no livro: treino (Read/Detect Magic), presente da escola, dada pelo mestre, ou rolada. */
export type BookTag = 'auto' | 'gift' | 'given' | 'roll'

export interface BookSpell {
  id: string
  name: string
  level: number
  schools: string[]
}

export interface BookState {
  method: BookMethod
  later: LaterRule
  /** 3d4 (mago, trial) ou 1d4 (bardo); null = ainda não rolou. */
  dice: number[] | null
  book: Record<string, BookTag>
  /** Magias que falharam, com o número rolado. */
  failed: Record<string, number>
}

export const emptyBook = (method: BookMethod = 'trial', later: LaterRule = 'perLevel'): BookState => ({ method, later, dice: null, book: {}, failed: {} })

/** As duas magias que todo mago aprende como aprendiz (DMG). */
export const trainingSpells = ['Read Magic', 'Detect Magic']

export interface BookContext {
  mage: boolean
  level: number
  /** Círculos que conjura agora (a tabela de magias, já limitada pela Inteligência). */
  castable: number
  /** Chance de aprender, Tabela 4. */
  chance: number
  /** Máximo por círculo, Tabela 4 (Infinity = "All"). */
  perCircle: number
  school: string | null
  /** Tamanho do livro inicial (1º círculo); null = falta rolar. */
  first: number | null
  /** Magias ganhas depois do nível inicial (1º do mago, 2º do bardo). */
  extra: number
  /** false no "gift": nada se rola. */
  rolls: boolean
}

export function bookContext(
  input: { mage: boolean; level: number; castable: number; chance: number; perCircle: number | null; school: string | null },
  state: Pick<BookState, 'method' | 'dice'>,
): BookContext {
  const perCircle = input.perCircle ?? Infinity
  const school = input.mage ? input.school : null
  let first: number | null
  if (!input.mage) first = input.level < 2 ? 0 : state.dice ? Math.min(state.dice[0], perCircle) : null
  else if (state.method === 'gift') first = 6
  else if (state.method === 'library') first = perCircle
  else first = state.dice ? Math.min(state.dice.reduce((a, b) => a + b, 0), perCircle) : null
  return {
    mage: input.mage,
    level: input.level,
    castable: input.castable,
    chance: input.chance,
    perCircle,
    school,
    first,
    extra: Math.max(0, input.level - (input.mage ? 1 : 2)),
    rolls: !(input.mage && state.method === 'gift'),
  }
}

/** Escola oposta à do especialista. Adivinhação menor (até o 4º círculo) é de todos (PHB cap. 3). */
export function opposedSpell(school: string | null, spell: Pick<BookSpell, 'level' | 'schools'>): boolean {
  if (!school) return false
  if (spell.schools.includes('Divination') && spell.level <= 4 && school !== 'Conjuration/Summoning') return false
  return isOpposedBySchool(school, spell.schools)
}

/** Chance de aprender: a da Tabela 4; o especialista ganha 15% na escola dele e perde 15% nas outras (PHB). */
export function learnChance(spell: Pick<BookSpell, 'schools'>, ctx: Pick<BookContext, 'chance' | 'school'>): number {
  if (!ctx.school || spell.schools.some((s) => s === 'All' || s === 'All Schools')) return ctx.chance
  return Math.max(5, Math.min(99, ctx.chance + (spell.schools.includes(ctx.school) ? 15 : -15)))
}

/** Quantas magias de cada círculo estão no livro. */
export function circleCounts(state: Pick<BookState, 'book'>, byID: Map<string, BookSpell>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const id of Object.keys(state.book)) {
    const level = byID.get(id)?.level ?? 1
    out[level] = (out[level] ?? 0) + 1
  }
  return out
}

/** Quantas magias cabem neste círculo (null = depende da rolagem). */
export function bookRoom(circle: number, ctx: BookContext, later: LaterRule): number | null {
  if (circle > ctx.castable) return 0
  if (later === 'intMax' && ctx.extra > 0) return ctx.perCircle
  if (circle === 1) return ctx.first === null ? null : Math.min(ctx.perCircle, ctx.first + ctx.extra)
  return Math.min(ctx.perCircle, ctx.extra)
}

/** O especialista no "trial" ainda pode pegar a magia da escola de graça? */
export function schoolGiftOpen(ctx: BookContext, state: Pick<BookState, 'method' | 'book'>): boolean {
  return ctx.mage && !!ctx.school && state.method === 'trial' && !Object.values(state.book).includes('gift')
}

/** Entra sem rolar: no "gift", ou a magia de escola do especialista. */
export function freeStudy(spell: BookSpell, ctx: BookContext, state: Pick<BookState, 'method' | 'book'>): boolean {
  return !ctx.rolls || (schoolGiftOpen(ctx, state) && spell.level === 1 && !!ctx.school && spell.schools.includes(ctx.school))
}

export interface SpellVerdict {
  ok: boolean
  /** A magia já está no livro: a ação é apagar. */
  erase?: boolean
  reason?: string
}

const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
export const circleName = (n: number) => roman[n] ?? String(n)

/** Pode estudar (ou apagar) esta magia agora? */
export function spellVerdict(spell: BookSpell, ctx: BookContext, state: BookState, byID: Map<string, BookSpell>): SpellVerdict {
  const tag = state.book[spell.id]
  if (tag) {
    if (tag === 'auto') return { ok: false, erase: true, reason: 'Part of every wizard’s training — it stays in the book.' }
    return { ok: true, erase: true }
  }
  if (opposedSpell(ctx.school, spell)) return { ok: false, reason: 'That school opposes yours — a specialist can never learn it.' }
  if (spell.level > ctx.castable) return { ok: false, reason: `At level ${ctx.level} you cast up to circle ${circleName(ctx.castable)}.` }
  if (state.failed[spell.id]) return { ok: false, reason: `You failed to learn it (rolled ${state.failed[spell.id]}). You may try again when you gain a level.` }
  if (ctx.first === null) return { ok: false, reason: ctx.mage ? 'Roll 3d4 first — the book shows how.' : 'Roll 1d4 first — the book shows how.' }
  const counts = circleCounts(state, byID)
  const room = bookRoom(spell.level, ctx, state.later) ?? 0
  if ((counts[spell.level] ?? 0) >= room) {
    return { ok: false, reason: room === 0 ? `No spell of circle ${circleName(spell.level)} fits your book yet.` : `Circle ${circleName(spell.level)} is full (${room}).` }
  }
  if (state.later === 'perLevel' || ctx.extra === 0) {
    const total = Object.keys(state.book).length
    const higher = total - (counts[1] ?? 0)
    if (spell.level > 1 && higher >= ctx.extra) return { ok: false, reason: `You have used all ${ctx.extra} spell${ctx.extra === 1 ? '' : 's'} gained since your first.` }
    if (total >= ctx.first + ctx.extra) return { ok: false, reason: `Your book holds ${ctx.first + ctx.extra} spells — all are written.` }
  }
  return { ok: true }
}

/** Grava o resultado de um estudo (ou apaga a magia). `roll` é o d100; ignorado quando a magia entra de graça. */
export function studySpell(state: BookState, spell: BookSpell, ctx: BookContext, roll: number | null): { ok: boolean; state: BookState } {
  const next: BookState = { ...state, book: { ...state.book }, failed: { ...state.failed } }
  if (next.book[spell.id]) {
    delete next.book[spell.id]
    return { ok: true, state: next }
  }
  if (freeStudy(spell, ctx, state)) {
    next.book[spell.id] = ctx.rolls ? 'gift' : 'given'
    return { ok: true, state: next }
  }
  const ok = roll !== null && roll <= learnChance(spell, ctx)
  if (ok) next.book[spell.id] = 'roll'
  else next.failed[spell.id] = roll ?? 100
  return { ok, state: next }
}

/** Troca o jeito de encher o livro: recomeça, com Read/Detect Magic de graça no trial e no gift. */
export function chooseMethod(method: BookMethod, later: LaterRule, mage: boolean, spells: BookSpell[]): BookState {
  const state = emptyBook(method, later)
  if (mage && method !== 'library') {
    for (const s of spells) if (s.level === 1 && trainingSpells.includes(s.name)) state.book[s.id] = 'auto'
  }
  return state
}

/** Escolhe a escola: saem as magias opostas e o presente da escola anterior. */
export function chooseSchool(state: BookState, school: string | null, byID: Map<string, BookSpell>): BookState {
  const book: Record<string, BookTag> = {}
  for (const [id, tag] of Object.entries(state.book)) {
    const spell = byID.get(id)
    if (tag === 'gift' || (spell && opposedSpell(school, spell))) continue
    book[id] = tag
  }
  return { ...state, book }
}

/** O livro como a ficha guarda (`wizardSpellbook`), mantendo os ids das entradas que já existiam. */
export function bookEntries(state: Pick<BookState, 'book'>, byID: Map<string, BookSpell>, current: WizardSpellbookEntry[], newID: () => string): WizardSpellbookEntry[] {
  return Object.keys(state.book)
    .flatMap((id) => {
      const spell = byID.get(id)
      if (!spell) return []
      const old = current.find((e) => e.matchedSpellID === id)
      return [{ id: old?.id ?? newID(), name: spell.name, matchedSpellID: id, level: null }]
    })
    .sort((a, b) => (byID.get(a.matchedSpellID ?? '')?.level ?? 0) - (byID.get(b.matchedSpellID ?? '')?.level ?? 0) || a.name.localeCompare(b.name))
}

// --- Esferas (sacerdote) -----------------------------------------------------------------

export const coreSpheres = ['All', 'Animal', 'Astral', 'Charm', 'Combat', 'Creation', 'Divination', 'Elemental', 'Guardian', 'Healing', 'Necromantic', 'Plant', 'Protection', 'Summoning', 'Sun', 'Weather']
export const tomeSpheres = ['Chaos', 'Law', 'Numbers', 'Thought', 'Time', 'Travelers', 'War', 'Wards']

const classSpheres: Record<Exclude<DivineCaster, 'Anchorite'>, { major: string[]; minor: string[] }> = {
  Cleric: { major: ['All', 'Astral', 'Charm', 'Combat', 'Creation', 'Divination', 'Guardian', 'Healing', 'Necromantic', 'Protection', 'Summoning', 'Sun'], minor: ['Elemental'] },
  Druid: { major: ['All', 'Animal', 'Elemental', 'Healing', 'Plant', 'Weather'], minor: ['Divination'] },
  // PHB cap. 3: "only spells of the combat, divination, healing, and protective spheres".
  Paladin: { major: ['Combat', 'Divination', 'Healing', 'Protection'], minor: [] },
  // PHB cap. 3: "only those of the plant or animal spheres".
  Ranger: { major: ['Animal', 'Plant'], minor: [] },
}

export type WarriorCaster = 'Paladin' | 'Ranger'

/**
 * Paladino e ranger rezam magias de sacerdote só a partir de um nível
 * (PHB Tabelas 17 e 18): as linhas começam nesse nível; depois da última, vale
 * a última.
 */
export const warriorCasters: Record<WarriorCaster, { start: number; topSpellLevel: number; table: string; rows: number[][] }> = {
  Paladin: {
    start: 9,
    topSpellLevel: 4,
    table: 'PHB Table 17',
    rows: [
      [1, 0, 0, 0], [2, 0, 0, 0], [2, 1, 0, 0], [2, 2, 0, 0], [2, 2, 1, 0], [3, 2, 1, 0],
      [3, 2, 1, 1], [3, 3, 2, 1], [3, 3, 3, 1], [3, 3, 3, 1], [3, 3, 3, 2], [3, 3, 3, 3],
    ],
  },
  Ranger: {
    start: 8,
    topSpellLevel: 3,
    table: 'PHB Table 18',
    rows: [[1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 2, 1], [3, 2, 1], [3, 2, 2], [3, 3, 2], [3, 3, 3]],
  },
}

export const isWarriorCaster = (cls: string): cls is WarriorCaster => cls === 'Paladin' || cls === 'Ranger'

/** Magias por nível de magia do paladino ou do ranger (nada antes do nível inicial; sem bônus de Sabedoria). */
export function warriorSpellProgression(cls: WarriorCaster, level: number): number[] {
  const { start, rows } = warriorCasters[cls]
  if (level < start) return []
  return rows[Math.min(level - start, rows.length - 1)]
}

/** Nível de conjuração: o nível menos o anterior ao inicial (paladino − 8, ranger − 7), no máximo 9. */
export const warriorCastingLevel = (cls: WarriorCaster, level: number) => (level < warriorCasters[cls].start ? 0 : Math.min(9, level - warriorCasters[cls].start + 1))

/**
 * Domains of Dread, Table 92 (passada pelo usuário em 2026-11-02): as esferas
 * do Anchorite de Ezra por alinhamento. Wards, Law e Chaos são do Tome of
 * Magic. Esfera fora da lista: sem acesso.
 */
export const anchoriteSpheres: Record<string, Record<string, SphereAccessLevel>> = {
  'Lawful Good': { All: 'major', Charm: 'major', Divination: 'major', Guardian: 'minor', Healing: 'major', Protection: 'major', Wards: 'major', Sun: 'minor' },
  'Lawful Neutral': { All: 'major', Charm: 'major', Divination: 'major', Guardian: 'minor', Healing: 'major', Protection: 'major', Wards: 'minor', Law: 'major', Weather: 'minor' },
  'True Neutral': { All: 'major', Charm: 'major', Divination: 'major', Guardian: 'major', Healing: 'major', Protection: 'major', Wards: 'minor', Chaos: 'minor' },
}

/** Os alinhamentos do Anchorite (os da Table 92). */
export const anchoriteAlignments = Object.keys(anchoriteSpheres)

/**
 * As esferas da classe: Cleric, Druid, Paladin, Ranger (PHB cap. 3) ou
 * Anchorite (pelo alinhamento; sem um dos três da Table 92, nenhuma ainda).
 */
export function defaultSphereAccess(characterClass: DivineCaster, alignment?: string | null): Record<string, SphereAccessLevel> {
  if (characterClass === 'Anchorite') return { ...(anchoriteSpheres[alignment ?? ''] ?? {}) }
  const base = classSpheres[characterClass]
  return Object.fromEntries([...base.major.map((s) => [s, 'major'] as const), ...base.minor.map((s) => [s, 'minor'] as const)])
}

/** Sacerdote especialista: nenhum → minor → major → nenhum. */
export function cycleSphere(access: Record<string, SphereAccessLevel>, sphere: string): Record<string, SphereAccessLevel> {
  const next = { ...access }
  const now = access[sphere]
  if (!now) next[sphere] = 'minor'
  else if (now === 'minor') next[sphere] = 'major'
  else delete next[sphere]
  return next
}

/** A esfera da magia como o Forge conta ("Elemental Fire" → "Elemental"). */
export const sphereOf = (s: string) => (s.startsWith('Elemental') ? 'Elemental' : s)

/** Esta magia está ao alcance? Minor só até o 3º nível; e só os níveis que o sacerdote já reza. */
export function sphereGrants(spell: { level: number; spheres: string[] }, access: Record<string, SphereAccessLevel>, castable: number): boolean {
  if (spell.level < 1 || spell.level > castable) return false
  return spell.spheres.some((raw) => {
    const a = access[sphereOf(raw)]
    return a === 'major' || (a === 'minor' && spell.level <= 3)
  })
}
