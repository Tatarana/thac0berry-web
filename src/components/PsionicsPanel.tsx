import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadData } from '../data/load'
import { normalize } from '../lib/search'
import { activeSessionID } from '../lib/sessions'
import { supabase } from '../lib/supabase'
import { abilityEffect, abilityStats } from '../rules/effects'
import { classLevels, isMultiClass, levelOf } from '../rules/multiclass'
import { defenseModes, disciplines, initialCost, powerCounts, progression, psionicXP, pspMax, pspMaximum } from '../rules/psionics'
import { primeRequisites } from '../rules/sessionReport'
import { isoNow } from '../rules/spellSheets'
import type { PlayerCharacter, Psionics, PsionicPowerEntry, PsionicUse } from '../types/library'
import { PaperModal } from './DetailBits'
import type { Edit } from './RecordSheet'
import { InkNumber, InkPicker, SheetBlock } from './SheetBits'

// Aba Psionics do Psionicist (Complete Psionics Handbook, cap. 1), feita
// primeiro na web (2026-10-06): PSPs (máximo pela Tabela 5, com ajuste à mão,
// e atuais), "Use power" (registra os PSPs gastos), disciplinas, ciências e
// devoções do compêndio com os limites da Tabela 4, modos de defesa, e o
// relatório da sessão com o XP sugerido (10 XP por PSP, Tabela 3).

interface PowerData {
  id: string
  title: string
  discipline: string
  powerTier: string
  pspCost: { initial: string; summary: string }
}

const newID = () => crypto.randomUUID().toUpperCase()
const emptyPsionics = (): Psionics => ({ pspMaxOverride: null, pspCurrent: null, primaryDiscipline: null, disciplines: [], powers: [], defenseModes: [], uses: [] })
const abilityShort: Record<string, string> = { constitution: 'CON', wisdom: 'WIS' }

