// Table Grimoire (docs/grimorio-de-tabelas.md): junta as tabelas dos livros
// num índice só. Duas origens no rules.json do thac0berry-data: as tabelas
// estruturadas (`tables` de cada regra, PHB/DMG/CPrH) e as tabelas em markdown
// dentro do texto (suplementos), com o título numa linha em negrito acima.
// Só funções puras: roda no build (scripts/build-data.mjs) e nos testes.

import { normalize } from '../lib/search.ts'

export interface SourceTable {
  tableNumber?: string
  title: string
  headers: string[]
  rows: string[][]
}

export interface SourceRule {
  id: string
  book: string
  chapterNumber: number
  chapterTitle: string
  topic: string
  content: string
  tables?: SourceTable[] | null
}

export interface GrimoireTable {
  /** Estável entre gerações: livro + número ("dmg-84"); sem número, a regra e a posição. */
  id: string
  book: string
  /** Cenário de campanha ("Core" para os livros gerais). */
  setting: string
  /** "84", "61a"; null quando o livro não numerou a tabela. */
  number: string | null
  title: string
  chapterNumber: number
  chapterTitle: string
  ruleID: string
  ruleTopic: string
  headers: string[]
  rows: string[][]
  /** Outras regras que trazem a mesma tabela (o rules.json repete algumas). */
  alsoIn: string[]
}

/** Livros de cenário (o resto é "Core"). Ravenloft e os outros chegam com a GT4. */
const settingOfBook: Record<string, string> = { DSC: 'Dark Sun', DK: 'Dark Sun', WatW: 'Dark Sun' }

export const settingOf = (book: string) => settingOfBook[book] ?? 'Core'

/** "Table 84: Treasure Types" → número "84" e título "Treasure Types". */
export function splitTableTitle(raw: string, tableNumber?: string): { number: string | null; title: string } {
  const text = raw.replace(/\*+/g, '').trim().replace(/:$/, '').trim()
  const match = /^Table\s+(\d+[A-Za-z]?)\s*[:.–-]?\s*(.*)$/i.exec(text)
  if (match) return { number: match[1], title: match[2].trim() }
  const fromField = /(\d+[A-Za-z]?)/.exec(tableNumber ?? '')
  return { number: fromField ? fromField[1] : null, title: /^table$/i.test(text) ? '' : text }
}

const cellsOf = (line: string) => {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((cell) => cell.trim())
}

const isSeparator = (line: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line.trim())

/** Tabelas em markdown no texto de uma regra, com o título em negrito logo acima (se houver). */
export function markdownTables(content: string): SourceTable[] {
  const lines = content.split('\n')
  const tables: SourceTable[] = []
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !isSeparator(lines[i + 1])) continue
    let headers = cellsOf(lines[i])
    const rows: string[][] = []
    let j = i + 2
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      if (isSeparator(lines[j])) {
        // Cabeçalho em duas linhas (grupo em cima, colunas embaixo): "Spell Level: 1".
        if (rows.length === 1) {
          const group = headers
          headers = rows.pop()!.map((sub, c) => {
            const top = (group[c] ?? '').replace(/:$/, '').trim()
            return top === '' || top === sub ? sub : sub === '' ? top : `${top}: ${sub}`
          })
        }
        continue
      }
      const cells = cellsOf(lines[j])
      while (cells.length < headers.length) cells.push('')
      rows.push(cells)
    }
    // Título: linha só em negrito até duas linhas não vazias acima da tabela.
    let title = ''
    for (let k = i - 1, seen = 0; k >= 0 && seen < 2; k--) {
      const line = lines[k].trim()
      if (line === '') continue
      seen++
      const bold = /^\*\*(.+?)\*\*:?$/.exec(line)
      if (bold) {
        title = bold[1]
        break
      }
    }
    tables.push({ title, headers, rows })
    i = j - 1
  }
  return tables
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Índice do Table Grimoire: estruturadas e markdown, sem repetidas, na ordem do rules.json. */
export function buildTableIndex(rules: SourceRule[]): GrimoireTable[] {
  const result: GrimoireTable[] = []
  const byKey = new Map<string, GrimoireTable>()
  const ids = new Set<string>()
  for (const rule of rules) {
    const sources = [...(rule.tables ?? []), ...markdownTables(rule.content)]
    sources.forEach((source, index) => {
      const { number, title } = splitTableTitle(source.title, source.tableNumber)
      const key = [rule.book, number, title, JSON.stringify(source.headers), JSON.stringify(source.rows)].join('|')
      const same = byKey.get(key)
      if (same) {
        if (same.ruleID !== rule.id && !same.alsoIn.includes(rule.id)) same.alsoIn.push(rule.id)
        return
      }
      let id = number ? `${slug(rule.book)}-${slug(number)}` : `${rule.id}-${index + 1}`
      for (let n = 2; ids.has(id); n++) id = `${number ? `${slug(rule.book)}-${slug(number)}` : `${rule.id}-${index + 1}`}-${n}`
      ids.add(id)
      const table: GrimoireTable = {
        id,
        book: rule.book,
        setting: settingOf(rule.book),
        number,
        title: title || rule.topic,
        chapterNumber: rule.chapterNumber,
        chapterTitle: rule.chapterTitle,
        ruleID: rule.id,
        ruleTopic: rule.topic,
        headers: source.headers,
        rows: source.rows,
        alsoIn: [],
      }
      byKey.set(key, table)
      result.push(table)
    })
  }
  return result
}

