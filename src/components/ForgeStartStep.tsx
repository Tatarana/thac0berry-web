import { useState } from 'react'
import { setLevel, setMultiClassLevel } from '../rules/consequences'
import { rollDice } from '../rules/dice'
import {
  classLevels,
  dualHitPointsRule,
  isDualClass,
  isMultiClass,
  levelsForExperience,
  multiClassHitPoints,
  raiseExperienceToLevel,
  xpShare,
} from '../rules/multiclass'
import { abilityDetail, canonicalClass, hitDieType, levelForExperience } from '../rules/rules'
import type { AbilityScores, PlayerCharacter } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote } from './ForgeParts'

// Etapa 5 do The Forge: nível ou XP inicial. Classe única: um deriva o outro
// (setLevel / levelForExperience). Multiclasse (PHB cap. 3): o XP total é
// dividido igualmente e cada classe sobe pela tabela dela (levelsForExperience);
// por nível, cada classe tem o seu e o XP vira o mínimo que cobre todos. Pontos
// de vida: média ou rolagem do dado de vida; no multiclasse, os dados de todas
// as classes somados e divididos (multiClassHitPoints).

const MAX_LEVEL = 20
const dieSides = (die: string) => Number(die.replace(/\D/g, '')) || 6
const average = (sides: number) => Math.ceil((sides + 1) / 2)
const rollDie = (sides: number) => rollDice({ count: 1, sides, modifier: 0 }).total

function constitutionHPBonus(abilities: AbilityScores): number {
  const text = abilityDetail('constitutionHP', abilities)
  return text && /^[+-]?\d+$/.test(text) ? Number(text) : 0
}

/** PV da classe única no nível dado (um dado por nível, mais Constituição). */
function singleHitPoints(c: PlayerCharacter, level: number, roll: boolean): number {
  const sides = dieSides(hitDieType(c.characterClass))
  const bonus = constitutionHPBonus(c.abilities)
  let total = 0
  for (let lvl = 1; lvl <= level; lvl++) total += Math.max(1, (roll ? rollDie(sides) : average(sides)) + bonus)
  return total
}

/** Recalcula os PV da ficha depois de mudar nível/XP (ou ao pedir média/rolagem). */
function refreshHitPoints(c: PlayerCharacter, roll: boolean) {
  c.hitPointsMax = isMultiClass(c) ? multiClassHitPoints(classLevels(c), constitutionHPBonus(c.abilities), roll ? rollDie : average) : singleHitPoints(c, c.level, roll)
  c.hitPointsCurrent = c.hitPointsMax
}

const clampLevel = (level: number) => Math.max(1, Math.min(MAX_LEVEL, Math.round(level)))

function LevelGem({ label, level, frozen = false, onLess, onMore }: { label: string; level: number; frozen?: boolean; onLess?: () => void; onMore?: () => void }) {
  return (
    <div className={frozen ? 'level-gem level-gem-frozen' : 'level-gem'}>
      <div className="mini-gem mini-gem-large">
        <svg viewBox="0 0 100 115" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="50,3 94,28 94,87 50,112 6,87 6,28" />
        </svg>
        <span className="mini-gem-abbr">{label}</span>
        <span className="mini-gem-value">{level}</span>
      </div>
      {onLess && onMore ? (
        <div className="level-steps">
          <button type="button" className="former-step" aria-label={`${label}: one level less`} disabled={level <= 1} onClick={onLess}>
            −
          </button>
          <button type="button" className="former-step" aria-label={`${label}: one level more`} disabled={level >= MAX_LEVEL} onClick={onMore}>
            +
          </button>
        </div>
      ) : (
        <span className="level-gem-note">{frozen ? 'frozen' : 'from the XP'}</span>
      )}
    </div>
  )
}

