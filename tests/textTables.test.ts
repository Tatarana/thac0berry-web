// Tabelas em markdown nos campos de texto longo (src/rules/textTables.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitCells, splitTextTables } from '../src/rules/textTables.ts'

test('texto sem tabela volta inteiro, intacto', () => {
  const text = '## Combat\nLinha 1\nLinha 2 | com barra no meio'
  assert.deepEqual(splitTextTables(text), [{ kind: 'text', text }])
})

test('tabela no meio do texto: texto, tabela e texto', () => {
  const parts = splitTextTables('Roll below.\n| D100 | Result |\n| --- | --- |\n| 01-50 | Yes |\n| 51-00 | No |\nAfter text.')
  assert.equal(parts.length, 3)
  assert.deepEqual(parts[0], { kind: 'text', text: 'Roll below.' })
  assert.deepEqual(parts[1], {
    kind: 'table',
    table: { tableNumber: '', title: '', headers: ['D100', 'Result'], rows: [['01-50', 'Yes'], ['51-00', 'No']] },
  })
  assert.deepEqual(parts[2], { kind: 'text', text: 'After text.' })
})

test('negrito logo acima vira o título da tabela e sai do texto', () => {
  const parts = splitTextTables('**Table 5: Odds**\n| A | B |\n| --- | --- |\n| 1 | 2 |')
  assert.equal(parts.length, 1)
  assert.equal(parts[0].kind === 'table' && parts[0].table.title, 'Table 5: Odds')
  assert.equal(parts[0].kind === 'table' && parts[0].table.tableNumber, '5')
})

test('cabeçalho mais largo ou mais estreito que as linhas: completa com células vazias', () => {
  const wide = splitTextTables('| A | B | C |\n| --- | --- | --- |\n| 1 |\n| 2 | 3 |')[0]
  assert.deepEqual(wide.kind === 'table' && wide.table.rows, [['1', '', ''], ['2', '3', '']])
  const narrow = splitTextTables('| A |\n| --- |\n| 1 | 2 | 3 |')[0]
  assert.deepEqual(narrow.kind === 'table' && narrow.table.headers, ['A', '', ''])
})

test('sem linha de separador não é tabela: fica como texto', () => {
  const text = 'Intro\n| a | b |\n| 1 | 2 |'
  assert.deepEqual(splitTextTables(text), [{ kind: 'text', text }])
})

test('linha "---" logo no começo: tabela sem cabeçalho', () => {
  const part = splitTextTables('| --- | --- |\n| Roll | 1d6 |\n| Time | 2 |')[0]
  assert.equal(part.kind, 'table')
  if (part.kind === 'table') {
    assert.deepEqual(part.table.headers, ['', ''])
    assert.deepEqual(part.table.rows, [['Roll', '1d6'], ['Time', '2']])
  }
})

test('barra escapada fica dentro da célula', () => {
  assert.deepEqual(splitCells('| a \\| b | c |'), ['a | b', 'c'])
  const part = splitTextTables('| X | Y |\n| --- | --- |\n| 1d6 \\| 1d8 | z |')[0]
  assert.deepEqual(part.kind === 'table' && part.table.rows, [['1d6 | 1d8', 'z']])
})

test('duas tabelas no mesmo texto e linha de células vazias some', () => {
  const parts = splitTextTables('| A |\n| --- |\n| 1 |\n|  |\ntexto\n| B |\n| --- |\n| 2 |')
  assert.deepEqual(parts.map((p) => p.kind), ['table', 'text', 'table'])
  assert.deepEqual(parts[0].kind === 'table' && parts[0].table.rows, [['1']])
})
