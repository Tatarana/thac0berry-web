// Combat Tracker (src/rules/combat.ts): DV e PV, moral, nomes, estados, dano/cura, condições.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { buildTableIndex } from '../src/rules/tableIndex.ts'
import {
  hitPointDice,
  initiativeByCombatant,
  rerollHp,
  armorClassValue,
  hitDiceChoices,
  monsterSetup,
  thac0Value,
  autoMoraleModifiers,
  hitDiceValue,
  moraleFromTable,
  moraleRows,
  moraleTarget,
  recordMorale,
  blankCombatant,
  changeHp,
  endRound,
  entryTotal,
  initiativeKeys,
  initiativeModifiers,
  initiativeSteps,
  newEncounter,
  newInitiative,
  actingNow,
  startRound,
  characterCombatant,
  hitPoints,
  monsterCombatants,
  numberedNames,
  parseHitDice,
  parseMorale,
  statusOf,
  tickConditions,
} from '../src/rules/combat.ts'

const fixed = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

test('DV: "4", "4+1", "1-1", "12 (base)" em d8; "½" 1d4; "1 hp" fixo; "1-4 hp" pela faixa; "Varies" não', () => {
  assert.deepEqual(parseHitDice('4'), { dice: { count: 4, sides: 8, modifier: 0 } })
  assert.deepEqual(parseHitDice('4+1'), { dice: { count: 4, sides: 8, modifier: 1 } })
  assert.deepEqual(parseHitDice('1-1'), { dice: { count: 1, sides: 8, modifier: -1 } })
  assert.deepEqual(parseHitDice('12 (base)'), { dice: { count: 12, sides: 8, modifier: 0 } })
  assert.deepEqual(parseHitDice('½'), { dice: { count: 1, sides: 4, modifier: 0 } })
  assert.deepEqual(parseHitDice('1 hp'), { fixed: 1 })
  assert.deepEqual(parseHitDice('1-4 hp'), { dice: { count: 1, sides: 4, modifier: 0 } })
  assert.deepEqual(parseHitDice('1 hit point'), { fixed: 1 })
  assert.deepEqual(parseHitDice('9 (40 hp)'), { fixed: 40 })
  assert.deepEqual(parseHitDice('3+1 (hp 27)'), { fixed: 27 })
  assert.deepEqual(parseHitDice('½ (1-4 hit points)'), { dice: { count: 1, sides: 4, modifier: 0 } })
  assert.deepEqual(parseHitDice('½ (1d4 hp)'), { dice: { count: 1, sides: 4, modifier: 0 } })
  assert.deepEqual(parseHitDice('¼'), { dice: { count: 1, sides: 2, modifier: 0 } })
  assert.deepEqual(parseHitDice('11+'), { dice: { count: 11, sides: 8, modifier: 0 } })
  assert.equal(parseHitDice('8, 12, or 16'), null)
  assert.equal(parseHitDice('4-7'), null) // faixa: o DM escolhe (não é 4d8−7)
  // Gigantes: DV mais PV extras.
  assert.deepEqual(parseHitDice('14 + 1-4 hit points'), { dice: { count: 14, sides: 8, modifier: 0 }, bonus: { count: 1, sides: 4, modifier: 0 } })
  assert.equal(hitPoints(parseHitDice('14 + 1-4 hit points')!, 'average'), 65) // 63 + 2,5
  assert.equal(parseHitDice('Varies'), null)
  assert.equal(parseHitDice('See below'), null)
})

test('PV: média arredonda para baixo, rolagem pelo motor de dados, nunca menos que 1', () => {
  assert.equal(hitPoints({ dice: { count: 4, sides: 8, modifier: 1 } }, 'average'), 19) // 4 × 4,5 = 18 + 1
  assert.equal(hitPoints({ dice: { count: 2, sides: 8, modifier: 0 } }, 'roll', fixed(0, 0.999)), 9) // 1 + 8
  assert.equal(hitPoints({ dice: { count: 1, sides: 8, modifier: -1 } }, 'roll', fixed(0)), 1) // 1 − 1 → mínimo 1
  assert.equal(hitPoints({ fixed: 3 }, 'roll'), 3)
})

