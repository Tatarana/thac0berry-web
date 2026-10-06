import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { campaignTitle, createCampaign, type CampaignRow } from '../lib/campaigns'
import { supabase } from '../lib/supabase'

// Lista de campanhas (CampaignListView do iPad): as ativas primeiro, as
// arquivadas num grupo recolhido; "+ New campaign" cria uma campanha sem nome
// e abre o detalhe, onde o nome se escreve direto (como no iPad).

interface Counts {
  sessions: Map<string, number>
  characters: Map<string, number>
}

const countBy = (rows: { campaign_id: string | null }[]) => {
  const map = new Map<string, number>()
  for (const row of rows) if (row.campaign_id) map.set(row.campaign_id, (map.get(row.campaign_id) ?? 0) + 1)
  return map
}

export function Campaigns() {
  const { session, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null)
  const [counts, setCounts] = useState<Counts>({ sessions: new Map(), characters: new Map() })
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const userID = session?.user.id ?? null

  useEffect(() => {
    if (!userID) return
    let cancelled = false
    void Promise.all([
      supabase
        .from('campaign')
        .select('id, name, started_date, notes, is_archived, enabled_settings')
        .is('deleted_at', null)
        .order('started_date', { ascending: false }),
      supabase.from('session').select('campaign_id').is('deleted_at', null),
      supabase.from('character').select('campaign_id').is('deleted_at', null),
    ]).then(([camps, sessions, chars]) => {
      if (cancelled) return
      const failed = camps.error ?? sessions.error ?? chars.error
      if (failed) return setError(failed.message)
      setCampaigns(camps.data as CampaignRow[])
      setCounts({
        sessions: countBy(sessions.data as { campaign_id: string }[]),
        characters: countBy(chars.data as { campaign_id: string | null }[]),
      })
    })
    return () => {
      cancelled = true
    }
  }, [userID])

  const newCampaign = async () => {
    setCreating(true)
    try {
      const id = await createCampaign()
      navigate(`/campaigns/${id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setCreating(false)
    }
  }

  const active = (campaigns ?? []).filter((c) => !c.is_archived)
  const archived = (campaigns ?? []).filter((c) => c.is_archived)

  const row = (c: CampaignRow) => {
    const sessions = counts.sessions.get(c.id) ?? 0
    const characters = counts.characters.get(c.id) ?? 0
    return (
      <li key={c.id} className="import-row">
        <Link className="character-link" to={`/campaigns/${c.id}`}>
          <span className="import-name">{campaignTitle(c)}</span>
          <div className="soft import-detail">
            {[
              c.started_date ? `since ${new Date(c.started_date).toLocaleDateString()}` : null,
              `${characters} ${characters === 1 ? 'character' : 'characters'}`,
              `${sessions} ${sessions === 1 ? 'session' : 'sessions'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </Link>
      </li>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Campaigns" />

      {loading && <p className="soft">Checking your session…</p>}
      {!loading && !session && (
        <section className="ember-card">
          <p className="soft">Sign in to see the campaigns on your account.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          </div>
        </section>
      )}

      {session && (
        <>
          {error && (
            <div className="result-line">
              <span className="result-fail">✖</span>
              <span>Could not load campaigns: {error}</span>
            </div>
          )}
          <div className="btn-row">
            <button className="btn" disabled={creating} onClick={() => void newCampaign()}>
              {creating ? 'Creating…' : '+ New campaign'}
            </button>
          </div>
          {!error && campaigns === null && <p className="soft">Loading campaigns…</p>}
          {campaigns !== null && (
            <section className="ember-card">
              <h2 className="card-title">Campaigns</h2>
              {active.length === 0 ? (
                <p className="soft">No campaigns yet — start one above.</p>
              ) : (
                <ul className="import-list">{active.map(row)}</ul>
              )}
            </section>
          )}
          {archived.length > 0 && (
            <section className="ember-card">
              <button className="disclosure" aria-expanded={showArchived} onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? '▾' : '▸'} Archived ({archived.length})
              </button>
              {showArchived && <ul className="import-list">{archived.map(row)}</ul>}
            </section>
          )}
        </>
      )}
    </div>
  )
}
