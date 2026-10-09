// Combat Tracker (src/rules/combat.ts): DV e PV, moral, nomes, estados, dano/cura, condições.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import {
  changeHp,
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
      if (parseHitDice(v.combat.hitDice.text)) parsed++
    }
  }
  assert.ok(total > 2500)
  assert.ok(parsed / total > 0.9, `só ${parsed} de ${total}`)
})