test('moral: faixa, número só, sem número', () => {
  assert.deepEqual(parseMorale('Steady (11-12)'), { text: 'Steady (11-12)', low: 11, high: 12 })
  assert.deepEqual(parseMorale('Elite (13)'), { text: 'Elite (13)', low: 13, high: 13 })
  assert.deepEqual(parseMorale('12'), { text: '12', low: 12, high: 12 })
  assert.equal(parseMorale('Special'), null)
})

test('nomes: um só fica sem número; cópias continuam a numeração', () => {
  assert.deepEqual(numberedNames('Orc', 1, []), ['Orc'])
  assert.deepEqual(numberedNames('Orc', 3, []), ['Orc 1', 'Orc 2', 'Orc 3'])
  assert.deepEqual(numberedNames('Orc', 2, ['Orc 1', 'Orc 2']), ['Orc 3', 'Orc 4'])
  assert.deepEqual(numberedNames('Orc', 1, ['Orc']), ['Orc 2'])
})

test('monstro do catálogo: CA, THAC0, moral e XP da ficha; PV pelos DV', () => {
  const orc = {
    name: 'Orc',
    armorClass: { text: '6 (10)', value: 6 },
    hitDice: { text: '1', value: 1 },
    thac0: { text: '19', value: 19 },
    xp: { text: '15\nChief: 65', value: 15 },
    attacks: '1',
    damage: '1-8 (weapon)',
    morale: 'Steady (11-12)',
  }
  const list = monsterCombatants(orc, { monsterID: 'orc', monsterFile: 'x.json' }, 2, 'enemies', [], 'average')
  assert.deepEqual(list.map((c) => [c.name, c.ac, c.acText, c.hp, c.hpMax, c.thac0, c.xp, c.morale?.high]), [
    ['Orc 1', 6, '6 (10)', 4, 4, 19, 15, 12],
    ['Orc 2', 6, '6 (10)', 4, 4, 19, 15, 12],
  ])
  const varies = monsterCombatants({ name: 'Golem', hitDice: { text: 'Varies', value: null } }, { monsterID: 'g', monsterFile: 'g.json' }, 1, 'enemies', [], 'roll')
  assert.equal(varies[0].hp, null)
})

test('PC do App: nome, CA, PV e THAC0 da ficha', () => {
  const c = characterCombatant('ABC', { name: 'Teste MC', armorClass: 5, hitPointsMax: 12, hitPointsCurrent: 9, thac0: 18 })
  assert.deepEqual([c.kind, c.side, c.name, c.ac, c.hp, c.hpMax, c.thac0, c.characterID], ['pc', 'party', 'Teste MC', 5, 9, 12, 18, 'ABC'])
})

test('estado: caído em 0 ou menos, morto em −10 (ou em 0, se o DM escolher)', () => {
  assert.equal(statusOf({ hp: 3 }, -10), 'ok')
  assert.equal(statusOf({ hp: 0 }, -10), 'down')
  assert.equal(statusOf({ hp: -9 }, -10), 'down')
  assert.equal(statusOf({ hp: -10 }, -10), 'dead')
  assert.equal(statusOf({ hp: 0 }, 0), 'dead')
  assert.equal(statusOf({ hp: null }, -10), 'ok')
})

test('dano e cura: a cura não passa do máximo; PV desconhecido não muda', () => {
  assert.deepEqual(changeHp({ hp: 10, hpMax: 12 }, -15), { hp: -5, hpMax: 12 })
  assert.deepEqual(changeHp({ hp: 10, hpMax: 12 }, 5), { hp: 12, hpMax: 12 })
  assert.deepEqual(changeHp({ hp: 14, hpMax: 12 }, 3), { hp: 14, hpMax: 12 }) // acima do máximo (magia): cura não reduz
  assert.deepEqual(changeHp({ hp: null, hpMax: null }, -3), { hp: null, hpMax: null })
})

test('condições: perdem uma rodada e saem ao zerar; sem prazo ficam', () => {
  assert.deepEqual(
    tickConditions([
      { id: 'a', name: 'Blinded', rounds: 2 },
      { id: 'b', name: 'Held', rounds: 1 },
      { id: 'c', name: 'Prone', rounds: null },
    ]),
    [
      { id: 'a', name: 'Blinded', rounds: 1 },
      { id: 'c', name: 'Prone', rounds: null },
    ],
  )
})

