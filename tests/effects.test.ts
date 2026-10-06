// Efeitos ativos (src/rules/effects.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as F from '../src/rules/effects.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const pc = () =>
  ({
    thac0: 14,
    armorClass: 2,
    hitPointsCurrent: 30,
    hitPointsMax: 40,
    abilities: { strength: 12, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { paralyzationPoisonDeath: 9, rodStaffWand: 12, petrificationPolymorph: 11, breathWeapon: 14, spell: 13, modifiers: { sp: 1 } },
    damageModifiers: [],
    activeEffects: null,
  }) as unknown as PlayerCharacter

const effect = (parts: object[]) => ({ ...F.newEffect(), name: 'Buff', components: parts.map((p) => ({ ...F.newComponent(), ...p })) })

test('aplicar e terminar: acerto, CA, saves, dano, atributo e PV temporário voltam ao que eram', () => {
  const c = pc()
  const fx = effect([
    { kind: 'flatBonus', bonusTarget: 'toHit', bonusAmount: 2 },
    { kind: 'flatBonus', bonusTarget: 'armorClass', bonusAmount: 4 },
    { kind: 'flatBonus', bonusTarget: 'allSaves', bonusAmount: 1, savingThrowIDs: ['sp', 'ppd'] },
    { kind: 'flatBonus', bonusTarget: 'damage', bonusAmount: 3 },
    { kind: 'statOverride', overrideStat: 'strength', overrideValue: 22 },
    { kind: 'tempHP', tempHPGranted: 8 },
  ])
  F.addEffect(c, fx)
  assert.deepEqual([c.thac0, c.armorClass, c.abilities.strength, c.hitPointsCurrent], [12, -2, 22, 38])
  assert.deepEqual(c.saves.modifiers, { sp: 2, ppd: 1 })
  assert.deepEqual(c.damageModifiers!.map((r) => [r.name, r.note]), [['Buff', '+3']])
  F.endEffect(c, fx.id)
  assert.deepEqual([c.thac0, c.armorClass, c.abilities.strength, c.hitPointsCurrent], [14, 2, 12, 30])
  assert.deepEqual(c.saves.modifiers, { sp: 1 })
  assert.deepEqual(c.damageModifiers, [])
  assert.deepEqual(c.activeEffects, [])
})

test('editar um efeito em curso reaplica com os valores novos; PV temporário ajusta pela diferença', () => {
  const c = pc()
  const fx = effect([{ kind: 'flatBonus', bonusTarget: 'toHit', bonusAmount: 1 }, { kind: 'tempHP', tempHPGranted: 5 }])
  F.addEffect(c, fx)
  const applied = structuredClone(c.activeEffects![0])
  applied.components[0].bonusAmount = 3
  applied.components[1].tempHPGranted = 8
  F.saveEditedEffect(c, applied)
  assert.equal(c.thac0, 11)
  assert.equal(c.hitPointsCurrent, 38)
  assert.equal(c.activeEffects![0].components[1].tempHPRemaining, 8)
})

test('usos de ataque negado e cura em reserva (A8)', () => {
  const c = pc()
  const fx = effect([{ kind: 'attackNegation', maxUses: 2 }, { kind: 'bankedHeal', maxUses: 3 }])
  F.addEffect(c, fx)
  const [neg, heal] = c.activeEffects![0].components
  F.adjustUses(c, fx.id, neg.id, 1)
  F.adjustUses(c, fx.id, neg.id, 5)
  assert.equal(c.activeEffects![0].components[0].usedCount, 2)
  F.activateBankedHeal(c, fx.id, heal.id)
  F.logBankedHeal(c, fx.id, heal.id, 1)
  F.logBankedHeal(c, fx.id, heal.id, 1)
  assert.equal(c.hitPointsCurrent, 32)
  F.logBankedHeal(c, fx.id, heal.id, -1)
  assert.deepEqual([c.hitPointsCurrent, c.activeEffects![0].components[1].usedCount, c.activeEffects![0].components[1].healIsBanked], [31, 1, false])
})

test('resumo como no iPad', () => {
  assert.equal(F.componentSummary({ ...F.newComponent(), bonusAmount: 3 }), '+3 To Hit')
  assert.equal(F.componentSummary({ ...F.newComponent(), bonusTarget: 'allSaves', bonusAmount: -1, savingThrowIDs: ['sp'] }), '-1 Saving Throws (Spell)')
  assert.equal(F.componentSummary({ ...F.newComponent(), kind: 'attackNegation', maxUses: 1 }), 'Negates 1 attack')
})

test('bônus em atributo: grava como Stat Override calculado (o iPad lê), mostra "+3 Strength"', () => {
  const c = pc()
  const fx = effect([{ kind: 'statOverride', overrideStat: 'strength', bonusAmount: 3 }])
  F.addEffect(c, fx)
  const comp = c.activeEffects![0].components[0]
  assert.deepEqual([c.abilities.strength, comp.kind, comp.overrideValue, comp.previousValue], [15, 'statOverride', 15, 12])
  assert.equal(F.componentSummary(comp), '+3 Strength')
  const edited = structuredClone(c.activeEffects![0])
  edited.components[0].bonusAmount = 5
  F.saveEditedEffect(c, edited)
  assert.equal(c.abilities.strength, 17)
  F.endEffect(c, fx.id)
  assert.equal(c.abilities.strength, 12)
})
