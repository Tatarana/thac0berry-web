import { useEffect, useRef, useState } from 'react'
import { setAbility } from '../rules/consequences'
import { rollDice } from '../rules/dice'
import type { AbilityScores, PlayerCharacter } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote } from './ForgeParts'

// Etapa 1 do The Forge, fiel ao protótipo aprovado (artifact "The Forge —
// character builder mockup", Abilities.dc.html): três métodos (3d6 em ordem,
// 4d6 descartando o menor, ou escrever à mão); trocar de método limpa as
// gemas até rolar (ou digitar); depois de rolar, dois cliques em gemas
// diferentes trocam os valores, com animação, em qualquer dos dois métodos de
// dado. `rollInfo` é só vitrine (dados rolados e o descartado) — a ficha só
// guarda o número final.

type AbilityKey = keyof Pick<AbilityScores, 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'>
type Method = '3d6' | '4d6' | 'write'

interface RollInfo {
  dice: number[]
  dropped: number | null
}

const order: { key: AbilityKey; label: string; abbr: string }[] = [
  { key: 'strength', label: 'Strength', abbr: 'STR' },
  { key: 'dexterity', label: 'Dexterity', abbr: 'DEX' },
  { key: 'constitution', label: 'Constitution', abbr: 'CON' },
  { key: 'intelligence', label: 'Intelligence', abbr: 'INT' },
  { key: 'wisdom', label: 'Wisdom', abbr: 'WIS' },
  { key: 'charisma', label: 'Charisma', abbr: 'CHA' },
]

const blankWrite = (): Record<AbilityKey, string> => ({ strength: '', dexterity: '', constitution: '', intelligence: '', wisdom: '', charisma: '' })
const validScore = (text: string) => /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 25

// Ícones: espada, bota alada, escudo, livro, olho, brilho.
function AbilityIcon({ ability }: { ability: AbilityKey }) {
  switch (ability) {
    case 'strength':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 4 37 18 37 44 32 50 27 44 27 18Z" fill="currentColor" />
          <rect x="18" y="40" width="28" height="6" rx="2" fill="currentColor" />
          <rect x="29" y="46" width="6" height="13" rx="2" fill="currentColor" />
        </svg>
      )
    case 'dexterity':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 10h12v18l8 3c4 1 8 5 8 10v6H16l-2-9c7-2 6-10 6-19Z" fill="currentColor" />
          <path d="M38 20c7-5 15-4 19 2-6 3-13 2-19-2Z" fill="currentColor" opacity={0.85} />
        </svg>
      )
    case 'constitution':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 6 54 14v16c0 16-10 26-22 30C20 56 10 46 10 30V14Z" fill="currentColor" />
        </svg>
      )
    case 'intelligence':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M8 16c8-4 16-4 24 2v34c-8-6-16-6-24-2Z" fill="currentColor" />
          <path d="M56 16c-8-4-16-4-24 2v34c8-6 16-6 24-2Z" fill="currentColor" />
        </svg>
      )
    case 'wisdom':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M6 32c8-14 20-20 26-20s18 6 26 20c-8 14-20 20-26 20S14 46 6 32Z" fill="none" stroke="currentColor" strokeWidth={3} />
          <circle cx="32" cy="32" r="7" fill="currentColor" />
        </svg>
      )
    case 'charisma':
      return (
        <svg className="gem-icon" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 4 38 26 60 32 38 38 32 60 26 38 4 32 26 26Z" fill="currentColor" />
        </svg>
      )
  }
}

function starsFor(value: number | null): number {
  if (value == null) return 0
  if (value >= 17) return 3
  if (value >= 15) return 2
  if (value >= 13) return 1
  return 0
}

function GemStars({ value }: { value: number | null }) {
  const lit = starsFor(value)
  return (
    <span className="gem-stars">
      {[1, 2, 3].map((i) => (
        <svg key={i} className={i <= lit ? 'gem-star lit' : 'gem-star'} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l3 7 7 1-5.5 5 1.5 7-6-3.5L6 22l1.5-7L2 10l7-1z" />
        </svg>
      ))}
    </span>
  )
}

