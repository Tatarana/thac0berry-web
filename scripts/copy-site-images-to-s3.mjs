// Copia para o S3 os arquivos que estão no bucket público `site-images` do
// Supabase, com os mesmos caminhos e cache longo. Idempotente: pula o que já está
// no S3 e nunca apaga nada, em nenhum dos lados. A lista de arquivos vem da
// tabela site_image_version, lida pela chave pública. Credenciais da AWS só do ambiente:
//   AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… AWS_REGION=… SITE_IMAGES_BUCKET=… \
//     node scripts/copy-site-images-to-s3.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { supabasePublicURL } from '../src/lib/siteImageUploadRules.ts'
import { objectExists, putNew, s3FromEnv } from './lib/s3.mjs'

const dryRun = process.argv.includes('--dry-run')
const s3 = s3FromEnv()
const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })

// Todas as versões (não só as atuais): nenhuma é apagada, então todas têm de ter arquivo.
const paths = []
const page = 1000
for (let from = 0; ; from += page) {
  const { data, error } = await reader.from('site_image_version').select('storage_path').order('storage_path').range(from, from + page - 1)
  if (error) throw new Error(error.message)
  paths.push(...data.map((row) => row.storage_path))
  if (data.length < page) break
}
console.log(`${paths.length} arquivos na tabela site_image_version${dryRun ? ' (--dry-run: nada será enviado)' : ''}.`)

const count = { enviado: 0, existente: 0, faltando: 0, erro: 0 }
for (const path of paths) {
  try {
    if (await objectExists(s3, path)) {
      count.existente++
      continue
    }
    if (dryRun) {
      console.log(`copiaria ${path}`)
      count.enviado++
      continue
    }
    const res = await fetch(supabasePublicURL(SUPABASE_URL, 'site-images', path))
    if (!res.ok) {
      console.error(`${path}: não está no Supabase Storage (HTTP ${res.status})`)
      count.faltando++
      continue
    }
    const result = await putNew(s3, path, Buffer.from(await res.arrayBuffer()))
    if (result === 'ja-existia') count.existente++
    else {
      console.log(`copiado ${path}`)
      count.enviado++
    }
  } catch (e) {
    console.error(`${path}: ${e instanceof Error ? e.message : e}`)
    count.erro++
  }
}
console.log(`${dryRun ? 'a copiar' : 'copiados'}: ${count.enviado} | já no S3: ${count.existente} | sem arquivo no Supabase: ${count.faltando} | erros: ${count.erro}`)
if (count.faltando || count.erro) process.exitCode = 1
