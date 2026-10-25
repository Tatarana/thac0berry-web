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

test('bônus do livro: preenche a linha sem bônus nem +N no nome; não mexe no resto', () => {
  const index = [
    { id: 'laeral_s_storm_armor', name: "Laeral's Storm Armor", acBonus: 2 },
    { id: 'shield_of_the_holy', name: 'Shield of the Holy', acBonus: 1 },
  ]
  const c = { page2MagicItems: [line("Laeral's Storm Armor"), line('Shield of the Holy', { acBonus: 2 }), line('Shield +1'), line('Staff of Curing')] }
  assert.equal(A.fillCatalogACBonuses(c, index), true)
  assert.deepEqual(c.page2MagicItems.map((l) => l.acBonus ?? null), [2, 2, null, null])
  assert.equal(A.fillCatalogACBonuses(c, index), false)
})

test('CA final: armadura + DEX − itens em uso', () => {
  const c = { armorClass: 5, details: { dexterityDefense: '-1' }, page2MagicItems: [line('Shield +2')] }
  assert.equal(R.finalArmorClass(c), 5 - 1 - 2)
  assert.equal(R.finalArmorClass({ ...c, page2MagicItems: [line('Shield +2', { worn: false })] }), 4)
})

test('armadura e escudo comuns: número no formato do iPad, Type Worn e a caixa recalculada', () => {
  const c = { armorRating: '', shieldRating: '', armorClass: 6, combat: null } as unknown as Parameters<typeof A.setArmorPieces>[0]
  A.setArmorPieces(c, { armor: { name: 'Plate mail', rating: 3 } })
  assert.deepEqual([c.armorRating, c.armorClass, c.combat?.typeWorn], ['3', 3, 'Plate mail'])
  A.setArmorPieces(c, { shield: { name: 'Medium Shield', rating: -1 }, armorName: 'Plate mail' })
  assert.deepEqual([c.shieldRating, c.armorClass, c.combat?.typeWorn], ['-1', 2, 'Plate mail, Medium Shield'])
  A.setArmorPieces(c, { armor: null, shieldName: 'Medium Shield' })
  assert.deepEqual([c.armorRating, c.armorClass, c.combat?.typeWorn], ['', 9, 'Medium Shield'])
  assert.equal(A.parsedRating('−1'), -1)
  assert.equal(A.armorBoxFromPieces({ armorRating: '', shieldRating: '' }), null)
})

test('Shieldless e Rear AC: sem escudo (comum e mágico); pelas costas, também sem o bônus de DEX', () => {
  const c = {
    armorClass: 2,
    armorRating: '3',
    shieldRating: '-1',
    details: { dexterityDefense: '-2' },
    page2MagicItems: [line('Shield +1'), line('Plate Mail +1')],
  }
  assert.equal(R.finalArmorClass(c), 2 - 2 - 1 - 1)
  assert.equal(R.shieldlessArmorClass(c), -2 + 1 + 1)
  assert.equal(R.rearArmorClass(c), 0 + 2)
  // DEX ruim continua pelas costas.
  assert.equal(R.rearArmorClass({ ...c, details: { dexterityDefense: '+1' } }), R.shieldlessArmorClass({ ...c, details: { dexterityDefense: '+1' } }))
})
