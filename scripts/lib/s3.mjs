// Acesso ao bucket S3 das imagens do site, para os scripts desta pasta.
// As credenciais vêm SÓ do ambiente (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
// AWS_REGION, SITE_IMAGES_BUCKET); nunca entram no repo. A credencial do usuário
// do site só grava e lê: nenhum script daqui apaga nada.

import { AwsClient } from 'aws4fetch'

export const CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function s3FromEnv() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SITE_IMAGES_BUCKET } = process.env
  const missing = Object.entries({ AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SITE_IMAGES_BUCKET })
    .filter(([, value]) => !value)
    .map(([name]) => name)
  if (missing.length) throw new Error(`Faltam no ambiente: ${missing.join(', ')}.`)
  const client = new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region: AWS_REGION, service: 's3' })
  const base = `https://${SITE_IMAGES_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
  const url = (key) => `${base}/${key.split('/').map(encodeURIComponent).join('/')}`
  return { client, url, bucket: SITE_IMAGES_BUCKET }
}

/** Repete quando a conexão cai (ECONNRESET aparece em uns 3% dos pedidos). */
async function withRetry(request, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request()
    } catch (e) {
      if (attempt >= tries) throw e
    }
  }
}

/** O objeto já está no bucket? (HEAD; 403/404 = não. Erro de credencial aparece no PUT.) */
export async function objectExists(s3, key) {
  const res = await withRetry(() => s3.client.fetch(s3.url(key), { method: 'HEAD' }))
  return res.status === 200
}

/**
 * Grava o objeto sem sobrescrever (If-None-Match: *). Devolve 'enviado' ou
 * 'ja-existia' (412); qualquer outra resposta é erro.
 */
export async function putNew(s3, key, body) {
  const res = await withRetry(() =>
    s3.client.fetch(s3.url(key), {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE_CONTROL, 'If-None-Match': '*' },
      body,
    }),
  )
  if (res.status === 412) return 'ja-existia'
  if (!res.ok) throw new Error(`PUT ${key}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`)
  return 'enviado'
}
