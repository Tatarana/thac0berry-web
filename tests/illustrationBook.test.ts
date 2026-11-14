// Livro de ilustrações (src/rules/illustrationBook.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as B from '../src/rules/illustrationBook.ts'

const index = [
  { id: 'z-wolf', name: 'Wolf', collection: 'Ravenloft' },
  { id: 'a-ghoul', name: 'Ghoul', collection: 'Ravenloft' },
  { id: 'mm-orc', name: 'Orc', collection: 'Monstrous Manual Core' },
  { id: 'dl-draco', name: 'Draconian', collection: 'Dragonlance' },
  { id: 'x-new', name: 'Newcomer', collection: 'Brand New Collection' },
  { id: 'mm-bare', name: 'Bare', collection: 'Monstrous Manual Core' },
]

test('numeração romana', () => {
  assert.equal(B.toRoman(1), 'I')
  assert.equal(B.toRoman(4), 'IV')
  assert.equal(B.toRoman(9), 'IX')
  assert.equal(B.toRoman(14), 'XIV')
  assert.equal(B.toRoman(49), 'XLIX')
  assert.equal(B.toRoman(0), '0')
})

test('trecho do endereço da coleção', () => {
  assert.equal(B.collectionSlug('Mystara & Savage Coast'), 'mystara-savage-coast')
  assert.equal(B.collectionSlug('Other Campaigns / Magazines'), 'other-campaigns-magazines')
})

test('capítulos: só coleções com imagem, na ordem de monsterCollections, pranchas em ordem alfabética', () => {
  const chapters = B.buildChapters(index, new Set(['z-wolf', 'a-ghoul', 'mm-orc', 'dl-draco', 'x-new', 'sem-indice']))
  assert.deepEqual(chapters.map((c) => c.collection), ['Monstrous Manual Core', 'Dragonlance', 'Ravenloft', 'Brand New Collection'])
  assert.deepEqual(chapters.map((c) => c.roman), ['I', 'II', 'III', 'IV'])
  assert.deepEqual(chapters[2].plates.map((p) => p.name), ['Ghoul', 'Wolf'])
  assert.equal(chapters[0].plates.length, 1)
  assert.equal(B.totalPlates(chapters), 5)
  assert.equal(B.bookSummary(chapters), '5 plates · 4 chapters')
})

test('sem imagens, sem capítulos', () => {
  assert.deepEqual(B.buildChapters(index, new Set()), [])
  assert.equal(B.bookSummary([]), '0 plates · 0 chapters')
})

test('navegação: primeira, última e capítulo de uma prancha', () => {
  const chapters = B.buildChapters(index, new Set(['z-wolf', 'a-ghoul', 'mm-orc', 'dl-draco']))
  const rav = chapters[2]
  assert.deepEqual(B.plateNav(rav, 'a-ghoul'), { position: 1, total: 2, label: 'Plate 1 of 2', previousId: null, nextId: 'z-wolf' })
  assert.deepEqual(B.plateNav(rav, 'z-wolf'), { position: 2, total: 2, label: 'Plate 2 of 2', previousId: 'a-ghoul', nextId: null })
  const mm = chapters[0]
  assert.deepEqual(B.plateNav(mm, 'mm-orc'), { position: 1, total: 1, label: 'Plate 1 of 1', previousId: null, nextId: null })
  assert.equal(B.plateNav(mm, 'nope'), null)
})

test('janela dos pontos: no máximo 9, deslizando em volta da atual', () => {
  assert.deepEqual(B.dotWindow(0, 0), { start: 0, count: 0, active: 0 })
  assert.deepEqual(B.dotWindow(1, 0), { start: 0, count: 1, active: 0 })
  assert.deepEqual(B.dotWindow(5, 3), { start: 0, count: 5, active: 3 })
  assert.deepEqual(B.dotWindow(41, 0), { start: 0, count: 9, active: 0 })
  assert.deepEqual(B.dotWindow(41, 3), { start: 0, count: 9, active: 3 })
  assert.deepEqual(B.dotWindow(41, 20), { start: 16, count: 9, active: 4 })
  assert.deepEqual(B.dotWindow(41, 40), { start: 32, count: 9, active: 8 })
  assert.deepEqual(B.dotWindow(41, 99), { start: 32, count: 9, active: 8 })
})
