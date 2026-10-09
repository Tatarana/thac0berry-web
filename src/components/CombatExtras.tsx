import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadTables } from '../data/tables'
import { rollDice } from '../rules/dice'
import {
  defeatedFoes,
  initiativeModifiers,
  sideLabels,
  statusOf,
  xpAward,
  xpMembers,
  xpSummary,
  type CombatSettings,
  type Combatant,
  type Encounter,
  type XpAward,
} from '../rules/combat'
import { attackDamages, attackHits, neededToHit, rollDamage } from '../rules/attack'
import { logByRound, logPlainText, logText } from '../rules/combatLog'
import {
  crowdModifier,
  emptySurpriseSide,
  isSurprised,
  saveCategories,
  saveLevel,
  savePasses,
  savesFor,
  surpriseModifiers,
  surpriseResult,
  surpriseSides,
  surpriseTotal,
  warriorSaveRows,
  type SurpriseSide,
  type SurpriseSideKey,
} from '../rules/surprise'
import type { GrimoireTable } from '../rules/tableIndex'
import { PaperModal } from './DetailBits'

// CT5a do Combat Tracker (docs/controle-de-combate.md): surpresa antes da
// rodada 1, salvamentos de monstro e o XP do fim do encontro. A regra está em
// src/rules/surprise.ts e src/rules/combat.ts.

const d10 = { count: 1, sides: 10, modifier: 0 }
const d20 = { count: 1, sides: 20, modifier: 0 }

