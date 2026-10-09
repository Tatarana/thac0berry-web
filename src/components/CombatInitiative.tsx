import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useInitiativeModifiers } from '../lib/initiativeTables'
import { rollDice } from '../rules/dice'
import {
  emptyEntry,
  endRound,
  entryTotal,
  goBackToRound,
  initiativeKeys,
  initiativeSteps,
  missingRolls,
  newInitiative,
  sideLabels,
  startRound,
  statusOf,
  type CombatSettings,
  type Encounter,
  type InitiativeEntry,
  type InitiativeMethod,
  type InitiativeModifier,
  type InitiativeRound,
  type InitiativeStep,
  type RoundSnapshot,
  type Side,
} from '../rules/combat'
import { PaperModal } from './DetailBits'

// Iniciativa e rodadas do Combat Tracker (CT2, docs/controle-de-combate.md):
// por lado (regra base do DMG) ou individual (opcional), d10 rolado ou
// digitado, modificadores das Tabelas 40/41 (lidos dos dados), ordem com
// empates simultâneos, "Next" e "End round". Na tela, uma linha compacta e a
// janela das rolagens; o total de cada um vai na coluna INIT da tabela. A
// regra está em src/rules/combat.ts.

const d10 = { count: 1, sides: 10, modifier: 0 }

/** Rótulo de uma chave da iniciativa: o lado, ou o nome do combatente. */
const keyLabel = (encounter: Encounter, method: InitiativeMethod, key: string) =>
  method === 'individual' ? (encounter.combatants.find((c) => c.id === key)?.name ?? '?') : sideLabels[key as Side]

/**
 * Linha compacta da iniciativa (pedido do usuário, 2026-10-09: o bloco
 * "Before the fight" ocupava demais): rodada, quem age e os botões da rodada.
 * Nunca fica sem saída: "Start round" aparece aqui assim que todos rolaram, e
 * "End round" existe desde a rodada 1 (o DM pode pular a iniciativa). O total
 * de cada um vai na coluna INIT.
 */
export function InitiativeBar({
  encounter,
  steps,
  canStart,
  onStart,
  onChange,
  onOpen,
  onRounds,
  onSurprise,
  onLog,
}: {
  encounter: Encounter
  /** Ordem da rodada (fechada, ou a prévia). */
  steps: InitiativeStep[]
  /** Todos rolaram: dá para começar a rodada daqui. */
  canStart: boolean
  onStart: () => void
  onChange: (next: Encounter) => void
  onOpen: () => void
  /** Lista das rodadas para voltar no tempo (só quando há fotos). */
  onRounds?: () => void
  /** Teste de surpresa (antes da rodada 1). */
  onSurprise: () => void
  /** Log do combate (CT5b). */
  onLog: () => void
}) {
  const round = encounter.initiative
  const started = round?.step !== null && round?.step !== undefined
  const step = started ? steps[round.step!] : undefined
  const last = started && round.step! >= steps.length - 1
  return (
    <div className="initiative-bar">
      <span className="rec-title initiative-round">{encounter.round > 0 ? `Round ${encounter.round}` : 'Before the fight'}</span>
      {step && (
        <span className="initiative-acting">
          Acting: <strong>{step.keys.map((k) => keyLabel(encounter, round!.method, k)).join(' + ')}</strong> ({step.score}){step.keys.length > 1 && ' · simultaneous'}
        </span>
      )}
      <span className="chip-row">
        {started && !last && (
          <button className="chip chip-on" onClick={() => onChange({ ...encounter, initiative: { ...round, step: round.step! + 1 } })}>
            Next ›
          </button>
        )}
        {!started && canStart && (
          <button className="chip chip-on" onClick={onStart}>
            Start round {Math.max(encounter.round, 1)}
          </button>
        )}
        {encounter.round > 0 && (
          <button className={last ? 'chip chip-on' : 'chip'} onClick={() => onChange(endRound(encounter))}>
            End round {encounter.round}
          </button>
        )}
        <button className={!started && !canStart ? 'chip chip-on' : 'chip'} onClick={onOpen}>
          {!started && !canStart ? 'Roll initiative' : 'Initiative'}
        </button>
        {encounter.round === 0 && !started && (
          <button className="chip" onClick={onSurprise}>
            Surprise
          </button>
        )}
        {onRounds && (
          <button className="chip" onClick={onRounds}>
            Rounds
          </button>
        )}
        <button className="chip" onClick={onLog}>
          Log{encounter.log?.length ? ` (${encounter.log.length})` : ''}
        </button>
      </span>
      {encounter.surprise && encounter.round <= 1 && (
        <span className={encounter.surprise.surprised.length ? 'initiative-surprised' : 'paper-soft'}>
          {encounter.surprise.surprised.length
            ? `${encounter.surprise.surprised.map((s) => sideLabels[s]).join(' and ')} surprised: no action in round 1`
            : 'No one surprised'}
        </span>
      )}
    </div>
  )
}

/**
 * Janela das rolagens de iniciativa: método, d10 de cada um (os dos PCs só
 * anotados), modificadores e "Start round". Com a rodada já começada, dá para
 * rolar de novo e recomeçar a rodada com a nova ordem (o DM pode querer).
 */
