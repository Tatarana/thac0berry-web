import { useEffect, useEffectEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ServerSheet } from '../lib/useSpellSheets'
import { allClasses } from '../rules/multiclass'
import { PsionicsPanel } from './PsionicsPanel'
import { RecordPageFour } from './RecordPageFour'
import { RecordPageThree } from './RecordPageThree'
import { RecordPageTwo } from './RecordPageTwo'
import { RecordSheet } from './RecordSheet'
import { SpellSheetPage } from './SpellSheetPage'
import { WizardSpellbook } from './WizardSpellbook'
import type { PlayerCharacter } from '../types/library'

// Ficha para imprimir / salvar em PDF (A4): as partes escolhidas na janela de
// impressão, cada uma começando numa folha, sem `edit` (sem botões, seletores
// e destaques de pendência). Fica fora da tela; o CSS de impressão
// (`body.printing`) esconde o resto do app.

/** O que imprimir (PrintDialog). */
export interface PrintChoice {
  record: boolean
  /** Folhas de magia (dias) escolhidas, na ordem das bolinhas. */
  sheets: ServerSheet[]
  psionics: boolean
  spellbook: boolean
}

// Altura útil da folha A4 (297 mm menos as margens de 10 mm do @page), com folga.
const pageHeightMM = 297 - 2 * 10 - 6
const px = (mm: number) => (mm * 96) / 25.4
/** Menor zoom de uma parte que pode continuar na folha seguinte (letra legível). */
const flowMinZoom = 0.65

/**
 * Cada página da ficha numa folha: a que passa da altura útil encolhe
 * (`zoom`). Com menos zoom ela também ganha largura e muda o layout, então
 * busca (binária) o maior zoom que cabe. As partes `.print-flow` (magias,
 * psiônicos, grimório) param em `flowMinZoom` e continuam na folha seguinte.
 * Mede fora da tela, na largura útil da folha (.print-root no CSS).
 */
function fitPages(root: HTMLElement) {
  const limit = px(pageHeightMM)
  for (const page of root.querySelectorAll<HTMLElement>('.print-page')) {
    const fits = (zoom: number) => {
      page.style.zoom = String(zoom)
      return page.getBoundingClientRect().height <= limit
    }
    if (fits(1)) continue
    const min = page.classList.contains('print-flow') ? flowMinZoom : 0.3
    if (!fits(min)) continue
    let low = min
    let high = 1
    for (let i = 0; i < 8; i++) {
      const mid = (low + high) / 2
      if (fits(mid)) low = mid
      else high = mid
    }
    page.style.zoom = String(low)
  }
}

/** Espera o conteúdo assentar: as magias e os poderes chegam depois de montar (sem mudança por 400 ms, até 6 s). */
function settled(root: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    let quiet = window.setTimeout(done, 400)
    const limit = window.setTimeout(done, 6000)
    const observer = new MutationObserver(() => {
      window.clearTimeout(quiet)
      quiet = window.setTimeout(done, 400)
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    function done() {
      observer.disconnect()
      window.clearTimeout(quiet)
      window.clearTimeout(limit)
      resolve()
    }
  })
}

export function PrintSheet({
  character,
  campaignName,
  campaignSettings,
  portraitURL,
  pageCount,
  choice,
  onDone,
}: {
  character: PlayerCharacter
  campaignName: string | null
  campaignSettings: string[] | null
  portraitURL: string | null
  pageCount: number
  choice: PrintChoice
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
    // Espera o conteúdo, as fontes e as imagens (o retrato) antes de medir e abrir o diálogo.
    void (async () => {
      if (!root.current) return
      await settled(root.current)
      const images = [...root.current.querySelectorAll('img')]
      await Promise.all([
        document.fonts.ready,
        ...images.map((img) =>
          img.complete
            ? null
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true })
                img.addEventListener('error', resolve, { once: true })
              }),
        ),
      ])
      if (cancelled || !root.current) return
      fitPages(root.current)
      document.body.classList.add('printing')
      window.print()
    })()
    return () => {
      cancelled = true
      window.removeEventListener('afterprint', finish)
      document.body.classList.remove('printing')
    }
  }, [])

  return createPortal(
    <div className="print-root paper-sheet" ref={root}>
      {choice.record && (
        <>
          <section className="print-page">
            <RecordSheet character={character} campaignName={campaignName} campaignSettings={campaignSettings} />
          </section>
          <section className="print-page">
            <RecordPageTwo character={character} />
          </section>
          <section className="print-page">
            <RecordPageThree character={character} portraitURL={portraitURL} />
          </section>
          {/* Página 4 (tabelas da classe e da raça): longa demais para uma folha legível, segue na próxima. */}
          {pageCount >= 4 && (
            <section className="print-page print-flow">
              <RecordPageFour character={character} />
            </section>
          )}
        </>
      )}
      {choice.sheets.map((sheet) => (
        <section key={sheet.id} className="print-page print-flow">
          <SpellSheetPage sheet={sheet} characterName={character.name} classes={allClasses(character)} character={character} collapsible={false} />
        </section>
      ))}
      {choice.psionics && (
        <section className="print-page print-flow">
          <PsionicsPanel c={character} campaignID={null} />
        </section>
      )}
      {choice.spellbook && (
        <section className="print-page print-flow">
          <WizardSpellbook c={character} />
        </section>
      )}
    </div>,
    document.body,
  )
}