/** Uma tabela do Table Grimoire (null enquanto carrega). */
function useTable(id: string) {
  const [table, setTable] = useState<GrimoireTable | null>(null)
  useEffect(() => {
    void loadTables().then((all) => setTable(all.find((t) => t.id === id) ?? null))
  }, [id])
  return table
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0')

// --- Surpresa ----------------------------------------------------------------------------

/** Surpresa (PHB cap. 11, DMG Tabela 57): 1d10 por lado; 1–3 modificado, o lado perde a rodada 1. */
export function SurpriseWindow({ encounter, settings, onChange, onClose }: { encounter: Encounter; settings: CombatSettings; onChange: (next: Encounter) => void; onClose: () => void }) {
  const table = useTable('dmg-57')
  const rows = useMemo(() => table?.rows ?? [], [table])
  const modifiers = useMemo(() => surpriseModifiers(rows), [rows])
  const [sides, setSides] = useState<Record<SurpriseSideKey, SurpriseSide>>({ party: emptySurpriseSide(), enemies: emptySurpriseSide() })
  const standing = (side: SurpriseSideKey) => encounter.combatants.filter((c) => c.side === side && statusOf(c, settings.deathAt) === 'ok').length
  // O modificador de um lado depende do OUTRO lado (a Tabela 57 diz "Other party is:").
  const crowd = (side: SurpriseSideKey) => crowdModifier(rows, standing(side === 'party' ? 'enemies' : 'party'))
  const totals = Object.fromEntries(surpriseSides.map((k) => [k, surpriseTotal(sides[k], modifiers, crowd(k))])) as Record<SurpriseSideKey, number | null>
  const set = (k: SurpriseSideKey, side: SurpriseSide) => setSides({ ...sides, [k]: side })
  const ready = surpriseSides.every((k) => sides[k].immune || totals[k] !== null)

  return createPortal(
    <PaperModal title="Surprise" subtitle="1d10 per side; 1, 2 or 3 (modified) is surprised and loses round 1 (PHB, Chapter 11)" onClose={onClose}>
      {surpriseSides.map((k) => {
        const side = sides[k]
        const c = crowd(k)
        return (
          <section key={k} className="surprise-side">
            <div className="surprise-head">
              <strong>{sideLabels[k]}</strong>
              {k === 'party' ? <span className="paper-soft">players roll</span> : null}
              <input
                className="ink-input ink-number"
                inputMode="numeric"
                placeholder="d10"
                aria-label={`${sideLabels[k]}: surprise d10`}
                disabled={side.immune}
                value={side.roll ?? ''}
                onChange={(event) => set(k, { ...side, roll: /^\d+$/.test(event.target.value.trim()) ? Number(event.target.value.trim()) : null })}
              />
              {k === 'enemies' && (
                <button className="chip" disabled={side.immune} onClick={() => set(k, { ...side, roll: rollDice(d10).total })}>
                  Roll
                </button>
              )}
              <label className="surprise-immune">
                <input type="checkbox" checked={side.immune} onChange={(event) => set(k, { ...side, immune: event.target.checked })} /> can’t be surprised
              </label>
              <span className={isSurprised(side, totals[k]) ? 'surprise-result surprise-yes' : 'surprise-result'}>
                {side.immune ? 'not surprised' : totals[k] === null ? '' : `= ${totals[k]} · ${isSurprised(side, totals[k]) ? 'SURPRISED' : 'not surprised'}`}
              </span>
            </div>
            {!side.immune && (
              <div className="chip-row surprise-mods">
                <span className="paper-label">The other side is:</span>
                {c && <span className="chip chip-on" title="Automatic (Table 57)">{c.label} {signed(c.value)}</span>}
                {modifiers.map((m) => (
                  <button
                    key={m.label}
                    className={side.mods.includes(m.label) ? 'chip chip-on' : 'chip'}
                    onClick={() => set(k, { ...side, mods: side.mods.includes(m.label) ? side.mods.filter((x) => x !== m.label) : [...side.mods, m.label] })}
                  >
                    {m.label} {signed(m.value)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )
      })}
      <div className="chip-row initiative-actions">
        <button
          className="chip chip-on"
          disabled={!ready}
          onClick={() => {
            onChange({ ...encounter, surprise: surpriseResult(totals, sides) })
            onClose()
          }}
        >
          Apply
        </button>
        {encounter.surprise && (
          <button
            className="chip"
            onClick={() => {
              onChange({ ...encounter, surprise: null })
              onClose()
            }}
          >
            Clear surprise
          </button>
        )}
      </div>
      <p className="paper-soft">A surprised side does not act in round 1: it stays out of that round’s initiative. Its first morale check gets −2 (Table 50).</p>
    </PaperModal>,
    document.body,
  )
}

// --- Salvamentos de monstro -------------------------------------------------------------

/** Salvamento do monstro (DMG Tabela 46): como guerreiro do nível igual aos DV. */
export function SaveWindow({ combatant: c, onChange, onLog, onClose }: { combatant: Combatant; onChange: (next: Combatant) => void; onLog: (text: string) => void; onClose: () => void }) {
  const table = useTable('dmg-46')
  const rows = useMemo(() => warriorSaveRows(table?.rows ?? []), [table])
  const categories = table ? saveCategories(table.headers) : []
  const [level, setLevel] = useState<number>(saveLevel(c) ?? 1)
  const [modifier, setModifier] = useState(0)
  const [result, setResult] = useState<{ category: number; roll: number; passes: boolean } | null>(null)
  const saves = savesFor(level, rows)

  const roll = (i: number) => {
    if (!saves) return
    const r = rollDice(d20).total
    const passes = savePasses(r, modifier, saves[i])
    setResult({ category: i, roll: r, passes })
    onLog(`${c.name} saves vs ${categories[i]}: ${r}${modifier !== 0 ? ` ${signed(modifier)}` : ''} vs ${saves[i]} — ${passes ? 'saved' : 'failed'}`)
  }

  return createPortal(
    <PaperModal title={`Saving throw: ${c.name}`} subtitle="Monsters save as warriors of a level equal to their Hit Dice (DMG Table 46)" onClose={onClose}>
      <div className="save-head">
        <label>
          <span className="paper-label">Level</span>
          <input className="ink-input ink-number" inputMode="numeric" aria-label="Save level" value={level} onChange={(event) => /^\d*$/.test(event.target.value) && setLevel(Number(event.target.value || 0))} />
        </label>
        <span className="paper-soft">{c.hitDice ? `HD ${c.hitDice}` : 'no Hit Dice: set the level'}</span>
        <label>
          <span className="paper-label">Modifier</span>
          <input
            className="ink-input ink-number"
            inputMode="numeric"
            aria-label="Save modifier"
            value={modifier === 0 ? '' : String(modifier)}
            placeholder="0"
            onChange={(event) => /^[+-]?\d*$/.test(event.target.value) && setModifier(Number(event.target.value.replace('+', '')) || 0)}
          />
        </label>
      </div>
      {!saves ? (
        <p className="paper-soft">Loading the table…</p>
      ) : (
        <ul className="save-list">
          {categories.map((name, i) => (
            <li key={name}>
              <span className="save-name">{name}</span>
              <span className="save-target">{saves[i]}</span>
              <button className="chip" onClick={() => roll(i)} aria-label={`Roll ${name}`}>
                Roll
              </button>
              {result?.category === i && (
                <span className={result.passes ? 'save-pass' : 'save-fail'} role="status">
                  {result.roll}
                  {modifier !== 0 ? ` ${signed(modifier)}` : ''} → {result.passes ? 'saved' : 'failed'}
                  {!result.passes && (
                    <button
                      className="cg-link"
                      title="Add as a condition"
                      onClick={() => onChange({ ...c, conditions: [...c.conditions, { id: crypto.randomUUID().toUpperCase(), name: `Failed save: ${name.split(/[ ,]/)[0]}`, rounds: null }] })}
                    >
                      + condition
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="paper-soft">A d20 roll plus the modifier equal to or above the number saves.</p>
    </PaperModal>,
    document.body,
  )
}

// --- XP no fim -----------------------------------------------------------------------------

/** Resumo do fim: inimigos vencidos e quem divide o XP (DMG cap. 8); confirmar encerra. */
export function EndEncounterWindow({ encounter, settings, onEnd, onClose }: { encounter: Encounter; settings: CombatSettings; onEnd: (award: XpAward) => void; onClose: () => void }) {
  const foesAll = encounter.combatants.filter((c) => c.side !== 'party')
  const party = encounter.combatants.filter((c) => c.side === 'party')
  const [foes, setFoes] = useState(() => new Set(defeatedFoes(encounter, settings.deathAt).map((c) => c.id)))
  const [members, setMembers] = useState(() => new Set(xpMembers(encounter, settings.deathAt).map((c) => c.id)))
  const [copied, setCopied] = useState(false)
  const award = xpAward(
    foesAll.filter((c) => foes.has(c.id)),
    party.filter((c) => members.has(c.id)),
  )
  const toggle = (set: Set<string>, id: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    apply(next)
  }
  const copy = () => {
    void navigator.clipboard?.writeText(xpSummary(encounter.name, award, encounter.combatants)).then(() => setCopied(true))
  }
  const status = (c: Combatant) => {
    const s = statusOf(c, settings.deathAt)
    const flag = c.conditions.find((x) => /^(fleeing|surrendered)$/i.test(x.name))?.name
    return [s === 'dead' ? 'dead' : s === 'down' ? 'down' : null, flag?.toLowerCase()].filter(Boolean).join(', ')
  }

  return createPortal(
    <PaperModal title={`End “${encounter.name}”`} subtitle="Group experience: foes overcome, shared equally (DMG, Chapter 8)" onClose={onClose}>
      <div className="xp-cols">
        <section>
          <span className="paper-label">Foes overcome</span>
          {foesAll.length === 0 && <p className="paper-soft">No foes in this encounter.</p>}
          <ul className="xp-list">
            {foesAll.map((c) => (
              <li key={c.id}>
                <label>
                  <input type="checkbox" checked={foes.has(c.id)} onChange={() => toggle(foes, c.id, setFoes)} /> {c.name}
                  <span className="paper-soft"> {[status(c), c.xp !== null ? `${c.xp.toLocaleString('en-US')} XP` : 'no XP'].filter(Boolean).join(' · ')}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <span className="paper-label">Shares</span>
          <ul className="xp-list">
            {party.map((c) => (
              <li key={c.id}>
                <label>
                  <input type="checkbox" checked={members.has(c.id)} onChange={() => toggle(members, c.id, setMembers)} /> {c.name}
                  <span className="paper-soft"> {[c.kind === 'npc' ? 'NPC' : 'PC', status(c)].filter(Boolean).join(' · ')}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="xp-total">
        Total <strong>{award.total.toLocaleString('en-US')} XP</strong> · {award.shares} share{award.shares === 1 ? '' : 's'} · <strong>{award.each.toLocaleString('en-US')} XP each</strong>
      </p>
      <p className="paper-soft">Only foes that were a real threat give experience; defeat, surrender and rout all count as victory.</p>
      <div className="chip-row initiative-actions">
        <button className="chip" onClick={copy}>
          {copied ? 'Copied' : 'Copy summary'}
        </button>
      </div>
      <button className="add-go" onClick={() => onEnd(award)}>
        End encounter
      </button>
    </PaperModal>,
    document.body,
  )
}

// --- "Acerta?" ------------------------------------------------------------------------------

/**
 * Ataque (DMG cap. 9): d20 + modificadores contra THAC0 − CA do alvo; 20
 * natural sempre acerta, 1 sempre erra. Acertou: rola o dano de um dos
 * ataques do monstro e aplica no alvo. Tudo vai para o log.
 */
export function AttackWindow({
  attacker: a,
  encounter,
  settings,
  onDamage,
  onLog,
  onClose,
}: {
  attacker: Combatant
  encounter: Encounter
  settings: CombatSettings
  onDamage: (targetID: string, amount: number) => void
  onLog: (text: string) => void
  onClose: () => void
}) {
  const table = useTable('dmg-35')
  const modifiers = useMemo(() => initiativeModifiers(table?.rows ?? []), [table])
  const foes = encounter.combatants.filter((c) => c.side !== a.side && statusOf(c, settings.deathAt) !== 'dead')
  const [targetID, setTargetID] = useState(() => (foes.find((c) => statusOf(c, settings.deathAt) === 'ok') ?? foes[0])?.id ?? '')
  const target = encounter.combatants.find((c) => c.id === targetID) ?? null
  const [thac0, setThac0] = useState<number | null>(a.thac0)
  const [acEdit, setAcEdit] = useState<number | null | undefined>(undefined)
  const ac = acEdit === undefined ? (target?.ac ?? null) : acEdit
  const [mods, setMods] = useState<string[]>([])
  const [extra, setExtra] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<{ roll: number; hit: boolean } | null>(null)
  const [damage, setDamage] = useState<{ amount: number; text: string } | null>(null)
  const [applied, setApplied] = useState(false)
  const modifier = extra + mods.reduce((sum, label) => sum + (modifiers.find((m) => m.label === label)?.value ?? 0), 0)
  const needed = thac0 !== null && ac !== null ? neededToHit(thac0, ac) : null
  const attacks = attackDamages(a.damage)

  const check = (roll: number) => {
    if (needed === null || !target) return
    const hit = attackHits(roll, modifier, needed)
    setResult({ roll, hit })
    setDamage(null)
    setApplied(false)
    const natural = roll >= 20 ? ' (natural 20)' : roll <= 1 ? ' (natural 1)' : ''
    onLog(`${a.name} attacks ${target.name}: d20 ${roll}${modifier !== 0 ? ` ${signed(modifier)}` : ''} vs ${needed}${natural} — ${hit ? 'hit' : 'miss'}`)
  }
  const typedRoll = /^\d+$/.test(typed.trim()) ? Number(typed.trim()) : null

  return createPortal(
    <PaperModal title={`Attack: ${a.name}`} subtitle="d20 + modifiers ≥ THAC0 − target AC; a natural 20 always hits, a natural 1 always misses (DMG, Chapter 9)" onClose={onClose}>
      <div className="attack-setup">
        <label>
          <span className="paper-label">Target</span>
          <select
            aria-label="Target"
            value={targetID}
            onChange={(event) => {
              setTargetID(event.target.value)
              setAcEdit(undefined)
              setResult(null)
            }}
          >
            {foes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {statusOf(c, settings.deathAt) === 'down' ? ' (down)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="paper-label">THAC0</span>
          <input className="ink-input ink-number" inputMode="numeric" aria-label="Attacker THAC0" value={thac0 ?? ''} onChange={(event) => setThac0(/^\d+$/.test(event.target.value) ? Number(event.target.value) : null)} />
        </label>
        <label>
          <span className="paper-label">Target AC</span>
          <input
            className="ink-input ink-number"
            inputMode="numeric"
            aria-label="Target AC"
            value={ac ?? ''}
            onChange={(event) => setAcEdit(/^-?\d+$/.test(event.target.value) ? Number(event.target.value) : null)}
          />
        </label>
        <label>
          <span className="paper-label">Other</span>
          <input
            className="ink-input ink-number"
            inputMode="numeric"
            aria-label="Other modifier"
            placeholder="0"
            value={extra === 0 ? '' : String(extra)}
            onChange={(event) => /^[+-]?\d*$/.test(event.target.value) && setExtra(Number(event.target.value.replace('+', '')) || 0)}
          />
        </label>
      </div>
      {modifiers.length > 0 && (
        <div className="chip-row attack-mods">
          {modifiers.map((m) => (
            <button key={m.label} className={mods.includes(m.label) ? 'chip chip-on' : 'chip'} onClick={() => setMods(mods.includes(m.label) ? mods.filter((x) => x !== m.label) : [...mods, m.label])}>
              {m.label} {signed(m.value)}
            </button>
          ))}
        </div>
      )}
      <p className="morale-target">
        {needed === null ? 'Set the THAC0 and the target’s AC.' : (
          <>
            Needs <strong>{needed - modifier}</strong> or more on the d20{modifier !== 0 ? ` (${needed} ${signed(-modifier)})` : ''}.
          </>
        )}
      </p>
      <form
        className="chip-row morale-roll"
        onSubmit={(event) => {
          event.preventDefault()
          if (typedRoll !== null) check(typedRoll)
          setTyped('')
        }}
      >
        <button type="button" className="chip chip-on" disabled={needed === null || !target} onClick={() => check(rollDice(d20).total)}>
          Roll d20
        </button>
        <span className="paper-soft">or</span>
        <input className="ink-input ink-number" inputMode="numeric" placeholder="d20" aria-label="Attack roll" value={typed} onChange={(event) => setTyped(event.target.value)} />
        <button type="submit" className="chip" disabled={needed === null || typedRoll === null}>
          Check
        </button>
      </form>
      {result && target && (
        <div className={result.hit ? 'morale-result morale-holds' : 'morale-result morale-fails'} role="status">
          <strong>
            {result.hit ? 'Hit' : 'Miss'} — rolled {result.roll}
            {modifier !== 0 ? ` ${signed(modifier)}` : ''}
            {result.roll >= 20 ? ' (natural 20)' : result.roll <= 1 ? ' (natural 1)' : ''}.
          </strong>
          {result.hit && (
            <div className="attack-damage">
              {attacks.length > 0 && (
                <span className="chip-row">
                  {attacks.map((d, i) => (
                    <button
                      key={i}
                      className="chip"
                      disabled={rollDamage(d) === null}
                      title={rollDamage(d) === null ? 'No dice to roll: type the damage' : `Roll ${d.text}`}
                      onClick={() => {
                        setDamage({ amount: rollDamage(d) ?? 0, text: d.text })
                        setApplied(false)
                      }}
                    >
                      Damage {d.text}
                    </button>
                  ))}
                </span>
              )}
              <label className="attack-typed">
                <span className="paper-soft">or type</span>
                <input
                  className="ink-input ink-number"
                  inputMode="numeric"
                  aria-label="Damage"
                  value={damage?.amount ?? ''}
                  onChange={(event) => {
                    setDamage(/^\d+$/.test(event.target.value) ? { amount: Number(event.target.value), text: 'typed' } : null)
                    setApplied(false)
                  }}
                />
              </label>
              {damage && (
                <button
                  className="chip chip-on"
                  disabled={applied || target.hp === null}
                  onClick={() => {
                    onDamage(target.id, damage.amount)
                    setApplied(true)
                  }}
                >
                  {applied ? `Applied ${damage.amount} to ${target.name}` : `Apply ${damage.amount} damage to ${target.name}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </PaperModal>,
    document.body,
  )
}

// --- Log do combate ----------------------------------------------------------------------

/** O log do encontro, rodada a rodada (a mais recente em cima), com cópia em texto. */
export function LogWindow({ encounter, onClose }: { encounter: Encounter; onClose: () => void }) {
  const log = encounter.log ?? []
  const [copied, setCopied] = useState(false)
  return createPortal(
    <PaperModal title="Combat log" subtitle={encounter.name} onClose={onClose}>
      {log.length === 0 ? (
        <p className="paper-soft">Nothing yet: damage, healing, conditions, morale, attacks, saves and rounds show up here as they happen.</p>
      ) : (
        <>
          <button className="chip" onClick={() => void navigator.clipboard?.writeText(`${encounter.name}\n${logPlainText(log)}`).then(() => setCopied(true))}>
            {copied ? 'Copied' : 'Copy log'}
          </button>
          {logByRound(log).map((g, i) => (
            <section key={`${g.round}-${i}`} className="log-round">
              <span className="paper-label">{g.round > 0 ? `Round ${g.round}` : 'Before the fight'}</span>
              <ul className="log-list">
                {g.entries.map((entry) => (
                  <li key={entry.id}>{logText(entry)}</li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </PaperModal>,
    document.body,
  )
}
