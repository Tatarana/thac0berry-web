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
