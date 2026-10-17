// Nota de descompasso de cenário ao mudar um personagem de campanha
// (src/rules/settingFit.ts): raça, classe ou kit de outro mundo não bloqueia,
// só avisa.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { kitSettingsFrom, settingFitNotes } from '../src/rules/settingFit.ts'

const kits = kitSettingsFrom([
  { name: 'Danseur', setting: 'Ravenloft' },
  { name: 'Herald', setting: null },
])

test('raça, classe e kit de outro cenário: uma nota curta por descompasso', () => {
  assert.deepEqual(settingFitNotes({ race: 'Half-Vistani', characterClass: 'Gypsy', kit: 'Danseur' }, null, kits), [
    'Half-Vistani is a Ravenloft race.',
    'Gypsy is a Ravenloft class.',
    'Danseur is a Ravenloft kit.',
  ])
  assert.deepEqual(settingFitNotes({ race: 'Half-Vistani', characterClass: 'Gypsy', kit: 'Danseur' }, ['Ravenloft'], kits), [])
})

test('sem descompasso: raça/classe do PHB, kit sem cenário, ou raça/kit desconhecidos', () => {
  assert.deepEqual(settingFitNotes({ race: 'Human', characterClass: 'Fighter', kit: 'Herald' }, null, kits), [])
  assert.deepEqual(settingFitNotes({ race: 'Not a race', characterClass: 'Fighter', kit: null }, null, kits), [])
  assert.deepEqual(settingFitNotes({ race: 'Tiefling', characterClass: 'Mage', kit: null }, ['Planescape'], kits), [])
  assert.deepEqual(settingFitNotes({ race: 'Tiefling', characterClass: 'Mage', kit: null }, null, kits), ['Tiefling is a Planescape race.'])
})
