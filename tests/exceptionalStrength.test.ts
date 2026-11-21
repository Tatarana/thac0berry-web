// Força excepcional (PHB Tabela 1): quem tem direito, a rolagem, a escrita
// "18/xx" e a limpeza quando o direito se perde. As faixas da tabela em si
// são conferidas contra o iPad em tests/rules.test.ts; aqui, as de Tabela 1
// do livro também, em números.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as E from '../src/rules/exceptionalStrength.ts'
import * as K from '../src/rules/raceKit.ts'
import { strengthRow } from '../src/rules/rules.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

function hero(over: Partial<PlayerCharacter> & { str?: number; exc?: number | null } = {}): PlayerCharacter {
  const { str = 18, exc = null, ...rest } = over
  return {
    characterClass: 'Fighter',
    level: 1,
    experience: 0,
    race: 'Human',
    abilities: { strength: str, exceptionalStrength: exc, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: {},
    details: {},
    combat: null,
    levelChanges: null,
    wizardSpellbook: [],
    xpNeededNextLevel: null,
    ...rest,
  } as unknown as PlayerCharacter
}

test('tem direito: Força 18 e classe de guerreiro', () => {
  assert.equal(E.qualifiesForExceptionalStrength(hero()), true)
  for (const cls of ['Fighter', 'Paladin', 'Ranger']) assert.equal(E.qualifiesForExceptionalStrength(hero({ characterClass: cls as never })), true, cls)
  for (const cls of ['Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Psionicist']) assert.equal(E.qualifiesForExceptionalStrength(hero({ characterClass: cls as never })), false, cls)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ str: 17 })), false)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ str: 19 })), false)
})

test('multiclasse e classe dupla: basta uma classe de guerreiro entre as classes', () => {
  assert.equal(E.qualifiesForExceptionalStrength(hero({ characterClass: 'Mage', multiClasses: [{ characterClass: 'Fighter', level: 1 }] })), true)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ characterClass: 'Mage', multiClasses: [{ characterClass: 'Thief', level: 1 }] })), false)
  // Classe dupla: Fighter congelado nas anteriores, Mage agora.
  assert.equal(E.qualifiesForExceptionalStrength(hero({ characterClass: 'Mage', formerClasses: [{ characterClass: 'Fighter', level: 5 }] })), true)
})

test('raça: Força máxima abaixo de 18 nunca tem; humano e as demais, sim', () => {
  assert.equal(K.raceStrengthMax('Halfling'), 17)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ race: 'Halfling' })), false)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ race: 'Dwarf' })), true)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ race: 'Half-Orc' })), true)
  assert.equal(E.qualifiesForExceptionalStrength(hero({ race: 'Human' })), true)
  // Texto livre que não é raça conhecida: sem faixa, sem limite.
  assert.equal(E.qualifiesForExceptionalStrength(hero({ race: 'Something else' })), true)
})

test('rolagem d100: 1 a 100, e 100 se escreve 18/00', () => {
  assert.equal(E.rollExceptionalStrength(() => 0), 1)
  assert.equal(E.rollExceptionalStrength(() => 0.999999), 100)
  assert.equal(E.rollExceptionalStrength(() => 0.5), 51)
  for (let i = 0; i < 500; i++) {
    const v = E.rollExceptionalStrength()
    assert.ok(v >= 1 && v <= 100)
  }
})

test('formatStrength: só 18 leva a barra', () => {
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 1 }), '18/01')
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 37 }), '18/37')
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 99 }), '18/99')
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 100 }), '18/00')
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: null }), '18')
  assert.equal(E.formatStrength({ strength: 18 }), '18')
  assert.equal(E.formatStrength({ strength: 17, exceptionalStrength: 50 }), '17')
  // Valor fora da faixa não vira texto.
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 0 }), '18')
  assert.equal(E.formatStrength({ strength: 18, exceptionalStrength: 101 }), '18')
})

test('parseExceptionalStrength: "00" vale 100', () => {
  assert.equal(E.parseExceptionalStrength('00'), 100)
  assert.equal(E.parseExceptionalStrength('0'), 100)
  assert.equal(E.parseExceptionalStrength('100'), 100)
  assert.equal(E.parseExceptionalStrength('05'), 5)
  assert.equal(E.parseExceptionalStrength(' 99 '), 99)
  assert.equal(E.parseExceptionalStrength(''), null)
  assert.equal(E.parseExceptionalStrength('101'), null)
  assert.equal(E.parseExceptionalStrength('ab'), null)
  assert.equal(E.parseExceptionalStrength('-5'), null)
})

