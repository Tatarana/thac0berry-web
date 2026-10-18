import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { fetchDmTables, type DmTableRow } from '../lib/dmTables'
import { normalize } from '../lib/search'
import { toggleCampaignPin } from '../lib/campaignPins'
import { asGrimoireTable } from '../rules/dmTables'
import { loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { loadTables } from '../data/tables'
import { isPinned, togglePin, type PinnedItem } from '../rules/pins'
import { tableLabel, type GrimoireTable } from '../rules/tableIndex'
import type { SessionRow } from '../lib/campaignSessions'
import { PaperModal } from './DetailBits'

// Fixar no Shield sem sair dele (PS3, docs/dm-shield.md): pickers de busca
// que fixam direto, sem precisar ir ao Table Grimoire/Monsters/Sessions.

/** As tabelas de livro mais as do mestre da campanha, para o picker e os cards fixados. */
export function useShieldTables(campaignID: string, userID: string | null, campaignName: string): GrimoireTable[] | null {
  const [tables, setTables] = useState<GrimoireTable[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void Promise.all([loadTables(), userID ? fetchDmTables(userID, campaignID) : Promise.resolve<DmTableRow[]>([])]).then(([book, dm]) => {
      if (cancelled) return
      setTables([...book, ...dm.map((row) => asGrimoireTable(row.id, row.data, campaignName))])
    })
    return () => {
      cancelled = true
    }
  }, [campaignID, userID, campaignName])
  return tables
}

/** O índice de monstros (nome, HD, XP, resumo), para o picker e os cards fixados. */
export function useShieldMonsterIndex(): MonsterIndexEntry[] | null {
  const [index, setIndex] = useState<MonsterIndexEntry[] | null>(null)
  useEffect(() => {
    void loadMonsterIndex().then(setIndex)
  }, [])
  return index
}

function PickerList({ children, empty }: { children: ReactNode; empty: boolean }) {
  return <ul className="slot-choices">{empty ? <li className="soft">No matches.</li> : children}</ul>
}

export function TablePinPicker({
  campaignID,
  tables,
  pinned,
  targetPage,
  onToggled,
  onClose,
}: {
  campaignID: string
  tables: GrimoireTable[] | null
  pinned: PinnedItem[]
  /** A página do Shield que está aberta: novo pin cai nela, não na última. */
  targetPage: number
  onToggled: (next: PinnedItem[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const q = normalize(query)
  const matches = (tables ?? []).filter((t) => q === '' || normalize(tableLabel(t)).includes(q) || normalize(t.title).includes(q)).slice(0, 40)

  async function toggle(table: GrimoireTable) {
    const item: PinnedItem = { kind: 'table', refID: table.id, label: tableLabel(table), page: targetPage }
    onToggled(togglePin(pinned, item))
    await toggleCampaignPin(campaignID, item)
  }

  return createPortal(
    <PaperModal title="Pin a table" onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input className="ink-input" value={query} placeholder="table number or title" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      {tables === null ? (
        <p className="soft">Loading…</p>
      ) : (
        <PickerList empty={matches.length === 0}>
          {matches.map((table) => (
            <li key={table.id}>
              <button className="slot-choice" onClick={() => void toggle(table)}>
                <span className="slot-choice-fav">{isPinned(pinned, 'table', table.id) ? '★' : ''}</span>
                <span className="rec-value">{tableLabel(table)}</span>
                <span className="rec-soft">{table.book}</span>
              </button>
            </li>
          ))}
        </PickerList>
      )}
    </PaperModal>,
    document.body,
  )
}

export function MonsterPinPicker({
  campaignID,
  index,
  pinned,
  targetPage,
  onToggled,
  onClose,
}: {
  campaignID: string
  index: MonsterIndexEntry[] | null
  pinned: PinnedItem[]
  /** A página do Shield que está aberta: novo pin cai nela, não na última. */
  targetPage: number
  onToggled: (next: PinnedItem[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const q = normalize(query)
  const matches = q === '' ? [] : (index ?? []).filter((m) => normalize(m.name).includes(q) || m.aliases.some((a) => normalize(a).includes(q))).slice(0, 40)

  async function toggle(entry: MonsterIndexEntry) {
    const item: PinnedItem = { kind: 'monster', refID: entry.id, label: entry.name, page: targetPage }
    onToggled(togglePin(pinned, item))
    await toggleCampaignPin(campaignID, item)
  }

  return createPortal(
    <PaperModal title="Pin a monster" onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input className="ink-input" value={query} placeholder="monster name" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      {query === '' ? (
        <p className="soft">Type a name to search {index?.length ?? '…'} monsters.</p>
      ) : (
        <PickerList empty={matches.length === 0}>
          {matches.map((entry) => (
            <li key={entry.id}>
              <button className="slot-choice" onClick={() => void toggle(entry)}>
                <span className="slot-choice-fav">{isPinned(pinned, 'monster', entry.id) ? '★' : ''}</span>
                <span className="rec-value">{entry.name}</span>
                <span className="rec-soft">{entry.collection}</span>
              </button>
            </li>
          ))}
        </PickerList>
      )}
    </PaperModal>,
    document.body,
  )
}

export function SessionPinPicker({
  sessions,
  pinnedIDs,
  onToggle,
  onClose,
}: {
  sessions: SessionRow[]
  pinnedIDs: string[]
  onToggle: (session: SessionRow) => void
  onClose: () => void
}) {
  return createPortal(
    <PaperModal title="Pin sessions" subtitle="Shown in Session Notes, in the order picked here" onClose={onClose}>
      <PickerList empty={sessions.length === 0}>
        {sessions.map((session) => (
          <li key={session.id}>
            <button className="slot-choice" onClick={() => onToggle(session)}>
              <span className="slot-choice-fav">{pinnedIDs.includes(session.id) ? '★' : ''}</span>
              <span className="rec-value">{session.date.slice(0, 10)}</span>
              <span className="rec-soft">{session.title || 'Untitled session'}</span>
            </button>
          </li>
        ))}
      </PickerList>
    </PaperModal>,
    document.body,
  )
}
