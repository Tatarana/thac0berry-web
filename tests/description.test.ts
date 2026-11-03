// Etapa "Tell Your Tale" do The Forge (src/rules/description.ts): idade, altura,
// peso pelas tabelas e o patrono.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as D from '../src/rules/description.ts'

const fixed = () => 0.999 // cada dado dá o máximo

test('PHB Tabelas 10 e 11: médias, rolagens e o dado de cada medida', () => {
  const dwarf = D.bodyTable('Dwarf')
  assert.equal(D.averageMeasure(dwarf, 'height', 'female'), 41 + 6)
  assert.equal(D.averageMeasure(dwarf, 'weight', 'male'), 130 + 22)
  assert.equal(D.averageMeasure(dwarf, 'age', 'male'), 40 + 18)
  assert.equal(D.rollMeasure(dwarf, 'age', 'male', fixed), 40 + 30)
  assert.equal(D.measureDice(dwarf, 'age'), '40+5d6')
  assert.equal(D.measureDice(D.bodyTable('Human'), 'weight'), '6d10')
})

test('raças planares (PWH), modron sem idade, raça desconhecida vira humana', () => {
  assert.equal(D.averageMeasure(D.bodyTable('Tiefling'), 'height', 'male'), 59 + 11)
  const modron = D.bodyTable('Modron')
  assert.equal(D.averageMeasure(modron, 'height', 'male'), 72)
  assert.equal(D.averageMeasure(modron, 'age', 'male'), null)
  assert.equal(D.measureDice(modron, 'weight'), null)
  assert.equal(D.agingStage(modron, 500), null)
  assert.equal(D.bodyTable(null), D.bodyTable('Human'))
})

test('PHB Tabela 12: meia-idade, velhice, venerável', () => {
  const human = D.bodyTable('Human')
  assert.deepEqual(D.agingThresholds(human), [45, 60, 90])
  assert.equal(D.agingStage(human, 30), null)
  assert.equal(D.agingStage(human, 45), 'middle-aged')
  assert.equal(D.agingStage(human, 61), 'old')
  assert.equal(D.agingStage(human, 90), 'venerable')
  assert.deepEqual(D.agingThresholds(D.bodyTable('Elf')), [175, 233, 350])
  // os números da Tabela 12 do PHB
  assert.deepEqual(D.agingThresholds(D.bodyTable('Dwarf')), [125, 167, 250])
  assert.deepEqual(D.agingThresholds(D.bodyTable('Half-Elf')), [62, 83, 125])
  assert.deepEqual(D.agingThresholds(D.bodyTable('Halfling')), [50, 67, 100])
})

test('altura em pés e polegadas, como texto da ficha', () => {
  assert.equal(D.feetAndInches(47), `3'11"`)
  assert.equal(D.parseInches(`5'10"`), 70)
  assert.equal(D.parseInches('62'), 62)
  assert.equal(D.parseInches(''), null)
})

test('patrono: até um passo do alinhamento', () => {
  assert.equal(D.deityFits('LG', 'LG'), true)
  assert.equal(D.deityFits('NG', 'LG'), true)
  assert.equal(D.deityFits('N', 'NG'), true)
  assert.equal(D.deityFits('CG', 'LG'), false)
  assert.equal(D.deityFits('LE', 'LG'), false)
  assert.equal(D.deityFits(null, 'LG'), false)
  assert.equal(D.deitySetting('Tales of the Lance'), 'Dragonlance')
  assert.equal(D.deitySetting('Faiths & Avatars'), 'Forgotten Realms')
})
