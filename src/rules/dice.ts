// Motor de dados (docs/grimorio-de-tabelas.md, decisão 2): um só, para o app
// inteiro. Notação "NdM+K" (d100, d%, 2d10, 3d6+2, 1d6-1) e a soma de dados
// diferentes ("1d8+1d12", a tabela 2–20 do DMG), rolagem com um gerador
// injetável (testes) e o texto de volta. Só funções puras.

export interface DiceGroup {
  count: number
  sides: number
}

export interface DiceSpec {
  count: number
  sides: number
  modifier: number
  /** Outros dados somados ao primeiro ("1d8+1d12": o d12). Ausente no caso comum. */
  extra?: DiceGroup[]
}

export interface DiceRoll {
  spec: DiceSpec
  /** Cada dado, na ordem. */
  dice: number[]
  total: number
}

/** Gerador de [0, 1); `Math.random` no app, um fixo nos testes. */
export type Random = () => number

const group = /^(\d*)d(\d+|%)$/i
const constant = /^\d+$/

/**
 * "2d10+1" → { count: 2, sides: 10, modifier: 1 }; "1d8+1d12" → { count: 1,
 * sides: 8, modifier: 0, extra: [{ count: 1, sides: 12 }] }. null se não for
 * notação de dado (só o modificador pode ser negativo, como em "1d6-1").
 */
export function parseDice(text: string): DiceSpec | null {
  const terms = text.replace(/\s+/g, '').split(/(?=[+-])/)
  if (terms.length === 0 || terms[0] === '') return null
  const groups: DiceGroup[] = []
  let modifier = 0
  let seenModifier = false
  for (const [i, raw] of terms.entries()) {
    const sign = raw.startsWith('-') ? -1 : 1
    const term = i === 0 ? raw : raw.slice(1)
    const dice = group.exec(term)
    if (dice && sign === 1 && !seenModifier) {
      const count = dice[1] ? Number(dice[1]) : 1
      const sides = dice[2] === '%' ? 100 : Number(dice[2])
      if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null
      groups.push({ count, sides })
    } else if (i > 0 && constant.test(term) && !seenModifier) {
      modifier = sign * Number(term)
      seenModifier = true
    } else return null
  }
  if (groups.length === 0 || groups.length > 4) return null
  const [first, ...extra] = groups
  return extra.length > 0 ? { ...first, modifier, extra } : { ...first, modifier }
}

const groupsOf = (spec: DiceSpec): DiceGroup[] => [{ count: spec.count, sides: spec.sides }, ...(spec.extra ?? [])]

/** Notação de volta: "d100", "2d6", "1d6-1", "d8+d12" (um dado fica sem o "1"). */
export function formatDice(spec: DiceSpec): string {
  const base = groupsOf(spec)
    .map(({ count, sides }) => `${count === 1 ? '' : count}d${sides}`)
    .join('+')
  return spec.modifier === 0 ? base : `${base}${spec.modifier > 0 ? '+' : '-'}${Math.abs(spec.modifier)}`
}

/** Rola. `random` padrão: Math.random. */
export function rollDice(spec: DiceSpec, random: Random = Math.random): DiceRoll {
  const dice = groupsOf(spec).flatMap(({ count, sides }) => Array.from({ length: count }, () => 1 + Math.floor(random() * sides)))
  return { spec, dice, total: dice.reduce((sum, d) => sum + d, 0) + spec.modifier }
}

/** Menor e maior resultado possível. */
export const diceRange = (spec: DiceSpec): [number, number] => {
  const groups = groupsOf(spec)
  return [groups.reduce((s, g) => s + g.count, 0) + spec.modifier, groups.reduce((s, g) => s + g.count * g.sides, 0) + spec.modifier]
}

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
