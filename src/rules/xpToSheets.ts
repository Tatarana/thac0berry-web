// XP do fim do encontro nas fichas (CT9, docs/controle-de-combate.md): a parte
// de cada membro do grupo, com o bônus de 10% do atributo principal (PHB) nos
// personagens de uma classe. Só funções puras; a gravação é em src/lib/roster.ts.

import type { Combatant, XpAward } from './combat.ts'
import { primeRequisites } from './sessionReport.ts'

type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

/** O que a regra precisa da ficha. */
export interface SheetForXp {
  characterClass: string
  multiClasses?: { characterClass: string }[] | null
  abilities: Record<Ability, number>
}

export interface XpLine {
  combatantID: string
  name: string
  /** null = sem ficha no App (PC sem App, NPC): o DM dá à mão. */
  characterID: string | null
  base: number
  /** +10% do atributo principal (só em personagem de uma classe). */
  bonus: number
  /** Por que não há bônus quando a classe tem atributo principal (multiclasse). */
  note?: string
}

/** O bônus de 10%: 16 ou mais em todos os atributos principais da classe; multiclasse fica de fora (a regra é por classe). */
export function primeBonus(sheet: SheetForXp, amount: number): { bonus: number; note?: string } {
  if ((sheet.multiClasses?.length ?? 0) > 1) return { bonus: 0, note: 'multiclass: no automatic bonus' }
  const prime = primeRequisites[sheet.characterClass]
  if (!prime || !prime.every((a) => (sheet.abilities[a] ?? 0) >= 16)) return { bonus: 0 }
  return { bonus: Math.floor(amount / 10) }
}

/** Uma linha por membro que dividiu o XP, na ordem do prêmio. */
export function xpLines(award: XpAward, combatants: Combatant[], sheets: Map<string, SheetForXp>): XpLine[] {
  return award.members.flatMap((id) => {
    const c = combatants.find((x) => x.id === id)
    if (!c) return []
    const key = c.characterID?.toLowerCase() ?? null
    const sheet = key ? sheets.get(key) : undefined
    if (!sheet) return [{ combatantID: c.id, name: c.name, characterID: null, base: award.each, bonus: 0 }]
    return [{ combatantID: c.id, name: c.name, characterID: c.characterID, base: award.each, ...primeBonus(sheet, award.each) }]
  })
}

/** O que foi lançado (guardado no encontro, contra lançar duas vezes). */
export interface XpApplied {
  at: string
  entries: { characterID: string; name: string; amount: number; prime: boolean }[]
}

/** A linha do log: "XP to the sheets: Rufus +157, Ana +172 (prime +10%)". */
export const xpAppliedText = (a: XpApplied) =>
  `XP to the sheets: ${a.entries.map((e) => `${e.name} +${e.amount.toLocaleString('en-US')}${e.prime ? ' (prime +10%)' : ''}`).join(', ')}`
