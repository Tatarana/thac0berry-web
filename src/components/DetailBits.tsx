import { useEffect, type ReactNode } from 'react'

// Peças comuns das fichas de detalhe (modal em papel).

export function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="detail-field">
      <span className="paper-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

export function TextBlock({ label, text }: { label: string; text?: string | null }) {
  if (!text) return null
  return (
    <div className="detail-field">
      <span className="paper-label">{label}</span>
      <p className="detail-description">{text}</p>
    </div>
  )
}

export function PaperModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="paper-sheet modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="detail-header">
          <div>
            <h2 className="paper-title">{title}</h2>
            {subtitle && <p className="paper-soft">{subtitle}</p>}
          </div>
          <button className="paper-link" onClick={onClose}>close</button>
        </div>
        <hr className="paper-rule" />
        {children}
      </div>
    </div>
  )
}