test('dados reais: quantos DV do catálogo viram PV automáticos', () => {
  const dir = join(resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data')), 'monsters')
  let total = 0
  let parsed = 0
  for (const file of readdirSync(dir).filter((f) => f.startsWith('monsters_') && f !== 'monsters_index.json')) {
    const list: { variants: { combat: { hitDice?: { text: string } } }[] }[] = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    for (const m of list) for (const v of m.variants) {
      if (!v.combat.hitDice) continue
      total++
      // Faixa ou lista de DV: o DM escolhe um valor e os PV saem dele.
      if (parseHitDice(v.combat.hitDice.text) || hitDiceChoices(v.combat.hitDice.text).length > 0) parsed++
    }
  }
  assert.ok(total > 2500)
  assert.ok(parsed / total > 0.9, `só ${parsed} de ${total}`)
})

// --- CT2: iniciativa e rodadas ---------------------------------------------------------

const table40 = initiativeModifiers([
  ['Hasted', '-2'],
  ['Slowed', '2'],
  ['On higher ground', '-1'],
  ['Foreign environment*', '6'],
  ['Attacking with weapon', 'Weapon speed'],
])

test('modificadores: só as linhas com número; o asterisco sai do rótulo', () => {
  assert.deepEqual(table40, [
    { label: 'Hasted', value: -2 },
    { label: 'Slowed', value: 2 },
    { label: 'On higher ground', value: -1 },
    { label: 'Foreign environment', value: 6 },
  ])
  assert.equal(entryTotal({ roll: 5, mods: ['Hasted', 'On higher ground'], extra: 4 }, table40), 6) // 5 − 2 − 1 + 4 (arma)
  assert.equal(entryTotal({ roll: null, mods: [], extra: 0 }, table40), null)
})

function party() {
  const e = newEncounter('Test', null, '2026-10-09')
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), hp: 10, hpMax: 10 }
  const orc1 = { ...blankCombatant('monster', 'enemies', 'Orc 1'), hp: 4, hpMax: 4 }
  const orc2 = { ...blankCombatant('monster', 'enemies', 'Orc 2'), hp: -12, hpMax: 4 } // morto
  const wolf = { ...blankCombatant('monster', 'others', 'Wolf'), hp: 0, hpMax: 9 } // caído
  e.combatants = [rufus, orc1, orc2, wolf]
  return { e, rufus, orc1, orc2, wolf }
}

test('por lado: só lados com alguém de pé rolam; menor age primeiro', () => {
  const { e, rufus, orc1 } = party()
  assert.deepEqual(initiativeKeys(e, 'side', -10), ['party', 'enemies']) // "others" só tem o lobo caído
  const round = { ...newInitiative('side'), entries: { party: { roll: 6, mods: [], extra: 0 }, enemies: { roll: 7, mods: ['Hasted'], extra: 0 } } }
  const steps = initiativeSteps(e, round, table40, -10)
  assert.deepEqual(steps.map((s) => [s.score, s.keys, s.combatantIDs]), [
    [5, ['enemies'], [orc1.id]], // 7 − 2; o Orc 2 morto não age
    [6, ['party'], [rufus.id]],
  ])
})

test('empate age junto (simultâneo, DMG); quem não rolou fica de fora', () => {
  const { e } = party()
  const tie = { ...newInitiative('side'), entries: { party: { roll: 4, mods: [], extra: 0 }, enemies: { roll: 4, mods: [], extra: 0 } } }
  assert.deepEqual(initiativeSteps(e, tie, table40, -10).map((s) => s.keys), [['party', 'enemies']])
  const half = { ...newInitiative('side'), entries: { party: { roll: 4, mods: [], extra: 0 } } }
  assert.deepEqual(initiativeSteps(e, half, table40, -10).map((s) => s.keys), [['party']])
})

test('individual: cada combatente de pé rola, com velocidade da arma', () => {
  const { e, rufus, orc1 } = party()
  assert.deepEqual(initiativeKeys(e, 'individual', -10), [rufus.id, orc1.id])
  const round = { ...newInitiative('individual'), entries: { [rufus.id]: { roll: 3, mods: [], extra: 5 }, [orc1.id]: { roll: 6, mods: [], extra: 0 } } }
  assert.deepEqual(initiativeSteps(e, round, table40, -10).map((s) => [s.score, s.combatantIDs]), [
    [6, [orc1.id]],
    [8, [rufus.id]], // 3 + 5 (espada longa)
  ])
})

