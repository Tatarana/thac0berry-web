import { useEffect, useRef, useState } from 'react'
import { canStepReading, readingPercentLabel } from '../rules/readingScale'
import { resetReadingScale, stepReadingScale, useReadingIndex } from '../lib/readingScale'

/** A− / percentual / A+ / Reset: o mesmo controle no popover das janelas e nos Settings. */
export function ReadingScaleStepper({ buttonClass }: { buttonClass: string }) {
  const index = useReadingIndex()
  return (
    <div className="reading-stepper" role="group" aria-label="Text size">
      <button type="button" className={buttonClass} aria-label="Smaller text" disabled={!canStepReading(index, -1)} onClick={() => stepReadingScale(-1)}>
        A−
      </button>
      <span className="reading-percent" aria-live="polite">
        {readingPercentLabel(index)}
      </span>
      <button type="button" className={buttonClass} aria-label="Larger text" disabled={!canStepReading(index, 1)} onClick={() => stepReadingScale(1)}>
        A+
      </button>
      <button type="button" className={buttonClass} aria-label="Reset text size" onClick={resetReadingScale}>
        Reset
      </button>
    </div>
  )
}

/** Botão "Aa" do cabeçalho das janelas de leitura, com o popover de tamanho. */
export function ReadingScaleButton() {
  // Posição do popover (fixa na tela, medida quando abre).
  const [open, setOpen] = useState<{ top: number; right: number } | null>(null)
  const wrap = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(null)
    }
    // Captura + stopImmediatePropagation: Esc fecha só o popover, a janela continua.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopImmediatePropagation()
      setOpen(null)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <span className="reading-menu" ref={wrap}>
      <button ref={button} type="button" className="paper-link" aria-label="Text size" aria-expanded={open !== null} aria-haspopup="true" onClick={() => {
          if (open) return setOpen(null)
          const rect = button.current?.getBoundingClientRect()
          if (rect) setOpen({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) })
        }}>
        Aa
      </button>
      {open && (
        <div className="reading-popover" style={{ top: open.top, right: open.right }}>
          <ReadingScaleStepper buttonClass="reading-btn" />
        </div>
      )}
    </span>
  )
}
