import { useSyncExternalStore, type CSSProperties } from 'react'
import {
  DEFAULT_READING_INDEX,
  clampReadingIndex,
  parseStoredReadingScale,
  readingLineHeight,
  readingScaleOf,
  serializeReadingIndex,
  stepReadingIndex,
} from '../rules/readingScale'

// Tamanho do texto de leitura: preferência por aparelho (localStorage), sem
// login e fora do Supabase. Um store pequeno: toda janela aberta lê o mesmo
// valor, e a mudança em outra aba chega pelo evento `storage`.

const KEY = 'thac0berry.readingScale'

let current: number | null = null
const listeners = new Set<() => void>()

function readStored(): number {
  try {
    return parseStoredReadingScale(localStorage.getItem(KEY))
  } catch {
    return DEFAULT_READING_INDEX // localStorage bloqueado (modo privado etc.)
  }
}

function emit() {
  for (const listener of [...listeners]) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return
    current = readStored()
    emit()
  })
}

export function getReadingIndex(): number {
  if (current === null) current = readStored()
  return current
}

export function setReadingIndex(index: number): void {
  const next = clampReadingIndex(index)
  if (next === getReadingIndex()) return
  current = next
  try {
    localStorage.setItem(KEY, serializeReadingIndex(next))
  } catch {
    // Sem gravação: a escolha vale até fechar a aba.
  }
  emit()
}

export function stepReadingScale(delta: number): void {
  setReadingIndex(stepReadingIndex(getReadingIndex(), delta))
}

export function resetReadingScale(): void {
  setReadingIndex(DEFAULT_READING_INDEX)
}

/** Chama `listener` logo que o valor muda (antes de o React redesenhar). */
export function subscribeReadingScale(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Índice do passo atual, reativo. */
export function useReadingIndex(): number {
  return useSyncExternalStore(subscribeReadingScale, getReadingIndex, () => DEFAULT_READING_INDEX)
}

/** Variáveis CSS lidas por `.reading-area` e pela largura da janela. */
export function readingStyle(index: number): CSSProperties {
  return {
    '--reading-scale': readingScaleOf(index),
    '--reading-leading': readingLineHeight(index),
  } as CSSProperties
}
