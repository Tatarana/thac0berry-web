// Multiclasse (src/rules/multiclass.ts e o resolveRule com multiClasses), PHB cap. 3.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diffConsequences, hasPendingConsequences, markConsequencesReviewed } from '../src/rules/consequences.ts'
import * as M from '../src/rules/multiclass.ts'
import * as R from '../src/rules/rules.ts'
import type { AbilityScores, PlayerCharacter } from '../src/types/library.ts'

const abilities: AbilityScores = { strength: 14, dexterity: 15, constitution: 14, intelligence: 16, wisdom: 12, charisma: 10 }

test('classe única: nada muda (mesmos valores de antes)', () => {
  const single = { characterClass: 'Fighter' as const, level: 5 }
  assert.deepEqual(M.classLevels(single), [{ characterClass: 'Fighter', level: 5 }])
  assert.equal(M.isMultiClass(single), false)
  assert.equal(R.resolveRule('thac0', { ...single, abilities }), R.thac0ForLevel('Fighter', 5))
  assert.deepEqual(R.resolveRule('savingThrows', { ...single, abilities }), R.savingThrowsForLevel('Fighter', 5))
  assert.deepEqual(M.multiClassWarnings({ ...single, race: 'Human', wizardSchool: null }), [])
})

test('melhor THAC0 e melhor save de cada categoria', () => {
  const fm = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Mage' as const, level: 4 }] }
  const classes = M.classLevels(fm)
  assert.equal(M.combinedTHAC0(classes), Math.min(R.thac0ForLevel('Fighter', 3)!, R.thac0ForLevel('Mage', 4)!))
  const f = R.savingThrowsForLevel('Fighter', 3)!
  const m = R.savingThrowsForLevel('Mage', 4)!
  assert.deepEqual(M.combinedSaves(classes), {
    paralyzationPoisonDeath: Math.min(f.paralyzationPoisonDeath, m.paralyzationPoisonDeath),
    rodStaffWand: Math.min(f.rodStaffWand, m.rodStaffWand),
    petrificationPolymorph: Math.min(f.petrificationPolymorph, m.petrificationPolymorph),
    breathWeapon: Math.min(f.breathWeapon, m.breathWeapon),
    spell: Math.min(f.spell, m.spell),
  })
  // O motor de consequências usa o mesmo cálculo.
  assert.equal(R.resolveRule('thac0', { ...fm, abilities }), M.combinedTHAC0(classes))
})

test('magia de cada classe pelo nível dela', () => {
  const fm = { characterClass: 'Fighter' as const, level: 7, multiClasses: [{ characterClass: 'Mage' as const, level: 3 }], abilities }
  assert.deepEqual(R.resolveRule('wizardSpellSlots', fm), R.resolveRule('wizardSpellSlots', { characterClass: 'Mage', level: 3, abilities }))
  assert.equal(R.resolveRule('priestSpellSlots', fm), null)
})

test('XP dividido igualmente; próximo nível por classe', () => {
  assert.equal(M.xpShare(10001, 2), 5000)
  const progress = M.classProgress({ characterClass: 'Fighter', level: 2, experience: 5000, multiClasses: [{ characterClass: 'Thief', level: 2 }] })
  assert.deepEqual(progress.map((p) => [p.characterClass, p.xp, p.next]), [
    ['Fighter', 2500, R.xpRequired(3, 'Fighter')],
    ['Thief', 2500, R.xpRequired(3, 'Thief')],
  ])
  assert.equal(progress[1].ready, 2500 >= R.xpRequired(3, 'Thief')!)
})

test('proficiências: maior inicial e ritmo mais rápido; penalidade menor', () => {
  // Fighter: 4 iniciais, +1 a cada 3 níveis; Mage: 1 inicial, +1 a cada 6.
  const classes = [{ characterClass: 'Fighter' as const, level: 6 }, { characterClass: 'Mage' as const, level: 7 }]
  assert.equal(M.combinedProficiencySlots(classes, 'weapon'), 4 + 2)
  assert.equal(M.combinedNonProficiencyPenalty(classes), '-2')
})

