import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/context'
import { loadMonster, loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { supabase } from '../lib/supabase'
import {
  blankCombatant,
  changeHp,
  characterCombatant,
  hitDiceChoices,
  hitPointDice,
  monsterCombatants,
  monsterSetup,
  parseHitDice,
  rerollHp,
  sideLabels,
  statusOf,
  type CombatSettings,
  type Combatant,
  type CombatantKind,
  type MonsterSetup,
  type MonsterStats,
  type Side,
} from '../rules/combat'
import { filterMonsters, xpLabel } from '../rules/monsters'
import type { PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import { InkInput } from './SheetBits'

// Peças do Combat Tracker (docs/controle-de-combate.md): a linha de cada
// combatente e as janelas de adicionar e de configurações. A regra fica em
// src/rules/combat.ts.

const sides: Side[] = ['party', 'enemies', 'others']
const kindLabels: Record<CombatantKind, string> = { pc: 'PC', npc: 'NPC', monster: 'Monster' }

/** Campo de número que aceita vazio (null) — CA, THAC0 e PV podem ficar em branco. */
function OptionalNumber({ value, onChange, label, className }: { value: number | null; onChange: (v: number | null) => void; label: string; className?: string }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <input
      className={className ? `ink-input ink-number ${className}` : 'ink-input ink-number'}
      inputMode="numeric"
      aria-label={label}
      placeholder="—"
      value={text ?? (value === null ? '' : String(value))}
      onFocus={() => setText(value === null ? '' : String(value))}
      onBlur={() => setText(null)}
      onChange={(event) => {
        const next = event.target.value.trim()
        setText(next)
        if (next === '') onChange(null)
        else if (/^[+-]?\d+$/.test(next)) onChange(Number(next))
      }}
    />
  )
}

// --- Tabela dos combatentes (estilo planilha) -------------------------------------------

/**
 * Os combatentes numa tabela compacta (pedido do usuário, 2026-10-09: "estilo
 * excel", cabendo na largura): uma linha por combatente, os lados como faixas.
 * No celular a tabela rola de lado dentro do quadro.
 */
export function CombatTable({
  combatants,
  settings,
  acting,
  initiative,
  onChange,
  onRemove,
  onOpenMonster,
  onMorale,
}: {
  combatants: Combatant[]
  settings: CombatSettings
  /** Quem age no passo atual da iniciativa (CT2). */
  acting: Set<string>
  /** Coluna INIT: total e vez de cada combatente na ordem da rodada. */
  initiative: Record<string, { score: number; place: number }>
  onChange: (next: Combatant) => void
  onRemove: (id: string) => void
  /** Ficha do monstro (quando o índice já carregou). */
  onOpenMonster: (c: Combatant) => (() => void) | undefined
  /** Abre o teste de moral (CT3; nunca para PCs). */
  onMorale: (c: Combatant) => void
}) {
  const [legend, setLegend] = useState(false)
  return (
    <div className="combat-grid-wrap">
      <table className="combat-grid">
        <thead>
          <tr>
            <th className="cg-name" title={columnHelp.name}>
              Name{' '}
              <button className="rule-link cg-legend" aria-label="What each column means" title="What each column means" onClick={() => setLegend(true)}>
                ?
              </button>
            </th>
            <th title={columnHelp.init}>Init</th>
            <th title={columnHelp.ac}>AC</th>
            <th title={columnHelp.thac0}>THAC0</th>
            <th className="cg-hp" title={columnHelp.hp}>
              HP
            </th>
            <th title={columnHelp.damage}>±</th>
            <th title={columnHelp.morale}>Mor.</th>
            <th className="cg-attacks" title={columnHelp.attacks}>
              Atk · Dmg
            </th>
            <th className="cg-conditions" title={columnHelp.conditions}>
              Conditions
            </th>
            <th className="cg-notes" title={columnHelp.notes}>
              Notes
            </th>
            <th aria-label="Remove" />
          </tr>
        </thead>
        {sides.map((side) => {
          const list = combatants.filter((c) => c.side === side)
          if (list.length === 0) return null
          const standing = list.filter((c) => statusOf(c, settings.deathAt) === 'ok').length
          return (
            <tbody key={side}>
              <tr className="cg-band">
                <th colSpan={11}>
                  {sideLabels[side]} <span className="cg-band-count">· {standing} of {list.length} standing</span>
                </th>
              </tr>
              {list.map((c) => (
                <CombatRow key={c.id} c={c} settings={settings} acting={acting.has(c.id)} init={initiative[c.id]} onChange={onChange} onRemove={() => onRemove(c.id)} onOpenMonster={onOpenMonster(c)} onMorale={() => onMorale(c)} />
              ))}
            </tbody>
          )
        })}
      </table>
      {legend && <ColumnLegend onClose={() => setLegend(false)} />}
    </div>
  )
}

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`

/** O que cada coluna é (tooltip no computador; no iPad, a legenda do "?"). */
const columnHelp = {
  name: 'Name. Tap a monster to open its sheet; ✎ renames or moves to another side.',
  init: 'Initiative: the modified d10 (the side total, when rolling by side). Lowest acts first; ties act together. Empty for those down or dead.',
  ac: 'Armor Class. Hover (or see the monster sheet) for the book text when it lists more than one.',
  thac0: 'To Hit Armor Class 0: the d20 roll needed to hit AC 0 (subtract the target AC).',
  hp: 'Hit points: current / maximum. Down at 0; dead at the value set in settings. 🎲 rolls a monster’s Hit Dice again (damage taken is kept).',
  damage: 'Type an amount, then − (or Enter) for damage or + to heal (never above the maximum).',
  morale: 'Morale rating. Tap it to make a morale check (2d10, DMG Tables 49 and 50); ✓/✗ is the last result. PCs never check morale.',
  attacks: 'Attacks per round × damage, from the monster sheet.',
  conditions: 'Conditions with rounds left (they count down at the end of each round). + adds one.',
  notes: 'Free notes for this combatant.',
}

function ColumnLegend({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['Name', columnHelp.name],
    ['Init', columnHelp.init],
    ['AC', columnHelp.ac],
    ['THAC0', columnHelp.thac0],
    ['HP', columnHelp.hp],
    ['±', columnHelp.damage],
    ['Mor.', columnHelp.morale],
    ['Atk · Dmg', columnHelp.attacks],
    ['Conditions', columnHelp.conditions],
    ['Notes', columnHelp.notes],
    ['×', 'Remove the combatant from the encounter.'],
    ['▶', 'Acting now, in the initiative order of the round.'],
  ]
  return createPortal(
    <PaperModal title="Columns" subtitle="Combat Tracker" onClose={onClose}>
      <dl className="cg-legend-list">
        {rows.map(([term, text]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p className="paper-soft">Rows are grouped by side. Red rows are down; faded, struck-through rows are dead.</p>
    </PaperModal>,
    document.body,
  )
}

function CombatRow({
  c,
  settings,
  acting,
  init,
  onChange,
  onRemove,
  onOpenMonster,
  onMorale,
}: {
  c: Combatant
  settings: CombatSettings
  acting: boolean
  init?: { score: number; place: number }
  onChange: (next: Combatant) => void
  onRemove: () => void
  onOpenMonster?: () => void
  onMorale: () => void
}) {
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [condition, setCondition] = useState('')
  const [rounds, setRounds] = useState('')
  const [editing, setEditing] = useState(false)
  const status = statusOf(c, settings.deathAt)
  const value = /^\d+$/.test(amount.trim()) ? Number(amount.trim()) : null
  const apply = (sign: 1 | -1) => {
    if (value === null) return
    onChange(changeHp(c, sign * value))
    setAmount('')
  }
  const addCondition = () => {
    const name = condition.trim()
    if (name === '') return
    const r = /^\d+$/.test(rounds.trim()) ? Number(rounds.trim()) : null
    onChange({ ...c, conditions: [...c.conditions, { id: crypto.randomUUID().toUpperCase(), name, rounds: r && r > 0 ? r : null }] })
    setCondition('')
    setRounds('')
    setAdding(false)
  }
  const attacks = [c.attacks && `${c.attacks}×`, c.damage].filter(Boolean).join(' ')
  const last = c.lastMorale
  const hpDice = hitPointDice(c.hitDice)

  return (
    <tr className={[`cg-row cg-${status}`, acting ? 'cg-acting' : ''].filter(Boolean).join(' ')}>
      <td className="cg-name">
        <span className="cg-name-line">
          {acting && <span className="cg-acting-mark" title="Acting now">▶</span>}
          {editing ? (
            <form
              className="cg-edit"
              onSubmit={(event) => {
                event.preventDefault()
                setEditing(false)
              }}
            >
              <input className="ink-input" autoFocus value={c.name} aria-label={`${c.name}: name`} placeholder="Name" onChange={(event) => onChange({ ...c, name: event.target.value })} />
              <select className="cg-side" aria-label={`${c.name}: side`} value={c.side} onChange={(event) => onChange({ ...c, side: event.target.value as Side })}>
                {sides.map((x) => (
                  <option key={x} value={x}>
                    {sideLabels[x]}
                  </option>
                ))}
              </select>
              <button type="submit" className="cg-btn" aria-label="Done">
                ✓
              </button>
            </form>
          ) : (
            <>
              {onOpenMonster ? (
                <button className="cg-name-text cg-name-link" onClick={onOpenMonster} title="Open the monster sheet">
                  {c.name || 'Unnamed'}
                </button>
              ) : (
                <span className="cg-name-text">{c.name || 'Unnamed'}</span>
              )}
              <button className="cg-link cg-edit-btn" aria-label={`Edit ${c.name}`} title="Rename or change side" onClick={() => setEditing(true)}>
                ✎
              </button>
            </>
          )}
        </span>
        <span className="cg-sub">
          {kindLabels[c.kind]}
          {c.hitDice ? ` · HD ${c.hitDice}` : ''}
          {c.xp !== null ? ` · ${c.xp.toLocaleString('en-US')} XP` : ''}
          {status !== 'ok' && <strong className="cg-status"> · {status === 'down' ? 'Down' : 'Dead'}</strong>}
        </span>
      </td>
      <td className="cg-init" title={init ? `Acts ${ordinal(init.place)}` : undefined}>
        {init ? init.score : status === 'ok' ? '—' : ''}
      </td>
      <td title={c.acText && c.acText !== String(c.ac) ? `Book: ${c.acText}` : undefined}>
        <OptionalNumber value={c.ac} label={`${c.name}: armor class`} onChange={(ac) => onChange({ ...c, ac })} />
      </td>
      <td>
        <OptionalNumber value={c.thac0} label={`${c.name}: THAC0`} onChange={(thac0) => onChange({ ...c, thac0 })} />
      </td>
      <td className="cg-hp">
        <OptionalNumber className="cg-hp-now" value={c.hp} label={`${c.name}: current hit points`} onChange={(hp) => onChange({ ...c, hp })} />
        <span className="cg-slash">/</span>
        <OptionalNumber value={c.hpMax} label={`${c.name}: maximum hit points`} onChange={(hpMax) => onChange({ ...c, hpMax, hp: c.hp ?? hpMax })} />
        {c.kind === 'monster' && hpDice && (
          <button className="cg-link cg-reroll" aria-label={`${c.name}: roll hit points`} title={`Roll ${hpDice} (damage taken is kept)`} onClick={() => onChange(rerollHp(c))}>
            🎲
          </button>
        )}
      </td>
      <td>
        <form
          className="cg-damage"
          onSubmit={(event) => {
            event.preventDefault()
            apply(-1)
          }}
        >
          <input className="ink-input ink-number" inputMode="numeric" placeholder="±" aria-label={`${c.name}: damage or healing`} value={amount} onChange={(event) => setAmount(event.target.value)} />
          <button type="submit" className="cg-btn" title="Damage" aria-label={`${c.name}: damage`} disabled={value === null || c.hp === null}>
            −
          </button>
          <button type="button" className="cg-btn" title="Heal" aria-label={`${c.name}: heal`} disabled={value === null || c.hp === null} onClick={() => apply(1)}>
            +
          </button>
        </form>
      </td>
      <td className="cg-morale">
        {c.kind !== 'pc' && (
          <button
            className="cg-morale-btn"
            aria-label={`${c.name}: morale check`}
            title={[c.morale?.text ?? 'No morale rating', last && `Last check (round ${last.round}): ${last.roll} vs ${last.target}, ${last.holds ? 'held' : 'failed'}`, 'Click to check morale'].filter(Boolean).join(' · ')}
            onClick={onMorale}
          >
            {c.morale ? (c.morale.low === c.morale.high ? c.morale.low : `${c.morale.low}-${c.morale.high}`) : '—'}
            {last && <span className={last.holds ? 'cg-morale-held' : 'cg-morale-failed'}>{last.holds ? ' ✓' : ' ✗'}</span>}
          </button>
        )}
      </td>
      <td className="cg-attacks cg-text" title={attacks}>
        {attacks || '—'}
      </td>
      <td className="cg-conditions">
        {c.conditions.map((cond) => (
          <span key={cond.id} className="cg-cond">
            {cond.name}
            {cond.rounds !== null ? ` ${cond.rounds}` : ''}
            <button className="cg-link" aria-label={`Remove ${cond.name}`} onClick={() => onChange({ ...c, conditions: c.conditions.filter((x) => x.id !== cond.id) })}>
              ×
            </button>
          </span>
        ))}
        {adding ? (
          <form
            className="cg-cond-add"
            onSubmit={(event) => {
              event.preventDefault()
              addCondition()
            }}
          >
            <input className="ink-input" autoFocus placeholder="condition" aria-label={`${c.name}: new condition`} value={condition} onChange={(event) => setCondition(event.target.value)} />
            <input className="ink-input ink-number" inputMode="numeric" placeholder="rds" aria-label={`${c.name}: rounds`} value={rounds} onChange={(event) => setRounds(event.target.value)} />
            <button type="submit" className="cg-btn" disabled={condition.trim() === ''} aria-label="Add condition">
              ✓
            </button>
            <button type="button" className="cg-link" onClick={() => setAdding(false)} aria-label="Cancel">
              ×
            </button>
          </form>
        ) : (
          <button className="cg-btn" title="Add a condition" aria-label={`${c.name}: add condition`} onClick={() => setAdding(true)}>
            +
          </button>
        )}
      </td>
      <td className="cg-notes">
        <input className="ink-input" value={c.notes} aria-label={`${c.name}: notes`} placeholder="—" onChange={(event) => onChange({ ...c, notes: event.target.value })} />
      </td>
      <td>
        <button className="cg-link" aria-label={`Remove ${c.name}`} title="Remove" onClick={onRemove}>
          ×
        </button>
      </td>
    </tr>
  )
}

// --- Adicionar monstro do catálogo ------------------------------------------------------

export function AddMonsterWindow({
  existingNames,
  settings,
  onAdd,
  onClose,
}: {
  existingNames: string[]
  settings: CombatSettings
  onAdd: (list: Combatant[]) => void
  onClose: () => void
}) {
  const [index, setIndex] = useState<MonsterIndexEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<MonsterIndexEntry | null>(null)
  const [monster, setMonster] = useState<Awaited<ReturnType<typeof loadMonster>> | null>(null)
  const [variant, setVariantIndex] = useState(0)
  // Conferência do DM (item 3 do retorno de 2026-10-09): undefined = valor lido da ficha.
  const [hitDice, setHitDice] = useState<string | undefined>(undefined)
  const [acEdit, setAcEdit] = useState<number | null | undefined>(undefined)
  const [thac0Edit, setThac0Edit] = useState<number | null | undefined>(undefined)
  const [hpEach, setHpEach] = useState<number | null>(null)
  const [count, setCount] = useState(1)
  const [side, setSide] = useState<Side>('enemies')
  const [hpMode, setHpMode] = useState(settings.monsterHp)

  useEffect(() => {
    loadMonsterIndex()
      .then(setIndex)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const results = useMemo(() => (index && query.trim() ? filterMonsters(index, { query, collection: null, frequency: null, sort: 'name' }).slice(0, 30) : []), [index, query])

  const setVariant = (index: number) => {
    setVariantIndex(index)
    setHitDice(undefined)
    setAcEdit(undefined)
    setThac0Edit(undefined)
    setHpEach(null)
  }

  const pick = (entry: MonsterIndexEntry) => {
    setPicked(entry)
    setMonster(null)
    setVariant(0)
    loadMonster(entry)
      .then(setMonster)
      .catch((reason: unknown) => setError(String(reason)))
  }

  const v = monster ? (monster.variants[variant] ?? monster.variants[0]) : null
  const stats: MonsterStats | null =
    monster && v
      ? {
          name: monster.variants.length > 1 && v.name ? v.name : monster.name,
          armorClass: v.combat.armorClass,
          hitDice: v.combat.hitDice,
          thac0: v.combat.thac0,
          xp: v.combat.xp,
          attacks: v.combat.attacks,
          damage: v.combat.damage,
          morale: v.combat.morale,
        }
      : null
  const read = stats ? monsterSetup(stats, hitDice) : null
  const choices = hitDiceChoices(stats?.hitDice?.text)
  const hpFromDice = read ? parseHitDice(read.hitDice) !== null : false
  const setup: MonsterSetup | null = read
    ? { ac: acEdit === undefined ? read.ac : acEdit, thac0: thac0Edit === undefined ? read.thac0 : thac0Edit, hitDice: read.hitDice, hp: hpFromDice ? null : hpEach }
    : null

  const add = () => {
    if (!picked || !monster || !stats || !setup) return
    onAdd(monsterCombatants(stats, { monsterID: monster.id, monsterFile: picked.file }, count, side, existingNames, hpMode, undefined, setup))
    onClose()
  }
  const book = (text: string | undefined) => (text ? <span className="paper-soft add-book">book: {text.split('\n').join(' · ')}</span> : null)

  return createPortal(
    <PaperModal title="Add monsters" subtitle="From the monster catalog" onClose={onClose}>
      {error && <p className="paper-soft save-error">{error}</p>}
      {!picked ? (
        <>
          <input className="paper-search" type="search" autoFocus placeholder="monster name" aria-label="Search monsters" value={query} onChange={(event) => setQuery(event.target.value)} />
          {!index && !error && <p className="paper-soft">Loading monsters…</p>}
          <ul className="monster-list">
            {results.map((m) => (
              <li key={m.id}>
                <button className="spell-row kit-row" onClick={() => pick(m)}>
                  <span className="kit-row-top">
                    <span className="spell-name">{m.name}</span>
                    <span className="spell-meta">{[m.hitDice ? `HD ${m.hitDice.split('\n')[0]}` : null, xpLabel(m) ? `${xpLabel(m)} XP` : null].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="kit-summary">{m.collection}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="add-monster">
          <p>
            <strong>{picked.name}</strong>{' '}
            <button className="paper-link" onClick={() => setPicked(null)}>
              change
            </button>
          </p>
          {!monster && !error && <p className="paper-soft">Loading…</p>}
          {monster && monster.variants.length > 1 && (
            <label className="add-field">
              <span className="paper-label">Variant</span>
              <select value={variant} onChange={(event) => setVariant(Number(event.target.value))}>
                {monster.variants.map((x, i) => (
                  <option key={i} value={i}>
                    {x.name || picked.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {setup && stats && (
            <div className="add-stats">
              <label className="add-stat">
                <span className="paper-label">AC</span>
                <OptionalNumber value={setup.ac} label="Monster armor class" onChange={setAcEdit} />
                {stats.armorClass?.text !== String(setup.ac) && book(stats.armorClass?.text)}
              </label>
              <label className="add-stat">
                <span className="paper-label">Hit Dice</span>
                {choices.length > 0 ? (
                  <select
                    aria-label="Monster hit dice"
                    value={setup.hitDice}
                    onChange={(event) => {
                      setHitDice(event.target.value)
                      setThac0Edit(undefined)
                    }}
                  >
                    {choices.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{setup.hitDice || '—'}</span>
                )}
                {choices.length > 0 && book(stats.hitDice?.text)}
              </label>
              <label className="add-stat">
                <span className="paper-label">THAC0</span>
                <OptionalNumber value={setup.thac0} label="Monster THAC0" onChange={setThac0Edit} />
                {stats.thac0?.text !== String(setup.thac0) && book(stats.thac0?.text)}
              </label>
              {!hpFromDice && (
                <label className="add-stat">
                  <span className="paper-label">HP each</span>
                  <OptionalNumber value={hpEach} label="Monster hit points" onChange={setHpEach} />
                  <span className="paper-soft add-book">the Hit Dice give no hit points: type them, or leave blank</span>
                </label>
              )}
            </div>
          )}
          <label className="add-field">
            <span className="paper-label">How many</span>
            <input className="ink-input ink-number" type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} />
          </label>
          <div className="add-field">
            <span className="paper-label">Side</span>
            <div className="chip-row">
              {sides.map((s) => (
                <button key={s} className={side === s ? 'chip chip-on' : 'chip'} onClick={() => setSide(s)}>
                  {sideLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="add-field">
            <span className="paper-label">Hit points</span>
            <div className="chip-row">
              <button className={hpMode === 'roll' ? 'chip chip-on' : 'chip'} onClick={() => setHpMode('roll')}>
                Roll the Hit Dice
              </button>
              <button className={hpMode === 'average' ? 'chip chip-on' : 'chip'} onClick={() => setHpMode('average')}>
                Average
              </button>
            </div>
          </div>
          <button className="chip chip-on" disabled={!setup} onClick={add}>
            Add {count > 1 ? `${count} ${picked.name}` : picked.name}
          </button>
        </div>
      )}
    </PaperModal>,
    document.body,
  )
}

// --- Adicionar PC ou NPC ------------------------------------------------------------------

interface CampaignOption {
  id: string
  name: string
}

/**
 * PCs: os personagens da campanha que a conta consegue ler (hoje, os da
 * própria conta; com a Fase 2 do backend, os dos jogadores também) e, à mão,
 * quem joga sem o App. NPCs: só à mão.
 */
export function AddPersonWindow({
  kind,
  campaignID,
  onCampaign,
  alreadyIn,
  onAdd,
  onClose,
}: {
  kind: 'pc' | 'npc'
  campaignID: string | null
  onCampaign: (id: string | null) => void
  /** Personagens do App que já estão no encontro. */
  alreadyIn: string[]
  onAdd: (list: Combatant[]) => void
  onClose: () => void
}) {
  const { session } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignOption[] | null>(null)
  const [characters, setCharacters] = useState<{ id: string; data: PlayerCharacter }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(() => blankCombatant(kind, kind === 'pc' ? 'party' : 'enemies'))
  const [moraleText, setMoraleText] = useState('')

  useEffect(() => {
    if (kind !== 'pc' || !session) return
    let cancelled = false
    void supabase
      .from('campaign')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')
      .then(({ data, error: e }) => {
        if (cancelled) return
        if (e) setError(e.message)
        else setCampaigns((data as CampaignOption[]) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [kind, session])

  useEffect(() => {
    if (kind !== 'pc' || !session || !campaignID) return
    let cancelled = false
    void supabase
      .from('character')
      .select('id, data')
      .eq('campaign_id', campaignID)
      .is('deleted_at', null)
      .then(({ data, error: e }) => {
        if (cancelled) return
        if (e) setError(e.message)
        else setCharacters((data as { id: string; data: PlayerCharacter }[]) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [kind, session, campaignID])

  const addManual = () => {
    const name = form.name.trim()
    if (name === '') return
    const morale = /\d/.test(moraleText) ? moraleText.trim() : ''
    const match = /(\d+)(?:\s*[-–]\s*(\d+))?/.exec(morale)
    onAdd([
      {
        ...form,
        id: crypto.randomUUID().toUpperCase(),
        name,
        hp: form.hp ?? form.hpMax,
        morale: match ? { text: morale, low: Number(match[1]), high: Number(match[2] ?? match[1]) } : null,
      },
    ])
    setForm(blankCombatant(kind, form.side))
    setMoraleText('')
  }

  const fromApp = (characters ?? []).filter((c) => !alreadyIn.includes(c.id))

  return createPortal(
    <PaperModal title={kind === 'pc' ? 'Add player characters' : 'Add an NPC'} onClose={onClose}>
      {error && <p className="paper-soft save-error">{error}</p>}
      {kind === 'pc' && (
        <section className="add-section">
          <span className="paper-label">From the App</span>
          {!session ? (
            <p className="paper-soft">Sign in to bring in the campaign's characters.</p>
          ) : (
            <>
              <select className="add-campaign" aria-label="Campaign" value={campaignID ?? ''} onChange={(event) => onCampaign(event.target.value || null)}>
                <option value="">Choose a campaign…</option>
                {(campaigns ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || 'Unnamed Campaign'}
                  </option>
                ))}
              </select>
              {campaignID && characters && fromApp.length === 0 && <p className="paper-soft">No other characters of this campaign that you can see.</p>}
              <ul className="add-list">
                {fromApp.map(({ id, data }) => (
                  <li key={id}>
                    <button className="chip" onClick={() => onAdd([characterCombatant(id, data)])}>
                      + {data.name || 'Unnamed Character'} · AC {data.armorClass} · HP {data.hitPointsCurrent}/{data.hitPointsMax}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="paper-soft add-note">
                Only characters this account can open show up here. Players' own characters will appear once the DM can read them (backend phase 2).
              </p>
            </>
          )}
        </section>
      )}

      <section className="add-section">
        <span className="paper-label">{kind === 'pc' ? 'Player without the App' : 'NPC'}</span>
        <form
          className="add-manual"
          onSubmit={(event) => {
            event.preventDefault()
            addManual()
          }}
        >
          <InkInput value={form.name} label="Name" placeholder="name" onChange={(name) => setForm({ ...form, name })} />
          <label className="add-field">
            <span className="paper-label">AC</span>
            <OptionalNumber value={form.ac} label="Armor class" onChange={(ac) => setForm({ ...form, ac })} />
          </label>
          <label className="add-field">
            <span className="paper-label">HP</span>
            <OptionalNumber value={form.hpMax} label="Hit points" onChange={(hpMax) => setForm({ ...form, hpMax, hp: hpMax })} />
          </label>
          <label className="add-field">
            <span className="paper-label">THAC0</span>
            <OptionalNumber value={form.thac0} label="THAC0" onChange={(thac0) => setForm({ ...form, thac0 })} />
          </label>
          {kind === 'npc' && (
            <label className="add-field">
              <span className="paper-label">Morale</span>
              <InkInput value={moraleText} label="Morale" placeholder="e.g. 12" onChange={setMoraleText} />
            </label>
          )}
          <button type="submit" className="chip chip-on" disabled={form.name.trim() === ''}>
            Add
          </button>
        </form>
      </section>
    </PaperModal>,
    document.body,
  )
}

// --- Configurações do DM ------------------------------------------------------------------

export function CombatSettingsWindow({ settings, onChange, onClose }: { settings: CombatSettings; onChange: (s: CombatSettings) => void; onClose: () => void }) {
  const choice = <K extends keyof CombatSettings>(key: K, options: { value: CombatSettings[K]; label: string }[]) => (
    <div className="chip-row">
      {options.map((o) => (
        <button key={String(o.value)} className={settings[key] === o.value ? 'chip chip-on' : 'chip'} onClick={() => onChange({ ...settings, [key]: o.value })}>
          {o.label}
        </button>
      ))}
    </div>
  )
  return createPortal(
    <PaperModal title="Combat settings" subtitle="Your defaults on this device" onClose={onClose}>
      <section className="add-section">
        <span className="paper-label">Initiative</span>
        {choice('initiative', [
          { value: 'side', label: 'By side (DMG standard)' },
          { value: 'individual', label: 'Individual (DMG optional)' },
        ])}
      </section>
      <section className="add-section">
        <span className="paper-label">Monster hit points</span>
        {choice('monsterHp', [
          { value: 'roll', label: 'Roll the Hit Dice' },
          { value: 'average', label: 'Average' },
        ])}
      </section>
      <section className="add-section">
        <span className="paper-label">Death</span>
        {choice('deathAt', [
          { value: -10, label: 'At −10 hp (DMG optional)' },
          { value: 0, label: 'At 0 hp' },
        ])}
      </section>
    </PaperModal>,
    document.body,
  )
}
