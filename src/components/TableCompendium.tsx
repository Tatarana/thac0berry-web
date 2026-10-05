import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { loadData } from '../data/load'
import { normalize } from '../lib/search'
import { useGroupToggle } from '../lib/useGroupToggle'
import { GroupSection } from './GroupSection'

export interface Column<T> {
  header: string
  value: (item: T) => string
}

interface TableCompendiumProps<T extends { id: string; name: string }> {
  title: string
  file: string
  noun: string
  searchPlaceholder: string
  /** Rótulo do grupo de cada item e a ordem dos grupos. */
  groupOf: (item: T) => string
  groupOrder: (presentGroups: string[]) => string[]
  columns: Column<T>[]
  renderDetail: (item: T, onClose: () => void) => ReactNode
}

// Compêndio em tabela (armas, armaduras, equipamento — os
// *CompendiumView do iPad com colunas): busca por nome, grupos recolhíveis,
// linhas em colunas e ficha ao tocar.
export function TableCompendium<T extends { id: string; name: string }>({
  title,
  file,
  noun,
  searchPlaceholder,
  groupOf,
  groupOrder,
  columns,
  renderDetail,
}: TableCompendiumProps<T>) {
  const [items, setItems] = useState<T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<T | null>(null)

  useEffect(() => {
    loadData<T[]>(file)
      .then(setItems)
      .catch((reason: unknown) => setError(String(reason)))
  }, [file])

  const filtered = useMemo(() => {
    const target = normalize(query)
    if (target === '') return items ?? []
    return (items ?? []).filter((item) => normalize(item.name).includes(target))
  }, [items, query])

  const groups = useMemo(() => {
    const present = [...new Set(filtered.map(groupOf))]
    return groupOrder(present)
      .map((label) => ({
        label,
        items: filtered.filter((item) => groupOf(item) === label).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((group) => group.items.length > 0)
  }, [filtered, groupOf, groupOrder])

  const { isExpanded, toggle } = useGroupToggle(query.trim() !== '')
  const gridStyle = { gridTemplateColumns: `minmax(9rem, 2.2fr) repeat(${columns.length}, minmax(3.2rem, 1fr))` }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">{title}</h1>
        <p className="paper-soft">
          {items ? `${filtered.length} of ${items.length} ${noun}` : error ? `Could not load: ${error}` : 'Loading…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={`Search ${noun}`}
        />
        {items && groups.length === 0 && <p className="paper-soft">No {noun} match — try a different search.</p>}
        {groups.length > 0 && (
          <div className="table-head" style={gridStyle} aria-hidden="true">
            <span>Name</span>
            {columns.map((column) => (
              <span key={column.header}>{column.header}</span>
            ))}
          </div>
        )}
        {groups.map((group) => (
          <GroupSection
            key={group.label}
            label={group.label}
            count={group.items.length}
            expanded={isExpanded(group.label)}
            onToggle={() => toggle(group.label)}
          >
            {group.items.map((item) => (
              <li key={item.id}>
                <button className="table-row" style={gridStyle} onClick={() => setSelected(item)}>
                  <span className="spell-name">{item.name}</span>
                  {columns.map((column) => (
                    <span key={column.header} className="table-cell" data-label={column.header}>
                      {column.value(item)}
                    </span>
                  ))}
                </button>
              </li>
            ))}
          </GroupSection>
        ))}
      </div>
      {selected && renderDetail(selected, () => setSelected(null))}
    </div>
  )
}