test('avisos: combinação da raça, humano, especialista, limite racial', () => {
  const base = { characterClass: 'Fighter' as const, level: 3, wizardSchool: null }
  assert.deepEqual(M.multiClassWarnings({ ...base, race: 'Elf', multiClasses: [{ characterClass: 'Mage', level: 3 }] }), [])
  assert.deepEqual(M.multiClassWarnings({ ...base, race: 'Half-Elf', multiClasses: [{ characterClass: 'Druid', level: 3 }] }), [])
  assert.match(M.multiClassWarnings({ ...base, race: 'Human', multiClasses: [{ characterClass: 'Mage', level: 3 }] })[0], /Humans cannot/)
  assert.match(M.multiClassWarnings({ ...base, race: 'Dwarf', multiClasses: [{ characterClass: 'Mage', level: 3 }] })[0], /not a standard Dwarf/)
  // Gnomo: Fighter/Illusionist é o especialista permitido.
  assert.deepEqual(
    M.multiClassWarnings({ ...base, race: 'Gnome', wizardSchool: 'Illusion/Phantasm', multiClasses: [{ characterClass: 'Mage', level: 3 }] }).filter((w) => !/limited|cannot normally/.test(w)),
    [],
  )
  assert.ok(M.multiClassWarnings({ ...base, race: 'Elf', wizardSchool: 'Necromancy', multiClasses: [{ characterClass: 'Mage', level: 3 }] }).some((w) => /Specialist/.test(w)))
  assert.ok(M.multiClassWarnings({ ...base, race: 'Halfling', level: 12, multiClasses: [{ characterClass: 'Thief', level: 3 }] }).some((w) => /limited to level 9/.test(w)))
})

test('consequências: mudar o nível de uma das classes fica pendente', () => {
  const c = {
    characterClass: 'Fighter',
    level: 3,
    abilities,
    multiClasses: [{ characterClass: 'Mage', level: 3 }],
  } as unknown as PlayerCharacter
  markConsequencesReviewed(c)
  assert.equal(hasPendingConsequences(c), false)
  c.multiClasses = [{ characterClass: 'Mage', level: 4 }]
  assert.equal(hasPendingConsequences(c), true)
  const items = diffConsequences(
    { level: 3, characterClass: 'Fighter', abilities, multiClasses: [{ characterClass: 'Mage', level: 3 }] },
    { level: 3, characterClass: 'Fighter', abilities, multiClasses: [{ characterClass: 'Mage', level: 4 }] },
  )
  assert.ok(items.some((i) => i.id === 'wizardSpellSlots'))
})

test('regra de HP é só texto (o jogador calcula)', () => {
  assert.match(M.hitPointsRule([{ characterClass: 'Fighter', level: 1 }, { characterClass: 'Mage', level: 1 }]), /d10 \(Fighter\) \+ d4 \(Mage\).*divide by 2/)
})

// --- MC3a: magia por classe e Psionicist no seletor ---------------------------------

test('slots: classe única igual a antes; multiclasse soma as classes pelo nível de cada uma', () => {
  const mage = { characterClass: 'Mage' as const, level: 5, abilities }
  assert.deepEqual(
    R.computedSpellSlotAllotments(mage),
    R.wizardSpellProgression(5, abilities.intelligence).flatMap((n, i) => (n > 0 ? [{ caster: 'arcane', level: i + 1, count: n }] : [])),
  )
  // Fighter principal: antes ficava sem slots.
  const fm = { characterClass: 'Fighter' as const, level: 6, multiClasses: [{ characterClass: 'Mage' as const, level: 5 }], abilities }
  assert.deepEqual(R.computedSpellSlotAllotments(fm), R.computedSpellSlotAllotments(mage))
  // Cleric/Mage: as duas magias, cada uma pelo seu nível.
  const cm = { characterClass: 'Cleric' as const, level: 3, multiClasses: [{ characterClass: 'Mage' as const, level: 4 }], abilities }
  const slots = R.computedSpellSlotAllotments(cm)
  assert.deepEqual(slots.filter((a) => a.caster === 'divine'), R.computedSpellSlotAllotments({ characterClass: 'Cleric', level: 3, abilities }))
  assert.deepEqual(slots.filter((a) => a.caster === 'arcane'), R.computedSpellSlotAllotments({ characterClass: 'Mage', level: 4, abilities }))
})

