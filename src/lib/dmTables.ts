import type { DmTableData } from '../rules/dmTables'
import { supabase } from './supabase'

// Tabelas do mestre na conta (GT5, 2026-10-14; backend `dm_table`): só o mestre
// lê e grava; cada uma é de uma campanha dele (a ativa) ou do One-shot (sem
// campanha). Contrato de sempre: INSERT para a nova, UPDATE com o `version`
// conhecido (nunca upsert), exclusão marcando `deleted_at`.

export interface DmTableRow {
  id: string
  campaign_id: string | null
  data: DmTableData
  version: number
}

/** As tabelas do mestre de uma campanha (null = One-shot), por título. */
export async function fetchDmTables(userID: string, campaignID: string | null): Promise<DmTableRow[]> {
  let query = supabase.from('dm_table').select('id, campaign_id, data, version').eq('owner_id', userID).is('deleted_at', null)
  query = campaignID ? query.eq('campaign_id', campaignID) : query.is('campaign_id', null)
  const { data, error } = await query.order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as DmTableRow[]
}

/** Tabela nova (devolve a linha gravada). */
export async function createDmTable(campaignID: string | null, data: DmTableData): Promise<DmTableRow> {
  const id = crypto.randomUUID().toUpperCase()
  const { error } = await supabase.from('dm_table').insert({ id, campaign_id: campaignID, data })
  if (error) throw new Error(error.message)
  return { id, campaign_id: campaignID, data, version: 1 }
}

/** Grava a tabela com a versão conhecida; `conflicted` = outro lugar gravou antes (a daqui vence). */
export async function updateDmTable(row: DmTableRow, data: DmTableData): Promise<DmTableRow & { conflicted: boolean }> {
  const { data: saved, error } = await supabase
    .from('dm_table')
    .update({ data, version: row.version })
    .eq('id', row.id)
    .select('version, conflicted_at')
    .single()
  if (error) throw new Error(error.message)
  const r = saved as { version: number; conflicted_at: string | null }
  return { ...row, data, version: r.version, conflicted: r.conflicted_at !== null }
}

/** Apaga (marca `deleted_at`; o servidor guarda o histórico). */
export async function deleteDmTable(row: DmTableRow) {
  const { error } = await supabase.from('dm_table').update({ deleted_at: new Date().toISOString(), version: row.version }).eq('id', row.id)
  if (error) throw new Error(error.message)
}
