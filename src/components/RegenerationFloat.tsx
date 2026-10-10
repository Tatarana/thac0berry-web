import { useEffect, useRef, useState } from 'react'
import { activeRegenerations, logBankedHeal } from '../rules/effects'
import type { PlayerCharacter } from '../types/library'
import { TallyBoard } from './SheetBits'

type Edit = (mutate: (c: PlayerCharacter) => void) => void

// Janela flutuante da regeneração (ajuste 4, 2026-10-10): quando um Banked Heal
// dispara (dano registrado ou "Activate now" nos efeitos), a ficha mostra o
// contador da cura por rodada, em qualquer página. Dá para minimizar; uma
// regeneração nova reabre; some quando a cura acaba.
export function RegenerationFloat({ c, edit }: { c: PlayerCharacter; edit: Edit }) {
  const regens = activeRegenerations(c)
  const [minimized, setMinimized] = useState(false)
  const known = useRef(new Set<string>())

  // Regeneração que acabou de disparar reabre a janela.
  const keys = regens.map((r) => r.componentID)
  const keySignature = keys.join('|')
  useEffect(() => {
    const fresh = keys.some((k) => !known.current.has(k))
    known.current = new Set(keys)
    if (fresh) setMinimized(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySignature])

  if (regens.length === 0) return null

  if (minimized) {
    return (
      <button className="regen-pill" onClick={() => setMinimized(false)} aria-label="Show regeneration">
        ✚ {regens.map((r) => `${r.used}/${r.max}`).join(' · ')} HP
      </button>
    )
  }

  return (
    <aside className="regen-float" role="status" aria-label="Regeneration">
      <div className="regen-head">
        <span className="regen-title">✚ Regenerating</span>
        <button className="paper-link" onClick={() => setMinimized(true)} aria-label="Minimize regeneration">
          minimize
        </button>
      </div>
      {regens.map((r) => (
        <div key={r.componentID} className="regen-row">
          <span className="rec-value">{r.name}</span>
          <span className="rec-soft">1 HP per round — mark each round&apos;s point (it also raises Current HP).</span>
          <span className="regen-tally">
            <TallyBoard
              count={r.used}
              max={r.max}
              exhausted={false}
              label={`${r.name} HP healed`}
              onChange={(n) => edit((x) => logBankedHeal(x, r.effectID, r.componentID, n > r.used ? 1 : -1))}
            />
            <span className="rec-soft">
              {r.used} of {r.max} HP healed
            </span>
          </span>
        </div>
      ))}
      <p className="rec-soft regen-hp">
        Hit points: {c.hitPointsCurrent}/{c.hitPointsMax}
      </p>
    </aside>
  )
}
