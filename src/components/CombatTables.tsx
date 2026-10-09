import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { quickTableIDs, quickTableLabel, resolveQuickTables, toggleQuickTable } from '../rules/quickTables'
import { filterTables, tableLabel, type GrimoireTable } from '../rules/tableIndex'
import { PaperModal } from './DetailBits'

// Tabelas rápidas do Combat Tracker (CT4, docs/controle-de-combate.md): a
// faixa de chips com as tabelas de combate; cada uma abre a janela do Table
// Grimoire. O DM edita a lista (tira, põe qualquer tabela, volta ao padrão).
// A regra está em src/rules/quickTables.ts.

export function QuickTables({
  tables,
  saved,
  onSave,
  onOpen,
}: {
  tables: GrimoireTable[]
  /** Lista do DM nas configurações (null = a padrão). */
  saved: string[] | null | undefined
  onSave: (next: string[] | null) => void
  onOpen: (table: GrimoireTable) => void
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const list = resolveQuickTables(quickTableIDs(saved), tables)
  return (
    <div className="quick-tables">
      <span className="paper-label">Tables</span>
      <div className="chip-row quick-tables-row">
        {list.map((t) => (
          <span key={t.id} className="quick-table">
            <button className="chip" title={`${tableLabel(t)} · ${t.book}`} onClick={() => onOpen(t)}>
              {quickTableLabel(t)}
            </button>
            {editing && (
              <button className="cg-link" aria-label={`Remove ${tableLabel(t)}`} onClick={() => onSave(toggleQuickTable(saved, t.id))}>
                ×
              </button>
            )}
          </span>
        ))}
        {editing && (
          <>
            <button className="chip chip-on" onClick={() => setAdding(true)}>
              + Table
            </button>
            {saved && (
              <button className="chip" onClick={() => onSave(null)}>
                Reset
              </button>
            )}
          </>
        )}
        <button className="paper-link" onClick={() => setEditing(!editing)}>
          {editing ? 'done' : 'edit list'}
        </button>
      </div>
      {adding && <AddTableWindow tables={tables} chosen={list.map((t) => t.id)} onPick={(t) => onSave(toggleQuickTable(saved, t.id))} onClose={() => setAdding(false)} />}
    </div>
  )
}

/** Busca no Table Grimoire (número, título ou conteúdo) para pôr na faixa. */
function AddTableWindow({ tables, chosen, onPick, onClose }: { tables: GrimoireTable[]; chosen: string[]; onPick: (t: GrimoireTable) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => (query.trim() ? filterTables(tables, { query, book: null, setting: null, chapter: null }, []).slice(0, 40) : []), [tables, query])
  return createPortal(
    <PaperModal title="Add a table" subtitle="Any table from the Table Grimoire" onClose={onClose}>
      <input className="paper-search" type="search" autoFocus placeholder="number, title or content" aria-label="Search tables" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul className="monster-list">
        {results.map((t) => {
          const on = chosen.includes(t.id)
          return (
            <li key={t.id}>
              <button
                className="spell-row kit-row"
                disabled={on}
                onClick={() => {
                  onPick(t)
                  onClose()
                }}
              >
                <span className="kit-row-top">
                  <span className="spell-name">{tableLabel(t)}</span>
                  <span className="spell-meta">{on ? 'already in the list' : t.book}</span>
                </span>
                <span className="kit-summary">
                  Ch. {t.chapterNumber}: {t.chapterTitle}
                  {t.setting !== 'Core' ? ` · ${t.setting}` : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </PaperModal>,
    document.body,
  )
}
