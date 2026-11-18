// Filtros pela campanha ativa (CA3).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { campaignFilterLabel, campaignMonsterCollections, campaignSettingSet, defaultForgeSettings, settingUnderConstruction } from '../src/rules/campaignFilter.ts'

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

test('filtro de cenários do construtor: vazio = tudo; senão Core mais os escolhidos', async () => {
  const { allowedBySettings } = await import('../src/rules/campaignFilter.ts')
  assert.equal(allowedBySettings('Ravenloft', []), true)
  assert.equal(allowedBySettings(null, null), true)
  assert.equal(allowedBySettings(null, ['Ravenloft']), true)
  assert.equal(allowedBySettings('Ravenloft', ['Ravenloft']), true)
  assert.equal(allowedBySettings('Planescape', ['Ravenloft']), false)
  assert.equal(allowedBySettings('Forgotten Realms', ['Dark Sun', 'Forgotten Realms']), true)
})

test('Forge: Al-Qadim, Council of Wyrms e Spelljammer em obras; o resto vale; o padrão é Forgotten Realms', () => {
  for (const s of ['Al-Qadim', 'Council of Wyrms', 'Spelljammer']) assert.equal(settingUnderConstruction(s), true)
  for (const s of ['Forgotten Realms', 'Dark Sun', 'Ravenloft', 'Planescape', 'Greyhawk']) assert.equal(settingUnderConstruction(s), false)
  assert.deepEqual(defaultForgeSettings, ['Forgotten Realms'])
  assert.equal(settingUnderConstruction(defaultForgeSettings[0]), false)
})

test('armas de cenário: Gythka some sem Dark Sun, aparece com ele ou sem filtro; a já escolhida fica', async () => {
  const { weaponsForSettings } = await import('../src/rules/campaignFilter.ts')
  const weapons = [
    { id: 'long_sword', name: 'Long sword', campaignSetting: undefined },
    { id: 'katana', name: 'Katana', campaignSetting: null },
    { id: 'gythka', name: 'Gythka (Thrown)', campaignSetting: 'Dark Sun' },
  ]
  const ids = (list: { id: string }[]) => list.map((w) => w.id)
  assert.deepEqual(ids(weaponsForSettings(weapons, ['Forgotten Realms'])), ['long_sword', 'katana'])
  assert.deepEqual(ids(weaponsForSettings(weapons, ['Forgotten Realms', 'Dark Sun'])), ['long_sword', 'katana', 'gythka'])
  assert.deepEqual(ids(weaponsForSettings(weapons, null)), ['long_sword', 'katana', 'gythka'])
  assert.deepEqual(ids(weaponsForSettings(weapons, [])), ['long_sword', 'katana', 'gythka'])
  assert.deepEqual(ids(weaponsForSettings(weapons, ['Ravenloft'], (w) => w.id === 'gythka')), ['long_sword', 'katana', 'gythka'])
})