test('fim da rodada: conta mais uma, condições perdem uma rodada, iniciativa recomeça no mesmo método', () => {
  const { e, rufus } = party()
  e.round = 1
  e.combatants = e.combatants.map((c) => (c.id === rufus.id ? { ...c, conditions: [{ id: 'x', name: 'Blessed', rounds: 1 }] } : c))
  e.initiative = { ...newInitiative('individual'), entries: { [rufus.id]: { roll: 3, mods: [], extra: 0 } }, step: 0 }
  const next = endRound(e)
  assert.equal(next.round, 2)
  assert.deepEqual(next.combatants.find((c) => c.id === rufus.id)?.conditions, [])
  assert.deepEqual(next.initiative, { method: 'individual', entries: {}, step: null })
})

test('começar a rodada fecha a ordem: quem cai depois não muda a ordem; destaque no passo atual', () => {
  const { e, rufus, orc1 } = party()
  const round = { ...newInitiative('side'), entries: { party: { roll: 2, mods: [], extra: 0 }, enemies: { roll: 9, mods: [], extra: 0 } } }
  const started = startRound(e, round, table40, -10)
  assert.equal(started.round, 1)
  assert.deepEqual(actingNow(started), [rufus.id])
  // Rufus cai no meio da rodada: a ordem fechada continua a mesma.
  const fallen = { ...started, combatants: started.combatants.map((c) => (c.id === rufus.id ? { ...c, hp: 0 } : c)), initiative: { ...started.initiative!, step: 1 } }
  assert.deepEqual(actingNow(fallen), [orc1.id])
  assert.equal(fallen.initiative.order?.length, 2)
  assert.deepEqual(actingNow({ initiative: newInitiative('side') }), [])
})

// --- CT3: moral ------------------------------------------------------------------------

// Tabela 50 como vem dos dados (com os asteriscos das notas).
const table50 = moraleRows([
  ['Abandoned by friends', '-6'],
  ['Creature lost 25% of its hp*', '-2'],
  ['Creature lost 50% of its hp*', '-4'],
  ['Creatures with 1/2 HD or less', '-2'],
  ['Creatures with greater than 1/2 HD, but less than 1 HD', '-1'],
  ['Creatures with 4 to 8+ HD', '1'],
  ['Creatures with 9 to 14+ HD', '2'],
  ['Creatures with 15 or more HD', '3'],
  ['Each additional check required in round**', '-1'],
  ['Unable to affect opponent***', '-8'],
])

test('DV como número para a Tabela 50', () => {
  assert.equal(hitDiceValue('4+1'), 4)
  assert.equal(hitDiceValue('11+'), 11)
  assert.equal(hitDiceValue('½'), 0.5)
  assert.equal(hitDiceValue('1-1'), 0.75)
  assert.equal(hitDiceValue('1-4 hp'), 0.25)
  assert.equal(hitDiceValue('9 (40 hp)'), 9)
  assert.equal(hitDiceValue('14 + 1-4 hit points'), 14)
  assert.equal(hitDiceValue('Varies'), null)
})

test('moral: PV perdidos (do combatente ou do grupo, vale o maior), DV e testes repetidos', () => {
  assert.equal(table50[1].label, 'Creature lost 25% of its hp')
  const e = newEncounter('Test', null, '2026-10-09')
  const ogre = { ...blankCombatant('monster', 'enemies', 'Ogre'), hp: 14, hpMax: 20, hitDice: '4+1' }
  e.combatants = [ogre]
  e.round = 2
  assert.deepEqual(autoMoraleModifiers(ogre, e, table50, -10).map((m) => [m.label, m.value, m.reason]), [
    ['Creature lost 25% of its hp', -2, 'lost 30% of its hp'],
    ['Creatures with 4 to 8+ HD', 1, 'HD 4+1'],
  ])
  // Metade do grupo caiu: vale o 50% do grupo (não soma com o 25% dele).
  const goblins = [0, 1, 2, 3].map((i) => ({ ...blankCombatant('monster', 'enemies', `Goblin ${i}`), hp: i < 2 ? 0 : 7, hpMax: 7, hitDice: '1-1' }))
  e.combatants = goblins
  const checked = recordMorale(recordMorale(goblins[3], 2, 9, 10), 2, 4, 10)
  assert.equal(checked.lastMorale?.count, 2)
  assert.deepEqual(autoMoraleModifiers(checked, e, table50, -10).map((m) => [m.value, m.reason]), [
    [-4, '50% of its side has fallen'],
    [-1, 'HD 1-1'],
    [-2, '2 checks already this round'],
  ])
  // Em outra rodada a contagem recomeça.
  assert.equal(recordMorale(checked, 3, 12, 10).lastMorale?.count, 1)
})

