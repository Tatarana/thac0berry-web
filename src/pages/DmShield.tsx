import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { DmOnly } from '../components/DmOnly'
import { PageHeader } from '../components/PageHeader'
import { MonsterPinPicker, SessionPinPicker, TablePinPicker, useShieldMonsterIndex, useShieldTables } from '../components/ShieldPinPickers'
import { useActiveCampaign } from '../lib/activeCampaign'
import type { CampaignCharacter } from '../lib/campaignCharacters'
import { useCampaignCharacters } from '../lib/campaignCharacters'
import { useCampaignSessions, type SessionRow } from '../lib/campaignSessions'
import { fetchCampaignPins, toggleCampaignPin } from '../lib/campaignPins'
import { useCombatStore } from '../lib/combatStore'
import { shieldBackLink } from '../lib/shieldBack'
import { formatDice, rollDice } from '../rules/dice'
import { encounterInProgress, type Encounter } from '../rules/combat'
import type { MonsterIndexEntry } from '../data/monsters'
import { xpLabel } from '../rules/monsters'
import { togglePin, type PinnedItem } from '../rules/pins'
import { findRow, rollPlan } from '../rules/tableRoll'
import { tableLabel, type GrimoireTable } from '../rules/tableIndex'

// DM Shield (opção B, 2026-10-18, docs/dm-shield.md): 4 telas que o mestre
// troca com ‹ › ou as bolinhas, como um shield físico — cabeçalho fixo,
// conteúdo deslizando. PS3 (2026-10-18): volta pra tela certa do Shield
// depois de abrir a ficha/tabela/monstro/Combat Tracker (shieldBack.ts);
// personagens clicáveis; fixar tabela/monstro/sessão sem sair do Shield;
// cards de resumo em vez de link puro; Session Notes por sessão (fixadas, ou
// a mais recente), com paginação entre as escolhidas.

const SCREEN_COUNT = 4
const screenTitles = ['Group & Encounter', 'Pinned', 'Session Notes', 'Cast & NPCs']

const dateLabel = (iso: string) => iso.slice(0, 10)

function hpRatioClass(current: number, max: number): string {
  if (max <= 0) return 'shield-hp-ok'
  const ratio = current / max
  if (ratio <= 0.33) return 'shield-hp-low'
  if (ratio < 0.66) return 'shield-hp-mid'
  return 'shield-hp-ok'
}

