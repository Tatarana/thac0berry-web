import { useEffect, useState } from 'react'
import { classImages, genderOf, raceImages } from '../lib/forgeImages'
import { rogueClass } from '../rules/multiclass'
import { matchRace } from '../rules/raceKit'
import { thievingSkillsFor } from '../rules/rules'
import {
  addTraining,
  distributeTraining,
  skillCap,
  skillParts,
  skillTotal,
  spentPoints,
  trainedSkills,
  trainingLimit,
  trainingPaths,
  trainingPool,
  trainingRoom,
  type Training,
  type TrainingContext,
} from '../rules/thievingPoints'
import type { PlayerCharacter } from '../types/library'
import { ForgeDice } from './ForgeDice'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage } from './ForgeParts'

// Etapa "Tricks of the Trade" do The Forge (protótipo "Step 9 · Thieving
// Skills" no canvas), para ladrão, bardo, ninja e gypsy (também multiclasse):
// um estojo de couro com uma perícia em cada bolso, a barra em camadas (base,
// raça, Destreza, treino) e a bolsa de pontos de treino. "Try your hand" rola o
// d100 na mesa (ForgeDice) e conta a cena. Regras em src/rules/thievingPoints.ts;
// grava `thievingSkills` com os valores finais ("55%"), como a ficha. O treino
// vive no CharacterForge, para voltar à etapa sem perder a distribuição.

const icons: Record<string, string> = {
  'Pick Pockets': 'M8 8h8l2 3c2 4 1 9-6 10-7-1-8-6-6-10Z M9 8 8 4h8l-1 4 M10 12h4',
  'Open Locks': 'M4 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M10 12h10 M16 12v3 M19 12v2',
  'Find/Remove Traps': 'M3 17h18 M5 17l2-6 2 6 2-6 2 6 2-6 2 6 2-6 1 6 M9 7h6',
  'Move Silently': 'M8 3c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5Z M16 10c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5Z',
  'Hide in Shadows': 'M12 3c4 0 7 4 7 9v9H5v-9c0-5 3-9 7-9Z M9 13a3 3 0 0 0 6 0',
  'Detect Noise': 'M8 9a5 5 0 1 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0 M11 9a2 2 0 1 1 4 0 M3 8c0-2 1-3 2-4 M3 12h2',
  'Climb Walls': 'M12 3v12 M12 15c-4 0-6-3-6-6 M12 15c4 0 6-3 6-6 M12 15v6 M9 6l3-3 3 3',
  'Read Languages': 'M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7 M6 4a2 2 0 0 0-2 2v2h4 M8 10h8 M8 13h8 M8 16h5',
}

/** A cena do teste: [sucesso, falha]. */
const scenes: Record<string, [string, string]> = {
  'Pick Pockets': ['The purse is yours — he never felt a thing.', 'A hand closes on your wrist.'],
  'Open Locks': ['Click. The lock gives way.', 'The pick snaps in the keyhole.'],
  'Find/Remove Traps': ['You find the needle and bend it aside.', 'Something clicks under your fingers…'],
  'Move Silently': ['Not a single board creaks.', 'A floorboard groans underfoot.'],
  'Hide in Shadows': ['The guard walks right past you.', '“Who’s there?”'],
  'Detect Noise': ['Voices behind the door — three of them.', 'Only your own heartbeat.'],
  'Climb Walls': ['You reach the parapet unseen.', 'Your grip slips on the wet stone.'],
  'Read Languages': ['The old script yields its meaning.', 'The letters swim and mean nothing.'],
}

const newID = () => crypto.randomUUID().toUpperCase()
const pct = (n: number) => `${Math.max(0, Math.min(100, n))}%`
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

type Test = { skill: string; roll: number; total: number; done: boolean }