test('moral: 2d10 igual ou abaixo da moral ajustada mantém o combate', () => {
  assert.equal(moraleTarget(12, [-2, 1]), 11)
  const orc = blankCombatant('monster', 'enemies', 'Orc')
  assert.deepEqual(recordMorale(orc, 1, 11, 11).lastMorale, { round: 1, count: 1, roll: 11, target: 11, holds: true })
  assert.equal(recordMorale(orc, 1, 12, 11).lastMorale?.holds, false)
  assert.deepEqual(moraleFromTable({ label: 'Regular soldiers', value: 12 }), { text: 'Regular soldiers (12)', low: 12, high: 12 })
})

test('dados reais: Tabela 50 tem as linhas que a moral calcula sozinha', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const tables = buildTableIndex(JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')), JSON.parse(readFileSync(join(source, 'books.json'), 'utf8')))
  const rows = moraleRows(tables.find((t) => t.id === 'dmg-50')?.rows ?? [])
  for (const pattern of [/25%/, /50%/, /1\/2 HD or less/i, /less than 1 HD/i, /4 to 8/i, /9 to 14/i, /15 or more HD/i, /additional check/i])
    assert.ok(rows.some((r) => pattern.test(r.label)), String(pattern))
  assert.equal(moraleRows(tables.find((t) => t.id === 'dmg-49')?.rows ?? []).length, 14)
})

// --- Monstros: CA, THAC0 e DV com texto ambíguo -----------------------------------------

const t = (text: string) => ({ text, value: null })

test('DV em faixa ou lista viram escolhas', () => {
  assert.deepEqual(hitDiceChoices('4-7'), ['4', '5', '6', '7'])
  assert.deepEqual(hitDiceChoices('2 to 4'), ['2', '3', '4'])
  assert.deepEqual(hitDiceChoices('8, 12, or 16'), ['8', '12', '16'])
  assert.deepEqual(hitDiceChoices('6+3 to 8+3'), ['6+3', '7+3', '8+3'])
  assert.deepEqual(hitDiceChoices('7+7 to 9+9'), ['7+7', '8+8', '9+9'])
  assert.deepEqual(hitDiceChoices('2+1 to 5+4'), ['2+1', '5+4'])
  assert.deepEqual(hitDiceChoices('1-1'), [])
  assert.deepEqual(hitDiceChoices('4+1'), [])
  assert.deepEqual(hitDiceChoices('Varies'), [])
})

test('CA: valor da ficha ou o primeiro número do texto', () => {
  assert.equal(armorClassValue({ text: '6 (10)', value: 6 }), 6)
  assert.equal(armorClassValue(t('0 (5)')), 0)
  assert.equal(armorClassValue(t('3/7')), 3)
  assert.equal(armorClassValue(t('-2/4/6')), -2)
  assert.equal(armorClassValue(t('5 or 4 (8)')), 5)
  assert.equal(armorClassValue(t('Varies')), null)
  assert.equal(armorClassValue(undefined), null)
})

