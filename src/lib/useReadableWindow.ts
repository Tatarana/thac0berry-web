import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { readingKeyDelta } from '../rules/readingScale'
import { readingStyle, stepReadingScale, subscribeReadingScale, useReadingIndex } from './readingScale'

// Comportamento comum das janelas de leitura: variáveis de escala, atalhos
// +/- e a âncora de rolagem ao trocar o tamanho do texto.

const BLOCKS = 'p, li, h3, h4, tr, .detail-field, .detail-lines > *'

interface Anchor {
  element: Element
  /** Distância do topo do elemento ao topo da área visível (negativa = já passou). */
  offset: number
  /** Mesma distância como fração da altura (para parágrafo cortado em cima). */
  ratio: number
}

/** O bloco de texto que está no topo da área visível de `scroller`. */
function captureAnchor(scroller: HTMLElement): Anchor | null {
  if (scroller.scrollTop <= 0) return null
  const area = scroller.querySelector('.reading-area')
  if (!area) return null
  const top = scroller.getBoundingClientRect().top
  for (const element of area.querySelectorAll(BLOCKS)) {
    if (element.querySelector(BLOCKS)) continue // só folhas: o parágrafo, não a caixa que o contém
    const rect = element.getBoundingClientRect()
    if (rect.height === 0 || rect.bottom <= top + 1) continue
    return { element, offset: rect.top - top, ratio: (rect.top - top) / rect.height }
  }
  return null
}

function restoreAnchor(scroller: HTMLElement, anchor: Anchor) {
  if (!anchor.element.isConnected) return
  const top = scroller.getBoundingClientRect().top
  const rect = anchor.element.getBoundingClientRect()
  // Bloco visível por inteiro: mantém a distância em px; cortado em cima: mantém a fração.
  const wanted = anchor.offset >= 0 ? anchor.offset : anchor.ratio * rect.height
  scroller.scrollTop += rect.top - top - wanted
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Atalhos + e - do tamanho do texto, nunca enquanto se digita. `accept` decide,
 * no momento da tecla, se este ouvinte é o responsável (evita passo duplo quando
 * há uma janela de leitura aberta sobre a Forja).
 */
export function useReadingShortcuts(enabled: boolean, accept: () => boolean = () => true) {
  const acceptRef = useRef(accept)
  useEffect(() => {
    acceptRef.current = accept
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const delta = readingKeyDelta(event)
      if (delta === 0 || !acceptRef.current()) return
      event.preventDefault()
      stepReadingScale(delta)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/**
 * Para o elemento que rola (`.modal-backdrop`) de uma janela de leitura. Com
 * `enabled` falso não faz nada. Devolve a ref e o estilo (variáveis CSS) a pôr nele.
 */
export function useReadableWindow(enabled: boolean): { backdropRef: RefObject<HTMLDivElement | null>; style: CSSProperties | undefined } {
  const backdropRef = useRef<HTMLDivElement>(null)
  const index = useReadingIndex()
  const anchor = useRef<Anchor | null>(null)

  // Antes de o React redesenhar com a escala nova, guarda onde o leitor está.
  useEffect(() => {
    if (!enabled) return
    return subscribeReadingScale(() => {
      anchor.current = backdropRef.current ? captureAnchor(backdropRef.current) : null
    })
  }, [enabled])

  // Depois do redesenho, devolve o mesmo trecho ao mesmo lugar.
  useLayoutEffect(() => {
    const scroller = backdropRef.current
    if (enabled && scroller && anchor.current) restoreAnchor(scroller, anchor.current)
    anchor.current = null
  }, [enabled, index])

  // Atalhos + e - (só a janela de cima, se houver várias empilhadas).
  useReadingShortcuts(enabled, () => {
    const windows = document.querySelectorAll('[data-reading-window]')
    return windows[windows.length - 1] === backdropRef.current
  })

  return { backdropRef, style: enabled ? readingStyle(index) : undefined }
}
