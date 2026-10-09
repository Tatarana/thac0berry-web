import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { GroupSection } from '../components/GroupSection'
import { RuleDetail } from '../components/RuleDetail'
import { loadBooks } from '../data/books'
import { loadRulesIndex, searchRules, type RuleIndexEntry } from '../data/rules'
import { booksInSetting, settingsOf, type Book } from '../rules/books'
import { useActiveCampaignSettings } from '../lib/activeCampaign'
import { campaignFilterLabel, campaignSettingSet } from '../rules/campaignFilter'

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
/** Valor do filtro de cenário "da campanha ativa" (CA3, só no modo DM). */
const CAMPAIGN = 'campaign'

export function RulesCompendium() {
  const [entries, setEntries] = useState<RuleIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [book, setBook] = useState<string | null>(null)
  // Cenário de campanha (data/books.json): filtra os livros, a lista e a busca.
  // No modo DM, começa pelo cenário da campanha ativa (CA3); undefined = ainda não mexeu.
  const campaignSettings = useActiveCampaignSettings()
  const campaignSet = campaignSettingSet(campaignSettings)
  const [settingPick, setSetting] = useState<string | null | undefined>(undefined)
  const setting = settingPick === undefined ? (campaignSet ? CAMPAIGN : null) : settingPick
  const byCampaign = setting === CAMPAIGN && campaignSet !== null
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<RuleIndexEntry | null>(null)

  useEffect(() => {
    loadRulesIndex()
      .then(setEntries)
      .catch((reason: unknown) => setError(String(reason)))
    loadBooks()
      .then(setBooks)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const settings = useMemo(() => settingsOf(books), [books])
  const visibleBooks = useMemo(
    () => (byCampaign ? booksInSetting(books, null).filter((b) => campaignSet.has(b.setting)) : booksInSetting(books, setting)),
    [books, setting, byCampaign, campaignSet],
  )
  // Livros que entram na lista e na busca: o escolhido, ou os do cenário (null = todos).
  const allowed = useMemo(() => (book ? new Set([book]) : setting ? new Set(visibleBooks.map((b) => b.id)) : null), [book, setting, visibleBooks])
  const pickSetting = (next: string | null) => {
    setSetting(next)
    setBook(null)
  }

  const searching = query.trim() !== ''
  const results = useMemo(() => (entries && searching ? searchRules(entries, query, allowed) : []), [entries, query, allowed, searching])

  const chapters = useMemo(() => {
    const names = book ? [book] : visibleBooks.map((b) => b.id)
    const groups: { key: string; label: string; entries: RuleIndexEntry[] }[] = []
    for (const name of names) {
      const ofBook = (entries ?? []).filter((entry) => entry.book === name)
      const seen: number[] = []
      for (const entry of ofBook) if (!seen.includes(entry.chapterNumber)) seen.push(entry.chapterNumber)
      for (const chapter of seen) {
        const list = ofBook.filter((entry) => entry.chapterNumber === chapter).sort((a, b) => a.topic.localeCompare(b.topic))
        groups.push({ key: `${name}-${chapter}`, label: `${name} Ch. ${chapter}: ${list[0].chapterTitle}`, entries: list })
      }
    }
    return groups
  }, [entries, book, visibleBooks])

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
            ? `${entries.length} rules · ${books.length} books${settings.length > 1 ? ` · ${settings.length} settings` : ''}`
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
        {settings.length > 1 && (
          <div className="paper-filter">
            <span className="paper-label">Setting</span>
            <div className="chip-row">
              {campaignSettings && (
                <button className={setting === CAMPAIGN ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(CAMPAIGN)}>
                  {campaignFilterLabel(campaignSettings)}
                </button>
              )}
              <button className={setting === null ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(null)}>All</button>
              {settings.map((name) => (
                <button key={name} className={setting === name ? 'chip chip-on' : 'chip'} onClick={() => pickSetting(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="paper-filter">
          <span className="paper-label">Book</span>
          <div className="chip-row">
            <button className={book === null ? 'chip chip-on' : 'chip'} onClick={() => setBook(null)}>All</button>
            {visibleBooks.map((b) => (
              <button key={b.id} className={book === b.id ? 'chip chip-on' : 'chip'} title={b.title} onClick={() => setBook(b.id)}>
                {b.id}
              </button>
            ))}
          </div>
        </div>
        {book && <p className="paper-soft">{books.find((b) => b.id === book)?.title}</p>}

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
