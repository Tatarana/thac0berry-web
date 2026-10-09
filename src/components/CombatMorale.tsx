import { useEffect, useState } from 'react'
import { loadTables } from '../data/tables'
import { rollDice } from '../rules/dice'
import {
  autoMoraleModifiers,
  moraleFromTable,
  moraleRows,
  moraleTarget,
  recordMorale,
  type CombatSettings,
  type Combatant,
  type Encounter,
  type InitiativeModifier,
} from '../rules/combat'
import { PaperModal } from './DetailBits'

// Teste de moral do Combat Tracker (CT3, docs/controle-de-combate.md): 2d10
// contra a moral (do livro ou da Tabela 49), com os modificadores da Tabela 50
// em chips; os de PV perdido, DV e testes repetidos vêm marcados sozinhos. A
// regra está em src/rules/combat.ts.

const twoD10 = { count: 2, sides: 10, modifier: 0 }

/** Tabelas 49 (moral por tipo) e 50 (modificadores), do Table Grimoire. */
function useMoraleTables() {
  const [tables, setTables] = useState<{ ratings: InitiativeModifier[]; modifiers: InitiativeModifier[] }>({ ratings: [], modifiers: [] })
  useEffect(() => {
    void loadTables().then((all) => {
      const rows = (id: string) => all.find((t) => t.id === id)?.rows ?? []
      setTables({ ratings: moraleRows(rows('dmg-49')), modifiers: moraleRows(rows('dmg-50')) })
    })
  }, [])
  return tables
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0')

export function MoraleWindow({
  combatant: c,
  encounter,
  settings,
  onChange,
  onClose,
}: {
  combatant: Combatant
  encounter: Encounter
  settings: CombatSettings
  onChange: (next: Combatant) => void
  onClose: () => void
}) {
  const { ratings, modifiers } = useMoraleTables()
  const auto = autoMoraleModifiers(c, encounter, modifiers, settings.deathAt)
  const [rating, setRating] = useState<number | null>(c.morale?.low ?? null)
  // Chips ligados; os automáticos começam ligados (o DM pode desligar).
  const [chosen, setChosen] = useState<string[] | null>(null)
  const on = chosen ?? auto.map((m) => m.label)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<Combatant['lastMorale'] | null>(null)

  const valueOf = (m: InitiativeModifier) => auto.find((a) => a.label === m.label)?.value ?? m.value
  const active = modifiers.filter((m) => on.includes(m.label))
  const target = rating === null ? null : moraleTarget(rating, active.map(valueOf))
  const toggle = (label: string) => setChosen(on.includes(label) ? on.filter((l) => l !== label) : [...on, label])
  const range = c.morale ? Array.from({ length: c.morale.high - c.morale.low + 1 }, (_, i) => c.morale!.low + i) : []

  const check = (roll: number) => {
    if (target === null) return
    const next = recordMorale(c, encounter.round, roll, target)
    onChange(next)
    setResult(next.lastMorale)
    setTyped('')
    setChosen(null)
  }
  const typedRoll = /^\d+$/.test(typed.trim()) ? Number(typed.trim()) : null
  const mark = (name: string) => {
    if (!c.conditions.some((x) => x.name === name)) onChange({ ...c, conditions: [...c.conditions, { id: crypto.randomUUID().toUpperCase(), name, rounds: null }] })
    onClose()
  }

  return (
    <PaperModal title={`Morale: ${c.name}`} subtitle="2d10 equal to or under the morale holds (DMG, Chapter 9)" onClose={onClose}>
      <div className="morale">
        {c.morale ? (
          <div className="paper-filter">
            <span className="paper-label">Morale · {c.morale.text}</span>
            {range.length > 1 && (
              <div className="chip-row">
                {range.map((v) => (
                  <button key={v} className={v === rating ? 'chip chip-on' : 'chip'} onClick={() => setRating(v)}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="paper-filter">
            <span className="paper-label">No morale rating · pick one (Table 49)</span>
            <div className="chip-row">
              {ratings.map((r) => (
                <button
                  key={r.label}
                  className="chip"
                  onClick={() => {
                    onChange({ ...c, morale: moraleFromTable(r) })
                    setRating(r.value)
                  }}
                >
                  {r.label} {r.value}
                </button>
              ))}
            </div>
          </div>
        )}

        {target !== null && rating !== null && (
          <p className="morale-target">
            {result ? 'Next check: morale ' : 'Morale '}
            {rating}
            {active.length > 0 && ` ${signed(target - rating)}`} = <strong>{target}</strong>: roll {target} or less on 2d10.
          </p>
        )}

        <form
          className="chip-row morale-roll"
          onSubmit={(event) => {
            event.preventDefault()
            if (typedRoll !== null) check(typedRoll)
          }}
        >
          <button type="button" className="chip chip-on" disabled={target === null} onClick={() => check(rollDice(twoD10).total)}>
            Roll 2d10
          </button>
          <span className="paper-soft">or</span>
          <input className="ink-input ink-number" inputMode="numeric" placeholder="2d10" aria-label="Morale roll" value={typed} onChange={(event) => setTyped(event.target.value)} />
          <button type="submit" className="chip" disabled={target === null || typedRoll === null}>
            Check
          </button>
        </form>

        {result && (
          <div className={result.holds ? 'morale-result morale-holds' : 'morale-result morale-fails'} role="status">
            <strong>
              {result.holds ? 'Holds' : 'Fails'} — rolled {result.roll} {result.holds ? '≤' : '>'} {result.target}.
            </strong>{' '}
            {result.holds ? (
              'It keeps fighting.'
            ) : (
              <>
                It tries to escape whatever caused the check. Missed by {result.roll - result.target}: if close, it backs out and looks for safety nearby; if blown badly, it bugs out, casting aside anything that slows it. With nowhere to go, an intelligent creature surrenders if it thinks it will be spared.
                <span className="chip-row morale-marks">
                  <button className="chip" onClick={() => mark('Fleeing')}>
                    Mark Fleeing
                  </button>
                  <button className="chip" onClick={() => mark('Surrendered')}>
                    Mark Surrendered
                  </button>
                </span>
              </>
            )}
          </div>
        )}

        {modifiers.length > 0 && (
          <div className="paper-filter">
            <span className="paper-label">Modifiers (Table 50)</span>
            <div className="chip-row">
              {modifiers.map((m) => {
                const a = auto.find((x) => x.label === m.label)
                return (
                  <button key={m.label} className={on.includes(m.label) ? 'chip chip-on' : 'chip'} title={a ? `Automatic: ${a.reason}` : undefined} onClick={() => toggle(m.label)}>
                    {m.label} {signed(valueOf(m))}
                    {a && <span className="morale-auto"> · {a.reason}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <details className="morale-when">
          <summary>When to check morale</summary>
          <p className="paper-soft">Never for player characters, and only when the danger becomes too great — not every round. The DMG suggests a check when the creature:</p>
          <ul>
            <li>was surprised (only on the first round after surprise);</li>
            <li>faces an obviously superior force;</li>
            <li>sees an ally slain by magic;</li>
            <li>sees 25% of its group fall, then 50%, then each companion slain after that;</li>
            <li>sees its leader desert or die;</li>
            <li>fights a creature it cannot harm due to magical protections;</li>
            <li>is ordered on a heroically dangerous task, or offered a temptation (bribe, chance to steal);</li>
            <li>is told to act as a rear guard, or to use a charge of a powerful personal magical item;</li>
            <li>is given a chance to surrender (after meeting one other condition), or is completely surrounded.</li>
          </ul>
          <p className="paper-soft">Do not let the dice overrule logic or drama: role-playing the creature is the first choice.</p>
        </details>
      </div>
    </PaperModal>
  )
}
