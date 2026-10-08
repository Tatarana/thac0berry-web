import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DmOnly } from '../components/DmOnly'
import { TableDetail, type RollRecord } from '../components/TableDetail'
import { bookOrder } from '../data/rules'
import { loadTables } from '../data/tables'
import { formatDice, type DiceSpec } from '../rules/dice'
import { filterTables, tableChapters, tableLabel, type GrimoireTable } from '../rules/tableIndex'
import { rollPlan } from '../rules/tableRoll'


// Linhas antes do "Show all" (como nos monstros); a busca e os filtros valem para todas.
const ROW_LIMIT = 150

// Table Grimoire (ferramenta do DM, docs/grimorio-de-tabelas.md): as tabelas
// de todos os livros, com busca (número, título, conteúdo) e filtro por
// cenário, livro e capítulo; a ficha abre por cima.
export function TableGrimoire() {
  return (
    <DmOnly>
      <TableList />
    </DmOnly>
  )
}

function TableList() {
  const [tables, setTables] = useState<GrimoireTable[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [setting, setSetting] = useState<string | null>(null)
  const [book, setBook] = useState<string | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [rollableOnly, setRollableOnly] = useState(false)
  // Tabela aberta; `autoRoll` quando veio de "Roll on Table N"; `opened` troca a
  // chave da ficha (a mesma tabela aberta de novo começa limpa).
  const [selected, setSelected] = useState<{ table: GrimoireTable; autoRoll: boolean; opened: number } | null>(null)
  // Histórico de rolagens e consultas desta visita (todas as tabelas, mais recente primeiro).
  const [history, setHistory] = useState<RollRecord[]>([])
  const open = (table: GrimoireTable, autoRoll: boolean) => setSelected((current) => ({ table, autoRoll, opened: (current?.opened ?? 0) + 1 }))

  useEffect(() => {
    loadTables()
      .then(setTables)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const all = useMemo(() => tables ?? [], [tables])
  const settings = useMemo(() => [...new Set(all.map((t) => t.setting))].sort((a, b) => (a === 'Core' ? -1 : b === 'Core' ? 1 : a.localeCompare(b))), [all])
  const books = useMemo(() => bookOrder.filter((b) => all.some((t) => t.book === b && (!setting || t.setting === setting))), [all, setting])
  const chapters = useMemo(() => (book ? tableChapters(all, book) : []), [all, book])
  // Dado de cada tabela que rola (motor de rolagem, src/rules/tableRoll.ts).
  const dice = useMemo(() => {
    const map = new Map<string, DiceSpec>()
    for (const t of all) {
      const spec = rollPlan(t)?.dice
      if (spec) map.set(t.id, spec)
    }
    return map
  }, [all])
  const filtered = useMemo(
    () => filterTables(all, { query, book, setting, chapter }, bookOrder).filter((t) => !rollableOnly || dice.has(t.id)),
    [all, query, book, setting, chapter, rollableOnly, dice],
  )
  const rows = showAll ? filtered : filtered.slice(0, ROW_LIMIT)

  const pickSetting = (next: string | null) => {
    setSetting(next)
    setBook(null)
    setChapter(null)
  }
  const pickBook = (next: string | null) => {
    setBook(next)
    setChapter(null)
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/dm" className="paper-link">‹ DM Tools</Link>
        </div>
        <h1 className="paper-title">Table Grimoire</h1>
        <p className="paper-soft">
          {tables ? `${filtered.length} of ${tables.length} tables` : error ? `Could not load: ${error}` : 'Loading tables…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="table number, name or contents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search tables"
        />
        {settings.length > 1 && (
          <div className="paper-filter">
            <span className="paper-label">Setting</span>
            <div className="chip-row">
              <button className={setting === null ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(null)}>All</button>
              {settings.map((name) => (
                <button key={name} className={setting === name ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="paper-filter">
          <span className="paper-label">Kind</span>
          <div className="chip-row">
            <button className={!rollableOnly ? 'chip chip-on' : 'chip'} onClick={() => setRollableOnly(false)}>All</button>
            <button className={rollableOnly ? 'chip chip-on' : 'chip'} onClick={() => setRollableOnly(true)}>
              Rollable ({dice.size})
            </button>
          </div>
        </div>
        <div className="paper-filter">
          <span className="paper-label">Book</span>
          <div className="chip-row chip-row-scroll">
            <button className={book === null ? 'chip chip-on' : 'chip'} onClick={() => pickBook(null)}>All</button>
            {books.map((name) => (
              <button key={name} className={book === name ? 'chip chip-on' : 'chip'} onClick={() => pickBook(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
        {chapters.length > 1 && (
          <div className="paper-filter">
            <span className="paper-label">Chapter</span>
            <div className="chip-row chip-row-scroll">
              <button className={chapter === null ? 'chip chip-on' : 'chip'} onClick={() => setChapter(null)}>All</button>
              {chapters.map((ch) => (
                <button key={ch.number} className={chapter === ch.number ? 'chip chip-on' : 'chip'} onClick={() => setChapter(ch.number)}>
                  {ch.number > 0 ? `${ch.number}. ` : ''}
                  {ch.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {tables && filtered.length === 0 && <p className="paper-soft">No tables match — try a different search or filter.</p>}
        <ul className="monster-list">
          {rows.map((t) => (
            <li key={t.id}>
              <button className="spell-row kit-row" onClick={() => open(t, false)}>
                <span className="kit-row-top">
                  <span className="spell-name">{tableLabel(t)}</span>
                  <span className="spell-meta">{dice.get(t.id) ? `roll ${formatDice(dice.get(t.id)!)}` : `${t.rows.length} rows`}</span>
                </span>
                <span className="kit-summary">
                  <span className="monster-collection">{t.book}</span>
                  {` — Ch. ${t.chapterNumber}: ${t.chapterTitle}`}
                  {t.setting !== 'Core' ? ` · ${t.setting}` : ''}
                </span>
              </button>
            </li>
          ))}
          {!showAll && filtered.length > ROW_LIMIT && (
            <li>
              <button className="paper-link show-all" onClick={() => setShowAll(true)}>
                Show all {filtered.length} tables ({filtered.length - ROW_LIMIT} more)
              </button>
            </li>
          )}
        </ul>
      </div>
      {selected && (
        <TableDetail
          key={`${selected.table.id}-${selected.opened}`}
          table={selected.table}
          tables={all}
          autoRoll={selected.autoRoll}
          history={history}
          onRecord={(record) => setHistory((list) => [{ ...record, id: (list[0]?.id ?? 0) + 1 }, ...list].slice(0, 50))}
          onOpen={open}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
