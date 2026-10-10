// Preferências da conta (`user_preferences` no Supabase; Settings da web).
// Mesmo contrato de sempre: INSERT da linha que não existe, UPDATE com o
// `version` conhecido. Lê com `*` para não quebrar se uma coluna nova ainda não
// foi aplicada no banco (ex.: `default_player_name`, migração de 2026-10-10).
import type { PaperStyle } from './notebook'
import { supabase } from './supabase'

export interface Preferences {
  default_notebook_paper_style: PaperStyle | null
  default_player_name: string | null
}

export async function loadPreferences(userID: string): Promise<Partial<Preferences>> {
  const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userID).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Partial<Preferences> | null) ?? {}
}

export async function savePreferences(userID: string, patch: Partial<Preferences>) {
  const current = await supabase.from('user_preferences').select('version').eq('user_id', userID).maybeSingle()
  if (current.error) throw new Error(current.error.message)
  const version = (current.data as { version: number } | null)?.version
  const { error } =
    version === undefined
      ? await supabase.from('user_preferences').insert(patch)
      : await supabase.from('user_preferences').update({ ...patch, version }).eq('user_id', userID)
  if (error) throw new Error(error.message)
}

/** Nome padrão do jogador para um personagem novo ('' se não houver ou se falhar). */
export async function defaultPlayerName(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession()
    const userID = data.session?.user.id
    return userID ? ((await loadPreferences(userID)).default_player_name ?? '').trim() : ''
  } catch {
    return ''
  }
}
