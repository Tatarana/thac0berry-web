// Motor de dados (src/rules/dice.ts) e rolagem/consulta de tabelas (src/rules/tableRoll.ts).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { diceForRange, formatDice, parseDice, rollDice } from '../src/rules/dice.ts'
import { buildTableIndex } from '../src/rules/tableIndex.ts'
import { findRow, parseRange, rollPlan, rowRefs, tableRefs, typedResult } from '../src/rules/tableRoll.ts'

/** Gerador fixo: devolve os valores na ordem (cada um em [0, 1)). */
const fixed = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

test('notação: d100, d%, 2d10, 3d6+2, 1d6-1; inválida = null', () => {
  assert.deepEqual(parseDice('d100'), { count: 1, sides: 100, modifier: 0 })
  assert.deepEqual(parseDice('D%'), { count: 1, sides: 100, modifier: 0 })
  assert.deepEqual(parseDice('2d10'), { count: 2, sides: 10, modifier: 0 })
  assert.deepEqual(parseDice(' 3d6 + 2 '), { count: 3, sides: 6, modifier: 2 })
  assert.deepEqual(parseDice('1d6-1'), { count: 1, sides: 6, modifier: -1 })
  assert.equal(parseDice('Level'), null)
  assert.equal(parseDice('0d6'), null)
  assert.equal(formatDice({ count: 1, sides: 100, modifier: 0 }), 'd100')
  assert.equal(formatDice({ count: 2, sides: 6, modifier: -1 }), '2d6-1')
})

test('rolar: cada dado de 1 a N, soma com modificador', () => {
  const r = rollDice({ count: 3, sides: 6, modifier: 2 }, fixed(0, 0.5, 0.999))
  assert.deepEqual(r.dice, [1, 4, 6])
  assert.equal(r.total, 13)
  for (let i = 0; i < 200; i++) {
    const { total } = rollDice({ count: 1, sides: 20, modifier: 0 })
    assert.ok(total >= 1 && total <= 20)
  }
})

test('dado pelas faixas: 1–N, terminar em 100, 2d6, 3d6', () => {
  assert.deepEqual(diceForRange(1, 20), { count: 1, sides: 20, modifier: 0 })
  assert.deepEqual(diceForRange(1, 7), { count: 1, sides: 8, modifier: 0 })
  assert.deepEqual(diceForRange(97, 100), { count: 1, sides: 100, modifier: 0 })
  assert.deepEqual(diceForRange(2, 12), { count: 2, sides: 6, modifier: 0 })
  assert.deepEqual(diceForRange(3, 18), { count: 3, sides: 6, modifier: 0 })
  assert.equal(diceForRange(5, 9), null)
})

test('faixas: 01-05, 96-00, 00, 7, 2–3, 13+', () => {
  assert.deepEqual(parseRange('01-05'), { low: 1, high: 5 })
  assert.deepEqual(parseRange('96-00'), { low: 96, high: 100 })
  assert.deepEqual(parseRange('00'), { low: 100, high: 100 })
  assert.deepEqual(parseRange('7'), { low: 7, high: 7 })
  assert.deepEqual(parseRange('2–3'), { low: 2, high: 3 })
  assert.deepEqual(parseRange('13+'), { low: 13, high: Number.POSITIVE_INFINITY })
  assert.equal(parseRange('Common'), null)
  assert.equal(parseRange('9-3'), null)
})

test('plano: linhas de seção, dado do cabeçalho, cabeçalho errado, só consulta', () => {
  const encounter = {
    headers: ['D100 Roll', 'Creature'],
    rows: [['Common', ''], ['01-60', 'Camel'], ['61-99', 'Herd animal'], ['0', 'Basilisk']],
  }
  const plan = rollPlan(encounter)!
  assert.equal(formatDice(plan.dice!), 'd100')
  assert.equal(plan.ranges[0], null)
  assert.equal(findRow(plan, 100), 3) // "0" depois de faixas até 99 é 00
  assert.equal(findRow(plan, 61), 2)

  const wrongHeader = rollPlan({ headers: ['D20 Roll', 'Category'], rows: [['01-20', 'Potions'], ['21-100', 'Weapons']] })!
  assert.equal(formatDice(wrongHeader.dice!), 'd100')
  assert.equal(wrongHeader.headerMismatch, true)

  // d20 com faixas até 23 (modificadores): fica o d20 do cabeçalho.
  const withModifiers = rollPlan({ headers: ['d20 Roll', 'Result'], rows: [['1-10', 'a'], ['11-23', 'b']] })!
  assert.equal(formatDice(withModifiers.dice!), 'd20')

  const byLevel = rollPlan({ headers: ['Level', 'Attacks'], rows: [['1-7', '1/1'], ['8-14', '3/2'], ['15+', '2/1']] })!
  assert.equal(byLevel.dice, null)
  assert.equal(findRow(byLevel, 20), 2)

  assert.equal(rollPlan({ headers: ['Type', 'HD'], rows: [['Skeleton', '1'], ['Zombie', '2']] }), null)
})

