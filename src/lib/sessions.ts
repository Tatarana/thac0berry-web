import { isoNow } from '../rules/spellSheets'
import { supabase } from './supabase'

/**
 * Campaign.activeSession do iPad: a sessão não arquivada mais recente da
 * campanha; sem nenhuma, cria uma com a data de hoje (INSERT).
 */
export async function activeSessionID(campaignID: string): Promise<string> {
  const { data, error } = await supabase
    .from('session')
    .select('id')
    .eq('campaign_id', campaignID)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(1)
  if (error) throw new Error(error.message)
  const found = (data as { id: string }[])[0]
  if (found) return found.id
  const id = crypto.randomUUID().toUpperCase()
  const created = await supabase.from('session').insert({ id, campaign_id: campaignID, date: isoNow(), title: '', summary: '', is_archived: false })
  if (created.error) throw new Error(created.error.message)
  return id
}
