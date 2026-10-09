// "Acerta?" e log do combate (CT5b).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attackDamages, attackHits, neededToHit, rollDamage } from '../src/rules/attack.ts'
import { blankCombatant, changeHp, rerollHp, endRound, goBackToRound, newEncounter, newInitiative, recordMorale, startRound, type Encounter } from '../src/rules/combat.ts'
import { appendLog, describeChanges, logByRound, logPlainText, logText, type LogEntry } from '../src/rules/combatLog.ts'

test('ataque: THAC0 − CA; 20 natural acerta, 1 natural erra', () => {
  assert.equal(neededToHit(19, 6), 13)
  assert.equal(neededToHit(19, -2), 21)
  assert.equal(attackHits(12, 1, 13), true)
  assert.equal(attackHits(12, 0, 13), false)
  assert.equal(attackHits(20, -5, 21), true)
  assert.equal(attackHits(1, 10, 2), false)
})

test('dano do monstro: um por "/"; faixa, dado ou fixo; "By weapon" sem dado', () => {
  assert.deepEqual(attackDamages('1-6/1-6/2-12').map((d) => [d.text, d.dice]), [
    ['1-6', { count: 1, sides: 6, modifier: 0 }],
    ['1-6', { count: 1, sides: 6, modifier: 0 }],
    ['2-12', { count: 2, sides: 6, modifier: 0 }],
  ])
  assert.deepEqual(attackDamages('1-8 (weapon)')[0].dice, { count: 1, sides: 8, modifier: 0 })
  assert.deepEqual(attackDamages('2d4+1')[0].dice, { count: 2, sides: 4, modifier: 1 })
  assert.equal(attackDamages('1')[0].fixed, 1)
  assert.deepEqual(attackDamages('By weapon')[0], { text: 'By weapon', dice: null, fixed: null })
  assert.deepEqual(attackDamages(''), [])
  assert.equal(rollDamage(attackDamages('1-8')[0], () => 0.99), 8)
  assert.equal(rollDamage(attackDamages('By weapon')[0]), null)
})

const scene = () => {
  const e = newEncounter('T', null, '2026-10-09')
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), hp: 10, hpMax: 10 }
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc'), hp: 6, hpMax: 6 }
  e.combatants = [rufus, orc]
  return { e, rufus, orc }
}
const replace = (e: Encounter, id: string, f: (c: Encounter['combatants'][number]) => Encounter['combatants'][number]) => ({ ...e, combatants: e.combatants.map((c) => (c.id === id ? f(c) : c)) })

test('log: dano, quem caiu, condições, moral; PV seguidos viram uma linha', () => {
  const { e, orc } = scene()
  const hit = replace(e, orc.id, (c) => changeHp(c, -6))
  let log = appendLog([], 1, describeChanges(e, hit, -10), 0)
  assert.deepEqual(log.map(logText), ['Orc: HP 6 → 0 (6 damage)', 'Orc is down'])
  // Digitar os PV ("1", depois "12") junta numa linha só.
  const a = replace(hit, orc.id, (c) => ({ ...c, hp: 1 }))
  const b = replace(a, orc.id, (c) => ({ ...c, hp: 12 }))
  // Segundos depois: outra linha. Digitando ("1", logo "12"): a mesma linha.
  log = appendLog(appendLog(log, 1, describeChanges(hit, a, -10), 10000), 1, describeChanges(a, b, -10), 11000)
  assert.deepEqual(log.map(logText), ['Orc: HP 6 → 0 (6 damage)', 'Orc is down', 'Orc: HP 0 → 12 (healed 12)', 'Orc is back up'])
  const held = replace(b, orc.id, (c) => ({ ...recordMorale(c, 1, 15, 9), conditions: [{ id: 'h', name: 'Held', rounds: 2 }] }))
  assert.deepEqual(describeChanges(b, held, -10).map((x) => logText({ ...x, id: 0, round: 1 })), ['Orc: + Held (2 rounds)', 'Morale: Orc rolled 15 vs 9 — fails'])
})

test('log: rodada começa com a ordem, termina, volta no tempo; entra e sai', () => {
  const { e, rufus } = scene()
  const round = { ...newInitiative('side'), entries: { party: { roll: 3, mods: [], extra: 0 }, enemies: { roll: 7, mods: [], extra: 0 } } }
  const r1 = startRound(e, round, [], -10)
  assert.deepEqual(describeChanges(e, r1, -10).map((x) => x.text), ['Round 1 starts: Party (3), Enemies (7)'])
  const r2 = endRound(r1)
  assert.deepEqual(describeChanges(r1, r2, -10).map((x) => x.text), ['End of round 1'])
  const blessed = replace(r1, rufus.id, (c) => ({ ...c, conditions: [{ id: 'b', name: 'Blessed', rounds: 1 }, { id: 'h', name: 'Held', rounds: 3 }] }))
  assert.deepEqual(describeChanges(blessed, endRound(blessed), -10).map((x) => x.text), ['End of round 1', 'Rufus: Blessed ends'])
  assert.deepEqual(describeChanges(r2, goBackToRound(r2, 1), -10).map((x) => x.text), ['Back to the start of round 1 (time reversed)'])
  const ogre = { ...blankCombatant('monster', 'enemies', 'Ogre'), hp: 20, hpMax: 20 }
  const joined = { ...r2, combatants: [...r2.combatants, ogre].filter((c) => c.id !== rufus.id) }
  assert.deepEqual(describeChanges(r2, joined, -10).map((x) => x.text), ['Joined: Ogre', 'Removed: Rufus'])
})

test('log por rodada e texto para copiar', () => {
  const log: LogEntry[] = [
    { id: 1, round: 1, text: 'Round 1 starts: Party (3)' },
    { id: 2, round: 1, text: '', hp: { combatantID: 'o', name: 'Orc', from: 6, to: 2 } },
    { id: 3, round: 2, text: 'Orc is down' },
  ]
  assert.deepEqual(logByRound(log).map((g) => [g.round, g.entries.map((x) => x.id)]), [[2, [3]], [1, [2, 1]]])
  assert.equal(logPlainText(log), 'Round 1\n  Round 1 starts: Party (3)\n  Orc: HP 6 → 2 (4 damage)\nRound 2\n  Orc is down')
})

test('log: rolar os PV (ou mudar o máximo) não vira dano nem cura', () => {
  const { e, orc } = scene()
  const rolled = replace(e, orc.id, (c) => rerollHp({ ...c, hitDice: '1' }, () => 0.99)) // 6/6 → 8/8
  assert.deepEqual(describeChanges(e, rolled, -10).map((x) => logText({ ...x, id: 0, round: 0 })), ['Orc: hit points 6/6 → 8/8'])
})
