import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CampaignSwitch } from '../components/CampaignChooser'
import { DmOnly } from '../components/DmOnly'
import { TableDetail, type RollRecord } from '../components/TableDetail'
import { loadBooks } from '../data/books'
import { BookCode } from '../components/BookCode'
import { loadTables } from '../data/tables'
import { useCombatStore } from '../lib/combatStore'
import { booksInSetting, settingsOf, type Book } from '../rules/books'
import { formatDice, type DiceSpec } from '../rules/dice'
import { filterTables, tableChapters, tableLabel, type GrimoireTable } from '../rules/tableIndex'
import { quickTableIDs, toggleQuickTable } from '../rules/quickTables'
import { rollPlan } from '../rules/tableRoll'
import { campaignFilterLabel, campaignSettingSet } from '../rules/campaignFilter'
import { useActiveCampaign, useActiveCampaignSettings } from '../lib/activeCampaign'
import { useAuth } from '../auth/context'
import { CopyTableWindow } from '../components/CopyTableWindow'
import { DmTableEditor } from '../components/DmTableEditor'
import { createDmTable, deleteDmTable, fetchDmTables, updateDmTable, type DmTableRow } from '../lib/dmTables'
import { asGrimoireTable, emptyDmTable, fromBookTable, type DmTableData } from '../rules/dmTables'
import { normalize } from '../lib/search'

