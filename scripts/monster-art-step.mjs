// Um passo da geração das ilustrações de monstros pelo ChatGPT no Chrome. Quem roda é um
// agente, que só executa o que este script entrega. Cada bloco tem no máximo 50 imagens e o
// usuário valida antes do próximo; os prompts e os originais ficam em ../forge-art/monsters.
//   node scripts/monster-art-step.mjs next <bloco>            próximo item e os JavaScripts
//   node scripts/monster-art-step.mjs ingest <id>             leva o download a forge-art
//   node scripts/monster-art-step.mjs skip <bloco> <id> <por> marca um item que não saiu
//   node scripts/monster-art-step.mjs sheet <saída.jpg> <ids> folha para a conferência
//   node scripts/monster-art-step.mjs publish <ids>           publica os conferidos
//   node scripts/monster-art-step.mjs wait <início>           espera até 217 s depois do início

import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { downloadScript, sendScript } from './lib/forge-art.mjs'

const INTERVAL_MS = 217_000
const MAX_BLOCK = 50
const ART = fileURLToPath(new URL('../../forge-art/monsters', import.meta.url))
const STYLE =
  'Create one wide landscape image, 3:2 aspect ratio, horizontal format. Fantasy illustration in traditional ink and watercolor, confident hand-drawn ink lines, visible paper grain, the mood of a classic 1990s AD&D Monstrous Manual plate, no text, no letters, no border, no watermark.'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const png = (id) => join(ART, `${id}.png`)
const skipsFile = (block) => join(ART, `${block}.skips.json`)
const skips = (block) => (existsSync(skipsFile(block)) ? JSON.parse(readFileSync(skipsFile(block), 'utf8')) : {})
const prompt = (m) => `${STYLE} Subject: ${m.subject} ${m.accuracy} Scale: ${m.scale} Setting: ${m.setting} Not a static portrait pose.`

function pending(block) {
  const list = JSON.parse(readFileSync(join(ART, `${block}.json`), 'utf8'))
  if (list.length > MAX_BLOCK) throw new Error(`${block}: ${list.length} itens, o máximo é ${MAX_BLOCK}.`)
  const skipped = skips(block)
  return list.filter((m) => !skipped[m.id] && !existsSync(png(m.id)))
}

const [command, ...args] = process.argv.slice(2)

if (command === 'next') {
  const queue = pending(args[0])
  if (!queue.length) {
    console.log('BLOCO COMPLETO')
  } else {
    const item = queue[0]
    console.log(`ID: ${item.id}\nPENDENTES: ${queue.length}\nINICIO: ${Date.now()}`)
    console.log(`--- JS_ENVIAR\n${sendScript(prompt(item))}`)
    console.log(`--- JS_BAIXAR\n${downloadScript(`monster-${item.id}`)}`)
  }
} else if (command === 'ingest') {
  const file = join(homedir(), 'Downloads', `monster-${args[0]}.png`)
  let size = -1
  for (let i = 0; i < 30; i++) {
    const now = existsSync(file) ? statSync(file).size : -1
    if (now > 0 && now === size) break
    size = now
    await sleep(1000)
  }
  if (size <= 0) throw new Error(`${file}: o download não chegou.`)
  // Downloads e forge-art podem estar em discos diferentes, onde rename falha.
  copyFileSync(file, png(args[0]))
  unlinkSync(file)
  console.log(`OK ${args[0]} ${size}`)
} else if (command === 'skip') {
  const [block, id, ...reason] = args
  writeFileSync(skipsFile(block), `${JSON.stringify({ ...skips(block), [id]: reason.join(' ') }, null, 2)}\n`)
  console.log(`PULADO ${id}`)
} else if (command === 'sheet') {
  const [out, ...ids] = args
  const sharp = createRequire(import.meta.url)('sharp')
  const [w, h, cols] = [760, 507, 2]
  const layers = await Promise.all(
    ids.map(async (id, i) => ({
      input: await sharp(png(id)).resize(w, h).toBuffer(),
      left: (i % cols) * w,
      top: Math.floor(i / cols) * h,
    })),
  )
  const canvas = { width: cols * w, height: Math.ceil(ids.length / cols) * h, channels: 3, background: '#000' }
  await sharp({ create: canvas }).composite(layers).jpeg({ quality: 82 }).toFile(out)
  console.log(`FOLHA ${out}`)
} else if (command === 'publish') {
  const script = fileURLToPath(new URL('./add-monster-image.mjs', import.meta.url))
  for (const id of args) {
    console.log(execFileSync(process.execPath, ['--no-warnings', script, id, png(id)], { encoding: 'utf8' }).trim())
  }
} else if (command === 'wait') {
  await sleep(Math.max(0, Number(args[0]) + INTERVAL_MS - Date.now()))
  console.log('PRONTO')
} else {
  throw new Error('Uso: next <bloco> | ingest <id> | skip <bloco> <id> <motivo> | sheet <saída> <ids> | publish <ids> | wait <início>')
}
