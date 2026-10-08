// Texto de uma regra em blocos (RuleContentParser do iPad), para a ficha da
// regra. Além do que o iPad faz (parágrafos, títulos "## "/"### ", listas
// "* ", tabelas estruturadas por "[TABLE_REF: …]"), lê o que vem em markdown
// no texto dos suplementos (2026-10-08): tabelas "| … |" com o título em
// negrito acima, listas "- " e linhas soltas "|  |" (sobra da extração, some).
// Só funções puras.

import type { RuleTable } from '../data/rules.ts'
import { markdownTables, splitTableTitle } from './tableIndex.ts'

export type RuleBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; table: RuleTable }

const tableRefPattern = /^\[TABLE_REF:\s*(.+?)\]$/

function resolveTable(refTitle: string, tables: RuleTable[]): RuleTable | undefined {
  return tables.find((table) => table.title === refTitle) ?? tables.find((table) => refTitle.startsWith(table.tableNumber))
}

const listPrefix = /^(?::?\* |- )/
const isListLine = (line: string) => listPrefix.test(line)
const isTableLine = (line: string) => line.startsWith('|')
/** "|  |", "|": linha de tabela sem conteúdo (sobra da extração). */
const isEmptyTableLine = (line: string) => /^\|(\s*\|)*\s*$/.test(line)

/** Texto comum: linhas de item viram lista; as outras, parágrafo ("Two adjustments apply:" + itens = parágrafo e lista). */
function textBlocks(lines: string[]): RuleBlock[] {
  const blocks: RuleBlock[] = []
  for (const line of lines) {
    const last = blocks[blocks.length - 1]
    if (isListLine(line)) {
      const item = line.replace(listPrefix, '').trim()
      if (item === '') continue
      if (last?.kind === 'list') last.items.push(item)
      else blocks.push({ kind: 'list', items: [item] })
    } else if (line.trim() !== '') {
      if (last?.kind === 'paragraph') last.text += `\n${line}`
      else blocks.push({ kind: 'paragraph', text: line })
    }
  }
  return blocks
}

const cellsOf = (line: string) =>
  line
    .replace(/^\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => cell.trim())

/**
 * Linhas "| … |" sem a linha "---" (a extração perdeu o cabeçalho): com duas
 * ou mais células, tabela sem cabeçalho ("Ability Requirements | Strength 12");
 * com uma só, lista de nomes. null se não der para ler.
 */
function headerlessBlock(run: string[], title: string): RuleBlock | null {
  const rows = run.filter((line) => !isEmptyTableLine(line)).map((line) => cellsOf(line).filter((cell, i, all) => cell !== '' || i < all.length - 1))
  if (rows.length === 0) return null
  if (rows.every((row) => row.filter((cell) => cell !== '').length <= 1)) {
    return { kind: 'list', items: rows.map((row) => row.find((cell) => cell !== '') ?? '').filter((item) => item !== '') }
  }
  const width = Math.max(...rows.map((row) => row.length))
  return {
    kind: 'table',
    table: { tableNumber: splitTableTitle(title).number ?? '', title, headers: [], rows: rows.map((row) => [...row, ...Array<string>(width - row.length).fill('')]) },
  }
}

/** Parágrafo com tabela em markdown: texto antes, a tabela (título do negrito acima) e texto depois. */
function mixedBlocks(lines: string[]): RuleBlock[] {
  const blocks: RuleBlock[] = []
  let text: string[] = []
  const flush = () => {
    blocks.push(...textBlocks(text))
    text = []
  }
  for (let i = 0; i < lines.length; ) {
    if (!isTableLine(lines[i])) {
      text.push(lines[i++])
      continue
    }
    const run: string[] = []
    while (i < lines.length && isTableLine(lines[i])) run.push(lines[i++])
    if (run.every(isEmptyTableLine)) continue
    // O negrito logo acima é o título da tabela (sai do texto).
    const bold = text.length > 0 ? /^\*\*(.+?)\*\*:?$/.exec(text[text.length - 1]) : null
    const parsed = markdownTables(run.join('\n'))
    if (parsed.length === 0) {
      const block = headerlessBlock(run, bold ? bold[1] : '')
      if (!block) {
        text.push(...run)
        continue
      }
      if (bold) text.pop()
      flush()
      blocks.push(block)
      continue
    }
    if (bold) text.pop()
    flush()
    parsed.forEach((table, index) => {
      const title = index === 0 && bold ? bold[1] : table.title
      blocks.push({ kind: 'table', table: { tableNumber: splitTableTitle(title).number ?? '', title, headers: table.headers, rows: table.rows } })
    })
  }
  flush()
  return blocks
}

/** Itens de lista separados por linha em branco viram uma lista só. */
function mergeLists(blocks: RuleBlock[]): RuleBlock[] {
  const out: RuleBlock[] = []
  for (const block of blocks) {
    const last = out[out.length - 1]
    if (block.kind === 'list' && last?.kind === 'list') last.items.push(...block.items)
    else out.push(block)
  }
  return out
}

/**
 * Quebra o texto em blocos: parágrafos separados por linha em branco;
 * "## " / "### " viram títulos; bloco só de "* " ou "- " vira lista;
 * "[TABLE_REF: …]" sozinho vira a tabela estruturada; tabela em markdown vira
 * tabela.
 */
export function parseRuleContent(content: string, tables: RuleTable[]): RuleBlock[] {
  const blocks: RuleBlock[] = []
  for (const rawParagraph of content.split('\n\n')) {
    const paragraph = rawParagraph.trim()
    if (paragraph === '') continue
    let lines = paragraph.split('\n').map((line) => line.trim())
    const first = lines[0]
    if (first.startsWith('### ')) {
      blocks.push({ kind: 'subheading', text: first.slice(4) })
      lines = lines.slice(1)
    } else if (first.startsWith('## ')) {
      blocks.push({ kind: 'heading', text: first.slice(3) })
      lines = lines.slice(1)
    }
    const rest = lines.join('\n').trim()
    if (rest === '') continue

    const ref = tableRefPattern.exec(rest)
    if (ref) {
      const table = resolveTable(ref[1].trim(), tables)
      if (table) {
        blocks.push({ kind: 'table', table })
        continue
      }
    }

    const restLines = rest.split('\n')
    if (restLines.some(isTableLine)) {
      blocks.push(...mixedBlocks(restLines))
      continue
    }
    blocks.push(...textBlocks(restLines))
  }
  return mergeLists(blocks)
}
