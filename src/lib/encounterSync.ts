import type { Encounter } from '../rules/combat'
import { supabase } from './supabase'

// Encontros na tabela `encounter` (thac0berry-backend, migração de
// 2026-10-12). Contrato de sempre: INSERT do registro novo; UPDATE levando o
// `version` conhecido; nunca upsert; exclusão = `deleted_at`.

export interface ServerEncounter {
  encounter: Encounter
  version: number
}

/** Encontros da conta (não apagados). */
export async function fetchEncounters(): Promise<ServerEncounter[]> {
  const { data, error } = await supabase.from('encounter').select('id, data, version').is('deleted_at', null)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; data: Encounter; version: number }[]).map((row) => ({ encounter: { ...row.data, id: row.data.id ?? row.id }, version: row.version }))
}

/** Um encontro da conta (recarregar depois de um conflito); null se foi apagado. */
export async function fetchEncounter(id: string): Promise<ServerEncounter | null> {
  const { data, error } = await supabase.from('encounter').select('id, data, version').eq('id', id).is('deleted_at', null).maybeSingle()
  if (error) throw new Error(error.message)
  const row = data as { id: string; data: Encounter; version: number } | null
  return row ? { encounter: { ...row.data, id: row.data.id ?? row.id }, version: row.version } : null
}

export interface WriteResult {
  version: number
  /** O servidor marcou a gravação como baseada numa versão antiga (outro aparelho gravou antes). */
  conflicted: boolean
}

/** Grava o encontro: INSERT se a conta ainda não tem (`version` null), UPDATE com a versão senão. */
export async function writeEncounter(encounter: Encounter, version: number | null): Promise<WriteResult> {
  const row = { campaign_id: encounter.campaignID ?? null, data: encounter }
  const { data, error } =
    version === null
      ? await supabase.from('encounter').insert({ id: encounter.id, ...row }).select('version, conflicted_at').single()
      : await supabase.from('encounter').update({ ...row, version }).eq('id', encounter.id).select('version, conflicted_at').single()
  if (error) throw new Error(error.message)
  const saved = data as { version: number; conflicted_at: string | null }
  return { version: saved.version, conflicted: saved.conflicted_at !== null }
}

/** Apaga (marca `deleted_at`) um encontro que a conta tem. */
export async function deleteEncounter(id: string, version: number): Promise<void> {
  const { error } = await supabase.from('encounter').update({ deleted_at: new Date().toISOString(), version }).eq('id', id)
  if (error) throw new Error(error.message)
}
