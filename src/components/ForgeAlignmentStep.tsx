import { useState, type CSSProperties } from 'react'
import { genderOf, forgeImage, raceImages } from '../lib/forgeImages'
import { alignmentCode, alignments, classAlignments, soulPosition, soulReading, type AlignmentCode, type Lean } from '../rules/alignment'
import { allowedBySettings } from '../rules/campaignFilter'
import { matchRace } from '../rules/raceKit'
import { classCampaignSetting } from '../rules/ravenloft'
import type { PlayerCharacter } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage } from './ForgeParts'

// Etapa 4 do The Forge, "Weigh Your Soul" (protótipo "Step 4 · Alignment" no
// canvas): cinco dilemas movem o retrato do herói por um tabuleiro 3×3 (Lei →
// Caos, Bem → Mal); no fim o Forge diz onde ele ficou, e o jogador aceita ou
// toca outra casa — ou pula as perguntas. Regras em src/rules/alignment.ts;
// grava `alignment` (o nome, como a ficha). As respostas vivem no
// CharacterForge, para voltar à etapa sem responder de novo.

/** O tabuleiro: título, cor, emblema e credo de cada alinhamento (texto nosso, não do PHB). */
const look: Record<AlignmentCode, { title: string; color: string; icon: string; creed: string }> = {
  LG: {
    title: 'the Crusader',
    color: '#ffd27a',
    icon: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.9-4.3-1.9-7.5-5.3-7.5-9.9V6Z M12 7v9M8.5 10.5h7',
    creed: 'Order and goodness walk together. You keep your word, honour just laws and stand between the weak and those who would harm them.',
  },
  NG: {
    title: 'the Benefactor',
    color: '#ffe2a6',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
    creed: 'Doing good is what matters, not whose rules you follow. You work with the law when it helps and around it when it doesn’t.',
  },
  CG: {
    title: 'the Rebel',
    color: '#ffc56b',
    icon: 'M20 4C12 4 6 10 5 20 M20 4c0 7-4 11-10 11 M9 12h5',
    creed: 'Freedom is the highest good. Kindness comes from the heart, never from a decree, and you will break any chain that binds the innocent.',
  },
  LN: {
    title: 'the Judge',
    color: '#9cc3ea',
    icon: 'M12 4v16 M7 20h10 M4 7h16 M4 7l-2.5 6a2.5 2.5 0 0 0 5 0Z M20 7l-2.5 6a2.5 2.5 0 0 0 5 0Z',
    creed: 'Law and order come first, wherever they lead. A promise is binding, a hierarchy is sacred, and chaos is the true enemy.',
  },
  TN: {
    title: 'the Keeper of Balance',
    color: '#c8d2e6',
    icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 3v18 M3 12h18',
    creed: 'No side may win forever. You lean against whatever grows too strong — law or chaos, good or evil — to keep the great scales level.',
  },
  CN: {
    title: 'the Free Spirit',
    color: '#c4a5ff',
    icon: 'M3 8h11a3 3 0 1 0-3-3 M3 12h15a3 3 0 1 1-3 3 M3 16h7',
    creed: 'You answer to no one — not even to who you were yesterday. Your own freedom is the only rule worth keeping.',
  },
  LE: {
    title: 'the Tyrant',
    color: '#e0846f',
    icon: 'M3 18h18 M4 18l-1-10 5 4 4-7 4 7 5-4-1 10',
    creed: 'Rules are tools, and you hold them. You keep your bargains to the letter — and use every one to climb over others.',
  },
  NE: {
    title: 'the Mercenary',
    color: '#d0675a',
    icon: 'M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.2 3 5.3V19h9v-3.2c1.7-1.1 3-2.7 3-5.3A7.5 7.5 0 0 0 12 3Z M9 10.5h.01M15 10.5h.01',
    creed: 'Whatever profits you is right. You owe no loyalty to law or chaos, and feel no remorse for those left behind.',
  },
  CE: {
    title: 'the Destroyer',
    color: '#e05a4a',
    icon: 'M12 21c-4 0-7-3-7-7 0-4 3-6 4-10 2 3 3 4 3 6 1-1 2-2 2-4 2 2 5 5 5 8 0 4-3 7-7 7Z',
    creed: 'Your whim is your only law. You take what you want, when you want it, and the world burns for your pleasure.',
  },
}

