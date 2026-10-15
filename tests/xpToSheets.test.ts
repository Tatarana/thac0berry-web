// XP do encontro nas fichas (src/rules/xpToSheets.ts; CT9).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blankCombatant, xpAward } from '../src/rules/combat.ts'
import * as X from '../src/rules/xpToSheets.ts'

const abilities = (over: Partial<X.SheetForXp['abilities']>) => ({ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10, ...over })

test('bônus de 10%: 16+ em todos os atributos principais, só em uma classe', () => {
  assert.deepEqual(X.primeBonus({ characterClass: 'Fighter', abilities: abilities({ strength: 16 }) }, 157), { bonus: 15 })
  assert.deepEqual(X.primeBonus({ characterClass: 'Fighter', abilities: abilities({ strength: 15 }) }, 157), { bonus: 0 })
  // Paladino: Força e Carisma.
  assert.deepEqual(X.primeBonus({ characterClass: 'Paladin', abilities: abilities({ strength: 17 }) }, 100), { bonus: 0 })
  assert.deepEqual(X.primeBonus({ characterClass: 'Paladin', abilities: abilities({ strength: 17, charisma: 17 }) }, 100), { bonus: 10 })
  // Multiclasse: sem bônus automático.
  const multi = { characterClass: 'Fighter', multiClasses: [{ characterClass: 'Fighter' }, { characterClass: 'Thief' }], abilities: abilities({ strength: 18, dexterity: 18 }) }
  assert.equal(X.primeBonus(multi, 100).bonus, 0)
  assert.match(X.primeBonus(multi, 100).note ?? '', /multiclass/)
})

test('linhas: quem tem ficha (com bônus) e quem é dado à mão; a linha do log', () => {
  const rufus = { ...blankCombatant('pc', 'party', 'Rufus'), characterID: 'AAA' }
  const ana = { ...blankCombatant('pc', 'party', 'Ana'), characterID: 'bbb' }
  const ze = blankCombatant('pc', 'party', 'Zé')
  const orc = { ...blankCombatant('monster', 'enemies', 'Orc'), xp: 315 }
  const award = xpAward([orc], [rufus, ana, ze])
  assert.equal(award.each, 105)
  const sheets = new Map<string, X.SheetForXp>([
    ['aaa', { characterClass: 'Fighter', abilities: abilities({ strength: 16 }) }],
    ['bbb', { characterClass: 'Mage', abilities: abilities({ intelligence: 12 }) }],
  ])
  const lines = X.xpLines(award, [rufus, ana, ze, orc], sheets)
  assert.deepEqual(
    lines.map((l) => [l.name, l.characterID, l.base, l.bonus]),
    [
      ['Rufus', 'AAA', 105, 10],
      ['Ana', 'bbb', 105, 0],
      ['Zé', null, 105, 0],
    ],
  )
  assert.equal(
    X.xpAppliedText({ at: '', entries: [{ characterID: 'AAA', name: 'Rufus', amount: 115, prime: true }, { characterID: 'bbb', name: 'Ana', amount: 105, prime: false }] }),
    'XP to the sheets: Rufus +115 (prime +10%), Ana +105',
  )
})
