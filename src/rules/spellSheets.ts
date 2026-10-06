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
