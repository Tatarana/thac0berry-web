import { inviteErrorMessage } from '../rules/invites'
import { supabase } from './supabase'

// Membros e convite da campanha (Fase 2a do backend). Membros e convite só
// mudam pelas funções do banco (RPC); as tabelas só são lidas.

export interface CampaignMember {
  user_id: string
  role: 'gm' | 'player'
  display_name: string
  joined_at: string
}

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(inviteErrorMessage(error.message))
}

/** Membros da campanha: o mestre primeiro, depois os jogadores por ordem de entrada. */
export async function fetchMembers(campaignID: string): Promise<CampaignMember[]> {
  const { data, error } = await supabase
    .from('campaign_member')
    .select('user_id, role, display_name, joined_at')
    .eq('campaign_id', campaignID)
    .order('joined_at')
  fail(error)
  return ((data ?? []) as CampaignMember[]).sort((a, b) => (a.role === b.role ? 0 : a.role === 'gm' ? -1 : 1))
}

/** O código ativo (só o mestre lê); null = sem convite. */
export async function fetchInvite(campaignID: string): Promise<string | null> {
  const { data, error } = await supabase.from('campaign_invite').select('code').eq('campaign_id', campaignID).maybeSingle()
  fail(error)
  return (data as { code: string } | null)?.code ?? null
}

/** Gera um código aleatório (sem `code`) ou define o do mestre; troca o anterior. */
export async function setInvite(campaignID: string, code?: string): Promise<string> {
  const { data, error } = await supabase.rpc('set_campaign_invite', { p_campaign: campaignID, p_code: code ?? null })
  fail(error)
  return data as string
}

export async function revokeInvite(campaignID: string) {
  const { error } = await supabase.rpc('revoke_campaign_invite', { p_campaign: campaignID })
  fail(error)
}

/** Entra na campanha do código; devolve o id dela. */
export async function joinCampaign(code: string, displayName: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_campaign', { p_code: code, p_display_name: displayName })
  fail(error)
  return data as string
}

/** Tira um jogador (o mestre) ou sai da campanha (o próprio jogador); as fichas dele voltam ao Sandbox. */
export async function removeMember(campaignID: string, userID: string) {
  const { error } = await supabase.rpc('remove_campaign_member', { p_campaign: campaignID, p_user: userID })
  fail(error)
}
