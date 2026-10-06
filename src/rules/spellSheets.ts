// Regras da folha de magia, portadas do iPad (SpellSheetView.swift:
// SlotEditorSheet e CircleBlock; SpellDatabase.matches; e as funções de
// esfera e grimório do PlayerCharacter). Só funções puras.

import { normalize, similarity } from '../lib/search.ts'
import type { PlayerCharacter, SpellSheet } from '../types/library.ts'

type Sheet = Pick<SpellSheet, 'slotBoard'>

/** Uma magia como a lista do compêndio a conhece (índice). */
export interface SpellChoice {
  id: string
  name: string
  level: number
  spheres: string[]
}

/** CircleBlock.assign / SlotEditorSheet.assign: memorizar desmarca o slot como gasto (A10). */
export function assignSlot(sheet: Sheet, slotID: string, choice: { id: string | null; name: string }) {
  const slot = sheet.slotBoard.slots.find((s) => s.id === slotID)
  if (!slot) return
  slot.preparedSpellID = choice.id
  slot.preparedSpellName = choice.id === null ? choice.name : null
  slot.isSpent = false
}

/** SpellSlot.clear: tira a magia e o "gasto". */
export function clearSlot(sheet: Sheet, slotID: string) {
  const slot = sheet.slotBoard.slots.find((s) => s.id === slotID)
  if (!slot) return
  slot.preparedSpellID = null
  slot.preparedSpellName = null
  slot.isSpent = false
}

export function toggleSpent(sheet: Sheet, slotID: string) {
  const slot = sheet.slotBoard.slots.find((s) => s.id === slotID)
  if (slot) slot.isSpent = !slot.isSpent
}

/** SpellDatabase.matches: as mais parecidas com o que foi escrito (semelhança ≥ 0,34). */
export function spellMatches(query: string, choices: SpellChoice[], limit = 8, minimumScore = 0.34) {
  const target = normalize(query)
  if (target === '') return []
  return choices
    .map((spell) => ({ spell, score: similarity(target, normalize(spell.name)) }))
    .filter((m) => m.score >= minimumScore)
    .sort((a, b) => (a.score === b.score ? a.spell.name.localeCompare(b.spell.name) : b.score - a.score))
    .slice(0, limit)
}

// --- Esferas (sacerdote) e grimório (mago) -------------------------------------------

type SphereOwner = Pick<PlayerCharacter, 'sphereAccess'>

const hasConfiguredSphereAccess = (c: SphereOwner) => Object.keys(c.sphereAccess ?? {}).length > 0

export type SphereSignal = 'outsideSpheres' | 'minorCircleCap'

/** PlayerCharacter.sphereSignal: fora das esferas, ou esfera menor acima do 3º círculo. */
export function sphereSignal(c: SphereOwner, spell: SpellChoice): SphereSignal | null {
  if (!hasConfiguredSphereAccess(c) || spell.spheres.length === 0) return null
  const levels = spell.spheres.map((s) => c.sphereAccess?.[s]).filter((l): l is 'major' | 'minor' => !!l)
  if (levels.length === 0) return 'outsideSpheres'
  if (spell.level > 3 && !levels.includes('major')) return 'minorCircleCap'
  return null
}

export const sphereSignalLabel: Record<SphereSignal, string> = {
  outsideSpheres: 'outside spheres',
  minorCircleCap: 'minor — caps at 3rd circle',
}

/** PlayerCharacter.sphereSortRank: esfera maior primeiro, fora das esferas por último. */
function sphereSortRank(c: SphereOwner, spell: SpellChoice): number {
  if (!hasConfiguredSphereAccess(c)) return 1
  if (spell.spheres.some((s) => c.sphereAccess?.[s] === 'major')) return 0
  return sphereSignal(c, spell) === null ? 1 : 2
}

