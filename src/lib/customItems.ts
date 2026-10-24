import type { CustomMagicItemData } from '../types/library'
import { supabase } from './supabase'

// Itens mágicos criados pelo mestre ou pelo jogador (2026-10-24; backend
// `custom_magic_item`). O RLS decide quem vê: o dono; o mestre da campanha
// (também os privados dos jogadores); os membros, se compartilhado. Contrato de
// sempre: INSERT para o novo, UPDATE com o `version` conhecido (nunca upsert),
// exclusão marcando `deleted_at`.

export type CustomItemVisibility = 'private' | 'campaign'

export interface CustomItemRow {
  id: string
  owner_id: string
  campaign_id: string | null
  visibility: CustomItemVisibility
  data: CustomMagicItemData
  version: number
}

const columns = 'id, owner_id, campaign_id, visibility, data, version'

/** Os itens que o seletor da ficha oferece: os da campanha da ficha que a pessoa vê, mais os pessoais dela. */
export async function fetchCustomItems(userID: string, campaignID: string | null): Promise<CustomItemRow[]> {
  let query = supabase.from('custom_magic_item').select(columns).is('deleted_at', null)
  query = campaignID ? query.or(`campaign_id.eq.${campaignID},and(owner_id.eq.${userID},campaign_id.is.null)`) : query.eq('owner_id', userID).is('campaign_id', null)
  const { data, error } = await query.order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as CustomItemRow[]
}

/** Os itens de uma lista de ids (para atualizar as cópias da ficha); os que a pessoa não vê não voltam. */
export async function fetchCustomItemsByID(ids: string[]): Promise<CustomItemRow[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('custom_magic_item').select(columns).in('id', ids.map((id) => id.toLowerCase())).is('deleted_at', null)
  if (error) throw new Error(error.message)
  return (data ?? []) as CustomItemRow[]
}

/** Item novo (devolve a linha gravada). */
export async function createCustomItem(userID: string, campaignID: string | null, visibility: CustomItemVisibility, data: CustomMagicItemData): Promise<CustomItemRow> {
  const id = crypto.randomUUID().toUpperCase()
  const { error } = await supabase.from('custom_magic_item').insert({ id, campaign_id: campaignID, visibility, data })
  if (error) throw new Error(error.message)
  return { id, owner_id: userID, campaign_id: campaignID, visibility, data, version: 1 }
}

/** Grava o item com a versão conhecida. */
export async function updateCustomItem(row: CustomItemRow, data: CustomMagicItemData, visibility: CustomItemVisibility): Promise<CustomItemRow> {
  const { data: saved, error } = await supabase
    .from('custom_magic_item')
    .update({ data, visibility, version: row.version })
    .eq('id', row.id)
    .select('version')
    .single()
  if (error) throw new Error(error.message)
  return { ...row, data, visibility, version: (saved as { version: number }).version }
}

/** Apaga (marca `deleted_at`; as fichas mantêm a cópia). */
export async function deleteCustomItem(row: CustomItemRow) {
  const { error } = await supabase.from('custom_magic_item').update({ deleted_at: new Date().toISOString(), version: row.version }).eq('id', row.id)
  if (error) throw new Error(error.message)
}
