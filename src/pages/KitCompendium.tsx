import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { GroupSection } from '../components/GroupSection'
import { KitDetail } from '../components/KitDetail'
import { loadKits, subclassOrder, type ClassGroup, type Kit } from '../data/kits'
import { normalize } from '../lib/search'

// Compêndio de kits de um grupo de classe (KitCompendiumView do iPad):
// busca por nome, divindade ou título na igreja; grupos por subclasse.
export function KitCompendium({ group }: { group: ClassGroup }) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Kit | null>(null)

  useEffect(() => {
    loadKits(group)
      .then(setKits)
      .catch((reason: unknown) => setError(String(reason)))
  }, [group])

  const filtered = useMemo(() => {
    const target = normalize(query)
    if (target === '') return kits ?? []
    return (kits ?? []).filter(
      (kit) =>
        normalize(kit.name).includes(target) ||
        normalize(kit.deity ?? '').includes(target) ||
        normalize(kit.titleInChurch ?? '').includes(target),
    )
  }, [kits, query])

  const groups = useMemo(
    () =>
      subclassOrder[group]
        .map((subclass) => ({
          subclass,
          kits: filtered
            .filter((kit) => kit.classEligibility.subclass === subclass)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((entry) => entry.kits.length > 0),
    [filtered, group],
  )

  const searching = query.trim() !== ''

  function toggle(subclass: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(subclass)) next.delete(subclass)
      else next.add(subclass)
      return next
    })
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">{group} Kits</h1>
        <p className="paper-soft">
          {kits ? `${filtered.length} of ${kits.length} kits` : error ? `Could not load kits: ${error}` : 'Loading kits…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="kit name, deity or title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search kits"
        />
        {kits && groups.length === 0 && <p className="paper-soft">No kits match — try a different search.</p>}
        {groups.map((entry) => (
          <GroupSection
            key={entry.subclass}
            label={entry.subclass}
            count={entry.kits.length}
            expanded={searching || expanded.has(entry.subclass)}
            onToggle={() => toggle(entry.subclass)}
          >
            {entry.kits.map((kit) => (
              <li key={kit.id}>
                <button className="spell-row kit-row" onClick={() => setSelected(kit)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{kit.name}</span>
                    <span className="spell-meta">{kit.sourceBook}</span>
                  </span>
                  <span className="kit-summary">{kit.description.briefSummary}</span>
                </button>
              </li>
            ))}
          </GroupSection>
        ))}
      </div>
      {selected && <KitDetail kit={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
