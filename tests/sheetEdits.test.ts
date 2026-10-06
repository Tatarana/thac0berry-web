// Edições com regra da ficha (src/rules/sheetEdits.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as E from '../src/rules/sheetEdits.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const effect = (components: object[]) => ({ id: 'x', name: 'fx', durationLabel: '', notes: '', components }) as never

test('ferimento: desconta dos PV, consome PV temporário, solta a cura em reserva e entra na lista', () => {
  const c = {
    hitPointsCurrent: 30,
    combat: { wounds: '4' },
    activeEffects: [
      effect([
        { kind: 'tempHP', tempHPRemaining: 5 },
        { kind: 'bankedHeal', healIsBanked: true },
      ]),
    ],
  } as unknown as PlayerCharacter
  E.recordWound(c, 7)
  assert.equal(c.hitPointsCurrent, 23)
  assert.equal(c.activeEffects![0].components[0].tempHPRemaining, 0)
  assert.equal(c.activeEffects![0].components[1].healIsBanked, false)
  assert.equal(c.combat!.wounds, '4\n7')
})

test('ferimento negativo cura; zero não conta', () => {
  const c = { hitPointsCurrent: 10, combat: null, activeEffects: null } as unknown as PlayerCharacter
  E.recordWound(c, -3)
  E.recordWound(c, 0)
  assert.equal(c.hitPointsCurrent, 13)
  assert.equal(c.combat!.wounds, '-3')
  E.clearWounds(c)
  assert.equal(c.combat!.wounds, '')
})

test('especialização: corpo a corpo +1/+2, arco +2* só no acerto, sem sobrescrever o que já tem', () => {
  const sword = E.emptyWeapon('Long sword')
  E.toggleSpecialization(sword)
  assert.deepEqual([sword.isSpecialized, sword.thac0, sword.dmgAdj], [true, '+1', '+2'])
  const bow = { ...E.emptyWeapon('Long bow'), thac0: '+1' }
  E.toggleSpecialization(bow)
  assert.deepEqual([bow.thac0, bow.dmgAdj ?? null], ['+1', null])
  E.toggleSpecialization(bow)
  assert.equal(bow.isSpecialized, false)
})

test('equipamento novo vai para a coluna com menos itens', () => {
  assert.equal(E.leastFilledColumn([{ column: 0 }, { column: 1 }]), 0)
  assert.equal(E.leastFilledColumn([{ column: 0 }, { column: null }]), 1)
})

test('arma e proficiência do compêndio', () => {
  const w = E.weaponFromCompendium({ id: 'mace', name: 'Mace, footman’s', size: 'M', type: 'B', speedFactor: 7, attacksPerRound: '1', damageSmall: '1d6+1', damageLarge: '1d6', formattedRange: null })
  assert.deepEqual([w.speed, w.range, w.matchedWeaponID, w.weaponType], ['7', '—', 'mace', 'B'])
  const p = E.proficiencyFromCompendium(
    { id: 'healing', name: 'Healing', mechanics: { slotsRequired: 2, relevantAbility: 'Wisdom', checkModifier: -2 } },
    { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 17, charisma: 10 },
  )
  assert.deepEqual([p.slots, p.target, p.checked], [2, '15', false])
})
