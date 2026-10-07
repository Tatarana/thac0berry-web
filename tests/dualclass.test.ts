// Classe dupla (MC4, docs/multiclasse.md): PHB cap. 3, "Dual-Class Benefits and
// Restrictions". Regras puras (multiclass.ts, rules.ts) e a troca no motor de
// consequências.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as M from '../src/rules/multiclass.ts'
import * as R from '../src/rules/rules.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const abilities = { strength: 17, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 16, charisma: 11 }

function cleric(level = 3): PlayerCharacter {
  return {
    characterClass: 'Cleric',
    level,
    experience: 3500,
    race: 'Human',
    abilities,
    thac0: R.thac0ForLevel('Cleric', level),
    saves: { ...R.savingThrowsForLevel('Cleric', level)! },
    details: {},
    combat: null,
    levelChanges: null,
    wizardSpellbook: [],
    xpNeededNextLevel: null,
  } as unknown as PlayerCharacter
}

test('sem classes anteriores: nada muda', () => {
  const c = cleric()
  assert.equal(M.isDualClass(c), false)
  assert.equal(M.dualClassRestriction(c), null)
  assert.deepEqual(M.allClasses(c), M.classLevels(c))
  assert.deepEqual(M.dualClassWarnings(c), [])
})

test('troca: a classe atual congela, a nova começa no 1 com 0 XP', () => {
  const c = cleric()
  C.dualClassSwitch(c, 'Fighter', null)
  assert.equal(c.characterClass, 'Fighter')
  assert.equal(c.level, 1)
  assert.equal(c.experience, 0)
  assert.deepEqual(c.formerClasses, [{ characterClass: 'Cleric', level: 3 }])
  assert.equal(M.formerLabel(c), 'ex-Cleric 3')
  // Tarus (PHB): restrição até Fighter 4.
  assert.deepEqual(M.dualClassRestriction(c), { characterClass: 'Fighter', untilLevel: 4 })
  // THAC0, saves e magia ficam pendentes para o jogador revisar.
  assert.equal(C.hasPendingConsequences(c), true)
})

test('THAC0 e saves: na restrição só a classe atual; depois, o melhor entre todas (decisão 13)', () => {
  const restricted = { characterClass: 'Fighter' as const, level: 3, abilities, formerClasses: [{ characterClass: 'Cleric' as const, level: 3 }] }
  assert.equal(R.resolveRule('thac0', restricted), R.thac0ForLevel('Fighter', 3))
  assert.deepEqual(R.resolveRule('savingThrows', restricted), R.savingThrowsForLevel('Fighter', 3))
  const free = { ...restricted, level: 4 }
  assert.equal(R.resolveRule('thac0', free), Math.min(R.thac0ForLevel('Fighter', 4)!, R.thac0ForLevel('Cleric', 3)!))
  assert.deepEqual(R.resolveRule('savingThrows', free), R.bestSaves([{ characterClass: 'Fighter', level: 4 }, { characterClass: 'Cleric', level: 3 }]))
})

test('a classe anterior conjura pelo nível em que congelou', () => {
  const c = { characterClass: 'Fighter' as const, level: 1, abilities, formerClasses: [{ characterClass: 'Cleric' as const, level: 3 }] }
  assert.equal(M.hasSpellSheetAny(c), true)
  assert.equal(M.levelOf(c, 'Cleric'), 3)
  assert.equal(M.casterLevel(c, 'divine'), 3)
  assert.deepEqual(R.resolveRule('priestSpellSlots', c), R.priestSpellProgression(3, abilities.wisdom))
  const divine = R.computedSpellSlotAllotments(c).filter((a) => a.caster === 'divine')
  assert.ok(divine.length > 0)
  // XP não é dividido: a classe dupla não é multiclasse.
  assert.equal(M.isMultiClass(c), false)
})

test('requisitos: humano, nível 2+, 15+ na atual e 17+ na nova (só avisos)', () => {
  const ok = M.dualClassRequirements(cleric(), 'Fighter')
  assert.ok(ok.every((r) => r.ok), JSON.stringify(ok))
  const elf = M.dualClassRequirements({ ...cleric(1), race: 'Elf' }, 'Mage')
  const bad = elf.filter((r) => !r.ok).map((r) => r.text)
  assert.ok(bad.some((t) => t.startsWith('Human')))
  assert.ok(bad.some((t) => t.startsWith('Level 2')))
  assert.ok(bad.some((t) => t.startsWith('17+ in the Mage')))
})

test('avisos da ficha: raça, volta a uma classe deixada', () => {
  const c = { characterClass: 'Cleric' as const, level: 1, race: 'Dwarf', formerClasses: [{ characterClass: 'Cleric' as const, level: 3 }] }
  const warnings = M.dualClassWarnings(c)
  assert.ok(warnings.some((w) => w.startsWith('Only humans')))
  assert.ok(warnings.some((w) => w.includes('already a former class')))
  assert.deepEqual(M.classWarnings({ ...c, race: 'Human', wizardSchool: null }).length, 1)
})

test('desfazer: só no nível 1 com 0 XP; volta com o XP mínimo do nível', () => {
  const c = cleric()
  C.dualClassSwitch(c, 'Fighter', null)
  assert.equal(C.canUndoDualClass(c), true)
  C.undoDualClass(c)
  assert.equal(c.characterClass, 'Cleric')
  assert.equal(c.level, 3)
  assert.equal(c.experience, R.xpRequired(3, 'Cleric'))
  assert.equal(c.formerClasses, null)
  assert.equal(C.canUndoDualClass(c), false)
})

test('o seletor livre não congela nada', () => {
  const c = cleric()
  C.setClass(c, 'Fighter', null)
  assert.equal(c.formerClasses, undefined)
  assert.equal(c.level, 3)
  assert.equal(c.experience, 3500)
})
