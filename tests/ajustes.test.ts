// Ajustes de 2026-10-10 (docs/ajustes-2026-10.md): troca de classe tira o kit;
// PV temporários visíveis.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as E from '../src/rules/effects.ts'
import * as R from '../src/rules/rules.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

function cleric(): PlayerCharacter {
  return {
    characterClass: 'Cleric',
    level: 3,
    experience: 3500,
    race: 'Human',
    kit: 'Academician',
    abilities: { strength: 17, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 16, charisma: 11 },
    thac0: 20,
    saves: { ...R.savingThrowsForLevel('Cleric', 3)! },
    details: {},
    combat: null,
    levelChanges: null,
    wizardSpellbook: [],
    xpNeededNextLevel: null,
    hitPointsCurrent: 38,
    hitPointsMax: 38,
    activeEffects: [],
    armorClass: 5,
  } as unknown as PlayerCharacter
}

test('troca livre de classe tira o kit; a classe dupla mantém (CFH/CTH/CPrH)', () => {
  const c = cleric()
  C.changeClass(c, 'Fighter', null)
  assert.equal(c.characterClass, 'Fighter')
  assert.equal(c.kit, null)
  const d = cleric()
  C.dualClassSwitch(d, 'Fighter', null)
  assert.equal(d.kit, 'Academician')
})

test('PV temporários: somados aos atuais (passam do máximo) e contados à parte', () => {
  const c = cleric()
  const effect = E.newEffect()
  effect.components = [{ ...E.newComponent(), kind: 'tempHP', tempHPGranted: 10 }]
  E.addEffect(c, effect)
  assert.equal(c.hitPointsCurrent, 48)
  assert.equal(E.temporaryHitPoints(c), 10)
  E.endEffect(c, effect.id)
  assert.equal(c.hitPointsCurrent, 38)
  assert.equal(E.temporaryHitPoints(c), 0)
})
