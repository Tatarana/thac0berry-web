// Vista dos jogadores do Combat Tracker ao vivo (src/rules/playerView.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blankCombatant, type Encounter } from '../src/rules/combat.ts'
import { isShared, playerView, woundsOf } from '../src/rules/playerView.ts'

function encounter(): Encounter {
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), id: 'P1', hp: 7, hpMax: 10, ac: 4, thac0: 18, notes: 'player note' }
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc 1'), id: 'M1', hp: 3, hpMax: 8, ac: 6, thac0: 19, xp: 15, notes: 'SECRET: has the key', morale: { text: 'Steady (11-12)', low: 11, high: 12 } }
  const lurker = { ...blankCombatant('monster', 'enemies', 'Lurker'), id: 'M2', hp: 40, hpMax: 40, hidden: true }
  orc.conditions = [{ id: 'c1', name: 'Hold Person', rounds: 3 }]
  return {
    id: 'E',
    name: 'Ambush',
    campaignID: 'C',
    createdAt: '',
    updatedAt: '',
    round: 1,
    combatants: [rufus, orc, lurker],
    sharedWithPlayers: true,
    initiative: {
      method: 'side',
      entries: {},
      step: 1,
      order: [
        { score: 3, keys: ['party'], combatantIDs: ['P1'] },
        { score: 7, keys: ['enemies'], combatantIDs: ['M1', 'M2'] },
      ],
    },
    surprise: { totals: {}, surprised: ['party'] },
    distance: { situation: 'Light forest', feet: 40 },
    reaction: { roll: 12, total: 10, attitude: 'Indifferent', result: 'Indifferent' },
    log: [{ id: 1, round: 1, text: 'SECRET log line' }],
  }
}

test('estado em palavras: unhurt, wounded (até a metade), badly wounded, down, dead', () => {
  assert.equal(woundsOf({ hp: 8, hpMax: 8 }, -10), 'unhurt')
  assert.equal(woundsOf({ hp: 4, hpMax: 8 }, -10), 'wounded')
  assert.equal(woundsOf({ hp: 3, hpMax: 8 }, -10), 'badly wounded')
  assert.equal(woundsOf({ hp: 0, hpMax: 8 }, -10), 'down')
  assert.equal(woundsOf({ hp: -10, hpMax: 8 }, -10), 'dead')
  assert.equal(woundsOf({ hp: null, hpMax: null }, -10), null)
})

test('a vista: PV só do grupo, inimigos em palavras, escondidos fora, ordem e quem age', () => {
  const v = playerView(encounter(), -10, 'side')
  assert.deepEqual(
    v.combatants.map((c) => [c.name, c.wounds, c.hp ?? null, c.acting]),
    [
      ['Rufus', 'wounded', { current: 7, max: 10 }, false],
      ['Orc 1', 'badly wounded', null, true],
    ],
  )
  assert.deepEqual(v.combatants[1].conditions, [{ name: 'Hold Person', rounds: 3 }])
  assert.deepEqual(v.order, [
    { label: 'Party', score: 3, now: false },
    { label: 'Enemies', score: 7, now: true },
  ])
  assert.deepEqual(v.surprised, ['party'])
  assert.deepEqual(v.distance, { feet: 40, situation: 'Light forest' })
})

test('nenhum segredo passa: notas, CA, THAC0, moral, XP, reação, log e os escondidos', () => {
  const json = JSON.stringify(playerView(encounter(), -10, 'side'))
  for (const secret of ['SECRET', 'Lurker', 'M2', 'Steady', '"ac"', 'thac0', '"xp"', 'notes', 'morale', 'reaction', 'Indifferent', '"log"', 'player note']) {
    assert.ok(!json.includes(secret), `vazou: ${secret}`)
  }
  // Os PV dos inimigos também não.
  assert.ok(!/"hp":\{"current":3/.test(json))
})

test('compartilhar só encontro de campanha, ligado e não encerrado', () => {
  assert.equal(isShared({ campaignID: 'C', sharedWithPlayers: true, endedAt: null }), true)
  assert.equal(isShared({ campaignID: null, sharedWithPlayers: true, endedAt: null }), false)
  assert.equal(isShared({ campaignID: 'C', sharedWithPlayers: false }), false)
  assert.equal(isShared({ campaignID: 'C', sharedWithPlayers: true, endedAt: '2026-10-14' }), false)
})

test('I3: pedido de iniciativa — por lado, a todo o grupo (com ficha); individual, só quem falta', () => {
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), id: 'P1', characterID: 'CHAR-A', hp: 7, hpMax: 10 }
  const ana = { ...blankCombatant('pc', 'party', 'Ana'), id: 'P2', hp: 5, hpMax: 5 } // sem App: não pede
  const orc = blankCombatant('monster', 'enemies', 'Orc')
  const base = (over: Partial<Encounter>): Encounter => ({
    id: 'E', name: 'X', campaignID: 'C', createdAt: '', updatedAt: '', round: 0, combatants: [rufus, ana, orc], sharedWithPlayers: true, ...over,
  })

  // Por lado: ninguém rolou ainda → os PCs do App ficam com o pedido "party".
  const bySide = playerView(base({}), -10, 'side')
  assert.deepEqual(
    bySide.combatants.filter((c) => c.request).map((c) => [c.name, c.request]),
    [['Rufus', { kind: 'initiative', key: 'party' }]],
  )

  // Já rolado: some o pedido.
  const rolled = playerView(base({ initiative: { method: 'side', entries: { party: { roll: 7, mods: [], extra: 0 } }, step: null } }), -10, 'side')
  assert.equal(rolled.combatants.find((c) => c.name === 'Rufus')?.request, undefined)

  // Individual: só quem falta rolar, pela própria chave (o id do combatente).
  const individual = playerView(base({ initiative: { method: 'individual', entries: { P1: { roll: 6, mods: [], extra: 0 } }, step: null } }), -10, 'individual')
  assert.deepEqual(
    individual.combatants.filter((c) => c.request).map((c) => c.name),
    [],
  )
})

test('I3: pedido de salvamento — só quem o mestre marcou em Encounter.saveRequest', () => {
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), id: 'P1', characterID: 'CHAR-A' }
  const ana = { ...blankCombatant('pc', 'party', 'Ana'), id: 'P2', characterID: 'CHAR-B' }
  const e: Encounter = {
    id: 'E', name: 'X', campaignID: 'C', createdAt: '', updatedAt: '', round: 1, combatants: [rufus, ana], sharedWithPlayers: true,
    // A rodada já rolou (sem pedido de iniciativa pendente): só o salvamento aparece.
    initiative: { method: 'side', entries: { party: { roll: 7, mods: [], extra: 0 } }, step: 0, order: [{ score: 7, keys: ['party'], combatantIDs: ['P1', 'P2'] }] },
    saveRequest: { category: 4, targetIDs: ['P1'] },
  }
  const v = playerView(e, -10, 'side')
  assert.deepEqual(v.combatants.find((c) => c.name === 'Rufus')?.request, { kind: 'save', category: 4 })
  assert.equal(v.combatants.find((c) => c.name === 'Ana')?.request, undefined)
})
