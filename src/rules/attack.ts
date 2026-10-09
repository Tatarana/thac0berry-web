// "Acerta?" do Combat Tracker (CT5b, docs/controle-de-combate.md): ataque
// contra a CA (THAC0 − CA no d20, DMG cap. 9), modificadores da Tabela 35 e o
// dano do monstro. Só funções puras.

import { diceForRange, parseDice, rollDice, type DiceSpec, type Random } from './dice.ts'

/** Um ataque do monstro: o texto do livro e o dado (ou valor fixo); sem dado legível ("By weapon"), só o texto. */
export interface AttackDamage {
  text: string
  dice: DiceSpec | null
  fixed: number | null
}

/** "1-8", "1d8+2", "1" → dado ou valor; null quando não é número ("By weapon", "Special"). */
function damageOf(text: string): Pick<AttackDamage, 'dice' | 'fixed'> | null {
  const core = text.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  let m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(core)
  if (m) {
    const spec = diceForRange(Number(m[1]), Number(m[2]))
    return spec ? { dice: spec, fixed: null } : null
  }
  m = /^(\d+)$/.exec(core)
  if (m) return { dice: null, fixed: Number(m[1]) }
  const spec = parseDice(core)
  return spec ? { dice: spec, fixed: null } : null
}

/** Os ataques do texto de dano, um por "/" ("1-6/1-6/2-12": garra, garra, mordida). */
export function attackDamages(text: string): AttackDamage[] {
  const first = (text ?? '').split('\n')[0].trim()
  if (first === '') return []
  return first.split('/').map((part) => {
    const t = part.trim()
    const d = damageOf(t)
    return { text: t, dice: d?.dice ?? null, fixed: d?.fixed ?? null }
  })
}

/** Quanto precisa no d20: THAC0 − CA do alvo (DMG cap. 9). */
export const neededToHit = (thac0: number, ac: number) => thac0 - ac

/** 20 natural sempre acerta, 1 natural sempre erra; senão d20 + modificadores ≥ o necessário. */
export function attackHits(roll: number, modifier: number, needed: number): boolean {
  if (roll >= 20) return true
  if (roll <= 1) return false
  return roll + modifier >= needed
}

/** Dano de um ataque (rolado, ou o valor fixo); null sem dado. */
export function rollDamage(d: AttackDamage, random?: Random): number | null {
  if (d.fixed !== null) return d.fixed
  return d.dice ? Math.max(0, rollDice(d.dice, random).total) : null
}
