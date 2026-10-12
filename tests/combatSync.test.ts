// Encontros do Combat Tracker na conta (src/rules/combatSync.ts; backlog item 4).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSettings, type Encounter } from '../src/rules/combat.ts'
import * as S from '../src/rules/combatSync.ts'

const enc = (id: string, round = 0): Encounter =>
  ({ id, name: `E ${id}`, campaignID: null, createdAt: '2026-10-12T10:00:00Z', updatedAt: '2026-10-12T10:00:00Z', round, combatants: [] }) as Encounter

test('o que mudou: novos e alterados pelo conteúdo, removidos pelo id', () => {
  const before = [enc('a'), enc('b'), enc('c')]
  const after = [enc('a'), enc('b', 2), enc('d')]
  const { changed, removed } = S.encounterChanges(before, after)
  assert.deepEqual(changed.map((e) => e.id), ['b', 'd'])
  assert.deepEqual(removed, ['c'])
  // Sem mudança nenhuma: nada a gravar.
  assert.deepEqual(S.encounterChanges(before, structuredClone(before)), { changed: [], removed: [] })
})

test('primeira vez com login: sobem só os encontros que a conta não tem (id sem diferenciar maiúsculas)', () => {
  const local = [enc('AAAA-1'), enc('bbbb-2')]
  assert.deepEqual(S.encountersToUpload(local, ['aaaa-1']).map((e) => e.id), ['bbbb-2'])
  assert.deepEqual(S.encountersToUpload([], ['x']), [])
})

test('configurações da conta sobre as padrão; as do aparelho só sobem se diferentes das padrão', () => {
  assert.deepEqual(S.settingsFromAccount(null), defaultSettings)
  assert.equal(S.settingsFromAccount({ deathAt: 0 }).deathAt, 0)
  assert.equal(S.settingsFromAccount({ deathAt: 0 }).initiative, defaultSettings.initiative)
  assert.equal(S.customSettings({ ...defaultSettings }), false)
  assert.equal(S.customSettings({ ...defaultSettings, monsterHp: 'average' }), true)
})

test('pendências: o que a conta ainda não tem, guardado no aparelho', () => {
  const shadow = { encounters: [enc('a'), enc('b')], settings: JSON.stringify(defaultSettings) }
  assert.equal(S.unsyncedChanges(shadow, [enc('a'), enc('b')], defaultSettings), null)
  assert.deepEqual(S.unsyncedChanges(shadow, [enc('a', 1), enc('c')], { ...defaultSettings, deathAt: 0 }), {
    encounters: ['a', 'c'],
    removed: ['b'],
    settings: true,
  })
})
