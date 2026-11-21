import { useState } from 'react'
import { setExceptionalStrength } from '../rules/consequences'
import { exceptionalDigits, formatStrength, isExceptionalValue, parseExceptionalStrength, qualifiesForExceptionalStrength, rollExceptionalStrength } from '../rules/exceptionalStrength'
import { strengthRow } from '../rules/rules'
import type { PlayerCharacter } from '../types/library'
import { ForgeDice } from './ForgeDice'
import { ForgeHelpNote } from './ForgeParts'

// Força excepcional no The Forge (PHB Tabela 1): os atributos saem antes da
// classe, então o d100 é rolado aqui, na etapa de classe, quando as duas
// coisas já são conhecidas (Força 18 e uma classe de guerreiro). Os dados são
// os mesmos da mesa do grimório e da perícia de ladrão (ForgeDice): dezenas e
// unidades. Regras em rules/exceptionalStrength.ts.

type Mutate = (fn: (c: PlayerCharacter) => void) => void

/** Só aparece para quem tem direito; o painel é outro componente para que o estado dos dados morra quando ele some. */
export function ForgeExceptionalStrength({ draft, mutate }: { draft: PlayerCharacter; mutate: Mutate }) {
  return qualifiesForExceptionalStrength(draft) ? <ExceptionalStrengthPanel draft={draft} mutate={mutate} /> : null
}

function ExceptionalStrengthPanel({ draft, mutate }: { draft: PlayerCharacter; mutate: Mutate }) {
  // O número que está rolando; o valor só entra na ficha quando os dados assentam.
  const [rolling, setRolling] = useState<number | null>(null)
  const [rollKey, setRollKey] = useState(0)
  const [typing, setTyping] = useState(false)
  const [text, setText] = useState('')

  const stored = isExceptionalValue(draft.abilities.exceptionalStrength) ? draft.abilities.exceptionalStrength : null
  const shown = rolling ?? stored
  const settled = rolling === null && stored !== null
  const row = stored !== null ? strengthRow(18, stored) : null

  const roll = () => {
    setTyping(false)
    setRolling(rollExceptionalStrength())
    setRollKey((k) => k + 1)
  }
  const landed = () => {
    if (rolling === null) return
    mutate((c) => setExceptionalStrength(c, rolling))
    setRolling(null)
  }
  const typed = parseExceptionalStrength(text)
  const applyTyped = () => {
    if (typed === null) return
    mutate((c) => setExceptionalStrength(c, typed))
    setTyping(false)
    setText('')
  }

  return (
    <div className="mm-card th-test exc-card">
      <p className="mm-card-label">A warrior&rsquo;s might · Strength 18</p>
      <ForgeHelpNote ruleID="phb_ch01_strength">
        A warrior with a Strength of 18 rolls percentile dice (d100) for Exceptional Strength, from 18/01 up to 18/00 &mdash; the 00 is a hundred, the
        best there is. It adds to hit, damage, the weight you can carry, and how easily you force doors and bend bars.
      </ForgeHelpNote>
      {(rollKey > 0 || stored === null) && (
        <ForgeDice
          dice={[
            { kind: 'd10x10', value: Math.floor(((shown ?? 0) % 100) / 10) },
            { kind: 'd10', value: (shown ?? 0) % 10 },
          ]}
          rollKey={rollKey}
          onSettled={landed}
        />
      )}
      {settled && stored !== null && (
        <>
          <p className="th-scene th-scene-ok">Strength 18/{exceptionalDigits(stored)}!</p>
          {row && (
            <p className="th-hint">
              {formatStrength({ strength: 18, exceptionalStrength: stored })}: to hit +{row.hit}, damage +{row.dmg}, {row.weight} lb allowance, open doors {row.doors}, bend bars {row.bars}.
            </p>
          )}
        </>
      )}
      {stored === null && rolling === null && (
        <>
          <button type="button" className="sp-roll" onClick={roll}>
            Roll d100
          </button>
          {!typing ? (
            <button type="button" className="forge-help-rule exc-own" onClick={() => setTyping(true)}>
              Rolled your own dice? Type the result
            </button>
          ) : (
            <div className="exc-own-row">
              <span aria-hidden="true">18 /</span>
              <input
                className="exc-input"
                inputMode="numeric"
                maxLength={3}
                placeholder="00"
                aria-label="Your d100 roll (00 is 100)"
                value={text}
                autoFocus
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && applyTyped()}
              />
              <button type="button" className="th-btn1" disabled={typed === null} onClick={applyTyped}>
                Use it
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
