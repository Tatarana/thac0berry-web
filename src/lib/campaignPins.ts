import { togglePin, type PinnedItem } from '../rules/pins'
import { supabase } from './supabase'

// Fixar no Shield (opção A do DM Shield): lê e grava `campaign.pinned_items`.
// Mesmo contrato das outras colunas da campaign: manda o `version` lido, o
// trigger do servidor decide conflito (a versão mais nova vence).

/** Os itens fixados da campanha (null = campanha não encontrada ou apagada). */
export async function fetchCampaignPins(campaignID: string): Promise<PinnedItem[] | null> {
  const { data, error } = await supabase.from('campaign').select('pinned_items').eq('id', campaignID).is('deleted_at', null).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? ((data as { pinned_items: PinnedItem[] }).pinned_items ?? []) : null
}

/** Fixa ou desafixa um item; devolve a lista gravada. */
export async function toggleCampaignPin(campaignID: string, item: PinnedItem): Promise<PinnedItem[]> {
  const { data: row, error: readError } = await supabase.from('campaign').select('pinned_items, version').eq('id', campaignID).single()
  if (readError) throw new Error(readError.message)
  const current = row as { pinned_items: PinnedItem[]; version: number }
  const next = togglePin(current.pinned_items ?? [], item)
  const { error: writeError } = await supabase.from('campaign').update({ pinned_items: next, version: current.version }).eq('id', campaignID)
  if (writeError) throw new Error(writeError.message)
  return next
}
