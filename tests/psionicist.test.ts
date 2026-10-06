// Classe Psionicist (Complete Psionics Handbook, cap. 1), feita primeiro na web.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { levelLimit } from '../src/rules/raceKit.ts'
import * as R from '../src/rules/rules.ts'

test('grupo próprio, d6', () => {
  assert.equal(R.classGroup('Psionicist'), 'Psionicist')
  assert.equal(R.hitDieType('Psionicist'), 'd6')
  assert.equal(R.hasSpellSheet('Psionicist'), false)
})

test('Tabela 7: THAC0 como o ladino', () => {
  assert.deepEqual([1, 2, 3, 10, 20].map((l) => R.thac0ForLevel('Psionicist', l)), [20, 20, 19, 16, 11])
})

test('Tabela 8: saves por faixa', () => {
  assert.deepEqual(R.savingThrowsForLevel('Psionicist', 1), { paralyzationPoisonDeath: 13, rodStaffWand: 15, petrificationPolymorph: 10, breathWeapon: 16, spell: 15 })
  assert.deepEqual(R.savingThrowsForLevel('Psionicist', 9), { paralyzationPoisonDeath: 11, rodStaffWand: 11, petrificationPolymorph: 8, breathWeapon: 13, spell: 12 })
  assert.equal(R.savingThrowsForLevel('Psionicist', 21)?.spell, 7)
})

test('Tabela 2: XP', () => {
  assert.deepEqual([2, 5, 10, 20].map((l) => R.xpRequired(l, 'Psionicist')), [2200, 16500, 400000, 3000000])
  assert.equal(R.xpNeededForNextLevel(1, 'Psionicist'), '2,200')
})

test('Tabela 10: proficiências (2 a cada 5 níveis, penalidade -4)', () => {
  assert.equal(R.nonProficiencyPenalty('Psionicist'), '-4')
  assert.deepEqual([1, 5, 10].map((l) => R.totalWeaponSlots('Psionicist', l)), [2, 3, 4])
})

test('Tabela 1: limites raciais', () => {
  assert.deepEqual(
    (['Human', 'Halfling', 'Gnome', 'Dwarf', 'Half-Elf', 'Elf'] as const).map((r) => levelLimit(r, 'Psionicist')),
    ['unlimited', 10, 9, 8, 7, 7],
  )
})
