// Efeitos em vários combatentes de uma vez (CT7, docs/controle-de-combate.md):
// a mesma condição, com o mesmo prazo, em quem o DM marcar ("+ Effect"). Cada
// cópia leva o `groupID` do efeito, para tirar de todos de uma vez e para o
// log juntar numa linha. Só funções puras.

import { statusOf, type Combatant, type Encounter, type Side } from './combat.ts'

export type DurationUnit = 'rounds' | 'turns' | 'none'

/** Rodadas do prazo: 1 turno = 10 rodadas (PHB cap. 9); "none" ou valor inválido = sem prazo. */
export function effectRounds(amount: number | null, unit: DurationUnit): number | null {
  if (unit === 'none' || amount === null || !Number.isFinite(amount) || amount <= 0) return null
  return Math.round(unit === 'turns' ? amount * 10 : amount)
}

/** Atalhos dos alvos: um lado (de pé ou não) ou todos de pé. */
export type TargetShortcut = Side | 'standing'

export function targetsFor(combatants: Combatant[], shortcut: TargetShortcut, deathAt: number): string[] {
  return combatants.filter((c) => (shortcut === 'standing' ? statusOf(c, deathAt) === 'ok' : c.side === shortcut)).map((c) => c.id)
}

/** Põe o efeito nos alvos (cada um com a sua cópia, todas com o mesmo `groupID`). */
export function applyGroupEffect(combatants: Combatant[], targetIDs: string[], name: string, rounds: number | null, groupID: string, newID: () => string): Combatant[] {
  const clean = name.trim()
  if (clean === '') return combatants
  const chosen = new Set(targetIDs)
  return combatants.map((c) => (chosen.has(c.id) ? { ...c, conditions: [...c.conditions, { id: newID(), name: clean, rounds, groupID }] } : c))
}

/** Tira o efeito de todos. */
export const removeGroupEffect = (combatants: Combatant[], groupID: string): Combatant[] =>
  combatants.map((c) => (c.conditions.some((x) => x.groupID === groupID) ? { ...c, conditions: c.conditions.filter((x) => x.groupID !== groupID) } : c))

export interface ActiveGroupEffect {
  groupID: string
  name: string
  /** Rodadas que faltam (o maior entre as cópias; null = sem prazo). */
  rounds: number | null
  names: string[]
}

/** Os efeitos de grupo ainda em alguém, na ordem em que aparecem. */
export function activeGroupEffects(combatants: Combatant[]): ActiveGroupEffect[] {
  const groups = new Map<string, ActiveGroupEffect>()
  for (const c of combatants) {
    for (const x of c.conditions) {
      if (!x.groupID) continue
      const g = groups.get(x.groupID) ?? { groupID: x.groupID, name: x.name, rounds: x.rounds, names: [] }
      g.names.push(c.name)
      if (g.rounds !== null && (x.rounds === null || x.rounds > g.rounds)) g.rounds = x.rounds
      groups.set(x.groupID, g)
    }
  }
  return [...groups.values()]
}

/** Sugestões de nome: as condições já usadas no encontro (sem repetir, na ordem). */
export function conditionSuggestions(e: Pick<Encounter, 'combatants'>): string[] {
  return [...new Set(e.combatants.flatMap((c) => c.conditions.map((x) => x.name.trim())).filter(Boolean))]
}

export const roundsText = (rounds: number | null) => (rounds === null ? 'no limit' : `${rounds} round${rounds === 1 ? '' : 's'}`)

// --- CT8: salvamento por alvo ----------------------------------------------------------------

/** As 5 categorias do PHB, na ordem da Tabela 46 do DMG e da ficha. */
export const saveCategoryKeys = [
  { id: 'ppd', key: 'paralyzationPoisonDeath', label: 'Paralyzation, poison or death' },
  { id: 'rsw', key: 'rodStaffWand', label: 'Rod, staff or wand' },
  { id: 'pp', key: 'petrificationPolymorph', label: 'Petrification or polymorph' },
  { id: 'bw', key: 'breathWeapon', label: 'Breath weapon' },
  { id: 'sp', key: 'spell', label: 'Spell' },
] as const

/** O que acontece com quem salva: não recebe o efeito, ou só fica anotado (metade do dano, lançado à mão). */
export type SaveMode = 'negates' | 'half'

type SheetSaves = Partial<Record<(typeof saveCategoryKeys)[number]['key'], number>> & { modifiers?: Record<string, number> | null }

/** Valor de salvamento do PC pela ficha: o da linha menos o modificador (como na ficha); null sem o valor. */
export function sheetSaveTarget(saves: SheetSaves | null | undefined, category: number): number | null {
  const cat = saveCategoryKeys[category]
  const base = saves?.[cat.key]
  if (typeof base !== 'number' || !Number.isFinite(base)) return null
  return base - (saves?.modifiers?.[cat.id] ?? 0)
}

/** Uma linha da lista de salvamentos: o valor a tirar e o d20 (null = falta). */
export interface TargetSave {
  id: string
  target: number | null
  roll: number | null
}

/** Salvou: d20 + modificador ≥ valor; null enquanto falta o valor ou o d20. */
export function saveSucceeds(s: TargetSave, modifier: number): boolean | null {
  if (s.target === null || s.roll === null) return null
  return s.roll + modifier >= s.target
}

/** Quem recebe o efeito: em "negates", só quem falhou; em "half", todos (quem salvou só fica no log). */
export function affectedIDs(saves: TargetSave[], modifier: number, mode: SaveMode): string[] {
  return saves.filter((s) => mode === 'half' || saveSucceeds(s, modifier) === false).map((s) => s.id)
}

/** A nota do log: "Save vs Spell (−2) for Hold Person: Orc 2 saved (15); Orc 1 failed (6)". */
export function saveNote(effect: string, category: number, modifier: number, saves: (TargetSave & { name: string })[]): string {
  const mod = modifier === 0 ? '' : ` (${modifier > 0 ? '+' : '−'}${Math.abs(modifier)})`
  const part = (ok: boolean) =>
    saves
      .filter((s) => saveSucceeds(s, modifier) === ok)
      .map((s) => `${s.name} (${s.roll})`)
      .join(', ')
  const saved = part(true)
  const failed = part(false)
  const what = effect.trim() ? ` for ${effect.trim()}` : ''
  return `Save vs ${saveCategoryKeys[category].label.toLowerCase()}${mod}${what}: ${[saved && `saved ${saved}`, failed && `failed ${failed}`].filter(Boolean).join('; ')}`
}