test('resultado digitado: 0 e 00 valem 100 num d100', () => {
  assert.equal(typedResult('37', { count: 1, sides: 100, modifier: 0 }), 37)
  assert.equal(typedResult('00', { count: 1, sides: 100, modifier: 0 }), 100)
  assert.equal(typedResult('0', { count: 1, sides: 20, modifier: 0 }), 0)
  assert.equal(typedResult('abc', null), null)
})

test('citações: mesmo livro, "in the PHB" troca o livro; o link cobre só "Table N"', () => {
  const [ref] = tableRefs('Roll on Table 116 instead', 'DMG')
  assert.deepEqual(ref, { book: 'DMG', number: '116', start: 8, end: 17 })
  assert.equal(tableRefs('3d6 (use Table 31 in the PHB)', 'CBH')[0].book, 'PHB')
  assert.equal(tableRefs('Roll on Table 13: Sciences', 'CPsiH')[0].number, '13')
  assert.deepEqual(rowRefs(['96-00', 'Reroll on Table 12'], 'CTH').map((r) => r.number), ['12'])
})

test('dados reais: Tabela 88 rola d100 e as tabelas 115→116 se encadeiam', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
  const t88 = tables.find((t) => t.id === 'dmg-88')!
  assert.equal(formatDice(rollPlan(t88)!.dice!), 'd100')
  const t115 = tables.find((t) => t.id === 'dmg-115')!
  const refs = t115.rows.flatMap((row) => rowRefs(row, t115.book))
  assert.ok(refs.some((r) => tables.some((t) => t.book === r.book && t.number === r.number && t.id === 'dmg-116')))
  const rollable = tables.filter((t) => rollPlan(t)?.dice)
  assert.ok(rollable.length >= 80)
  // Toda tabela rolável acha uma linha para todo resultado possível do dado? Não
  // exigimos (há tabelas parciais), mas o maior resultado tem que cair em alguma linha.
  const misses = rollable.filter((t) => {
    const plan = rollPlan(t)!
    const top = plan.dice!.count * plan.dice!.sides + plan.dice!.modifier
    return findRow(plan, top) < 0 && findRow(plan, 1) < 0
  })
  assert.deepEqual(misses.map((t) => t.id), [])
})

test('dados reais (GT4): 88 → 89 → 89A, 116 → 117 e as citações do DMG 88–119 se resolvem', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
  const byId = (id: string) => tables.find((t) => t.id === id)!
  const targets = (id: string) =>
    byId(id)
      .rows.flatMap((row) => rowRefs(row, 'DMG'))
      .map((r) => tables.find((t) => t.book === r.book && t.number === r.number)?.id ?? `faltando: ${r.book} ${r.number}`)
  // A 88 rola d100 sem o aviso de cabeçalho trocado.
  assert.equal(rollPlan(byId('dmg-88'))!.headerMismatch, false)
  assert.ok(targets('dmg-88').includes('dmg-89'))
  // A 89 é o seletor (d6) das subtabelas A–C, cada uma em d20.
  assert.equal(formatDice(rollPlan(byId('dmg-89'))!.dice!), 'd6')
  assert.deepEqual(targets('dmg-89'), ['dmg-89a', 'dmg-89b', 'dmg-89c'])
  assert.equal(formatDice(rollPlan(byId('dmg-89a'))!.dice!), 'd20')
  assert.ok(targets('dmg-116').includes('dmg-117'))
  assert.equal(formatDice(rollPlan(byId('dmg-117'))!.dice!), 'd100')
  // Nenhuma citação das tabelas de itens mágicos aponta para tabela que não existe.
  const dangling = tables
    .filter((t) => t.book === 'DMG' && Number.parseInt(t.number ?? '0', 10) >= 88 && Number.parseInt(t.number ?? '0', 10) <= 119)
    .flatMap((t) => targets(t.id))
    .filter((id) => id.startsWith('faltando'))
  assert.deepEqual(dangling, [])
})
