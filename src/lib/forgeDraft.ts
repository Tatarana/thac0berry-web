import type { Lean } from '../rules/alignment'
import type { MarketState } from '../rules/market'
import type { BookState } from '../rules/spellbook'
import type { Training } from '../rules/thievingPoints'
import type { PlayerCharacter } from '../types/library'

// O login com Google sai do site. Para o herói não se perder na ida, o rascunho do Forge
// espera neste aparelho e volta na tela seguinte ao login. Dura pouco: quem desistiu do
// login e volta dias depois não pode ganhar um personagem que não pediu.

const key = 'thac0berry.forge.pending'
export const forgeDraftTTL = 30 * 60 * 1000

export interface ForgeSnapshot {
  step: number
  draft: PlayerCharacter
  classChosen: boolean
  settings: string[]
  spellBook: { cls: string; state: BookState } | null
  market: MarketState
  thiefTraining: { cls: string; training: Training } | null
  alignmentAnswers: Lean[] | null
  sphereFor: string | null
  /** O retrato próprio do jogador, em data URL. */
  portrait: string | null
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** false: o navegador não guardou (cheio ou bloqueado), e o login perderia o herói. */
export function keepForgeDraft(snapshot: ForgeSnapshot, store: Store = localStorage, now = Date.now()): boolean {
  try {
    store.setItem(key, JSON.stringify({ savedAt: now, snapshot }))
    return true
  } catch {
    return false
  }
}

export function readForgeDraft(store: Store = localStorage, now = Date.now()): ForgeSnapshot | null {
  try {
    const saved = JSON.parse(store.getItem(key) ?? 'null') as { savedAt: number; snapshot: ForgeSnapshot } | null
    return saved && now - saved.savedAt <= forgeDraftTTL ? saved.snapshot : null
  } catch {
    return null
  }
}

export function clearForgeDraft(store: Store = localStorage) {
  try {
    store.removeItem(key)
  } catch {
    // Sem acesso ao armazenamento não há rascunho para limpar.
  }
}

export const blobToDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('could not read the portrait'))
    reader.readAsDataURL(blob)
  })

export function dataURLToFile(url: string): File {
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (char) => char.charCodeAt(0))
  return new File([bytes], 'portrait.jpg', { type: 'image/jpeg' })
}
