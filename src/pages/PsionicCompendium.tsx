import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Field, PaperModal, TextBlock } from '../components/DetailBits'
import { GroupSection } from '../components/GroupSection'
import { loadData } from '../data/load'
import { normalize } from '../lib/search'

// Poderes psiônicos (schemas/psionic-power.schema.json; PsionicPowerCompendiumView
// do iPad): filtro por categoria, busca por nome ou disciplina, grupos por
// disciplina (dentro deles: Devotion, Science, Enhancement, e nome).
interface PsionicPower {
  id: string
  title: string
  discipline: string
  powerTier: string
  powerScore: { raw: string; baseAbility: string; modifier: number }
  pspCost: { initial: string; maintenance?: string | null; summary: string }
  tacticalCombat?: { mac: string } | null
  parameters: { range: string; preparationTime: string; areaOfEffect: string; prerequisites: string[] }
  description: {
    briefSummary: string
    fullText: string
    sections: { effect: string; powerScoreRollResults?: { powerScoreSuccess: string; criticalFailure20: string } | null }
  }
  sources: { book: string; page?: number | null }[]
}

const tierOrder = ['Devotion', 'Science', 'Psionic Enhancement']
const disciplineOrder = ['Clairsentience', 'Psychokinesis', 'Psychometabolism', 'Psychoportation', 'Telepathy', 'Metapsionics']
const tierRank = (tier: string) => {
  const index = tierOrder.indexOf(tier)
  return index === -1 ? tierOrder.length : index
}

function PowerDetail({ power, onClose }: { power: PsionicPower; onClose: () => void }) {
  const rolls = power.description.sections.powerScoreRollResults
  return (
    <PaperModal title={power.title} subtitle={`${power.discipline} · ${power.powerTier}`} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Power Score" value={power.powerScore.raw} />
        <Field label="PSP Cost (initial/maint.)" value={power.pspCost.summary} />
        <Field label="MAC" value={power.tacticalCombat?.mac} />
        <Field label="Range" value={power.parameters.range} />
        <Field label="Preparation Time" value={power.parameters.preparationTime} />
        <Field label="Area of Effect" value={power.parameters.areaOfEffect} />
        <Field label="Prerequisites" value={power.parameters.prerequisites.join(', ')} />
        <Field label="Source" value={power.sources.map((source) => source.book).join(', ')} />
      </div>
      <TextBlock label="Effect" text={power.description.sections.effect} />
      {rolls && (
        <>
          <TextBlock label="Power Score (exceptional success)" text={rolls.powerScoreSuccess} />
          <TextBlock label="Roll of 20 (critical failure)" text={rolls.criticalFailure20} />
        </>
      )}
    </PaperModal>
  )
}

export function PsionicCompendium() {
  const [powers, setPowers] = useState<PsionicPower[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tier, setTier] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<PsionicPower | null>(null)

  useEffect(() => {
    loadData<PsionicPower[]>('psionic-powers.json')
      .then(setPowers)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const filtered = useMemo(() => {
    const target = normalize(query)
    return (powers ?? []).filter((power) => {
      if (tier && power.powerTier !== tier) return false
      return target === '' || normalize(power.title).includes(target) || normalize(power.discipline).includes(target)
    })
  }, [powers, tier, query])

  const groups = useMemo(
    () =>
      disciplineOrder
        .map((discipline) => ({
          discipline,
          powers: filtered
            .filter((power) => power.discipline === discipline)
            .sort((a, b) => tierRank(a.powerTier) - tierRank(b.powerTier) || a.title.localeCompare(b.title)),
        }))
        .filter((group) => group.powers.length > 0),
    [filtered],
  )

  const active = query.trim() !== '' || tier !== null

  function toggle(discipline: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(discipline)) next.delete(discipline)
      else next.add(discipline)
      return next
    })
  }

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/compendium" className="paper-link">‹ Compendium</Link>
        </div>
        <h1 className="paper-title">Psionic Powers</h1>
        <p className="paper-soft">
          {powers
            ? `${filtered.length} of ${powers.length} powers · Complete Psionics Handbook`
            : error
              ? `Could not load: ${error}`
              : 'Loading powers…'}
        </p>
        <input
          className="paper-search"
          type="search"
          placeholder="power or discipline"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search psionic powers"
        />
        <div className="chip-row">
          <button className={tier === null ? 'chip chip-on' : 'chip'} onClick={() => setTier(null)}>All</button>
          {tierOrder.map((name) => (
            <button key={name} className={tier === name ? 'chip chip-on' : 'chip'} onClick={() => setTier(name)}>
              {name}
            </button>
          ))}
        </div>
        {powers && groups.length === 0 && <p className="paper-soft">No powers match — try a different search.</p>}
        {groups.map((group) => (
          <GroupSection
            key={group.discipline}
            label={group.discipline}
            count={group.powers.length}
            expanded={active || expanded.has(group.discipline)}
            onToggle={() => toggle(group.discipline)}
          >
            {group.powers.map((power) => (
              <li key={power.id}>
                <button className="spell-row kit-row" onClick={() => setSelected(power)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{power.title}</span>
                    <span className="spell-meta">
                      {power.powerTier} · {power.pspCost.summary} PSP
                    </span>
                  </span>
                  <span className="kit-summary">{power.description.briefSummary}</span>
                </button>
              </li>
            ))}
          </GroupSection>
        ))}
      </div>
      {selected && <PowerDetail power={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
