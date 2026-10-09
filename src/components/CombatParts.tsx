import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/context'
import { loadMonster, loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { supabase } from '../lib/supabase'
import {
  blankCombatant,
  changeHp,
  characterCombatant,
  monsterCombatants,
  sideLabels,
  statusOf,
  type CombatSettings,
  type Combatant,
  type CombatantKind,
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

// --- Linha de um combatente -------------------------------------------------------------

export function CombatantRow({
  c,
  settings,
  onChange,
  onRemove,
  onOpenMonster,
}: {
  c: Combatant
  settings: CombatSettings
  onChange: (next: Combatant) => void
  onRemove: () => void
  onOpenMonster?: () => void
}) {
  const [amount, setAmount] = useState('')
  const [condition, setCondition] = useState('')
  const [rounds, setRounds] = useState('')
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
  }

  return (
    <li className={`combatant combatant-${status}`}>
      <div className="combatant-top">
        <InkInput className="combatant-name" value={c.name} label="Name" placeholder="Name" onChange={(name) => onChange({ ...c, name })} />
        <span className="combatant-kind">{kindLabels[c.kind]}</span>
        {status !== 'ok' && <span className={`combatant-status combatant-status-${status}`}>{status === 'down' ? 'Down' : 'Dead'}</span>}
        <select className="combatant-side" aria-label="Side" value={c.side} onChange={(event) => onChange({ ...c, side: event.target.value as Side })}>
          {sides.map((s) => (
            <option key={s} value={s}>
              {sideLabels[s]}
            </option>
          ))}
        </select>
        <button className="paper-link" aria-label={`Remove ${c.name}`} title="Remove" onClick={onRemove}>
          ×
        </button>
      </div>

      <div className="combatant-stats">
        <label className="combatant-stat" title={c.acText && c.acText !== String(c.ac) ? `Book: ${c.acText}` : undefined}>
          <span className="paper-label">AC</span>
          <OptionalNumber value={c.ac} label="Armor class" onChange={(ac) => onChange({ ...c, ac })} />
        </label>
        <label className="combatant-stat">
          <span className="paper-label">THAC0</span>
          <OptionalNumber value={c.thac0} label="THAC0" onChange={(thac0) => onChange({ ...c, thac0 })} />
        </label>
        <div className="combatant-stat combatant-hp">
          <span className="paper-label">HP{c.hitDice ? ` · HD ${c.hitDice}` : ''}</span>
          <span className="combatant-hp-line">
            <OptionalNumber className="combatant-hp-now" value={c.hp} label="Current hit points" onChange={(hp) => onChange({ ...c, hp })} />
            <span className="paper-soft">/</span>
            <OptionalNumber value={c.hpMax} label="Maximum hit points" onChange={(hpMax) => onChange({ ...c, hpMax, hp: c.hp ?? hpMax })} />
          </span>
        </div>
        <form
          className="combatant-damage"
          onSubmit={(event) => {
            event.preventDefault()
            apply(-1)
          }}
        >
          <input className="ink-input ink-number" inputMode="numeric" placeholder="±" aria-label="Damage or healing" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <button type="submit" className="chip" disabled={value === null || c.hp === null}>
            Damage
          </button>
          <button type="button" className="chip" disabled={value === null || c.hp === null} onClick={() => apply(1)}>
            Heal
          </button>
        </form>
      </div>

      {(c.attacks || c.damage || c.morale || c.xp !== null || c.monsterID) && (
        <p className="combatant-facts paper-soft">
          {[
            c.attacks && `Attacks ${c.attacks}`,
            c.damage && `Damage ${c.damage}`,
            c.morale && `Morale ${c.morale.text}`,
            c.xp !== null && `${c.xp.toLocaleString('en-US')} XP`,
          ]
            .filter(Boolean)
            .join(' · ')}
          {onOpenMonster && (
            <>
              {' '}
              <button className="paper-link" onClick={onOpenMonster}>
                monster sheet
              </button>
            </>
          )}
        </p>
      )}

      <div className="combatant-conditions">
        {c.conditions.map((cond) => (
          <span key={cond.id} className="chip chip-on condition-chip">
            {cond.name}
            {cond.rounds !== null ? ` · ${cond.rounds} rd` : ''}
            <button className="condition-remove" aria-label={`Remove ${cond.name}`} onClick={() => onChange({ ...c, conditions: c.conditions.filter((x) => x.id !== cond.id) })}>
              ×
            </button>
          </span>
        ))}
        <form
          className="condition-add"
          onSubmit={(event) => {
            event.preventDefault()
            addCondition()
          }}
        >
          <input className="ink-input" placeholder="condition" aria-label="New condition" value={condition} onChange={(event) => setCondition(event.target.value)} />
          <input className="ink-input ink-number" inputMode="numeric" placeholder="rds" aria-label="Rounds" value={rounds} onChange={(event) => setRounds(event.target.value)} />
          <button type="submit" className="chip" disabled={condition.trim() === ''}>
            + Condition
          </button>
        </form>
      </div>

      <InkInput className="combatant-notes" value={c.notes} label="Notes" placeholder="notes" onChange={(notes) => onChange({ ...c, notes })} />
    </li>
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
  const [variants, setVariants] = useState<{ name: string }[]>([])
  const [variant, setVariant] = useState(0)
  const [count, setCount] = useState(1)
  const [side, setSide] = useState<Side>('enemies')
  const [hpMode, setHpMode] = useState(settings.monsterHp)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadMonsterIndex()
      .then(setIndex)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const results = useMemo(() => (index && query.trim() ? filterMonsters(index, { query, collection: null, frequency: null, sort: 'name' }).slice(0, 30) : []), [index, query])

  const pick = (entry: MonsterIndexEntry) => {
    setPicked(entry)
    setVariant(0)
    setVariants([])
    loadMonster(entry)
      .then((m) => setVariants(m.variants.map((v) => ({ name: v.name }))))
      .catch((reason: unknown) => setError(String(reason)))
  }

  const add = async () => {
    if (!picked) return
    setBusy(true)
    try {
      const monster = await loadMonster(picked)
      const v = monster.variants[variant] ?? monster.variants[0]
      const name = monster.variants.length > 1 && v.name ? v.name : monster.name
      onAdd(
        monsterCombatants(
          { name, armorClass: v.combat.armorClass, hitDice: v.combat.hitDice, thac0: v.combat.thac0, xp: v.combat.xp, attacks: v.combat.attacks, damage: v.combat.damage, morale: v.combat.morale },
          { monsterID: monster.id, monsterFile: picked.file },
          count,
          side,
          existingNames,
          hpMode,
        ),
      )
      onClose()
    } catch (reason) {
      setError(String(reason))
    } finally {
      setBusy(false)
    }
  }

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
          {variants.length > 1 && (
            <label className="add-field">
              <span className="paper-label">Variant</span>
              <select value={variant} onChange={(event) => setVariant(Number(event.target.value))}>
                {variants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.name || picked.name}
                  </option>
                ))}
              </select>
            </label>
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
          <button className="chip chip-on" disabled={busy} onClick={() => void add()}>
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
