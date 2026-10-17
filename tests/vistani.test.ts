// Tribos de Vistani (src/rules/vistani.ts; Domains of Dread, Tabela 68).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchVistaniTribe, vistaniTribeForRoll, vistaniTribes, vistaniTribeWarnings } from '../src/rules/vistani.ts'

test('Tabela 68: a faixa de cada tribo cobre 1–100 sem buraco nem sobreposição', () => {
  const sorted = [...vistaniTribes].sort((a, b) => a.roll.low - b.roll.low)
  assert.equal(sorted[0].roll.low, 1)
  assert.equal(sorted[sorted.length - 1].roll.high, 100)
  for (let i = 1; i < sorted.length; i++) assert.equal(sorted[i].roll.low, sorted[i - 1].roll.high + 1)
  assert.equal(vistaniTribeForRoll(1)!.id, 'kamii')
  assert.equal(vistaniTribeForRoll(40)!.id, 'kamii')
  assert.equal(vistaniTribeForRoll(41)!.id, 'equaar')
  assert.equal(vistaniTribeForRoll(99)!.id, 'canjar')
  assert.equal(vistaniTribeForRoll(100)!.id, 'zarovan')
  assert.equal(vistaniTribeForRoll(0)!.id, 'zarovan') // "00" da Tabela 68
  assert.equal(matchVistaniTribe('zarovan')!.name, 'Zarovan')
  assert.equal(matchVistaniTribe(null), null)
  assert.equal(matchVistaniTribe('not-a-tribe'), null)
})

test('restrição de classe por tribo: só aviso, nunca bloqueia', () => {
  assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe('kamii')!, 'Mage'), ['Kamii are never spellcasters (Domains of Dread).'])
  assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe('kamii')!, 'Fighter'), [])
  assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe('corvara')!, 'Fighter'), [])
  assert.match(vistaniTribeWarnings(matchVistaniTribe('corvara')!, 'Cleric')[0], /Corvara are almost always thieves/)
  assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe('canjar')!, 'Mage'), [])
  assert.match(vistaniTribeWarnings(matchVistaniTribe('canjar')!, 'Fighter')[0], /Canjar are always wizards/)
  assert.match(vistaniTribeWarnings(matchVistaniTribe('zarovan')!, 'Gypsy')[0], /Zarovan are always wizards/)
  // Tribos sem restrição: nunca avisam.
  for (const id of ['equaar', 'vatraska', 'naiat']) {
    assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe(id)!, 'Fighter'), [])
    assert.deepEqual(vistaniTribeWarnings(matchVistaniTribe(id)!, 'Mage'), [])
  }
})
