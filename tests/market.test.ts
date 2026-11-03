// Etapa de equipamento do The Forge (src/rules/market.ts): dinheiro inicial,
// preços, compras e o que vai para a ficha.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as M from '../src/rules/market.ts'

const weapons = [
  { id: 'long_sword', name: 'Long sword', type: 'S', damageSmall: '1d8', cost: '15 gp', weight: '4 lbs.' },
  { id: 'long_bow_flight_arrow', name: 'Long bow (Flight arrow)', type: 'P', damageSmall: '1d6', cost: '75 gp', weight: '3 lbs.', ammunition: { name: 'Flight arrow', cost: '3 sp', quantity: 12, weight: null } },
  { id: 'long_bow_sheaf_arrow', name: 'Long bow (Sheaf arrow)', type: 'P', damageSmall: '1d8', cost: '75 gp', weight: '3 lbs.', ammunition: { name: 'Sheaf arrow', cost: '3 sp', quantity: 6, weight: null } },
  { id: 'net', name: 'Net' },
]
const armor = [
  { id: 'chain_mail', name: 'Chain mail', kind: 'armor' as const, baseAC: 5, cost: '75 gp', weight: '40 lbs.' },
  { id: 'leather', name: 'Leather', kind: 'armor' as const, baseAC: 8, cost: '5 gp', weight: '15 lbs.' },
  { id: 'medium_shield', name: 'Medium Shield', kind: 'shield' as const, cost: '7 gp', weight: '10 lbs.' },
]
const goods = [
  { id: 'torch', name: 'Torch', category: 'Miscellaneous Equipment', cost: '1 cp', weight: '1 lbs.' },
  { id: 'ale', name: 'Ale', category: 'Food & Lodging', cost: '2 sp' },
]
const wares = M.marketWares(weapons, armor, goods)
const byKey = new Map(wares.map((w) => [w.key, w]))

test('preços, pesos e dinheiro', () => {
  assert.deepEqual(M.parsePrice('15 gp'), { cp: 1500, per: 1 })
  assert.deepEqual(M.parsePrice('3sp/12'), { cp: 30, per: 12 })
  assert.deepEqual(M.parsePrice('1 cp.'), { cp: 1, per: 1 })
  assert.deepEqual(M.parsePrice('4,000-10,000 gp'), { cp: 400000, per: 1 })
  assert.deepEqual(M.parsePrice('—'), { cp: 0, per: 1 })
  assert.equal(M.parsePrice('5-100 gp')?.cp, 500)
  assert.equal(M.parseWeight('1/2 lbs.'), 0.5)
  assert.equal(M.parseWeight('*'), 0)
  assert.equal(M.formatMoney(1885), '18 gp 8 sp 5 cp')
  assert.equal(M.formatMoney(0), '0 gp')
  assert.deepEqual(M.coins(1885), { gold: 18, silver: 8, copper: 5 })
})

test('dinheiro inicial: Tabela 43, psionicista, multiclasse e kit', () => {
  assert.equal(M.startingFunds(['Fighter']).label, '5d4 × 10 gp')
  assert.equal(M.startingFunds(['Mage']).label, '(1d4+1) × 10 gp')
  assert.equal(M.startingFunds(['Psionicist']).label, '3d4 × 10 gp')
  // multiclasse: a faixa mais vantajosa (guerreiro, média 125 po)
  assert.equal(M.startingFunds(['Mage', 'Fighter']).label, '5d4 × 10 gp')
  assert.equal(M.startingFunds(['Fighter'], '3d6x10 gp').source, 'your kit')
  assert.equal(M.startingFunds(['Fighter'], '1d4').label, '1d4 gp')
  assert.equal(M.startingFunds(['Fighter'], 'None').label, '5d4 × 10 gp')
  assert.equal(M.rolledCopper(M.startingFunds(['Mage']), [3]), 4000)
})

test('mercado: uma arma por lançador, munição à parte, sem preço fica de fora', () => {
  assert.deepEqual(
    wares.filter((w) => w.stall === 'smithy').map((w) => w.key),
    ['weapon:Long sword', 'weapon:Long bow', 'ammo:Flight arrow', 'ammo:Sheaf arrow'],
  )
  assert.deepEqual(byKey.get('ammo:Flight arrow')?.price, { cp: 30, per: 12 })
  assert.equal(byKey.get('weapon:Long bow')?.proficiency, 'long bow')
  assert.equal(wares.some((w) => w.name === 'Ale'), false)
})

test('compras: orçamento, troca de armadura, CA e peso', () => {
  let cart: M.Cart = {}
  const budget = 10000 // 100 po
  cart = M.buy(cart, byKey.get('weapon:Long sword')!, 1, budget, byKey)
  cart = M.buy(cart, byKey.get('armor:chain_mail')!, 1, budget, byKey)
  assert.equal(M.cartCost(cart, byKey), 9000)
  // não cabe no orçamento: a sacola não muda
  assert.equal(M.buy(cart, byKey.get('weapon:Long bow')!, 1, budget, byKey), cart)
  // outra armadura troca a primeira
  cart = M.buy(cart, byKey.get('armor:leather')!, 1, budget, byKey)
  assert.deepEqual(Object.keys(cart).sort(), ['armor:leather', 'weapon:Long sword'])
  cart = M.buy(cart, byKey.get('shield:medium_shield')!, 1, budget, byKey)
  cart = M.buy(cart, byKey.get('ammo:Flight arrow')!, 2, budget, byKey)
  assert.equal(M.armorClassOf(cart, byKey, -2), 5) // couro 8, escudo −1, Destreza −2
  assert.equal(M.cartWeight(cart, byKey), 4 + 15 + 10)
  // devolver
  cart = M.buy(cart, byKey.get('ammo:Flight arrow')!, -2, budget, byKey)
  assert.equal(cart['ammo:Flight arrow'], undefined)
})

test('linhas da ficha: local, peso e quantidade', () => {
  const cart: M.Cart = { 'weapon:Long sword': 1, 'ammo:Flight arrow': 2, 'goods:torch': 6, 'armor:chain_mail': 1 }
  assert.deepEqual(M.equipmentRows(cart, byKey), [
    { item: 'Long sword', location: 'Carried', weight: '4 lbs.', matchedItemID: null },
    { item: 'Flight arrow ×24', location: 'Quiver', weight: '', matchedItemID: null },
    { item: 'Torch ×6', location: 'Pack', weight: '6 lbs.', matchedItemID: 'torch' },
    { item: 'Chain mail', location: 'Worn', weight: '40 lbs.', matchedItemID: null },
  ])
})
