// Tabelas rápidas do Combat Tracker (src/rules/quickTables.ts).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { defaultQuickTables, quickTableIDs, quickTableLabel, resolveQuickTables, toggleQuickTable } from '../src/rules/quickTables.ts'
import { buildTableIndex } from '../src/rules/tableIndex.ts'

test('lista do DM: padrão, tirar, pôr e voltar ao padrão', () => {
  assert.equal(quickTableIDs(null), defaultQuickTables)
  const without = toggleQuickTable(null, 'dmg-36')
  assert.ok(without && !without.includes('dmg-36'))
  const withCfh = toggleQuickTable(without, 'cfh-12')
  assert.equal(withCfh?.at(-1), 'cfh-12')
  // Tirar o que pôs e devolver o que tirou: igual à padrão de novo? Só se a ordem também for a mesma.
  assert.equal(toggleQuickTable(toggleQuickTable(null, 'cfh-12'), 'cfh-12'), null)
})

test('rótulos: curtos nas padrão; título dos dados nas outras (com o livro, fora do DMG)', () => {
  assert.equal(quickTableLabel({ id: 'dmg-35', book: 'DMG', number: '35', title: 'Combat Modifiers' }), '35 Combat mods')
  assert.equal(quickTableLabel({ id: 'dmg-84', book: 'DMG', number: '84', title: 'Gems' }), '84 Gems')
  assert.equal(quickTableLabel({ id: 'cfh-12', book: 'CFH', number: '12', title: 'Fighter Kits' }), 'CFH 12 Fighter Kits')
  assert.equal(quickTableLabel({ id: 'dmg-x', book: 'DMG', number: null, title: 'Sem número' }), 'Sem número')
})

test('dados reais: todas as tabelas da lista padrão existem', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
  const resolved = resolveQuickTables(defaultQuickTables, tables)
  assert.deepEqual(resolved.map((t) => t.id), defaultQuickTables)
  assert.deepEqual(resolveQuickTables(['dmg-35', 'nope-1'], tables).map((t) => t.id), ['dmg-35'])
})
