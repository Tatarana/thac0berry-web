// Regras puras do envio das imagens do site para o S3 (ver siteImages.ts e a
// Edge Function site-image-upload no thac0berry-backend): endereços, conferência
// da resposta do presign e mensagens de erro. Sem rede e sem Supabase.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Endereço público de um arquivo: a base (sem barra no fim) + o caminho relativo, cada trecho codificado. */
export function joinURL(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.split('/').map(encodeURIComponent).join('/')}`
}

/** Endereço do arquivo no bucket público antigo do Supabase Storage (usado só pelos scripts de cópia). */
export function supabasePublicURL(supabaseUrl: string, bucket: string, path: string): string {
  return joinURL(`${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}`, path)
}

export interface Presign {
  url: string
  path: string
  /** Cabeçalhos assinados: o PUT tem de mandar exatamente estes. */
  headers: Record<string, string>
}

/** Confere a resposta da ação `presign`; lança um Error com mensagem clara se vier torta. */
export function parsePresign(data: unknown, slot: string): Presign {
  const bad = () => new Error('The upload service sent an unexpected answer. Try again.')
  if (typeof data !== 'object' || data === null) throw bad()
  const d = data as Record<string, unknown>
  if (typeof d.url !== 'string' || !d.url.startsWith('https://')) throw bad()
  if (typeof d.path !== 'string' || !d.path.startsWith(`${slot}/`)) throw bad()
  if (typeof d.headers !== 'object' || d.headers === null) throw bad()
  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(d.headers)) {
    if (typeof value !== 'string') throw bad()
    headers[name] = value
  }
  return { url: d.url, path: d.path, headers }
}

/** Mensagem para uma falha na Edge Function (`serverMessage` é o `error` do JSON, se veio). */
export function functionErrorMessage(status: number, serverMessage?: string): string {
  if (status === 401 || status === 403) return 'Only the admin can change site images. Sign in again if your session expired.'
  if (status === 422 && serverMessage) return `The uploaded file was rejected: ${serverMessage}.`
  if (status === 400 && serverMessage) return `The upload was refused: ${serverMessage}.`
  if (status === 409) return 'This file was already registered. Try the upload again.'
  if (status >= 500) return 'The upload service failed. Try again in a moment.'
  return serverMessage ? `Upload failed: ${serverMessage}.` : `Upload failed (HTTP ${status}).`
}

/** Mensagem para uma falha no PUT direto ao S3. */
export function putErrorMessage(status: number): string {
  if (status === 403) return 'The upload link was rejected or has expired (it lasts 5 minutes). Try again.'
  if (status === 412) return 'That file name already exists in the bucket. Try again.'
  if (status === 413 || status === 400) return 'The storage refused the file (type or size).'
  return `The storage did not accept the file (HTTP ${status}).`
}
