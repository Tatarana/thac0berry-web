// Bloco psiônico do Psionicist (Complete Psionics Handbook, cap. 1), feito
// primeiro na web (2026-10-06). Só funções puras.
//
// - Tabela 4: disciplinas, ciências, devoções e modos de defesa por nível.
// - Tabela 5: PSPs. Base pela Sabedoria, mais os modificadores de
//   Inteligência e Constituição no 1º nível; a cada nível novo, 10 + o
//   modificador de Sabedoria. Os dados de referência só trazem a tabela para
//   atributos de 15 a 18: fora disso o máximo não é calculado (o jogador
//   escreve à mão).
// - Tabela 3 (XP individual): 10 XP por PSP gasto para superar um inimigo ou
//   problema. Decisão do usuário: registrar só os PSPs gastos e sugerir sempre
//   essa taxa (evitar combate vale 15/PSP e uso sem importância 0, a critério
//   do mestre).

import type { PsionicPowerEntry, PsionicUse, Psionics } from '../types/library.ts'

export const disciplines = ['Clairsentience', 'Psychokinesis', 'Psychometabolism', 'Psychoportation', 'Telepathy', 'Metapsionics'] as const

/** Os cinco modos de defesa (todos da Telepatia; não contam no limite de poderes). */
export const defenseModes = ['Mind Blank', 'Thought Shield', 'Mental Barrier', 'Tower of Iron Will', 'Intellect Fortress'] as const

/** Tabela 4, linhas 1 a 20: [disciplinas, ciências, devoções, modos de defesa]. */
const progressionRows: [number, number, number, number][] = [
  [1, 1, 3, 1], [2, 1, 5, 1], [2, 2, 7, 2], [2, 2, 9, 2], [2, 3, 10, 3],
  [3, 3, 11, 3], [3, 4, 12, 4], [3, 4, 13, 4], [3, 5, 14, 5], [4, 5, 15, 5],
  [4, 6, 16, 5], [4, 6, 17, 5], [4, 7, 18, 5], [5, 7, 19, 5], [5, 8, 20, 5],
  [5, 8, 21, 5], [5, 9, 22, 5], [6, 9, 23, 5], [6, 10, 24, 5], [6, 10, 25, 5],
]

export interface Progression {
  disciplines: number
  sciences: number
  devotions: number
  defenseModes: number
}

/** Tabela 4 (acima do 20º, vale a linha do 20º). */
export function progression(level: number): Progression {
  const [d, s, v, m] = progressionRows[Math.max(1, Math.min(level, 20)) - 1]
  return { disciplines: d, sciences: s, devotions: v, defenseModes: m }
}

/** Tabela 5: base pela Sabedoria (15 a 18). */
const baseByWisdom: Record<number, number> = { 15: 20, 16: 22, 17: 24, 18: 26 }

/** Tabela 5: modificador (15 a 18); abaixo de 15 não há modificador. */
function abilityModifier(score: number): number | null {
  if (score < 15) return 0
  return ({ 15: 0, 16: 1, 17: 2, 18: 3 } as Record<number, number>)[score] ?? null
}

/**
 * PSPs máximos pela Tabela 5, ou null quando a tabela não cobre os atributos
 * (Sabedoria fora de 15–18, ou Inteligência/Constituição acima de 18).
 */
export function pspMaximum(level: number, abilities: { wisdom: number; intelligence: number; constitution: number }): number | null {
  const base = baseByWisdom[abilities.wisdom]
  const wis = abilityModifier(abilities.wisdom)
  const int = abilityModifier(abilities.intelligence)
  const con = abilityModifier(abilities.constitution)
  if (base === undefined || wis === null || int === null || con === null) return null
  return base + int + con + Math.max(0, level - 1) * (10 + wis)
}

/** Máximo valendo: o escrito à mão, senão o calculado. */
export function pspMax(p: Pick<Psionics, 'pspMaxOverride'> | null | undefined, calculated: number | null): number | null {
  return p?.pspMaxOverride ?? calculated
}

/** Contagem de ciências e devoções conhecidas. */
export function powerCounts(powers: PsionicPowerEntry[]): { sciences: number; devotions: number } {
  return {
    sciences: powers.filter((p) => p.tier === 'Science').length,
    devotions: powers.filter((p) => p.tier !== 'Science').length,
  }
}

/** Primeiro número de um custo do compêndio ("8+4/round" → 8); null se não houver. */
export function initialCost(text: string | null | undefined): number | null {
  const match = (text ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}

/** XP sugerido dos usos de uma sessão: 10 XP por PSP (Tabela 3, "superar"). */
export function psionicXP(uses: Pick<PsionicUse, 'psp'>[]): { psp: number; xp: number } {
  const psp = uses.reduce((sum, u) => sum + Math.max(0, u.psp), 0)
  return { psp, xp: psp * 10 }
}
