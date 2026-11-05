// Imagens do site (src/lib/siteImageRules.ts): slots, tamanhos e recorte.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as S from '../src/lib/siteImageRules.ts'

test('slot a partir do arquivo do repo', () => {
  assert.equal(S.slotOfSrc('/thac0berry-web/images/forge/race-dwarf-male.webp'), 'forge/race-dwarf-male')
  assert.equal(S.slotOfSrc('blob:http://localhost/abc'), null)
  assert.equal(S.slotOfSrc('/images/mode_player.jpg'), null)
})

test('tamanho de cada tipo de slot', () => {
  assert.deepEqual(S.slotSize('forge/race-elf-female'), { width: 896, height: 1200 })
  assert.deepEqual(S.slotSize('forge/weapons-missile'), { width: 1680, height: 720 })
  assert.deepEqual(S.slotSize('forge/gender-male'), { width: 848, height: 848 })
  assert.deepEqual(S.slotSize('monster/beholder'), { width: 896, height: 1200 })
})

test('recorte cobre o alvo, centrado e nas pontas', () => {
  const source = { width: 2000, height: 2000 }
  const target = { width: 896, height: 1200 }
  const center = S.coverCrop(source, target, 1, { x: 0, y: 0 })
  assert.equal(center.height, 2000)
  assert.ok(Math.abs(center.width - 1493.33) < 0.01)
  assert.ok(Math.abs(center.x - 253.33) < 0.01)
  assert.equal(S.coverCrop(source, target, 1, { x: -1, y: 0 }).x, 0)
  assert.ok(Math.abs(S.coverCrop(source, target, 1, { x: 1, y: 0 }).x - 506.67) < 0.01)
  assert.equal(S.coverCrop(source, target, 2, { x: 0, y: 0 }).height, 1000)
})

test('arrastar para a direita mostra mais da esquerda; proporção exata não anda', () => {
  const target = { width: 896, height: 1200 }
  const shown = { width: 448, height: 600 }
  const moved = S.panAfterDrag({ width: 2000, height: 2000 }, target, 1, { x: 0, y: 0 }, { dx: 50, dy: 50 }, shown)
  assert.ok(moved.x < 0)
  assert.equal(moved.y, 0)
  assert.deepEqual(S.panAfterDrag(target, target, 1, { x: 0, y: 0 }, { dx: 50, dy: 50 }, shown), { x: 0, y: 0 })
  assert.equal(S.panAfterDrag({ width: 2000, height: 2000 }, target, 1, { x: 0, y: 0 }, { dx: -9999, dy: 0 }, shown).x, 1)
})

test('combinação sem versão sai da lista; o resto segue a regra de sempre', () => {
  const combo = '/images/forge/combo-dwarf-cleric-male.webp'
  const cls = '/images/forge/class-cleric-male.webp'
  assert.deepEqual(S.resolveSiteImages([combo, cls], new Map()), [cls])
  assert.deepEqual(S.resolveSiteImages([combo, cls], new Map([['forge/combo-dwarf-cleric-male', 'https://cdn/a.webp']])), ['https://cdn/a.webp', cls])
  assert.deepEqual(S.resolveSiteImages([cls], new Map([['forge/class-cleric-male', 'https://cdn/b.webp']])), ['https://cdn/b.webp'])
})
