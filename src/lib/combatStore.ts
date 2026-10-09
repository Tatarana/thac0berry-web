import { useRef, useState } from 'react'
import { defaultSettings, type CombatSettings, type Encounter } from '../rules/combat'

// Encontros do Combat Tracker guardados no aparelho (decisão 1 de
// docs/controle-de-combate.md; no Supabase fica para o backlog). `version`
// marca o formato para a migração futura.

const KEY = 'thac0berry.combat'

export interface CombatStore {
  version: 1
  settings: CombatSettings
  encounters: Encounter[]
  /** Encontro aberto por último. */
  currentID: string | null
}

const empty = (): CombatStore => ({ version: 1, settings: { ...defaultSettings }, encounters: [], currentID: null })

function read(): CombatStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<CombatStore>
    if (parsed.version !== 1 || !Array.isArray(parsed.encounters)) return empty()
    return { ...empty(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } }
  } catch {
    return empty()
  }
}

/** Grava no aparelho; devolve o erro (navegador sem espaço ou sem armazenamento), ou null. */
function write(store: CombatStore): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    return null
  } catch (reason) {
    return reason instanceof Error ? reason.message : String(reason)
  }
}

/** Estado do Combat Tracker; cada mudança grava no aparelho (se o navegador deixar). */
export function useCombatStore() {
  const [store, setStore] = useState<CombatStore>(read)
  const [saveError, setSaveError] = useState<string | null>(null)
  const lastError = useRef<string | null>(null)

  /** Muda o estado numa cópia (a função pode alterar o rascunho à vontade) e grava. */
  const update = (mutate: (draft: CombatStore) => void) =>
    setStore((current) => {
      const draft = structuredClone(current)
      mutate(draft)
      const error = write(draft)
      if (error !== lastError.current) {
        lastError.current = error
        // Fora da função de atualização: o aviso não pode mudar outro estado no meio dela.
        queueMicrotask(() => setSaveError(error))
      }
      return draft
    })

  return { store, update, saveError }
}
