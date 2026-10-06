import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { dateFromInput, dateInputValue } from '../lib/campaigns'
import { startSessionDay, useCampaignSessions, type SessionRow, type SheetRef } from '../lib/campaignSessions'
import { useConfirm } from '../lib/useConfirm'
import { hasSpellSheet } from '../rules/rules'

// Seção "Sessions" do detalhe da campanha (CampaignIndexView do iPad):
// sessões ativas agrupadas por mês, as fechadas em "old sessions"; cada uma
// com título, resumo e os dias de magia de cada conjurador do elenco.

interface Member {
  id: string
  name: string | null
  character_class: string | null
  status: string | null
}

const monthLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

function NewSessionForm({ onCreate }: { onCreate: (date: string, title: string) => Promise<void> }) {
  const [date, setDate] = useState(() => dateInputValue(new Date().toISOString()))
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const create = async () => {
    const iso = dateFromInput(date)
    if (!iso) return
    setBusy(true)
    try {
      await onCreate(iso, title)
      setTitle('')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="session-new">
      <input type="date" className="ember-input ember-date" aria-label="Real-world table date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input
        className="ember-input"
        placeholder="title (optional), e.g. The Tower of Elturel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void create()
        }}
      />
      <button className="btn" disabled={busy || !date} onClick={() => void create()}>
        + New session
      </button>
    </div>
  )
}

function SessionItem({
  session,
  casters,
  sheets,
  onChange,
  onDelete,
  onStartDay,
}: {
  session: SessionRow
  casters: Member[]
  sheets: SheetRef[]
  onChange: (patch: Partial<SessionRow>, now?: boolean) => void
  onDelete: () => void
  onStartDay: (characterID: string) => void
}) {
  return (
    <li className="session-item">
      <div className="session-head">
        <span className="smallcaps session-date">{shortDate(session.date)}</span>
        <input
          className="ember-input session-title"
          value={session.title}
          placeholder="unnamed session"
          aria-label="Session title"
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <button className="btn btn-small" onClick={() => onChange({ is_archived: !session.is_archived }, true)}>
          {session.is_archived ? 'Reopen' : 'Close'}
        </button>
        <button className="btn btn-small btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
      <textarea
        className="ember-input ember-notes session-summary"
        value={session.summary}
        placeholder="what happened at the table…"
        rows={2}
        aria-label="Session summary"
        onChange={(e) => onChange({ summary: e.target.value })}
      />
      {casters.length > 0 && (
        <div className="session-days">
          {casters.map((c) => {
            const days = sheets
              .filter((s) => s.session_id === session.id && s.character_id === c.id)
              .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
            const latest = days[days.length - 1]
            const name = c.name || 'Unnamed character'
            return latest ? (
              <Link key={c.id} className="session-day" to={`/characters/${c.id}?view=spells&sheet=${latest.id}`}>
                {name}: {days.length === 1 ? '1 day' : `${days.length} days`} ›
              </Link>
            ) : (
              <button key={c.id} className="session-day session-day-new" onClick={() => onStartDay(c.id)}>
                {name}: start Day 1
              </button>
            )
          })}
        </div>
      )}
    </li>
  )
}

export function CampaignSessions({ campaignID, userID, cast }: { campaignID: string; userID: string | null; cast: Member[] }) {
  const { sessions, sheets, error, saving, update, createSession, deleteSession } = useCampaignSessions(campaignID, userID)
  const [showOld, setShowOld] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()
  const navigate = useNavigate()

  const casters = cast.filter((c) => c.status !== 'dead' && c.status !== 'archived' && c.character_class && hasSpellSheet(c.character_class))
  const active = (sessions ?? []).filter((s) => !s.is_archived)
  const old = (sessions ?? []).filter((s) => s.is_archived)
  const groups: { label: string; items: SessionRow[] }[] = []
  for (const s of active) {
    const label = monthLabel(s.date)
    const group = groups.find((g) => g.label === label)
    if (group) group.items.push(s)
    else groups.push({ label, items: [s] })
  }

  async function guard(action: () => Promise<void>) {
    setActionError(null)
    try {
      await action()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  async function remove(session: SessionRow) {
    const days = sheets.filter((s) => s.session_id === session.id).length
    const ok = await confirm(
      <>
        Delete <b>{session.title || 'this session'}</b> ({shortDate(session.date)})?
        {days > 0 ? ` Its ${days === 1 ? 'spell day goes' : `${days} spell days go`} with it.` : ''} The server keeps a copy in the history.
      </>,
      'Delete session',
    )
    if (ok) await guard(() => deleteSession(session.id))
  }

  const item = (s: SessionRow) => (
    <SessionItem
      key={s.id}
      session={s}
      casters={casters}
      sheets={sheets}
      onChange={(patch, now) => update(s.id, patch, now)}
      onDelete={() => void remove(s)}
      onStartDay={(characterID) =>
        void guard(async () => {
          await startSessionDay(characterID, s.id)
          navigate(`/characters/${characterID}?view=spells`)
        })
      }
    />
  )

  return (
    <section className="ember-card">
      <h2 className="card-title">
        Sessions{sessions ? ` (${sessions.length})` : ''}
        {saving && <span className="soft session-saving"> saving…</span>}
      </h2>
      <NewSessionForm onCreate={(date, title) => guard(() => createSession(date, title))} />
      {(error || actionError) && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>{actionError ?? error}</span>
        </div>
      )}
      {sessions === null && !error && <p className="soft">Loading sessions…</p>}
      {sessions !== null && active.length === 0 && <p className="soft">No sessions yet — start one above.</p>}
      {groups.map((g) => (
        <div key={g.label}>
          <div className="smallcaps">{g.label}</div>
          <ul className="session-list">{g.items.map(item)}</ul>
        </div>
      ))}
      {old.length > 0 && (
        <>
          <button className="disclosure" aria-expanded={showOld} onClick={() => setShowOld((v) => !v)}>
            {showOld ? '▾' : '▸'} old sessions ({old.length})
          </button>
          {showOld && <ul className="session-list">{old.map(item)}</ul>}
        </>
      )}
      {dialog}
    </section>
  )
}
