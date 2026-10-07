import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DmOnly } from '../components/DmOnly'
import { MonsterDetail } from '../components/MonsterDetail'
import { loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { filterMonsters, frequencyBuckets, monsterCollections, xpLabel, type FrequencyBucket, type MonsterSort } from '../rules/monsters'

// Linhas antes do "Show all" (2.386 monstros travam o celular de uma vez); a
// busca e os filtros valem para todos.
const ROW_LIMIT = 200

const sorts: { value: MonsterSort; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'hitDice', label: 'Hit Dice' },
  { value: 'xp', label: 'XP' },
]

// Catálogo de monstros (ferramenta do DM): busca por nome e apelido, filtro por
// coleção e frequência, ordem por nome, HD ou XP; a ficha abre por cima.
export function MonsterCompendium() {
  return (
    <DmOnly>
      <MonsterList />
    </DmOnly>
  )
}

function MonsterList() {
  const [monsters, setMonsters] = useState<MonsterIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [collection, setCollection] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<FrequencyBucket | null>(null)
  const [sort, setSort] = useState<MonsterSort>('name')
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<MonsterIndexEntry | null>(null)

  useEffect(() => {
    loadMonsterIndex()
      .then(setMonsters)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const filtered = useMemo(() => filterMonsters(monsters ?? [], { query, collection, frequency, sort }), [monsters, query, collection, frequency, sort])
  const rows = showAll ? filtered : filtered.slice(0, ROW_LIMIT)

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/dm" className="paper-link">‹ DM Tools</Link>
        </div>
        <h1 className="paper-title">Monsters</h1>
        <p className="paper-soft">
          {monsters ? `${filtered.length} of ${monsters.length} monsters` : error ? `Could not load: ${error}` : 'Loading monsters…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="monster name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search monsters"
        />
        <div className="paper-filter">
          <span className="paper-label">Collection</span>
          <div className="chip-row chip-row-scroll">
            <button className={collection === null ? 'chip chip-on' : 'chip'} onClick={() => setCollection(null)}>All</button>
            {monsterCollections.map((name) => (
              <button key={name} className={collection === name ? 'chip chip-on' : 'chip'} onClick={() => setCollection(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="paper-filter">
          <span className="paper-label">Frequency</span>
          <div className="chip-row">
            <button className={frequency === null ? 'chip chip-on' : 'chip'} onClick={() => setFrequency(null)}>All</button>
            {frequencyBuckets.map((name) => (
              <button key={name} className={frequency === name ? 'chip chip-on' : 'chip'} onClick={() => setFrequency(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="paper-filter">
          <span className="paper-label">Sort by</span>
          <div className="chip-row">
            {sorts.map((s) => (
              <button key={s.value} className={sort === s.value ? 'chip chip-on' : 'chip'} onClick={() => setSort(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {monsters && filtered.length === 0 && <p className="paper-soft">No monsters match — try a different search or filter.</p>}
        <ul className="monster-list">
          {rows.map((m) => (
            <li key={m.id}>
              <button className="spell-row kit-row" onClick={() => setSelected(m)}>
                <span className="kit-row-top">
                  <span className="spell-name">
                    {m.name}
                    {m.variants > 1 && <span className="monster-variants"> · {m.variants} variants</span>}
                  </span>
                  <span className="spell-meta">
                    {[m.hitDice ? `HD ${m.hitDice.split('\n')[0]}` : null, xpLabel(m) ? `${xpLabel(m)} XP` : null].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="kit-summary">
                  <span className="monster-collection">{m.collection}</span>
                  {m.summary ? ` — ${m.summary}` : ''}
                </span>
              </button>
            </li>
          ))}
          {!showAll && filtered.length > ROW_LIMIT && (
            <li>
              <button className="paper-link show-all" onClick={() => setShowAll(true)}>
                Show all {filtered.length} monsters ({filtered.length - ROW_LIMIT} more)
              </button>
            </li>
          )}
        </ul>
      </div>
      {selected && <MonsterDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
