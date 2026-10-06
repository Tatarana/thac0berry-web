// Motor de consequências (src/rules/consequences.ts). O cálculo de cada regra
// já é conferido contra o Swift em rules.test.ts; aqui, o comportamento do
// motor: o que entra na lista, o que se aplica e como fica o retrato.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as R from '../src/rules/rules.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

function cleric(): PlayerCharacter {
  const abilities = { strength: 12, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 16, charisma: 11 }
  return {
    characterClass: 'Cleric',
    level: 1,
    abilities,
    thac0: 20,
    saves: { ...R.savingThrowsForLevel('Cleric', 1)!, modifiers: { sp: 2 }, spellResistance: '5%' },
    details: {},
    combat: null,
    levelChanges: null,
    wizardSpellbook: [],
    xpNeededNextLevel: null,
  } as unknown as PlayerCharacter
}

test('sem retrato não há pendência; a primeira mudança cria o retrato com o estado anterior', () => {
  const c = cleric()
  assert.equal(C.hasPendingConsequences(c), false)
  C.setLevel(c, 4)
  assert.equal(c.lastAppliedLevel, 1)
  assert.equal(C.hasPendingConsequences(c), true)
})

test('subir de nível: THAC0 e saves aplicáveis, slots "auto-updates"', () => {
  const c = cleric()
  C.setLevel(c, 4)
  const items = C.pendingConsequences(c)
  const ids = items.map((i) => i.id)
  assert.deepEqual(ids, ['thac0', 'savingThrows', 'priestSpellSlots'])
  assert.equal(items.find((i) => i.id === 'priestSpellSlots')!.kind, 'alreadyAutomatic')
  assert.equal(items[0].oldValue, 20)
  assert.equal(items[0].newValue, R.thac0ForLevel('Cleric', 4))
})

test('aplicar: grava os valores novos, preserva modificadores de save e fecha o retrato', () => {
  const c = cleric()
  C.setLevel(c, 4)
  C.applyAutomatic(C.pendingConsequences(c), c)
  C.markConsequencesReviewed(c)
  assert.equal(c.thac0, R.thac0ForLevel('Cleric', 4))
  assert.equal(c.saves.paralyzationPoisonDeath, R.savingThrowsForLevel('Cleric', 4)!.paralyzationPoisonDeath)
  assert.deepEqual(c.saves.modifiers, { sp: 2 })
  assert.equal(c.saves.spellResistance, '5%')
  assert.equal(C.hasPendingConsequences(c), false)
})

test('mudar atributo: só as regras daquele atributo entram', () => {
  const c = cleric()
  C.setAbility(c, 'strength', 18)
  const items = C.pendingConsequences(c)
  assert.ok(items.length > 0)
  assert.ok(items.every((i) => i.id.startsWith('strength')))
  C.applyAutomatic(items, c)
  assert.equal(c.details.strengthDamage, R.abilityDetail('strengthDamage', c.abilities))
})

test('voltar ao valor do retrato tira a pendência', () => {
  const c = cleric()
  C.setAbility(c, 'wisdom', 18)
  C.setAbility(c, 'wisdom', 16)
  assert.equal(C.hasPendingConsequences(c), false)
  assert.deepEqual(C.pendingConsequences(c), [])
})

test('subir de nível grava o XP do próximo nível e preenche Level Changes vazias', () => {
  const c = cleric()
  C.setLevel(c, 4)
  assert.equal(c.xpNeededNextLevel, R.xpNeededForNextLevel(4, 'Cleric'))
  assert.deepEqual(c.levelChanges, R.levelChanges('Cleric', c.abilities))
})

test('trocar para Mago: dado de vida, Level Changes refeitas, Read Magic no grimório', () => {
  const c = cleric()
  C.setClass(c, 'Mage', { id: 'wiz-read-magic', name: 'Read Magic' })
  assert.equal(c.combat?.hitDiceType, 'd4')
  assert.deepEqual(c.levelChanges, R.levelChanges('Mage', c.abilities))
  assert.equal(c.wizardSpellbook.length, 1)
  assert.equal(c.wizardSpellbook[0].matchedSpellID, 'wiz-read-magic')
  assert.equal(c.lastAppliedClass, 'Cleric')
  assert.ok(C.pendingConsequences(c).some((i) => i.id === 'wizardSpellSlots'))
})

test('displaySummary como no iPad', () => {
  assert.equal(C.displaySummary([2, 1, 0]), '2× circle 1, 1× circle 2')
  assert.equal(C.displaySummary([0, 0]), 'no spells yet')
  assert.equal(C.displaySummary(null), '—')
})
