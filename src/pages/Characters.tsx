import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { CharacterActions } from '../components/CharacterActions'
import { PageHeader } from '../components/PageHeader'
import { createCharacter } from '../lib/roster'
import { supabase } from '../lib/supabase'

// Lista de personagens da conta, agrupados por campanha (as colunas de
// resumo são geradas pelo banco a partir da ficha). Clicar abre a ficha; o
// "⋯" de cada linha tem as ações (clonar, morrer, arquivar, mover, apagar);
// "+ New character" cria um personagem no Sandbox (AllCharactersView do iPad).
interface CharacterSummary {
  id: string
  name: string | null
  character_class: string | null
  level: number | null
  status: string | null
  campaign_id: string | null
}

interface CampaignSummary {
  id: string
  name: string
  is_archived: boolean
}

const statusLabel: Record<string, string> = { alive: 'Alive', dead: 'Dead', archived: 'Archived' }

export function Characters() {
  const { session, loading, signInWithGoogle } = useAuth()
  const [characters, setCharacters] = useState<CharacterSummary[] | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const userID = session?.user.id ?? null

  useEffect(() => {
    if (!userID) return
    let cancelled = false
    void Promise.all([
      supabase
        .from('character')
        .select('id, name, character_class, level, status, campaign_id')
        .is('deleted_at', null)
        .order('name'),
      supabase.from('campaign').select('id, name, is_archived').is('deleted_at', null).order('name'),
    ]).then(([chars, camps]) => {
      if (cancelled) return
      if (chars.error || camps.error) {
        setError((chars.error ?? camps.error)?.message ?? 'unknown error')
        return
      }
      setCharacters(chars.data as CharacterSummary[])
      setCampaigns(camps.data as CampaignSummary[])
    })
    return () => {
      cancelled = true
    }
  }, [userID, reload])

  const newCharacter = async () => {
    setCreating(true)
    try {
      navigate(`/characters/${await createCharacter(null)}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setCreating(false)
    }
  }

  const groups = [
    ...campaigns.map((campaign) => ({
      key: campaign.id,
      title: campaign.name || 'Unnamed campaign',
      archived: campaign.is_archived,
      members: (characters ?? []).filter((c) => c.campaign_id === campaign.id),
    })),
    {
      key: 'sandbox',
      title: 'Sandbox (no campaign)',
      archived: false,
      members: (characters ?? []).filter((c) => !c.campaign_id || !campaigns.some((k) => k.id === c.campaign_id)),
    },
  ].filter((group) => group.members.length > 0)

  return (
    <div className="page">
      <PageHeader title="Characters" />

      {loading && <p className="soft">Checking your session…</p>}
      {!loading && !session && (
        <section className="ember-card">
          <p className="soft">Sign in to see the characters on your account.</p>
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
              <span>Could not load characters: {error}</span>
            </div>
          )}
          {!error && characters === null && <p className="soft">Loading characters…</p>}
          {characters !== null && characters.length === 0 && (
            <section className="ember-card">
              <p className="soft">No characters on your account yet. Bring them from the iPad with a backup.</p>
            </section>
          )}
          {groups.map((group) => (
            <section key={group.key} className="ember-card">
              <h2 className="card-title">
                {group.title}
                {group.archived && <span className="import-tag">archived</span>}
              </h2>
              <ul className="import-list">
                {group.members.map((c) => (
                  <li key={c.id} className="import-row cast-row">
                    <Link className="character-link" to={`/characters/${c.id}`}>
                      <span className="import-name">{c.name || 'Unnamed character'}</span>
                      <div className="soft import-detail">
                        {c.character_class ?? '—'} {c.level ?? ''}
                        {c.status && c.status !== 'alive' ? ` · ${statusLabel[c.status] ?? c.status}` : ''}
                      </div>
                    </Link>
                    <CharacterActions character={c} onChanged={() => setReload((n) => n + 1)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className="ember-card">
            <div className="btn-row">
              <button className="btn" disabled={creating} onClick={() => void newCharacter()}>
                {creating ? 'Creating…' : '+ New character'}
              </button>
              <Link className="btn" to="/import">Import iPad backup</Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
