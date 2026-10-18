// Fixar no Shield (src/rules/pins.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPinned, moveToPage, reorderWithin, togglePin, widgetPages, type PinnedItem } from '../src/rules/pins.ts'

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

test('widgetPages: só tabela/monstro contam, página 0 por padrão, sem repetir', () => {
  const items: PinnedItem[] = [
    { kind: 'table', refID: 't1', label: 'T1' }, // sem page = 0
    { kind: 'monster', refID: 'm1', label: 'M1', page: 2 },
    { kind: 'table', refID: 't2', label: 'T2', page: 1 },
    { kind: 'session', refID: 's1', label: 'S1', page: 5 }, // não é widget, ignorada
  ]
  assert.deepEqual(widgetPages(items), [0, 1, 2])
  assert.deepEqual(widgetPages([]), [0])
})

test('reorderWithin troca só o subconjunto pedido, sem mexer no resto', () => {
  const a: PinnedItem = { kind: 'table', refID: 'a', label: 'A' }
  const b: PinnedItem = { kind: 'table', refID: 'b', label: 'B' }
  const c: PinnedItem = { kind: 'monster', refID: 'c', label: 'C' }
  const all = [a, b, c]
  const reordered = reorderWithin(all, [b, a])
  assert.deepEqual(reordered, [b, a, c])
})

test('moveToPage muda a página só do item certo, mantendo o lugar dele na lista', () => {
  const a: PinnedItem = { kind: 'table', refID: 'a', label: 'A', page: 0 }
  const b: PinnedItem = { kind: 'monster', refID: 'b', label: 'B', page: 0 }
  const next = moveToPage([a, b], a, 3)
  assert.deepEqual(next, [{ ...a, page: 3 }, b])
})
