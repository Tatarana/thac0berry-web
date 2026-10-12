// Encontros do Combat Tracker na conta (backlog item 4, 2026-10-12;
// thac0berry-backend, tabela `encounter`). Só funções puras: o que mudou entre
// duas listas de encontros e o que sobe do aparelho na primeira vez.

import { defaultSettings, type CombatSettings, type Encounter } from './combat.ts'

export interface EncounterChanges {
  /** Encontros novos ou alterados (pelo conteúdo). */
  changed: Encounter[]
  /** Ids que saíram da lista (viram `deleted_at` no servidor). */
  removed: string[]
}

/** O que mudou de `before` para `after`, encontro a encontro (pelo JSON de cada um). */
export function encounterChanges(before: Encounter[], after: Encounter[]): EncounterChanges {
  const old = new Map(before.map((e) => [e.id, JSON.stringify(e)]))
  const changed = after.filter((e) => old.get(e.id) !== JSON.stringify(e))
  const kept = new Set(after.map((e) => e.id))
  const removed = before.filter((e) => !kept.has(e.id)).map((e) => e.id)
  return { changed, removed }
}

/**
 * Primeira vez com login neste aparelho: os encontros do aparelho que a conta
 * ainda não tem sobem (decisão do usuário). Depois disso, a conta manda: o que
 * sumiu dela foi apagado em outro aparelho e não volta.
 */
export function encountersToUpload(local: Encounter[], serverIDs: Iterable<string>): Encounter[] {
  const onServer = new Set([...serverIDs].map((id) => id.toLowerCase()))
  return local.filter((e) => !onServer.has(e.id.toLowerCase()))
}

/** O que o aparelho mudou e a conta ainda não recebeu (fica gravado no aparelho, para não se perder). */
export interface Unsynced {
  encounters: string[]
  removed: string[]
  settings: boolean
}

/**
 * Pendências em relação ao que a conta tem (`shadow`); null quando não há
 * nenhuma. Vão gravadas junto no aparelho: se a página fechar antes de a
 * conta receber, elas sobem na próxima abertura em vez de a conta as apagar.
 */
export function unsyncedChanges(shadow: { encounters: Encounter[]; settings: string }, encounters: Encounter[], settings: CombatSettings): Unsynced | null {
  const { changed, removed } = encounterChanges(shadow.encounters, encounters)
  const settingsChanged = JSON.stringify(settings) !== shadow.settings
  return changed.length === 0 && removed.length === 0 && !settingsChanged ? null : { encounters: changed.map((e) => e.id), removed, settings: settingsChanged }
}

/** Configurações da conta (null = nunca gravou) sobre as padrão. */
export function settingsFromAccount(saved: Partial<CombatSettings> | null | undefined): CombatSettings {
  return { ...defaultSettings, ...(saved ?? {}) }
}

/** As configurações do aparelho são diferentes das padrão? (sobem na primeira vez, se a conta não tiver) */
export const customSettings = (settings: CombatSettings) => JSON.stringify(settingsFromAccount(settings)) !== JSON.stringify(defaultSettings)
