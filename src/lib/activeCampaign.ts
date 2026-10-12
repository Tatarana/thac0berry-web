import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../auth/context'
import { accountChoice, choiceColumns, resolveActiveCampaign } from '../rules/activeCampaignSync'
import { useCampaigns } from './campaignCharacters'
import { useMode } from './mode'
import { loadPreferences, savePreferences } from './preferences'
import { supabase } from './supabase'

// Campanha ativa do modo DM (docs/campanha-ativa.md, decisões de 2026-10-09):
// escolhida uma vez, vale para tudo o que o DM faz até ele trocar. Fica no
// aparelho e, com login, também na conta (S3, 2026-10-12: uma só por conta,
// vale em todos os aparelhos; `ActiveCampaignSync`). `id: null` é o One-shot
// (jogo sem campanha).

export interface ActiveCampaign {
  id: string | null
  name: string
}

export const oneShot: ActiveCampaign = { id: null, name: 'One-shot' }

const KEY = 'thac0berry.campaign'
const EVENT = 'thac0berry-campaign'
/** Conta com que o aparelho já sincronizou e se há escolha que a conta ainda não recebeu. */
const SYNC_KEY = 'thac0berry.campaign.sync'
let memory: ActiveCampaign | null = null
let syncMemory: SyncState = { user: null, pending: false }

interface SyncState {
  user: string | null
  pending: boolean
}

function readSync(): SyncState {
  try {
    const raw = localStorage.getItem(SYNC_KEY)
    if (!raw) return syncMemory
    const value = JSON.parse(raw) as Partial<SyncState>
    return { user: typeof value.user === 'string' ? value.user : null, pending: value.pending === true }
  } catch {
    return syncMemory
  }
}

function writeSync(state: SyncState) {
  syncMemory = state
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(state))
  } catch {
    // Sem armazenamento: vale só até fechar a página.
  }
}

function read(): ActiveCampaign | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return memory
    const value = JSON.parse(raw) as Partial<ActiveCampaign>
    return typeof value.name === 'string' && (value.id === null || typeof value.id === 'string') ? { id: value.id, name: value.name } : null
  } catch {
    return memory
  }
}

// useSyncExternalStore precisa do mesmo objeto enquanto nada muda.
let cached: { raw: string | null; value: ActiveCampaign | null } = { raw: null, value: null }
function snapshot(): ActiveCampaign | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    raw = memory ? JSON.stringify(memory) : null
  }
  if (raw !== cached.raw) cached = { raw, value: read() }
  return cached.value
}

/** Grava a campanha ativa (null volta a pedir a escolha); escolha do DM fica pendente para a conta. */
export function setActiveCampaign(campaign: ActiveCampaign | null, from: 'device' | 'account' = 'device') {
  if (from === 'device') writeSync({ ...readSync(), pending: true })
  try {
    if (campaign) localStorage.setItem(KEY, JSON.stringify(campaign))
    else localStorage.removeItem(KEY)
  } catch {
    // Sem armazenamento (aba anônima etc.): vale só até fechar a página.
    memory = campaign
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

/** A campanha ativa deste aparelho, ou null se o DM ainda não escolheu. */
export function useActiveCampaign(): ActiveCampaign | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}

/**
 * Confere a campanha guardada com as da conta: apagada, volta a pedir a
 * escolha; renomeada, atualiza o nome. Sem login ou sem resposta, não mexe.
 */
export function useCheckedActiveCampaign() {
  const active = useActiveCampaign()
  const { campaigns } = useCampaigns()
  useEffect(() => {
    if (!active?.id || !campaigns) return
    const found = campaigns.find((c) => c.id === active.id)
    if (!found) setActiveCampaign(null)
    // Renomeada: só o nome muda (a conta guarda o id; nada a gravar).
    else if (found.name !== active.name) setActiveCampaign({ id: found.id, name: found.name }, 'account')
  }, [active, campaigns])
  return active
}

/**
 * "Campaign Settings" da campanha ativa (CA3), para os filtros do DM começarem
 * por ela; null quando não restringe (One-shot, campanha sem cenários, modo
 * Jogador, sem login).
 */
export function useActiveCampaignSettings(): string[] | null {
  const mode = useMode()
  const active = useActiveCampaign()
  const { campaigns } = useCampaigns()
  if (mode !== 'dm' || !active?.id) return null
  const settings = campaigns?.find((c) => c.id === active.id)?.enabled_settings
  return settings && settings.length > 0 ? settings : null
}

const RETRY_MS = 5000

/** Nome da campanha guardada na conta (null se não existe mais). */
async function campaignName(id: string): Promise<string | null> {
  const { data, error } = await supabase.from('campaign').select('name').eq('id', id).is('deleted_at', null).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? ((data as { name: string }).name ?? '') : null
}

/**
 * Liga a campanha ativa do aparelho à conta (montado uma vez, no App). Sem
 * login, não faz nada. Ao entrar e ao voltar para a aba: lê a conta e decide
 * quem vale (`resolveActiveCampaign`); cada escolha do DM grava na conta (se
 * falhar, tenta de novo e, se a página fechar antes, sobe na próxima abertura).
 */
export function ActiveCampaignSync() {
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  useEffect(() => {
    if (!userID) return
    let cancelled = false
    let ready = false
    let busy = false
    let retry: number | null = null

    const upload = async () => {
      writeSync({ user: userID, pending: true })
      const columns = choiceColumns(read())
      await savePreferences(userID, columns)
      // Mudou de novo durante a gravação: continua pendente e grava outra vez.
      const changed = JSON.stringify(choiceColumns(read())) !== JSON.stringify(columns)
      writeSync({ user: userID, pending: changed })
      if (changed && !cancelled) retry = window.setTimeout(() => void run(save), 0)
    }

    const run = async (task: () => Promise<void>) => {
      if (busy || cancelled) return
      busy = true
      if (retry !== null) window.clearTimeout(retry)
      retry = null
      try {
        await task()
      } catch (reason) {
        console.warn('Active campaign: could not sync with your account', reason)
        if (!cancelled) retry = window.setTimeout(() => void run(ready ? save : load), RETRY_MS)
      } finally {
        busy = false
      }
    }

    const load = async () => {
      const prefs = await loadPreferences(userID)
      if (cancelled) return
      const sync = readSync()
      const account = accountChoice(prefs)
      const local = read()
      const decision = resolveActiveCampaign({ account, hasLocal: local !== null, firstTime: sync.user !== userID, pending: sync.pending })
      if (decision === 'upload') await upload()
      else if (decision === 'download') {
        let next: ActiveCampaign | null = null
        if (account.kind === 'one-shot') next = oneShot
        else if (account.kind === 'campaign') {
          const name = account.id === local?.id ? local.name : await campaignName(account.id)
          next = name === null ? null : { id: account.id, name }
        }
        if (cancelled) return
        if (next?.id !== local?.id || (next === null) !== (local === null)) setActiveCampaign(next, 'account')
        writeSync({ user: userID, pending: false })
      } else writeSync({ user: userID, pending: false })
      ready = true
    }

    const save = async () => {
      if (readSync().pending) await upload()
    }

    const onChange = () => {
      if (ready && readSync().pending) void run(save)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !readSync().pending) void run(load)
    }
    window.addEventListener(EVENT, onChange)
    document.addEventListener('visibilitychange', onVisible)
    void run(load)
    return () => {
      cancelled = true
      if (retry !== null) window.clearTimeout(retry)
      window.removeEventListener(EVENT, onChange)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userID])
  return null
}
