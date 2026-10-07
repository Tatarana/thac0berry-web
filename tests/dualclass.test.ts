// Classe dupla (MC4, docs/multiclasse.md): PHB cap. 3, "Dual-Class Benefits and
// Restrictions". Regras puras (multiclass.ts, rules.ts) e a troca no motor de
// consequências.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as M from '../src/rules/multiclass.ts'
import * as R from '../src/rules/rules.ts'
import { suggestedXPDual } from '../src/rules/sessionReport.ts'
import type { PlayerCharacter, SpellSheet } from '../src/types/library.ts'

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

// --- MC4b/MC4c ---------------------------------------------------------------------

type Sheet = Pick<SpellSheet, 'slotBoard' | 'entries' | 'magicItems' | 'turnUndeadUsed'>
const day = (over: Partial<Sheet>): Sheet => ({ slotBoard: { slots: [] }, entries: [], magicItems: [], turnUndeadUsed: 0, ...over })
const scores = { ...abilities, intelligence: 16 }
// Mage atual, ex-Cleric: 1 slot divino de círculo 2, 1 arcano de círculo 1, 1 Turn Undead.
const sheets = [
  day({
    slotBoard: {
      slots: [
        { id: 'a', level: 2, caster: 'divine', isSpent: true, orderKey: 0 },
        { id: 'b', level: 1, caster: 'arcane', isSpent: true, orderKey: 1 },
      ],
    },
    turnUndeadUsed: 1,
  }),
]

test('XP da classe dupla na restrição: só a classe atual; a magia anterior vira aviso', () => {
  const xp = suggestedXPDual('Mage', ['Cleric'], true, scores, sheets)
  assert.equal(xp.subtotal, 50)
  // INT 16: +10% do Mage.
  assert.equal(xp.total, 55)
  assert.deepEqual(xp.penalized, { classes: ['Cleric'], xp: 200 + 100 })
})

test('XP da classe dupla depois da restrição: cada tipo pela sua tabela; bônus da classe atual', () => {
  const xp = suggestedXPDual('Mage', ['Cleric'], false, scores, sheets)
  assert.equal(xp.subtotal, 50 + 200 + 100)
  assert.equal(xp.primeBonus?.xp, 35)
  assert.equal(xp.penalized, null)
  assert.equal(xp.countsAttempts, true)
})

test('dreno de nível com as classes anteriores (mais alta primeiro)', () => {
  const c = { characterClass: 'Fighter' as const, level: 4, formerClasses: [{ characterClass: 'Cleric' as const, level: 6 }] }
  assert.deepEqual(M.levelDrainTarget(c), { index: 0, former: true, characterClass: 'Cleric', level: 6 })
  const tie = { characterClass: 'Mage' as const, level: 3, formerClasses: [{ characterClass: 'Fighter' as const, level: 3 }] }
  // Empate: a que exige mais XP no nível (Mage 3 = 5.000; Fighter 3 = 4.000).
  assert.equal(M.levelDrainTarget(tie)?.characterClass, 'Mage')
  assert.equal(M.levelDrainTarget(tie)?.former, false)
})

test('suplementos: limiares do paladino (CPH) e avisos de ninja (CNH)', () => {
  const pal = { characterClass: 'Paladin' as const, level: 3, race: 'Human', abilities: { ...abilities, constitution: 15, wisdom: 15 } }
  const leave = M.dualClassRequirements(pal, 'Cleric')
  assert.ok(leave.some((r) => r.text.includes('to leave a Paladin (CPH)') && r.ok))
  assert.ok(M.dualClassRequirements(pal, 'Thief').some((r) => r.text.startsWith('A paladin cannot dual-class') && !r.ok))
  const toPal = M.dualClassRequirements(cleric(), 'Paladin')
  assert.ok(toPal.some((r) => r.text.includes('to become a Paladin (CPH)') && !r.ok))
  const ninja = { characterClass: 'Ninja' as const, level: 1, race: 'Human', kit: 'Lone Wolf', formerClasses: [{ characterClass: 'Thief' as const, level: 3 }] }
  assert.ok(M.dualClassWarnings(ninja).some((w) => w.includes('Stealer-In')))
  const exNinja = { characterClass: 'Thief' as const, level: 1, race: 'Human', kit: null, formerClasses: [{ characterClass: 'Ninja' as const, level: 3 }] }
  assert.ok(M.dualClassWarnings(exNinja).some((w) => w.includes('Lone Wolf')))
})

test('slots de proficiência da classe dupla (interpretação): cada classe pelo seu nível, iniciais da primeira', () => {
  const c = { characterClass: 'Fighter' as const, level: 4, formerClasses: [{ characterClass: 'Cleric' as const, level: 3 }] }
  // Cleric: 2 iniciais + 1 a cada 4 níveis (3 → 0); Fighter: 1 a cada 3 níveis (4 → 1).
  assert.equal(M.dualProficiencySlots(c, 'weapon'), 2 + 0 + 1)
})
