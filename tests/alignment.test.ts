// Alinhamento no The Forge (src/rules/alignment.ts): o que cada classe e kit
// aceita e a leitura dos dilemas.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as A from '../src/rules/alignment.ts'

test('códigos e nomes da ficha', () => {
  assert.equal(A.alignmentCode('True Neutral'), 'TN')
  assert.equal(A.alignmentCode(''), null)
  assert.equal(A.alignments.length, 9)
})

test('classes: PHB, CPsiH, Ninja e Domains of Dread', () => {
  assert.equal(A.classAllows('Paladin', 'Lawful Good'), true)
  assert.equal(A.classAllows('Paladin', 'Neutral Good'), false)
  assert.equal(A.classAllows('Ranger', 'Chaotic Good'), true)
  assert.equal(A.classAllows('Ranger', 'True Neutral'), false)
  assert.equal(A.classAllows('Druid', 'True Neutral'), true)
  assert.equal(A.classAllows('Thief', 'Lawful Good'), false)
  assert.equal(A.classAllows('Bard', 'Lawful Good'), false)
  assert.equal(A.classAllows('Bard', 'Neutral Evil'), true)
  assert.equal(A.classAllows('Psionicist', 'Chaotic Good'), false)
  assert.equal(A.classAllows('Anchorite', 'Lawful Neutral'), true)
  assert.equal(A.classAllows('Anchorite', 'Lawful Evil'), false)
  assert.equal(A.classAllows('Fighter', 'Chaotic Evil'), true)
  // sem alinhamento: nada a avisar
  assert.equal(A.classAllows('Paladin', ''), true)
  assert.match(A.classAlignmentWarning('Paladin', 'Chaotic Good')!, /lawful good only/)
})

test('kits: lê os textos dos dados', () => {
  assert.deepEqual(A.kitAlignments(['True Neutral']), ['TN'])
  assert.equal(A.kitAlignments(['Any'])!.length, 9)
  assert.deepEqual(A.kitAlignments(['Any nonlawful'])!.includes('LN'), false)
  assert.deepEqual(A.kitAlignments(['Any but LG'])!.includes('LG'), false)
  assert.deepEqual(A.kitAlignments(['Any non-evil (rarely lawful)'])!.includes('NE'), false)
  assert.deepEqual(A.kitAlignments(['LG, NG, LN, N; rarely LE'])!.sort(), ['LG', 'LN', 'NG', 'TN'])
  assert.equal(A.kitAlignments([]), null)
  assert.equal(A.kitAlignments(['as the deity']), null)
  assert.match(A.kitAlignmentWarning(['True Neutral'], 'Lawful Good')!, /True Neutral/)
  assert.equal(A.kitAlignmentWarning(['Any'], 'Chaotic Evil'), null)
})

test('dilemas: a média leva ao alinhamento', () => {
  assert.equal(A.soulReading([]), 'TN')
  assert.equal(A.soulReading([[1, 1]]), 'LG')
  assert.equal(A.soulReading([[-1, -1], [-1, -0.7]]), 'CE')
  assert.equal(A.soulReading([[1, 0], [-1, 0]]), 'TN')
  assert.equal(A.soulReading([[-0.5, 1], [0.6, 1], [-0.4, 1], [-0.6, 0.7], [0, 0]]), 'NG')
  assert.deepEqual(A.soulPosition([[1, 1], [1, 1]]), { law: 1, good: 1 })
})
