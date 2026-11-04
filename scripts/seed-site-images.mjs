// Sobe as imagens de public/images/forge/ como versão 1 dos slots que ainda
// não têm versão (feito uma vez; rodar de novo não repete nada). O arquivo vai
// para o S3 (o mesmo bucket do site) e a versão é registrada pela função
// add_site_image_version com a chave service_role. Tudo vem do ambiente e nunca
// entra no repo:
//   SUPABASE_SERVICE_ROLE_KEY=… AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… \
//     AWS_REGION=… SITE_IMAGES_BUCKET=… node scripts/seed-site-images.mjs
// Só rode depois de aplicar a migração 20261104205322 (antes dela, a função
// ainda confere o Supabase Storage e recusa o registro).

import { readdir, readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { putNew, s3FromEnv } from './lib/s3.mjs'

const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY no ambiente.')
const s3 = s3FromEnv()
const supabase = createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
// Na nuvem, tabela nova não abre para a service_role sem GRANT: a leitura vai
// pela chave pública, e a escrita pela função add_site_image_version.
const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })

const dir = new URL('../public/images/forge/', import.meta.url)
for (const file of (await readdir(dir)).filter((name) => name.endsWith('.webp'))) {
  const slot = `forge/${file.replace(/\.webp$/, '')}`
  const { data, error } = await reader.from('site_image_version').select('version').eq('slot', slot).limit(1)
  if (error) throw new Error(error.message)
  if (data.length) {
    console.log(`${slot}: já tem versão`)
    continue
  }
  const path = `${slot}/${crypto.randomUUID()}.webp`
  await putNew(s3, path, await readFile(new URL(file, dir)))
  const version = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path })
  if (version.error) throw new Error(version.error.message)
  console.log(`${slot}: versão ${version.data}`)
}