/** Valor do filtro de cenário "da campanha ativa" (CA3). */
const CAMPAIGN = 'campaign'


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
  // Cenário: começa pelo da campanha ativa (CA3); undefined = ainda não mexeu.
  const campaignSettings = useActiveCampaignSettings()
  const campaignSet = campaignSettingSet(campaignSettings)
  const [settingPick, setSetting] = useState<string | null | undefined>(undefined)
  const setting = settingPick === undefined ? (campaignSet ? CAMPAIGN : null) : settingPick
  const byCampaign = setting === CAMPAIGN && campaignSet !== null
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

  const [bookList, setBookList] = useState<Book[]>([])

  // Tabelas do mestre (GT5): as da campanha ativa (ou do One-shot), só dele.
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const active = useActiveCampaign()
  const activeID = active?.id ?? null
  const activeName = active ? (active.id === null ? 'One-shot' : active.name || 'Unnamed campaign') : ''
  const [dmRows, setDmRows] = useState<DmTableRow[] | null>(null)
  const [dmError, setDmError] = useState<string | null>(null)
  const [dmReload, setDmReload] = useState(0)
  // Editor aberto: a linha que se edita, ou `null` para uma tabela nova.
  const [editing, setEditing] = useState<{ row: DmTableRow | null; data: DmTableData } | null>(null)
  // GT5b: copiar uma tabela do mestre para outra campanha (a janela de escolha) e o aviso do resultado.
  const [copying, setCopying] = useState<DmTableRow | null>(null)
  const [dmNotice, setDmNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!userID || !active) return
    let cancelled = false
    fetchDmTables(userID, activeID)
      .then((rows) => {
        if (!cancelled) setDmRows(rows)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setDmError(reason instanceof Error ? reason.message : String(reason))
      })
    return () => {
      cancelled = true
    }
  }, [userID, activeID, active, dmReload])

  const dmTables = useMemo(() => (dmRows ?? []).map((row) => ({ row, table: asGrimoireTable(row.id, row.data, activeName) })), [dmRows, activeName])
  const dmShown = useMemo(() => {
    const q = normalize(query)
    return q === '' ? dmTables : dmTables.filter(({ table: t }) => normalize([t.title, ...t.headers, ...t.rows.flat()].join(' ')).includes(q))
  }, [dmTables, query])

  async function saveDmTable(data: DmTableData) {
    if (!editing) return
    const saved = editing.row ? await updateDmTable(editing.row, data) : await createDmTable(activeID, data)
    setEditing(null)
    setDmReload((v) => v + 1)
    // A tabela aberta mostra a versão nova.
    setSelected((current) => (current && editing.row && current.table.id === `dm-${editing.row.id}` ? { ...current, table: asGrimoireTable(saved.id, data, activeName) } : current))
  }

  async function copyToCampaign(campaignID: string | null, name: string) {
    if (!copying) return
    const row = copying
    setCopying(null)
    try {
      await createDmTable(campaignID, structuredClone(row.data))
      setDmNotice(`Copied “${row.data.title}” to ${name}.`)
    } catch (reason) {
      setDmNotice(`Could not copy: ${reason instanceof Error ? reason.message : String(reason)}`)
    }
  }

  async function removeDmTable() {
    if (!editing?.row) return
    await deleteDmTable(editing.row)
    setEditing(null)
    setSelected(null)
    setDmReload((v) => v + 1)
  }
  // Fixar tabelas na faixa do Combat Tracker (CT4): a lista fica nas configurações dele.
  const { store: combat, update: updateCombat } = useCombatStore()

  useEffect(() => {
    loadTables()
      .then(setTables)
      .catch((reason: unknown) => setError(String(reason)))
    loadBooks()
      .then(setBookList)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const all = useMemo(() => tables ?? [], [tables])
  // Cenários e livros (data/books.json) que têm tabelas; a ordem é a dos livros.
  const settings = useMemo(() => settingsOf(bookList).filter((name) => all.some((t) => t.setting === name)), [bookList, all])
  const books = useMemo(
    () => (byCampaign ? booksInSetting(bookList, null).filter((b) => campaignSet.has(b.setting)) : booksInSetting(bookList, setting)).filter((b) => all.some((t) => t.book === b.id)),
    [bookList, setting, all, byCampaign, campaignSet],
  )
  const bookOrder = useMemo(() => booksInSetting(bookList, null).map((b) => b.id), [bookList])
  const chapters = useMemo(() => (book ? tableChapters(all, book) : []), [all, book])
  // Dado de cada tabela que rola (motor de rolagem, src/rules/tableRoll.ts).
  const dice = useMemo(() => {
    const map = new Map<string, DiceSpec>()
    for (const t of [...all, ...dmTables.map((d) => d.table)]) {
      const spec = rollPlan(t)?.dice
      if (spec) map.set(t.id, spec)
    }
    return map
  }, [all, dmTables])
  const filtered = useMemo(
    () =>
      filterTables(all, { query, book, setting: byCampaign ? null : setting, chapter }, bookOrder).filter(
        (t) => (!byCampaign || campaignSet.has(t.setting)) && (!rollableOnly || dice.has(t.id)),
      ),
    [all, query, book, setting, chapter, rollableOnly, dice, bookOrder, byCampaign, campaignSet],
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
          <CampaignSwitch />
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
              {campaignSettings && (
                <button className={setting === CAMPAIGN ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(CAMPAIGN)}>
                  {campaignFilterLabel(campaignSettings)}
                </button>
              )}
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
            {books.map((b) => (
              <button key={b.id} className={book === b.id ? 'chip chip-on' : 'chip'} title={b.title} onClick={() => pickBook(b.id)}>
                {b.id}
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

        {/* Tabelas do mestre (GT5): só dele, da campanha ativa. */}
        {active && userID && (
          <section className="dm-tables">
            <div className="dm-tables-head">
              <span className="paper-label">Your tables · {activeName}</span>
              <button className="chip" onClick={() => setEditing({ row: null, data: emptyDmTable() })}>
                + New table
              </button>
            </div>
            {dmError && <p className="paper-soft save-error">Could not load your tables: {dmError}</p>}
            {dmNotice && (
              <p className="paper-soft">
                {dmNotice}{' '}
                <button className="paper-link" onClick={() => setDmNotice(null)}>OK</button>
              </p>
            )}
            {dmRows !== null && dmRows.length === 0 && <p className="paper-soft">None yet — create one, or copy a book table.</p>}
            {dmShown.length > 0 && (
              <ul className="monster-list">
                {dmShown.map(({ table: t }) => (
                  <li key={t.id}>
                    <button className="spell-row kit-row" onClick={() => open(t, false)}>
                      <span className="kit-row-top">
                        <span className="spell-name">{t.title}</span>
                        <span className="spell-meta">{dice.get(t.id) ? `roll ${formatDice(dice.get(t.id)!)}` : `${t.rows.length} rows`}</span>
                      </span>
                      <span className="kit-summary">Your table · {activeName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
                  <span className="monster-collection">
                    <BookCode id={t.book} />
                  </span>
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
          tables={[...all, ...dmTables.map((d) => d.table)]}
          autoRoll={selected.autoRoll}
          history={history}
          onRecord={(record) => setHistory((list) => [{ ...record, id: (list[0]?.id ?? 0) + 1 }, ...list].slice(0, 50))}
          onOpen={open}
          onClose={() => setSelected(null)}
          pin={
            // Tabelas do mestre na faixa do Combat Tracker: backlog (GT5).
            selected.table.book === 'DM'
              ? undefined
              : {
                  pinned: quickTableIDs(combat.settings.quickTables).includes(selected.table.id),
                  onToggle: () => updateCombat((d) => void (d.settings.quickTables = toggleQuickTable(d.settings.quickTables, selected.table.id))),
                }
          }
          onEdit={(() => {
            const found = dmTables.find((d) => d.table.id === selected.table.id)
            return found ? () => setEditing({ row: found.row, data: found.row.data }) : undefined
          })()}
          onCopy={(() => {
            if (!active || !userID) return undefined
            const found = dmTables.find((d) => d.table.id === selected.table.id)
            if (found) return () => setCopying(found.row)
            // Tabela de livro: o editor abre com a cópia (só grava ao salvar).
            const book = selected.table
            return () => setEditing({ row: null, data: fromBookTable(book, `${book.book} ${tableLabel(book)}`) })
          })()}
        />
      )}
      {copying && (
        <CopyTableWindow
          title={copying.data.title}
          currentID={activeID}
          onChoose={(id, name) => void copyToCampaign(id, name)}
          onClose={() => setCopying(null)}
        />
      )}
      {editing && (
        <DmTableEditor
          initial={editing.data}
          campaignName={activeName}
          isNew={editing.row === null}
          onSave={saveDmTable}
          onDelete={editing.row ? removeDmTable : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
