// Sobe as imagens de public/images/forge/ como versão 1 dos slots que ainda
// não têm versão (feito uma vez; rodar de novo não repete nada). A chave
// service_role vem do ambiente e nunca entra no repo:
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-site-images.mjs

import { readdir, readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'

const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY no ambiente.')
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
  const body = await readFile(new URL(file, dir))
  const upload = await supabase.storage.from('site-images').upload(path, body, { contentType: 'image/webp', cacheControl: '31536000' })
  if (upload.error) throw new Error(upload.error.message)
  const version = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path })
  if (version.error) throw new Error(version.error.message)
  console.log(`${slot}: versão ${version.data}`)
}
