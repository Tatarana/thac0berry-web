import type { Lean } from '../rules/alignment'
import { settingUnderConstruction } from '../rules/campaignFilter.ts'
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

/**
 * Versão do formato gravado. 2: o Forge ganhou a etapa 1 "Campaign Setting" e todos os
 * números de etapa subiram 1. Rascunho sem versão (formato 1) tem `step` antigo.
 */
export const forgeDraftVersion = 2

/**
 * Leva o snapshot gravado ao formato atual: sem versão, `step` antigo (+1). Mundos ainda
 * em obras (não escolhíveis na etapa 1) saem dos cenários gravados.
 */
export function migrateForgeSnapshot(snapshot: ForgeSnapshot, version: number | undefined): ForgeSnapshot {
  const settings = (snapshot.settings ?? []).filter((s) => !settingUnderConstruction(s))
  return { ...snapshot, settings, step: version === undefined ? snapshot.step + 1 : snapshot.step }
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** false: o navegador não guardou (cheio ou bloqueado), e o login perderia o herói. */
export function keepForgeDraft(snapshot: ForgeSnapshot, store: Store = localStorage, now = Date.now()): boolean {
  try {
    store.setItem(key, JSON.stringify({ savedAt: now, version: forgeDraftVersion, snapshot }))
    return true
  } catch {
    return false
  }
}

export function readForgeDraft(store: Store = localStorage, now = Date.now()): ForgeSnapshot | null {
  try {
    const saved = JSON.parse(store.getItem(key) ?? 'null') as { savedAt: number; version?: number; snapshot: ForgeSnapshot } | null
    return saved && now - saved.savedAt <= forgeDraftTTL ? migrateForgeSnapshot(saved.snapshot, saved.version) : null
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
