import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { campaignSettings, dateFromInput, dateInputValue, useCampaignDoc } from '../lib/campaigns'
import { supabase } from '../lib/supabase'
import type { SaveState } from '../lib/useCharacterDoc'

// Detalhe da campanha (CampaignDetailView do iPad): nome, início, anotações,
// ambientações em jogo, arquivar, e o elenco com link para cada ficha.
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

export function CampaignDetail() {
  const { id } = useParams()
  const { session, loading, signInWithGoogle } = useAuth()
  const userID = session?.user.id ?? null
  const { campaign, loadError, save, conflict, dismissConflict, update, retry } = useCampaignDoc(id, userID)
  const [cast, setCast] = useState<CastMember[] | null>(null)
  const [open, setOpen] = useState<{ dead: boolean; archived: boolean }>({ dead: false, archived: false })

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
  }, [userID, id])

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
        </>
      )}
    </div>
  )
}