/** PlayerCharacter.spellUsageCounts: quantas vezes cada magia foi memorizada nas folhas. */
export function spellUsageCounts(sheets: Sheet[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const sheet of sheets) {
    for (const slot of sheet.slotBoard.slots) {
      if (slot.preparedSpellID) counts.set(slot.preparedSpellID, (counts.get(slot.preparedSpellID) ?? 0) + 1)
    }
  }
  return counts
}

/** Ordem da lista do círculo (SlotEditorSheet.levelList): favoritas, esferas, mais usadas, nome. */
export function sortSlotChoices(choices: SpellChoice[], c: SphereOwner, favorites: Set<string>, counts: Map<string, number>) {
  return [...choices].sort((a, b) => {
    const fa = favorites.has(a.id)
    const fb = favorites.has(b.id)
    if (fa !== fb) return fa ? -1 : 1
    const ra = sphereSortRank(c, a)
    const rb = sphereSortRank(c, b)
    if (ra !== rb) return ra - rb
    const ca = counts.get(a.id) ?? 0
    const cb = counts.get(b.id) ?? 0
    if (ca !== cb) return cb - ca
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  })
}

type Spellbook = Pick<PlayerCharacter, 'wizardSpellbook'>

/** wizardSpellbookMatchedIDs: as magias do grimório que existem no compêndio. */
export function wizardSpellbookIDs(c: Spellbook): Set<string> {
  return new Set(c.wizardSpellbook.flatMap((e) => (e.matchedSpellID ? [e.matchedSpellID] : [])))
}

/** wizardSpellbookFreeNames: entradas escritas à mão (sem par no compêndio) de um círculo. */
export function wizardSpellbookFreeNames(c: Spellbook, level: number) {
  return c.wizardSpellbook.filter((e) => !e.matchedSpellID && e.level === level).sort((a, b) => (a.name < b.name ? -1 : 1))
}

// --- Dia novo (Store/SpellSheetRules.swift e SpellSheet.nextDay do iPad) ----------------

