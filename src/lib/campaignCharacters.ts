import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context'
import type { PlayerCharacter } from '../types/library'
import { supabase } from './supabase'

// Campanhas e personagens que a conta lê (Combat Tracker: "+ PC" e o grupo
// de um encontro novo). Fase 1 do backend: só os da própria conta; com a
// Fase 2, os dos jogadores da campanha também, sem mudar aqui.

export interface CampaignOption {
  id: string
  name: string
  is_archived?: boolean
  /** "Campaign Settings" da campanha (null = todos), para os filtros do DM (CA3). */
  enabled_settings?: string[] | null
}

export interface CampaignCharacter {
  id: string
  data: PlayerCharacter
}

/** Campanhas da conta (null enquanto carrega ou sem login). */
export function useCampaigns() {
  const { session } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignOption[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!session) return
    let cancelled = false
    void supabase
      .from('campaign')
      .select('id, name, is_archived, enabled_settings')
      .is('deleted_at', null)
      .order('name')
      .then(({ data, error: e }) => {
        if (cancelled) return
        if (e) setError(e.message)
        else setCampaigns((data as CampaignOption[]) ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [session])
  return { signedIn: !!session, campaigns, error }
}

/** Personagens da campanha que a conta lê. */
export async function loadCampaignCharacters(campaignID: string): Promise<CampaignCharacter[]> {
  const { data, error } = await supabase.from('character').select('id, data').eq('campaign_id', campaignID).is('deleted_at', null)
  if (error) throw new Error(error.message)
  return (data as CampaignCharacter[]) ?? []
}

/** Os personagens da campanha, recarregados quando ela muda (null enquanto carrega ou sem campanha). */
export function useCampaignCharacters(campaignID: string | null) {
  const { session } = useAuth()
  // A lista guarda de qual campanha é: trocar de campanha não mostra a lista da anterior.
  const [loaded, setLoaded] = useState<{ campaignID: string; list: CampaignCharacter[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!session || !campaignID) return
    let cancelled = false
    loadCampaignCharacters(campaignID)
      .then((list) => !cancelled && setLoaded({ campaignID, list }))
      .catch((reason: unknown) => !cancelled && setError(String(reason)))
    return () => {
      cancelled = true
    }
  }, [session, campaignID])
  return { characters: campaignID && loaded?.campaignID === campaignID ? loaded.list : null, error }
}
