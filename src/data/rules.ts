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

// O texto da regra em blocos (parágrafos, títulos, listas, tabelas) fica em
// src/rules/ruleContent.ts (função pura, com testes).
export { parseRuleContent, type RuleBlock } from '../rules/ruleContent'
