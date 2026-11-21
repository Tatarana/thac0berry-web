import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DeityDetail } from '../components/DeityDetail'
import { GroupSection } from '../components/GroupSection'
import { deityBooks, deityLabel, duplicateNames, loadDeities, pantheonGroups, pantheonOf, rankGroup, rankOrder, type Deity } from '../data/deities'
import { normalize } from '../lib/search'
import { useGroupToggle } from '../lib/useGroupToggle'

// Compêndio de divindades (DeityCompendiumView do iPad): filtro por livro,
// filtro por panteão (agrupado: cenários, semi-humanos, Legends & Lore, monstros),
// busca por nome, apelidos ou portfólio; grupos por posto divino. O compêndio
// mostra todos; só o Forge esconde os de forgeSelectable false.
export function DeityCompendium() {
  const [deities, setDeities] = useState<Deity[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [book, setBook] = useState<string | null>(null)
  const [pantheon, setPantheon] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Deity | null>(null)

  useEffect(() => {
    loadDeities()
      .then(setDeities)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const filtered = useMemo(() => {
    const base = (deities ?? []).filter((deity) => book === null || deity.book === book).filter((deity) => pantheon === '' || pantheonOf(deity) === pantheon)
    const target = normalize(query)
    if (target === '') return base
    return base.filter(
      (deity) =>
        normalize(deity.name).includes(target) ||
        normalize(deity.aliases ?? '').includes(target) ||
        normalize(deity.portfolio ?? '').includes(target) ||
        normalize(pantheonOf(deity)).includes(target),
    )
  }, [deities, book, pantheon, query])

  const groups = useMemo(
    () =>
      rankOrder
        .map((rank) => ({
          rank,
          deities: filtered.filter((deity) => rankGroup(deity.rank) === rank).sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((entry) => entry.deities.length > 0),
    [filtered],
  )

  const { isExpanded, toggle } = useGroupToggle(query.trim() !== '')
  // Os livros vêm dos dados (antes, uma lista fixa com os dois do Forgotten Realms).
  const books = useMemo(() => deityBooks(deities ?? []), [deities])
  const pantheons = useMemo(() => pantheonGroups(deities ?? []), [deities])
  const repeated = useMemo(() => duplicateNames(deities ?? []), [deities])

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">Deities</h1>
        <p className="paper-soft">
          {deities
            ? `${filtered.length} of ${deities.length} deities · ${pantheons.reduce((n, g) => n + g.pantheons.length, 0)} pantheons`
            : error
              ? `Could not load deities: ${error}`
              : 'Loading deities…'}
        </p>
        <div className="chip-row">
          <button className={book === null ? 'chip chip-on' : 'chip'} onClick={() => setBook(null)}>All</button>
          {books.map((name) => (
            <button key={name} className={book === name ? 'chip chip-on' : 'chip'} onClick={() => setBook(name)}>
              {name}
            </button>
          ))}
        </div>
        <label className="paper-soft deity-pantheon">
          Pantheon{' '}
          <select value={pantheon} onChange={(event) => setPantheon(event.target.value)} aria-label="Filter by pantheon">
            <option value="">All pantheons</option>
            {pantheons.map((entry) => (
              <optgroup key={entry.group} label={entry.group}>
                {entry.pantheons.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <input
          className="paper-search"
          type="search"
          placeholder="name, alias, pantheon or portfolio"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search deities"
        />
        {deities && groups.length === 0 && <p className="paper-soft">No deities match — try a different search.</p>}
        {groups.map((entry) => (
          <GroupSection
            key={entry.rank}
            label={entry.rank}
            count={entry.deities.length}
            expanded={isExpanded(entry.rank)}
            onToggle={() => toggle(entry.rank)}
          >
            {entry.deities.map((deity) => (
              <li key={deity.id}>
                <button className="spell-row kit-row" onClick={() => setSelected(deity)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{deityLabel(deity, repeated)}</span>
                    <span className="spell-meta">{[pantheonOf(deity), deity.alignment ?? '—'].join(' · ')}</span>
                  </span>
                  {deity.portfolio && <span className="kit-summary">{deity.portfolio}</span>}
                </button>
              </li>
            ))}
          </GroupSection>
        ))}
      </div>
      {selected && <DeityDetail deity={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
