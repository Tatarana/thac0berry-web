// Gera public/data/ a partir do repo thac0berry-data (fonte única dos dados).
// Roda sozinho antes de `npm run dev` e `npm run build` (predev/prebuild).
//
// Origem: $DATA_DIR ou ../thac0berry-data/data (clone ao lado deste repo).
// Saída (fora do git, ver .gitignore):
//   public/data/spells/<arquivo>.json   cópia dos arquivos de magias (detalhe)
//   public/data/spells-index.json       índice leve para a lista e a busca
//   public/data/kits-<grupo>.json       kits por grupo de classe (Priest, Wizard,
//                                       Warrior, Rogue), sem o texto bruto de wiki
//   public/data/deities.json            divindades (cópia)
//   public/data/proficiencies.json      proficiências (cópia)
//   public/data/weapons.json, armor.json, mundane_items.json   equipamento (cópia)
//
// Magias: priest_* e wizard_* em ordem alfabética; id repetido é descartado.
// `sample_spells.json` (62 exemplos antigos do Kelmon) fica DE FORA do
// compêndio: usa ids próprios, mas 60 repetem o NOME de magias dos arquivos
// completos, e entrariam duplicadas na lista (é o que acontece hoje no app
// iPad, cujo SpellDatabase junta os dois). Totais esperados: 1.795 / 2.608.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(process.env.DATA_DIR ?? join(root, '..', 'thac0berry-data', 'data'))
const out = join(root, 'public', 'data')

if (!existsSync(source)) {
  console.error(`Dados não encontrados em ${source}.`)
  console.error('Clone ao lado deste repo: git clone https://github.com/Tatarana/thac0berry-data.git')
  console.error('ou aponte DATA_DIR para a pasta data/ do thac0berry-data.')
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'spells'), { recursive: true })

const files = readdirSync(source).filter((f) => f.endsWith('.json'))
const spellFiles = files.filter((f) => f.startsWith('priest_') || f.startsWith('wizard_')).sort()

const seen = new Set()
const index = { divine: [], arcane: [] }

for (const file of spellFiles) {
  copyFileSync(join(source, file), join(out, 'spells', file))
  const spells = JSON.parse(readFileSync(join(source, file), 'utf8'))
  for (const spell of spells) {
    if (seen.has(spell.id)) continue
    seen.add(spell.id)
    index[spell.caster].push({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school,
      spheres: spell.spheres ?? [],
      schools: spell.schools ?? [],
      setting: spell.setting ?? null,
      file,
    })
  }
}

writeFileSync(join(out, 'spells-index.json'), JSON.stringify(index))
console.log(`data: ${index.divine.length} magias de sacerdote, ${index.arcane.length} de mago (${spellFiles.length} arquivos)`)

// Kits: um arquivo por grupo de classe; `description.rawWikitext` (~1,9 MB no
// total) fica de fora porque nenhuma tela usa.
const kits = JSON.parse(readFileSync(join(source, 'kits.json'), 'utf8'))
const kitGroups = {}
for (const kit of kits) {
  const group = kit.classEligibility.classGroup
  const { rawWikitext: _omitido, ...description } = kit.description
  ;(kitGroups[group] ??= []).push({ ...kit, description })
}
for (const [group, list] of Object.entries(kitGroups)) {
  writeFileSync(join(out, `kits-${group.toLowerCase()}.json`), JSON.stringify(list))
}
console.log(`data: ${kits.length} kits (${Object.entries(kitGroups).map(([g, l]) => `${g} ${l.length}`).join(', ')})`)

for (const file of ['deities.json', 'proficiencies.json', 'weapons.json', 'armor.json', 'mundane_items.json']) {
  copyFileSync(join(source, file), join(out, file))
  console.log(`data: ${file} (${JSON.parse(readFileSync(join(source, file), 'utf8')).length} registros)`)
}
