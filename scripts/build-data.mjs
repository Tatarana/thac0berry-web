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
//   public/data/rules-index.json        índice das regras (lista e busca)
//   public/data/rules/<livro>.json      regras completas de cada livro
//   public/data/tables.json             tabelas do Table Grimoire (estruturadas + markdown)
//   public/data/books.json              livros das regras: ordem e cenário (cópia)
//   public/data/magic-index.json         índice dos itens mágicos (com resumo)
//   public/data/magic/magic_*.json       itens mágicos completos, por categoria
//   public/data/psionic-powers.json      poderes psiônicos, sem o texto bruto de wiki
//   public/data/monsters-index.json      índice leve dos monstros (ferramenta do DM), com apelidos
//   public/data/monsters/monsters_*.json monstros completos, por coleção (detalhe ao abrir)
//   public/data/library.schema.json      schema da ficha (de ../schemas), para o import
//
// Magias: priest_* e wizard_* em ordem alfabética; id repetido é descartado.
// `sample_spells.json` (62 exemplos antigos do Kelmon) fica DE FORA do
// compêndio: usa ids próprios, mas 60 repetem o NOME de magias dos arquivos
// completos, e entrariam duplicadas na lista (é o que acontece hoje no app
// iPad, cujo SpellDatabase junta os dois). Totais esperados: 1.795 / 2.608.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { unlistedBooks } from '../src/rules/books.ts'
import { buildTableIndex } from '../src/rules/tableIndex.ts'

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

// Regras: índice leve (lista e busca) + um arquivo por livro com o texto e as
// tabelas (só baixado ao abrir uma regra daquele livro).
const rules = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8'))
// Livros (ordem e cenário de campanha de cada um): thac0berry-data/data/books.json.
// Todo livro das regras precisa estar lá (senão o filtro de cenário erraria calado).
const booksFile = join(source, 'books.json')
if (!existsSync(booksFile)) {
  console.error(`Faltou ${booksFile}: atualize o thac0berry-data (books.json entrou em 2026-10-08).`)
  process.exit(1)
}
const books = JSON.parse(readFileSync(booksFile, 'utf8'))
const unlisted = unlistedBooks(books, rules.map((rule) => rule.book))
if (unlisted.length > 0) {
  console.error(`Livros das regras fora de books.json: ${unlisted.join(', ')} (thac0berry-data: scripts/build_books.py).`)
  process.exit(1)
}
copyFileSync(booksFile, join(out, 'books.json'))
mkdirSync(join(out, 'rules'), { recursive: true })
const rulesByBook = {}
const rulesIndex = rules.map((rule) => {
  ;(rulesByBook[rule.book] ??= []).push(rule)
  return {
    id: rule.id,
    book: rule.book,
    chapterNumber: rule.chapterNumber,
    chapterTitle: rule.chapterTitle,
    topic: rule.topic,
    summary: rule.summary,
    searchKeywords: rule.searchKeywords,
  }
})
writeFileSync(join(out, 'rules-index.json'), JSON.stringify(rulesIndex))
for (const [book, list] of Object.entries(rulesByBook)) {
  writeFileSync(join(out, 'rules', `${book}.json`), JSON.stringify(list))
}
console.log(`data: ${rules.length} regras em ${Object.keys(rulesByBook).length} livros`)

// Table Grimoire (docs/grimorio-de-tabelas.md): as tabelas estruturadas e as em
// markdown no texto das regras, num índice só (src/rules/tableIndex.ts).
const grimoireTables = buildTableIndex(rules, books)
writeFileSync(join(out, 'tables.json'), JSON.stringify(grimoireTables))
console.log(`data: ${grimoireTables.length} tabelas no Table Grimoire`)

