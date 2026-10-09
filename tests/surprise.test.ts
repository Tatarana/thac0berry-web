// Surpresa, salvamentos de monstro e XP do fim do encontro (CT5a).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { autoMoraleModifiers, blankCombatant, defeatedFoes, initiativeKeys, initiativeSteps, moraleRows, newEncounter, newInitiative, xpAward, xpMembers, xpSummary } from '../src/rules/combat.ts'
import {
  crowdModifier,
  emptySurpriseSide,
  isSurprised,
  saveCategories,
  saveLevel,
  savePasses,
  savesFor,
  surpriseModifiers,
  surpriseResult,
  surpriseTotal,
  warriorSaveRows,
} from '../src/rules/surprise.ts'
import { buildTableIndex } from '../src/rules/tableIndex.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
const table = (id: string) => tables.find((t) => t.id === id)!

test('surpresa: d10 com a Tabela 57; 1 a 3 surpreso; +1 a cada 10 do outro lado', () => {
  const rows = table('dmg-57').rows
  const mods = surpriseModifiers(rows)
  assert.ok(mods.some((m) => m.label === 'In darkness' && m.value === -4))
  assert.ok(mods.some((m) => m.label === 'Anticipating attack' && m.value === 2))
  assert.ok(!mods.some((m) => /camouflaged|every 10/i.test(m.label)))
  assert.equal(crowdModifier(rows, 9), null)
  assert.equal(crowdModifier(rows, 23)?.value, 2)
  const dark = { ...emptySurpriseSide(), roll: 6, mods: ['In darkness'] }
  assert.equal(surpriseTotal(dark, mods, null), 2)
  assert.equal(isSurprised(dark, 2), true)
  assert.equal(isSurprised({ ...dark, immune: true }, 2), false)
  assert.equal(isSurprised(emptySurpriseSide(), null), false)
  assert.deepEqual(surpriseResult({ party: 7, enemies: 2 }, { party: emptySurpriseSide(), enemies: dark }), { totals: { party: 7, enemies: 2 }, surprised: ['enemies'] })
})

test('lado surpreso fica fora da iniciativa da rodada 1 e ganha o −2 de moral', () => {
  const e = newEncounter('T', null, '2026-10-09')
  const rufus = blankCombatant('pc', 'party', 'Rufus')
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc'), hp: 6, hpMax: 6 }
  e.combatants = [{ ...rufus, hp: 10, hpMax: 10 }, orc]
  e.surprise = { totals: { party: 8, enemies: 2 }, surprised: ['enemies'] }
  assert.deepEqual(initiativeKeys(e, 'side', -10), ['party'])
  const round = { ...newInitiative('side'), entries: { party: { roll: 5, mods: [], extra: 0 } } }
  assert.deepEqual(initiativeSteps(e, round, [], -10).map((s) => s.keys), [['party']])
  assert.deepEqual(initiativeKeys({ ...e, round: 2 }, 'side', -10), ['party', 'enemies'])
  const table50 = moraleRows(table('dmg-50').rows)
  assert.ok(autoMoraleModifiers(orc, e, table50, -10).some((m) => m.value === -2 && m.reason === 'its side was surprised'))
  assert.ok(!autoMoraleModifiers({ ...orc, lastMorale: { round: 1, count: 1, roll: 5, target: 9, holds: true } }, e, table50, -10).some((m) => m.reason === 'its side was surprised'))
})

test('salvamentos de monstro: linhas de guerreiro da Tabela 46, nível pelos DV', () => {
  const t46 = table('dmg-46')
  const rows = warriorSaveRows(t46.rows)
  assert.deepEqual(rows.map((r) => r.low), [0, 1, 3, 5, 7, 9, 11, 13, 15, 17])
  assert.deepEqual(savesFor(0, rows), [16, 18, 17, 20, 19])
  assert.deepEqual(savesFor(4, rows), [13, 15, 14, 16, 16])
  assert.deepEqual(savesFor(30, rows), [3, 5, 4, 4, 6])
  assert.deepEqual(saveCategories(t46.headers), ['Paralyzation, Poison, or Death Magic', 'Rod, Staff, or Wand', 'Petrification or Polymorph', 'Breath Weapon', 'Spells'])
  assert.equal(saveLevel({ hitDice: '4+1' }), 4)
  assert.equal(saveLevel({ hitDice: '½' }), 0)
  assert.equal(saveLevel({ hitDice: '1-1' }), 1)
  assert.equal(saveLevel({ hitDice: 'Varies' }), null)
  assert.equal(savePasses(12, 1, 13), true)
  assert.equal(savePasses(11, 1, 13), false)
})

test('XP no fim: vencidos (caídos, mortos, em fuga, rendidos), partes iguais, resumo', () => {
  const e = newEncounter('Ambush', null, '2026-10-09')
  const orc = (name: string, hp: number, extra: Partial<ReturnType<typeof blankCombatant>> = {}) => ({ ...blankCombatant('monster', 'enemies', name), hp, hpMax: 6, xp: 15, ...extra })
  const dead = orc('Orc 1', -12)
  const down = orc('Orc 2', 0)
  const fled = orc('Orc 3', 4, { conditions: [{ id: 'f', name: 'Fleeing', rounds: null }] })
  const fighting = orc('Orc 4', 6)
  const ogre = { ...orc('Ogre', 0), xp: 270 }
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), hp: 5, hpMax: 24 }
  const ze = { ...blankCombatant('pc', 'party', 'Zé'), hp: -11, hpMax: 30 } // morto
  const hench = { ...blankCombatant('npc', 'party', 'Henchman'), hp: 0, hpMax: 8 } // caído conta
  e.combatants = [dead, down, fled, fighting, ogre, rufus, ze, hench]
  const foes = defeatedFoes(e, -10)
  assert.deepEqual(foes.map((c) => c.name), ['Orc 1', 'Orc 2', 'Orc 3', 'Ogre'])
  const members = xpMembers(e, -10)
  assert.deepEqual(members.map((c) => c.name), ['Rufus', 'Henchman'])
  const award = xpAward(foes, members)
  assert.deepEqual([award.total, award.shares, award.each], [315, 2, 157])
  assert.equal(xpSummary('Ambush', award, e.combatants), 'Ambush — 315 XP: Orc 1 (15), Orc 2 (15), Orc 3 (15), Ogre (270). 2 shares: 157 XP each (Rufus, Henchman).')
  assert.equal(xpAward(foes, []).each, 0)
})
