import type { ReactNode } from 'react'

// Peças comuns das páginas da ficha oficial (caixinhas com moldura fina,
// rótulo impresso e valor à caneta, como os FormCell/FormSectionTitle do iPad).

export function Cell({ label, value }: { label?: string; value: ReactNode }) {
  return (
    <div className="rec-cell">
      {label && <span className="rec-cell-label">{label}</span>}
      <span className="rec-value">{value}</span>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="rec-title">{children}</h2>
}

export function HeaderLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rec-header-line">
      <span className="rec-value rec-header-value">{children}</span>
      <span className="rec-cell-label">{label}</span>
    </div>
  )
}

/** Texto longo à caneta (personalidade, histórico, habilidades raciais). */
export function TextBox({ label, text }: { label: string; text: string | null | undefined }) {
  return (
    <div className="rec-textbox">
      <span className="rec-cell-label rec-left-label">{label}</span>
      <p className="rec-value rec-long">{text?.trim() ? text : '—'}</p>
    </div>
  )
}
