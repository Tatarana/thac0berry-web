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

// --- Dia novo e registro de conjuração ------------------------------------------

const day = (over: Partial<Parameters<typeof S.startSpellSheet>[1][number]> = {}) => ({
  id: 'D1',
  date: '2026-10-01T22:00:00Z',
  title: 'Day 1',
  sessionID: 'S1',
  slotBoard: {
    slots: [
      { id: 'a', level: 1, caster: 'divine' as const, isSpent: true, orderKey: 0, preparedSpellID: 'bless' },
      { id: 'b', level: 1, caster: 'divine' as const, isSpent: false, orderKey: 1 },
      { id: 'c', level: 2, caster: 'divine' as const, isSpent: false, orderKey: 0, preparedSpellName: 'Chant' },
    ],
  },
  entries: [{ id: 'e', rawText: 'Bless', displayName: 'Bless', castCount: 2 }],
  magicItems: [{ id: 'i', name: 'Wand', itemDescription: '', spells: [{ id: 'u', spellName: 'Zap', damageNote: '', maxUses: 10, usedCount: 4 }] }],
  wisdomAtCreation: 15,
  turnUndeadUsed: 3,
  ...over,
})

test('dia novo herda as preparações, desmarca tudo, zera registro, Turn Undead e cargas', () => {
  const next = S.startSpellSheet(
    { allotments: [{ caster: 'divine', level: 1, count: 2 }, { caster: 'divine', level: 2, count: 1 }], abilityScoreAtCreation: 16 },
    [day()],
    { sessionID: 'S1', title: 'Day 2' },
  )
  assert.notEqual(next.id, 'D1')
  assert.equal(next.title, 'Day 2')
  assert.equal(next.wisdomAtCreation, 16)
  assert.deepEqual(next.slotBoard.slots.map((s) => [s.level, s.preparedSpellID ?? s.preparedSpellName ?? null, s.isSpent]), [
    [1, 'bless', false],
    [1, null, false],
    [2, 'Chant', false],
  ])
  assert.ok(next.slotBoard.slots.every((s) => !['a', 'b', 'c'].includes(s.id)))
  assert.deepEqual(next.entries, [])
  assert.equal(next.turnUndeadUsed, 0)
  assert.equal(next.magicItems[0].spells[0].usedCount, 0)
  assert.match(next.date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
})

test('dia novo ajusta a grade à tabela de hoje: encolhe preservando o preparado, cria círculo novo, tira o que saiu', () => {
  const next = S.startSpellSheet(
    { allotments: [{ caster: 'divine', level: 1, count: 1 }, { caster: 'divine', level: 3, count: 1 }], abilityScoreAtCreation: 16 },
    [day()],
    { sessionID: 'S1', title: 'Day 2' },
  )
  assert.deepEqual(next.slotBoard.slots.map((s) => [s.level, s.preparedSpellID ?? s.preparedSpellName ?? null]), [
    [1, 'bless'],
    [3, null],
  ])
})

test('sem folha anterior, nasce em branco no tamanho da tabela', () => {
  const first = S.startSpellSheet({ allotments: [{ caster: 'arcane', level: 1, count: 2 }], abilityScoreAtCreation: 17 }, [], {
    sessionID: null,
    title: 'First day',
  })
  assert.deepEqual(first.slotBoard.slots.map((s) => [s.caster, s.level, s.orderKey]), [
    ['arcane', 1, 0],
    ['arcane', 1, 1],
  ])
  assert.equal(first.wisdomAtCreation, 17)
})

test('registrar conjuração: soma na linha existente ou cria uma nova', () => {
  const s = { entries: [] as ReturnType<typeof day>['entries'] }
  S.logCast(s, 'Bless', { id: 'bless', level: 1 })
  S.logCast(s, 'Bless', { id: 'bless', level: 1 })
  S.logCast(s, 'My Prayer', null)
  S.logCast(s, 'my prayer', null)
  assert.deepEqual(s.entries.map((e) => [e.displayName, e.matchedSpellID ?? null, e.castCount]), [
    ['Bless', 'bless', 2],
    ['My Prayer', null, 2],
  ])
})

test('escolas opostas da especialização (magia "All" nunca é bloqueada)', () => {
  assert.equal(S.isOpposedBySchool('Abjuration', ['Illusion/Phantasm']), true)
  assert.equal(S.isOpposedBySchool('Abjuration', ['Evocation', 'All']), false)
  assert.equal(S.isOpposedBySchool(null, ['Necromancy']), false)
  assert.equal(S.isOpposedBySchool('Divination', ['Necromancy']), false)
})
