import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { campaignTitle, dateFromInput, dateInputValue } from '../lib/campaigns'
import { assignToCampaign, bringBack, cloneCharacter, deleteCharacter, markDead, toggleArchived } from '../lib/roster'
import { supabase } from '../lib/supabase'
import { useConfirm } from '../lib/useConfirm'
import { PaperModal } from './DetailBits'

// Menu "⋯" de um personagem (castMenu/contextMenu do iPad): clonar, marcar
// como morto, arquivar, trazer de volta, mudar de campanha (ou ir para o
// Sandbox) e apagar. Usado na lista de personagens e no elenco da campanha.

export interface ActionTarget {
  id: string
  name: string | null
  status: string | null
  campaign_id: string | null
}

/** MarkDeadSheet do iPad: data e "como aconteceu" (opcional). */
function MarkDeadWindow({ name, onConfirm, onClose }: { name: string; onConfirm: (diedOn: string, note: string) => void; onClose: () => void }) {
  const [date, setDate] = useState(() => dateInputValue(new Date().toISOString()))
  const [note, setNote] = useState('')
  return createPortal(
    <PaperModal title={`Mark ${name} as dead`} onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Date</span>
        <input type="date" className="ink-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">How did it happen? (optional)</span>
        <input className="ink-input" value={note} placeholder="e.g. Swallowed by a purple worm" onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="slot-actions">
        <button className="paper-link" onClick={onClose}>cancel</button>
        <button
          className="consequence-apply danger-apply"
          disabled={!dateFromInput(date)}
          onClick={() => {
            const diedOn = dateFromInput(date)
            if (diedOn) onConfirm(diedOn, note)
          }}
        >
          mark as dead
        </button>
      </div>
    </PaperModal>,
    document.body,
  )
}

/** "Assign to campaign" do iPad: as campanhas da conta, mais o Sandbox. */
function MoveWindow({ current, onChoose, onClose }: { current: string | null; onChoose: (campaignID: string | null) => void; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; is_archived: boolean }[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void supabase
      .from('campaign')
      .select('id, name, is_archived')
      .is('deleted_at', null)
      .order('name')
      .then(({ data }) => {
        if (!cancelled) setCampaigns((data ?? []) as { id: string; name: string; is_archived: boolean }[])
      })
    return () => {
      cancelled = true
    }
  }, [])
  const same = (id: string) => current?.toUpperCase() === id.toUpperCase()
  return createPortal(
    <PaperModal title="Move to…" onClose={onClose}>
      {campaigns === null && <p className="paper-soft">Loading campaigns…</p>}
      <ul className="slot-choices">
        {current && (
          <li>
            <button className="slot-choice" onClick={() => onChoose(null)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">Sandbox</span>
              <span className="rec-soft">no campaign</span>
            </button>
          </li>
        )}
        {(campaigns ?? [])
          .filter((c) => !same(c.id))
          .map((c) => (
            <li key={c.id}>
              <button className="slot-choice" onClick={() => onChoose(c.id)}>
                <span className="slot-choice-fav" />
                <span className="rec-value">{campaignTitle(c)}</span>
                <span className="rec-soft">{c.is_archived ? 'archived' : ''}</span>
              </button>
            </li>
          ))}
      </ul>
    </PaperModal>,
    document.body,
  )
}

export function CharacterActions({ character, onChanged }: { character: ActionTarget; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [windowKind, setWindowKind] = useState<'dead' | 'move' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()
  const box = useRef<HTMLDivElement>(null)
  const name = character.name || 'Unnamed character'
  const alive = character.status !== 'dead' && character.status !== 'archived'

  // Fecha o menu ao clicar fora.
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function run(action: () => Promise<unknown>) {
    setOpen(false)
    setWindowKind(null)
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setOpen(false)
    const ok = await confirm(
      <>
        Delete <b>{name}</b>? The sheet, spell days and notebook go with it. The server keeps a copy in the history.
      </>,
      'Delete character',
    )
    if (ok) await run(() => deleteCharacter(character.id))
  }

  const item = (label: string, action: () => void, danger = false) => (
    <button className={danger ? 'actions-item actions-danger' : 'actions-item'} role="menuitem" onClick={action}>
      {label}
    </button>
  )

  return (
    <div className="actions" ref={box}>
      <button
        className="actions-button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
      >
        {busy ? '…' : '⋯'}
      </button>
      {open && (
        <div className="actions-menu" role="menu">
          {item('Clone character', () => void run(() => cloneCharacter(character.id, character.campaign_id)))}
          {alive ? (
            <>
              {item('Mark as dead', () => {
                setOpen(false)
                setWindowKind('dead')
              }, true)}
              {item('Archive', () => void run(() => toggleArchived(character.id)))}
            </>
          ) : (
            item('Bring back to active cast', () => void run(() => bringBack(character.id)))
          )}
          {item(character.campaign_id ? 'Move to campaign or Sandbox…' : 'Assign to campaign…', () => {
            setOpen(false)
            setWindowKind('move')
          })}
          {item('Delete character', () => void remove(), true)}
        </div>
      )}
      {error && <div className="actions-error">✖ {error}</div>}
      {windowKind === 'dead' && (
        <MarkDeadWindow name={name} onClose={() => setWindowKind(null)} onConfirm={(diedOn, note) => void run(() => markDead(character.id, diedOn, note))} />
      )}
      {windowKind === 'move' && (
        <MoveWindow current={character.campaign_id} onClose={() => setWindowKind(null)} onChoose={(campaignID) => void run(() => assignToCampaign(character.id, campaignID))} />
      )}
      {dialog}
    </div>
  )
}
