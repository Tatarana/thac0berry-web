// Catálogo de monstros (src/rules/monsters.ts): busca, filtros, ordenação e o bloco de estatísticas.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MonsterIndexEntry, MonsterVariant } from '../src/data/monsters.ts'
import * as M from '../src/rules/monsters.ts'

const entry = (over: Partial<MonsterIndexEntry>): MonsterIndexEntry => ({
  id: 'x',
  name: 'X',
  collection: 'Monstrous Manual Core',
  variants: 1,
  aliases: [],
  file: 'monsters_monstrous_manual_core.json',
  ...over,
})

const list = [
  entry({ id: 'troll', name: 'Troll', frequency: 'Uncommon', hitDiceMin: 5, xpMin: 650, xpMax: 3000, variants: 8 }),
  entry({ id: 'orc', name: 'Orc', frequency: 'Common', hitDiceMin: 1, xpMin: 15, aliases: ['Orog'] }),
  entry({ id: 'tarrasque', name: 'Tarrasque', frequency: 'Unique', hitDiceMin: null, xpMin: 107000 }),
  entry({ id: 'drik', name: 'Drik', collection: 'Dark Sun', frequency: 'Very rare (common in the wild)', hitDiceMin: 16, xpMin: null }),
]

test('faixa de frequência pelo começo do texto', () => {
  assert.equal(M.frequencyBucket('Very rare (Uncommon in Abyss)'), 'Very rare')
  assert.equal(M.frequencyBucket('Rare, common in Jibarú'), 'Rare')
  assert.equal(M.frequencyBucket('Uncommon'), 'Uncommon')
  assert.equal(M.frequencyBucket('Unique (on Athas)'), 'Unique')
  assert.equal(M.frequencyBucket('Mythical'), 'Other')
  assert.equal(M.frequencyBucket(null), 'Other')
})

test('busca por nome e apelido; filtros de coleção e frequência', () => {
  const f = { query: '', collection: null, frequency: null, sort: 'name' as const }
  assert.deepEqual(M.filterMonsters(list, { ...f, query: 'orog' }).map((m) => m.id), ['orc'])
  assert.deepEqual(M.filterMonsters(list, { ...f, collection: 'Dark Sun' }).map((m) => m.id), ['drik'])
  assert.deepEqual(M.filterMonsters(list, { ...f, frequency: 'Very rare' }).map((m) => m.id), ['drik'])
})

test('ordem por HD e por XP; sem valor vai para o fim', () => {
  const f = { query: '', collection: null, frequency: null }
  assert.deepEqual(M.filterMonsters(list, { ...f, sort: 'hitDice' }).map((m) => m.id), ['orc', 'troll', 'drik', 'tarrasque'])
  assert.deepEqual(M.filterMonsters(list, { ...f, sort: 'xp' }).map((m) => m.id), ['orc', 'troll', 'tarrasque', 'drik'])
  assert.deepEqual(M.filterMonsters(list, { ...f, sort: 'name' }).map((m) => m.id), ['drik', 'orc', 'tarrasque', 'troll'])
})

test('XP na lista: faixa quando há variantes', () => {
  assert.equal(M.xpLabel(list[0]), '650–3,000')
  assert.equal(M.xpLabel(list[1]), '15')
  assert.equal(M.xpLabel(list[3]), null)
})

test('bloco de estatísticas: ordem do Monstrous Manual e linhas extras', () => {
  const v: MonsterVariant = {
    name: 'Troll',
    source: null,
    ecology: { climateTerrain: 'Any land', alignment: 'Chaotic evil' },
    combat: { armorClass: { text: '4', value: 4 }, thac0: { text: '13', value: 13 }, xp: { text: '1,400', value: 1400 }, size: 'L (9\')' },
    extra: { Bloodline: 'Varies' },
  }
  assert.equal(M.ecologyRows[0].label, 'Climate/Terrain')
  assert.equal(M.combatRows.at(-1)?.label, 'XP Value')
  assert.equal(M.combatRows.find((r) => r.label === 'THAC0')?.value(v), '13')
  assert.equal(M.combatRows.find((r) => r.label === 'Movement')?.value(v), null)
  assert.deepEqual(M.extraRows([v]).map((r) => r.label), ['Bloodline'])
})

test('texto completo em blocos com título', () => {
  const blocks = M.textBlocks("Player's Option: MAC 6\n\n## Drik\n\nA drik is a lizard.\n\n## Combat\n\nIt bites.")
  assert.deepEqual(blocks.map((b) => b.heading), [null, 'Drik', 'Combat'])
  assert.equal(blocks[2].text, 'It bites.')
})