/** Escolher poderes do compêndio, só das disciplinas que o personagem tem. */
function PowerPicker({
  powers,
  owned,
  known,
  onChoose,
  onClose,
}: {
  powers: PowerData[]
  owned: string[]
  known: Set<string>
  onChoose: (power: PowerData) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => {
    const target = normalize(query)
    return powers
      .filter((p) => owned.includes(p.discipline) && (p.powerTier === 'Science' || p.powerTier === 'Devotion') && !known.has(p.id))
      .filter((p) => target === '' || normalize(p.title).includes(target))
      .sort((a, b) => a.discipline.localeCompare(b.discipline) || b.powerTier.localeCompare(a.powerTier) || a.title.localeCompare(b.title))
  }, [powers, owned, known, query])
  return createPortal(
    <PaperModal title="Add a power" subtitle={`From your disciplines: ${owned.join(', ') || 'none yet'}`} onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input className="ink-input" value={query} placeholder="power name" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="slot-choices">
        {list.map((p) => (
          <li key={p.id}>
            <button className="slot-choice" onClick={() => onChoose(p)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">{p.title}</span>
              <span className="rec-soft">
                {p.discipline} · {p.powerTier} · {p.pspCost.summary}
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="paper-soft">{owned.length === 0 ? 'Choose a discipline first.' : 'No power matches.'}</li>}
      </ul>
    </PaperModal>,
    document.body,
  )
}

/** Relatório da sessão do psionicista: PSPs gastos e o XP sugerido. */
function PsionicReport({ c, sessionID, onClose }: { c: PlayerCharacter; sessionID: string | null; onClose: () => void }) {
  const [session, setSession] = useState<{ title: string; date: string } | null>(null)
  useEffect(() => {
    if (!sessionID) return
    let cancelled = false
    void supabase
      .from('session')
      .select('title, date')
      .eq('id', sessionID)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSession(data as { title: string; date: string } | null)
      })
    return () => {
      cancelled = true
    }
  }, [sessionID])
  const same = (id: string | null | undefined) => (id ?? null)?.toUpperCase() === (sessionID ?? null)?.toUpperCase()
  const uses = (c.psionics?.uses ?? []).filter((u) => same(u.sessionID))
  const byPower = new Map<string, number>()
  for (const u of uses) byPower.set(u.power || 'unnamed power', (byPower.get(u.power || 'unnamed power') ?? 0) + u.psp)
  const { psp, xp } = psionicXP(uses)
  const prime = primeRequisites.Psionicist
  const base = Object.fromEntries(abilityStats.map((a) => [a, abilityEffect(c, a)?.normal ?? c.abilities[a]])) as Record<string, number>
  const applies = prime.every((a) => base[a] >= 16)
  const bonus = applies ? Math.floor(xp / 10) : 0
  const date = session ? new Date(session.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const name = sessionID ? (session ? (session.title ? `${session.title} · ${date}` : date) : '…') : 'Uses without a session'
  return createPortal(
    <PaperModal title="Session Report" subtitle={`${c.name || 'Unnamed character'} · ${name}`} onClose={onClose}>
      <section className="report-character">
        <div className="rec-cell-label">Psionic Strength Points spent</div>
        {byPower.size === 0 ? (
          <p className="paper-soft">No psionic power used in this session yet.</p>
        ) : (
          <ul className="report-charges">
            {[...byPower.entries()].sort(([, a], [, b]) => b - a).map(([power, spent]) => (
              <li key={power}>
                <span>{power}</span>
                <span className="report-charge-count">{spent} PSP</span>
              </li>
            ))}
          </ul>
        )}
        <div className="rec-cell-label">Experience (suggested)</div>
        <ul className="report-charges report-xp">
          <li>
            <span>
              Powers used <span className="paper-soft">({psp} PSP × 10 XP)</span>
            </span>
            <span className="report-charge-count">{xp.toLocaleString('en-US')} XP</span>
          </li>
          <li>
            <span>
              Prime requisite bonus{' '}
              <span className="paper-soft">
                ({prime.map((a) => `${abilityShort[a]} ${base[a]}`).join(', ')}; +10% needs 16+{applies ? '' : ', not met'})
              </span>
            </span>
            <span className="report-charge-count">{bonus.toLocaleString('en-US')} XP</span>
          </li>
          <li className="report-xp-total">
            <span>Total</span>
            <span className="report-charge-count">{(xp + bonus).toLocaleString('en-US')} XP</span>
          </li>
          {isMultiClass(c) && (
            // Multiclasse (MC3c): o XP é dividido igualmente entre as classes (PHB).
            <li>
              <span>
                Each class <span className="paper-soft">(divided equally between {classLevels(c).length})</span>
              </span>
              <span className="report-charge-count">{Math.floor((xp + bonus) / classLevels(c).length).toLocaleString('en-US')} XP</span>
            </li>
          )}
        </ul>
        <p className="paper-soft report-xp-note">
          CPsiH Table 3, optional and up to the DM: 10 XP per PSP for a power used to overcome a foe or problem (the rate used here), 15 XP per
          PSP to avoid combat, nothing for trivial uses. Defeating a psionic opponent (100 XP per level) and creating psionic items are not
          tracked. Add the XP to the sheet yourself.
        </p>
      </section>
    </PaperModal>,
    document.body,
  )
}

export function PsionicsPanel({ c, edit, campaignID }: { c: PlayerCharacter; edit: Edit; campaignID: string | null }) {
  const [powers, setPowers] = useState<PowerData[] | null>(null)
  const [picking, setPicking] = useState(false)
  const [reportSession, setReportSession] = useState<string | null | undefined>(undefined)
  const [usePower, setUsePower] = useState('')
  const [usePSP, setUsePSP] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadData<PowerData[]>('psionic-powers.json').then(setPowers)
  }, [])

  const p = c.psionics ?? emptyPsionics()
  const owned = p.disciplines ?? []
  const known = p.powers ?? []
  // Multiclasse: tudo pelo nível de Psionicist (a principal pode ser outra classe).
  const level = levelOf(c, 'Psionicist') ?? c.level
  const limits = progression(level)
  const counts = powerCounts(known)
  const calculated = pspMaximum(level, c.abilities)
  const max = pspMax(p, calculated)
  const current = p.pspCurrent ?? max ?? 0

  /** Muda o bloco psiônico (criando-o se ainda não existe). */
  const change = (mutate: (x: Psionics) => void) =>
    edit((x) => {
      const next = { ...emptyPsionics(), ...(x.psionics ?? {}) }
      mutate(next)
      x.psionics = next
    })

  const toggleDiscipline = (d: string) =>
    change((x) => {
      const set = new Set(x.disciplines ?? [])
      if (set.has(d)) {
        set.delete(d)
        if (x.primaryDiscipline === d) x.primaryDiscipline = null
      } else {
        set.add(d)
        x.primaryDiscipline ??= d
      }
      x.disciplines = disciplines.filter((k) => set.has(k))
    })

  const toggleMode = (m: string) =>
    change((x) => {
      const set = new Set(x.defenseModes ?? [])
      if (set.has(m)) set.delete(m)
      else set.add(m)
      x.defenseModes = defenseModes.filter((k) => set.has(k))
    })

  const addPower = (power: PowerData) => {
    setPicking(false)
    const entry: PsionicPowerEntry = { id: newID(), powerID: power.id, name: power.title, discipline: power.discipline, tier: power.powerTier }
    change((x) => void (x.powers = [...(x.powers ?? []), entry]))
  }

  const costOf = (name: string) => {
    const entry = known.find((k) => k.name === name)
    const data = powers?.find((d) => d.id === entry?.powerID)
    // Telepatia costuma dizer "contact" no custo inicial; o número fica no resumo ("6+/3+").
    return initialCost(data?.pspCost.initial) ?? initialCost(data?.pspCost.summary) ?? 0
  }

  async function registerUse() {
    if (usePSP <= 0) return
    setBusy(true)
    setError(null)
    try {
      // Na sessão ativa da campanha (a mesma regra das folhas de magia).
      const sessionID = campaignID ? await activeSessionID(campaignID) : null
      const use: PsionicUse = { id: newID(), date: isoNow(), sessionID, power: usePower, psp: usePSP }
      change((x) => {
        x.uses = [...(x.uses ?? []), use]
        x.pspCurrent = Math.max(0, (x.pspCurrent ?? max ?? 0) - usePSP)
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const recent = [...(p.uses ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  const lastSession = recent[0]?.sessionID ?? null
  const over = (n: number, limit: number) => (n > limit ? ' psi-over' : '')

  return (
    <div className="psionics">
      <h2 className="paper-title">Psionics</h2>
      {error && <p className="paper-soft save-error">{error}</p>}

      <SheetBlock title="Psionic Strength Points" trailing="CPsiH Tables 5 & 6">
        <div className="psi-psp">
          <label className="psi-field">
            <span className="rec-cell-label">Maximum</span>
            <InkNumber
              value={max ?? 0}
              min={0}
              max={999}
              label="Maximum PSPs"
              onChange={(v) => change((x) => void (x.pspMaxOverride = v === calculated ? null : v))}
            />
            <span className="rec-soft">
              {calculated === null
                ? 'Table 5 covers ability scores 15–18 only: write the maximum by hand.'
                : p.pspMaxOverride != null
                  ? `by hand (Table 5 gives ${calculated})`
                  : 'from Table 5'}
            </span>
          </label>
          <div className="psi-field">
            <span className="rec-cell-label">Current</span>
            <span className="counter">
              <button className="counter-btn" aria-label="One PSP less" disabled={current <= 0} onClick={() => change((x) => void (x.pspCurrent = Math.max(0, current - 1)))}>
                −
              </button>
              <InkNumber value={current} min={0} max={999} label="Current PSPs" onChange={(v) => change((x) => void (x.pspCurrent = v))} />
              <button className="counter-btn" aria-label="One PSP more" onClick={() => change((x) => void (x.pspCurrent = current + 1))}>
                +
              </button>
            </span>
            <button className="paper-link" onClick={() => change((x) => void (x.pspCurrent = null))}>
              rest to full
            </button>
          </div>
        </div>
        <p className="rec-soft psi-note">
          Recovery per hour without spending PSPs: hard exertion none · walking or riding 3 · sitting or reading 6 · sleeping or Rejuvenation 12.
        </p>
      </SheetBlock>

      <SheetBlock title="Use a Power" trailing="records the PSPs spent">
        <div className="psi-use">
          <InkPicker
            value={usePower}
            label="Power used"
            options={[{ value: '', label: 'choose a power…' }, ...known.map((k) => ({ value: k.name, label: k.name, hint: k.tier ?? undefined }))]}
            onChange={(v) => {
              setUsePower(v)
              setUsePSP(costOf(v))
            }}
          />
          <label className="psi-field">
            <span className="rec-cell-label">PSP</span>
            <InkNumber value={usePSP} min={0} max={999} label="PSPs spent" onChange={setUsePSP} />
          </label>
          <button className="consequence-apply" disabled={busy || usePSP <= 0} onClick={() => void registerUse()}>
            Use
          </button>
          <button className="paper-link" onClick={() => setReportSession(lastSession)}>
            session report
          </button>
        </div>
        {recent.length > 0 && (
          <ul className="psi-uses">
            {recent.map((u) => (
              <li key={u.id}>
                <span>{new Date(u.date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>{u.power || 'unnamed power'}</span>
                <span className="report-charge-count">{u.psp} PSP</span>
                <button className="paper-link" aria-label="Remove this use" onClick={() => change((x) => void (x.uses = (x.uses ?? []).filter((y) => y.id !== u.id)))}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetBlock>

      <SheetBlock title="Disciplines" trailing={`${owned.length} of ${limits.disciplines} at level ${level} (Table 4)`}>
        <div className="chip-row">
          {disciplines.map((d) => (
            <span key={d} className="psi-discipline">
              <button className={owned.includes(d) ? 'chip chip-on' : 'chip'} aria-pressed={owned.includes(d)} onClick={() => toggleDiscipline(d)}>
                {d}
              </button>
              {owned.includes(d) && (
                <button
                  className={p.primaryDiscipline === d ? 'psi-primary psi-primary-on' : 'psi-primary'}
                  title="Primary discipline"
                  aria-label={`Make ${d} the primary discipline`}
                  onClick={() => change((x) => void (x.primaryDiscipline = d))}
                >
                  ★
                </button>
              )}
            </span>
          ))}
        </div>
        {owned.length > limits.disciplines && <p className="paper-soft psi-over">More disciplines than Table 4 allows at this level.</p>}
      </SheetBlock>

      <SheetBlock
        title="Powers"
        trailing={`sciences ${counts.sciences}/${limits.sciences} · devotions ${counts.devotions}/${limits.devotions}`}
      >
        {known.length === 0 && <p className="rec-soft">No powers yet.</p>}
        {owned.map((d) => {
          const list = known.filter((k) => k.discipline === d)
          if (list.length === 0) return null
          return (
            <div key={d} className="psi-power-group">
              <div className="rec-cell-label">{d}</div>
              <ul className="psi-powers">
                {list.map((k) => (
                  <li key={k.id}>
                    <span className="rec-value">{k.name}</span>
                    <span className="rec-soft">{k.tier}</span>
                    <button className="paper-link" aria-label={`Remove ${k.name}`} onClick={() => change((x) => void (x.powers = (x.powers ?? []).filter((y) => y.id !== k.id)))}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        <p className={`rec-soft${over(counts.sciences, limits.sciences)}${over(counts.devotions, limits.devotions)}`}>
          {counts.sciences > limits.sciences || counts.devotions > limits.devotions ? 'More powers than Table 4 allows at this level. ' : ''}
        </p>
        <button className="paper-link" disabled={!powers} onClick={() => setPicking(true)}>
          + add power
        </button>
      </SheetBlock>

      <SheetBlock title="Defense Modes" trailing={`${(p.defenseModes ?? []).length} of ${limits.defenseModes} (do not count as powers)`}>
        <div className="chip-row">
          {defenseModes.map((m) => (
            <button key={m} className={(p.defenseModes ?? []).includes(m) ? 'chip chip-on' : 'chip'} aria-pressed={(p.defenseModes ?? []).includes(m)} onClick={() => toggleMode(m)}>
              {m}
            </button>
          ))}
        </div>
        {(p.defenseModes ?? []).length > limits.defenseModes && <p className="paper-soft psi-over">More defense modes than Table 4 allows at this level.</p>}
      </SheetBlock>

      {picking && powers && <PowerPicker powers={powers} owned={owned} known={new Set(known.map((k) => k.powerID ?? ''))} onChoose={addPower} onClose={() => setPicking(false)} />}
      {reportSession !== undefined && <PsionicReport c={c} sessionID={reportSession} onClose={() => setReportSession(undefined)} />}
    </div>
  )
}
