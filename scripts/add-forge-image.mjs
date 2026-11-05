// Adiciona ao app uma ilustração da fila (scripts/forge-art-pending.mjs): recorta no
// tamanho do slot pelo centro, converte para WebP, envia ao S3 e registra a versão. Só
// aceita nome com prompt em docs/forge-arte.md e slot ainda sem versão; nunca substitui
// nem apaga nada. Sem login, `uploaded_by` fica vazio. Credenciais só do ambiente:
//   SUPABASE_SERVICE_ROLE_KEY=… AWS_ACCESS_KEY_ID=… AWS_SECRET_ACCESS_KEY=… AWS_REGION=… \
//     SITE_IMAGES_BUCKET=… node scripts/add-forge-image.mjs <nome> <arquivo> [--dry-run]

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { slotSize } from '../src/lib/siteImageRules.ts'
import { MAX_IMAGE_BYTES } from '../src/lib/siteImageUploadRules.ts'
import { promptsOfDoc } from './lib/forge-art.mjs'
import { putNew, s3FromEnv } from './lib/s3.mjs'

const args = process.argv.slice(2).filter((arg) => arg !== '--dry-run')
const dryRun = process.argv.includes('--dry-run')
const [name, file] = args
if (!name || !file) throw new Error('Uso: node scripts/add-forge-image.mjs <nome> <arquivo> [--dry-run]')

const doc = readFileSync(new URL('../docs/forge-arte.md', import.meta.url), 'utf8')
if (!promptsOfDoc(doc).some((item) => item.name === name)) throw new Error(`${name}: não há prompt com esse nome em docs/forge-arte.md.`)

const slot = `forge/${name}`
const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const found = await reader.from('site_image_version').select('version').eq('slot', slot).limit(1)
if (found.error) throw new Error(found.error.message)
if (found.data.length) throw new Error(`${slot}: já tem versão; nada foi enviado.`)

const { width, height } = slotSize(slot)
const original = await sharp(file).metadata()
if (original.width > original.height !== width > height) throw new Error(`${file}: ${original.width}x${original.height} não tem o formato do slot (${width}x${height}).`)

const webp = await sharp(file).resize(width, height, { fit: 'cover', position: 'centre' }).webp({ quality: 86 }).toBuffer()
if (webp.length > MAX_IMAGE_BYTES) throw new Error(`${slot}: ${webp.length} bytes passa do limite.`)

if (dryRun) {
  const preview = new URL(`./${name}.preview.webp`, new URL(`file:///${process.env.ART_PREVIEW_DIR ?? process.cwd()}/`.replace(/\\/g, '/')))
  writeFileSync(preview, webp)
  console.log(`${slot}: ${width}x${height}, ${webp.length} bytes (--dry-run: nada foi enviado; prévia em ${preview.pathname})`)
} else {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  const s3 = s3FromEnv()
  const path = `${slot}/${crypto.randomUUID()}.webp`
  await putNew(s3, path, webp)
  const supabase = createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
  const version = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path, p_width: width, p_height: height })
  if (version.error) throw new Error(`${path} foi para o S3, mas o registro falhou: ${version.error.message}`)
  console.log(`${slot}: versão ${version.data}, ${webp.length} bytes`)
}
