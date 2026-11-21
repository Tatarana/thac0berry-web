// Tamanho do texto de leitura (src/rules/readingScale.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_READING_INDEX,
  READING_STEPS,
  canStepReading,
  clampReadingIndex,
  parseStoredReadingScale,
  readingKeyDelta,
  readingLineHeight,
  readingPercentLabel,
  readingScaleOf,
  serializeReadingIndex,
  stepReadingIndex,
} from '../src/rules/readingScale.ts'

test('os passos são 90, 100, 115, 130 e 150%, e o padrão é 100%', () => {
  assert.deepEqual([...READING_STEPS], [0.9, 1, 1.15, 1.3, 1.5])
  assert.equal(readingScaleOf(DEFAULT_READING_INDEX), 1)
})

test('clampReadingIndex limita aos extremos e troca lixo por 100%', () => {
  assert.equal(clampReadingIndex(-3), 0)
  assert.equal(clampReadingIndex(99), 4)
  assert.equal(clampReadingIndex(2), 2)
  assert.equal(clampReadingIndex(Number.NaN), DEFAULT_READING_INDEX)
  assert.equal(clampReadingIndex(1.5), DEFAULT_READING_INDEX)
})

test('stepReadingIndex anda um passo e para nos extremos', () => {
  assert.equal(stepReadingIndex(1, 1), 2)
  assert.equal(stepReadingIndex(1, -1), 0)
  assert.equal(stepReadingIndex(0, -1), 0)
  assert.equal(stepReadingIndex(4, 1), 4)
})

test('canStepReading é falso só nos extremos', () => {
  assert.equal(canStepReading(0, -1), false)
  assert.equal(canStepReading(0, 1), true)
  assert.equal(canStepReading(4, 1), false)
  assert.equal(canStepReading(4, -1), true)
})

test('percentual e valor gravado', () => {
  assert.equal(readingPercentLabel(2), '115%')
  assert.equal(readingPercentLabel(0), '90%')
  assert.equal(serializeReadingIndex(3), '130')
})

test('parseStoredReadingScale lê o percentual e cai em 100% se for inválido', () => {
  for (let index = 0; index < READING_STEPS.length; index++) {
    assert.equal(parseStoredReadingScale(serializeReadingIndex(index)), index)
  }
  for (const bad of [null, undefined, '', 'abc', '110', '1.15', '-100', '9999', '115%', ' ']) {
    assert.equal(parseStoredReadingScale(bad), DEFAULT_READING_INDEX, String(bad))
  }
})

test('a entrelinha cai de 1.6 para 1.5 a partir de 130%', () => {
  assert.equal(readingLineHeight(0), 1.6)
  assert.equal(readingLineHeight(2), 1.6)
  assert.equal(readingLineHeight(3), 1.5)
  assert.equal(readingLineHeight(4), 1.5)
})

test('readingKeyDelta: + e = aumentam, - diminui, com modificador ou outra tecla não faz nada', () => {
  const key = (k: string, mods: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods })
  assert.equal(readingKeyDelta(key('+')), 1)
  assert.equal(readingKeyDelta(key('=')), 1)
  assert.equal(readingKeyDelta(key('-')), -1)
  assert.equal(readingKeyDelta(key('a')), 0)
  assert.equal(readingKeyDelta(key('+', { ctrlKey: true })), 0)
  assert.equal(readingKeyDelta(key('-', { metaKey: true })), 0)
  assert.equal(readingKeyDelta(key('=', { altKey: true })), 0)
})
