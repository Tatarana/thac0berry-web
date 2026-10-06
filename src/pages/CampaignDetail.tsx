import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { CampaignSessions } from '../components/CampaignSessions'
import { PaperModal } from '../components/DetailBits'
import { PageHeader } from '../components/PageHeader'
import { campaignSettings, campaignTitle, dateFromInput, dateInputValue, settingLogo, useCampaignDoc } from '../lib/campaigns'
import { assignToCampaign, createCharacter, deleteCampaign } from '../lib/roster'
import { supabase } from '../lib/supabase'
import { useConfirm } from '../lib/useConfirm'
import type { SaveState } from '../lib/useCharacterDoc'

// Detalhe da campanha (CampaignDetailView do iPad): nome, início, anotações,
// ambientações em jogo, arquivar, o elenco com link para cada ficha
// (personagem novo ou trazido do Sandbox) e apagar a campanha.
// Sessões (W3.2) e caderno (W3.3) entram nas próximas etapas.

interface CastMember {
  id: string
  name: string | null
  character_class: string | null
  level: number | null
  status: string | null
}

function SaveLine({ save, onRetry }: { save: SaveState; onRetry: () => void }) {
  switch (save.kind) {
    case 'pending':
    case 'saving':
      return <p className="soft">Saving…</p>
    case 'error':
      return (
        <p className="soft save-error">
          Not saved: {save.message}{' '}
          <button className="btn btn-small" onClick={onRetry}>Retry</button>
        </p>
      )
    default:
      return <p className="soft">{save.at ? `Saved ${new Date(save.at).toLocaleString()}` : ''}</p>
  }
}

