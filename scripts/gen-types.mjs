// Gera src/types/library.ts a partir de schemas/library.schema.json do repo
// thac0berry-data (formato da ficha de personagem, gerado dos modelos Swift
// do iPad). O arquivo gerado fica no git; o CI roda com --check e falha se
// ele não bater com o schema.
//
// Origem: $SCHEMA_DIR ou ../thac0berry-data/schemas.
// Uso: npm run types            (grava)
//      npm run types -- --check (só compara)
//
// Cobre só o subconjunto de JSON Schema que o gerador do iPad produz:
// object/required/properties, $ref, enum de texto, array, mapa
// (additionalProperties), anyOf com null e listas de tipos.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const schemaDir = resolve(process.env.SCHEMA_DIR ?? join(root, '..', 'thac0berry-data', 'schemas'))
const out = join(root, 'src', 'types', 'library.ts')
const schema = JSON.parse(readFileSync(join(schemaDir, 'library.schema.json'), 'utf8'))

const typeName = (defName) => defName.replace(/\./g, '')
const scalar = { string: 'string', integer: 'number', number: 'number', boolean: 'boolean', null: 'null' }

function tsType(node, indent) {
  if (node.$ref) return typeName(node.$ref.replace('#/$defs/', ''))
  if (node.anyOf) return node.anyOf.map((n) => tsType(n, indent)).join(' | ')
  if (node.enum) return node.enum.map((v) => JSON.stringify(v)).join(' | ')
  if (Array.isArray(node.type)) return node.type.map((t) => scalar[t]).join(' | ')
  if (node.type === 'array') {
    const item = tsType(node.items, indent)
    return /[ |]/.test(item) ? `(${item})[]` : `${item}[]`
  }
  if (node.type === 'object' && node.properties) return objectBody(node, indent)
  if (node.type === 'object' && node.additionalProperties) {
    return `Record<string, ${tsType(node.additionalProperties, indent)}>`
  }
  if (scalar[node.type]) return scalar[node.type]
  throw new Error(`tipo não suportado: ${JSON.stringify(node).slice(0, 120)}`)
}

function doc(node, indent) {
  if (!node.description) return ''
  return `${indent}/** ${node.description.replace(/\*\//g, '* /')} */\n`
}

function objectBody(node, indent) {
  const required = new Set(node.required ?? [])
  const inner = indent + '  '
  const lines = Object.entries(node.properties).map(([key, prop]) => {
    const optional = required.has(key) ? '' : '?'
    return `${doc(prop, inner)}${inner}${key}${optional}: ${tsType(prop, inner)}`
  })
  return `{\n${lines.join('\n')}\n${indent}}`
}

const header = `// GERADO por scripts/gen-types.mjs a partir de thac0berry-data/schemas/library.schema.json.
// Não edite à mão: mude o modelo Swift no iPad, gere o schema lá e rode \`npm run types\`.
//
// Convenções do formato (ver schemas/README.md no thac0berry-data):
// - Datas: ISO-8601 sem fração de segundo ("2026-10-05T12:00:00Z"); \`toISOString()\`
//   grava ".000Z", que o iPad recusa.
// - UUID em texto; binários (desenhos, retrato) em base64.
// - Campo opcional (\`?\`) ausente = nil no Swift. Campo obrigatório precisa ir sempre,
//   mesmo com o valor padrão, ou o iPad descarta o personagem inteiro.
`

const blocks = Object.entries(schema.$defs).map(([name, def]) => {
  const ts = def.type === 'object' && def.properties ? `export interface ${typeName(name)} ${objectBody(def, '')}` : `export type ${typeName(name)} = ${tsType(def, '')}`
  return `${doc(def, '')}${ts}`
})
const library = `${doc(schema, '')}export interface Library ${objectBody(schema, '')}`
const text = `${header}\n${[library, ...blocks].join('\n\n')}\n`

if (process.argv.includes('--check')) {
  let current = null
  try {
    current = readFileSync(out, 'utf8')
  } catch {
    // arquivo ainda não existe
  }
  if (current !== text) {
    console.error('src/types/library.ts não bate com library.schema.json: rode npm run types')
    process.exit(1)
  }
  console.log('OK src/types/library.ts')
} else {
  writeFileSync(out, text)
  console.log(`gravado ${out}`)
}