function PartyStrip({ characters, backParam }: { characters: CampaignCharacter[]; backParam: string }) {
  const alive = characters.filter((c) => c.data.status !== 'dead' && c.data.status !== 'archived')
  if (alive.length === 0) return <p className="soft">No characters in this campaign yet.</p>
  return (
    <div className="shield-party-strip">
      {alive.map(({ id, data }) => {
        const max = data.hitPointsMax || 1
        const ratio = Math.max(0, Math.min(1, data.hitPointsCurrent / max))
        return (
          <Link key={id} to={`/characters/${id}?${backParam}`} className={`shield-pc-chip ${hpRatioClass(data.hitPointsCurrent, max)}`}>
            <div className="shield-pc-top">
              <span>{data.name || 'Unnamed'}</span>
              <span className="shield-pc-class">
                {data.characterClass} {data.level}
              </span>
            </div>
            <div className="shield-pc-hp">
              {data.hitPointsCurrent} / {data.hitPointsMax}
            </div>
            <div className="shield-hp-bar">
              <div className="shield-hp-fill" style={{ width: `${ratio * 100}%` }} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function EncounterPanel({ encounter, backParam }: { encounter: Encounter | null; backParam: string }) {
  if (!encounter) {
    return (
      <div className="ember-card">
        <p className="card-title">Active Encounter</p>
        <p className="soft">No encounter running.</p>
        <Link className="btn" to={`/dm/combat?${backParam}`}>
          Open Combat Tracker
        </Link>
      </div>
    )
  }
  const shown = encounter.combatants.slice(0, 6)
  const more = encounter.combatants.length - shown.length
  return (
    <div className="ember-card">
      <p className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Active Encounter <span className="shield-round-badge">Round {encounter.round}</span>
      </p>
      {shown.map((c) => {
        const inner = (
          <>
            <span>{c.name}</span>
            <span className="shield-combatant-hp">
              {c.hp ?? '—'}
              {c.hpMax ? ` / ${c.hpMax}` : ''}
            </span>
          </>
        )
        return c.characterID ? (
          <Link key={c.id} to={`/characters/${c.characterID}?${backParam}`} className="shield-combatant-row">
            {inner}
          </Link>
        ) : (
          <div key={c.id} className="shield-combatant-row">
            {inner}
          </div>
        )
      })}
      {more > 0 && <p className="soft">+{more} more…</p>}
      <Link className="btn" to={`/dm/combat?${backParam}`} style={{ marginTop: 10 }}>
        Resume Encounter
      </Link>
    </div>
  )
}

function PinnedTableCard({ table, backParam, onUnpin }: { table: GrimoireTable; backParam: string; onUnpin: () => void }) {
  const [roll, setRoll] = useState<{ value: number; row: string[] } | null>(null)
  const plan = useMemo(() => rollPlan(table), [table])
  const previewRows = table.rows.slice(0, 3)

  function doRoll() {
    if (!plan?.dice) return
    const result = rollDice(plan.dice)
    const index = findRow(plan, result.total)
    setRoll({ value: result.total, row: index >= 0 ? table.rows[index] : [] })
  }

  return (
    <div className="shield-pin-card">
      <div className="shield-pin-card-top">
        <span className="shield-pin-card-title">▦ {tableLabel(table)}</span>
        <button className="shield-unpin" aria-label={`Unpin ${table.title}`} title="Unpin" onClick={onUnpin}>
          ✕
        </button>
      </div>
      {previewRows.length > 0 && (
        <table className="shield-pin-preview">
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {table.rows.length > previewRows.length && <p className="shield-pin-more">+{table.rows.length - previewRows.length} more rows</p>}
      <div className="shield-pin-actions">
        {plan?.dice && (
          <button className="btn" onClick={doRoll}>
            Roll {formatDice(plan.dice)}
          </button>
        )}
        <Link className="btn" to={`/dm/tables?open=${encodeURIComponent(table.id)}&${backParam}`}>
          Open
        </Link>
      </div>
      {roll && (
        <p className="shield-pin-result">
          {roll.value} → {roll.row.filter(Boolean).join(' · ') || 'no row'}
        </p>
      )}
    </div>
  )
}

function PinnedMonsterCard({ entry, backParam, onUnpin }: { entry: MonsterIndexEntry; backParam: string; onUnpin: () => void }) {
  const meta = [entry.hitDice ? `HD ${entry.hitDice.split('\n')[0]}` : null, xpLabel(entry) ? `${xpLabel(entry)} XP` : null, entry.frequency].filter(Boolean).join(' · ')
  return (
    <div className="shield-pin-card">
      <div className="shield-pin-card-top">
        <span className="shield-pin-card-title">🐉 {entry.name}</span>
        <button className="shield-unpin" aria-label={`Unpin ${entry.name}`} title="Unpin" onClick={onUnpin}>
          ✕
        </button>
      </div>
      <p className="shield-pin-meta">
        {entry.collection}
        {meta ? ` · ${meta}` : ''}
      </p>
      {entry.summary && <p className="shield-pin-summary">{entry.summary}</p>}
      <div className="shield-pin-actions">
        <Link className="btn" to={`/dm/monsters?open=${encodeURIComponent(entry.id)}&${backParam}`}>
          Open full stat block
        </Link>
      </div>
    </div>
  )
}

function PinnedFallbackCard({ item, backParam, onUnpin }: { item: PinnedItem; backParam: string; onUnpin: () => void }) {
  const to = item.kind === 'table' ? `/dm/tables?open=${encodeURIComponent(item.refID)}&${backParam}` : `/dm/monsters?open=${encodeURIComponent(item.refID)}&${backParam}`
  return (
    <div className="shield-pin-card">
      <div className="shield-pin-card-top">
        <span className="shield-pin-card-title">{item.label}</span>
        <button className="shield-unpin" aria-label={`Unpin ${item.label}`} title="Unpin" onClick={onUnpin}>
          ✕
        </button>
      </div>
      <div className="shield-pin-actions">
        <Link className="btn" to={to}>
          Open
        </Link>
      </div>
    </div>
  )
}

function PinnedPanel({ campaignID, userID, campaignName, backParam }: { campaignID: string; userID: string | null; campaignName: string; backParam: string }) {
  const [items, setItems] = useState<PinnedItem[] | null>(null)
  const [picker, setPicker] = useState<'table' | 'monster' | null>(null)
  const tables = useShieldTables(campaignID, userID, campaignName)
  const monsterIndex = useShieldMonsterIndex()

  useEffect(() => {
    let cancelled = false
    void fetchCampaignPins(campaignID).then((loaded) => {
      if (!cancelled) setItems((loaded ?? []).filter((i) => i.kind === 'table' || i.kind === 'monster'))
    })
    return () => {
      cancelled = true
    }
  }, [campaignID])

  async function unpin(item: PinnedItem) {
    setItems((current) => (current ? togglePin(current, item) : current))
    await toggleCampaignPin(campaignID, item)
  }

  const tableItems = (items ?? []).filter((i) => i.kind === 'table')
  const monsterItems = (items ?? []).filter((i) => i.kind === 'monster')

  return (
    <div className="shield-pinned-screen">
      <div className="ember-card">
        <p className="card-title shield-card-title-row">
          Pinned Tables
          <button className="btn" onClick={() => setPicker('table')}>
            + Pin a table
          </button>
        </p>
        {items === null ? (
          <p className="soft">Loading…</p>
        ) : tableItems.length === 0 ? (
          <p className="soft">Nothing pinned yet.</p>
        ) : (
          tableItems.map((item) => {
            const table = (tables ?? []).find((t) => t.id === item.refID)
            return table ? (
              <PinnedTableCard key={item.refID} table={table} backParam={backParam} onUnpin={() => void unpin(item)} />
            ) : (
              <PinnedFallbackCard key={item.refID} item={item} backParam={backParam} onUnpin={() => void unpin(item)} />
            )
          })
        )}
      </div>
      <div className="ember-card">
        <p className="card-title shield-card-title-row">
          Pinned Monsters
          <button className="btn" onClick={() => setPicker('monster')}>
            + Pin a monster
          </button>
        </p>
        {items === null ? (
          <p className="soft">Loading…</p>
        ) : monsterItems.length === 0 ? (
          <p className="soft">Nothing pinned yet.</p>
        ) : (
          monsterItems.map((item) => {
            const entry = (monsterIndex ?? []).find((m) => m.id === item.refID)
            return entry ? (
              <PinnedMonsterCard key={item.refID} entry={entry} backParam={backParam} onUnpin={() => void unpin(item)} />
            ) : (
              <PinnedFallbackCard key={item.refID} item={item} backParam={backParam} onUnpin={() => void unpin(item)} />
            )
          })
        )}
      </div>
      {picker === 'table' && (
        <TablePinPicker campaignID={campaignID} tables={tables} pinned={items ?? []} onToggled={setItems} onClose={() => setPicker(null)} />
      )}
      {picker === 'monster' && (
        <MonsterPinPicker campaignID={campaignID} index={monsterIndex} pinned={items ?? []} onToggled={setItems} onClose={() => setPicker(null)} />
      )}
    </div>
  )
}

function SessionNotesPanel({ campaignID, userID }: { campaignID: string; userID: string }) {
  const { sessions, update } = useCampaignSessions(campaignID, userID)
  const [items, setItems] = useState<PinnedItem[] | null>(null)
  const [cursor, setCursor] = useState(0)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchCampaignPins(campaignID).then((loaded) => {
      if (!cancelled) setItems((loaded ?? []).filter((i) => i.kind === 'session'))
    })
    return () => {
      cancelled = true
    }
  }, [campaignID])

  async function togglePinSession(session: SessionRow) {
    const item: PinnedItem = { kind: 'session', refID: session.id, label: `${dateLabel(session.date)}${session.title ? ` — ${session.title}` : ''}` }
    setItems((current) => (current ? togglePin(current, item) : current))
    await toggleCampaignPin(campaignID, item)
  }

  const pinnedIDs = (items ?? []).filter((i) => i.kind === 'session').map((i) => i.refID)
  const chosen = sessions ? (pinnedIDs.length > 0 ? (pinnedIDs.map((id) => sessions.find((s) => s.id === id)).filter(Boolean) as SessionRow[]) : sessions.slice(0, 1)) : []
  const current = chosen[Math.min(cursor, Math.max(chosen.length - 1, 0))] ?? null

  return (
    <div className="ember-card">
      <p className="card-title shield-card-title-row">
        Session Notes
        <button className="btn" onClick={() => setPicking(true)}>
          Pin sessions…
        </button>
      </p>
      {sessions === null ? (
        <p className="soft">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="soft">No sessions in this campaign yet.</p>
      ) : current ? (
        <>
          <div className="shield-session-nav">
            {chosen.length > 1 && (
              <button aria-label="Previous session" onClick={() => setCursor((c) => (c - 1 + chosen.length) % chosen.length)}>
                ‹
              </button>
            )}
            <span>
              {dateLabel(current.date)}
              {current.title ? ` — ${current.title}` : ''}
              {chosen.length > 1 ? ` (${cursor + 1}/${chosen.length})` : pinnedIDs.length === 0 ? ' · most recent' : ''}
            </span>
            {chosen.length > 1 && (
              <button aria-label="Next session" onClick={() => setCursor((c) => (c + 1) % chosen.length)}>
                ›
              </button>
            )}
          </div>
          <textarea
            className="ember-input ember-notes"
            rows={8}
            value={current.summary}
            placeholder="what happened this session…"
            onChange={(e) => update(current.id, { summary: e.target.value })}
          />
        </>
      ) : null}
      {picking && <SessionPinPicker sessions={sessions ?? []} pinnedIDs={pinnedIDs} onToggle={(s) => void togglePinSession(s)} onClose={() => setPicking(false)} />}
    </div>
  )
}

function CastPanel({ characters, backParam }: { characters: CampaignCharacter[]; backParam: string }) {
  if (characters.length === 0) return <p className="soft">No characters in this campaign yet.</p>
  return (
    <div className="ember-card">
      <p className="card-title">Cast &amp; NPCs</p>
      {characters.map(({ id, data }) => (
        <Link key={id} to={`/characters/${id}?${backParam}`} className="shield-cast-row">
          <span className="shield-cast-avatar">{(data.name || '?').charAt(0).toUpperCase()}</span>
          <span>{data.name || 'Unnamed character'}</span>
          <span className="shield-cast-sub">
            {data.characterClass} {data.level}
            {data.status !== 'alive' ? ` · ${data.status}` : ''}
          </span>
        </Link>
      ))}
    </div>
  )
}

function ShieldBody({ campaignID, campaignName, userID }: { campaignID: string; campaignName: string; userID: string | null }) {
  const [searchParams] = useSearchParams()
  const initial = Number(searchParams.get('screen'))
  const [index, setIndex] = useState(Number.isInteger(initial) && initial >= 0 && initial < SCREEN_COUNT ? initial : 0)
  const move = (delta: number) => setIndex((i) => ((i + delta) % SCREEN_COUNT + SCREEN_COUNT) % SCREEN_COUNT)
  const go = (i: number) => setIndex(((i % SCREEN_COUNT) + SCREEN_COUNT) % SCREEN_COUNT)
  const backParam = shieldBackLink(index)
  const { characters } = useCampaignCharacters(campaignID)
  const { store } = useCombatStore()
  const encounter = encounterInProgress(store.encounters, campaignID)

  return (
    <div className="shield-carousel">
      <p className="shield-screen-label">
        {index + 1} / {SCREEN_COUNT} — {screenTitles[index]}
      </p>
      <div className="shield-viewport">
        <button className="shield-arrow shield-arrow-left" aria-label="Previous screen" onClick={() => move(-1)}>
          ‹
        </button>
        <button className="shield-arrow shield-arrow-right" aria-label="Next screen" onClick={() => move(1)}>
          ›
        </button>
        <div className="shield-track" style={{ transform: `translateX(-${index * 25}%)` }}>
          <div className="shield-screen">
            {characters === null ? <p className="soft">Loading…</p> : <PartyStrip characters={characters} backParam={backParam} />}
            <EncounterPanel encounter={encounter} backParam={backParam} />
          </div>
          <div className="shield-screen">
            <PinnedPanel campaignID={campaignID} userID={userID} campaignName={campaignName} backParam={backParam} />
          </div>
          <div className="shield-screen">{userID && <SessionNotesPanel campaignID={campaignID} userID={userID} />}</div>
          <div className="shield-screen">
            <CastPanel characters={characters ?? []} backParam={backParam} />
          </div>
        </div>
      </div>
      <div className="shield-dots">
        {screenTitles.map((title, i) => (
          <button key={title} className={i === index ? 'shield-dot shield-dot-on' : 'shield-dot'} aria-label={title} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  )
}

function Shield() {
  const active = useActiveCampaign()
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const campaignID = active?.id ?? null
  return (
    <div className="page">
      <PageHeader title="Shield" backTo="/dm" />
      {campaignID ? (
        <ShieldBody campaignID={campaignID} campaignName={active?.name ?? ''} userID={userID} />
      ) : (
        <p className="soft">The Shield needs an active campaign — choose one at the top (the One-shot has no pins, notes or cast of its own).</p>
      )}
    </div>
  )
}

export function DmShield() {
  return (
    <DmOnly>
      <Shield />
    </DmOnly>
  )
}
