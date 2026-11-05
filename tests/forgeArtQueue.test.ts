// Fila de geração das ilustrações (scripts/lib/forge-art.mjs).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pendingArt, promptsOfDoc } from '../scripts/lib/forge-art.mjs'

const fence = '```'
const doc = (name: string, text: string, mark = ' ') => `- [${mark}] **${name}.webp**\n  ${fence}\n  ${text}\n  ${fence}\n`

test('lê nome e prompt do documento', () => {
  const list = promptsOfDoc(doc('combo-elf-mage-male', 'um elfo') + '\n' + doc('race-elf-male', 'outro', 'x'))
  assert.deepEqual(list, [
    { name: 'combo-elf-mage-male', prompt: 'um elfo' },
    { name: 'race-elf-male', prompt: 'outro' },
  ])
})

test('tira o que já existe e ordena: combinações comuns, armas, genéricas', () => {
  const names = ['class-bard-male', 'weapons-other', 'combo-modron-mage', 'combo-dwarf-thief-male', 'combo-human-fighter-male', 'combo-human-gypsy-male', 'combo-human-mage-male']
  const queue = pendingArt(names.map((name) => ({ name, prompt: 'x' })), new Set(['combo-human-gypsy-male']))
  assert.deepEqual(
    queue.map((item) => item.name),
    ['combo-human-fighter-male', 'combo-human-mage-male', 'combo-dwarf-thief-male', 'combo-modron-mage', 'weapons-other', 'class-bard-male'],
  )
  assert.equal(queue[0].slot, 'forge/combo-human-fighter-male')
})
