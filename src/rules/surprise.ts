// Surpresa e salvamentos de monstro do Combat Tracker (CT5a,
// docs/controle-de-combate.md). Só funções puras; as tabelas vêm dos dados.

import { hitDiceValue, initiativeModifiers, type Combatant, type InitiativeModifier, type Side, type SurpriseResult } from './combat.ts'

// --- Surpresa (PHB cap. 11; DMG Tabela 57) ------------------------------------------------

/** O teste de um lado: d10 (os jogadores rolam o da Party), modificadores da Tabela 57 e "não pode ser surpreendido". */
export interface SurpriseSide {
  roll: number | null
  mods: string[]
  immune: boolean
}

export const surpriseSides = ['party', 'enemies'] as const
export type SurpriseSideKey = (typeof surpriseSides)[number]

export const emptySurpriseSide = (): SurpriseSide => ({ roll: null, mods: [], immune: false })

/** Linhas numéricas da Tabela 57 ("Camouflaged −1 to −3" fica de fora: o DM decide). "Every 10 members" é calculado. */
export const surpriseModifiers = (rows: string[][]) => initiativeModifiers(rows).filter((m) => !/every 10 members/i.test(m.label))

/** "+1 a cada 10 membros" do outro lado (Tabela 57): grupo grande é fácil de notar. */
export function crowdModifier(rows: string[][], others: number): InitiativeModifier | null {
  const row = initiativeModifiers(rows).find((m) => /every 10 members/i.test(m.label))
  const tens = Math.floor(others / 10)
  return row && tens > 0 ? { label: `${row.label} (${others})`, value: row.value * tens } : null
}

/** d10 modificado; null sem o d10. */
export function surpriseTotal(side: SurpriseSide, modifiers: InitiativeModifier[], crowd: InitiativeModifier | null): number | null {
  if (side.roll === null) return null
  return side.roll + (crowd?.value ?? 0) + side.mods.reduce((sum, label) => sum + (modifiers.find((m) => m.label === label)?.value ?? 0), 0)
}

/** 1, 2 ou 3 (modificado): surpreso; quem não pode ser surpreendido nunca é. */
export const isSurprised = (side: SurpriseSide, total: number | null) => !side.immune && total !== null && total <= 3

/** O resultado guardado no encontro. */
export function surpriseResult(totals: Partial<Record<SurpriseSideKey, number | null>>, sides: Record<SurpriseSideKey, SurpriseSide>): SurpriseResult {
  const surprised: Side[] = surpriseSides.filter((k) => isSurprised(sides[k], totals[k] ?? null))
  const clean: SurpriseResult['totals'] = {}
  for (const k of surpriseSides) if (totals[k] !== null && totals[k] !== undefined) clean[k] = totals[k]!
  return { totals: clean, surprised }
}

// --- Salvamentos de monstro (DMG Tabela 46; o Monstrous Manual: como guerreiro do nível = DV) ---

export interface SaveRow {
  low: number
  high: number
  /** Os 5 valores, na ordem das colunas da Tabela 46. */
  saves: number[]
}

/** "1-2" → 1–2, "17+" → 17–∞, "0" → 0. */
function levelRange(text: string): { low: number; high: number } | null {
  const m = /^(\d+)\s*(?:[-–]\s*(\d+)|(\+))?$/.exec(text.trim())
  if (!m) return null
  return { low: Number(m[1]), high: m[2] ? Number(m[2]) : m[3] ? Infinity : Number(m[1]) }
}

/**
 * As linhas de guerreiro da Tabela 46. A tabela vem sem o nome dos grupos
 * (sacerdote, ladino, guerreiro, mago, nessa ordem); o bloco do guerreiro é o
 * único que começa no nível 0, e vai até a faixa voltar a começar baixo.
 */
export function warriorSaveRows(rows: string[][]): SaveRow[] {
  const parsed = rows.map((r) => ({ range: levelRange(r[0] ?? ''), saves: r.slice(1, 6).map(Number) }))
  const start = parsed.findIndex((r) => r.range?.low === 0)
  if (start < 0) return []
  const out: SaveRow[] = []
  for (let i = start; i < parsed.length; i++) {
    const { range, saves } = parsed[i]
    if (!range || saves.length !== 5 || saves.some((v) => !Number.isFinite(v))) break
    if (out.length > 0 && range.low <= out[out.length - 1].low) break
    out.push({ ...range, saves })
  }
  return out
}

/** Nível de salvamento pelos DV: ½ DV ou menos → 0; DV com bônus contam pelo inteiro ("4+1" → 4). null sem DV legível. */
export function saveLevel(c: Pick<Combatant, 'hitDice'>): number | null {
  const hd = hitDiceValue(c.hitDice)
  if (hd === null) return null
  return hd <= 0.5 ? 0 : Math.max(1, Math.floor(hd))
}

/** Os 5 valores para o nível; null se a tabela não cobre. */
export function savesFor(level: number, rows: SaveRow[]): number[] | null {
  return rows.find((r) => level >= r.low && level <= r.high)?.saves ?? null
}

/** Nomes das 5 categorias, do cabeçalho da Tabela 46 (sem os asteriscos das notas). */
export const saveCategories = (headers: string[]) => headers.slice(1, 6).map((h) => h.replace(/\*+$/, '').trim())

/** d20 + modificador igual ou acima do valor: salvou. */
export const savePasses = (roll: number, modifier: number, target: number) => roll + modifier >= target
