import { useEffect, useEffectEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RecordPageFour } from './RecordPageFour'
import { RecordPageThree } from './RecordPageThree'
import { RecordPageTwo } from './RecordPageTwo'
import { RecordSheet } from './RecordSheet'
import type { PlayerCharacter } from '../types/library'

// Ficha para imprimir / salvar em PDF (A4): todas as páginas da ficha, uma
// por folha, sem `edit` (sem botões, seletores e destaques de pendência). Fica
// fora da tela; o CSS de impressão (`body.printing`) esconde o resto do app.
// Altura útil da folha A4 (297 mm menos as margens de 10 mm do @page), com folga.
const pageHeightMM = 297 - 2 * 10 - 6
const px = (mm: number) => (mm * 96) / 25.4

/**
 * Cada página da ficha numa folha: a que passa da altura útil encolhe
 * (`zoom`). Com menos zoom ela também ganha largura e muda o layout, então
 * busca (binária) o maior zoom que cabe. Mede fora da tela, na largura útil
 * da folha (.print-root no CSS).
 */
function fitPages(root: HTMLElement) {
  const limit = px(pageHeightMM)
  for (const page of root.querySelectorAll<HTMLElement>('.print-page')) {
    const fits = (zoom: number) => {
      page.style.zoom = String(zoom)
      return page.getBoundingClientRect().height <= limit
    }
    if (fits(1)) continue
    let low = 0.3
    let high = 1
    for (let i = 0; i < 8; i++) {
      const mid = (low + high) / 2
      if (fits(mid)) low = mid
      else high = mid
    }
    page.style.zoom = String(low)
  }
}

export function PrintSheet({
  character,
  campaignName,
  campaignSettings,
  portraitURL,
  pageCount,
  onDone,
}: {
  character: PlayerCharacter
  campaignName: string | null
  campaignSettings: string[] | null
  portraitURL: string | null
  pageCount: number
  onDone: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const done = useEffectEvent(onDone)

  useEffect(() => {
    let cancelled = false
    const finish = () => {
      document.body.classList.remove('printing')
      done()
    }
    window.addEventListener('afterprint', finish, { once: true })
    // Espera fontes e imagens (o retrato) antes de medir e abrir o diálogo.
    const images = [...(root.current?.querySelectorAll('img') ?? [])]
    void Promise.all([
      document.fonts.ready,
      ...images.map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true })
              img.addEventListener('error', resolve, { once: true })
            }),
      ),
    ]).then(() => {
      if (cancelled || !root.current) return
      fitPages(root.current)
      document.body.classList.add('printing')
      window.print()
    })
    return () => {
      cancelled = true
      window.removeEventListener('afterprint', finish)
      document.body.classList.remove('printing')
    }
  }, [])

  return createPortal(
    <div className="print-root paper-sheet" ref={root}>
      <section className="print-page">
        <RecordSheet character={character} campaignName={campaignName} campaignSettings={campaignSettings} />
      </section>
      <section className="print-page">
        <RecordPageTwo character={character} />
      </section>
      <section className="print-page">
        <RecordPageThree character={character} portraitURL={portraitURL} />
      </section>
      {pageCount >= 4 && (
        <section className="print-page">
          <RecordPageFour character={character} />
        </section>
      )}
    </div>,
    document.body,
  )
}
