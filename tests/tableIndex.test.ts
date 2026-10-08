// Table Grimoire (src/rules/tableIndex.ts): índice das tabelas e busca.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { buildTableIndex, filterTables, markdownTables, splitTableTitle, tableLabel, type SourceRule } from '../src/rules/tableIndex.ts'

const rule = (id: string, book: string, content: string, tables: SourceRule['tables'] = []): SourceRule => ({
  id,
  book,
  chapterNumber: 1,
  chapterTitle: 'Chapter',
  topic: `Topic ${id}`,
  content,
  tables,
})

test('título: número e nome; "Table" sozinho fica sem título', () => {
  assert.deepEqual(splitTableTitle('Table 84: Treasure Types'), { number: '84', title: 'Treasure Types' })
  assert.deepEqual(splitTableTitle('**Table 61: Experience Levels (1st Edition)**'), { number: '61', title: 'Experience Levels (1st Edition)' })
  assert.deepEqual(splitTableTitle('Table', ''), { number: null, title: '' })
  assert.deepEqual(splitTableTitle('Standard Costs to Manufacture Armor'), { number: null, title: 'Standard Costs to Manufacture Armor' })
})

test('markdown: título em negrito acima, linhas completadas, cabeçalho em duas linhas', () => {
  const content = [
    'Texto antes.',
    '',
    '**Table 62: Attacks Per Round**',
    '| Level | Attacks |',
    '| --- | --- |',
    '| 1-7 | 1/1 |',
    '| 8-14 |',
    '',
    '|  | Spell Level | Spell Level |',
    '| --- | --- | --- |',
    '| Level | 1 | 2 |',
    '| --- | --- | --- |',
    '| 8 | 1 | — |',
  ].join('\n')
  const [first, second] = markdownTables(content)
  assert.equal(first.title, '**Table 62: Attacks Per Round**'.replace(/\*/g, ''))
  assert.deepEqual(first.headers, ['Level', 'Attacks'])
  assert.deepEqual(first.rows, [['1-7', '1/1'], ['8-14', '']])
  assert.equal(second.title, '')
  assert.deepEqual(second.headers, ['Level', 'Spell Level: 1', 'Spell Level: 2'])
  assert.deepEqual(second.rows, [['8', '1', '—']])
})

test('índice: estruturadas e markdown, repetidas viram "alsoIn", ids estáveis', () => {
  const table = { tableNumber: 'Table 84', title: 'Table 84: Treasure Types', headers: ['Type', 'Gold'], rows: [['A', '1d6']] }
  const index = buildTableIndex([
    rule('dmg_a', 'DMG', '', [table]),
    rule('dmg_b', 'DMG', '', [table]),
    rule('dsc_a', 'DSC', '| Roll | Result |\n| --- | --- |\n| 1 | Wind |'),
  ])
  assert.deepEqual(index.map((t) => [t.id, t.setting, tableLabel(t)]), [
    ['dmg-84', 'Core', 'Table 84: Treasure Types'],
    ['dsc_a-1', 'Dark Sun', 'Topic dsc_a'],
  ])
  assert.deepEqual(index[0].alsoIn, ['dmg_b'])
})

test('busca: número exato primeiro, depois título, depois conteúdo; filtros de livro e cenário', () => {
  const index = buildTableIndex([
    rule('dmg_a', 'DMG', '', [{ tableNumber: 'Table 88', title: 'Table 88: Magical Items', headers: ['D100 Roll', 'Category'], rows: [['01-20', 'Potions']] }]),
    rule('phb_a', 'PHB', '', [{ tableNumber: 'Table 8', title: 'Table 8: Potions of Note', headers: ['Roll'], rows: [['88']] }]),
    rule('dsc_a', 'DSC', '**Table 3: Winds**\n| Roll | Result |\n| --- | --- |\n| 1 | potions storm |'),
  ])
  const order = ['PHB', 'DMG', 'DSC']
  assert.deepEqual(filterTables(index, { query: '88', book: null, setting: null, chapter: null }, order).map((t) => t.id), ['dmg-88', 'phb-8'])
  assert.deepEqual(filterTables(index, { query: 'potions', book: null, setting: null, chapter: null }, order).map((t) => t.id), ['phb-8', 'dmg-88', 'dsc-3'])
  assert.deepEqual(filterTables(index, { query: '', book: null, setting: 'Dark Sun', chapter: null }, order).map((t) => t.id), ['dsc-3'])
  assert.deepEqual(filterTables(index, { query: '', book: 'DMG', setting: null, chapter: null }, order).map((t) => t.id), ['dmg-88'])
})

test('dados reais: todas as tabelas com id único e cabeçalho', () => {
  // Mesma origem do build: $DATA_DIR ou ../thac0berry-data/data.
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const index = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')))
  assert.ok(index.length > 500)
  assert.equal(new Set(index.map((t) => t.id)).size, index.length)
  assert.ok(index.every((t) => t.headers.length > 0 && t.title !== ''))
  assert.ok(index.some((t) => t.id === 'dmg-88'))
})

test('título com número romano (CPsiH): "Table II: Clairsentience"', () => {
  assert.deepEqual(splitTableTitle('Table II: Clairsentience'), { number: 'II', title: 'Clairsentience' })
  // "Table" seguido de palavra comum não vira número.
  assert.deepEqual(splitTableTitle('Table Illusions'), { number: null, title: 'Table Illusions' })
})
