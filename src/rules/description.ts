// Etapa "Tell Your Tale" do The Forge (protótipo "Last step · Description" no
// canvas): idade, altura e peso pela raça e pelo gênero, e o patrono. Só
// funções puras.
//
// - PHB Tabelas 10 (altura e peso), 11 (idade) e 12 (meia-idade, velhice,
//   venerável: metade, dois terços e o todo do máximo base).
// - Raças planares: The Planewalker's Handbook ("Planar Races: Average Height
//   and Weight" e "Age"). O modron tem altura e peso fixos e não envelhece.
// - Meio-vistani (Domains of Dread): envelhece como o humano (Tabela 67); a
//   altura, o peso e a idade inicial ficam os do humano.

import type { RaceName } from './raceKit.ts'
import type { Gender } from '../lib/forgeImages.ts'

export interface Dice {
  count: number
  sides: number
}

export interface BodyTable {
  /** Altura base em polegadas [homem, mulher] e o dado. */
  height: [number, number, Dice | null]
  /** Peso base em libras [homem, mulher] e o dado. */
  weight: [number, number, Dice | null]
  /** Idade inicial: base e o dado (null = não envelhece). */
  age: [number, Dice] | null
  /** Máximo base (Tabela 12: meia-idade é a metade; velhice, dois terços). null = não envelhece. */
  maxAge: number | null
}

const dice = (count: number, sides: number): Dice => ({ count, sides })

const human: BodyTable = { height: [60, 59, dice(2, 10)], weight: [140, 100, dice(6, 10)], age: [15, dice(1, 4)], maxAge: 90 }

/** PHB Tabelas 10–12; PWH para as raças planares. */
export const bodyTables: Partial<Record<RaceName, BodyTable>> = {
  Human: human,
  Dwarf: { height: [43, 41, dice(1, 10)], weight: [130, 105, dice(4, 10)], age: [40, dice(5, 6)], maxAge: 250 },
  Elf: { height: [55, 50, dice(1, 10)], weight: [90, 70, dice(3, 10)], age: [100, dice(5, 6)], maxAge: 350 },
  Gnome: { height: [38, 36, dice(1, 6)], weight: [72, 68, dice(5, 4)], age: [60, dice(3, 12)], maxAge: 200 },
  'Half-Elf': { height: [60, 58, dice(2, 6)], weight: [110, 85, dice(3, 12)], age: [15, dice(1, 6)], maxAge: 125 },
  Halfling: { height: [32, 30, dice(2, 8)], weight: [52, 48, dice(5, 4)], age: [20, dice(3, 4)], maxAge: 100 },
  Aasimar: { height: [61, 60, dice(2, 10)], weight: [140, 90, dice(5, 10)], age: [16, dice(1, 6)], maxAge: 125 },
  'Bariaur (male)': { height: [77, 74, dice(3, 6)], weight: [700, 660, dice(4, 20)], age: [18, dice(2, 6)], maxAge: 100 },
  'Bariaur (female)': { height: [77, 74, dice(3, 6)], weight: [700, 660, dice(4, 20)], age: [18, dice(2, 6)], maxAge: 100 },
  'Genasi (air)': { height: [58, 57, dice(1, 8)], weight: [130, 80, dice(4, 10)], age: [20, dice(1, 10)], maxAge: 120 },
  'Genasi (earth)': { height: [61, 60, dice(2, 8)], weight: [160, 110, dice(6, 10)], age: [20, dice(1, 10)], maxAge: 120 },
  'Genasi (fire)': { height: [60, 59, dice(1, 10)], weight: [150, 100, dice(4, 10)], age: [20, dice(1, 10)], maxAge: 120 },
  'Genasi (water)': { height: [60, 59, dice(1, 10)], weight: [150, 100, dice(5, 10)], age: [20, dice(1, 10)], maxAge: 120 },
  Githzerai: { height: [62, 60, dice(2, 10)], weight: [120, 90, dice(3, 10)], age: [30, dice(2, 8)], maxAge: 250 },
  Tiefling: { height: [59, 57, dice(2, 10)], weight: [140, 90, dice(6, 10)], age: [17, dice(2, 4)], maxAge: 100 },
  Modron: { height: [72, 72, null], weight: [500, 500, null], age: null, maxAge: null },
  'Half-Vistani': human,
}

