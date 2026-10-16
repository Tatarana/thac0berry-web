import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCampaignCharacters } from '../lib/campaignCharacters'
import { resolveMessage, usePendingToDm } from '../lib/combatMessages'
import { rollDice } from '../rules/dice'
import { sideLabels, statusOf, type CombatSettings, type Combatant, type Encounter, type Side } from '../rules/combat'
import {
  activeGroupEffects,
  affectedIDs,
  applyGroupEffect,
  conditionSuggestions,
  effectRounds,
  removeGroupEffect,
  roundsText,
  saveCategoryKeys,
  saveNote,
  saveSucceeds,
  sheetSaveTarget,
  targetsFor,
  type DurationUnit,
  type SaveMode,
  type TargetSave,
  type TargetShortcut,
} from '../rules/groupEffects'
import { saveLevel, savesFor, warriorSaveRows } from '../rules/surprise'
import { useTable } from './CombatExtras'
import { PaperModal } from './DetailBits'

// CT7 do Combat Tracker (docs/controle-de-combate.md): a mesma condição em
// vários combatentes de uma vez, e tirar de todos de uma vez. CT8: salvamento
// por alvo antes de aplicar. A regra está em src/rules/groupEffects.ts.

const newID = () => crypto.randomUUID().toUpperCase()
const sides: Side[] = ['party', 'enemies', 'others']
const units: { key: DurationUnit; label: string }[] = [
  { key: 'rounds', label: 'rounds' },
  { key: 'turns', label: 'turns (×10 rounds)' },
  { key: 'none', label: 'no limit' },
]
const d20 = { count: 1, sides: 20, modifier: 0 }
const intOrNull = (text: string) => (/^[+-]?\d+$/.test(text.trim()) ? Number(text.trim().replace('+', '')) : null)

