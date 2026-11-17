// O rascunho do Forge sobrevive ao login, mas não vira personagem dias depois.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearForgeDraft, forgeDraftTTL, forgeDraftVersion, keepForgeDraft, migrateForgeSnapshot, readForgeDraft, type ForgeSnapshot } from '../src/lib/forgeDraft.ts'

const memory = () => {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
    removeItem: (k: string) => void items.delete(k),
  }
}

const snapshot = { step: 11, classChosen: true, settings: ['Ravenloft'], alignmentAnswers: null, sphereFor: 'Cleric', portrait: null } as unknown as ForgeSnapshot

test('rascunho volta igual depois do login', () => {
  const store = memory()
  assert.equal(keepForgeDraft(snapshot, store, 1000), true)
  assert.deepEqual(readForgeDraft(store, 1000 + 60_000), snapshot)
})

test('rascunho velho não vale, e limpar apaga', () => {
  const store = memory()
  keepForgeDraft(snapshot, store, 1000)
  assert.equal(readForgeDraft(store, 1000 + forgeDraftTTL + 1), null)
  assert.notEqual(readForgeDraft(store, 1000), null)
  clearForgeDraft(store)
  assert.equal(readForgeDraft(store, 1000), null)
})

test('armazenamento bloqueado avisa em vez de perder o herói calado', () => {
  const blocked = { ...memory(), setItem: () => { throw new Error('quota') } }
  assert.equal(keepForgeDraft(snapshot, blocked), false)
})

test('rascunho gravado antes da etapa Campaign Setting sobe um passo; o novo não mexe', () => {
  const store = memory()
  // Formato antigo: sem `version` no envelope.
  store.setItem('thac0berry.forge.pending', JSON.stringify({ savedAt: 1000, snapshot: { ...snapshot, step: 4 } }))
  assert.equal(readForgeDraft(store, 1000)?.step, 5)
  assert.equal(migrateForgeSnapshot({ ...snapshot, step: 4 }, forgeDraftVersion).step, 4)
  keepForgeDraft({ ...snapshot, step: 4 }, store, 1000)
  assert.equal(readForgeDraft(store, 1000)?.step, 4)
})

test('mundos em obras saem dos cenários gravados', () => {
  assert.deepEqual(migrateForgeSnapshot({ ...snapshot, settings: ['Spelljammer', 'Ravenloft'] }, forgeDraftVersion).settings, ['Ravenloft'])
})
