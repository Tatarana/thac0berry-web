// Raça e kit (src/rules/raceKit.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as K from '../src/rules/raceKit.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const base = () =>
  ({
    race: 'Human',
    characterClass: 'Thief',
    level: 14,
    abilities: { strength: 12, dexterity: 16, constitution: 9, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { paralyzationPoisonDeath: 13, rodStaffWand: 14, petrificationPolymorph: 12, breathWeapon: 16, spell: 15, spellResistance: 'old' },
    racialAbilities: null,
    page2Movement: null,
    proficiencies: [{ id: 'a', name: '', slots: 1, checked: false }],
    level_: 0,
  }) as unknown as PlayerCharacter

test('aplicar raça: ajustes de atributo, resistência a magia, habilidades e movimento (só se vazios)', () => {
  const c = base()
  K.applyRace(c, 'Elf')
  assert.equal(c.race, 'Elf')
  assert.deepEqual([c.abilities.dexterity, c.abilities.constitution], [17, 8])
  assert.equal(c.saves.spellResistance, '90% vs. sleep & charm')
  assert.match(c.racialAbilities ?? '', /^Infravision 60 ft/)
  assert.equal(c.page2Movement?.base, '12"')
  assert.equal(c.lastAppliedAbilities?.dexterity, 16)
  K.applyRace(c, 'Human')
  assert.equal(c.saves.spellResistance, null)
  assert.match(c.racialAbilities ?? '', /^Infravision/)
  assert.equal(c.page2Movement?.base, '12"')
})

test('avisos: atributo fora da faixa e limite de nível da Tabela 7', () => {
  const c = base()
  assert.deepEqual(K.raceWarnings('Dwarf', c), [
    'Constitution 9 is outside the 11–18 range Dwarf requires.',
    'Dwarf Thiefs are normally limited to level 12 (PHB Table 7) — this character is already level 14.',
  ])
  assert.equal(K.levelLimitWarning('Gnome', 'Mage', 1), 'Gnome cannot normally be a Mage (PHB Table 7).')
  assert.deepEqual(K.raceWarnings('Human', c), [])
})

test('kits da classe (Cleric vê os de Specialty Priest)', () => {
  const kits = [
    { name: 'A', classEligibility: { allowedClasses: ['Cleric'] }, mechanics: {} },
    { name: 'B', classEligibility: { allowedClasses: ['Specialty Priest'] }, mechanics: {} },
    { name: 'C', classEligibility: { allowedClasses: ['Fighter'] }, mechanics: {} },
  ]
  assert.deepEqual(K.kitsAllowedFor(kits, 'Cleric').map((k) => k.name), ['A', 'B'])
  assert.deepEqual(K.kitsAllowedFor(kits, 'Fighter').map((k) => k.name), ['C'])
})

test('proficiências bônus do kit: casam com o compêndio, ocupam a linha vazia, não repetem', () => {
  const c = base()
  const compendium = [{ id: 'etiquette', name: 'Etiquette' }, { id: 'heraldry', name: 'Heraldry' }]
  K.addKitBonusProficiencies(c, ['etiquette', 'Heraldry', 'Underwater Basket Weaving'], compendium)
  assert.deepEqual(c.proficiencies!.map((p) => [p.name, p.matchedProficiencyID ?? null]), [
    ['Etiquette', 'etiquette'],
    ['Heraldry', 'heraldry'],
    ['Underwater Basket Weaving', null],
  ])
  assert.equal(c.proficiencies![0].id, 'a')
  K.addKitBonusProficiencies(c, ['Etiquette'], compendium)
  assert.equal(c.proficiencies!.length, 3)
})
