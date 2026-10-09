import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadTables } from '../data/tables'
import { rollDice } from '../rules/dice'
import {
  defeatedFoes,
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
export function SaveWindow({ combatant: c, onChange, onClose }: { combatant: Combatant; onChange: (next: Combatant) => void; onClose: () => void }) {
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
    setResult({ category: i, roll: r, passes: savePasses(r, modifier, saves[i]) })
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
