import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { useLiveEncounters, type LiveEncounter } from '../lib/encounterView'
import { sideLabels, type Side } from '../rules/combat'
import type { PlayerCombatant } from '../rules/playerView'

// Combat Tracker ao vivo, L3 (docs/controle-de-combate.md): o que os jogadores
// veem do encontro que o mestre compartilhou — só leitura, atualizado sozinho
// (Realtime). Sem PV, CA, moral ou notas dos inimigos: a vista já vem filtrada.

const sides: Side[] = ['party', 'enemies', 'others']

export function LiveCombat() {
  const { id = '' } = useParams()
  const { session, loading } = useAuth()
  const { views, error } = useLiveEncounters(session ? id : null)
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
      {views?.map((v) => <LiveEncounterCard key={v.encounterID} view={v} />)}
    </div>
  )
}

function LiveEncounterCard({ view }: { view: LiveEncounter }) {
  const v = view.data
  if (v?.v !== 1) {
    return (
      <section className="ember-card">
        <p className="soft">This combat uses a newer format. Reload the page to update the app.</p>
      </section>
    )
  }
  const now = v.order.find((s) => s.now)
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
