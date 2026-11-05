// Um passo da geração das ilustrações pelo ChatGPT no Chrome. Quem roda é um agente, que
// só executa o que este script entrega; a regra de parar fica no agente.
//   node scripts/forge-art-step.mjs next             próximo item e os JavaScripts a usar
//   node scripts/forge-art-step.mjs ingest <nome>    leva o download ao app
//   node scripts/forge-art-step.mjs wait <início>    espera até 217 s depois de <início> (ms)
// Credenciais só de ~/.thac0berry/site-images-upload.env, nunca no repo. Os originais ficam
// em ../forge-art, fora do repo.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { downloadScript, pollScript, sendScript } from './lib/forge-art.mjs'

const INTERVAL_MS = 217_000
const here = (name) => fileURLToPath(new URL(name, import.meta.url))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const [command, arg] = process.argv.slice(2)

if (command === 'next') {
  const file = join(tmpdir(), 'forge-art-queue.json')
  execFileSync(process.execPath, ['--no-warnings', here('./forge-art-pending.mjs'), '--json', file], { stdio: 'ignore' })
  const queue = JSON.parse(readFileSync(file, 'utf8'))
  if (!queue.length) {
    console.log('FILA VAZIA')
  } else {
    const item = queue[0]
    console.log(`NOME: ${item.name}\nPENDENTES: ${queue.length}\nINICIO: ${Date.now()}`)
    console.log(`--- JS_ENVIAR\n${sendScript(item.prompt)}`)
    console.log(`--- JS_ESPERAR\n${pollScript(item.kind === 'weapons')}`)
    console.log(`--- JS_BAIXAR\n${downloadScript(item.name)}`)
  }
} else if (command === 'ingest') {
  const file = join(homedir(), 'Downloads', `${arg}.png`)
  let size = -1
  for (let i = 0; i < 30; i++) {
    const now = existsSync(file) ? statSync(file).size : -1
    if (now > 0 && now === size) break
    size = now
    await sleep(1000)
  }
  if (size <= 0) throw new Error(`${file}: o download não chegou.`)
  process.loadEnvFile(join(homedir(), '.thac0berry', 'site-images-upload.env'))
  const output = execFileSync(process.execPath, ['--no-warnings', here('./add-forge-image.mjs'), arg, file], { encoding: 'utf8' })
  const keep = here('../../forge-art')
  mkdirSync(keep, { recursive: true })
  renameSync(file, join(keep, `${arg}.png`))
  console.log(`OK ${output.trim()}`)
} else if (command === 'wait') {
  await sleep(Math.max(0, Number(arg) + INTERVAL_MS - Date.now()))
  console.log('PRONTO')
} else {
  throw new Error('Uso: next | ingest <nome> | wait <início>')
}
