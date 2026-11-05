// Retratos por combinação do The Forge (src/rules/forgeCombos.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/forgeCombos.ts'

test('nome da combinação', () => {
  assert.equal(C.comboName('Dwarf', 'Cleric', 'male'), 'combo-dwarf-cleric-male')
  assert.equal(C.comboName('Half-Elf', 'Ranger', 'female'), 'combo-half-elf-ranger-female')
  assert.equal(C.comboName('Dwarf', 'Cleric', null), null)
})

test('raça de um sexo só e modron não repetem o gênero', () => {
  assert.equal(C.comboName('Bariaur (female)', 'Fighter', 'female'), 'combo-bariaur-female-fighter')
  assert.equal(C.comboName('Modron', 'Fighter', 'male'), C.comboName('Modron', 'Fighter', 'female'))
  assert.equal(C.forgeCombos().filter((c) => c.name === C.comboName('Modron', 'Fighter', 'male')).length, 1)
})

test('fora da regra não tem arte própria', () => {
  assert.equal(C.comboName('Dwarf', 'Paladin', 'male'), null)
  assert.equal(C.comboName('Dwarf', 'Bard', 'male'), null)
  assert.equal(C.comboName('Elf', 'Anchorite', 'female'), null)
})

test('só tem arte de classe quem tem combinação: bardo por kit e ilusionista gnomo ficam sem', () => {
  assert.equal(C.comboAllowed('Dwarf', 'Cleric'), true)
  assert.equal(C.comboAllowed('Dwarf', 'Ranger'), false)
  assert.equal(C.comboAllowed('Dwarf', 'Bard'), false)
  assert.equal(C.comboAllowed('Gnome', 'Bard'), false)
  assert.equal(C.comboAllowed('Gnome', 'Mage'), false)
})

test('a lista tem 173 imagens, sem nome repetido, e bate com comboName', () => {
  const list = C.forgeCombos()
  assert.equal(list.length, 173)
  assert.equal(new Set(list.map((c) => c.name)).size, list.length)
  for (const c of list) assert.equal(C.comboName(c.race, c.characterClass, c.gender ?? 'male'), c.name)
})

test('banner: sorteia heróis de raças diferentes', () => {
  const combos = C.forgeCombos()
  const heroes = C.pickHeroes(combos, 3, () => 0)
  assert.equal(heroes.length, 3)
  assert.equal(new Set(heroes.map((h) => h.race)).size, 3)
  assert.equal(C.pickHeroes([{ race: 'Elf' }, { race: 'Elf' }], 3, () => 0).length, 1)
})
