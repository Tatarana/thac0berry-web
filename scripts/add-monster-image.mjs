// Publica a ilustração de um monstro: WebP no tamanho do slot, envio ao S3 e registro da
// versão. Só aceita id que exista nos dados e slot ainda sem versão; nunca substitui nem
// apaga nada. Credenciais só de ~/.thac0berry/monster-art-upload.env, nunca no repo.
//   node scripts/add-monster-image.mjs <id> <arquivo> [--dry-run]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { monsterSlot, slotSize } from '../src/lib/siteImageRules.ts'
import { MAX_IMAGE_BYTES } from '../src/lib/siteImageUploadRules.ts'
import { putNew, s3FromEnv } from './lib/s3.mjs'

const dryRun = process.argv.includes('--dry-run')
const [id, file] = process.argv.slice(2).filter((arg) => arg !== '--dry-run')
if (!id || !file) throw new Error('Uso: node scripts/add-monster-image.mjs <id> <arquivo> [--dry-run]')

const data = process.env.DATA_DIR ?? fileURLToPath(new URL('../../thac0berry-data/data', import.meta.url))
const folder = join(data, 'monsters')
const known = readdirSync(folder)
  .filter((name) => /^monsters_.*\.json$/.test(name) && name !== 'monsters_index.json')
  .some((name) => {
    const list = JSON.parse(readFileSync(join(folder, name), 'utf8'))
    return (Array.isArray(list) ? list : list.monsters).some((m) => m.id === id)
  })
if (!known) throw new Error(`${id}: não existe nos dados de monstros.`)

const slot = monsterSlot(id)
const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const found = await reader.from('site_image_version').select('version').eq('slot', slot).limit(1)
if (found.error) throw new Error(found.error.message)
if (found.data.length) throw new Error(`${slot}: já tem versão; nada foi enviado.`)

const { width, height } = slotSize(slot)
const original = await sharp(file).metadata()
if (original.width <= original.height) throw new Error(`${file}: ${original.width}x${original.height} não está em paisagem.`)

const webp = await sharp(file).resize(width, height, { fit: 'cover', position: 'centre' }).webp({ quality: 86 }).toBuffer()
if (webp.length > MAX_IMAGE_BYTES) throw new Error(`${slot}: ${webp.length} bytes passa do limite.`)

if (dryRun) {
  writeFileSync(join(process.cwd(), `${id}.preview.webp`), webp)
  console.log(`${slot}: ${width}x${height}, ${webp.length} bytes (--dry-run: nada foi enviado)`)
} else {
  process.loadEnvFile(join(homedir(), '.thac0berry', 'monster-art-upload.env'))
  const s3 = s3FromEnv()
  const path = `${slot}/${crypto.randomUUID()}.webp`
  await putNew(s3, path, webp)
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const version = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path, p_width: width, p_height: height })
  if (version.error) throw new Error(`${path} foi para o S3, mas o registro falhou: ${version.error.message}`)
  console.log(`${slot}: versão ${version.data}, ${webp.length} bytes`)
}