// Itens mágicos: índice com o resumo (a lista do iPad mostra) + cópia dos
// arquivos por categoria (detalhe completo, baixado ao abrir um item).
mkdirSync(join(out, 'magic'), { recursive: true })
const magicIndex = []
for (const file of files.filter((f) => f.startsWith('magic_')).sort()) {
  copyFileSync(join(source, file), join(out, 'magic', file))
  for (const item of JSON.parse(readFileSync(join(source, file), 'utf8'))) {
    magicIndex.push({
      id: item.id,
      name: item.name,
      category: item.classification.broadCategory,
      books: (item.sources ?? []).map((s) => s.book).filter(Boolean),
      summary: item.description.briefSummary,
      file,
    })
  }
}
writeFileSync(join(out, 'magic-index.json'), JSON.stringify(magicIndex))
console.log(`data: ${magicIndex.length} itens mágicos`)

// Poderes psiônicos: sem o texto bruto de wiki.
const powers = JSON.parse(readFileSync(join(source, 'psionic_powers.json'), 'utf8')).map((power) => {
  const { rawWikitext: _omitido, ...description } = power.description
  return { ...power, description }
})
writeFileSync(join(out, 'psionic-powers.json'), JSON.stringify(powers))
console.log(`data: ${powers.length} poderes psiônicos`)

// Monstros (ferramenta do DM; data/monsters/ no thac0berry-data, gerado por
// scripts/build_monsters.py): índice leve com os apelidos (para a busca) e o
// resumo encurtado; os arquivos por coleção vão sem espaços (detalhe ao abrir).
const monsterSource = join(source, 'monsters')
if (existsSync(monsterSource)) {
  mkdirSync(join(out, 'monsters'), { recursive: true })
  const aliases = new Map()
  for (const file of readdirSync(monsterSource).filter((f) => f.endsWith('.json') && f !== 'monsters_index.json')) {
    const list = JSON.parse(readFileSync(join(monsterSource, file), 'utf8'))
    for (const monster of list) aliases.set(monster.id, monster.aliases ?? [])
    writeFileSync(join(out, 'monsters', file), JSON.stringify(list))
  }
  const shorten = (text) => (text && text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text)
  const monsterIndex = JSON.parse(readFileSync(join(monsterSource, 'monsters_index.json'), 'utf8')).map((entry) => ({
    ...entry,
    summary: shorten(entry.summary),
    aliases: aliases.get(entry.id) ?? [],
  }))
  writeFileSync(join(out, 'monsters-index.json'), JSON.stringify(monsterIndex))
  console.log(`data: ${monsterIndex.length} monstros`)
}

for (const file of ['deities.json', 'proficiencies.json', 'weapons.json', 'armor.json', 'mundane_items.json']) {
  copyFileSync(join(source, file), join(out, file))
  console.log(`data: ${file} (${JSON.parse(readFileSync(join(source, file), 'utf8')).length} registros)`)
}

// Schema da ficha (thac0berry-data/schemas, ao lado de data/): o import do
// backup do iPad valida cada personagem e campanha contra ele no navegador.
copyFileSync(join(source, '..', 'schemas', 'library.schema.json'), join(out, 'library.schema.json'))
console.log('data: library.schema.json')

// Regras de jogo (src/rules/): as tabelas vêm do PRÓPRIO código Swift do iPad,
// pela seção `tables` de fixtures/rules/rules-fixtures.json (gerado no CI de
// lá), mais os JSON de THAC0, saves e XP de data/. Vai para src/ (fora do git)
// porque as regras são usadas de forma síncrona na tela.
{
  const fixtures = JSON.parse(readFileSync(join(source, '..', 'fixtures', 'rules', 'rules-fixtures.json'), 'utf8'))
  const rulesData = {
    tables: fixtures.tables,
    thac0: JSON.parse(readFileSync(join(source, 'rules_thac0.json'), 'utf8')),
    savingThrows: JSON.parse(readFileSync(join(source, 'rules_saving_throws.json'), 'utf8')),
    experience: JSON.parse(readFileSync(join(source, 'rules_experience.json'), 'utf8')),
  }
  const generated = join(root, 'src', 'rules', 'generated')
  mkdirSync(generated, { recursive: true })
  writeFileSync(join(generated, 'rules-data.json'), JSON.stringify(rulesData))
  console.log(`data: src/rules/generated/rules-data.json (${Object.keys(fixtures.tables).length} tabelas)`)
}
