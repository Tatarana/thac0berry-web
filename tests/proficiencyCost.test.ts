// Custo das proficiências por classe e bônus de raça/kit (src/rules/proficiencyCost.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as P from '../src/rules/proficiencyCost.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const groupsOf = (characterClass: string, extra: Partial<PlayerCharacter> = {}) =>
  P.characterProficiencyGroups({ characterClass, level: 1, ...extra } as unknown as PlayerCharacter)

test('grupos de cada classe (Tabela 37)', () => {
  assert.deepEqual(P.classProficiencyGroups('Bard'), ['General', 'Rogue', 'Warrior', 'Wizard'])
  assert.deepEqual(P.classProficiencyGroups('Ranger'), ['General', 'Warrior', 'Wizard'])
  assert.deepEqual(P.classProficiencyGroups('Psionicist'), ['General', 'Psionicist'])
  assert.deepEqual(P.classProficiencyGroups('Ninja'), ['General', 'Rogue'])
  assert.deepEqual([...groupsOf('Fighter', { multiClasses: [{ characterClass: 'Mage', level: 1 }] })].sort(), ['General', 'Warrior', 'Wizard'])
  assert.deepEqual([...groupsOf('Thief', { formerClasses: [{ characterClass: 'Cleric', level: 3 }] })].sort(), ['General', 'Priest', 'Rogue'])
})

test('grupos citados no texto dos livros', () => {
  assert.deepEqual([...P.proficiencyGroupsIn(["Warrior (Rogue - Thief's Handbook)"])].sort(), ['Rogue', 'Warrior'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Priest - Paladin'])], ['Priest'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Priest', 'Wizard'])].sort(), ['Priest', 'Wizard'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Dragons'])], [])
})

test('custo: slots do livro no grupo da classe ou em General; um a mais fora', () => {
  const tracking = { mechanics: { groups: ["Warrior (Rogue - Thief's Handbook)"], slotsRequired: 2 } }
  const healing = { mechanics: { groups: ['Priest'], slotsRequired: 2 } }
  const riding = { mechanics: { groups: ['General'], slotsRequired: 1 } }
  const dragon = { mechanics: { groups: ['Dragons'], slotsRequired: 1 } }
  const fighter = groupsOf('Fighter')
  assert.equal(P.nonweaponCost(tracking, fighter), 2)
  assert.equal(P.nonweaponCost(healing, fighter), 3)
  assert.equal(P.nonweaponCost(riding, fighter), 1)
  assert.equal(P.nonweaponCost(dragon, fighter), 2)
  assert.equal(P.nonweaponCost(tracking, groupsOf('Thief')), 2)
  assert.equal(P.nonweaponCost(healing, groupsOf('Mage')), 3)
  assert.equal(P.nonweaponCost(healing, groupsOf('Paladin')), 2)
})

test('bônus de raça e kit: entram de graça, saem quando a origem muda, não repetem', () => {
  const compendium = [
    { id: 'endurance', name: 'Endurance', mechanics: { slotsRequired: 2 } },
    { id: 'riding', name: 'Riding, Land-Based', mechanics: { slotsRequired: 1 } },
    { id: 'etiquette', name: 'Etiquette', mechanics: { slotsRequired: 1 } },
  ]
  const c = { race: 'Dwarf', kit: 'Cavalier', proficiencies: [{ id: 'A', name: 'Etiquette', slots: 1, matchedProficiencyID: 'etiquette' }] } as unknown as PlayerCharacter
  P.syncBonusProficiencies(c, ['Riding, Land-Based', 'Etiquette'], compendium)
  const names = (c.proficiencies ?? []).map((p) => `${p.name}:${p.slots}:${p.grantedBy?.kind ?? 'bought'}`)
  assert.deepEqual(names, ['Etiquette:1:bought', 'Endurance:0:race', 'Riding, Land-Based:0:kit'])
  P.syncBonusProficiencies(c, ['Riding, Land-Based', 'Etiquette'], compendium)
  assert.equal(c.proficiencies?.length, 3)
  c.race = 'Elf'
  c.kit = null
  P.syncBonusProficiencies(c, [], compendium)
  assert.deepEqual((c.proficiencies ?? []).map((p) => p.name), ['Etiquette'])
})

test('armas que o kit exige e recomenda, lidas do texto', () => {
  const keys = ['long bow', 'spear', 'lance', 'staff', 'short sword', 'battle axe']
  const a = P.kitWeaponHints('* Required: Lance. * Recommended: Spear, long bow; if possible, various axes and swords.', keys)
  assert.deepEqual([...a.required], ['lance'])
  assert.deepEqual([...a.recommended].sort(), ['long bow', 'spear'])
  const b = P.kitWeaponHints('Recommended—staff.', keys)
  assert.deepEqual([...b.required], [])
  assert.deepEqual([...b.recommended], ['staff'])
  assert.equal(P.kitWeaponHints('2', keys).recommended.size, 0)
  assert.equal(P.kitWeaponHints(null, keys).required.size, 0)
})

test('proficiências bônus do kit lidas do texto', () => {
  const names = ['Endurance', 'Riding, Land-Based', 'Riding, Airborne', 'Animal Handling', 'Acting', 'Disguise', 'Forgery', 'Gaming', 'Hunting', 'Tracking', 'Local History'].map((name) => ({ name }))
  assert.deepEqual(P.kitBonusFromText('* Bonus Proficiency: Endurance. * Recommended: ** General: Animal Handling, Riding (Land-Based)', names), ['Endurance'])
  assert.deepEqual(P.kitBonusFromText('Bonuses: Acting, Disguise, Forgery, Gaming.', names).sort(), ['Acting', 'Disguise', 'Forgery', 'Gaming'])
  assert.deepEqual(P.kitBonusFromText('Bonus Proficiencies: Hunting, tracking. Tik track as non-rangers', names).sort(), ['Hunting', 'Tracking'])
  assert.deepEqual(P.kitBonusFromText('Bonus: Animal handling or Riding, Land-Based; : Recommended: Gaming', names), [])
  assert.deepEqual(P.kitBonusFromText('Bonus —none. : Recommended —disguise', names), [])
  assert.deepEqual(P.kitBonusFromText('Bonus: Riding (Land-Based)3.', names), ['Riding, Land-Based'])
  assert.deepEqual(P.kitBonusFromText(null, names), [])
})

test('bônus do kit: lista estruturada antes do texto', () => {
  const names = [{ name: 'Endurance' }, { name: 'Etiquette' }]
  const kit = (bonus: string[]) => ({ mechanics: { proficiencies: { bonus } }, features: { nonweaponProficiencies: 'Bonus Proficiency: Endurance.' } })
  assert.deepEqual(P.kitBonusProficiencies(kit(['Etiquette']), names), ['Etiquette'])
  assert.deepEqual(P.kitBonusProficiencies(kit([]), names), ['Endurance'])
  assert.deepEqual(P.kitBonusProficiencies(null, names), [])
})