/** Os dilemas e o quanto cada resposta empurra [lei/caos, bem/mal]. */
const questions: { text: string; answers: [string, ...Lean][] }[] = [
  {
    text: 'A child snatches a loaf from the baker’s stall and vanishes into the crowd. The watchman turns to you: “Did you see where the thief went?”',
    answers: [
      ['Point the way. A theft is a theft.', 1, -0.3],
      ['Pay the baker for the loaf and say nothing.', -0.5, 1],
      ['Send the watch the wrong way — then find the child and ask for a cut.', -1, -1],
    ],
  },
  {
    text: 'Your lord orders you to burn a village that shelters rebels. The villagers are farmers, and there are children among them.',
    answers: [
      ['An oath is an oath. Light the torches.', 1, -1],
      ['Refuse to his face, and accept the punishment.', 0.6, 1],
      ['Slip away in the night and warn the village.', -1, 0.8],
    ],
  },
  {
    text: 'In an empty alley you find a heavy purse, still sealed with a merchant’s wax.',
    answers: [
      ['Return it to the merchant, seal unbroken.', 0.8, 0.4],
      ['Give it to the beggars on the temple steps.', -0.4, 1],
      ['Keep it. The alley gave it to you.', -0.4, -0.7],
    ],
  },
  {
    text: 'The bandit who ambushed you lies disarmed at your feet, begging for his life.',
    answers: [
      ['Bind him and bring him before the magistrate.', 1, 0.3],
      ['Let him go — everyone deserves a second chance.', -0.6, 0.7],
      ['End it here. He would have done the same.', -0.3, -1],
    ],
  },
  {
    text: 'Years from now, when the songs are sung, what do you want them to say of you?',
    answers: [
      ['That my word was iron.', 1, 0],
      ['That I answered to no one.', -1, 0],
      ['That I kept the scales level.', 0, 0],
      ['That they feared my name.', 0, -1],
    ],
  },
]

/** As classes que o Forge oferece, na ordem da etapa de classe. */
const callings = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', 'Anchorite', 'Gypsy']

/**
 * Posição (em %) no tabuleiro: lei +1 → coluna da esquerda; bem +1 → linha de
 * cima. O retrato fica sobre o emblema da casa (um pouco acima do centro), para
 * não cobrir o nome.
 */
const at = (law: number, good: number, lift = 6): CSSProperties => ({ left: `${50 - law * (100 / 3)}%`, top: `${50 - good * (100 / 3) - lift}%` })