function GemShape() {
  return (
    <svg className="gem-shape" viewBox="0 0 100 115" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="gem-face" points="50,3 94,28 94,87 50,112 6,87 6,28" />
      <polygon className="gem-glint" points="50,3 94,28 50,53 6,28" />
      <g className="gem-facet">
        <line x1="50" y1="53" x2="50" y2="112" />
        <line x1="50" y1="53" x2="94" y2="28" />
        <line x1="50" y1="53" x2="94" y2="87" />
        <line x1="50" y1="53" x2="6" y2="87" />
        <line x1="50" y1="53" x2="6" y2="28" />
      </g>
      <polygon className="gem-edge" points="50,3 94,28 94,87 50,112 6,87 6,28" />
    </svg>
  )
}

export function ForgeAbilitiesStep({
  draft,
  mutate,
  onNext,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onNext: () => void
}) {
  const [method, setMethod] = useState<Method>('3d6')
  // Ao abrir, as gemas mostram o que a ficha já tem (10 em branco, ou o que
  // veio de antes, ao voltar do passo 2). Trocar de método limpa até rolar
  // ou digitar — e o Next só acende com as seis preenchidas.
  const [filled, setFilled] = useState(true)
  const [rollInfo, setRollInfo] = useState<Partial<Record<AbilityKey, RollInfo>>>({})
  const [written, setWritten] = useState<Record<AbilityKey, string>>(blankWrite)
  const [selectedKey, setSelectedKey] = useState<AbilityKey | null>(null)
  const [swapKeys, setSwapKeys] = useState<[AbilityKey, AbilityKey] | null>(null)
  const [help, setHelp] = useState(false)
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (swapTimeout.current) clearTimeout(swapTimeout.current)
    },
    [],
  )

  const selectMethod = (next: Method) => {
    setMethod(next)
    setFilled(false)
    setRollInfo({})
    setWritten(blankWrite())
    setSelectedKey(null)
    setSwapKeys(null)
  }

  const roll = () => {
    setSelectedKey(null)
    setSwapKeys(null)
    const info: Partial<Record<AbilityKey, RollInfo>> = {}
    mutate((c) => {
      for (const { key } of order) {
        if (method === '4d6') {
          const dice = rollDice({ count: 4, sides: 6, modifier: 0 }).dice
          const dropped = dice.indexOf(Math.min(...dice))
          info[key] = { dice, dropped }
          setAbility(c, key, dice.reduce((sum, d) => sum + d, 0) - dice[dropped])
        } else {
          const dice = rollDice({ count: 3, sides: 6, modifier: 0 }).dice
          info[key] = { dice, dropped: null }
          setAbility(c, key, dice.reduce((sum, d) => sum + d, 0))
        }
      }
    })
    setRollInfo(info)
    setFilled(true)
  }

  const gemClick = (key: AbilityKey) => {
    if (method === 'write' || !filled) return
    if (!selectedKey) {
      setSelectedKey(key)
      return
    }
    if (selectedKey === key) {
      setSelectedKey(null)
      return
    }
    const a = selectedKey
    const b = key
    mutate((c) => {
      const va = c.abilities[a]
      setAbility(c, a, c.abilities[b])
      setAbility(c, b, va)
    })
    setRollInfo((prev) => ({ ...prev, [a]: prev[b], [b]: prev[a] }))
    setSelectedKey(null)
    setSwapKeys([a, b])
    if (swapTimeout.current) clearTimeout(swapTimeout.current)
    swapTimeout.current = setTimeout(() => setSwapKeys(null), 520)
  }

  const write = (key: AbilityKey, text: string) => {
    const next = { ...written, [key]: text.trim() }
    setWritten(next)
    if (validScore(next[key])) mutate((c) => setAbility(c, key, Number(next[key])))
  }

  const allFilled = method === 'write' ? order.every(({ key }) => validScore(written[key])) : filled

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onNext, nextLabel: 'Next: Name & Gender →', ready: allFilled }

  return (
    <section className="forge-step forge-hero">
      <svg className="ability-watermark" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="46" width="44" height="7" rx="1.5" fill="currentColor" />
        <rect x="26" y="8" width="12" height="30" rx="2" fill="currentColor" />
        <path d="M14 14 50 14 50 24 14 24Z" fill="currentColor" />
      </svg>
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 1</p>
      <h2 className="forge-title">
        Forge Your Ability Scores
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma — six numbers that decide what you can become.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch01_rolling_ability_scores">
          Three ways to get your six scores: 3d6 rolls each one straight into Strength → Charisma; 4d6 rolls four dice per score and drops the
          lowest; or write in the scores your Master gave you. After a roll, tap two gems to swap them.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <div className="method-row" role="group" aria-label="Ability score method">
        <button type="button" className={method === '3d6' ? 'method-pill method-active' : 'method-pill'} onClick={() => selectMethod('3d6')}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="currentColor" />
            <rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" opacity={0.7} />
            <rect x="14" y="14" width="8" height="8" rx="2" fill="currentColor" opacity={0.45} />
          </svg>
          3d6, in order
        </button>
        <button type="button" className={method === '4d6' ? 'method-pill method-active' : 'method-pill'} onClick={() => selectMethod('4d6')}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="7" height="7" rx="1.6" fill="currentColor" opacity={0.35} />
            <rect x="2" y="15" width="7" height="7" rx="1.6" fill="currentColor" />
            <rect x="15" y="2" width="7" height="7" rx="1.6" fill="currentColor" />
            <rect x="15" y="15" width="7" height="7" rx="1.6" fill="currentColor" />
          </svg>
          4d6, drop the lowest
        </button>
        <button type="button" className={method === 'write' ? 'method-pill method-active' : 'method-pill'} onClick={() => selectMethod('write')}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 21l1.5-5L16 4.5 19.5 8 8 19.5Z" fill="none" stroke="currentColor" strokeWidth={1.8} />
          </svg>
          Write them in
        </button>
      </div>

      {method === '3d6' && (
        <p className="order-note">
          &ldquo;In order&rdquo;: each roll lands straight into Strength → Charisma, left to right. Want two of them the other way round? Tap one
          gem, then another — they trade places.
        </p>
      )}
      {method === '4d6' && (
        <p className="order-note">Six rolls land where they fall. Not happy with the order? Tap one gem, then tap another — they trade places.</p>
      )}
      {method === 'write' && (
        <p className="order-note">No dice here — tap a gem and type the score, however you came by it. The usual range is 3–18.</p>
      )}

      {method !== 'write' && (
        <div className="roll-wrap">
          <button type="button" className="roll-button" onClick={roll}>
            <svg className="roll-die" viewBox="0 0 64 64" aria-hidden="true">
              <polygon points="32,3 58,19 58,47 32,61 6,47 6,19" fill="none" stroke="currentColor" strokeWidth={3} />
              <polygon points="32,3 58,19 32,33 6,19" fill="currentColor" opacity={0.18} />
              <line x1="32" y1="33" x2="32" y2="61" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
              <line x1="32" y1="33" x2="58" y2="19" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
              <line x1="32" y1="33" x2="6" y2="19" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
            </svg>
            <span className="roll-text">Roll the dice</span>
          </button>
        </div>
      )}

      <div className="gem-row">
        {order.map(({ key, label, abbr }) => {
          const value = draft.abilities[key] as number
          const info = rollInfo[key]
          const shown = method === 'write' ? (validScore(written[key]) ? Number(written[key]) : null) : filled ? value : null
          const cls = [
            'gem',
            method !== 'write' && filled ? 'gem-swappable' : '',
            selectedKey === key ? 'gem-picked' : '',
            swapKeys?.includes(key) ? 'gem-swapping' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={key} className={cls} onClick={() => gemClick(key)}>
              <GemShape />
              <div className="gem-content">
                <AbilityIcon ability={key} />
                <span className="gem-label" title={label}>
                  {abbr}
                </span>
                {method === 'write' ? (
                  <input
                    className="gem-input"
                    inputMode="numeric"
                    placeholder="–"
                    aria-label={label}
                    value={written[key]}
                    onChange={(event) => write(key, event.target.value)}
                  />
                ) : shown == null ? (
                  <span className="gem-value gem-empty-value">–</span>
                ) : (
                  <span className="gem-value">{shown}</span>
                )}
                {method !== 'write' && filled && info && (
                  <div className="gem-dice-row">
                    {info.dice.map((d, i) => (
                      <span key={i} className={i === info.dropped ? 'pip dropped' : 'pip'}>
                        {d}
                      </span>
                    ))}
                  </div>
                )}
                <GemStars value={shown} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="lore-pin">
        <span className="lore-pin-seal" aria-hidden="true" />
        <p className="lore-text">&ldquo;Some are born lucky. The rest of us just keep rolling until the Forge agrees with us.&rdquo;</p>
        <p className="lore-attr">— a dead apprentice&rsquo;s spellbook</p>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
