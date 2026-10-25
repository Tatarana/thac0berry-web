// Bônus de AC dos itens mágicos (src/rules/armorClass.ts) e a CA final.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as A from '../src/rules/armorClass.ts'
import * as R from '../src/rules/rules.ts'
import type { QuantifiedItem } from '../src/types/library.ts'

const line = (name: string, extra: Partial<QuantifiedItem> = {}): QuantifiedItem => ({ id: name, name, quantity: 1, ...extra })

test('bônus sugerido: +N do nome de armadura, escudo e proteção; item criado; o digitado vale primeiro', () => {
  assert.equal(A.suggestedACBonus(line('Shield +2')), 2)
  assert.equal(A.suggestedACBonus(line('Chain Mail +1')), 1)
  assert.equal(A.suggestedACBonus(line('Ring of Protection +3')), 3)
  assert.equal(A.suggestedACBonus(line('Shield -1, Missile Attractor')), -1)
  assert.equal(A.suggestedACBonus(line('Long Sword +2')), null)
  assert.equal(A.suggestedACBonus(line('Bracers', { customItem: { id: 'X', version: 1, data: { name: 'Bracers', acBonus: 4 } } })), 4)
  assert.equal(A.lineACBonus(line('Shield +2', { acBonus: 3 })), 3)
})

test('só os em uso contam; anel com armadura mágica e anéis repetidos não contam; manto não vale com escudo', () => {
  assert.equal(A.itemACBonus([line('Shield +2'), line('Shield +1', { worn: false })]), 2)
  const withArmor = A.itemACParts([line('Plate Mail +1'), line('Ring of Protection +2')])
  assert.deepEqual(withArmor.map((p) => [p.name, p.ignored === null]), [['Plate Mail +1', true], ['Ring of Protection +2', false]])
  assert.equal(A.itemACBonus([line('Ring of Protection +1'), line('Ring of Protection +3')]), 3)
  assert.equal(A.itemACBonus([line('Ring of Protection', { acBonus: -1 })]), -1)
  assert.equal(A.itemACBonus([line('Cloak of Protection +2'), line('Ring of Protection +1')]), 3)
  assert.equal(A.itemACBonus([line('Cloak of Protection +2'), line('Shield +1')]), 1)
})

test('CA final: armadura + DEX − itens em uso', () => {
  const c = { armorClass: 5, details: { dexterityDefense: '-1' }, page2MagicItems: [line('Shield +2')] }
  assert.equal(R.finalArmorClass(c), 5 - 1 - 2)
  assert.equal(R.finalArmorClass({ ...c, page2MagicItems: [line('Shield +2', { worn: false })] }), 4)
})
