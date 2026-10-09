import { useEffect, useMemo, useState } from 'react'
import { loadTables } from '../data/tables'
import { rollDice } from '../rules/dice'
import {
  emptyEntry,
  endRound,
  entryTotal,
  initiativeKeys,
  initiativeModifiers,
  initiativeSteps,
  newInitiative,
  sideLabels,
  startRound,
  type CombatSettings,
  type Encounter,
  type InitiativeEntry,
  type InitiativeMethod,
  type InitiativeModifier,
  type InitiativeRound,
  type Side,
} from '../rules/combat'

// Iniciativa e rodadas do Combat Tracker (CT2, docs/controle-de-combate.md):
// por lado (regra base do DMG) ou individual (opcional), d10 rolado ou
// digitado, modificadores das Tabelas 40/41 (lidos dos dados), ordem com
// empates simultâneos, "Next" e "End round". A regra está em src/rules/combat.ts.

const d10 = { count: 1, sides: 10, modifier: 0 }

/** Modificadores das Tabelas 40 (padrão) e 41 (opcionais, só no individual), do Table Grimoire. */
function useInitiativeTables() {
  const [tables, setTables] = useState<{ standard: InitiativeModifier[]; optional: InitiativeModifier[] }>({ standard: [], optional: [] })
  useEffect(() => {
    void loadTables().then((all) => {
      const rows = (id: string) => all.find((t) => t.id === id)?.rows ?? []
      setTables({ standard: initiativeModifiers(rows('dmg-40')), optional: initiativeModifiers(rows('dmg-41')) })
    })
  }, [])
  return tables
}

