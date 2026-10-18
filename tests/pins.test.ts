// Fixar no Shield (src/rules/pins.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPinned, togglePin, type PinnedItem } from '../src/rules/pins.ts'

test('togglePin fixa e desafixa pelo par (kind, refID), sem repetir', () => {
  const a: PinnedItem = { kind: 'table', refID: 'dmg-35', label: 'Combat Modifiers' }
  const b: PinnedItem = { kind: 'monster', refID: 'troll', label: 'Troll' }
  let items: PinnedItem[] = []
  items = togglePin(items, a)
  assert.deepEqual(items, [a])
  assert.equal(isPinned(items, 'table', 'dmg-35'), true)
  assert.equal(isPinned(items, 'monster', 'dmg-35'), false)

  items = togglePin(items, b)
  assert.deepEqual(items, [a, b])

  items = togglePin(items, a) // desafixa a
  assert.deepEqual(items, [b])

  // Fixar de novo não duplica.
  items = togglePin(items, b)
  items = togglePin(items, b)
  assert.deepEqual(items, [b])
})
