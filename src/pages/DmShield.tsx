import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { DmOnly } from '../components/DmOnly'
import { PageHeader } from '../components/PageHeader'
import { useActiveCampaign } from '../lib/activeCampaign'
import type { CampaignCharacter } from '../lib/campaignCharacters'
import { useCampaignCharacters } from '../lib/campaignCharacters'
import { useCampaignDoc } from '../lib/campaigns'
import { fetchCampaignPins, toggleCampaignPin } from '../lib/campaignPins'
import { useCombatStore } from '../lib/combatStore'
import { encounterInProgress, type Encounter } from '../rules/combat'
import { togglePin, type PinnedItem } from '../rules/pins'

// DM Shield (opção B, 2026-10-18, docs/dm-shield.md): 4 telas que o mestre
// troca com ‹ › ou as bolinhas, como um shield físico — cabeçalho fixo,
// conteúdo deslizando. Protótipo visual aprovado como Claude Artifact antes
// desta entrega. Só com campanha ativa de verdade (pins, notes e elenco são
// da campanha; o One-shot não tem linha de campanha).

const SCREEN_COUNT = 4
const screenTitles = ['Group & Encounter', 'Pinned', 'Session Notes', 'Cast & NPCs']

function hpRatioClass(current: number, max: number): string {
  if (max <= 0) return 'shield-hp-ok'
  const ratio = current / max
  if (ratio <= 0.33) return 'shield-hp-low'
  if (ratio < 0.66) return 'shield-hp-mid'
  return 'shield-hp-ok'
}

function PartyStrip({ characters }: { characters: CampaignCharacter[] }) {
  const alive = characters.filter((c) => c.data.status !== 'dead' && c.data.status !== 'archived')
  if (alive.length === 0) return <p className="soft">No characters in this campaign yet.</p>
  return (
    <div className="shield-party-strip">
      {alive.map(({ id, data }) => {
        const max = data.hitPointsMax || 1
        const ratio = Math.max(0, Math.min(1, data.hitPointsCurrent / max))
        return (
          <div key={id} className={`shield-pc-chip ${hpRatioClass(data.hitPointsCurrent, max)}`}>
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
          </div>
        )
      })}
    </div>
  )
}

function EncounterPanel({ encounter }: { encounter: Encounter | null }) {
  if (!encounter) {
    return (
      <div className="ember-card">
        <p className="card-title">Active Encounter</p>
        <p className="soft">No encounter running.</p>
        <Link className="btn" to="/dm/combat">
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
      {shown.map((c) => (
        <div key={c.id} className="shield-combatant-row">
          <span>{c.name}</span>
          <span className="shield-combatant-hp">
            {c.hp ?? '—'}
            {c.hpMax ? ` / ${c.hpMax}` : ''}
          </span>
        </div>
      ))}
      {more > 0 && <p className="soft">+{more} more…</p>}
      <Link className="btn" to="/dm/combat" style={{ marginTop: 10 }}>
        Resume Encounter
      </Link>
    </div>
  )
}

function PinnedPanel({ campaignID }: { campaignID: string }) {
  const [items, setItems] = useState<PinnedItem[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void fetchCampaignPins(campaignID).then((loaded) => {
      if (!cancelled) setItems((loaded ?? []).filter((i) => i.kind !== 'character'))
    })
    return () => {
      cancelled = true
    }
  }, [campaignID])

  async function unpin(item: PinnedItem) {
    setItems((current) => (current ? togglePin(current, item) : current))
    await toggleCampaignPin(campaignID, item)
  }

  return (
    <div className="ember-card">
      <p className="card-title">Pinned</p>
      {items === null ? (
        <p className="soft">Loading…</p>
      ) : items.length === 0 ? (
        <p className="soft">Nothing pinned yet — pin a table or monster to see it here.</p>
      ) : (
        <div className="chip-row chip-row-scroll">
          {items.map((item) => (
            <span key={`${item.kind}-${item.refID}`} className="chip pinned-chip">
              <Link to={item.kind === 'table' ? `/dm/tables?open=${encodeURIComponent(item.refID)}` : `/dm/monsters?open=${encodeURIComponent(item.refID)}`}>
                {item.kind === 'table' ? '▦' : '🐉'} {item.label}
              </Link>
              <button aria-label={`Unpin ${item.label}`} title="Unpin" onClick={() => void unpin(item)}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesPanel({ campaignID, userID }: { campaignID: string; userID: string }) {
  const { campaign, save, update } = useCampaignDoc(campaignID, userID)
  const isGM = !!campaign && campaign.owner_id === userID
  return (
    <div className="ember-card">
      <p className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Session Notes <span className="shield-save-state">{save.kind === 'saving' ? 'Saving…' : save.kind === 'error' ? 'Could not save' : ''}</span>
      </p>
      <textarea
        className="ember-input ember-notes"
        readOnly={!isGM}
        rows={9}
        value={campaign?.notes ?? ''}
        placeholder="the party, the patron, the plot so far…"
        onChange={(e) => update({ notes: e.target.value })}
      />
    </div>
  )
}

function CastPanel({ characters }: { characters: CampaignCharacter[] }) {
  if (characters.length === 0) return <p className="soft">No characters in this campaign yet.</p>
  return (
    <div className="ember-card">
      <p className="card-title">Cast &amp; NPCs</p>
      {characters.map(({ id, data }) => (
        <Link key={id} to={`/characters/${id}`} className="shield-cast-row">
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

function ShieldBody({ campaignID, userID }: { campaignID: string; userID: string | null }) {
  const [index, setIndex] = useState(0)
  const move = (delta: number) => setIndex((i) => ((i + delta) % SCREEN_COUNT + SCREEN_COUNT) % SCREEN_COUNT)
  const go = (i: number) => setIndex(((i % SCREEN_COUNT) + SCREEN_COUNT) % SCREEN_COUNT)
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
            {characters === null ? <p className="soft">Loading…</p> : <PartyStrip characters={characters} />}
            <EncounterPanel encounter={encounter} />
          </div>
          <div className="shield-screen">
            <PinnedPanel campaignID={campaignID} />
          </div>
          <div className="shield-screen">{userID && <NotesPanel campaignID={campaignID} userID={userID} />}</div>
          <div className="shield-screen">
            <CastPanel characters={characters ?? []} />
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
      {campaignID ? <ShieldBody campaignID={campaignID} userID={userID} /> : <p className="soft">The Shield needs an active campaign — choose one at the top (the One-shot has no pins, notes or cast of its own).</p>}
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
