import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { sendToDm, useMyCharacterIDs, usePendingFromMe, type CombatMessage } from '../lib/combatMessages'
import { useLiveEncounters, type LiveEncounter } from '../lib/encounterView'
import { rollDice } from '../rules/dice'
import { sideLabels, type Side } from '../rules/combat'
import { saveCategoryKeys } from '../rules/groupEffects'
import type { PlayerCombatant } from '../rules/playerView'

// Combat Tracker ao vivo, L3 (docs/controle-de-combate.md): o que os jogadores
// veem do encontro que o mestre compartilhou — só leitura, atualizado sozinho
// (Realtime). Sem PV, CA, moral ou notas dos inimigos: a vista já vem filtrada.
// Interativo (I3): o jogador manda a própria iniciativa e o d20 de um
// salvamento pedido pelo mestre; o mestre aceita para valer.

const sides: Side[] = ['party', 'enemies', 'others']
const d10 = { count: 1, sides: 10, modifier: 0 }
const d20 = { count: 1, sides: 20, modifier: 0 }

export function LiveCombat() {
  const { id = '' } = useParams()
  const { session, loading } = useAuth()
  const userID = session?.user.id ?? null
  const { views, error } = useLiveEncounters(session ? id : null)
  const mine = useMyCharacterIDs(id, userID)
  return (
    <div className="page">
      <PageHeader title="Combat · live" backTo={`/campaigns/${id}`} />
      {loading && <p className="soft">Checking your session…</p>}
      {!loading && !session && <p className="soft">Sign in to follow the combat.</p>}
      {error && <p className="soft save-error">Could not load the combat: {error}</p>}
      {session && !error && views === null && <p className="soft">Loading…</p>}
      {views?.length === 0 && (
        <section className="ember-card">
          <p className="soft">No combat is being shown right now. When the DM shows an encounter to the players, it appears here.</p>
          <Link className="btn" to={`/campaigns/${id}`}>
            Back to the campaign
          </Link>
        </section>
      )}
      {views?.map((v) => <LiveEncounterCard key={v.encounterID} view={v} mine={mine} />)}
    </div>
  )
}

function LiveEncounterCard({ view, mine }: { view: LiveEncounter; mine: Set<string> }) {
  const v = view.data
  if (v?.v !== 1) {
    return (
      <section className="ember-card">
        <p className="soft">This combat uses a newer format. Reload the page to update the app.</p>
      </section>
    )
  }
  const now = v.order.find((s) => s.now)
  const myRequests = v.combatants.filter((c) => c.request && c.characterID && mine.has(c.characterID.toLowerCase()))
  return (
    <section className="ember-card live-combat">
      <h2 className="card-title">{v.name || 'Encounter'}</h2>
      <p className="live-round">
        <strong>{v.round > 0 ? `Round ${v.round}` : 'Before the fight'}</strong>
        {now && (
          <>
            {' · '}Acting: <strong>{now.label}</strong>
          </>
        )}
      </p>
      {myRequests.length > 0 && (
        <section className="live-requests">
          <span className="paper-label">The DM is waiting for you</span>
          <ul className="live-requests-list">
            {myRequests.map((c) => (
              <LiveRequestRow key={c.id} c={c} encounterID={view.encounterID} round={v.round} />
            ))}
          </ul>
        </section>
      )}
      {v.order.length > 0 && (
        <ol className="live-order">
          {v.order.map((s, i) => (
            <li key={i} className={s.now ? 'live-now' : undefined}>
              {s.label} <span className="soft">({s.score})</span>
            </li>
          ))}
        </ol>
      )}
      {v.surprised.length > 0 && <p className="live-alert">{v.surprised.map((s) => sideLabels[s]).join(' and ')} surprised: no action in round 1</p>}
      {v.distance && (
        <p className="soft">
          Distance: {v.distance.feet} ft ({v.distance.situation.toLowerCase()})
        </p>
      )}
      {sides.map((side) => {
        const list = v.combatants.filter((c) => c.side === side)
        if (list.length === 0) return null
        return (
          <div key={side} className="live-side">
            <span className="smallcaps">{sideLabels[side]}</span>
            <ul className="live-list">
              {list.map((c) => (
                <LiveCombatantRow key={c.id} c={c} />
              ))}
            </ul>
          </div>
        )
      })}
      <p className="soft live-updated">Updated {new Date(view.updatedAt).toLocaleTimeString('en-US', { timeStyle: 'short' })} · follows the DM live</p>
    </section>
  )
}

