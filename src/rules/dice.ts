// Motor de dados (docs/grimorio-de-tabelas.md, decisão 2): um só, para o app
// inteiro. Notação "NdM+K" (d100, d%, 2d10, 3d6+2, 1d6-1), rolagem com um
// gerador injetável (testes) e o texto de volta. Só funções puras.

export interface DiceSpec {
  count: number
  sides: number
  modifier: number
}

export interface DiceRoll {
  spec: DiceSpec
  /** Cada dado, na ordem. */
  dice: number[]
  total: number
}

/** Gerador de [0, 1); `Math.random` no app, um fixo nos testes. */
export type Random = () => number

const notation = /^\s*(\d*)\s*d\s*(\d+|%)\s*(?:([+-])\s*(\d+))?\s*$/i

/** "2d10+1" → { count: 2, sides: 10, modifier: 1 }; null se não for notação de dado. */
export function parseDice(text: string): DiceSpec | null {
  const match = notation.exec(text)
  if (!match) return null
  const count = match[1] ? Number(match[1]) : 1
  const sides = match[2] === '%' ? 100 : Number(match[2])
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null
  const modifier = match[4] ? Number(match[4]) * (match[3] === '-' ? -1 : 1) : 0
  return { count, sides, modifier }
}

/** Notação de volta: "d100", "2d6", "1d6-1" (um dado sem modificador fica sem o "1"). */
export function formatDice({ count, sides, modifier }: DiceSpec): string {
  const base = `${count === 1 ? '' : count}d${sides}`
  return modifier === 0 ? base : `${base}${modifier > 0 ? '+' : '-'}${Math.abs(modifier)}`
}

/** Rola. `random` padrão: Math.random. */
export function rollDice(spec: DiceSpec, random: Random = Math.random): DiceRoll {
  const dice = Array.from({ length: spec.count }, () => 1 + Math.floor(random() * spec.sides))
  return { spec, dice, total: dice.reduce((sum, d) => sum + d, 0) + spec.modifier }
}

/** Menor e maior resultado possível. */
export const diceRange = ({ count, sides, modifier }: DiceSpec): [number, number] => [count + modifier, count * sides + modifier]

/**
 * O dado que cobre um intervalo de resultados, quando há um padrão: 1–N vira
 * o menor dado comum que alcança N (d4…d20, d100); terminar em 100 é d100;
 * 2–8/12/20 vira 2d4/2d6/2d10; 3–18 vira 3d6. Fora disso, null.
 */
export function diceForRange(low: number, high: number): DiceSpec | null {
  // Faixas que terminam em 100 são de d100, mesmo quando a tabela é parcial (97–00).
  if (high === 100 && low >= 1) return { count: 1, sides: 100, modifier: 0 }
  if (low === 1) {
    const sides = [2, 3, 4, 6, 8, 10, 12, 20, 100].find((s) => s >= high)
    return sides ? { count: 1, sides, modifier: 0 } : null
  }
  if (low === 2 && [8, 12, 20].includes(high)) return { count: 2, sides: high / 2, modifier: 0 }
  if (low === 3 && high === 18) return { count: 3, sides: 6, modifier: 0 }
  return null
}