test('recursos por classe: quem conjura, nível de conjurador, atributo da folha', () => {
  const fm = { characterClass: 'Fighter' as const, level: 6, multiClasses: [{ characterClass: 'Mage' as const, level: 5 }], abilities }
  assert.equal(M.hasSpellSheetAny(fm), true)
  assert.equal(M.isArcaneCasterAny(fm), true)
  assert.equal(M.casterLevel(fm, 'arcane'), 5)
  assert.equal(M.spellSheetAbility(fm), abilities.intelligence)
  // Com magia divina, a folha guarda a Sabedoria (dá slots extras ao sacerdote).
  const cm = { characterClass: 'Mage' as const, level: 4, multiClasses: [{ characterClass: 'Cleric' as const, level: 3 }], abilities }
  assert.equal(M.spellSheetAbility(cm), abilities.wisdom)
  assert.equal(M.casterLevel(cm, 'divine'), 3)
  // Classe única: o de sempre.
  assert.equal(M.hasSpellSheetAny({ characterClass: 'Fighter', level: 3 }), false)
  assert.equal(M.spellSheetAbility({ characterClass: 'Mage', level: 3, abilities }), abilities.intelligence)
  assert.equal(M.spellSheetAbility({ characterClass: 'Cleric', level: 3, abilities }), abilities.wisdom)
  assert.equal(M.levelOf({ characterClass: 'Thief', level: 4, multiClasses: [{ characterClass: 'Psionicist', level: 3 }] }, 'Psionicist'), 3)
})

test('Psionicist (CPsiH): anão e halfling com Fighter ou Thief; elfo não', () => {
  const base = { characterClass: 'Fighter' as const, level: 3, wizardSchool: null, multiClasses: [{ characterClass: 'Psionicist' as const, level: 3 }] }
  assert.deepEqual(M.multiClassWarnings({ ...base, race: 'Dwarf' }), [])
  assert.deepEqual(M.multiClassWarnings({ ...base, race: 'Halfling', characterClass: 'Thief' }), [])
  assert.match(M.multiClassWarnings({ ...base, race: 'Elf' })[0], /not a standard Elf .*CPsiH/)
  assert.ok(M.multiClassOptions.includes('Psionicist'))
})

// --- MC3b: página 4, ladrão e Turn Undead por classe --------------------------------

test('página 4: classe única igual a antes; multiclasse com uma seção por classe', () => {
  for (const cls of ['Fighter', 'Mage', 'Cleric', 'Thief', 'Bard', 'Druid', 'Psionicist'] as const) {
    const single = { characterClass: cls, level: 5 }
    assert.equal(M.recordSheetPages(single), R.recordSheetPageCount(cls))
    assert.deepEqual(M.referenceSections(single).map((s) => s.kind), R.referenceKind(cls) ? [R.referenceKind(cls)] : [])
  }
  const fmc = { characterClass: 'Fighter' as const, level: 6, multiClasses: [{ characterClass: 'Mage' as const, level: 5 }, { characterClass: 'Cleric' as const, level: 4 }] }
  assert.deepEqual(M.referenceSections(fmc), [
    { kind: 'Warrior', characterClass: 'Fighter', level: 6 },
    { kind: 'Wizard', characterClass: 'Mage', level: 5 },
    { kind: 'Cleric', characterClass: 'Cleric', level: 4 },
  ])
  // Psionicist principal (sem página 4) com Thief: ganha a página do ladino.
  const pt = { characterClass: 'Psionicist' as const, level: 3, multiClasses: [{ characterClass: 'Thief' as const, level: 4 }] }
  assert.equal(M.recordSheetPages(pt), 4)
  assert.deepEqual(M.referenceSections(pt).map((s) => [s.kind, s.level]), [['Rogue', 4]])
})

test('ladrão: a classe ladina e o nível dela, mesmo sem ser a principal', () => {
  assert.equal(M.rogueClass({ characterClass: 'Fighter', level: 6 }), null)
  assert.deepEqual(M.rogueClass({ characterClass: 'Fighter', level: 6, multiClasses: [{ characterClass: 'Thief', level: 7 }] }), { characterClass: 'Thief', level: 7 })
  assert.deepEqual(M.rogueClass({ characterClass: 'Thief', level: 3 }), { characterClass: 'Thief', level: 3 })
})
