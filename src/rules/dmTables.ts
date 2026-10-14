// Tabelas do mestre (GT5, 2026-10-14; docs/grimorio-de-tabelas.md). Só funções
// puras: a tabela do mestre no formato das tabelas dos livros (para listar e
// rolar com o mesmo motor) e os avisos das faixas no editor.

import { diceRange, formatDice, parseDice } from './dice.ts'
import type { GrimoireTable } from './tableIndex.ts'
import { parseRange, rollPlan } from './tableRoll.ts'

/** `dm_table.data` no servidor. */
export interface DmTableData {
  title: string
  /** Dado da tabela ("d20", "1d8+1d12"); vazio = só consulta (sem Roll). */
  dice: string
  /** Cabeçalhos; o primeiro é o da coluna das faixas. */
  headers: string[]
  /** Linhas; a primeira célula é a faixa ("1", "2-5", "96-00", "13+"). */
  rows: string[][]
  notes?: string
  /** De onde veio, quando copiada de uma tabela de livro ("DMG Table 54"). */
  source?: string
}

/** Livro das tabelas do mestre no Table Grimoire (não é um livro de data/books.json). */
export const DM_BOOK = 'DM'

export const emptyDmTable = (): DmTableData => ({
  title: '',
  dice: 'd6',
  headers: ['Roll', 'Result'],
  rows: [1, 2, 3, 4, 5, 6].map((n) => [String(n), '']),
})

/**
 * A tabela do mestre como uma tabela do Table Grimoire: o dado vai no primeiro
 * cabeçalho ("d20 Roll"), que é onde o motor de rolagem o procura.
 */
export function asGrimoireTable(id: string, data: DmTableData, campaignName: string): GrimoireTable {
  const spec = parseDice(data.dice)
  const first = data.headers[0]?.trim() || 'Roll'
  // Sem dado, a tabela é só de consulta: o cabeçalho não pode falar em "roll"/"dice"
  // (o motor tornaria a tabela rolável pelo nome da coluna).
  const plain = first.replace(/\b(roll|rolls|dice|die)\b/gi, '').trim() || 'Value'
  return {
    id: `dm-${id}`,
    book: DM_BOOK,
    setting: 'Your tables',
    number: null,
    title: data.title.trim() || 'Untitled table',
    chapterNumber: 0,
    chapterTitle: campaignName,
    ruleID: '',
    ruleTopic: '',
    headers: [spec ? `${formatDice(spec)} ${first}`.trim() : plain, ...data.headers.slice(1)],
    rows: data.rows,
    alsoIn: [],
  }
}

/** Avisos do editor (vazio = tudo certo): dado, faixas inválidas, buracos, sobreposições, fora do dado. */
export function dmTableProblems(data: DmTableData): string[] {
  const problems: string[] = []
  if (data.title.trim() === '') problems.push('Give the table a title.')
  const spec = data.dice.trim() === '' ? null : parseDice(data.dice)
  if (data.dice.trim() !== '' && !spec) problems.push(`“${data.dice}” is not a die (try d20, 2d6 or 1d8+1d12).`)
  if (data.rows.length === 0) problems.push('Add at least one row.')
  const bad = data.rows.map((r, i) => (parseRange(r[0] ?? '') ? null : i + 1)).filter((n): n is number => n !== null)
  if (bad.length > 0) problems.push(`Row${bad.length > 1 ? 's' : ''} ${bad.join(', ')}: the first column must be a number or a range (“3”, “4-6”, “13+”).`)
  if (bad.length > 0 || data.rows.length === 0) return problems
  const ranges = data.rows.map((r) => parseRange(r[0] ?? '')!)
  // "00" (ou "0" depois de faixas até 99) vale 100, como no motor de rolagem.
  if (Math.max(...ranges.map((r) => r.high)) === 99) for (const r of ranges) if (r.low === 0 && r.high === 0) r.low = r.high = 100
  const sorted = [...ranges].sort((a, b) => a.low - b.low)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (cur.low <= prev.high) problems.push(`Ranges overlap around ${cur.low}.`)
    else if (Number.isFinite(prev.high) && cur.low > prev.high + 1) problems.push(`No row for ${prev.high + 1 === cur.low - 1 ? prev.high + 1 : `${prev.high + 1}–${cur.low - 1}`}.`)
  }
  if (spec) {
    const [min, max] = diceRange(spec)
    const low = sorted[0].low
    const last = sorted[sorted.length - 1]
    const high = Number.isFinite(last.high) ? last.high : max
    if (low > min) problems.push(`No row for ${low - 1 === min ? min : `${min}–${low - 1}`} (${formatDice(spec)} starts at ${min}).`)
    if (high < max) problems.push(`No row for ${high + 1 === max ? max : `${high + 1}–${max}`} (${formatDice(spec)} goes up to ${max}).`)
    if (low < min || high > max) problems.push(`Some rows fall outside ${formatDice(spec)} (${min}–${max}).`)
  }
  return problems
}

/**
 * "Copy to my tables" (GT5b): a tabela do livro vira uma tabela do mestre
 * editável. O dado sai do plano de rolagem (o mesmo do Roll); o primeiro
 * cabeçalho perde a notação de dado, que volta ao abrir (`asGrimoireTable`).
 */
export function fromBookTable(table: GrimoireTable, label: string): DmTableData {
  const plan = rollPlan(table)
  const first = (table.headers[0] ?? '').replace(/\(?\s*\d*d(?:\d+|%)(?:\s*\+\s*\d*d(?:\d+|%))*\s*\)?/gi, ' ').replace(/\s+/g, ' ').trim()
  return {
    title: table.title,
    dice: plan?.dice ? formatDice(plan.dice) : '',
    headers: [first || 'Roll', ...table.headers.slice(1)],
    rows: table.rows.map((row) => [...row]),
    source: label,
  }
}