/** Manda a iniciativa ou o salvamento pedido; some sozinha quando o mestre aceita. */
function LiveRequestRow({ c, encounterID, round }: { c: PlayerCombatant; encounterID: string; round: number }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending: CombatMessage | undefined = usePendingFromMe(c.characterID ?? null, encounterID).find((m) => m.kind === c.request?.kind)
  if (!c.request || !c.characterID) return null
  const label = c.request.kind === 'initiative' ? `${c.name}: roll initiative` : `${c.name}: save vs ${saveCategoryKeys[c.request.category]?.label.toLowerCase() ?? 'something'}`
  const spec = c.request.kind === 'initiative' ? d10 : d20

  async function send() {
    if (!c.request || !c.characterID) return
    const text = typed.trim()
    if (!/^\d+$/.test(text)) return
    setBusy(true)
    setError(null)
    try {
      const roll = Number(text)
      const payload = c.request.kind === 'initiative' ? { key: c.request.key, round, roll } : { category: c.request.category, round, roll }
      await sendToDm(encounterID, c.characterID, c.request.kind, payload)
      setTyped('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li>
      <strong>{label}</strong>
      {pending ? (
        <span className="soft"> · sent ({String((pending.payload as { roll?: number }).roll ?? '')}), waiting for the DM</span>
      ) : (
        <>
          {' '}
          <input
            className="ink-input ink-number"
            inputMode="numeric"
            aria-label={`${c.name}: roll`}
            placeholder={c.request.kind === 'initiative' ? 'd10' : 'd20'}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />{' '}
          <button className="btn btn-small" onClick={() => setTyped(String(rollDice(spec).total))}>
            Roll
          </button>{' '}
          <button className="btn btn-small" disabled={busy || !/^\d+$/.test(typed.trim())} onClick={() => void send()}>
            Send
          </button>
        </>
      )}
      {error && <span className="soft save-error"> {error}</span>}
    </li>
  )
}

const woundLabels: Record<string, string> = { unhurt: 'Unhurt', wounded: 'Wounded', 'badly wounded': 'Badly wounded', down: 'Down', dead: 'Dead' }

function LiveCombatantRow({ c }: { c: PlayerCombatant }) {
  return (
    <li className={['live-row', c.acting ? 'live-acting' : '', c.wounds === 'dead' ? 'live-dead' : c.wounds === 'down' ? 'live-down' : ''].filter(Boolean).join(' ')}>
      <span className="live-name">
        {c.acting && <span title="Acting now">▶ </span>}
        {c.name}
      </span>
      <span className="live-state">
        {c.hp ? `${c.hp.current ?? '—'} / ${c.hp.max ?? '—'} hp` : ''}
        {c.hp && c.wounds && c.wounds !== 'unhurt' && c.wounds !== 'wounded' && c.wounds !== 'badly wounded' ? ` · ${woundLabels[c.wounds]}` : ''}
        {!c.hp && c.wounds ? woundLabels[c.wounds] : ''}
      </span>
      {c.conditions.length > 0 && (
        <span className="live-conds">
          {c.conditions.map((x, i) => (
            <span key={i} className="import-tag">
              {x.name}
              {x.rounds !== null ? ` ${x.rounds}` : ''}
            </span>
          ))}
        </span>
      )}
    </li>
  )
}
