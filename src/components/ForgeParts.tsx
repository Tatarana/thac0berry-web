import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { loadRulesIndex, type RuleIndexEntry } from '../data/rules'
import { BookCode } from './BookCode'
import { RuleDetail } from './RuleDetail'

// Peças repetidas em todas as etapas do The Forge (protótipo: Trail.dc.html /
// Footer.dc.html). Regra de design 4 do docs/criacao-de-personagem.md: uma
// peça só, igual em toda etapa — nunca reestilizar por etapa.

/** Rodapé Back / Next. Sem `onBack`, o Back aparece apagado (primeira etapa). */
export function ForgeFooter({ onBack, onNext, nextLabel, ready }: { onBack?: () => void; onNext: () => void; nextLabel: string; ready: boolean }) {
  return (
    <div className="forge-foot">
      <button type="button" className="forge-ghost-button" disabled={!onBack} onClick={onBack}>
        ← Back
      </button>
      <button type="button" className={ready ? 'forge-next-button forge-next-ready' : 'forge-next-button'} disabled={!ready} onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  )
}

const emberSpots = [
  { left: '12%', delay: '0s' },
  { left: '24%', delay: '1.4s' },
  { left: '40%', delay: '0.6s' },
  { left: '58%', delay: '2.2s' },
  { left: '72%', delay: '0.2s' },
  { left: '85%', delay: '1.8s' },
  { left: '66%', delay: '3s' },
  { left: '30%', delay: '2.6s' },
]

/** Brasas subindo atrás da etapa (o pai precisa ser `.forge-hero`). */
export function ForgeEmbers() {
  return (
    <div className="forge-embers" aria-hidden="true">
      {emberSpots.map((spot) => (
        <span key={spot.left} className="forge-ember" style={{ left: spot.left, animationDelay: spot.delay }} />
      ))}
    </div>
  )
}

/** O "?" ao lado do título da etapa; abre/fecha a `ForgeHelpNote`. */
export function ForgeHelpButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="forge-help-button" aria-expanded={open} aria-label="Help" onClick={onToggle}>
      ?
    </button>
  )
}

/** Explicação da etapa; com `ruleID`, acrescenta o link para a regra do livro. */
export function ForgeHelpNote({ ruleID, children }: { ruleID?: string; children: ReactNode }) {
  const [entry, setEntry] = useState<RuleIndexEntry | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (!ruleID) return
    let cancelled = false
    loadRulesIndex()
      .then((index) => !cancelled && setEntry(index.find((r) => r.id === ruleID) ?? null))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ruleID])

  return (
    <div className="forge-help-note">
      {children}
      {entry && (
        <>
          {' '}
          <button type="button" className="forge-help-rule" onClick={() => setReading(true)}>
            Read the rule: <BookCode id={entry.book} />, {entry.topic}
          </button>
        </>
      )}
      {reading && entry && createPortal(<RuleDetail entry={entry} onClose={() => setReading(false)} />, document.body)}
    </div>
  )
}
