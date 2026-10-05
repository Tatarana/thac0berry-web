import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { GroupSection } from '../components/GroupSection'
import { MagicItemDetail } from '../components/MagicItemDetail'
import {
  groupForBook,
  groupsFor,
  loadMagicIndex,
  magicCategoryOrder,
  sourceGroups,
  type MagicItemIndexEntry,
  type SourceGroup,
} from '../data/magicItems'
import { normalize } from '../lib/search'

// Linhas por categoria antes do "Show all": com uma fonte escolhida, o iPad
// abre tudo (até ~5.100 itens); no navegador isso trava o celular por mais de
// um segundo. A busca continua valendo para todos os itens.
const ROW_LIMIT = 150

// Itens mágicos (MagicItemCompendiumView do iPad): busca por nome; filtro por
// grupo de fonte e, dentro dele, por livro; grupos por categoria.
export function MagicItemCompendium() {
  const [items, setItems] = useState<MagicItemIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sourceGroup, setSourceGroup] = useState<SourceGroup | null>(null)
  const [book, setBook] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<MagicItemIndexEntry | null>(null)
  // Categorias em que o usuário pediu "mostrar todos" (ver ROW_LIMIT).
  const [showAll, setShowAll] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadMagicIndex()
      .then(setItems)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const booksInGroup = useMemo(() => {
    if (!sourceGroup) return []
    const set = new Set<string>()
    for (const item of items ?? []) for (const name of item.books) if (groupForBook(name) === sourceGroup) set.add(name)
    return [...set].sort()
  }, [items, sourceGroup])

  const filtered = useMemo(() => {
    const target = normalize(query)
    return (items ?? []).filter((item) => {
      if (sourceGroup && !groupsFor(item).has(sourceGroup)) return false
      if (book && !item.books.includes(book)) return false
      return target === '' || normalize(item.name).includes(target)
    })
  }, [items, query, sourceGroup, book])

  const groups = useMemo(
    () =>
      magicCategoryOrder
        .map((category) => ({
          category,
          items: filtered.filter((item) => item.category === category).sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((group) => group.items.length > 0),
    [filtered],
  )

  // Como no iPad: com busca ou fonte escolhida, tudo abre (e dá para fechar).
  const autoExpand = query.trim() !== '' || sourceGroup !== null
  const isExpanded = (category: string) => (autoExpand ? !collapsed.has(category) : expanded.has(category))

  function toggle(category: string) {
    const setter = autoExpand ? setCollapsed : setExpanded
    setter((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function chooseGroup(group: SourceGroup | null) {
    setSourceGroup(group)
    setBook(null)
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">Magic Items</h1>
        <p className="paper-soft">
          {items ? `${filtered.length} of ${items.length} items` : error ? `Could not load: ${error}` : 'Loading items…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="item name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search magic items"
        />
        <div className="paper-filter">
          <span className="paper-label">Source</span>
          <div className="chip-row">
            <button className={sourceGroup === null ? 'chip chip-on' : 'chip'} onClick={() => chooseGroup(null)}>All</button>
            {sourceGroups.map((group) => (
              <button key={group} className={sourceGroup === group ? 'chip chip-on' : 'chip'} onClick={() => chooseGroup(group)}>
                {group}
              </button>
            ))}
          </div>
        </div>
        {sourceGroup && booksInGroup.length > 1 && (
          <div className="paper-filter">
            <span className="paper-label">Book ({sourceGroup})</span>
            <div className="chip-row chip-row-scroll">
              <button className={book === null ? 'chip chip-on' : 'chip'} onClick={() => setBook(null)}>All</button>
              {booksInGroup.map((name) => (
                <button key={name} className={book === name ? 'chip chip-on' : 'chip'} onClick={() => setBook(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        {items && groups.length === 0 && <p className="paper-soft">No magic items match — try a different search or filter.</p>}
        {groups.map((group) => (
          <GroupSection
            key={group.category}
            label={group.category}
            count={group.items.length}
            expanded={isExpanded(group.category)}
            onToggle={() => toggle(group.category)}
          >
            {(showAll.has(group.category) ? group.items : group.items.slice(0, ROW_LIMIT)).map((item) => (
              <li key={item.id}>
                <button className="spell-row kit-row" onClick={() => setSelected(item)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{item.name}</span>
                    <span className="spell-meta">{item.books[0] ?? 'Unknown'}</span>
                  </span>
                  <span className="kit-summary">{item.summary}</span>
                </button>
              </li>
            ))}
            {!showAll.has(group.category) && group.items.length > ROW_LIMIT && (
              <li>
                <button
                  className="paper-link show-all"
                  onClick={() => setShowAll((current) => new Set(current).add(group.category))}
                >
                  Show all {group.items.length} items ({group.items.length - ROW_LIMIT} more)
                </button>
              </li>
            )}
          </GroupSection>
        ))}
      </div>
      {selected && <MagicItemDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
