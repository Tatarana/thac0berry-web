import { useState } from 'react'
import type { PlayerCharacter } from '../types/library'
import {
  abilityWarnings,
  applyRace,
  hasAbilityRequirements,
  matchRace,
  planarRaces,
  raceAdjustmentsText,
  races,
  raceSettingWarning,
  ravenloftRaces,
  type RaceName,
} from '../rules/raceKit'
import { RuleLink } from './RuleLink'

// Etapa 3 do The Forge: galeria de raças, agrupada por origem (PHB /
// Planescape / Ravenloft), com o aviso não-bloqueante de cenário
// (raceSettingWarning — o mesmo "doesn't fit this campaign, choose anyway"
// das outras telas). A classe ainda não foi escolhida (etapa 4), então os
// avisos aqui são só os independentes de classe: faixa de atributo e cenário.

export function ForgeRaceStep({
  draft,
  mutate,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onNext: () => void
  onBack: () => void
}) {
  const [pending, setPending] = useState<RaceName | null>(null)
  const current = matchRace(draft.race)

  const warningsFor = (race: RaceName): string[] => {
    const setting = raceSettingWarning(race, null)
    return [...abilityWarnings(race, draft.abilities), ...(setting ? [setting] : [])]
  }

  const choose = (race: RaceName) => {
    mutate((c) => applyRace(c, race))
    setPending(null)
  }

  const pendingWarnings = pending ? warningsFor(pending) : []

  const group = (title: string, list: RaceName[]) =>
    list.length === 0 ? null : (
      <div key={title || 'phb'}>
        {title && <p className="forge-group-label">{title}</p>}
        <div className="forge-grid">
          {list.map((race) => {
            const warnings = warningsFor(race)
            return (
              <button
                key={race}
                type="button"
                className={current === race ? 'ember-card forge-card-selected' : 'ember-card'}
                onClick={() => (warnings.length > 0 ? setPending(race) : choose(race))}
              >
                <span className="card-title">
                  {current === race ? '★ ' : ''}
                  {race}
                </span>
                <span className="soft">
                  {[raceAdjustmentsText(race), hasAbilityRequirements(race) ? 'ability score minimums apply' : 'no ability score restrictions']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {warnings.length > 0 && (
                  <span className="forge-warn">
                    ⚠ {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )

  return (
    <section className="forge-step">
      <h2 className="forge-step-title">
        Race
        <RuleLink ruleID="phb_ch02_character_race_tables" title="Character races" />
      </h2>
      {pending ? (
        <div className="ember-card forge-warn-card">
          <p className="soft">This character doesn&rsquo;t fit the {pending} rules:</p>
          <ul>
            {pendingWarnings.map((w) => (
              <li key={w} className="forge-warn">
                ⚠ {w}
              </li>
            ))}
          </ul>
          <div className="btn-row">
            <button className="btn" onClick={() => setPending(null)}>← back</button>
            <button className="btn" onClick={() => choose(pending)}>choose {pending} anyway</button>
          </div>
        </div>
      ) : (
        <>
          {group('', races)}
          {group("Planescape · The Planewalker's Handbook", planarRaces)}
          {group('Ravenloft · Domains of Dread', ravenloftRaces)}
          <p className="soft">Choosing a race applies its ability adjustments to the scores from the previous step.</p>
        </>
      )}
      <div className="btn-row">
        <button className="btn" onClick={onBack}>← Back</button>
        <button className="btn" disabled={!current} onClick={onNext}>
          Next →
        </button>
      </div>
    </section>
  )
}
