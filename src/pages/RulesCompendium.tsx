import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { GroupSection } from '../components/GroupSection'
import { RuleDetail } from '../components/RuleDetail'
import { bookOrder, loadRulesIndex, searchRules, type RuleIndexEntry } from '../data/rules'

function RuleRow({ entry, onSelect }: { entry: RuleIndexEntry; onSelect: () => void }) {
  return (
    <li>
      <button className="spell-row kit-row" onClick={onSelect}>
        <span className="kit-row-top">
          <span className="spell-name">{entry.topic}</span>
          <span className="spell-meta">{entry.book}</span>
        </span>
        <span className="kit-summary">{entry.summary}</span>
      </button>
    </li>
  )
}

// Rules Reference (RulesCompendiumView do iPad): filtro por livro; sem busca,
// capítulos recolhíveis por livro; com busca, resultados por relevância.
export function RulesCompendium() {
  const [entries, setEntries] = useState<RuleIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [book, setBook] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<RuleIndexEntry | null>(null)

  useEffect(() => {
    loadRulesIndex()
      .then(setEntries)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const searching = query.trim() !== ''
  const results = useMemo(() => (entries && searching ? searchRules(entries, query, book) : []), [entries, query, book, searching])

  const chapters = useMemo(() => {
    const books = book ? [book] : bookOrder
    const groups: { key: string; label: string; entries: RuleIndexEntry[] }[] = []
    for (const name of books) {
      const ofBook = (entries ?? []).filter((entry) => entry.book === name)
      const seen: number[] = []
      for (const entry of ofBook) if (!seen.includes(entry.chapterNumber)) seen.push(entry.chapterNumber)
      for (const chapter of seen) {
        const list = ofBook.filter((entry) => entry.chapterNumber === chapter).sort((a, b) => a.topic.localeCompare(b.topic))
        groups.push({ key: `${name}-${chapter}`, label: `${name} Ch. ${chapter}: ${list[0].chapterTitle}`, entries: list })
      }
    }
    return groups
  }, [entries, book])

  function toggle(key: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">Rules Reference</h1>
        <p className="paper-soft">
          {entries
            ? `${entries.length} rules · PHB, DMG, 8 Complete Handbooks & Psionics (4 books)`
            : error
              ? `Could not load rules: ${error}`
              : 'Loading rules…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="topic or keyword (e.g. initiative, surprise, THAC0)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search rules"
        />
        <div className="chip-row">
          <button className={book === null ? 'chip chip-on' : 'chip'} onClick={() => setBook(null)}>All</button>
          {bookOrder.map((name) => (
            <button key={name} className={book === name ? 'chip chip-on' : 'chip'} onClick={() => setBook(name)}>
              {name}
            </button>
          ))}
        </div>

        {searching && entries && results.length === 0 && <p className="paper-soft">No rules match — try a different search.</p>}
        {searching && results.length > 0 && (
          <ul className="spell-list search-results">
            {results.map((entry) => (
              <RuleRow key={entry.id} entry={entry} onSelect={() => setSelected(entry)} />
            ))}
          </ul>
        )}

        {!searching &&
          chapters.map((group) => (
            <GroupSection
              key={group.key}
              label={group.label}
              count={group.entries.length}
              expanded={expanded.has(group.key)}
              onToggle={() => toggle(group.key)}
            >
              {group.entries.map((entry) => (
                <RuleRow key={entry.id} entry={entry} onSelect={() => setSelected(entry)} />
              ))}
            </GroupSection>
          ))}
      </div>
      {selected && <RuleDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
