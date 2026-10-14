import { useState } from 'react'
import { createPortal } from 'react-dom'
import { sideLabels, statusOf, type CombatSettings, type Encounter, type Side } from '../rules/combat'
import {
  activeGroupEffects,
  applyGroupEffect,
  conditionSuggestions,
  effectRounds,
  removeGroupEffect,
  roundsText,
  targetsFor,
  type DurationUnit,
  type TargetShortcut,
} from '../rules/groupEffects'
import { PaperModal } from './DetailBits'

// CT7 do Combat Tracker (docs/controle-de-combate.md): a mesma condição em
// vários combatentes de uma vez, e tirar de todos de uma vez. A regra está em
// src/rules/groupEffects.ts.

const newID = () => crypto.randomUUID().toUpperCase()
const sides: Side[] = ['party', 'enemies', 'others']
const units: { key: DurationUnit; label: string }[] = [
  { key: 'rounds', label: 'rounds' },
  { key: 'turns', label: 'turns (×10 rounds)' },
  { key: 'none', label: 'no limit' },
]

export function EffectWindow({ encounter, settings, onChange, onClose }: { encounter: Encounter; settings: CombatSettings; onChange: (next: Encounter) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<DurationUnit>('rounds')
  const [chosen, setChosen] = useState<string[]>([])
  const suggestions = conditionSuggestions(encounter)
  const active = activeGroupEffects(encounter.combatants)
  const rounds = effectRounds(/^\d+$/.test(amount.trim()) ? Number(amount.trim()) : null, unit)
  const needsAmount = unit !== 'none' && rounds === null
  const pick = (shortcut: TargetShortcut) => setChosen(targetsFor(encounter.combatants, shortcut, settings.deathAt))
  const toggle = (id: string) => setChosen(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id])
  const presentSides = sides.filter((s) => encounter.combatants.some((c) => c.side === s))

  return createPortal(
    <PaperModal title="Effect on several" subtitle="The same condition, with the same duration, on everyone you mark" onClose={onClose}>
      <div className="surprise-head">
        <label>
          <span className="paper-label">Effect</span>{' '}
          <input className="ink-input" list="effect-names" autoFocus placeholder="e.g. Bless" aria-label="Effect name" value={name} onChange={(event) => setName(event.target.value)} />
          <datalist id="effect-names">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="paper-label">Duration</span>{' '}
          <input className="ink-input ink-number" inputMode="numeric" aria-label="Duration" disabled={unit === 'none'} value={unit === 'none' ? '' : amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <span className="chip-row">
          {units.map((u) => (
            <button key={u.key} className={unit === u.key ? 'chip chip-on' : 'chip'} onClick={() => setUnit(u.key)}>
              {u.label}
            </button>
          ))}
        </span>
        {unit === 'turns' && rounds !== null && <span className="paper-soft">= {roundsText(rounds)}</span>}
      </div>

      <div className="chip-row surprise-mods">
        <span className="paper-label">On:</span>
        {presentSides.map((s) => (
          <button key={s} className="chip" onClick={() => pick(s)}>
            {sideLabels[s]}
          </button>
        ))}
        <button className="chip" onClick={() => pick('standing')}>
          Everyone standing
        </button>
        <button className="chip" onClick={() => setChosen([])}>
          Clear
        </button>
      </div>
      <ul className="effect-targets">
        {encounter.combatants.map((c) => (
          <li key={c.id}>
            <label className={statusOf(c, settings.deathAt) === 'ok' ? '' : 'paper-soft'}>
              <input type="checkbox" checked={chosen.includes(c.id)} onChange={() => toggle(c.id)} /> {c.name || 'Unnamed'} <span className="paper-soft">· {sideLabels[c.side]}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="chip-row initiative-actions">
        <button
          className="chip chip-on"
          disabled={name.trim() === '' || chosen.length === 0 || needsAmount}
          onClick={() => {
            onChange({ ...encounter, combatants: applyGroupEffect(encounter.combatants, chosen, name, rounds, newID(), newID) })
            onClose()
          }}
        >
          Apply to {chosen.length}
        </button>
        {needsAmount && name.trim() !== '' && <span className="paper-soft">How many {unit}?</span>}
      </div>

      {active.length > 0 && (
        <section className="effect-active">
          <span className="paper-label">Active effects</span>
          <ul>
            {active.map((g) => (
              <li key={g.groupID}>
                <strong>{g.name}</strong> · {roundsText(g.rounds)} · {g.names.join(', ')}{' '}
                <button className="paper-link" onClick={() => onChange({ ...encounter, combatants: removeGroupEffect(encounter.combatants, g.groupID) })}>
                  remove from all
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="paper-soft">A turn is 10 rounds. Effects count down at the end of each round, like any condition; the × on one combatant removes it only from that one.</p>
    </PaperModal>,
    document.body,
  )
}
