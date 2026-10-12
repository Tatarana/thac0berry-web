// Campanha ativa do modo DM na conta (backlog item 4, S3, 2026-10-12;
// `user_preferences.dm_active_campaign_id` / `dm_active_one_shot`). Uma só por
// conta (decisão do usuário). Só funções puras: o que a conta guarda e quem
// vale quando o aparelho e a conta discordam.

/** O que a conta guarda: campanha, One-shot ou nada escolhido. */
export type AccountChoice = { kind: 'campaign'; id: string } | { kind: 'one-shot' } | { kind: 'none' }

export function accountChoice(prefs: { dm_active_campaign_id?: string | null; dm_active_one_shot?: boolean }): AccountChoice {
  if (prefs.dm_active_campaign_id) return { kind: 'campaign', id: prefs.dm_active_campaign_id }
  if (prefs.dm_active_one_shot) return { kind: 'one-shot' }
  return { kind: 'none' }
}

/** As colunas a gravar para a escolha do aparelho (`id: null` é o One-shot; null, nada escolhido). */
export function choiceColumns(local: { id: string | null } | null) {
  return { dm_active_campaign_id: local?.id ?? null, dm_active_one_shot: !!local && local.id === null }
}

/**
 * Quem vale ao carregar a conta:
 * - mudança do aparelho que a conta ainda não recebeu (a página fechou antes): sobe;
 * - primeira vez nesta conta: a conta vale se tiver uma escolha; senão sobe a do aparelho (se houver);
 * - depois: a conta vale (inclusive "nada": a campanha foi apagada em outro aparelho).
 */
export function resolveActiveCampaign(input: {
  account: AccountChoice
  hasLocal: boolean
  firstTime: boolean
  pending: boolean
}): 'upload' | 'download' | 'none' {
  const { account, hasLocal, firstTime, pending } = input
  if (!firstTime && pending) return 'upload'
  if (account.kind !== 'none' || !firstTime) return 'download'
  return hasLocal ? 'upload' : 'none'
}
