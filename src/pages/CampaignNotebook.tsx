import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { PageBeads } from '../components/SheetBits'
import { campaignTitle } from '../lib/campaigns'
import { paperStyles, useNotebook, type NotebookPage } from '../lib/notebook'
import { supabase } from '../lib/supabase'
import { useConfirm } from '../lib/useConfirm'

// Caderno da campanha (CampaignNotebookView do iPad): uma folha por vez,
// bolinhas numeradas em ordem de data, "+" para folha nova; cada folha com
// título, texto e o papel (liso, pautado ou quadriculado).

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

export function CampaignNotebook() {
  const { id } = useParams()
  const { session, loading, signInWithGoogle } = useAuth()
  const userID = session?.user.id ?? null
  const { pages, error, saving, update, addPage, deletePage } = useNotebook(id, userID)
  const [name, setName] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()
  const [actionError, setActionError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void supabase
      .from('campaign')
      .select('name')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setName(campaignTitle((data as { name: string } | null) ?? { name: '' }))
      })
    return () => {
      cancelled = true
    }
  }, [userID, id])

  const list = pages ?? []
  // Sem escolha na URL, abre a folha mais recente.
  const asked = Number(params.get('page'))
  const current = asked >= 1 && asked <= list.length ? asked : list.length
  const page = list[current - 1]
  const select = (n: number) => setParams({ page: String(n) }, { replace: true })

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
    <div className="paper-page">
      {dialog}
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to={`/campaigns/${id}`} className="paper-link">
            ‹ {name ?? 'Campaign'}
          </Link>
          <span className="paper-soft">{saving ? 'Saving…' : ''}</span>
        </div>
        <h1 className="paper-title">Notebook</h1>

        {loading && <p className="paper-soft">Checking your session…</p>}
        {!loading && !session && (
          <>
            <p className="paper-soft">Sign in to open the notebook.</p>
            <button className="paper-link" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          </>
        )}
        {(error || actionError) && <p className="paper-soft save-error">Not saved: {actionError ?? error}</p>}
        {session && pages === null && !error && <p className="paper-soft">Loading the notebook…</p>}

        {pages !== null && (
          <>
            <PageBeads titles={list.map((p) => p.title || longDate(p.date))} current={current} onSelect={select} onAdd={() => void add()} />
            {list.length === 0 && <p className="paper-soft">No pages yet — start your campaign notebook with the “+” above.</p>}
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
      </div>
    </div>
  )
}
