// Distância e reação no começo do encontro (CT6, docs/controle-de-combate.md;
// DMG cap. 11, Tabelas 58 e 59). Só funções puras; as tabelas vêm dos dados.

import { formatDice, parseDice, rollDice, type DiceSpec, type Random } from './dice.ts'
import { parseRange } from './tableRoll.ts'
import type { SurpriseResult } from './combat.ts'

// --- Distância (Tabela 58) ---------------------------------------------------------------

/** Uma linha da Tabela 58: a situação e a distância em pés (dado × multiplicador), ou "limite da visão". */
export interface DistanceOption {
  label: string
  /** null = "Limit of sight": o DM decide. */
  dice: DiceSpec | null
  times: number
  /** Como está no livro ("2d6 x 10"). */
  text: string
}

/** As linhas com distância; "No surprise:" (seção, sem valor) fica de fora. */
export function distanceOptions(rows: string[][]): DistanceOption[] {
  return rows.flatMap(([label = '', text = '']) => {
    const value = text.trim()
    if (value === '') return []
    const m = /^(\d*d\d+)\s*(?:[x×*]\s*(\d+))?$/i.exec(value)
    const dice = m ? parseDice(m[1]) : null
    return [{ label: label.replace(/:\s*$/, '').trim(), dice, times: m?.[2] ? Number(m[2]) : 1, text: value }]
  })
}

/** "4d6", "1d10 × 10 (10–100)". */
export function distanceDiceLabel(o: DistanceOption): string {
  if (!o.dice) return o.text
  const base = formatDice(o.dice)
  return o.times === 1 ? base : `${base} × ${o.times}`
}

/** A linha que a surpresa já decidiu: os dois lados surpresos ou um só; null sem surpresa. */
export function distanceFromSurprise(options: DistanceOption[], surprise: SurpriseResult | null | undefined): DistanceOption | null {
  const n = surprise?.surprised.filter((s) => s === 'party' || s === 'enemies').length ?? 0
  if (n === 0) return null
  return options.find((o) => (n >= 2 ? /both/i : /one group/i).test(o.label)) ?? null
}

/** A distância em pés (o dado vezes o multiplicador); null em "limite da visão". */
export function rollDistance(o: DistanceOption, random: Random = Math.random): number | null {
  return o.dice ? rollDice(o.dice, random).total * o.times : null
}

/** O que fica no encontro. */
export interface DistanceResult {
  situation: string
  feet: number
}

// --- Reação (Tabela 59) ------------------------------------------------------------------

/** As atitudes dos PCs, na ordem das colunas ("Friendly PCs" → "Friendly"). */
export const reactionAttitudes = (headers: string[]) => headers.slice(1).map((h) => h.replace(/\s*PCs?$/i, '').trim())

/**
 * Total da Tabela 59: 2d10 mais os modificadores (da descrição da criatura ou
 * da moral, Tabela 50), menos o ajuste de reação do Carisma de quem fala pelo
 * grupo (na tabela, número baixo é amistoso; Carisma +5 deixa as criaturas
 * mais amistosas).
 */
export const reactionTotal = (roll: number, charisma: number, modifier: number) => roll + modifier - charisma

/** A reação das criaturas para o total e a coluna da atitude dos PCs; abaixo e acima da tabela valem as pontas. */
export function reactionFor(rows: string[][], total: number, attitude: number): string | null {
  const parsed = rows.map((r) => ({ range: parseRange(r[0] ?? ''), cells: r.slice(1) })).filter((r) => r.range)
  if (parsed.length === 0) return null
  const lowest = Math.min(...parsed.map((r) => r.range!.low))
  const highest = Math.max(...parsed.map((r) => r.range!.high))
  const value = Math.min(Math.max(total, lowest), highest)
  return parsed.find((r) => value >= r.range!.low && value <= r.range!.high)?.cells[attitude]?.trim() || null
}

/** O que fica no encontro. */
export interface ReactionResult {
  /** 2d10 sem modificadores. */
  roll: number
  total: number
  /** Atitude dos PCs (a coluna). */
  attitude: string
  /** Reação das criaturas ("Cautious", "Flight"). */
  result: string
  /** Quem falou pelo grupo, se o DM escolheu. */
  speaker?: string
}

/** Uma linha para a tela e o log: "Reaction: Cautious (13; PCs indifferent)". */
export const reactionText = (r: ReactionResult) => `Reaction: ${r.result} (${r.total}; PCs ${r.attitude.toLowerCase()}${r.speaker ? `, ${r.speaker} speaking` : ''})`

export const distanceText = (d: DistanceResult) => `Distance: ${d.feet} ft (${d.situation.toLowerCase()})`