export function InitiativePanel({
  encounter,
  settings,
  onChange,
}: {
  encounter: Encounter
  settings: CombatSettings
  onChange: (next: Encounter) => void
}) {
  const tables = useInitiativeTables()
  const round: InitiativeRound = encounter.initiative ?? newInitiative(settings.initiative)
  const modifiers = useMemo(() => (round.method === 'individual' ? [...tables.standard, ...tables.optional] : tables.standard), [round.method, tables])
  const keys = initiativeKeys(encounter, round.method, settings.deathAt)
  const started = round.step !== null
  // Rodada começada: a ordem fechada; antes, a prévia com as rolagens até aqui.
  const steps = started && round.order ? round.order : initiativeSteps(encounter, round, modifiers, settings.deathAt)
  const missing = keys.filter((k) => (round.entries[k]?.roll ?? null) === null)
  // Os jogadores rolam a dos PCs (o lado Party, ou cada PC); o DM só anota. O app rola o resto.
  const byPlayers = (key: string) => (round.method === 'side' ? key === 'party' : encounter.combatants.find((c) => c.id === key)?.kind === 'pc')
  const toRoll = missing.filter((k) => !byPlayers(k))
  const waiting = missing.filter(byPlayers)

  const setRound = (next: InitiativeRound) => onChange({ ...encounter, initiative: next })
  const setEntry = (key: string, entry: InitiativeEntry) => setRound({ ...round, entries: { ...round.entries, [key]: entry } })
  const labelOf = (key: string) => (round.method === 'individual' ? (encounter.combatants.find((c) => c.id === key)?.name ?? '?') : sideLabels[key as Side])
  const rollMissing = () => {
    const entries = { ...round.entries }
    for (const key of toRoll) entries[key] = { ...(entries[key] ?? emptyEntry()), roll: rollDice(d10).total }
    setRound({ ...round, entries })
  }
  const setMethod = (method: InitiativeMethod) => {
    if (method !== round.method) setRound(newInitiative(method))
  }

  return (
    <section className="initiative">
      <div className="initiative-head">
        <h2 className="rec-title initiative-round">{encounter.round > 0 ? `Round ${encounter.round}` : 'Before the fight'}</h2>
        <div className="chip-row">
          <button className={round.method === 'side' ? 'chip chip-on' : 'chip'} onClick={() => setMethod('side')} disabled={started}>
            By side
          </button>
          <button className={round.method === 'individual' ? 'chip chip-on' : 'chip'} onClick={() => setMethod('individual')} disabled={started}>
            Individual
          </button>
        </div>
      </div>

      {!started && (
        <>
          <p className="paper-soft initiative-help">
            1d10 {round.method === 'side' ? 'for each side' : 'for each combatant'}: type the players' roll for {round.method === 'side' ? 'the party' : 'each PC'} and roll (or type) the rest. The lowest modified result acts first, and ties act at the same time (DMG, Chapter 9).
          </p>
          {keys.length === 0 && <p className="paper-soft">Nobody standing to roll initiative.</p>}
          <ul className="initiative-entries">
            {keys.map((key) => (
              <EntryRow
                key={key}
                label={labelOf(key)}
                entry={round.entries[key] ?? emptyEntry()}
                modifiers={modifiers}
                extraLabel={round.method === 'individual' ? 'Weapon speed / casting time' : 'Other'}
                byPlayers={byPlayers(key)}
                onChange={(entry) => setEntry(key, entry)}
              />
            ))}
          </ul>
          <div className="chip-row initiative-actions">
            <button className="chip" disabled={toRoll.length === 0} onClick={rollMissing}>
              Roll {toRoll.length === 0 || toRoll.length === keys.filter((k) => !byPlayers(k)).length ? 'the rest' : `the ${toRoll.length} missing`}
            </button>
            <button
              className="chip chip-on"
              disabled={steps.length === 0 || missing.length > 0}
              onClick={() => onChange(startRound(encounter, round, modifiers, settings.deathAt))}
            >
              Start round {Math.max(encounter.round, 1)}
            </button>
            {waiting.length > 0 && <span className="paper-soft">Waiting for the players' roll{waiting.length > 1 ? 's' : ''}: {waiting.map(labelOf).join(', ')}</span>}
          </div>
        </>
      )}

      {steps.length > 0 && (
        <ol className="initiative-order">
          {steps.map((s, i) => (
            <li key={s.keys.join('|')} className={started && i === round.step ? 'initiative-now' : started && round.step !== null && i < round.step ? 'initiative-done' : undefined}>
              <span className="initiative-score">{s.score}</span> {s.keys.map(labelOf).join(' + ')}
              {s.keys.length > 1 && <span className="paper-soft"> (simultaneous)</span>}
              {round.method === 'side' && (
                <span className="paper-soft">
                  {' '}
                  · {s.combatantIDs.map((id) => encounter.combatants.find((c) => c.id === id)?.name).join(', ')}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {started && (
        <div className="chip-row initiative-actions">
          {round.step !== null && round.step < steps.length - 1 ? (
            <button className="chip chip-on" onClick={() => setRound({ ...round, step: (round.step ?? 0) + 1 })}>
              Next ›
            </button>
          ) : null}
          <button className={round.step !== null && round.step >= steps.length - 1 ? 'chip chip-on' : 'chip'} onClick={() => onChange(endRound(encounter))}>
            End round {encounter.round}
          </button>
        </div>
      )}
    </section>
  )
}

function EntryRow({
  label,
  entry,
  modifiers,
  extraLabel,
  byPlayers,
  onChange,
}: {
  label: string
  entry: InitiativeEntry
  modifiers: InitiativeModifier[]
  extraLabel: string
  /** Rolagem dos jogadores: o DM só digita (sem o botão Roll). */
  byPlayers: boolean
  onChange: (entry: InitiativeEntry) => void
}) {
  const [text, setText] = useState<string | null>(null)
  const total = entryTotal(entry, modifiers)
  const toggle = (mod: string) => onChange({ ...entry, mods: entry.mods.includes(mod) ? entry.mods.filter((m) => m !== mod) : [...entry.mods, mod] })
  return (
    <li className="initiative-entry">
      <span className="initiative-label">{label}</span>
      <input
        className="ink-input ink-number"
        inputMode="numeric"
        placeholder={byPlayers ? 'roll' : 'd10'}
        title={byPlayers ? "The players roll; type their d10" : undefined}
        aria-label={`${label}: d10`}
        value={text ?? (entry.roll === null ? '' : String(entry.roll))}
        onFocus={() => setText(entry.roll === null ? '' : String(entry.roll))}
        onBlur={() => setText(null)}
        onChange={(event) => {
          const next = event.target.value.trim()
          setText(next)
          if (next === '') onChange({ ...entry, roll: null })
          else if (/^\d+$/.test(next)) onChange({ ...entry, roll: Number(next) })
        }}
      />
      {byPlayers ? (
        <span className="paper-soft initiative-players">players</span>
      ) : (
        <button className="chip" onClick={() => onChange({ ...entry, roll: rollDice(d10).total })}>
          Roll
        </button>
      )}
      <label className="initiative-extra">
        <span className="paper-label">{extraLabel}</span>
        <input
          className="ink-input ink-number"
          inputMode="numeric"
          aria-label={`${label}: ${extraLabel}`}
          value={entry.extra === 0 ? '' : String(entry.extra)}
          placeholder="0"
          onChange={(event) => {
            const next = event.target.value.trim()
            if (next === '' || /^[+-]?\d+$/.test(next)) onChange({ ...entry, extra: next === '' || next === '-' || next === '+' ? 0 : Number(next) })
          }}
        />
      </label>
      <span className="initiative-total">{total === null ? '—' : `= ${total}`}</span>
      {modifiers.length > 0 && (
        <details className="initiative-mods">
          <summary>Modifiers{entry.mods.length > 0 ? ` (${entry.mods.length})` : ''}</summary>
          <div className="chip-row">
            {modifiers.map((m) => (
              <button key={m.label} className={entry.mods.includes(m.label) ? 'chip chip-on' : 'chip'} onClick={() => toggle(m.label)}>
                {m.label} {m.value > 0 ? `+${m.value}` : m.value}
              </button>
            ))}
          </div>
        </details>
      )}
    </li>
  )
}
