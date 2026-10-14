// Convite para a campanha (Fase 2a do backend, 2026-10-13; thac0berry-backend
// supabase/migrations/20261013120000_fase2a_membros_e_convites.sql). Só funções
// puras: o código como o banco guarda e as mensagens dos erros das funções.

/** Como o banco guarda o código: sem espaços nas pontas, em maiúsculas. */
export const normalizeInviteCode = (text: string) => text.trim().toUpperCase()

/**
 * Código escolhido pelo mestre: de 4 a 24 letras sem acento, algarismos e
 * hífen (a mesma regra da função `set_campaign_invite`). null = válido.
 */
export function inviteCodeProblem(text: string): string | null {
  const code = normalizeInviteCode(text)
  if (code.length < 4 || code.length > 24) return 'Use 4 to 24 characters.'
  if (!/^[A-Z0-9-]+$/.test(code)) return 'Use only letters without accents, digits and hyphens.'
  return null
}

const messages: Record<string, string> = {
  not_gm: 'Only the DM of this campaign can do that.',
  invalid_code: 'Use 4 to 24 letters without accents, digits or hyphens.',
  code_in_use: 'Another campaign already uses this code — choose a different one.',
  invalid_invite: 'No campaign uses this code. Check it with your DM.',
  not_member: 'This player is no longer in the campaign.',
  not_authenticated: 'Sign in first.',
  invalid_grantee: 'Choose another player of this campaign (not the character’s own player).',
  invalid_hours: 'The access lasts from 1 to 168 hours.',
  not_found: 'This access no longer exists.',
}

/** A mensagem para o erro de uma das funções (o banco manda o nome do erro). */
export function inviteErrorMessage(raw: string): string {
  const key = Object.keys(messages).find((k) => raw.includes(k))
  return key ? messages[key] : raw
}
