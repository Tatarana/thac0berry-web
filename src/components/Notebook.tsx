import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { paperStyles, useNotebook, type NotebookPage } from '../lib/notebook'
import { useConfirm } from '../lib/useConfirm'
import { PageBeads } from './SheetBits'

// Caderno do personagem (aba Notebook da ficha do iPad): uma folha por vez,
// bolinhas numeradas em ordem de data, "+" para folha nova; cada folha com
// título, texto e o papel (liso, pautado ou quadriculado). Folhas de desenho
// do iPad aparecem só com o aviso (a imagem chega numa próxima etapa).

const longDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function NotebookSheet({
  page,
  number,
  count,
  onChange,
  onDelete,
}: {
  page: NotebookPage
  number: number
  count: number
  onChange: (patch: Partial<NotebookPage>, now?: boolean) => void
  onDelete: () => void
}) {
  const style = page.paper_style ?? 'plain'
  const freeform = page.kind === 'freeform'
  return (
    <div className="notebook-page">
      <div className="notebook-head">
        <span className="paper-soft">
          page {number} of {count} · {longDate(page.date)} · {freeform ? '✎ free draw' : '✒︎ transcribed'}
        </span>
        <div className="chip-row">
          {paperStyles.map((option) => (
            <button
              key={option.value}
              className={style === option.value ? 'chip chip-on' : 'chip'}
              aria-pressed={style === option.value}
              onClick={() => onChange({ paper_style: option.value }, true)}
            >
              {option.label}
            </button>
          ))}
          <button className="chip" aria-label="Delete page" title="Delete page" onClick={onDelete}>
            ✕
          </button>
        </div>
      </div>
      <input
        className="ink-input notebook-title"
        value={page.title}
        placeholder="untitled page"
        aria-label="Page title"
        onChange={(e) => onChange({ title: e.target.value })}
      />
      {freeform ? (
        <div className={`notebook-paper notebook-${style} notebook-drawing`}>
          <p className="paper-soft">Drawing (iPad only). Freehand pages open on the iPad.</p>
        </div>
      ) : (
        <textarea
          className={`notebook-paper notebook-${style} notebook-text`}
          value={page.text}
          placeholder="Write freely — NPCs met, clues, decisions made…"
          aria-label="Page text"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      )}
    </div>
  )
}

/** Aba Notebook da ficha: o caderno deste personagem. A folha aberta vai na URL (`note`). */
export function Notebook({ characterID, userID }: { characterID: string; userID: string | null }) {
  const { pages, error, saving, update, addPage, deletePage } = useNotebook(characterID, userID)
  const [params, setParams] = useSearchParams()
  const [actionError, setActionError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const list = pages ?? []
  // Sem escolha na URL, abre a folha mais recente.
  const asked = Number(params.get('note'))
  const current = asked >= 1 && asked <= list.length ? asked : list.length
  const page = list[current - 1]
  const select = (n: number) => setParams({ view: 'notebook', note: String(n) }, { replace: true })

  async function guard(action: () => Promise<void>) {
    setActionError(null)
    try {
      await action()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const add = () =>
    guard(async () => {
      if (await addPage()) select(list.length + 1)
    })

  async function remove(target: NotebookPage, number: number) {
    const ok = await confirm(
      <>
        Delete page {number}
        {target.title ? <> (<b>{target.title}</b>)</> : ''}? The server keeps a copy in the history.
      </>,
      'Delete page',
    )
    if (!ok) return
    await guard(async () => {
      await deletePage(target.id)
      select(Math.max(1, number - 1))
    })
  }

  return (
    <section className="notebook">
      {dialog}
      <div className="notebook-top">
        <h2 className="paper-title">Notebook</h2>
        <span className="paper-soft">{saving ? 'Saving…' : ''}</span>
      </div>
      {(error || actionError) && <p className="paper-soft save-error">Not saved: {actionError ?? error}</p>}
      {pages === null && !error && <p className="paper-soft">Loading the notebook…</p>}
      {pages !== null && (
        <>
          <PageBeads titles={list.map((p) => p.title || longDate(p.date))} current={current} onSelect={select} onAdd={() => void add()} />
          {list.length === 0 && <p className="paper-soft">No pages yet — start this character&apos;s notebook with the “+” above.</p>}
          {page && (
            <NotebookSheet
              key={page.id}
              page={page}
              number={current}
              count={list.length}
              onChange={(patch, now) => update(page.id, patch, now)}
              onDelete={() => void remove(page, current)}
            />
          )}
        </>
      )}
    </section>
  )
}
