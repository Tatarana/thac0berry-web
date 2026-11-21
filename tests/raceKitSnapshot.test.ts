// Não-regressão de "Raças em dados": as 17 raças que antes viviam em raceKit.ts
// têm de dar exatamente a mesma saída lendo de data/races.json (o fixture foi
// gerado com o código antigo). Ver tests/helpers/raceKitSnapshot.ts.

import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { snapshot } from './helpers/raceKitSnapshot.ts'

const file = join(import.meta.dirname, 'fixtures', 'raceKit.snapshot.json')

test('as 17 raças de antes dão a mesma saída em todas as funções públicas', () => {
  const current = JSON.parse(JSON.stringify(snapshot()))
  if (process.env.UPDATE_SNAPSHOT === '1' || !existsSync(file)) {
    writeFileSync(file, JSON.stringify(current, null, 1) + '\n')
    return
  }
  const expected = JSON.parse(readFileSync(file, 'utf8'))
  for (const key of Object.keys(expected)) assert.deepEqual(current[key], expected[key], key)
  assert.deepEqual(Object.keys(current), Object.keys(expected))
})
