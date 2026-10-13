import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { fetchInvite, fetchMembers, removeMember, revokeInvite, setInvite, type CampaignMember } from '../lib/campaignMembers'
import { useConfirm } from '../lib/useConfirm'
import { inviteCodeProblem } from '../rules/invites'

// Jogadores da campanha (Fase 2a do backend, 2026-10-13). O mestre gera um
// código aleatório ou escolhe o dele (uma "senha" do grupo), copia, troca e
// revoga, e vê e remove os jogadores; o jogador vê o grupo e pode sair. As
// fichas dos jogadores na campanha são a Fase 2b.

const memberName = (m: CampaignMember, isMe: boolean) => {
  const name = m.display_name.trim()
  if (!name) return isMe ? 'You' : 'Unnamed player'
  return isMe ? `${name} (you)` : name
}

export function CampaignPlayers({ campaignID, userID, isGM }: { campaignID: string; userID: string; isGM: boolean }) {
  const [members, setMembers] = useState<CampaignMember[] | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [reload, setReload] = useState(0)
  const { confirm, dialog } = useConfirm()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    void Promise.all([fetchMembers(campaignID), isGM ? fetchInvite(campaignID) : Promise.resolve(null)])
      .then(([list, invite]) => {
        if (cancelled) return
        setMembers(list)
        setCode(invite)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason))
      })
    return () => {
      cancelled = true
    }
  }, [campaignID, isGM, reload])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const randomCode = () =>
    run(async () => {
      setCode(await setInvite(campaignID))
      setCopied(false)
    })

  const problem = custom.trim() === '' ? null : inviteCodeProblem(custom)
  const chooseCode = () =>
    run(async () => {
      setCode(await setInvite(campaignID, custom))
      setChoosing(false)
      setCustom('')
      setCopied(false)
    })

  async function revoke() {
    if (!(await confirm('Revoke the invite code? Players who already joined stay; nobody else can join with it.', 'Revoke'))) return
    await run(async () => {
      await revokeInvite(campaignID)
      setCode(null)
    })
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setError('Could not copy; select the code and copy it by hand.')
    }
  }

  async function remove(member: CampaignMember) {
    const name = memberName(member, false)
    if (!(await confirm(`Remove ${name} from the campaign? Their characters go back to their Sandbox.`, 'Remove'))) return
    await run(async () => {
      await removeMember(campaignID, member.user_id)
      setReload((v) => v + 1)
    })
  }

  async function leave() {
    if (!(await confirm('Leave this campaign? Your characters in it go back to your Sandbox; you can join again with the code.', 'Leave'))) return
    await run(async () => {
      await removeMember(campaignID, userID)
      navigate('/campaigns')
    })
  }

  const players = (members ?? []).filter((m) => m.role === 'player')

  return (
    <section className="ember-card">
      <h2 className="card-title">Players</h2>
      {isGM && (
        <>
          <p className="soft">Players join this campaign with an invite code. Share it with your group; anyone with the code can join.</p>
          {code ? (
            <div className="invite-code-row">
              <span className="invite-code" aria-label="Invite code">{code}</span>
              <button className="btn btn-small" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          ) : (
            <p className="soft">No invite code — nobody can join right now.</p>
          )}
          <div className="btn-row">
            <button className="btn btn-small" disabled={busy} onClick={() => void randomCode()}>
              {code ? 'New random code' : 'Create a random code'}
            </button>
            <button className="btn btn-small" disabled={busy} onClick={() => setChoosing((v) => !v)}>
              Choose a code
            </button>
            {code && (
              <button className="btn btn-small" disabled={busy} onClick={() => void revoke()}>
                Revoke
              </button>
            )}
          </div>
          {choosing && (
            <div className="invite-choose">
              <input
                className="ember-input"
                value={custom}
                placeholder="e.g. FRIDAY-TABLE"
                aria-label="Your invite code"
                maxLength={24}
                autoFocus
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && custom.trim() !== '' && !problem) void chooseCode()
                }}
              />
              <button className="btn btn-small" disabled={busy || custom.trim() === '' || !!problem} onClick={() => void chooseCode()}>
                Use this code
              </button>
              <p className="soft">{problem ?? '4 to 24 letters without accents, digits or hyphens. Capitals don’t matter.'}</p>
            </div>
          )}
        </>
      )}
      {error && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>{error}</span>
        </div>
      )}
      {members === null && !error && <p className="soft">Loading players…</p>}
      {members !== null && players.length === 0 && <p className="soft">No players have joined yet.</p>}
      {players.length > 0 && (
        <ul className="import-list">
          {players.map((m) => (
            <li key={m.user_id} className="import-row member-row">
              <span className="import-name">{memberName(m, m.user_id === userID)}</span>
              <span className="soft import-detail">joined {new Date(m.joined_at).toLocaleDateString()}</span>
              {isGM && (
                <button className="btn btn-small" disabled={busy} onClick={() => void remove(m)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!isGM && (
        <div className="btn-row">
          <button className="btn btn-small" disabled={busy} onClick={() => void leave()}>
            Leave campaign
          </button>
        </div>
      )}
      {dialog}
    </section>
  )
}
