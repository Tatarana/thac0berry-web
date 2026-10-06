// Regras da folha de magia (src/rules/spellSheets.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as S from '../src/rules/spellSheets.ts'
import type { SpellSheet } from '../src/types/library.ts'

const sheet = (): Pick<SpellSheet, 'slotBoard'> => ({
  slotBoard: {
    slots: [
      { id: 'a', level: 1, caster: 'divine', isSpent: true, orderKey: 0, preparedSpellID: 'bless' },
      { id: 'b', level: 1, caster: 'divine', isSpent: false, orderKey: 1 },
    ],
  },
})

test('memorizar grava o id (ou o nome livre) e desmarca o gasto', () => {
  const s = sheet()
  S.assignSlot(s, 'a', { id: 'cure', name: 'Cure Light Wounds' })
  assert.deepEqual([s.slotBoard.slots[0].preparedSpellID, s.slotBoard.slots[0].preparedSpellName, s.slotBoard.slots[0].isSpent], ['cure', null, false])
  S.assignSlot(s, 'b', { id: null, name: 'Homebrew Prayer' })
  assert.deepEqual([s.slotBoard.slots[1].preparedSpellID, s.slotBoard.slots[1].preparedSpellName], [null, 'Homebrew Prayer'])
})

test('limpar e riscar', () => {
  const s = sheet()
  S.clearSlot(s, 'a')
  assert.deepEqual([s.slotBoard.slots[0].preparedSpellID, s.slotBoard.slots[0].isSpent], [null, false])
  S.toggleSpent(s, 'b')
  assert.equal(s.slotBoard.slots[1].isSpent, true)
})

const choices: S.SpellChoice[] = [
  { id: 'bless', name: 'Bless', level: 1, spheres: ['All'] },
  { id: 'cure', name: 'Cure Light Wounds', level: 1, spheres: ['Healing'] },
  { id: 'command', name: 'Command', level: 1, spheres: ['Charm'] },
  { id: 'light', name: 'Light', level: 1, spheres: ['Sun'] },
]

test('busca aproximada: iniciais e trecho do nome', () => {
  assert.equal(S.spellMatches('clw', choices)[0].spell.id, 'cure')
  assert.equal(S.spellMatches('comand', choices)[0].spell.id, 'command')
  assert.deepEqual(S.spellMatches('', choices), [])
})

test('ordem da lista: favoritas, esfera maior, fora das esferas por último, mais usadas', () => {
  const c = { sphereAccess: { All: 'major', Healing: 'major', Sun: 'minor' } as Record<string, 'major' | 'minor'> }
  const sorted = S.sortSlotChoices(choices, c, new Set(['light']), new Map([['cure', 5]]))
  assert.deepEqual(sorted.map((s) => s.id), ['light', 'cure', 'bless', 'command'])
  assert.equal(S.sphereSignal(c, choices[2]), 'outsideSpheres')
  assert.equal(S.sphereSignal(c, { id: 'x', name: 'X', level: 5, spheres: ['Sun'] }), 'minorCircleCap')
})

test('grimório do mago: ids do compêndio e nomes livres por círculo', () => {
  const c = {
    wizardSpellbook: [
      { id: '1', name: 'Read Magic', matchedSpellID: 'wizard-1-read-magic' },
      { id: '2', name: 'Zap', level: 1 },
      { id: '3', name: 'Big Zap', level: 2 },
    ],
  }
  assert.deepEqual([...S.wizardSpellbookIDs(c)], ['wizard-1-read-magic'])
  assert.deepEqual(S.wizardSpellbookFreeNames(c, 1).map((e) => e.name), ['Zap'])
})