/** A tabela da raça (raça fora das tabelas: a humana). */
export const bodyTable = (race: RaceName | null): BodyTable => (race ? bodyTables[race] : null) ?? human

const average = (base: number, d: Dice | null) => base + (d ? Math.ceil((d.count * (d.sides + 1)) / 2) : 0)
const roll = (base: number, d: Dice | null, random: () => number) => {
  let total = base
  if (d) for (let i = 0; i < d.count; i++) total += 1 + Math.floor(random() * d.sides)
  return total
}

export type Measure = 'age' | 'height' | 'weight'

/** O valor médio (o ponto de partida da tela). Modron: idade null. */
export function averageMeasure(t: BodyTable, measure: Measure, gender: Gender | null): number | null {
  const female = gender === 'female'
  if (measure === 'age') return t.age ? average(t.age[0], t.age[1]) : null
  const [m, f, d] = measure === 'height' ? t.height : t.weight
  return average(female ? f : m, d)
}

/** Uma rolagem pela tabela. */
export function rollMeasure(t: BodyTable, measure: Measure, gender: Gender | null, random: () => number = Math.random): number | null {
  const female = gender === 'female'
  if (measure === 'age') return t.age ? roll(t.age[0], t.age[1], random) : null
  const [m, f, d] = measure === 'height' ? t.height : t.weight
  return roll(female ? f : m, d, random)
}

/** "40+5d6", "2d10" — o rótulo do dado de cada medida (null quando é fixa). */
export function measureDice(t: BodyTable, measure: Measure): string | null {
  if (measure === 'age') return t.age ? `${t.age[0]}+${t.age[1].count}d${t.age[1].sides}` : null
  const d = (measure === 'height' ? t.height : t.weight)[2]
  return d ? `${d.count}d${d.sides}` : null
}

export type AgingStage = 'middle-aged' | 'old' | 'venerable'

/** Tabela 12: meia-idade na metade do máximo base, velhice em dois terços, venerável no máximo. */
export function agingThresholds(t: BodyTable): [number, number, number] | null {
  // Como a Tabela 12 do PHB: meia-idade arredonda para baixo (62,5 → 62), velhice para o mais próximo (166,7 → 167).
  return t.maxAge ? [Math.floor(t.maxAge / 2), Math.round((t.maxAge * 2) / 3), t.maxAge] : null
}

export function agingStage(t: BodyTable, age: number): AgingStage | null {
  const th = agingThresholds(t)
  if (!th) return null
  return age >= th[2] ? 'venerable' : age >= th[1] ? 'old' : age >= th[0] ? 'middle-aged' : null
}

/** 47 → "3'11\"" (a ficha guarda texto). */
export const feetAndInches = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`

/** "3'11\"" (ou "47") → 47; null se não dá para ler. */
export function parseInches(text: string | null | undefined): number | null {
  const t = (text ?? '').trim()
  const m = /^(\d+)\s*['′]\s*(\d+)?/.exec(t)
  if (m) return Number(m[1]) * 12 + Number(m[2] ?? 0)
  const n = /^(\d+)/.exec(t)
  return n ? Number(n[1]) : null
}

// --- O patrono ---------------------------------------------------------------------------

const axes = (code: string) => {
  const c = code === 'N' ? 'TN' : code
  return { law: c[0] === 'L' ? 1 : c[0] === 'C' ? -1 : 0, good: c[1] === 'G' ? 1 : c[1] === 'E' ? -1 : 0 }
}

/**
 * A divindade "combina" com o personagem quando fica a no máximo um passo do
 * alinhamento dele (a fé e o fiel não se afastam muito). `mine` é o código
 * ("LG"); a divindade vem como nos dados ("N", "NG"…).
 */
export function deityFits(deity: string | null | undefined, mine: string | null | undefined): boolean {
  if (!deity || !mine || deity === 'None') return false
  const g = axes(deity)
  const m = axes(mine)
  return Math.abs(g.law - m.law) + Math.abs(g.good - m.good) <= 1
}

/** De que cenário a divindade vem (pelo livro dos dados). */
export const deitySetting = (book: string | null | undefined) =>
  book === 'Tales of the Lance' ? 'Dragonlance' : book === 'Faiths & Avatars' || book === 'Powers & Pantheons' ? 'Forgotten Realms' : (book ?? '')
