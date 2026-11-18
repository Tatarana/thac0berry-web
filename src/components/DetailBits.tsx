import { useEffect, type ReactNode } from 'react'
import { splitTextTables } from '../rules/textTables'
import { RuleTableView } from './RuleTableView'
import { ReadingScaleButton } from './ReadingScaleControl'
import { useReadableWindow } from '../lib/useReadableWindow'

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
      <TextWithTables text={text} />
    </div>
  )
}

/** Texto longo com as tabelas em markdown desenhadas como tabelas (rolam na horizontal dentro do próprio quadro). */
export function TextWithTables({ text }: { text: string }) {
  return (
    <>
      {splitTextTables(text).map((part, index) =>
        part.kind === 'table' ? <RuleTableView key={index} table={part.table} /> : <p key={index} className="detail-description">{part.text}</p>,
      )}
    </>
  )
}

export function PaperModal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  readable = false,
}: {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Janela grande (editores com muitos campos). */
  wide?: boolean
  /** Janela de leitura (fichas de detalhe): ganha o botão "Aa" e a escala do texto. Editores e formulários não. */
  readable?: boolean
}) {
  const { backdropRef, style } = useReadableWindow(readable)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div ref={backdropRef} className="modal-backdrop" style={style} data-reading-window={readable ? '' : undefined} onClick={onClose}>
      <div
        className={['paper-sheet modal-sheet', wide && 'modal-wide', readable && 'reading-window'].filter(Boolean).join(' ')}
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
          {readable ? (
            <div className="detail-actions">
              <ReadingScaleButton />
              <button className="paper-link" onClick={onClose}>close</button>
            </div>
          ) : (
            <button className="paper-link" onClick={onClose}>close</button>
          )}
        </div>
        <hr className="paper-rule" />
        {readable ? <div className="reading-area">{children}</div> : children}
      </div>
    </div>
  )
}
