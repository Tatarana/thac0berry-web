// Publica a ilustração de um slot de arte: WebP no tamanho do slot, envio ao S3 e registro da
// versão. Só aceita id que exista nos dados (monstros ou divindades/heróis) e, por padrão, slot
// ainda sem versão; nunca apaga nada. Com --new-version, ACRESCENTA uma versão a um slot que já
// tem (a antiga continua no histórico e pode voltar a ser a atual pelo lápis de admin).
// Credenciais só de ~/.thac0berry/monster-art-upload.env, nunca no repo.
//   node scripts/add-site-art.mjs <monster|deity> <id> <arquivo> [--dry-run] [--new-version]
// Divindade e herói usam o mesmo slot deity/<id>. DATA_DIR aponta para thac0berry-data/data
// quando o repo está num worktree (o padrão é a pasta irmã do repo).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../src/config.ts'
import { deitySlot, monsterSlot, slotSize } from '../src/lib/siteImageRules.ts'
import { MAX_IMAGE_BYTES } from '../src/lib/siteImageUploadRules.ts'
import { putNew, s3FromEnv } from './lib/s3.mjs'

const flags = ['--dry-run', '--new-version']
const dryRun = process.argv.includes('--dry-run')
const newVersion = process.argv.includes('--new-version')
const [kind, id, file] = process.argv.slice(2).filter((arg) => !flags.includes(arg))
const usage = 'Uso: node scripts/add-site-art.mjs <monster|deity> <id> <arquivo> [--dry-run] [--new-version]'
if (!['monster', 'deity'].includes(kind) || !id || !file) throw new Error(usage)

const data = process.env.DATA_DIR ?? fileURLToPath(new URL('../../thac0berry-data/data', import.meta.url))

function knownMonster() {
  const folder = join(data, 'monsters')
  return readdirSync(folder)
    .filter((name) => /^monsters_.*\.json$/.test(name) && name !== 'monsters_index.json')
    .some((name) => {
      const list = JSON.parse(readFileSync(join(folder, name), 'utf8'))
      return (Array.isArray(list) ? list : list.monsters).some((m) => m.id === id)
    })
}

function knownDeity() {
  const list = JSON.parse(readFileSync(join(data, 'deities.json'), 'utf8'))
  return (Array.isArray(list) ? list : list.deities).some((d) => d.id === id)
}

if (!(kind === 'monster' ? knownMonster() : knownDeity())) {
  throw new Error(`${id}: não existe nos dados de ${kind === 'monster' ? 'monstros' : 'divindades'} (${data}).`)
}

const slot = kind === 'monster' ? monsterSlot(id) : deitySlot(id)
const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const found = await reader.from('site_image_version').select('version').eq('slot', slot).limit(1)
if (found.error) throw new Error(found.error.message)
if (found.data.length && !newVersion) throw new Error(`${slot}: já tem versão; nada foi enviado (use --new-version para acrescentar outra).`)
if (!found.data.length && newVersion) console.log(`${slot}: ainda não tem versão; --new-version vale como a primeira.`)

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
  try {
    await putNew(s3, path, webp)
  } catch (e) {
    if (/HTTP 403|AccessDenied/.test(String(e.message))) {
      throw new Error(`${slot}: the upload user is not allowed to write ${kind}/*; extend its IAM policy. (${e.message})`)
    }
    throw e
  }
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const version = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path, p_width: width, p_height: height })
  if (version.error) throw new Error(`${path} foi para o S3, mas o registro falhou: ${version.error.message}`)
  console.log(`${slot}: versão ${version.data}, ${webp.length} bytes`)
}