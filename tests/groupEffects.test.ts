// Efeitos em vários combatentes de uma vez (src/rules/groupEffects.ts; CT7).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blankCombatant, endRound, type Encounter } from '../src/rules/combat.ts'
import { describeChanges } from '../src/rules/combatLog.ts'
import * as G from '../src/rules/groupEffects.ts'

let n = 0
const id = () => `ID${++n}`

function encounter(): Encounter {
  const pc = (name: string, hp: number) => ({ ...blankCombatant('pc', 'party', name), hp, hpMax: 10 })
  const orc = (name: string, hp: number) => ({ ...blankCombatant('monster', 'enemies', name), hp, hpMax: 8 })
  return { id: 'E', name: 'Test', campaignID: null, createdAt: '', updatedAt: '', round: 1, combatants: [pc('Rufus', 10), pc('Zé', 0), orc('Orc 1', 8), orc('Orc 2', 5)] }
}

test('duração: rodadas, turnos (×10) e sem prazo', () => {
  assert.equal(G.effectRounds(6, 'rounds'), 6)
  assert.equal(G.effectRounds(5, 'turns'), 50)
  assert.equal(G.effectRounds(5, 'none'), null)
  assert.equal(G.effectRounds(0, 'rounds'), null)
  assert.equal(G.effectRounds(null, 'turns'), null)
})

test('alvos pelos atalhos: um lado, ou todos de pé', () => {
  const e = encounter()
  const names = (ids: string[]) => ids.map((x) => e.combatants.find((c) => c.id === x)!.name)
  assert.deepEqual(names(G.targetsFor(e.combatants, 'party', -10)), ['Rufus', 'Zé'])
  assert.deepEqual(names(G.targetsFor(e.combatants, 'enemies', -10)), ['Orc 1', 'Orc 2'])
  assert.deepEqual(names(G.targetsFor(e.combatants, 'standing', -10)), ['Rufus', 'Orc 1', 'Orc 2'])
})

test('aplicar, contar as rodadas juntas, tirar de todos; o log numa linha', () => {
  const before = encounter()
  const party = G.targetsFor(before.combatants, 'party', -10)
  const after: Encounter = { ...before, combatants: G.applyGroupEffect(before.combatants, party, ' Bless ', 2, 'G1', id) }
  assert.deepEqual(after.combatants.map((c) => c.conditions.map((x) => x.name)), [['Bless'], ['Bless'], [], []])
  assert.deepEqual(describeChanges(before, after, -10).map((l) => l.text), ['Bless (2 rounds) on Rufus, Zé'])
  assert.deepEqual(G.activeGroupEffects(after.combatants), [{ groupID: 'G1', name: 'Bless', rounds: 2, names: ['Rufus', 'Zé'] }])
  assert.deepEqual(G.conditionSuggestions(after), ['Bless'])

  // As cópias contam juntas e acabam juntas: uma linha no fim da rodada.
  const r2 = endRound(after)
  assert.deepEqual(G.activeGroupEffects(r2.combatants)[0].rounds, 1)
  const r3 = endRound(r2)
  assert.deepEqual(G.activeGroupEffects(r3.combatants), [])
  assert.ok(describeChanges(r2, r3, -10).some((l) => l.text === 'Bless ends on Rufus, Zé'))

  // Tirar de todos.
  const removed: Encounter = { ...after, combatants: G.removeGroupEffect(after.combatants, 'G1') }
  assert.ok(removed.combatants.every((c) => c.conditions.length === 0))
  assert.deepEqual(describeChanges(after, removed, -10).map((l) => l.text), ['Bless removed from Rufus, Zé'])

  // Nome vazio não aplica nada.
  assert.equal(G.applyGroupEffect(before.combatants, party, '  ', 2, 'G2', id), before.combatants)
})

test('CT8: salvamento por alvo — valor da ficha, quem recebe e a nota do log', () => {
  const sheet = { paralyzationPoisonDeath: 10, rodStaffWand: 14, petrificationPolymorph: 13, breathWeapon: 16, spell: 15, modifiers: { sp: 2 } }
  assert.equal(G.sheetSaveTarget(sheet, 4), 13) // 15 − 2, como na ficha
  assert.equal(G.sheetSaveTarget(sheet, 0), 10)
  assert.equal(G.sheetSaveTarget(null, 0), null)

  const saves = [
    { id: 'a', name: 'Orc 1', target: 16, roll: 6 },
    { id: 'b', name: 'Orc 2', target: 16, roll: 15 },
    { id: 'c', name: 'Orc 3', target: 16, roll: null },
  ]
  assert.equal(G.saveSucceeds(saves[1], 0), false)
  assert.equal(G.saveSucceeds(saves[1], 1), true)
  assert.equal(G.saveSucceeds(saves[2], 0), null)
  const done = saves.slice(0, 2)
  assert.deepEqual(G.affectedIDs(done, 1, 'negates'), ['a'])
  assert.deepEqual(G.affectedIDs(done, 1, 'half'), ['a', 'b'])
  assert.equal(G.saveNote('Hold Person', 4, 1, done), 'Save vs spell (+1) for Hold Person: saved Orc 2 (15); failed Orc 1 (6)')
  assert.equal(G.saveNote('', 3, -2, done), 'Save vs breath weapon (−2): failed Orc 1 (6), Orc 2 (15)')
})