// --- Busca e filtros da tela (/dm/tables) -------------------------------------------

export interface TableFilter {
  query: string
  book: string | null
  setting: string | null
  chapter: number | null
}

/** "Table 84: Treasure Types" (sem número, só o título). */
export const tableLabel = (t: Pick<GrimoireTable, 'number' | 'title'>) => (t.number ? `Table ${t.number}: ${t.title}` : t.title)

const numberValue = (n: string | null) => (n === null ? Number.POSITIVE_INFINITY : Number.parseInt(n, 10))

/**
 * Filtra e ordena: livro, cenário e capítulo; a busca casa o número ("88",
 * "table 88"), o título, o capítulo, a regra e o conteúdo das células. Sem
 * busca, na ordem dos livros (`bookOrder`) e do número; com busca, primeiro o
 * número exato, depois o título, depois o resto.
 */
export function filterTables(tables: GrimoireTable[], f: TableFilter, bookOrder: string[]): GrimoireTable[] {
  const target = normalize(f.query)
  const wantedNumber = /^(?:table\s*)?(\d+[a-z]?)$/.exec(target)?.[1] ?? null
  const scored: { table: GrimoireTable; score: number }[] = []
  for (const t of tables) {
    if (f.book && t.book !== f.book) continue
    if (f.setting && t.setting !== f.setting) continue
    if (f.chapter !== null && t.chapterNumber !== f.chapter) continue
    let score = 0
    if (target !== '') {
      if (wantedNumber && t.number?.toLowerCase() === wantedNumber) score = 3
      else if (normalize(t.title).includes(target)) score = 2
      else if ([t.chapterTitle, t.ruleTopic, ...t.headers, ...t.rows.flat()].some((text) => normalize(text).includes(target))) score = 1
      else continue
    }
    scored.push({ table: t, score })
  }
  const rank = (book: string) => {
    const i = bookOrder.indexOf(book)
    return i < 0 ? bookOrder.length : i
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      rank(a.table.book) - rank(b.table.book) ||
      numberValue(a.table.number) - numberValue(b.table.number) ||
      a.table.title.localeCompare(b.table.title),
  )
  return scored.map((s) => s.table)
}

/** Capítulos que têm tabelas num livro, na ordem (chips do filtro). */
export function tableChapters(tables: GrimoireTable[], book: string): { number: number; title: string }[] {
  const chapters = new Map<number, string>()
  for (const t of tables) if (t.book === book && !chapters.has(t.chapterNumber)) chapters.set(t.chapterNumber, t.chapterTitle)
  return [...chapters.entries()].sort(([a], [b]) => a - b).map(([number, title]) => ({ number, title }))
}