test('faixas da Tabela 1 do PHB (acerto, dano, carga, portas, barras)', () => {
  const want: [number, string, string, string, string, string][] = [
    // pct, hit, dmg, weight, doors, bars
    [1, '1', '3', '135', '12', '20%'],
    [50, '1', '3', '135', '12', '20%'],
    [51, '2', '3', '160', '13', '25%'],
    [75, '2', '3', '160', '13', '25%'],
    [76, '2', '4', '185', '14', '30%'],
    [90, '2', '4', '185', '14', '30%'],
    [91, '2', '5', '235', '15(3)', '35%'],
    [99, '2', '5', '235', '15(3)', '35%'],
    [100, '3', '6', '335', '16(6)', '40%'],
  ]
  for (const [pct, hit, dmg, weight, doors, bars] of want) {
    const row = strengthRow(18, pct)!
    assert.deepEqual([row.hit, row.dmg, row.weight, row.doors, row.bars], [hit, dmg, weight, doors, bars], `18/${pct}`)
  }
  assert.equal(strengthRow(18, 50)!.maxPress, '280')
  assert.equal(strengthRow(18, 75)!.maxPress, '305')
  assert.equal(strengthRow(18, 90)!.maxPress, '330')
  assert.equal(strengthRow(18, 99)!.maxPress, '380')
  assert.equal(strengthRow(18, 100)!.maxPress, '480')
  // 18 puro e Força que não é 18 ignoram o percentil.
  assert.equal(strengthRow(18, null)!.dmg, '2')
  assert.equal(strengthRow(17, 100)!.dmg, '1')
})

test('Força que cai abaixo de 18 apaga o valor; subir de volta não o devolve', () => {
  const c = hero({ exc: 42 })
  C.setAbility(c, 'strength', 17)
  assert.equal(c.abilities.exceptionalStrength, null)
  C.setAbility(c, 'strength', 18)
  assert.equal(c.abilities.exceptionalStrength, null)
})

test('trocar de classe: guerreiro para guerreiro mantém; para mago apaga', () => {
  const c = hero({ exc: 42 })
  C.setClass(c, 'Paladin', null)
  assert.equal(c.abilities.exceptionalStrength, 42)
  C.setClass(c, 'Mage', null)
  assert.equal(c.abilities.exceptionalStrength, null)
})

test('multiclasse: tirar a classe de guerreiro apaga; classe dupla e desfazer mantêm', () => {
  const c = hero({ characterClass: 'Mage', multiClasses: [{ characterClass: 'Fighter', level: 1 }] as never, exc: 77 })
  C.setMultiClasses(c, [{ characterClass: 'Fighter', level: 2 }])
  assert.equal(c.abilities.exceptionalStrength, 77)
  C.setMultiClasses(c, [])
  assert.equal(c.abilities.exceptionalStrength, null)

  const d = hero({ exc: 77, experience: 2000, level: 2 })
  C.dualClassSwitch(d, 'Mage', null)
  assert.equal(d.abilities.exceptionalStrength, 77)
  C.undoDualClass(d)
  assert.equal(d.characterClass, 'Fighter')
  assert.equal(d.abilities.exceptionalStrength, 77)
})

test('trocar para halfling apaga', () => {
  const c = hero({ exc: 10 })
  K.applyRace(c, 'Halfling')
  assert.equal(c.abilities.exceptionalStrength, null)
})

test('setExceptionalStrength: só quem tem direito, só 1–100, null apaga', () => {
  const c = hero()
  C.setExceptionalStrength(c, 63)
  assert.equal(c.abilities.exceptionalStrength, 63)
  C.setExceptionalStrength(c, 101)
  assert.equal(c.abilities.exceptionalStrength, 63)
  C.setExceptionalStrength(c, 0)
  assert.equal(c.abilities.exceptionalStrength, 63)
  C.setExceptionalStrength(c, null)
  assert.equal(c.abilities.exceptionalStrength, null)
  const mage = hero({ characterClass: 'Mage' })
  C.setExceptionalStrength(mage, 50)
  assert.equal(mage.abilities.exceptionalStrength ?? null, null)
})

test('needsExceptionalRoll: tem direito e ainda sem d100', () => {
  assert.equal(E.needsExceptionalRoll(hero()), true)
  assert.equal(E.needsExceptionalRoll(hero({ exc: 5 })), false)
  assert.equal(E.needsExceptionalRoll(hero({ characterClass: 'Mage' })), false)
})

test('mudar o percentil muda os bônus derivados (18/50 contra 18/00)', () => {
  const c = hero({ exc: 50 })
  const before = C.currentRuleContext(c)
  C.setExceptionalStrength(c, 100)
  const items = C.diffConsequences(before, C.currentRuleContext(c)).map((i) => i.id)
  for (const id of ['strengthHit', 'strengthDamage', 'strengthWeight', 'strengthMaxPress', 'strengthDoors', 'strengthBars']) assert.ok(items.includes(id as never), id)
})
