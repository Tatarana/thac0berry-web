// Tabelas do mestre (src/rules/dmTables.ts; GT5).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDice } from '../src/rules/dice.ts'
import * as D from '../src/rules/dmTables.ts'
import { findRow, rollPlan } from '../src/rules/tableRoll.ts'

const table = (dice: string, rows: string[][], title = 'Forest') => ({ title, dice, headers: ['Roll', 'Encounter'], rows })

test('a tabela do mestre rola com o mesmo motor (o dado vai no primeiro cabeçalho)', () => {
  const t = D.asGrimoireTable('abc', table('1d8+1d12', Array.from({ length: 19 }, (_, i) => [String(i + 2), `E${i + 2}`])), 'Neverwinter')
  assert.equal(t.id, 'dm-abc')
  assert.equal(t.book, D.DM_BOOK)
  assert.equal(t.chapterTitle, 'Neverwinter')
  assert.equal(t.headers[0], 'd8+d12 Roll')
  const plan = rollPlan(t)!
  assert.equal(formatDice(plan.dice!), 'd8+d12')
  assert.equal(t.rows[findRow(plan, 11)][1], 'E11')
  // Sem dado: só consulta.
  assert.equal(rollPlan(D.asGrimoireTable('x', table('', [['1', 'a'], ['2', 'b']]), ''))!.dice, null)
})

test('avisos do editor: título, dado, faixa inválida, buraco, sobreposição, fora do dado', () => {
  assert.deepEqual(D.dmTableProblems(table('d4', [['1', 'a'], ['2-3', 'b'], ['4', 'c']])), [])
  assert.deepEqual(D.dmTableProblems(table('d20', [['1-10', 'a'], ['11+', 'b']])), [])
  assert.match(D.dmTableProblems(table('d4', [['1', 'a']], ' ')).join(' | '), /Give the table a title/)
  assert.match(D.dmTableProblems(table('dx', [['1', 'a']])).join(' | '), /not a die/)
  assert.match(D.dmTableProblems(table('d6', [['1', 'a'], ['two', 'b']])).join(' | '), /Row 2: the first column/)
  assert.match(D.dmTableProblems(table('d6', [['1-2', 'a'], ['5-6', 'b']])).join(' | '), /No row for 3–4/)
  assert.match(D.dmTableProblems(table('d6', [['1-4', 'a'], ['3-6', 'b']])).join(' | '), /overlap around 3/)
  assert.match(D.dmTableProblems(table('d6', [['1-3', 'a'], ['4-5', 'b']])).join(' | '), /No row for 6 \(d6 goes up to 6\)/)
  assert.match(D.dmTableProblems(table('2d6', [['1-12', 'a']])).join(' | '), /outside 2d6/)
  assert.deepEqual(D.dmTableProblems(D.emptyDmTable()).filter((p) => !/title/.test(p)), [])
})

test('copiar uma tabela de livro: título, dado do Roll, cabeçalho sem a notação, linhas e a origem', () => {
  const book = {
    id: 'dmg-54', book: 'DMG', setting: 'Core', number: '54', title: '2-20 Encounter Table', chapterNumber: 11, chapterTitle: 'Encounters',
    ruleID: 'r', ruleTopic: 't', headers: ['Dice Roll (1d8+1d12)', 'Frequency'],
    rows: Array.from({ length: 19 }, (_, i) => [String(i + 2), i < 3 ? 'Very rare' : 'Common']), alsoIn: [],
  }
  const copy = D.fromBookTable(book, 'DMG Table 54')
  assert.equal(copy.title, '2-20 Encounter Table')
  assert.equal(copy.dice, 'd8+d12')
  assert.deepEqual(copy.headers, ['Dice Roll', 'Frequency'])
  assert.equal(copy.rows.length, 19)
  assert.equal(copy.source, 'DMG Table 54')
  assert.deepEqual(D.dmTableProblems(copy), [])
  // Copiada, rola igual ao livro.
  assert.equal(formatDice(rollPlan(D.asGrimoireTable('c', copy, 'X'))!.dice!), 'd8+d12')
  // A cópia é independente: mudar a cópia não muda o livro.
  copy.rows[0][1] = 'mudei'
  assert.equal(book.rows[0][1], 'Very rare')
})