export function ForgeAlignmentStep({
  draft,
  mutate,
  settings,
  answers,
  onAnswers,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  answers: Lean[] | null
  /** null = pulou as perguntas. */
  onAnswers: (next: Lean[] | null) => void
  onNext: () => void
  onBack: () => void
}) {
  const [help, setHelp] = useState(false)
  const chosen = alignmentCode(draft.alignment)
  const skipped = answers === null
  const given = answers ?? []
  const asked = given.length
  const done = !skipped && asked >= questions.length
  const reading = soulReading(given)
  const shown = chosen ?? (asked > 0 ? reading : null)

  const choose = (code: AlignmentCode | null) => mutate((c) => void (c.alignment = code ? alignments.find((a) => a.code === code)!.name : ''))
  const answer = (lean: Lean) => {
    onAnswers([...given, lean])
    choose(null)
  }

  // O retrato: na casa escolhida, ou onde as respostas o levaram; o rastro, as posições anteriores.
  const index = chosen ? alignments.findIndex((a) => a.code === chosen) : -1
  const soul = index >= 0 ? at(1 - (index % 3), 1 - Math.floor(index / 3)) : at(soulPosition(given).law, soulPosition(given).good)
  const trail = given.slice(0, -1).map((_, k) => soulPosition(given.slice(0, k + 1)))
  const gender = genderOf(draft.sex)
  const race = matchRace(draft.race)
  const portrait = [...(race ? raceImages(race, gender) : []), ...(gender ? [forgeImage(`gender-${gender}`)] : [])]

  const offered = callings.filter((c) => allowedBySettings(classCampaignSetting(c), settings))
  const open = shown ? offered.filter((c) => !classAlignments[c] || classAlignments[c]!.allowed.includes(shown)) : []
  const closed = shown ? offered.filter((c) => !open.includes(c)) : []
  const q = questions[Math.min(asked, questions.length - 1)]
  const nav = { onBack, onNext, nextLabel: 'Next: Class & Kit →', ready: !!chosen }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 4</p>
      <h2 className="forge-title">
        Weigh Your Soul
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">
        Law against chaos, good against evil. Answer the Forge — every choice moves your hero across the board — or step straight onto the square you
        know is yours.
      </p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch04_alignment">
          Alignment is your hero’s outlook: how much they trust order, and how much they care for others (PHB chapter 4). Some classes ask for a
          particular path — a paladin must be lawful good, a druid true neutral. The questions only suggest; the square you take is yours.
        </ForgeHelpNote>
      )}

      <div className="al-layout">
        <div className="al-ask">
          {!skipped && !done && (
            <div className="mm-card">
              <p className="mm-card-label al-ask-label">
                The Forge asks · {asked + 1} of {questions.length}
                <span className="al-beads" aria-hidden="true">
                  {questions.map((_, k) => (
                    <i key={k} className={k < asked ? 'al-bead al-bead-done' : k === asked ? 'al-bead al-bead-now' : 'al-bead'} />
                  ))}
                </span>
              </p>
              <p key={asked} className="al-vignette">
                {q.text}
              </p>
              <div className="al-answers">
                {q.answers.map(([text, law, good], k) => (
                  <button
                    key={`${asked}-${k}`}
                    type="button"
                    className="al-answer"
                    data-n={k + 1}
                    style={{ animationDelay: `${120 + k * 90}ms` }}
                    onClick={() => answer([law, good])}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <div className="al-ask-foot">
                <span>No right answers — only yours.</span>
                <button type="button" className="al-link" onClick={() => onAnswers(null)}>
                  Skip — I’ll choose
                </button>
              </div>
            </div>
          )}
          {done && (
            <div className="mm-card al-reading">
              <p className="mm-card-label">The Forge has weighed you</p>
              <div className="al-verdict">{alignments.find((a) => a.code === reading)!.name}</div>
              <p>Your answers carried you to {look[reading].title}. Take this path, or tap any other square — the board is yours.</p>
              <div className="al-row">
                {chosen !== reading && (
                  <button type="button" className="al-take" onClick={() => choose(reading)}>
                    Take it
                  </button>
                )}
                <button type="button" className="al-again" onClick={() => onAnswers([])}>
                  Ask me again
                </button>
              </div>
            </div>
          )}
          {skipped && (
            <div className="mm-card">
              <p className="mm-card-label">Your choice</p>
              <p className="al-hint">Tap a square on the board. Want the Forge to read you instead?</p>
              <div className="al-row">
                <button type="button" className="al-again" onClick={() => onAnswers([])}>
                  Answer the questions
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="al-board-col">
          <div className="al-board-wrap">
            <span className="al-axis al-axis-top">Good</span>
            <span className="al-axis al-axis-bottom">Evil</span>
            <span className="al-axis al-axis-left">Law</span>
            <span className="al-axis al-axis-right">Chaos</span>
            <div className="al-board" role="radiogroup" aria-label="Alignment">
              {alignments.map((a, i) => {
                const near = !chosen && asked > 0 && a.code === reading
                return (
                  <button
                    key={a.code}
                    type="button"
                    role="radio"
                    aria-checked={chosen === a.code}
                    className={['al-tile', chosen === a.code ? 'al-tile-on' : near ? 'al-tile-near' : '', i >= 6 ? 'al-tile-evil' : ''].join(' ')}
                    style={{ '--c': look[a.code].color } as CSSProperties}
                    onClick={() => choose(a.code)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={look[a.code].icon} />
                    </svg>
                    <b>{a.name}</b>
                    <i>{look[a.code].title}</i>
                  </button>
                )
              })}
              <div className="al-overlay" aria-hidden="true">
                {trail.map((p, k) => (
                  <span key={k} className="al-trail" style={{ ...at(p.law, p.good), opacity: 0.25 + 0.15 * k }} />
                ))}
                <span className="al-soul" style={soul}>
                  <ForgeImage images={portrait} alt="" compact />
                </span>
              </div>
            </div>
          </div>
          <p className="al-board-note">
            {chosen
              ? 'Change your mind any time — tap another square.'
              : asked === 0
                ? 'Your hero waits at the centre of the board. Answer, or tap a square.'
                : 'Each answer moves your hero. The glowing square is where you stand.'}
          </p>
        </div>

        <aside className="al-panel" aria-label="Your alignment">
          {shown ? (
            <>
              <div className="mm-card" style={{ '--c': look[shown].color } as CSSProperties}>
                <p className="mm-card-label">{chosen ? 'Your alignment' : 'Where you stand so far'}</p>
                <h3 className="al-creed-name">
                  {alignments.find((a) => a.code === shown)!.name}
                  <span>{look[shown].title}</span>
                </h3>
                <p className="al-creed">{look[shown].creed}</p>
              </div>
              <div className="mm-card">
                <p className="mm-card-label">Callings that welcome you</p>
                <div className="al-callings">
                  {open.map((c) => (
                    <span key={c} className="al-calling">
                      {c}
                    </span>
                  ))}
                </div>
                {closed.length > 0 && (
                  <>
                    <div className="al-callings al-callings-closed">
                      {closed.map((c) => (
                        <span key={c} className="al-calling al-calling-off">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="al-closed-note">{closed.map((c) => `${c}: ${classAlignments[c]!.rule}`).join(' · ')}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="mm-card">
              <p className="mm-card-label">Nine paths</p>
              <p className="al-hint">
                Each square is a way of living: how much you trust order, and how much you care for others. Some callings ask for a particular path — a
                paladin walks only the first.
              </p>
            </div>
          )}
        </aside>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
