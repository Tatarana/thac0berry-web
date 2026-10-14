import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { fetchGrants, fetchMembers, fetchParty, grantAccess, revokeAccess, type CampaignMember, type CharacterGrant, type PartyMember } from '../lib/campaignMembers'
import { useConfirm } from '../lib/useConfirm'
import { PaperModal } from './DetailBits'

// Grupo da campanha (Fase 2c do backend, 2026-10-13). Todos os membros veem o
// resumo das fichas (nome, classe, nível, PV, quem joga); a ficha completa
// abre para a dona, o mestre e quem tem acesso temporário. O mestre empresta a
// ficha de quem faltou a outro jogador por 24 h (ou revoga); quem recebeu pode
// devolver.

const until = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
const nameOf = (p: Pick<PartyMember, 'name'>) => p.name?.trim() || 'Unnamed character'

/** Escolher o jogador que vai cobrir (os jogadores da campanha, menos a dona da ficha). */
function LendWindow({
  character,
  players,
  onChoose,
  onClose,
}: {
  character: PartyMember
  players: CampaignMember[]
  onChoose: (userID: string) => void
  onClose: () => void
}) {
  const options = players.filter((m) => m.user_id !== character.owner_id)
  return createPortal(
    <PaperModal title={`Lend ${nameOf(character)}`} subtitle="Who plays this character for the next 24 hours?" onClose={onClose}>
      {options.length === 0 && <p className="paper-soft">No other players in this campaign.</p>}
      <ul className="slot-choices">
        {options.map((m) => (
          <li key={m.user_id}>
            <button className="slot-choice" onClick={() => onChoose(m.user_id)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">{m.display_name.trim() || 'Unnamed player'}</span>
              <span className="rec-soft">can edit the sheet until you revoke it or 24 h pass</span>
            </button>
          </li>
        ))}
      </ul>
    </PaperModal>,
    document.body,
  )
}

export function CampaignParty({ campaignID, userID, isGM, version }: { campaignID: string; userID: string; isGM: boolean; version: number }) {
  const [party, setParty] = useState<PartyMember[] | null>(null)
  const [grants, setGrants] = useState<CharacterGrant[]>([])
  const [players, setPlayers] = useState<CampaignMember[]>([])
  const [lending, setLending] = useState<PartyMember | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const { confirm, dialog } = useConfirm()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [list, members] = await Promise.all([fetchParty(campaignID), fetchMembers(campaignID)])
        const active = await fetchGrants(list.map((p) => p.id))
        if (cancelled) return
        setParty(list)
        setPlayers(members.filter((m) => m.role === 'player'))
        setGrants(active)
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignID, reload, version])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setReload((v) => v + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const playerName = (id: string) => players.find((m) => m.user_id === id)?.display_name.trim() || 'a player'

  async function revoke(grant: CharacterGrant, character: PartyMember) {
    const mine = grant.grantee_id === userID
    const text = mine
      ? `Give ${nameOf(character)} back? You will no longer be able to edit it.`
      : `Revoke ${playerName(grant.grantee_id)}’s access to ${nameOf(character)}?`
    if (!(await confirm(text, mine ? 'Give back' : 'Revoke'))) return
    await run(() => revokeAccess(grant.id))
  }

  return (
    <section className="ember-card">
      <h2 className="card-title">Party</h2>
      {error && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>{error}</span>
        </div>
      )}
      {party === null && !error && <p className="soft">Loading the party…</p>}
      {party !== null && party.length === 0 && <p className="soft">No characters in this campaign yet.</p>}
      {party !== null && party.length > 0 && (
        <ul className="import-list">
          {party.map((p) => {
            const grant = grants.find((g) => g.character_id === p.id)
            const mine = p.owner_id === userID
            const hp = p.hit_points_max !== null ? `${p.hit_points_current ?? '—'}/${p.hit_points_max} hp` : null
            // A ficha de quem não é jogador da campanha é do mestre (os PNJs dele).
            const player = players.find((m) => m.user_id === p.owner_id)
            const who = mine ? 'you' : player ? player.display_name.trim() || 'a player' : 'the DM'
            const summary = [`${p.character_class ?? '—'} ${p.level ?? ''}`.trim(), hp, p.status === 'dead' ? 'dead' : null, `played by ${who}`]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={p.id} className="import-row member-row">
                {p.can_edit ? (
                  <Link className="character-link" to={`/characters/${p.id}`}>
                    <span className="import-name">{nameOf(p)}</span>
                  </Link>
                ) : (
                  <span className="import-name">{nameOf(p)}</span>
                )}
                <span className="soft import-detail">{summary}</span>
                {grant && grant.grantee_id === userID && (
                  <span className="soft import-detail">
                    You can edit until {until(grant.expires_at)}{' '}
                    <button className="btn btn-small" disabled={busy} onClick={() => void revoke(grant, p)}>Give back</button>
                  </span>
                )}
                {isGM && !mine && grant && (
                  <span className="soft import-detail">
                    {playerName(grant.grantee_id)} can edit until {until(grant.expires_at)}{' '}
                    <button className="btn btn-small" disabled={busy} onClick={() => void revoke(grant, p)}>Revoke</button>
                  </span>
                )}
                {isGM && !mine && !grant && players.length > 1 && (
                  <button className="btn btn-small" disabled={busy} onClick={() => setLending(p)}>
                    Lend 24 h to…
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {isGM && <p className="soft">A player missed the session? Lend their character to another player for 24 hours.</p>}
      {lending && (
        <LendWindow
          character={lending}
          players={players}
          onClose={() => setLending(null)}
          onChoose={(grantee) => {
            const character = lending
            setLending(null)
            void run(() => grantAccess(character.id, grantee))
          }}
        />
      )}
      {dialog}
    </section>
  )
}
