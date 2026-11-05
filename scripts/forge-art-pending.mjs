// Lista as ilustrações do The Forge que ainda faltam, com o prompt de cada uma.
// Só lê: compara docs/forge-arte.md com as versões atuais (tabela
// site_image_version, pela chave pública) e os arquivos de public/images/forge/.
//   node scripts/forge-art-pending.mjs            resumo
//   node scripts/forge-art-pending.mjs --json a.json   fila completa, na ordem de geração

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { pendingArt, promptsOfDoc } from './lib/forge-art.mjs'

const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const done = new Set()
const page = 1000
for (let from = 0; ; from += page) {
  const { data, error } = await reader.from('site_image_version').select('slot').eq('is_current', true).order('slot').range(from, from + page - 1)
  if (error) throw new Error(error.message)
  for (const row of data) done.add(row.slot.replace(/^forge\//, ''))
  if (data.length < page) break
}
const dir = new URL('../public/images/forge/', import.meta.url)
if (existsSync(dir)) for (const file of readdirSync(dir)) done.add(file.replace(/\.webp$/, ''))

// O modron tem as duas versões de gênero no lugar da imagem única do documento.
if (done.has('race-modron-male')) done.add('race-modron')

const prompts = promptsOfDoc(readFileSync(new URL('../docs/forge-arte.md', import.meta.url), 'utf8'))
const queue = pendingArt(prompts, done)

const count = {}
for (const item of queue) count[item.kind] = (count[item.kind] ?? 0) + 1
console.log(`${queue.length} pendentes de ${prompts.length} com prompt:`, count)
const out = process.argv.indexOf('--json')
if (out >= 0) {
  writeFileSync(process.argv[out + 1], JSON.stringify(queue, null, 2))
  console.log(`fila gravada em ${process.argv[out + 1]}`)
} else {
  for (const item of queue.slice(0, 10)) console.log(`  ${item.name}`)
}
