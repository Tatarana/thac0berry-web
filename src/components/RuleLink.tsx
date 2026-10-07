import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { loadRulesIndex, type RuleIndexEntry } from '../data/rules'
import { PaperModal } from './DetailBits'
import { RuleDetail } from './RuleDetail'

// Atalho "?" (RuleLinkButton do iPad): círculo pequeno ao lado de um rótulo da
// ficha que abre a regra direto, sem passar pelo Compêndio. Sem `children`,
// abre a regra do livro; com `children`, abre uma janela com a explicação do
// app e, embaixo, o link para a regra. Se a regra não existe no índice e não há
// explicação, o botão não aparece (como no iPad).
export function RuleLink({ ruleID, title, children }: { ruleID: string; title?: string; children?: ReactNode }) {
  const [entry, setEntry] = useState<RuleIndexEntry | null | undefined>(undefined)
  const [open, setOpen] = useState<'explain' | 'rule' | null>(null)

  useEffect(() => {
    let cancelled = false
    loadRulesIndex()
      .then((index) => !cancelled && setEntry(index.find((r) => r.id === ruleID) ?? null))
      .catch(() => !cancelled && setEntry(null))
    return () => {
      cancelled = true
    }
  }, [ruleID])

  if (!children && !entry) return null
  const label = title ?? entry?.topic ?? 'Rule'
  return (
    <>
      <button
        type="button"
        className="rule-link"
        aria-label={`Rule: ${label}`}
        title={label}
        onClick={() => setOpen(children ? 'explain' : 'rule')}
      >
        ?
      </button>
      {open === 'explain' &&
        createPortal(
          <PaperModal title={label} subtitle={entry ? `${entry.book} · ${entry.topic}` : undefined} onClose={() => setOpen(null)}>
            {children}
            {entry && (
              <p>
                <button className="paper-link" onClick={() => setOpen('rule')}>
                  Read the rule: {entry.book}, {entry.topic}
                </button>
              </p>
            )}
          </PaperModal>,
          document.body,
        )}
      {open === 'rule' && entry && createPortal(<RuleDetail entry={entry} onClose={() => setOpen(null)} />, document.body)}
    </>
  )
}
