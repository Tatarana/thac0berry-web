// Itens mágicos criados (src/rules/customItems.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/customItems.ts'
import type { MagicItem } from '../src/data/magicItems.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

test('copiar de um item do livro: texto, valores e bônus', () => {
  const sword = {
    id: 'sword_plus_2',
    name: 'Sword +2',
    classification: { broadCategory: 'Weapon', specificType: 'Sword' },
    economyAndXP: { xpValue: 800, goldValue: 4000 },
    description: { briefSummary: 'A fine blade.', fullText: 'This sword…' },
    enchantment: { attackBonus: 2, damageBonus: 2 },
  } as unknown as MagicItem
  const d = C.customItemFromCompendium(sword)
  assert.deepEqual([d.name, d.category, d.xpValue, d.attackBonus, d.damageBonus, d.basedOn], ['Sword +2', 'Weapon', 800, 2, 2, 'sword_plus_2'])
  assert.deepEqual(C.customItemBonuses(d), ['+2 attack', '+2 damage'])
  assert.deepEqual(C.customItemBonuses({ name: 'Shield', acBonus: 2, charges: 5 }), ['+2 AC bonus', '5 charges'])
})

test('cópias na ficha: só as de versão mais velha se atualizam, com o nome', () => {
  const c = {
    page2MagicItems: [
      { id: 'L1', name: 'Old Blade', quantity: 1, customItem: { id: 'AB-1', version: 1, data: { name: 'Old Blade' } } },
      { id: 'L2', name: 'Ring', quantity: 1, matchedItemID: 'ring_of_protection' },
      { id: 'L3', name: 'Charm', quantity: 1, customItem: { id: 'AB-2', version: 3, data: { name: 'Charm' } } },
    ],
  } as unknown as PlayerCharacter
  const changed = C.refreshCustomItems(c, [
    { id: 'ab-1', version: 2, data: { name: 'Kelmon’s Blade +2', attackBonus: 2 } },
    { id: 'ab-2', version: 3, data: { name: 'Charm (same)' } },
  ])
  assert.equal(changed, true)
  assert.deepEqual(c.page2MagicItems!.map((l) => [l.name, l.customItem?.version ?? null]), [
    ['Kelmon’s Blade +2', 2],
    ['Ring', null],
    ['Charm', 3],
  ])
  assert.equal(C.refreshCustomItems(c, [{ id: 'ab-1', version: 2, data: { name: 'x' } }]), false)
})