test('THAC0: tabela por DV, primeiro número, ou nada', () => {
  const hellHound = t('4 HD: 17\n5-6 HD: 15\n7 HD: 13')
  assert.equal(thac0Value(hellHound, 4), 17)
  assert.equal(thac0Value(hellHound, 6), 15)
  assert.equal(thac0Value(hellHound, null), null)
  assert.equal(thac0Value(t('8 Hit Dice: 13\n12 Hit Dice: 9\n16 Hit Dice: 5'), 12), 9)
  assert.equal(thac0Value(t('2 HD: 193-4 HD: 17\n5 HD: 15'), 3), 17) // linhas grudadas na extração
  assert.equal(thac0Value(t('12-13 Hit Dice: 714+ Hit Dice: 5'), 16), 5)
  assert.equal(thac0Value(t('1+1 and 2+2 HD: 19\n3+3 HD: 17'), 2), 19)
  assert.equal(thac0Value(t('7 or 5'), null), 7)
  assert.equal(thac0Value(t('17, but see below'), null), 17)
  assert.equal(thac0Value(t('45-49 hp: 11\n50-59 hp: 9'), null), null)
  assert.equal(thac0Value(t('Varies'), null), null)
})

test('monstro com faixa: DV menor, THAC0 da tabela; escolha do DM manda', () => {
  const hound = { name: 'Hell Hound', armorClass: { text: '4', value: 4 }, hitDice: t('4-7'), thac0: t('4 HD: 17\n5-6 HD: 15\n7 HD: 13') }
  assert.deepEqual(monsterSetup(hound), { ac: 4, thac0: 17, hitDice: '4', hp: null })
  assert.deepEqual(monsterSetup(hound, '6'), { ac: 4, thac0: 15, hitDice: '6', hp: null })
  const [c] = monsterCombatants(hound, { monsterID: 'h', monsterFile: 'h.json' }, 1, 'enemies', [], 'average', undefined, monsterSetup(hound, '6'))
  assert.deepEqual([c.ac, c.thac0, c.hitDice, c.hp], [4, 15, '6', 27])
  const golem = { name: 'Golem', hitDice: t('Varies') }
  const [g] = monsterCombatants(golem, { monsterID: 'g', monsterFile: 'g.json' }, 1, 'enemies', [], 'roll', undefined, { ...monsterSetup(golem), hp: 60 })
  assert.equal(g.hp, 60)
})

test('dados reais: CA, THAC0 e PV saem sozinhos para a grande maioria', () => {
  const dir = join(resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data')), 'monsters')
  let total = 0
  const ok = { ac: 0, thac0: 0, hp: 0 }
  for (const file of readdirSync(dir).filter((f) => f.startsWith('monsters_') && f !== 'monsters_index.json')) {
    const list: { name: string; variants: { combat: Parameters<typeof monsterSetup>[0] }[] }[] = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    for (const m of list) for (const v of m.variants) {
      total++
      const setup = monsterSetup({ ...v.combat, name: m.name })
      if (setup.ac !== null) ok.ac++
      if (setup.thac0 !== null) ok.thac0++
      if (parseHitDice(setup.hitDice)) ok.hp++
    }
  }
  assert.ok(ok.ac / total > 0.95, `CA: ${ok.ac} de ${total}`)
  assert.ok(ok.thac0 / total > 0.93, `THAC0: ${ok.thac0} de ${total}`)
  assert.ok(ok.hp / total > 0.92, `PV: ${ok.hp} de ${total}`)
})

// --- Rolar os PV de novo e a coluna INIT -------------------------------------------------

test('rolar os DV de novo mantém o dano sofrido', () => {
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc'), hitDice: '1', hp: 4, hpMax: 6 }
  const rolled = rerollHp(orc, () => 0.99) // d8 → 8
  assert.deepEqual([rolled.hp, rolled.hpMax], [6, 8])
  const golem = { ...orc, hitDice: 'Varies' }
  assert.equal(rerollHp(golem, () => 0.5), golem)
  assert.equal(hitPointDice('4+1'), '4d8+1')
  assert.equal(hitPointDice('14 + 1-4 hit points'), '14d8 + d4') // formatDice escreve "d4" para 1d4
  assert.equal(hitPointDice('9 (40 hp)'), null)
})

test('INIT por combatente: total e vez de agir', () => {
  const { e, rufus, orc1 } = party()
  const round = { ...newInitiative('side'), entries: { party: { roll: 6, mods: [], extra: 0 }, enemies: { roll: 2, mods: [], extra: 0 } } }
  assert.deepEqual(initiativeByCombatant(initiativeSteps(e, round, table40, -10)), { [orc1.id]: { score: 2, place: 1 }, [rufus.id]: { score: 6, place: 2 } })
})
