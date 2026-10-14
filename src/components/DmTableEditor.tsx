import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConfirm } from '../lib/useConfirm'
import { dmTableProblems, type DmTableData } from '../rules/dmTables'
import { PaperModal } from './DetailBits'

// Editor de uma tabela do mestre (GT5, 2026-10-14): título, dado, colunas e
// linhas (a primeira coluna é a faixa), com os avisos das faixas; grava pela
// função `onSave` (nova ou existente) e apaga com confirmação.

const DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', '2d6', '3d6', '1d8+1d12']

export function DmTableEditor({
  initial,
  campaignName,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  initial: DmTableData
  campaignName: string
  isNew: boolean
  onSave: (data: DmTableData) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) {
  const [data, setData] = useState<DmTableData>(() => structuredClone(initial))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()
  const problems = dmTableProblems(data)
  const width = data.headers.length

  const change = (mutate: (d: DmTableData) => void) =>
    setData((current) => {
      const next = structuredClone(current)
      mutate(next)
      return next
    })

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setBusy(false)
    }
  }

  const save = () => run(() => onSave({ ...data, title: data.title.trim(), dice: data.dice.trim() }))

  async function remove() {
    if (!onDelete) return
    if (!(await confirm(`Delete “${data.title || 'this table'}”? The server keeps a copy in the history.`, 'Delete'))) return
    await run(onDelete)
  }

  // Linha nova: a faixa continua de onde a última parou.
  const addRow = () =>
    change((d) => {
      const last = d.rows[d.rows.length - 1]?.[0] ?? '0'
      const top = Number(/(\d+)\s*$/.exec(last)?.[1] ?? 0)
      d.rows.push([String(top + 1), ...Array.from({ length: d.headers.length - 1 }, () => '')])
    })

  return createPortal(
    <PaperModal title={isNew ? 'New table' : 'Edit table'} subtitle={`Your tables · ${campaignName}`} onClose={onClose} wide>
      <div className="dm-table-editor">
        <label className="dm-table-field">
          <span className="paper-label">Title</span>
          <input className="paper-search" value={data.title} placeholder="e.g. Forest encounters" autoFocus={isNew} onChange={(e) => change((d) => void (d.title = e.target.value))} />
        </label>
        <label className="dm-table-field">
          <span className="paper-label">Die</span>
          <input className="paper-search dm-table-dice" value={data.dice} placeholder="none (look-up only)" list="dm-table-dice" onChange={(e) => change((d) => void (d.dice = e.target.value))} />
          <datalist id="dm-table-dice">
            {DICE.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </label>

        <div className="rule-table">
          <div className="rule-table-scroll">
            <table>
              <thead>
                <tr>
                  {data.headers.map((header, c) => (
                    <th key={c}>
                      <input
                        className="dm-table-cell"
                        value={header}
                        aria-label={`Column ${c + 1} title`}
                        onChange={(e) => change((d) => void (d.headers[c] = e.target.value))}
                      />
                    </th>
                  ))}
                  <th className="dm-table-actions">
                    <button className="paper-link" title="Add a column" onClick={() => change((d) => (d.headers.push(''), d.rows.forEach((r) => r.push(''))))}>
                      + col
                    </button>
                    {width > 2 && (
                      <button className="paper-link" title="Remove the last column" onClick={() => change((d) => (d.headers.pop(), d.rows.forEach((r) => r.pop())))}>
                        − col
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>
                        <input
                          className={c === 0 ? 'dm-table-cell dm-table-range' : 'dm-table-cell'}
                          value={cell}
                          aria-label={c === 0 ? `Row ${r + 1} range` : `Row ${r + 1}, ${data.headers[c] || `column ${c + 1}`}`}
                          onChange={(e) => change((d) => void (d.rows[r][c] = e.target.value))}
                        />
                      </td>
                    ))}
                    <td className="dm-table-actions">
                      <button className="paper-link" title="Remove this row" aria-label={`Remove row ${r + 1}`} onClick={() => change((d) => void d.rows.splice(r, 1))}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <button className="paper-link" onClick={addRow}>+ row</button>

        <label className="dm-table-field">
          <span className="paper-label">Notes</span>
          <textarea className="paper-search" rows={2} value={data.notes ?? ''} placeholder="optional" onChange={(e) => change((d) => void (d.notes = e.target.value))} />
        </label>
        {data.source && <p className="paper-soft">Copied from {data.source}.</p>}

        {problems.length > 0 && (
          <ul className="paper-soft dm-table-problems">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {error && <p className="paper-soft save-error">Could not save: {error}</p>}
        <div className="slot-actions">
          {onDelete ? (
            <button className="paper-link" disabled={busy} onClick={() => void remove()}>
              delete table
            </button>
          ) : (
            <span />
          )}
          {/* Faixas com buraco não impedem gravar (o mestre pode querer assim); o título sim. */}
          <button className="consequence-apply" disabled={busy || data.title.trim() === ''} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {dialog}
    </PaperModal>,
    document.body,
  )
}
