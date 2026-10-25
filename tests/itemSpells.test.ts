// Itens que lançam magias na spell sheet (src/rules/itemSpells.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as I from '../src/rules/itemSpells.ts'
import type { MagicItem } from '../src/data/magicItems.ts'

const curing = {
  id: 'staff_of_curing',
  name: 'Staff of Curing',
  power: {
    chargeBased: true,
    maxCharges: null,
    spell: null,
    uses: [
      { name: 'Cure disease', spell: { id: 'cure_disease', name: 'Cure Disease', class: 'Priest' }, chargeCost: 1, perDay: 2, effect: null },
      { name: 'Cure wounds', spell: null, chargeCost: 1, perDay: 2, effect: '3d6+3 hp' },
    ],
  },
} as unknown as MagicItem

test('uma linha por função: magia ligada, limite por dia e efeito', () => {
  const item = I.sheetItemFromCatalog(curing, (ref) => (ref.name === 'Cure Disease' ? 'priest-3-cure-disease' : null))!
  assert.equal(item.matchedItemID, 'staff_of_curing')
  assert.deepEqual(
    item.spells.map((s) => [s.spellName, s.matchedSpellID, s.maxUses, s.damageNote, s.usedCount]),
    [
      ['Cure disease', 'priest-3-cure-disease', 2, '', 0],
      ['Cure wounds', null, 2, '3d6+3 hp', 0],
    ],
  )
})

test('sem limite por dia: cargas do item, senão o padrão; power.spell antigo vira uma função', () => {
  const ring = { id: 'ring_of_animal_friendship', name: 'Ring of Animal Friendship', power: { chargeBased: true, maxCharges: 27, spell: { id: 'animal_friendship', name: 'Animal Friendship', class: 'Priest' } } } as unknown as MagicItem
  assert.deepEqual(I.sheetItemFromCatalog(ring, () => 'x')!.spells.map((s) => [s.spellName, s.maxUses]), [['Animal Friendship', 27]])
  const wand = { id: 'w', name: 'Wand', power: { uses: [{ name: 'Zap', chargeCost: 1 }] } } as unknown as MagicItem
  assert.equal(I.sheetItemFromCatalog(wand, () => null)!.spells[0].maxUses, I.defaultItemUses)
  assert.equal(I.sheetItemFromCatalog({ id: 'sword', name: 'Sword +1', power: null } as unknown as MagicItem, () => null), null)
  // Efeito passivo levantado (`uses: []`): não entra, mesmo com power.spell.
  const freeAction = { id: 'ring_of_free_action', name: 'Ring of Free Action', power: { spell: { id: 'free_action', name: 'Free Action', class: 'Priest' }, uses: [] } } as unknown as MagicItem
  assert.equal(I.sheetItemFromCatalog(freeAction, () => 'x'), null)
})

test('não repete o item que a folha já tem (herdado do dia anterior)', () => {
  const sheet = { magicItems: [{ id: 'A', name: 'staff of curing', matchedItemID: null, itemDescription: '', spells: [] }] }
  const staff = I.sheetItemFromCatalog(curing, () => null)!
  assert.equal(I.addSheetItems(sheet, [staff]), sheet)
  const other = { ...staff, name: 'Wand of Fire', matchedItemID: 'wand_of_fire' }
  assert.deepEqual(I.addSheetItems(sheet, [staff, other]).magicItems.map((m) => m.name), ['staff of curing', 'Wand of Fire'])
})