export function ForgeThievingStep({
  draft,
  mutate,
  training: stored,
  onTraining,
  stepNumber,
  nextLabel,
  onBack,
  onNext,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  training: Training
  onTraining: (next: Training) => void
  stepNumber: number
  nextLabel: string
  onBack: () => void
  onNext: () => void
}) {
  const [help, setHelp] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [rollKey, setRollKey] = useState(0)

  let given = stored
  const rogue = rogueClass(draft)
  const ctx: TrainingContext = { characterClass: rogue?.characterClass ?? 'Thief', level: rogue?.level ?? draft.level, race: draft.race, dexterity: draft.abilities.dexterity }
  const skills = thievingSkillsFor(ctx.characterClass)
  const pool = trainingPool(ctx.characterClass, ctx.level)
  const limit = trainingLimit(ctx.characterClass, ctx.level)
  // Baixou o nível e o treino não cabe mais: recomeça.
  if (spentPoints(given) > pool) given = {}
  const training = given
  const left = pool - spentPoints(training)
  const bard = ctx.characterClass === 'Bard'
  const gypsy = ctx.characterClass === 'Gypsy'

  // A ficha recebe os valores finais desde a primeira visita (mesmo sem treino).
  const commit = (next: Training) => {
    onTraining(next)
    mutate((c) => void (c.thievingSkills = trainedSkills(next, ctx, c.thievingSkills ?? [], newID)))
  }
  useEffect(() => {
    commit(training)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.characterClass, ctx.level, ctx.race, ctx.dexterity])

  const tryHand = (skill: string) => {
    const total = skillTotal(skillParts(skill, ctx.characterClass, ctx.race, ctx.dexterity), training[skill] ?? 0)
    setSelected(skill)
    setTest({ skill, roll: 1 + Math.floor(Math.random() * 100), total, done: false })
    setRollKey((k) => k + 1)
  }

  const gender = genderOf(draft.sex)
  const race = matchRace(draft.race)
  const portrait = [...classImages(ctx.characterClass, gender), ...(race ? raceImages(race, gender) : [])]
  const chosen = selected && skills.includes(selected) ? selected : null
  const chosenParts = chosen ? skillParts(chosen, ctx.characterClass, ctx.race, ctx.dexterity) : null
  const nav = { onBack, onNext, nextLabel, ready: true }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step {stepNumber}</p>
      <h2 className="forge-title">
        Tricks of the Trade
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">
        {bard
          ? 'A bard picks up a few tricks on the road: four of the thief’s skills, and a handful of training points to sharpen them.'
          : 'Unroll your tools. Your class gives the base, your kin and your hands add the rest — then spend your training where your trade needs it.'}
      </p>
      {help && (
        <ForgeHelpNote ruleID={bard ? 'phb_ch03_bard' : 'phb_ch03_thief'}>
          Each skill starts at your class’s base score, adjusted for race and Dexterity (PHB Tables 26–28). Then you spread your training points:{' '}
          {bard ? '20 at 1st level and 15 more each level.' : '60 at 1st level and 30 more each level, no more than 30 in one skill at 1st level and 15 more per level after.'}{' '}
          No skill goes past 95%. Armor changes these numbers in play; the sheet keeps track.
        </ForgeHelpNote>
      )}

      <div className="th-layout">
        <div className="th-col">
          <div className="th-purse">
            <svg className="th-purse-bag" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 18h20l6 8c8 12 6 30-16 32-22-2-24-20-16-32Z" fill="rgba(201,162,39,.15)" />
              <path d="M24 18l-3-8h22l-3 8 M26 24h12" />
            </svg>
            <div className="th-purse-count">
              <b>{left}</b>
              <span>of {pool} training points left</span>
            </div>
            <div className="th-coins" aria-hidden="true">
              {Array.from({ length: Math.ceil(pool / 5) }, (_, i) => (
                <i key={i} className={i * 5 >= left ? 'th-coin th-coin-spent' : 'th-coin'} />
              ))}
            </div>
          </div>
          <div className="th-presets">
            <span className="th-presets-label">Quick paths</span>
            {trainingPaths.map((p) => (
              <button key={p.name} type="button" className="mm-chip" title={p.hint} onClick={() => commit(distributeTraining(p.skills, ctx))}>
                {p.name}
              </button>
            ))}
            <button type="button" className="mm-chip" title="Take back every point" onClick={() => commit({})}>
              Start over
            </button>
          </div>

          <div className="th-roll">
            <div className={skills.length > 4 ? 'th-pockets' : 'th-pockets th-pockets-four'}>
              {skills.map((skill) => {
                const parts = skillParts(skill, ctx.characterClass, ctx.race, ctx.dexterity)
                const t = training[skill] ?? 0
                const total = skillTotal(parts, t)
                const room = trainingRoom(skill, training, ctx)
                // Barras empilhadas: base (menos o que as penalidades tiram), bônus de raça e Destreza, treino.
                const neg = Math.min(0, parts.race) + Math.min(0, parts.dexterity)
                const from = Math.max(0, parts.base + neg)
                const segs: { cls: string; at: number; w: number }[] = []
                let at = 0
                for (const [w, cls] of [
                  [from, 'th-seg-base'],
                  [Math.max(0, parts.race), 'th-seg-race'],
                  [Math.max(0, parts.dexterity), 'th-seg-dex'],
                  [t, 'th-seg-train'],
                ] as const) {
                  if (w > 0) segs.push({ cls, at, w })
                  at += Math.max(0, w)
                }
                if (neg < 0 && parts.base > from) segs.push({ cls: 'th-seg-neg', at: from, w: parts.base - from })
                const limitAt = limit === null ? null : Math.min(skillCap, parts.base + parts.race + parts.dexterity + limit)
                const change = (n: number) => {
                  setSelected(skill)
                  commit(addTraining(skill, n, training, ctx))
                }
                return (
                  <div key={skill} className={chosen === skill ? 'th-pocket th-pocket-sel' : 'th-pocket'}>
                    <button type="button" className="th-pocket-head" onClick={() => setSelected(skill)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={icons[skill]} />
                      </svg>
                      <b>{skill}</b>
                    </button>
                    <div className="th-pct-row">
                      <span className={total >= skillCap ? 'th-pct th-pct-max' : 'th-pct'}>{total}%</span>
                      {t > 0 && <span className="th-train">+{t} trained</span>}
                    </div>
                    <div className="th-meter" role="img" aria-label={`${skill}: ${total}%`}>
                      {segs.map((s, i) => (
                        <span key={i} className={`th-seg ${s.cls}`} style={{ left: pct(s.at), width: pct(s.w) }} />
                      ))}
                      <span className="th-mark th-mark-cap" style={{ left: `${skillCap}%` }} title="95% — the most any skill can reach" />
                      {limitAt !== null && limitAt < skillCap && (
                        <span className="th-mark" style={{ left: `${limitAt}%` }} title={`At most ${limit} training points in this skill at level ${ctx.level}`} />
                      )}
                    </div>
                    <div className="th-ctrl">
                      <button type="button" className="th-btn5" aria-label={`Take 5 points from ${skill}`} disabled={t <= 0} onClick={() => change(-5)}>
                        −
                      </button>
                      <button type="button" className="th-btn5" aria-label={`Put 5 points into ${skill}`} disabled={room <= 0} onClick={() => change(5)}>
                        +
                      </button>
                      <button type="button" className="th-btn1" aria-label={`Take 1 point from ${skill}`} disabled={t <= 0} onClick={() => change(-1)}>
                        −1
                      </button>
                      <button type="button" className="th-btn1" aria-label={`Put 1 point into ${skill}`} disabled={room <= 0} onClick={() => change(1)}>
                        +1
                      </button>
                    </div>
                    <button type="button" className="th-try" onClick={() => tryHand(skill)}>
                      Try your hand
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="th-legend">
            <span>
              <i style={{ background: '#8c7b66' }} />
              Base ({ctx.characterClass})
            </span>
            <span>
              <i style={{ background: '#7fb3e0' }} />
              Race
            </span>
            <span>
              <i style={{ background: '#6fbf8e' }} />
              Dexterity
            </span>
            <span>
              <i style={{ background: 'linear-gradient(180deg, #ffd27a, #e0901e)' }} />
              Your training
            </span>
            <span>
              <i className="th-lg-neg" />
              Penalty
            </span>
            <span>Red line: 95% · white line: the most training this skill can hold now</span>
          </div>
        </div>

        <aside className="th-panel" aria-label="Your craft">
          <div className="mm-card">
            <div className="mm-who">
              <span className="mm-who-portrait">
                <ForgeImage images={portrait} alt="" compact />
              </span>
              <div>
                <b>
                  {ctx.characterClass}, level {ctx.level}
                </b>
                <span>
                  {draft.race || 'No race'} · Dexterity {ctx.dexterity}
                </span>
              </div>
            </div>
          </div>

          {chosen && chosenParts && (
            <div className="mm-card">
              <p className="mm-card-label">{chosen}</p>
              <table className="th-breakdown">
                <tbody>
                  <tr>
                    <td>Base ({ctx.characterClass})</td>
                    <td>{chosenParts.base}%</td>
                  </tr>
                  <tr>
                    <td>Race ({draft.race || '—'})</td>
                    <td>{signed(chosenParts.race)}</td>
                  </tr>
                  <tr>
                    <td>Dexterity {ctx.dexterity}</td>
                    <td>{signed(chosenParts.dexterity)}</td>
                  </tr>
                  <tr>
                    <td>Your training</td>
                    <td>+{training[chosen] ?? 0}</td>
                  </tr>
                  <tr>
                    <td>Total</td>
                    <td>{skillTotal(chosenParts, training[chosen] ?? 0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {test && (
            <div className="mm-card th-test">
              <p className="mm-card-label">Try your hand · {test.skill}</p>
              <ForgeDice
                dice={[
                  { kind: 'd10x10', value: Math.floor((test.roll % 100) / 10) },
                  { kind: 'd10', value: test.roll % 10 },
                ]}
                rollKey={rollKey}
                onSettled={() => setTest((x) => (x ? { ...x, done: true } : x))}
              />
              {test.done && (
                <>
                  <p className={test.roll <= test.total ? 'th-scene th-scene-ok' : 'th-scene th-scene-no'}>
                    {scenes[test.skill][test.roll <= test.total ? 0 : 1]}
                  </p>
                  <p className="th-hint">
                    Rolled {test.roll} against {test.total}% — {test.roll <= test.total ? 'success.' : 'failure. Your DM may roll this in secret.'}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="mm-card">
            <p className="mm-card-label">Laws of the trade</p>
            <ul className="sp-rules">
              {(bard
                ? [
                    '20 training points at 1st level, 15 more each level.',
                    'Your base, race and Dexterity come first; the points go on top.',
                    'No skill goes past 95%.',
                    'Armor worn changes these numbers in play — the sheet keeps track.',
                  ]
                : [
                    `${gypsy ? 'Domains of Dread gives no rule here: the Forge uses the thief’s. ' : ''}60 training points at 1st level, 30 more each level.`,
                    'At most 30 points in one skill at 1st level, and 15 more per level after.',
                    'No skill goes past 95%, with every adjustment counted.',
                    'Armor worn changes these numbers in play — the sheet keeps track.',
                  ]
              ).map((law) => (
                <li key={law}>{law}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
