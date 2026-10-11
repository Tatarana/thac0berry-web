// Ravenloft (docs/ravenloft.md): Anchorite jogável (Domains of Dread) e os
// testes de medo, horror e loucura.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import * as R from '../src/rules/rules.ts'
import * as V from '../src/rules/ravenloft.ts'
import * as S from '../src/rules/sessionReport.ts'
import { levelLimitWarning } from '../src/rules/raceKit.ts'
import type { CharacterClass, PlayerCharacter } from '../src/types/library.ts'

const base: CharacterClass[] = ['Fighter', 'Cleric']
const abilities = { strength: 12, dexterity: 10, constitution: 12, intelligence: 10, wisdom: 16, charisma: 15 }

function anchorite(over: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return { characterClass: 'Anchorite', level: 5, race: 'Human', abilities: { ...abilities }, ...over } as unknown as PlayerCharacter
}

test('o Anchorite só aparece no seletor com Ravenloft ligado na campanha', () => {
  assert.deepEqual(V.classOptionsFor(base, null), base)
  assert.deepEqual(V.classOptionsFor(base, []), base)
  assert.deepEqual(V.classOptionsFor(base, ['Dark Sun']), base)
  assert.deepEqual(V.classOptionsFor(base, ['Ravenloft', 'Dark Sun']), [...base, 'Anchorite'])
})

test('avisos do Anchorite: campanha sem Ravenloft, WIS/CHA abaixo do mínimo, raça', () => {
  assert.deepEqual(V.ravenloftWarnings(anchorite(), ['Ravenloft']), [])
  const all = V.ravenloftWarnings(anchorite({ race: 'Dwarf', abilities: { ...abilities, wisdom: 11, charisma: 14 } }), null)
  assert.equal(all.length, 4)
  assert.match(all[0], /does not have the Ravenloft setting/)
  assert.match(all[1], /Wisdom 12/)
  assert.match(all[2], /Charisma 15/)
  assert.match(all[3], /must be human/)
  // Outras classes não ganham aviso nenhum.
  assert.deepEqual(V.ravenloftWarnings(anchorite({ characterClass: 'Cleric' }), null), [])
  assert.match(levelLimitWarning('Elf', 'Anchorite', 1)!, /Domains of Dread/)
})

test('Anchorite: grupo Priest, d8, THAC0, saves e slots do sacerdote, XP próprio', () => {
  assert.equal(R.canonicalClass('Anchorite'), 'Anchorite')
  assert.equal(R.classGroup('Anchorite'), 'Priest')
  assert.equal(R.hitDieType('Anchorite'), 'd8')
  assert.equal(R.hasSpellSheet('Anchorite'), true)
  assert.equal(R.isArcaneCaster('Anchorite'), false)
  for (let level = 1; level <= 20; level++) {
    const ctx = (cls: string) => ({ level, characterClass: cls, abilities })
    assert.deepEqual(R.resolveRule('thac0', ctx('Anchorite')), R.resolveRule('thac0', ctx('Cleric')))
    assert.deepEqual(R.resolveRule('savingThrows', ctx('Anchorite')), R.resolveRule('savingThrows', ctx('Cleric')))
    assert.deepEqual(R.resolveRule('priestSpellSlots', ctx('Anchorite')), R.resolveRule('priestSpellSlots', ctx('Cleric')))
  }
  assert.equal(R.xpNeededForNextLevel(1, 'Anchorite'), '2,000')
  const slots = (cls: CharacterClass) => R.computedSpellSlotAllotments({ characterClass: cls, level: 9, abilities })
  assert.deepEqual(slots('Anchorite'), slots('Cleric'))
  assert.ok(slots('Anchorite').length > 0)
  assert.deepEqual(S.primeRequisites.Anchorite, ['wisdom'])
})

test('Fear/Horror/Madness Checks do Anchorite pelo nível (tabela do grupo Priest)', () => {
  assert.deepEqual(V.scareChecks('Anchorite', 1), { fear: 13, horror: 15, madness: 18 })
  assert.deepEqual(V.scareChecks('Anchorite', 7), { fear: 10, horror: 12, madness: 15 })
  assert.deepEqual(V.scareChecks('Anchorite', 20), { fear: 2, horror: 3, madness: 8 })
  assert.equal(V.scareChecks('Anchorite', 21), null)
  assert.equal(V.scareChecks('Cleric', 5), null)
})

test('dados reais: as tabelas do código batem com o Domains of Dread no rules.json', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const rules = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')) as { id: string; tables: { title: string; rows: string[][] }[] }[]
  const table = (ruleID: string, title: string) => rules.find((r) => r.id === ruleID)!.tables.find((t) => t.title === title)!
  const number = (text: string) => Number(text.replace(/,/g, ''))
  // XP e slots da progressão do Anchorite.
  const progression = table('dod_ch00_anchorite', 'Anchorite Progression')
  progression.rows.forEach((row, i) => {
    const level = i + 1
    assert.equal(R.xpRequired(level, 'Anchorite'), number(row[1]), `XP do nível ${level}`)
    // Com WIS 18 (libera os círculos 6 e 7), tirando o bônus de Sabedoria do PHB (+2/+2/+1/+1 nos círculos 1–4).
    const book = row.slice(4).map((cell) => (cell === '—' ? 0 : Number(cell)))
    // Pendência conhecida (fora do Anchorite): a PriestTables do app (Character.swift do iPad)
    // tem 9 no 3º círculo do 19º nível; a Tabela 24 do PHB e o Domains of Dread têm 8.
    if (level === 19) book[2] = 9
    assert.deepEqual(R.priestSpellProgression(level, 18).map((n, c) => n - [2, 2, 1, 1, 0, 0, 0][c] * (n > 0 ? 1 : 0)), book, `slots do nível ${level}`)
  })
  // Testes do grupo Priest.
  const checks = table('dod_ch00_fear_horror_and_madness_checks', 'Priest Fear, Horror and Madness Checks')
  for (const [levels, fear, horror, madness] of checks.rows) {
    const level = Number(levels.split('-').pop())
    if (level === 0) continue
    assert.deepEqual(V.scareChecks('Anchorite', level), { fear: Number(fear), horror: Number(horror), madness: Number(madness) }, `nível ${levels}`)
  }
})