function CastList({ members }: { members: CastMember[] }) {
  return (
    <ul className="import-list">
      {members.map((c) => (
        <li key={c.id} className="import-row">
          <Link className="character-link" to={`/characters/${c.id}`}>
            <span className="import-name">{c.name || 'Unnamed character'}</span>
            <div className="soft import-detail">
              {c.character_class ?? '—'} {c.level ?? ''}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** "Add from Sandbox": personagens sem campanha; escolher um traz para esta. */
function SandboxPicker({ onChoose, onClose }: { onChoose: (id: string) => void; onClose: () => void }) {
  const [sandbox, setSandbox] = useState<CastMember[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void supabase
      .from('character')
      .select('id, name, character_class, level, status')
      .is('campaign_id', null)
      .is('deleted_at', null)
      .order('name')
      .then(({ data }) => {
        if (!cancelled) setSandbox((data ?? []) as CastMember[])
      })
    return () => {
      cancelled = true
    }
  }, [])
  return createPortal(
    <PaperModal title="Add from Sandbox" subtitle="Characters not in any campaign yet" onClose={onClose}>
      {sandbox === null && <p className="paper-soft">Loading…</p>}
      {sandbox !== null && sandbox.length === 0 && <p className="paper-soft">The Sandbox is empty.</p>}
      <ul className="slot-choices">
        {(sandbox ?? []).map((c) => (
          <li key={c.id}>
            <button className="slot-choice" onClick={() => onChoose(c.id)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">{c.name || 'Unnamed character'}</span>
              <span className="rec-soft">
                {c.character_class ?? '—'} {c.level ?? ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </PaperModal>,
    document.body,
  )
}

export function CampaignDetail() {
  const { id } = useParams()
  const { session, loading, signInWithGoogle } = useAuth()
  const userID = session?.user.id ?? null
  const { campaign, loadError, save, conflict, dismissConflict, update, retry } = useCampaignDoc(id, userID)
  const [cast, setCast] = useState<CastMember[] | null>(null)
  const [open, setOpen] = useState<{ dead: boolean; archived: boolean }>({ dead: false, archived: false })
  const [castVersion, setCastVersion] = useState(0)
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()
  const navigate = useNavigate()

  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void supabase
      .from('character')
      .select('id, name, character_class, level, status')
      .eq('campaign_id', id)
      .is('deleted_at', null)
      .order('name')
      .then(({ data }) => {
        if (!cancelled) setCast((data ?? []) as CastMember[])
      })
    return () => {
      cancelled = true
    }
  }, [userID, id, castVersion])

  /** Roda uma ação do elenco, mostrando o erro se falhar. */
  async function run(action: () => Promise<void>) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const newCharacter = () =>
    run(async () => {
      if (!id) return
      navigate(`/characters/${await createCharacter(id)}`)
    })

  const addFromSandbox = (characterID: string) => {
    setPicking(false)
    void run(async () => {
      if (!id) return
      await assignToCampaign(characterID, id)
      setCastVersion((v) => v + 1)
    })
  }

  async function removeCampaign() {
    if (!id || !campaign) return
    const count = cast?.length ?? 0
    const ok = await confirm(
      <>
        Delete <b>{campaignTitle(campaign)}</b>? Its sessions and notebook go with it
        {count > 0 ? `; its ${count === 1 ? 'character returns' : `${count} characters return`} to the Sandbox` : ''}. The server keeps a copy in the history.
      </>,
      'Delete campaign',
    )
    if (!ok) return
    await run(async () => {
      await retry()
      await deleteCampaign(id)
      navigate('/campaigns')
    })
  }

  const alive = (cast ?? []).filter((c) => c.status !== 'dead' && c.status !== 'archived')
  const dead = (cast ?? []).filter((c) => c.status === 'dead')
  const archived = (cast ?? []).filter((c) => c.status === 'archived')

  const toggleSetting = (setting: string) => {
    if (!campaign) return
    const current = new Set(campaign.enabled_settings ?? [])
    if (current.has(setting)) current.delete(setting)
    else current.add(setting)
    // Mesma ordem do catálogo; conjunto vazio = sem filtro (o iPad trata igual a nil).
    const next = campaignSettings.filter((s) => current.has(s))
    update({ enabled_settings: next.length > 0 ? next : null })
  }

  return (
    <div className="page">
      <PageHeader title="Campaign" backTo="/campaigns" />

      {loading && <p className="soft">Checking your session…</p>}
      {!loading && !session && (
        <section className="ember-card">
          <p className="soft">Sign in to open this campaign.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          </div>
        </section>
      )}
      {loadError && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>Could not load the campaign: {loadError}</span>
        </div>
      )}
      {session && !loadError && !campaign && <p className="soft">Loading campaign…</p>}

      {campaign && (
        <>
          {conflict && (
            <div className="result-line">
              <span className="result-fail">!</span>
              <span>
                This campaign was also changed somewhere else; your version was kept and the other one is in the history.{' '}
                <button className="btn btn-small" onClick={dismissConflict}>OK</button>
              </span>
            </div>
          )}
          <section className="ember-card">
            <input
              className="ember-input campaign-name"
              value={campaign.name}
              placeholder="unnamed campaign"
              aria-label="Campaign name"
              autoFocus={campaign.name === ''}
              onChange={(e) => update({ name: e.target.value })}
            />
            <div className="campaign-meta">
              <label className="campaign-field">
                <span className="smallcaps">Started</span>
                <input
                  type="date"
                  className="ember-input ember-date"
                  value={dateInputValue(campaign.started_date)}
                  onChange={(e) => {
                    const started = dateFromInput(e.target.value)
                    if (started) update({ started_date: started })
                  }}
                />
              </label>
              <button className="btn" onClick={() => update({ is_archived: !campaign.is_archived })}>
                {campaign.is_archived ? 'Unarchive' : 'Archive'}
              </button>
              {campaign.is_archived && <span className="import-tag">archived</span>}
            </div>
            <SaveLine save={save} onRetry={() => void retry()} />
          </section>

          <section className="ember-card">
            <h2 className="card-title">Notes</h2>
            <textarea
              className="ember-input ember-notes"
              value={campaign.notes}
              placeholder="the party, the patron, the plot so far…"
              rows={5}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </section>

          <section className="ember-card">
            <h2 className="card-title">Campaign Settings</h2>
            <p className="soft">
              Which official settings are in play at this table? They narrow the proficiency lists. Leave all off to show everything.
            </p>
            <div className="chip-row">
              {campaignSettings.map((setting) => {
                const on = campaign.enabled_settings?.includes(setting) ?? false
                return (
                  <button key={setting} className={`setting-chip${on ? ' setting-chip-on' : ''}`} aria-pressed={on} onClick={() => toggleSetting(setting)}>
                    <span className="setting-logo" style={{ maskImage: `url(${settingLogo(setting)})`, WebkitMaskImage: `url(${settingLogo(setting)})` }} />
                    {setting}
                  </button>
                )
              })}
            </div>
            {(campaign.enabled_settings?.length ?? 0) > 0 && (
              <div className="btn-row">
                <button className="btn btn-small" onClick={() => update({ enabled_settings: null })}>
                  clear filter (show everything)
                </button>
              </div>
            )}
          </section>

          <section className="ember-card">
            <h2 className="card-title">Cast</h2>
            <div className="btn-row">
              <button className="btn" disabled={busy} onClick={() => void newCharacter()}>
                + New character
              </button>
              <button className="btn" disabled={busy} onClick={() => setPicking(true)}>
                Add from Sandbox
              </button>
            </div>
            {actionError && (
              <div className="result-line">
                <span className="result-fail">✖</span>
                <span>{actionError}</span>
              </div>
            )}
            {cast === null && <p className="soft">Loading characters…</p>}
            {cast !== null && alive.length === 0 && <p className="soft">No characters in this campaign yet.</p>}
            {alive.length > 0 && <CastList members={alive} />}
            {dead.length > 0 && (
              <>
                <button className="disclosure" aria-expanded={open.dead} onClick={() => setOpen((o) => ({ ...o, dead: !o.dead }))}>
                  {open.dead ? '▾' : '▸'} Dead ({dead.length})
                </button>
                {open.dead && <CastList members={dead} />}
              </>
            )}
            {archived.length > 0 && (
              <>
                <button className="disclosure" aria-expanded={open.archived} onClick={() => setOpen((o) => ({ ...o, archived: !o.archived }))}>
                  {open.archived ? '▾' : '▸'} Archived ({archived.length})
                </button>
                {open.archived && <CastList members={archived} />}
              </>
            )}
          </section>

          {id && <CampaignSessions campaignID={id} userID={userID} cast={cast ?? []} />}

          <div className="btn-row">
            <button className="btn btn-danger" disabled={busy} onClick={() => void removeCampaign()}>
              Delete campaign
            </button>
          </div>
          {picking && <SandboxPicker onChoose={addFromSandbox} onClose={() => setPicking(false)} />}
          {dialog}
        </>
      )}
    </div>
  )
}
