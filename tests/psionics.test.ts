// Bloco psiônico (src/rules/psionics.ts), CPsiH cap. 1.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as P from '../src/rules/psionics.ts'

test('Tabela 4: progressão', () => {
  assert.deepEqual(P.progression(1), { disciplines: 1, sciences: 1, devotions: 3, defenseModes: 1 })
  assert.deepEqual(P.progression(9), { disciplines: 3, sciences: 5, devotions: 14, defenseModes: 5 })
  assert.deepEqual(P.progression(25), P.progression(20))
})

test('Tabela 5: exemplo do livro (Rowina, Wis 17, Con 16, Int 12)', () => {
  const rowina = { wisdom: 17, constitution: 16, intelligence: 12 }
  assert.equal(P.pspMaximum(1, rowina), 25)
  // A cada nível, 10 + modificador de Sabedoria (+2): 12.
  assert.equal(P.pspMaximum(2, rowina), 37)
})

test('Tabela 5 não cobre: fica para o jogador', () => {
  assert.equal(P.pspMaximum(1, { wisdom: 14, constitution: 10, intelligence: 10 }), null)
  assert.equal(P.pspMaximum(1, { wisdom: 19, constitution: 10, intelligence: 10 }), null)
  assert.equal(P.pspMax({ pspMaxOverride: 40 }, null), 40)
  assert.equal(P.pspMax(null, 25), 25)
})

test('custos, contagem e XP', () => {
  assert.equal(P.initialCost('8+4/round'), 8)
  assert.equal(P.initialCost('contact'), null)
  assert.deepEqual(P.powerCounts([{ id: 'a', name: 'X', tier: 'Science' }, { id: 'b', name: 'Y', tier: 'Devotion' }, { id: 'c', name: 'Z' }]), { sciences: 1, devotions: 2 })
  assert.deepEqual(P.psionicXP([{ psp: 8 }, { psp: 4 }]), { psp: 12, xp: 120 })
})
