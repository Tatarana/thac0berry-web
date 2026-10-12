import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/context'
import { defaultSettings, type CombatSettings, type Encounter } from '../rules/combat'
import { customSettings, encountersToUpload, settingsFromAccount, unsyncedChanges, type Unsynced } from '../rules/combatSync'
import { deleteEncounter, fetchEncounters, writeEncounter } from './encounterSync'
import { loadPreferences, savePreferences } from './preferences'

// Encontros do Combat Tracker. Sempre guardados no aparelho (sem login é só
// isso; com login, é o cache); com login, também na conta (tabela `encounter`
// e `user_preferences.combat_settings`; backlog item 4, decisões de 2026-10-12):
// - na primeira vez com login neste aparelho, os encontros locais que a conta
//   não tem sobem (e fica uma cópia de segurança no aparelho);
// - depois, a conta manda; cada mudança grava só o encontro que mudou, 1 s
//   depois da última, com o `version` conhecido; encontro removido vira
//   `deleted_at`;
// - outro aparelho gravou antes: a gravação vale (a última vence, a outra
//   fica no histórico do servidor) e a tela avisa, como na ficha;
// - a aba voltou a ficar visível sem nada pendente: busca a versão da conta;
// - o que ainda não foi para a conta fica marcado no aparelho (`unsynced`): se a
//   página fechar antes, sobe na próxima abertura, em vez de a conta apagar.
// O encontro aberto e o aviso dos encontros antigos ficam só no aparelho.

const KEY = 'thac0berry.combat'
const BACKUP_KEY = 'thac0berry.combat.backup'
const SAVE_DELAY_MS = 1000

export interface CombatStore {
  version: 1
  settings: CombatSettings
  encounters: Encounter[]
  /** Encontro aberto por último. */
  currentID: string | null
  /** Já perguntou se leva os encontros sem campanha (de antes da campanha ativa) para uma campanha (CA2). */
  legacyPromptDone?: boolean
  /** Conta com que este aparelho já sincronizou (os encontros locais já subiram para ela). */
  syncedUser?: string | null
  /** O que mudou aqui e a conta ainda não recebeu. */
  unsynced?: Unsynced | null
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

/** Lê o que está no aparelho (fora do React: aviso ao trocar de campanha). */
export const readCombatStore = read

/** Grava no aparelho; devolve o erro (navegador sem espaço ou sem armazenamento), ou null. */
function write(store: CombatStore): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    return null
  } catch (reason) {
    return reason instanceof Error ? reason.message : String(reason)
  }
}

