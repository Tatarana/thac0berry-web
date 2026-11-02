import { useState } from 'react'
import { allowedBySettings } from '../rules/campaignFilter'
import type { AbilityScores, PlayerCharacter } from '../types/library'
import {
  abilityWarnings,
  matchRace,
  raceAdjustments,
  raceCampaignSetting,
  raceLabel,
  racesForGender,
  raceSettingWarning,
  replaceRace,
  type RaceName,
} from '../rules/raceKit'
import { genderOf, raceImages } from '../lib/forgeImages'
import { ForgeCard, ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeSettingsPicker } from './ForgeParts'

// Etapa 3 do The Forge: as raças em cards ilustrados (mesmo ForgeCard do
// gênero). Só as raças do sexo escolhido na etapa 2 (Bariaur tem uma por
// sexo), filtradas pelos cenários da mesa (os mesmos da etapa de classe); a
// imagem é a do gênero escolhido. Escolher troca a raça desfazendo a anterior
// (replaceRace) e mostra os seis atributos já ajustados. Avisos de faixa de
// atributo e de cenário aparecem, mas nunca bloqueiam (o mestre decide).

const abilityOrder: { key: keyof AbilityScores; abbr: string }[] = [
  { key: 'strength', abbr: 'STR' },
  { key: 'dexterity', abbr: 'DEX' },
  { key: 'constitution', abbr: 'CON' },
  { key: 'intelligence', abbr: 'INT' },
  { key: 'wisdom', abbr: 'WIS' },
  { key: 'charisma', abbr: 'CHA' },
]

const abbrOf = (key: keyof AbilityScores) => abilityOrder.find((a) => a.key === key)?.abbr ?? key

export function ForgeRaceStep({
  draft,
  mutate,
  settings,
  onSettings,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  onSettings: (next: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [help, setHelp] = useState(false)
  const current = matchRace(draft.race)
  const gender = genderOf(draft.sex)

  // Os atributos da etapa 1, sem os ajustes da raça escolhida agora: é contra
  // eles que cada raça é avaliada (faixa da Tabela 7).
  const baseScores: AbilityScores = { ...draft.abilities }
  if (current) for (const { ability, delta } of raceAdjustments(current)) (baseScores[ability] as number) -= delta

  const warningsFor = (race: RaceName): string[] => {
    const setting = raceSettingWarning(race, null)
    return [...abilityWarnings(race, baseScores), ...(setting ? [setting] : [])]
  }

  // A raça já escolhida continua à vista mesmo se o filtro mudar depois.
  const shown = racesForGender(gender).filter((race) => race === current || allowedBySettings(raceCampaignSetting(race), settings))
  const chosenWarnings = current ? warningsFor(current) : []
  const chosenDeltas = current ? raceAdjustments(current) : []

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext, nextLabel: 'Next: Alignment →', ready: !!current }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 3</p>
      <h2 className="forge-title">
        Choose Your Kindred
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Tap the worlds your table plays in to narrow the kindreds — with none tapped, every world is open. A kindred that strains against your scores only warns you.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch02_character_race_tables">
          The race adjusts your ability scores the moment you choose it, and you can change your mind freely — the previous race&rsquo;s adjustments
          are undone first. A &ldquo;!&rdquo; marks a race whose ability ranges your scores don&rsquo;t meet, or one from a setting outside the core
          rules; you can still take it.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <ForgeSettingsPicker settings={settings} onChange={onSettings} />

      <div className="forge-card-grid">
        {shown.map((race) => {
          const warnings = warningsFor(race)
          const deltas = raceAdjustments(race)
          return (
            <ForgeCard
              key={race}
              image={raceImages(race, gender)}
              alt={raceLabel(race)}
              label={raceLabel(race)}
              chosen={current === race}
              dimmed={!!current && current !== race}
              flag={warnings.length > 0 ? warnings.join(' ') : undefined}
              onClick={() => mutate((c) => replaceRace(c, race))}
            >
              <span className="adj-pills">
                {deltas.length === 0 ? (
                  <span className="adj-pill">no adjustment</span>
                ) : (
                  deltas.map(({ ability, delta }) => (
                    <span key={ability} className={delta > 0 ? 'adj-pill adj-up' : 'adj-pill adj-down'}>
                      {delta > 0 ? '+' : '−'}
                      {Math.abs(delta)} {abbrOf(ability)}
                    </span>
                  ))
                )}
              </span>
            </ForgeCard>
          )
        })}
      </div>

      {current && (
        <div className="race-outcome">
          <p className="forge-kicker">{raceLabel(current)} · your ability scores</p>
          <div className="mini-gems">
            {abilityOrder.map(({ key, abbr }) => {
              const delta = chosenDeltas.find((d) => d.ability === key)?.delta ?? 0
              return (
                <div key={key} className={delta > 0 ? 'mini-gem mini-gem-up' : delta < 0 ? 'mini-gem mini-gem-down' : 'mini-gem'}>
                  <svg viewBox="0 0 100 115" preserveAspectRatio="none" aria-hidden="true">
                    <polygon points="50,3 94,28 94,87 50,112 6,87 6,28" />
                  </svg>
                  <span className="mini-gem-abbr">{abbr}</span>
                  <span className="mini-gem-value">{draft.abilities[key] as number}</span>
                  {delta !== 0 && (
                    <span className="mini-gem-delta">
                      {delta > 0 ? '+' : '−'}
                      {Math.abs(delta)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {chosenWarnings.map((w) => (
            <p key={w} className="forge-warn-line">
              ! {w}
            </p>
          ))}
        </div>
      )}

      <ForgeFooter {...nav} />
    </section>
  )
}
