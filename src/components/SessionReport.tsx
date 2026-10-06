import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SessionRow } from '../lib/campaignSessions'
import { supabase } from '../lib/supabase'
import { barFraction, itemCharges, spellBars } from '../rules/sessionReport'
import type { SpellSheet } from '../types/library'
import { PaperModal } from './DetailBits'

// Relatório da sessão (SessionReportView do iPad), só leitura: para cada
// personagem com dias de magia nesta sessão, as magias por círculo (e Turn
// Undead) num gráfico de barras e as cargas gastas de itens mágicos, somadas
// nos dias da sessão. Bom para passar um resumo ao grupo depois da mesa.

interface CharacterDays {
  id: string
  name: string
  sheets: SpellSheet[]
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function CharacterReport({ person }: { person: CharacterDays }) {
  const bars = spellBars(person.sheets)
  const charges = itemCharges(person.sheets)
  const max = Math.max(0, ...bars.map((b) => b.count))
  return (
    <section className="report-character">
      <h3 className="report-name">
        {person.name} <span className="paper-soft">— {plural(person.sheets.length, 'day', 'days')}</span>
      </h3>
      <div className="rec-cell-label">Spells &amp; Turn Undead</div>
      {bars.length === 0 ? (
        <p className="paper-soft">Nothing cast or attempted in this session yet.</p>
      ) : (
        <div className="report-bars">
          {bars.map((bar) => (
            <div key={bar.id} className="report-bar-row">
              <span className="report-bar-label">{bar.label}</span>
              <span className="report-bar-track">
                <span
                  className={bar.kind === 'turnUndead' ? 'report-bar report-bar-turn' : 'report-bar'}
                  style={{ width: `max(${barFraction(bar.count, max) * 100}%, 3px)` }}
                />
              </span>
              <span className="report-bar-count">{bar.count}</span>
            </div>
          ))}
        </div>
      )}
      <div className="rec-cell-label">Magic Item Charges</div>
      {charges.length === 0 ? (
        <p className="paper-soft">No magic item charges used in this session.</p>
      ) : (
        <ul className="report-charges">
          {charges.map((c) => (
            <li key={`${c.itemName}|${c.spellName}`}>
              <span>
                {c.itemName} — {c.spellName}
              </span>
              <span className="report-charge-count">{plural(c.used, 'charge', 'charges')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function SessionReport({ session, onClose }: { session: SessionRow; onClose: () => void }) {
  const [people, setPeople] = useState<CharacterDays[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const days = await supabase.from('spell_sheet').select('character_id, data').eq('session_id', session.id).is('deleted_at', null)
      if (days.error) return setError(days.error.message)
      const rows = days.data as { character_id: string; data: SpellSheet }[]
      const ids = [...new Set(rows.map((r) => r.character_id))]
      const names = ids.length
        ? await supabase.from('character').select('id, name').in('id', ids)
        : { data: [], error: null }
      if (names.error) return setError(names.error.message)
      if (cancelled) return
      const nameOf = new Map((names.data as { id: string; name: string | null }[]).map((c) => [c.id, c.name || 'Unnamed character']))
      setPeople(
        ids
          .map((id) => ({
            id,
            name: nameOf.get(id) ?? 'Unnamed character',
            sheets: rows.filter((r) => r.character_id === id).map((r) => r.data),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [session.id])

  const date = new Date(session.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const subtitle = session.title ? `${session.title} · ${date}` : date

  return createPortal(
    <PaperModal title="Session Report" subtitle={subtitle} onClose={onClose}>
      {error && <p className="paper-soft save-error">Could not load the report: {error}</p>}
      {!error && people === null && <p className="paper-soft">Loading the report…</p>}
      {people !== null && people.length === 0 && <p className="paper-soft">No spell days in this session yet.</p>}
      {(people ?? []).map((person) => (
        <CharacterReport key={person.id} person={person} />
      ))}
    </PaperModal>,
    document.body,
  )
}