const key = (id: string) => id.toLowerCase()
const message = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason))
const newestFirst = (list: Encounter[]) => [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

/** Estado do Combat Tracker; cada mudança grava no aparelho e, com login, na conta. */
export function useCombatStore() {
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const [store, setStore] = useState<CombatStore>(read)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  // Conta já carregada (só então as mudanças vão para ela).
  const [syncedFor, setSyncedFor] = useState<string | null>(null)
  const synced = userID !== null && syncedFor === userID
  // O mesmo, para as funções que rodam fora do render.
  const syncedRef = useRef(false)
  const lastError = useRef<string | null>(null)

  // Estado da sincronização fora do React.
  const latest = useRef(store)
  const versions = useRef(new Map<string, number>())
  /** O que a conta tem (o que já foi gravado): base da comparação. */
  const shadow = useRef<{ encounters: Encounter[]; settings: string }>({ encounters: [], settings: '' })
  const timer = useRef<number | null>(null)
  const inFlight = useRef(false)
  const flushRef = useRef<() => Promise<void>>(() => Promise.resolve())

  /** Grava no aparelho e guarda como o estado mais recente (base da próxima gravação na conta). */
  const apply = useCallback((next: CombatStore) => {
    latest.current = next
    const error = write(next)
    if (error !== lastError.current) {
      lastError.current = error
      setSaveError(error)
    }
  }, [])

  // Carrega da conta (e sobe o que o aparelho tem, na primeira vez).
  const load = useCallback(async () => {
    if (!userID) return
    try {
      const [server, prefs] = await Promise.all([fetchEncounters(), loadPreferences(userID)])
      const local = read()
      let list = server
      if (local.syncedUser !== userID) {
        const upload = encountersToUpload(local.encounters, server.map((s) => s.encounter.id))
        if (upload.length > 0) {
          try {
            localStorage.setItem(BACKUP_KEY, JSON.stringify(local))
          } catch {
            // Sem espaço para a cópia: segue (os encontros continuam no aparelho até subirem).
          }
          const failures: string[] = []
          for (const encounter of upload) {
            try {
              const saved = await writeEncounter(encounter, null)
              list = [...list, { encounter, version: saved.version }]
            } catch (reason) {
              failures.push(`${encounter.name}: ${message(reason)}`)
            }
          }
          if (failures.length > 0) throw new Error(`some encounters did not go up to your account (${failures.join('; ')})`)
        }
        if (!prefs.combat_settings && customSettings(local.settings)) await savePreferences(userID, { combat_settings: local.settings })
      }
      // Pendências de antes (a página fechou antes de a conta receber): sobem antes de valer a conta.
      let pendingSettings = false
      if (local.syncedUser === userID && local.unsynced) {
        const byID = new Map(list.map((s) => [key(s.encounter.id), s]))
        for (const id of local.unsynced.encounters) {
          const encounter = local.encounters.find((e) => key(e.id) === key(id))
          if (!encounter) continue
          const saved = await writeEncounter(encounter, byID.get(key(id))?.version ?? null)
          if (saved.conflicted) setConflict(true)
          byID.set(key(id), { encounter, version: saved.version })
        }
        for (const id of local.unsynced.removed) {
          const onServer = byID.get(key(id))
          if (onServer) await deleteEncounter(id, onServer.version)
          byID.delete(key(id))
        }
        if (local.unsynced.settings) {
          await savePreferences(userID, { combat_settings: local.settings })
          pendingSettings = true
        }
        list = [...byID.values()]
      }
      const settings = pendingSettings || !prefs.combat_settings ? local.settings : settingsFromAccount(prefs.combat_settings)
      versions.current = new Map(list.map((s) => [key(s.encounter.id), s.version]))
      const encounters = newestFirst(list.map((s) => s.encounter))
      shadow.current = { encounters: structuredClone(encounters), settings: JSON.stringify(settings) }
      const next: CombatStore = { ...local, encounters, settings, syncedUser: userID, unsynced: null }
      apply(next)
      setStore(next)
      syncedRef.current = true
      setSyncedFor(userID)
      setSyncError(null)
    } catch (reason) {
      setSyncError(message(reason))
    }
  }, [userID, apply])

  useEffect(() => {
    // Por um .then, como os outros carregamentos: o estado só muda quando a conta responde.
    void Promise.resolve().then(load)
  }, [load])

  // Grava na conta o que mudou desde a última gravação.
  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    if (!userID || !synced || inFlight.current) return
    inFlight.current = true
    const current = latest.current
    try {
      const pendingNow = unsyncedChanges(shadow.current, current.encounters, current.settings)
      const changed = (pendingNow?.encounters ?? []).map((id) => current.encounters.find((e) => e.id === id)!).filter(Boolean)
      const removed = pendingNow?.removed ?? []
      const done = new Map(shadow.current.encounters.map((e) => [key(e.id), e]))
      try {
        for (const encounter of changed) {
          const result = await writeEncounter(encounter, versions.current.get(key(encounter.id)) ?? null)
          versions.current.set(key(encounter.id), result.version)
          done.set(key(encounter.id), structuredClone(encounter))
          if (result.conflicted) setConflict(true)
        }
        for (const id of removed) {
          const version = versions.current.get(key(id))
          if (version !== undefined) await deleteEncounter(id, version)
          versions.current.delete(key(id))
          done.delete(key(id))
        }
      } finally {
        // O que foi gravado antes de um erro não é gravado de novo.
        shadow.current = { ...shadow.current, encounters: [...done.values()] }
      }
      const settings = JSON.stringify(current.settings)
      if (settings !== shadow.current.settings) {
        await savePreferences(userID, { combat_settings: current.settings })
        shadow.current = { ...shadow.current, settings }
      }
      setSyncError(null)
    } catch (reason) {
      setSyncError(message(reason))
    } finally {
      inFlight.current = false
    }
    // O aparelho guarda o que ainda falta; mudanças feitas durante a gravação
    // saem logo em seguida (um erro também tenta de novo).
    const pending = unsyncedChanges(shadow.current, latest.current.encounters, latest.current.settings)
    apply({ ...latest.current, unsynced: pending })
    if (pending && timer.current === null) {
      timer.current = window.setTimeout(() => void flushRef.current(), SAVE_DELAY_MS * 5)
    }
  }, [userID, synced, apply])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  // Ao sair da tela, grava o que estiver pendente.
  useEffect(
    () => () => {
      if (timer.current !== null) void flushRef.current()
    },
    [],
  )

  // Página fechando (aba, app do iPad para o fundo): tenta gravar o que estiver pendente.
  useEffect(() => {
    const onHide = () => {
      if (timer.current !== null) void flushRef.current()
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  // Aba visível de novo, sem nada pendente: busca o que outro aparelho gravou.
  useEffect(() => {
    if (!userID) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && timer.current === null && !inFlight.current) void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userID, load])

  /** Muda o estado numa cópia (a função pode alterar o rascunho à vontade), grava no aparelho e agenda a conta. */
  const update = useCallback(
    (mutate: (draft: CombatStore) => void) => {
      const draft = structuredClone(latest.current)
      mutate(draft)
      // Com a conta carregada, marca o que ela ainda não tem (sobe depois, mesmo se a página fechar antes).
      if (userID && syncedRef.current) draft.unsynced = unsyncedChanges(shadow.current, draft.encounters, draft.settings)
      apply(draft)
      setStore(draft)
      if (userID) {
        if (timer.current !== null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => void flushRef.current(), SAVE_DELAY_MS)
      }
    },
    [apply, userID],
  )

  return { store, update, saveError, syncError, conflict, dismissConflict: () => setConflict(false), signedIn: !!userID, synced }
}
