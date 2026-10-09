import { useEffect, useSyncExternalStore } from 'react'
import { useCampaigns } from './campaignCharacters'
import { useMode } from './mode'

// Campanha ativa do modo DM (docs/campanha-ativa.md, decisões de 2026-10-09):
// escolhida uma vez, vale para tudo o que o DM faz até ele trocar. Fica no
// aparelho, como o modo (guardar na conta está no backlog). `id: null` é o
// One-shot (jogo sem campanha).

export interface ActiveCampaign {
  id: string | null
  name: string
}

export const oneShot: ActiveCampaign = { id: null, name: 'One-shot' }

const KEY = 'thac0berry.campaign'
const EVENT = 'thac0berry-campaign'
let memory: ActiveCampaign | null = null

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

/** Grava a campanha ativa (null volta a pedir a escolha). */
export function setActiveCampaign(campaign: ActiveCampaign | null) {
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
    else if (found.name !== active.name) setActiveCampaign({ id: found.id, name: found.name })
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
