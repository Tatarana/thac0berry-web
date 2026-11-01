import { useState } from 'react'
import { setLevel } from '../rules/consequences'
import { rollDice } from '../rules/dice'
import { classLevels, hitPointsRule, isDualClass, isMultiClass } from '../rules/multiclass'
import { abilityDetail, hitDieType, levelForExperience } from '../rules/rules'
import type { AbilityScores, PlayerCharacter } from '../types/library'
import { RuleLink } from './RuleLink'

// Etapa 5 do The Forge: nível ou XP inicial — um deriva o outro
// (xpRequired/xpNeededForNextLevel, por dentro de setLevel/raiseExperienceToLevel).
// Padrão: nível 1 / 0 XP, igual ao personagem em branco de hoje — os pontos de
// vida também ficam no padrão em branco nesse caso. Acima do nível 1, pergunta
// rolar ou usar a média do dado de vida, nível a nível, e aplica UMA passada do
// motor de consequências para acertar THAC0/saves (ensureConsequenceSnapshot já
// rodou na etapa 1, ao rolar/digitar o primeiro atributo).

const dieSides = (die: string) => Number(die.replace(/\D/g, '')) || 6

function constitutionHPBonus(abilities: AbilityScores): number {
  const text = abilityDetail('constitutionHP', abilities)
  return text && /^[+-]?\d+$/.test(text) ? Number(text) : 0
}

export function ForgeStartStep({
  draft,
  mutate,
  onBack,
  onFinish,
  creating,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onBack: () => void
  onFinish: () => void
  creating: boolean
}) {
  const [mode, setMode] = useState<'level' | 'xp'>('level')
  const cls = draft.characterClass
  const multi = isMultiClass(draft) || isDualClass(draft)

  const hitPoints = (atLevel: number, roll: boolean): number => {
    const sides = dieSides(hitDieType(cls))
    const bonus = constitutionHPBonus(draft.abilities)
    let total = 0
    for (let lvl = 1; lvl <= atLevel; lvl++) {
      const value = roll ? rollDice({ count: 1, sides, modifier: 0 }).total : Math.ceil((sides + 1) / 2)
      total += Math.max(1, value + bonus)
    }
    return total
  }

  const applyLevel = (level: number, roll: boolean) => {
    const clamped = Math.max(1, Math.min(20, Math.round(level)))
    mutate((c) => {
      c.experience = 0
      setLevel(c, clamped)
      if (clamped > 1) {
        c.hitPointsMax = hitPoints(clamped, roll)
        c.hitPointsCurrent = c.hitPointsMax
      }
    })
  }

  const applyXP = (xp: number) => {
    const safe = Math.max(0, Math.round(xp))
    const level = levelForExperience(cls, safe)
    mutate((c) => {
      c.experience = safe
      setLevel(c, level)
      if (level > 1) {
        c.hitPointsMax = hitPoints(level, false)
        c.hitPointsCurrent = c.hitPointsMax
      }
    })
  }

  const reroll = (roll: boolean) => {
    if (draft.level <= 1) return
    mutate((c) => {
      c.hitPointsMax = hitPoints(draft.level, roll)
      c.hitPointsCurrent = c.hitPointsMax
    })
  }

  return (
    <section className="forge-step">
      <h2 className="forge-step-title">
        Starting point
        <RuleLink ruleID="phb_ch08_experience" title="Experience" />
      </h2>

      <div className="forge-chip-row">
        <button className={mode === 'level' ? 'forge-chip forge-chip-on' : 'forge-chip'} onClick={() => setMode('level')}>
          Set by level
        </button>
        <button className={mode === 'xp' ? 'forge-chip forge-chip-on' : 'forge-chip'} onClick={() => setMode('xp')}>
          Set by experience
        </button>
      </div>

      {mode === 'level' ? (
        <div className="forge-row">
          <label className="forge-sub-label" htmlFor="forge-level">Level ({draft.characterClass})</label>
          <input
            id="forge-level"
            type="number"
            className="forge-field"
            min={1}
            max={20}
            value={draft.level}
            onChange={(e) => e.target.value !== '' && applyLevel(Number(e.target.value), false)}
          />
          <span className="soft">{draft.experience.toLocaleString('en-US')} XP</span>
        </div>
      ) : (
        <div className="forge-row">
          <label className="forge-sub-label" htmlFor="forge-xp">Experience</label>
          <input
            id="forge-xp"
            type="number"
            className="forge-field"
            min={0}
            step={1}
            value={draft.experience}
            onChange={(e) => e.target.value !== '' && applyXP(Number(e.target.value))}
          />
          <span className="soft">level {draft.level}</span>
        </div>
      )}

      {draft.level <= 1 ? (
        <p className="soft">Hit points stay at the default for a new character ({draft.hitPointsMax}) — same as a blank character.</p>
      ) : (
        <div className="ember-card">
          <p className="soft">Hit points for level {draft.level} ({hitDieType(cls)} per level, plus the Constitution bonus): {draft.hitPointsMax}.</p>
          <div className="btn-row">
            <button className="btn" onClick={() => reroll(false)}>Use the average</button>
            <button className="btn" onClick={() => reroll(true)}>Roll the dice instead</button>
          </div>
          {multi && <p className="forge-warn">⚠ Multi/dual-class: this estimate only uses {cls}&rsquo;s hit die. {hitPointsRule(classLevels(draft))}</p>}
        </div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onBack}>← Back</button>
        <button className="btn" disabled={creating} onClick={onFinish}>
          {creating ? 'Creating…' : 'Create character'}
        </button>
      </div>
    </section>
  )
}
