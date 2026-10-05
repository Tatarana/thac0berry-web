import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Field, PaperModal, TextBlock } from '../components/DetailBits'
import { GroupSection } from '../components/GroupSection'
import { loadData } from '../data/load'
import {
  abbreviatedMechanics,
  proficiencyGroupOrder,
  signedModifier,
  skillsAndPowersText,
  type Proficiency,
} from '../data/proficiencies'
import { isGenericSetting } from '../data/spells'
import { normalize } from '../lib/search'
import { useGroupToggle } from '../lib/useGroupToggle'

function ProficiencyDetail({ proficiency, onClose }: { proficiency: Proficiency; onClose: () => void }) {
  const { mechanics } = proficiency
  return (
    <PaperModal title={proficiency.name} subtitle={proficiency.primaryGroup} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Ability" value={mechanics.relevantAbility} />
        <Field label="Check Modifier" value={signedModifier(mechanics.checkModifier)} />
        <Field label="Slots Required" value={String(mechanics.slotsRequired)} />
        <Field label="Setting" value={proficiency.campaignSettings.join(', ')} />
        <Field label="Learned by" value={mechanics.groups.join('; ')} />
        <Field label="Prerequisites" value={mechanics.prerequisites.join(', ')} />
      </div>
      <TextBlock label="Description" text={proficiency.description.fullText} />
      <TextBlock label="Skills & Powers (optional rule)" text={skillsAndPowersText(proficiency)} />
    </PaperModal>
  )
}

// Compêndio de proficiências (ProficiencyCompendiumView do iPad): filtro por
// cenário (as de "Core" aparecem sempre), busca por nome, grupos fixos.
export function ProficiencyCompendium() {
  const [all, setAll] = useState<Proficiency[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [settings, setSettings] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Proficiency | null>(null)

  useEffect(() => {
    loadData<Proficiency[]>('proficiencies.json')
      .then(setAll)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const settingOptions = useMemo(
    () => [...new Set((all ?? []).flatMap((p) => p.campaignSettings).filter((s) => !isGenericSetting(s)))].sort(),
    [all],
  )

  const filtered = useMemo(() => {
    const target = normalize(query)
    return (all ?? []).filter((p) => {
      if (settings.size > 0) {
        const generic = p.campaignSettings.some((s) => isGenericSetting(s))
        if (!generic && !p.campaignSettings.some((s) => settings.has(s))) return false
      }
      return target === '' || normalize(p.name).includes(target)
    })
  }, [all, settings, query])

  const groups = useMemo(
    () =>
      proficiencyGroupOrder
        .map((group) => ({
          group,
          items: filtered.filter((p) => p.primaryGroup === group).sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((entry) => entry.items.length > 0),
    [filtered],
  )

  const { isExpanded, toggle: toggleGroup } = useGroupToggle(query.trim() !== '' || settings.size > 0)

  function toggleSetting(setting: string) {
    setSettings((current) => {
      const next = new Set(current)
      if (next.has(setting)) next.delete(setting)
      else next.add(setting)
      return next
    })
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">Proficiencies</h1>
        <p className="paper-soft">
          {all ? `${filtered.length} of ${all.length} proficiencies` : error ? `Could not load: ${error}` : 'Loading…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="proficiency name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search proficiencies"
        />
        {settingOptions.length > 0 && (
          <div className="paper-filter">
            <span className="paper-label">Setting</span>
            <div className="chip-row">
              {settingOptions.map((option) => (
                <button
                  key={option}
                  className={settings.has(option) ? 'chip chip-on' : 'chip'}
                  onClick={() => toggleSetting(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        {all && groups.length === 0 && <p className="paper-soft">No proficiencies match — try a different search.</p>}
        {groups.map((entry) => (
          <GroupSection
            key={entry.group}
            label={entry.group}
            count={entry.items.length}
            expanded={isExpanded(entry.group)}
            onToggle={() => toggleGroup(entry.group)}
          >
            {entry.items.map((p) => (
              <li key={p.id}>
                <button className="spell-row kit-row" onClick={() => setSelected(p)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{p.name}</span>
                    <span className="spell-meta">{abbreviatedMechanics(p)}</span>
                  </span>
                  <span className="kit-summary">{p.description.briefSummary}</span>
                </button>
              </li>
            ))}
          </GroupSection>
        ))}
      </div>
      {selected && <ProficiencyDetail proficiency={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
