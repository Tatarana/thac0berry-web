import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { SpellDetail } from '../components/SpellDetail'
import {
  axisValues,
  isGenericSetting,
  levelLabel,
  loadSpellIndex,
  type Caster,
  type SpellIndexEntry,
} from '../data/spells'
import { useFavoriteSpells } from '../lib/favoriteSpells'
import { matchesName } from '../lib/search'
import { useGroupToggle } from '../lib/useGroupToggle'

interface LevelGroup {
  level: number
  spells: SpellIndexEntry[]
}

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

// Grimório no papel (SpellbookView do iPad): busca, filtro por esfera/escola,
// filtro por cenário (as genéricas aparecem sempre), círculos recolhíveis e
// estrela de favorita com o filtro "Favorites" (só com sessão).
export function Grimoire({ caster }: { caster: Caster }) {
  const [all, setAll] = useState<SpellIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [axisFilter, setAxisFilter] = useState<Set<string>>(new Set())
  const [settingFilter, setSettingFilter] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<SpellIndexEntry | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const favorites = useFavoriteSpells()

  useEffect(() => {
    loadSpellIndex()
      .then((index) => setAll(index[caster]))
      .catch((reason: unknown) => setError(String(reason)))
  }, [caster])

  const title = caster === 'arcane' ? 'Mage Grimoire' : 'Priest Grimoire'
  const axisTitle = caster === 'arcane' ? 'School' : 'Sphere'

  const axisOptions = useMemo(
    () => [...new Set((all ?? []).flatMap((spell) => axisValues(caster, spell)))].sort(),
    [all, caster],
  )
  const settingOptions = useMemo(
    () =>
      [...new Set((all ?? []).map((spell) => spell.setting).filter((s): s is string => s !== null && !isGenericSetting(s)))].sort(),
    [all],
  )

  const filtered = useMemo(() => {
    return (all ?? []).filter((spell) => {
      if (favoritesOnly && favorites.available && !favorites.has(spell.id)) return false
      if (axisFilter.size > 0 && !axisValues(caster, spell).some((value) => axisFilter.has(value))) return false
      if (settingFilter.size > 0 && !isGenericSetting(spell.setting) && !settingFilter.has(spell.setting ?? '')) return false
      return matchesName(spell.name, query)
    })
  }, [all, caster, axisFilter, settingFilter, query, favoritesOnly, favorites])

  const groups: LevelGroup[] = useMemo(() => {
    const byLevel = new Map<number, SpellIndexEntry[]>()
    for (const spell of filtered) {
      const list = byLevel.get(spell.level) ?? []
      list.push(spell)
      byLevel.set(spell.level, list)
    }
    return [...byLevel.keys()]
      .sort((a, b) => a - b)
      .map((level) => ({ level, spells: (byLevel.get(level) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }))
  }, [filtered])

  const hasActiveFilter = favoritesOnly || query.trim() !== '' || axisFilter.size > 0 || settingFilter.size > 0
  const groupToggle = useGroupToggle(hasActiveFilter)
  const isExpanded = (level: number) => groupToggle.isExpanded(String(level))
  const toggleLevel = (level: number) => groupToggle.toggle(String(level))

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">{title}</h1>
        <p className="paper-soft">
          {all ? `${filtered.length} of ${all.length} spells` : error ? `Could not load spells: ${error}` : 'Loading spells…'}
        </p>

        <input
          className="paper-search"
          type="search"
          placeholder="spell name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search spells by name"
        />

        {favorites.available && (
          <div className="paper-filter">
            <span className="paper-label">Favorites</span>
            <div className="chip-row">
              <button className={favoritesOnly ? 'chip chip-on' : 'chip'} onClick={() => setFavoritesOnly((on) => !on)} aria-pressed={favoritesOnly}>
                ★ Favorites only
              </button>
            </div>
            {favorites.error && <p className="paper-soft rec-red">Could not save favorites: {favorites.error}</p>}
          </div>
        )}

        <div className="paper-filter">
          <span className="paper-label">{axisTitle}</span>
          <div className="chip-row">
            {axisOptions.map((option) => (
              <button
                key={option}
                className={axisFilter.has(option) ? 'chip chip-on' : 'chip'}
                onClick={() => setAxisFilter((current) => toggle(current, option))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {settingOptions.length > 0 && (
          <div className="paper-filter">
            <span className="paper-label">Setting</span>
            <div className="chip-row">
              {settingOptions.map((option) => (
                <button
                  key={option}
                  className={settingFilter.has(option) ? 'chip chip-on' : 'chip'}
                  onClick={() => setSettingFilter((current) => toggle(current, option))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {(axisFilter.size > 0 || settingFilter.size > 0) && (
          <button
            className="paper-link"
            onClick={() => {
              setAxisFilter(new Set())
              setSettingFilter(new Set())
            }}
          >
            clear filters
          </button>
        )}

        {all && groups.length === 0 && <p className="paper-soft">No spells match — try a different search.</p>}

        {groups.map((group) => (
          <section key={group.level} className="level-section">
            <button className="level-header" onClick={() => toggleLevel(group.level)} aria-expanded={isExpanded(group.level)}>
              <span>{levelLabel(caster, group.level)}</span>
              <span className="level-count">
                {group.spells.length} {isExpanded(group.level) ? '▾' : '▸'}
              </span>
            </button>
            {isExpanded(group.level) && (
              <ul className="spell-list">
                {group.spells.map((spell) => (
                  <li key={spell.id} className={favorites.available ? 'spell-item' : undefined}>
                    {favorites.available && (
                      <button
                        className={favorites.has(spell.id) ? 'fav-star fav-on' : 'fav-star'}
                        onClick={() => favorites.toggle(spell.id)}
                        aria-pressed={favorites.has(spell.id)}
                        aria-label={`Favorite ${spell.name}`}
                        title={favorites.has(spell.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {favorites.has(spell.id) ? '★' : '☆'}
                      </button>
                    )}
                    <button className="spell-row" onClick={() => setSelected(spell)}>
                      <span className="spell-name">{spell.name}</span>
                      <span className="spell-meta">
                        {axisValues(caster, spell).join(', ') || spell.school}
                        {spell.setting && !isGenericSetting(spell.setting) ? ` · ${spell.setting}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {selected && (
        <SpellDetail
          entry={selected}
          onClose={() => setSelected(null)}
          favorite={favorites.available ? { on: favorites.has(selected.id), toggle: () => favorites.toggle(selected.id) } : undefined}
        />
      )}
    </div>
  )
}