export function ForgeStartStep({
  draft,
  mutate,
  onBack,
  onNext,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onBack: () => void
  onNext: () => void
}) {
  const [help, setHelp] = useState(false)
  const [mode, setMode] = useState<'level' | 'xp'>('level')
  const [xpText, setXpText] = useState(String(draft.experience))
  const multi = isMultiClass(draft)
  const dual = isDualClass(draft)
  const classes = classLevels(draft)

  /** Nível de uma classe (0 = a principal; 1… = as outras do multiclasse). */
  const changeLevel = (index: number, level: number) =>
    mutate((c) => {
      const next = clampLevel(level)
      if (index === 0) setLevel(c, next)
      else setMultiClassLevel(c, index - 1, next)
      // Por nível, o XP é exatamente o mínimo que cobre os níveis.
      c.experience = 0
      raiseExperienceToLevel(c)
      refreshHitPoints(c, false)
    })

  const changeXP = (text: string) => {
    setXpText(text)
    if (!/^\d+$/.test(text.trim())) return
    const xp = Number(text.trim())
    mutate((c) => {
      if (isMultiClass(c)) {
        const levels = levelsForExperience(c, xp)
        c.multiClasses = (c.multiClasses ?? []).map((k, i) => ({ ...k, level: levels[i + 1]?.level ?? k.level }))
        setLevel(c, levels[0].level)
      } else {
        setLevel(c, levelForExperience(c.characterClass, xp))
      }
      c.experience = xp
      refreshHitPoints(c, false)
    })
  }

  const setByLevel = () => setMode('level')
  const setByXP = () => {
    setXpText(String(draft.experience))
    setMode('xp')
  }

  const reroll = (roll: boolean) => mutate((c) => refreshHitPoints(c, roll))

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext, nextLabel: 'Next: Weapon Proficiencies →', ready: true }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 6</p>
      <h2 className="forge-title">
        Where Does Your Story Begin?
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Start at level 1 like most heroes, or join a campaign already underway — by level or by experience points.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch08_experience">
          Set the level and the experience follows, or type the experience and the level follows. A multi-class character divides the experience
          equally between the classes, and each class rises by its own table. Hit points use the average of the hit die unless you roll; a
          multi-class character adds the dice of all the classes and divides by how many there are.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <div className="method-row" role="group" aria-label="How to set the starting point">
        <button type="button" className={mode === 'level' ? 'method-pill method-active' : 'method-pill'} onClick={setByLevel}>
          Set by level
        </button>
        <button type="button" className={mode === 'xp' ? 'method-pill method-active' : 'method-pill'} onClick={setByXP}>
          Set by experience
        </button>
      </div>

      {mode === 'xp' && (
        <div className="naming">
          <div className="name-ribbon name-ribbon-filled">
            <input className="name-ribbon-input" inputMode="numeric" aria-label="Experience points" value={xpText} onChange={(event) => changeXP(event.target.value)} />
          </div>
        </div>
      )}

      <div className="level-gems">
        {classes.map((k, index) => (
          <LevelGem
            key={`${k.characterClass}-${index}`}
            label={canonicalClass(k.characterClass)}
            level={k.level}
            onLess={mode === 'level' ? () => changeLevel(index, k.level - 1) : undefined}
            onMore={mode === 'level' ? () => changeLevel(index, k.level + 1) : undefined}
          />
        ))}
        {(draft.formerClasses ?? []).map((k, index) => (
          <LevelGem key={`ex-${k.characterClass}-${index}`} label={`ex-${canonicalClass(k.characterClass)}`} level={k.level} frozen />
        ))}
      </div>

      <p className="forge-panel-note">
        {draft.experience.toLocaleString('en-US')} XP
        {multi && ` · ${xpShare(draft.experience, classes.length).toLocaleString('en-US')} for each of the ${classes.length} classes`}
      </p>

      <div className="hp-block">
        <div className="mini-gem mini-gem-large mini-gem-hp">
          <svg viewBox="0 0 100 115" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="50,3 94,28 94,87 50,112 6,87 6,28" />
          </svg>
          <span className="mini-gem-abbr">HP</span>
          <span className="mini-gem-value">{draft.hitPointsMax}</span>
        </div>
        <div className="method-row">
          <button type="button" className="method-pill" onClick={() => reroll(false)}>
            Use the average
          </button>
          <button type="button" className="method-pill" onClick={() => reroll(true)}>
            Roll the dice
          </button>
        </div>
        {dual && <p className="forge-warn-line">! Dual-class: this uses only {canonicalClass(draft.characterClass)}&rsquo;s hit die. {dualHitPointsRule(draft)}</p>}
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
