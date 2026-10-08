// Regras (Rules Reference): PHB, DMG, Complete Handbooks e Psiônicos.
// Formato: schemas/rule-entry.schema.json (thac0berry-data); Models/Rule.swift
// no iPad. Índice leve para lista/busca; texto completo por livro.
import { loadData } from './load'
import { normalize, similarity } from '../lib/search'

export interface RuleIndexEntry {
  id: string
  book: string
  chapterNumber: number
  chapterTitle: string
  topic: string
  summary: string
  searchKeywords: string[]
}

export interface RuleTable {
  tableNumber: string
  title: string
  headers: string[]
  rows: string[][]
}

export interface RuleEntry extends RuleIndexEntry {
  breadcrumbs: string
  ruleType: string
  content: string
  tables: RuleTable[]
  relatedRuleIds: string[]
}

// A ordem dos livros e o cenário de cada um vêm de data/books.json (src/data/books.ts).

export const loadRulesIndex = () => loadData<RuleIndexEntry[]>('rules-index.json')

export async function loadRule(entry: RuleIndexEntry): Promise<RuleEntry | undefined> {
  const book = await loadData<RuleEntry[]>(`rules/${entry.book}.json`)
  return book.find((rule) => rule.id === entry.id)
}

/**
 * Busca aproximada por tópico e palavras-chave (RulesDatabase.matches do
 * iPad): melhor pontuação entre o tópico e cada palavra-chave; mínimo 0,3;
 * até 40 resultados, do mais parecido para o menos. `books`: só esses livros
 * (filtro de livro ou de cenário); null = todos.
 */
export function searchRules(entries: RuleIndexEntry[], text: string, books: ReadonlySet<string> | null, limit = 40): RuleIndexEntry[] {
  const query = normalize(text)
  if (query === '') return []
  const scored: { entry: RuleIndexEntry; score: number }[] = []
  for (const entry of entries) {
    if (books && !books.has(entry.book)) continue
    let best = similarity(query, normalize(entry.topic))
    for (const keyword of entry.searchKeywords) best = Math.max(best, similarity(query, normalize(keyword)))
    if (best >= 0.3) scored.push({ entry, score: best })
  }
  scored.sort((a, b) => b.score - a.score || a.entry.topic.localeCompare(b.entry.topic))
  return scored.slice(0, limit).map((item) => item.entry)
}

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

/**
 * Quebra o texto em blocos (RuleContentParser do iPad): parágrafos separados
 * por linha em branco; "## " / "### " viram títulos; bloco só de "* " vira
 * lista; "[TABLE_REF: …]" sozinho vira a tabela correspondente.
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
    if (restLines.every((line) => line.startsWith('* ') || line.startsWith(':* '))) {
      blocks.push({ kind: 'list', items: restLines.map((line) => (line.startsWith(':* ') ? line.slice(3) : line.slice(2))) })
      continue
    }

    blocks.push({ kind: 'paragraph', text: rest })
  }
  return blocks
}