/** Data no formato que o iPad lê: ISO-8601 sem fração de segundo. */
export function isoNow(date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const newID = () => crypto.randomUUID().toUpperCase()

type Slot = SpellSheet['slotBoard']['slots'][number]
type Caster = Slot['caster']

/** SpellSlotBoard.keepRank: ao encolher um círculo, ficam primeiro os preparados, depois os gastos. */
const keepRank = (slot: Slot) => (!slot.preparedSpellID && !slot.preparedSpellName ? 2 : slot.isSpent ? 1 : 0)

/** SpellSlotBoard.sortSlots: conjurador, círculo e posição (orderKey). */
function sortSlots(slots: Slot[]) {
  slots.sort((a, b) => (a.caster !== b.caster ? (a.caster < b.caster ? -1 : 1) : a.level !== b.level ? a.level - b.level : a.orderKey - b.orderKey))
}

/** SpellSlotBoard.setCount: ajusta quantos slots um círculo tem, preservando o que estava preparado. */
export function setSlotCount(board: SpellSheet['slotBoard'], count: number, level: number, caster: Caster) {
  if (count < 0) return
  let existing = board.slots.filter((s) => s.level === level && s.caster === caster)
  board.slots = board.slots.filter((s) => !(s.level === level && s.caster === caster))
  if (existing.length > count) {
    existing = [...existing].sort((a, b) => keepRank(a) - keepRank(b)).slice(0, count)
  } else {
    let next = Math.max(-1, ...existing.map((s) => s.orderKey)) + 1
    while (existing.length < count) existing.push({ id: newID(), level, caster, isSpent: false, orderKey: next++ })
  }
  board.slots.push(...existing)
  sortSlots(board.slots)
}

export interface Allotment {
  caster: Caster
  level: number
  count: number
}

/** SpellSlotBoard.reconciled: a grade herdada passa a bater com a tabela de slots de hoje. */
export function reconcileBoard(board: SpellSheet['slotBoard'], allotments: Allotment[]): SpellSheet['slotBoard'] {
  const result = structuredClone(board)
  const covered = new Set<string>()
  for (const a of allotments) {
    covered.add(`${a.caster}|${a.level}`)
    setSlotCount(result, a.count, a.level, a.caster)
  }
  const existing = new Set(result.slots.map((s) => `${s.caster}|${s.level}`))
  for (const key of existing) {
    if (covered.has(key)) continue
    const [caster, level] = key.split('|')
    setSlotCount(result, 0, Number(level), caster as Caster)
  }
  return result
}

/** PlayerCharacter.freshSlotBoard: grade em branco do tamanho da tabela de hoje. */
export function freshSlotBoard(allotments: Allotment[]): SpellSheet['slotBoard'] {
  const board: SpellSheet['slotBoard'] = { slots: [] }
  for (const a of allotments) if (a.count > 0) setSlotCount(board, a.count, a.level, a.caster)
  return board
}

type NewSheet = Omit<SpellSheet, 'inkNotes'>

/** SpellSheet.nextDay(keepingPreparations: true): mesmas magias, slots desmarcados, registro vazio, cargas zeradas. */
function nextDay(previous: NewSheet): NewSheet {
  return {
    id: newID(),
    date: isoNow(),
    title: '',
    slotBoard: { slots: previous.slotBoard.slots.map((s) => ({ ...s, id: newID(), isSpent: false })) },
    entries: [],
    magicItems: previous.magicItems.map((item) => ({
      ...item,
      id: newID(),
      spells: item.spells.map((use) => ({ ...use, id: newID(), usedCount: 0 })),
    })),
    wisdomAtCreation: previous.wisdomAtCreation,
    turnUndeadUsed: 0,
  }
}

/**
 * PlayerCharacter.startSpellSheet: a folha de um dia novo. Herda do dia
 * anterior (a mais recente até agora, ou `continuingFrom`), ajustada à tabela
 * de slots de hoje; sem folha anterior, nasce em branco. Congela a Sabedoria
 * (ou Inteligência, para mago e bardo) de hoje. Não altera as folhas existentes.
 */
export function startSpellSheet(
  c: { allotments: Allotment[]; abilityScoreAtCreation: number },
  sheets: NewSheet[],
  options: { sessionID: string | null; title: string; continuingFrom?: NewSheet | null },
): NewSheet {
  const now = isoNow()
  const source = options.continuingFrom ?? [...sheets].filter((s) => s.date <= now).sort((a, b) => a.date.localeCompare(b.date)).pop() ?? null
  const inherited = source ? nextDay(source) : null
  const sheet: NewSheet = inherited
    ? { ...inherited, slotBoard: reconcileBoard(inherited.slotBoard, c.allotments) }
    : { id: newID(), date: now, title: '', slotBoard: freshSlotBoard(c.allotments), entries: [], magicItems: [], wisdomAtCreation: 10, turnUndeadUsed: 0 }
  sheet.sessionID = options.sessionID
  sheet.title = options.title
  sheet.wisdomAtCreation = c.abilityScoreAtCreation
  return sheet
}

/**
 * Registrar uma conjuração nas magias adicionais (AdditionalSpellsBlock.logCast,
 * item A9): se a magia já está no registro do dia, soma 1; senão cria a linha.
 */
export function logCast(sheet: Pick<SpellSheet, 'entries'>, name: string, spell: { id: string; level: number } | null, rawText = name) {
  const existing = spell
    ? sheet.entries.find((e) => e.matchedSpellID === spell.id)
    : sheet.entries.find((e) => !e.matchedSpellID && e.displayName.toLowerCase() === name.toLowerCase())
  if (existing) {
    existing.castCount += 1
    return
  }
  sheet.entries.push({
    id: newID(),
    rawText,
    displayName: name,
    matchedSpellID: spell?.id ?? null,
    spellLevel: spell?.level ?? null,
    castCount: 1,
  })
}
