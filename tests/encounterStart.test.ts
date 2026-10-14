// Distância e reação no começo do encontro (src/rules/encounterStart.ts; CT6).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import * as S from '../src/rules/encounterStart.ts'
import { charismaReactionAdjustment } from '../src/rules/rules.ts'
import { parseRange, rollPlan } from '../src/rules/tableRoll.ts'
import { buildTableIndex } from '../src/rules/tableIndex.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
const t58 = tables.find((t) => t.id === 'dmg-58')!
const t59 = tables.find((t) => t.id === 'dmg-59')!

test('faixas abertas: "2 or less" e "20 or more"', () => {
  assert.deepEqual(parseRange('2 or less'), { low: Number.NEGATIVE_INFINITY, high: 2 })
  assert.deepEqual(parseRange('20 or more'), { low: 20, high: Number.POSITIVE_INFINITY })
  assert.equal(parseRange('two or less'), null)
})

test('dados reais: Tabela 58, as distâncias com o dado e o multiplicador', () => {
  const options = S.distanceOptions(t58.rows)
  assert.equal(options.length, 8) // "No surprise:" é seção
  const forest = options.find((o) => o.label === 'Light forest')!
  assert.equal(S.distanceDiceLabel(forest), '2d6 × 10')
  const values = Array.from({ length: 200 }, () => S.rollDistance(forest)!)
  assert.ok(values.every((v) => v >= 20 && v <= 120 && v % 10 === 0))
  const night = options.find((o) => /night/i.test(o.label))!
  assert.equal(night.dice, null)
  assert.equal(S.rollDistance(night), null)
  // A surpresa escolhe a linha.
  assert.equal(S.distanceFromSurprise(options, { totals: {}, surprised: ['party', 'enemies'] })?.text, '3d6')
  assert.equal(S.distanceFromSurprise(options, { totals: {}, surprised: ['enemies'] })?.text, '4d6')
  assert.equal(S.distanceFromSurprise(options, { totals: {}, surprised: [] }), null)
  assert.equal(S.distanceFromSurprise(options, null), null)
})

test('dados reais: Tabela 59 com a coluna dos PCs hostis, rolável no Grimoire', () => {
  assert.deepEqual(S.reactionAttitudes(t59.headers), ['Friendly', 'Indifferent', 'Threatening', 'Hostile'])
  assert.equal(rollPlan(t59)?.dice?.count, 2)
  assert.equal(rollPlan(t59)?.dice?.sides, 10)
  assert.equal(S.reactionFor(t59.rows, 4, 3), 'Flight')
  assert.equal(S.reactionFor(t59.rows, 13, 1), 'Cautious')
  // Abaixo e acima da tabela: as pontas.
  assert.equal(S.reactionFor(t59.rows, -3, 0), 'Friendly')
  assert.equal(S.reactionFor(t59.rows, 25, 0), 'Hostile')
})

test('reação: o Carisma bom deixa a rolagem mais baixa (amistosa)', () => {
  assert.equal(S.reactionTotal(12, 5, 0), 7)
  assert.equal(S.reactionTotal(12, -3, 1), 16)
  assert.equal(charismaReactionAdjustment({ abilities: { strength: 10, exceptionalStrength: null, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 18 } as never }), 7)
  assert.equal(charismaReactionAdjustment({ details: { charismaReaction: '+2' } }), 2)
  assert.equal(
    S.reactionText({ roll: 12, total: 7, attitude: 'Indifferent', result: 'Indifferent', speaker: 'Rufus' }),
    'Reaction: Indifferent (7; PCs indifferent, Rufus speaking)',
  )
})