export function EffectWindow({
  encounter,
  settings,
  onChange,
  onClose,
}: {
  encounter: Encounter
  settings: CombatSettings
  /** `notes`: linhas a mais no log (o resultado dos salvamentos). */
  onChange: (next: Encounter, notes?: string[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<DurationUnit>('rounds')
  const [chosen, setChosen] = useState<string[]>([])
  // CT8: salvamento por alvo.
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState(4)
  const [modText, setModText] = useState('0')
  const [mode, setMode] = useState<SaveMode>('negates')
  const [typed, setTyped] = useState<Record<string, { target?: string; roll?: string }>>({})
  const table46 = useTable('dmg-46')
  const warriorRows = useMemo(() => warriorSaveRows(table46?.rows ?? []), [table46])
  const { characters } = useCampaignCharacters(saving ? encounter.campaignID : null)
  // Interativo (I3): pede o salvamento aos PCs do App marcados, e recebe o d20 deles.
  const proposals = usePendingToDm(encounter.id).filter((m) => m.kind === 'save')
  const encounterRef = useRef(encounter)
  encounterRef.current = encounter
  const ownsRequest = useRef(false)

  const suggestions = conditionSuggestions(encounter)
  const active = activeGroupEffects(encounter.combatants)
  const rounds = effectRounds(/^\d+$/.test(amount.trim()) ? Number(amount.trim()) : null, unit)
  const needsAmount = unit !== 'none' && rounds === null
  const pick = (shortcut: TargetShortcut) => setChosen(targetsFor(encounter.combatants, shortcut, settings.deathAt))
  const toggle = (id: string) => setChosen(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id])
  const presentSides = sides.filter((s) => encounter.combatants.some((c) => c.side === s))
  const targets = encounter.combatants.filter((c) => chosen.includes(c.id))
  const modifier = intOrNull(modText) ?? 0

  // Interativo (I3): quem pedimos o salvamento muda com a seleção; limpa ao sair.
  const pcTargetIDs = saving ? targets.filter((c) => c.kind === 'pc' && c.characterID).map((c) => c.id) : []
  useEffect(() => {
    const current = encounter.saveRequest
    const already = current && current.category === category && current.targetIDs.length === pcTargetIDs.length && current.targetIDs.every((id) => pcTargetIDs.includes(id))
    if (already) return
    if (pcTargetIDs.length > 0) {
      ownsRequest.current = true
      onChange({ ...encounter, saveRequest: { category, targetIDs: pcTargetIDs } })
    } else if (ownsRequest.current) {
      ownsRequest.current = false
      onChange({ ...encounter, saveRequest: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, category, pcTargetIDs.join(',')])
  useEffect(
    () => () => {
      if (ownsRequest.current) onChange({ ...encounterRef.current, saveRequest: null })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // O valor de salvamento: a ficha (PC do App), a Tabela 46 pelos DV (monstros e NPCs), ou o que o DM digitou.
  const defaultTarget = (c: Combatant): number | null => {
    if (c.characterID) {
      const sheet = characters?.find((x) => x.id.toLowerCase() === c.characterID!.toLowerCase())?.data
      if (sheet) return sheetSaveTarget(sheet.saves, category)
    }
    if (c.kind === 'pc') return null
    const level = saveLevel(c)
    return level === null ? null : (savesFor(level, warriorRows)?.[category] ?? null)
  }
  const saves: (TargetSave & { name: string; kind: Combatant['kind'] })[] = targets.map((c) => {
    const t = typed[c.id] ?? {}
    return { id: c.id, name: c.name, kind: c.kind, target: t.target !== undefined ? intOrNull(t.target) : defaultTarget(c), roll: t.roll !== undefined ? intOrNull(t.roll) : null }
  })
  const setTypedField = (id: string, field: 'target' | 'roll', value: string) => setTyped((now) => ({ ...now, [id]: { ...now[id], [field]: value } }))
  const rollTheRest = () =>
    setTyped((now) => {
      const next = { ...now }
      for (const s of saves) if (s.kind !== 'pc' && s.roll === null) next[s.id] = { ...next[s.id], roll: String(rollDice(d20).total) }
      return next
    })
  const savesReady = saves.every((s) => saveSucceeds(s, modifier) !== null)
  const affected = saving ? affectedIDs(saves, modifier, mode) : chosen
  // Em "half", o efeito é opcional: sem nome, só o log de quem salvou.
  const nameNeeded = !(saving && mode === 'half')
  const canApply = chosen.length > 0 && (!saving || savesReady) && (name.trim() !== '' ? !needsAmount : !nameNeeded)

  const apply = () => {
    const notes = saving ? [saveNote(name, category, modifier, saves)] : []
    const combatants = name.trim() !== '' && affected.length > 0 ? applyGroupEffect(encounter.combatants, affected, name, rounds, newID(), newID) : encounter.combatants
    ownsRequest.current = false
    onChange({ ...encounter, combatants, saveRequest: null }, notes)
    onClose()
  }
  const close = () => {
    if (ownsRequest.current) {
      ownsRequest.current = false
      onChange({ ...encounter, saveRequest: null })
    }
    onClose()
  }

  return createPortal(
    <PaperModal title="Effect on several" subtitle="The same condition, with the same duration, on everyone you mark" onClose={close}>
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

      <section className="effect-save">
        <label className="surprise-immune">
          <input type="checkbox" checked={saving} onChange={(event) => setSaving(event.target.checked)} /> Saving throw for each target
        </label>
        {saving && (
          <>
            <div className="chip-row surprise-mods">
              {saveCategoryKeys.map((cat, i) => (
                <button key={cat.id} className={category === i ? 'chip chip-on' : 'chip'} onClick={() => setCategory(i)}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="surprise-head start-result">
              <label>
                <span className="paper-label">Modifier</span>{' '}
                <input className="ink-input ink-number" inputMode="numeric" aria-label="Save modifier for everyone" value={modText} onChange={(event) => setModText(event.target.value)} />
              </label>
              <span className="chip-row">
                <button className={mode === 'negates' ? 'chip chip-on' : 'chip'} onClick={() => setMode('negates')} title="Who saves does not get the effect">
                  save negates
                </button>
                <button className={mode === 'half' ? 'chip chip-on' : 'chip'} onClick={() => setMode('half')} title="Who saves only goes to the log (half damage: apply it by hand)">
                  save for half
                </button>
              </span>
              <button className="chip" disabled={!saves.some((s) => s.kind !== 'pc' && s.roll === null)} onClick={rollTheRest}>
                Roll the rest
              </button>
            </div>
            {saves.length === 0 ? (
              <p className="paper-soft">Mark the targets above.</p>
            ) : (
              <table className="effect-save-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th title="Number to roll on the d20: from the sheet, or Table 46 by Hit Dice">Save</th>
                    <th>d20</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {saves.map((s) => {
                    const ok = saveSucceeds(s, modifier)
                    const characterID = targets.find((t) => t.id === s.id)?.characterID
                    const proposal = characterID ? proposals.find((m) => m.character_id.toLowerCase() === characterID.toLowerCase()) : undefined
                    return (
                      <tr key={s.id}>
                        <td>
                          {s.name}
                          {s.kind === 'pc' && <span className="paper-soft"> · player rolls</span>}
                        </td>
                        <td>
                          <input
                            className="ink-input ink-number"
                            inputMode="numeric"
                            aria-label={`${s.name}: save target`}
                            placeholder="—"
                            value={typed[s.id]?.target ?? (s.target === null ? '' : String(s.target))}
                            onChange={(event) => setTypedField(s.id, 'target', event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="ink-input ink-number"
                            inputMode="numeric"
                            aria-label={`${s.name}: d20`}
                            placeholder="d20"
                            value={typed[s.id]?.roll ?? ''}
                            onChange={(event) => setTypedField(s.id, 'roll', event.target.value)}
                          />
                          {proposal && (
                            <span className="proposal-inline">
                              from player: <strong>{(proposal.payload as unknown as { roll: number }).roll}</strong>{' '}
                              <button
                                className="paper-link"
                                onClick={() => {
                                  setTypedField(s.id, 'roll', String((proposal.payload as unknown as { roll: number }).roll))
                                  void resolveMessage(proposal.id, true)
                                }}
                              >
                                use
                              </button>{' '}
                              <button className="paper-link" onClick={() => void resolveMessage(proposal.id, false)}>
                                decline
                              </button>
                            </span>
                          )}
                        </td>
                        <td className={ok === null ? 'paper-soft' : ok ? 'save-pass' : 'save-fail'}>{ok === null ? '' : ok ? 'saved' : 'failed'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      <div className="chip-row initiative-actions">
        <button className="chip chip-on" disabled={!canApply} onClick={apply}>
          {saving ? (name.trim() ? `Apply to ${affected.length} (${mode === 'negates' ? 'who failed' : 'all'})` : 'Log the saves') : `Apply to ${chosen.length}`}
        </button>
        {needsAmount && name.trim() !== '' && <span className="paper-soft">How many {unit}?</span>}
        {saving && !savesReady && chosen.length > 0 && <span className="paper-soft">Every target needs a save number and a d20.</span>}
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
