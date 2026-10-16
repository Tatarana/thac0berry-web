// Mudanças do mestre ao personagem (src/rules/dmChanges.ts; Combat Tracker interativo, I2).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blankCombatant, type Encounter } from '../src/rules/combat.ts'
import { applyHpDelta, hpChangeText, hpChangesToSend } from '../src/rules/dmChanges.ts'

test('aplicar na ficha: a cura não passa do máximo, o dano não tem piso', () => {
  assert.equal(applyHpDelta(8, 10, -7), 1)
  assert.equal(applyHpDelta(1, 10, -15), -14)
  assert.equal(applyHpDelta(8, 10, 5), 10)
  assert.equal(applyHpDelta(12, 10, 3), 12) // já acima do máximo (PV temporários): cura não tira nem soma
  assert.equal(hpChangeText({ delta: -7, encounter: 'Bridge' }), '−7 hp (Bridge)')
  assert.equal(hpChangeText({ delta: 3, encounter: '' }), '+3 hp')
})

function encounter(hp: number, shared = true): Encounter {
  const ana = { ...blankCombatant('pc', 'party', 'Ana'), id: 'P1', characterID: 'CHAR-A', hp, hpMax: 10 }
  const ze = { ...blankCombatant('pc', 'party', 'Zé'), id: 'P2', hp: 5, hpMax: 5 } // sem App
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc'), id: 'M1', hp: 4, hpMax: 8 }
  return { id: 'E', name: 'Bridge', campaignID: 'C', createdAt: '', updatedAt: '', round: 1, combatants: [ana, ze, orc], sharedWithPlayers: shared }
}

test('o que mandar: só PCs do App em encontro compartilhado; a primeira vez só entra na base', () => {
  const base = new Map<string, number>()
  const first = hpChangesToSend([encounter(10)], 'C', base)
  assert.deepEqual(first.sends, [])
  assert.deepEqual([...first.seen], [['E:P1', 10]])
  for (const [k, v] of first.seen) base.set(k, v)

  const hit = hpChangesToSend([encounter(3)], 'C', base)
  assert.deepEqual(hit.sends, [{ key: 'E:P1', encounterID: 'E', characterID: 'CHAR-A', from: 10, to: 3, delta: -7, encounter: 'Bridge' }])

  // Não compartilhado, de outra campanha ou sem mudança: nada.
  assert.deepEqual(hpChangesToSend([encounter(3, false)], 'C', base).sends, [])
  assert.deepEqual(hpChangesToSend([encounter(3)], 'OUTRA', base).sends, [])
  assert.deepEqual(hpChangesToSend([encounter(10)], 'C', base).sends, [])
})
