// Filtros pela campanha ativa (CA3).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { campaignFilterLabel, campaignMonsterCollections, campaignSettingSet } from '../src/rules/campaignFilter.ts'

test('cenários da campanha: Core mais os dela; sem restrição = todos', () => {
  assert.deepEqual([...campaignSettingSet(['Dark Sun'])!], ['Core', 'Dark Sun'])
  assert.equal(campaignSettingSet(null), null)
  assert.equal(campaignSettingSet([]), null)
  assert.equal(campaignFilterLabel(['Dark Sun', 'Ravenloft']), 'Campaign (Core + Dark Sun + Ravenloft)')
})

test('coleções de monstros: livros gerais sempre, mais as do cenário', () => {
  assert.deepEqual([...campaignMonsterCollections(['Ravenloft'])!], ['Monstrous Manual Core', 'MC Annuals', 'Ravenloft'])
  assert.ok(campaignMonsterCollections(['Al-Qadim'])!.has('Other Campaigns / Magazines'))
  assert.equal(campaignMonsterCollections(null), null)
})

test('dados reais: toda coleção mapeada existe no catálogo de monstros', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const index: { collection: string }[] = JSON.parse(readFileSync(join(source, 'monsters', 'monsters_index.json'), 'utf8'))
  const collections = new Set(index.map((m) => m.collection))
  const all = campaignMonsterCollections(['Al-Qadim', 'Council of Wyrms', 'Dark Sun', 'Forgotten Realms', 'Greyhawk', 'Planescape', 'Ravenloft', 'Spelljammer'])!
  for (const c of all) assert.ok(collections.has(c), c)
})
