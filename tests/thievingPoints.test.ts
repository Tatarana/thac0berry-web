// Pontos de treino das perícias de ladrão no The Forge (src/rules/thievingPoints.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as T from '../src/rules/thievingPoints.ts'

const halfling = { characterClass: 'Thief', level: 1, race: 'Halfling', dexterity: 17 }

test('pontos e limites: ladrão, ninja e bardo', () => {
  assert.equal(T.trainingPool('Thief', 1), 60)
  assert.equal(T.trainingPool('Ninja', 3), 120)
  assert.equal(T.trainingPool('Bard', 1), 20)
  assert.equal(T.trainingPool('Bard', 3), 50)
  assert.equal(T.trainingPool('Gypsy', 2), 90)
  assert.equal(T.trainingLimit('Thief', 1), 30)
  assert.equal(T.trainingLimit('Thief', 3), 60)
  assert.equal(T.trainingLimit('Bard', 5), null)
})

test('valor: base + raça + Destreza + treino, de 0 a 95%', () => {
  const ol = T.skillParts('Open Locks', 'Thief', 'Halfling', 17)
  assert.deepEqual(ol, { base: 10, race: 5, dexterity: 10 })
  assert.equal(T.skillTotal(ol, 0), 25)
  // anão com Destreza 9: Move Silently 10 − 20 = 0, nunca negativo
  assert.equal(T.skillTotal(T.skillParts('Move Silently', 'Thief', 'Dwarf', 9), 0), 0)
  assert.equal(T.skillTotal(T.skillParts('Climb Walls', 'Thief', 'Human', 12), 60), 95)
})

test('treino respeita os pontos, o limite por perícia e o teto de 95%', () => {
  let t: T.Training = {}
  for (let i = 0; i < 8; i++) t = T.addTraining('Open Locks', 5, t, halfling)
  assert.equal(t['Open Locks'], 30) // limite do 1º nível
  t = T.addTraining('Climb Walls', 30, t, halfling)
  assert.equal(T.spentPoints(t), 60)
  assert.equal(T.addTraining('Pick Pockets', 5, t, halfling), t) // pontos acabaram
  t = T.addTraining('Open Locks', -40, t, halfling)
  assert.equal(t['Open Locks'], 0)
  // teto de 95%: Climb Walls humano Dex 12 começa em 60; no 3º nível cabem 35
  const high = { characterClass: 'Thief', level: 3, race: 'Human', dexterity: 12 }
  assert.equal(T.trainingRoom('Climb Walls', {}, high), 35)
})

test('atalhos distribuem todos os pontos pelas perícias do caminho', () => {
  const cat = T.distributeTraining(T.trainingPaths[0].skills, halfling)
  assert.equal(T.spentPoints(cat), 60)
  assert.deepEqual(Object.keys(cat).sort(), ['Climb Walls', 'Hide in Shadows', 'Move Silently', 'Open Locks'])
  const bard = T.distributeTraining(null, { characterClass: 'Bard', level: 3, race: 'Human', dexterity: 12 })
  assert.equal(T.spentPoints(bard), 50)
  assert.deepEqual(Object.keys(bard).sort(), ['Climb Walls', 'Detect Noise', 'Pick Pockets', 'Read Languages'])
})

test('a ficha recebe os valores finais e guarda os ids', () => {
  let n = 0
  const skills = T.trainedSkills({ 'Open Locks': 30 }, halfling, [{ id: 'OLD', skill: 'Open Locks' }], () => `N${++n}`)
  assert.equal(skills.length, 8)
  assert.deepEqual(skills.find((s) => s.skill === 'Open Locks'), { id: 'OLD', skill: 'Open Locks', value: '55%' })
})