export function InitiativeWindow({
  encounter,
  settings,
  onChange,
  onClose,
}: {
  encounter: Encounter
  settings: CombatSettings
  onChange: (next: Encounter) => void
  onClose: () => void
}) {
  const round: InitiativeRound = encounter.initiative ?? newInitiative(settings.initiative)
  const modifiers = useInitiativeModifiers(round.method)
  const keys = initiativeKeys(encounter, round.method, settings.deathAt)
  const started = round.step !== null
  // Rodada começada: a ordem fechada; antes, a prévia com as rolagens até aqui.
  const steps = started && round.order ? round.order : initiativeSteps(encounter, round, modifiers, settings.deathAt)
  const preview = initiativeSteps(encounter, round, modifiers, settings.deathAt)
  const missing = missingRolls(encounter, round, settings.deathAt)
  // Os jogadores rolam a dos PCs (o lado Party, ou cada PC); o DM só anota. O app rola o resto.
  const byPlayers = (key: string) => (round.method === 'side' ? key === 'party' : encounter.combatants.find((c) => c.id === key)?.kind === 'pc')
  const foes = keys.filter((k) => !byPlayers(k))
  const toRoll = started ? foes : missing.filter((k) => !byPlayers(k))
  const waiting = missing.filter(byPlayers)
  const labelOf = (key: string) => keyLabel(encounter, round.method, key)
  const last = started && round.step! >= steps.length - 1

  const setRound = (next: InitiativeRound) => onChange({ ...encounter, initiative: next })
  const setEntry = (key: string, entry: InitiativeEntry) => setRound({ ...round, entries: { ...round.entries, [key]: entry } })
  const rollFoes = () => {
    const entries = { ...round.entries }
    for (const key of toRoll) entries[key] = { ...(entries[key] ?? emptyEntry()), roll: rollDice(d10).total }
    setRound({ ...round, entries })
  }
  const setMethod = (method: InitiativeMethod) => {
    if (method !== round.method) setRound(newInitiative(method))
  }
  const start = () => {
    onChange(startRound(encounter, round, modifiers, settings.deathAt))
    onClose()
  }

  return createPortal(
    <PaperModal title={`Initiative — ${encounter.round > 0 ? `Round ${encounter.round}` : 'before the fight'}`} subtitle="1d10, lowest first; ties act at the same time (DMG, Chapter 9)" onClose={onClose}>
      <div className="initiative">
        <div className="chip-row initiative-method">
          <button className={round.method === 'side' ? 'chip chip-on' : 'chip'} onClick={() => setMethod('side')}>
            By side
          </button>
          <button className={round.method === 'individual' ? 'chip chip-on' : 'chip'} onClick={() => setMethod('individual')}>
            Individual
          </button>
        </div>
        <p className="paper-soft initiative-help">
          {started
            ? 'The round is under way. Change the rolls (or roll the foes again) and restart the round to use the new order.'
            : `Type the players' roll for ${round.method === 'side' ? 'the party' : 'each PC'}; roll (or type) the rest.`}
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
          <button className="chip" disabled={toRoll.length === 0} onClick={rollFoes}>
            {started ? 'Re-roll the foes' : `Roll ${toRoll.length === 0 || toRoll.length === foes.length ? 'the rest' : `the ${toRoll.length} missing`}`}
          </button>
          <button className="chip chip-on" disabled={preview.length === 0 || missing.length > 0} onClick={start}>
            {started ? 'Restart' : 'Start'} round {Math.max(encounter.round, 1)}
          </button>
          {started && !last && (
            <button className="chip" onClick={() => setRound({ ...round, step: round.step! + 1 })}>
              Next ›
            </button>
          )}
          {encounter.round > 0 && (
            <button
              className="chip"
              onClick={() => {
                onChange(endRound(encounter))
                onClose()
              }}
            >
              End round {encounter.round}
            </button>
          )}
          {waiting.length > 0 && <span className="paper-soft">Waiting for the players' roll{waiting.length > 1 ? 's' : ''}: {waiting.map(labelOf).join(', ')}</span>}
        </div>

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
      </div>
    </PaperModal>,
    document.body,
  )
}

/** Rodadas guardadas: voltar ao começo de qualquer uma (magias que voltam no tempo). */
export function RoundsWindow({
  encounter,
  settings,
  onChange,
  onClose,
}: {
  encounter: Encounter
  settings: CombatSettings
  onChange: (next: Encounter) => void
  onClose: () => void
}) {
  const history = [...(encounter.history ?? [])].reverse()
  const standing = (snapshot: RoundSnapshot) =>
    (['party', 'enemies', 'others'] as Side[])
      .map((side) => {
        const list = encounter.combatants.filter((c) => c.side === side && snapshot.combatants[c.id])
        if (list.length === 0) return null
        const up = list.filter((c) => statusOf(snapshot.combatants[c.id], settings.deathAt) === 'ok').length
        return `${sideLabels[side]} ${up}/${list.length}`
      })
      .filter(Boolean)
      .join(' · ')
  const goBack = (round: number) => {
    const later = round < encounter.round ? ` Rounds ${round + 1} to ${encounter.round} will be forgotten.` : ''
    if (!window.confirm(`Go back to the start of round ${round}? Hit points, conditions, morale and initiative return to how they were.${later}`)) return
    onChange(goBackToRound(encounter, round))
    onClose()
  }
  return createPortal(
    <PaperModal title="Rounds" subtitle="Go back to the start of any round (time-bending magic)" onClose={onClose}>
      {history.length === 0 && <p className="paper-soft">No rounds saved yet: each round is saved when it starts.</p>}
      <ul className="rounds-list">
        {history.map((h) => (
          <li key={h.round}>
            <span className="rounds-name">Round {h.round}</span>
            <span className="paper-soft">{standing(h)} standing</span>
            <button className="chip" onClick={() => goBack(h.round)}>
              {h.round === encounter.round ? 'Restart this round' : `Go back to round ${h.round}`}
            </button>
          </li>
        ))}
      </ul>
      <p className="paper-soft">Names, notes and sides stay as they are now; combatants added later stay in the fight.</p>
    </PaperModal>,
    document.body,
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
