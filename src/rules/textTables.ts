// Tabelas em markdown dentro de campos de texto longo (itens mágicos, monstros,
// magias, deuses, proficiências): separa o texto das tabelas para a ficha
// mostrar tabelas de verdade. Reaproveita o alinhamento e o separador do
// Table Grimoire (tableIndex.ts). Só funções puras.

import type { RuleTable } from '../data/rules.ts'
import { alignTable, isSeparator, splitTableTitle } from './tableIndex.ts'

export type TextPart = { kind: 'text'; text: string } | { kind: 'table'; table: RuleTable }

const isPipeLine = (line: string) => line.trim().startsWith('|')

/** Células de "| a | b |": respeita "\|" (barra escapada) e tira as barras das pontas. */
export function splitCells(line: string): string[] {
  const cells: string[] = []
  let current = ''
  const text = line.trim()
  for (let i = text.startsWith('|') ? 1 : 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\' && text[i + 1] === '|') {
      current += '|'
      i++
    } else if (ch === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  // O que sobra depois da última barra só conta se tiver texto ("| a | b" sem barra final).
  if (current.trim() !== '') cells.push(current.trim())
  return cells
}

/**
 * Tabela de uma sequência de linhas "| … |": cabeçalho + "---" + linhas, ou
 * "---" logo na primeira linha (cabeçalho perdido, tabela sem cabeçalho).
 * null quando não há linha "---": fica como texto.
 */
function tableOfRun(run: string[], title: string): RuleTable | null {
  let headers: string[]
  let body: string[]
  if (isSeparator(run[0])) {
    headers = []
    body = run.slice(1)
  } else if (run.length > 1 && isSeparator(run[1])) {
    headers = splitCells(run[0])
    body = run.slice(2)
  } else {
    return null
  }
  const rows = body
    .filter((line) => !isSeparator(line))
    .map(splitCells)
    .filter((cells) => cells.some((cell) => cell !== ''))
  if (rows.length === 0 && headers.every((cell) => cell === '')) return null
  const aligned = alignTable(headers, rows)
  // Sem cabeçalho: alignTable devolve cabeçalho vazio do tamanho da linha mais larga.
  return { tableNumber: splitTableTitle(title).number ?? '', title, headers: aligned.headers, rows: aligned.rows }
}

/**
 * Quebra um texto em trechos de texto e tabelas. O texto fica como veio (as
 * quebras de linha seguem valendo); o negrito logo acima da tabela vira o
 * título dela. Sem tabela, devolve o texto inteiro num trecho só.
 */
export function splitTextTables(text: string): TextPart[] {
  const lines = text.split('\n')
  if (!lines.some(isPipeLine)) return [{ kind: 'text', text }]
  const parts: TextPart[] = []
  let pending: string[] = []
  const flush = () => {
    const joined = pending.join('\n').replace(/^\n+|\n+$/g, '')
    if (joined.trim() !== '') parts.push({ kind: 'text', text: joined })
    pending = []
  }
  for (let i = 0; i < lines.length; ) {
    if (!isPipeLine(lines[i])) {
      pending.push(lines[i++])
      continue
    }
    const run: string[] = []
    while (i < lines.length && isPipeLine(lines[i])) run.push(lines[i++])
    // Título: linha só em negrito imediatamente acima (sai do texto).
    const last = pending.length > 0 ? pending[pending.length - 1].trim() : ''
    const bold = /^\*\*(.+?)\*\*:?$/.exec(last)
    const table = tableOfRun(run, bold ? bold[1] : '')
    if (!table) {
      pending.push(...run)
      continue
    }
    if (bold) pending.pop()
    flush()
    parts.push({ kind: 'table', table })
  }
  flush()
  return parts
}
