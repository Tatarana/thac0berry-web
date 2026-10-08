// Rolar e consultar tabelas do Table Grimoire (GT2) e encadear tabelas (GT3).
// Usa o motor de dados (dice.ts). Só funções puras.

import { diceForRange, diceRange, parseDice, type DiceSpec } from './dice.ts'

export interface Range {
  low: number
  /** Infinity em "13+". */
  high: number
}

type TableLike = { headers: string[]; rows: string[][] }

const rangePattern = /^\s*(\d{1,3})\s*(?:([-–—])\s*(\d{1,3}))?\s*(\+)?\s*$/

/**
 * Faixa da primeira coluna: "01-05", "96-00" (00 = 100), "00", "7", "2–3",
 * "13+". null se a célula não é uma faixa.
 */
export function parseRange(cell: string): Range | null {
  const match = rangePattern.exec(cell)
  if (!match) return null
  const value = (text: string) => (text === '00' ? 100 : Number(text))
  const low = value(match[1])
  if (match[4]) return match[3] ? null : { low, high: Number.POSITIVE_INFINITY }
  const high = match[3] !== undefined ? value(match[3]) : low
  return high < low ? null : { low, high }
}

export interface RollPlan {
  /** Faixa de cada linha; null nas linhas de seção ("Common", sem outras células). */
  ranges: (Range | null)[]
  /** Dado para o botão Roll; null = só consulta (ex.: tabela por nível). */
  dice: DiceSpec | null
  /** O dado do cabeçalho não cobre as faixas (ex.: Tabela 88 "D20" com 01–100): usamos o das faixas. */
  headerMismatch: boolean
}

const diceHeader = /\b\d*d(?:\d+|%)\b|roll|\bdie\b|dice/i

/**
 * Plano de uma tabela: consultável se toda linha (fora as de seção) começa
 * com uma faixa; rolável se, além disso, o cabeçalho fala em dado ou rolagem.
 * O dado vem do cabeçalho; se as faixas passam do dobro dele (cabeçalho
 * errado), vem das faixas. null = a tabela não é consultável.
 */
export function rollPlan(table: TableLike): RollPlan | null {
  const ranges = table.rows.map((row) => {
    const range = parseRange(row[0] ?? '')
    const isSection = !range && row.slice(1).every((cell) => cell.trim() === '')
    return range ?? (isSection ? null : undefined)
  })
  const body = ranges.filter((r) => r !== null)
  if (body.length < 2 || body.some((r) => r === undefined)) return null
  const real = body as Range[]
  // "0" sozinho depois de faixas até 99 é um "00" que perdeu um zero na extração.
  if (Math.max(...real.map((r) => r.high)) === 99) for (const r of real) if (r.low === 0 && r.high === 0) r.low = r.high = 100
  const plan: RollPlan = { ranges: ranges as (Range | null)[], dice: null, headerMismatch: false }
  const header = table.headers[0] ?? ''
  if (!diceHeader.test(header)) return plan

  const low = Math.min(...real.map((r) => r.low))
  const high = Math.max(...real.map((r) => (Number.isFinite(r.high) ? r.high : r.low)))
  const fromHeader = parseDice(/\d*d(?:\d+|%)/i.exec(header)?.[0] ?? '')
  const fromRanges = diceForRange(low, high)
  if (fromHeader && high <= 2 * diceRange(fromHeader)[1]) plan.dice = fromHeader
  else {
    plan.dice = fromRanges ?? fromHeader
    plan.headerMismatch = fromHeader !== null && fromRanges !== null
  }
  return plan
}

/** Linha do resultado (a primeira cuja faixa contém o valor); -1 se nenhuma. */
export function findRow(plan: RollPlan, value: number): number {
  return plan.ranges.findIndex((r) => r !== null && value >= r.low && value <= r.high)
}

/** Resultado digitado: "37" → 37; "00" e "0" valem 100 num d100. null se não for número. */
export function typedResult(text: string, dice: DiceSpec | null): number | null {
  const clean = text.trim()
  if (!/^-?\d{1,4}$/.test(clean)) return null
  const value = Number(clean)
  return value === 0 && dice?.sides === 100 && dice.count === 1 ? 100 : value
}

// --- GT3: citações a outras tabelas -------------------------------------------------

export interface TableRef {
  /** Livro da tabela citada ("in the PHB" muda o livro; senão, o mesmo). */
  book: string
  number: string
  /** Posição no texto, para virar link. */
  start: number
  end: number
}

const bookNames = ['PHB', 'DMG', 'CPrH', 'CFH', 'CPaH', 'CRH', 'CBarbH', 'CBH', 'CNH', 'CTH', 'CPsiH', 'DSC', 'DK', 'WatW']
const refPattern = new RegExp(`Table\\s+(\\d+[A-Za-z]?)(?:\\s*(?::[^,;.()]*)?\\s*(?:in|of|from)\\s+the\\s+(${bookNames.join('|')}))?`, 'g')

/** "Roll on Table 116 instead" → [{ book, number: "116", … }]; "use Table 31 in the PHB" troca o livro. */
export function tableRefs(text: string, book: string): TableRef[] {
  const refs: TableRef[] = []
  for (const match of text.matchAll(refPattern)) {
    const start = match.index ?? 0
    // O link cobre só "Table N" (o resto da citação continua texto).
    const head = /^Table\s+\d+[A-Za-z]?/.exec(match[0])![0]
    refs.push({ book: match[2] ?? book, number: match[1], start, end: start + head.length })
  }
  return refs
}

/** Citações de uma linha inteira (para "Roll on Table N" depois de uma rolagem). */
export function rowRefs(row: string[], book: string): TableRef[] {
  return row.flatMap((cell) => tableRefs(cell, book))
}
