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

// --- MC3c: XP do relatório por tipo (decisão 6) e avisos de restrição ---

import { suggestedXPMulti } from '../src/rules/sessionReport.ts'

test('XP multiclasse por tipo: divina e Turn Undead pela WIS, arcana pela INT; total dividido', () => {
  const day = {
    slotBoard: {
      slots: [
        { id: 'a', level: 2, caster: 'divine' as const, isSpent: true, orderKey: 0 },
        { id: 'b', level: 1, caster: 'arcane' as const, isSpent: true, orderKey: 1 },
        { id: 'c', level: 1, caster: 'arcane' as const, isSpent: false, orderKey: 2 },
      ],
    },
    entries: [
      { id: 'e1', rawText: 'Bless', displayName: 'Bless', matchedSpellID: 'priest-1-bless', spellLevel: 1, castCount: 1 },
      { id: 'e2', rawText: 'Homebrew', displayName: 'Homebrew', spellLevel: 1, castCount: 2 },
    ],
    magicItems: [],
    turnUndeadUsed: 1,
  }
  const scores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 15, wisdom: 16, charisma: 10 }
  const xp = suggestedXPMulti(['Fighter', 'Cleric', 'Mage'], scores, [day])
  const divine = xp.groups.find((g) => g.kind === 'divine')!
  const arcane = xp.groups.find((g) => g.kind === 'arcane')!
  // Divina: nível 1 (Bless) 100 + nível 2 200 + Turn Undead 100 = 400; WIS 16 → +40.
  assert.deepEqual([divine.characterClass, divine.subtotal, divine.primeBonus?.applies, divine.primeBonus?.xp], ['Cleric', 400, true, 40])
  // Arcana: nível 1 = 50; INT 15 → sem bônus.
  assert.deepEqual([arcane.characterClass, arcane.subtotal, arcane.primeBonus?.applies, arcane.primeBonus?.xp], ['Mage', 50, false, 0])
  assert.equal(xp.unassigned, 2)
  assert.deepEqual([xp.total, xp.classCount, xp.perClass], [490, 3, 163])
})

test('avisos de restrição: mago e sacerdote multiclasse (só texto)', () => {
  const fm = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Mage' as const, level: 3 }] }
  const fc = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Cleric' as const, level: 3 }] }
  assert.deepEqual(M.multiClassRestrictions(fm), [M.multiClassWizardArmorRule])
  assert.deepEqual(M.multiClassRestrictions(fc), [M.multiClassPriestWeaponRule])
  assert.deepEqual(M.multiClassRestrictions({ characterClass: 'Mage', level: 3 }), [])
})

// --- MC5: bardos do CBH, demi-bardos, ninja, kits, dreno de nível ---

test('bardo multiclasse (CBH): combinação com o kit certo; sem o kit, aviso', () => {
  const fb = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Bard' as const, level: 3 }], wizardSchool: null }
  assert.deepEqual(M.multiClassWarnings({ ...fb, race: 'Dwarf', kit: 'Dwarven Chanter' }), [])
  assert.match(M.multiClassWarnings({ ...fb, race: 'Dwarf', kit: null }).join(' '), /must take the Chanter or Skald kit/)
  // Meio-elfo Fighter/Bard aceita True Bard ou sem kit.
  assert.deepEqual(M.multiClassWarnings({ ...fb, race: 'Half-Elf', kit: null }), [])
  assert.match(M.multiClassWarnings({ ...fb, race: 'Halfling', kit: null }).join(' '), /not a standard Halfling bard multi-class/)
  assert.deepEqual(M.bardCombosFor('Elf').map((b) => b.classes.join('/')), ['Mage/Bard', 'Thief/Bard'])
})

test('demi-bardo (CBH Tabela 13): kit da raça e nível máximo, também em classe única', () => {
  assert.match(M.demiBardWarnings({ characterClass: 'Bard', level: 3, race: 'Elf', kit: null })[0], /only be a bard with one of these kits/)
  assert.deepEqual(M.demiBardWarnings({ characterClass: 'Bard', level: 9, race: 'Elf', kit: 'Elven Minstrel' }), [])
  assert.match(M.demiBardWarnings({ characterClass: 'Bard', level: 10, race: 'Elf', kit: 'Gypsy-bard' })[0], /limited to level 9/)
  assert.deepEqual(M.demiBardWarnings({ characterClass: 'Bard', level: 10, race: 'Half-Elf', kit: null }), [])
})

test('ninja semi-humano não pode ser multiclasse (CNH)', () => {
  const w = M.multiClassWarnings({ characterClass: 'Ninja', level: 2, multiClasses: [{ characterClass: 'Fighter', level: 2 }], race: 'Elf', wizardSchool: null })
  assert.ok(w.some((x) => /ninja cannot be multi-classed/.test(x)))
})

test('kits: guerreiro e ladrão só classe única; raça do kit', () => {
  const multi = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Thief' as const, level: 3 }], race: 'Dwarf' }
  const single = { characterClass: 'Fighter' as const, level: 3, race: 'Dwarf' }
  const warriorKit = { name: 'Gladiator', classEligibility: { classGroup: 'Warrior', subclass: 'Fighter' } }
  const thiefKit = { name: 'Bandit', classEligibility: { classGroup: 'Rogue', subclass: 'Thief' } }
  const priestKit = { name: 'Elven Priest', classEligibility: { classGroup: 'Priest', subclass: 'Cleric' }, mechanics: { requirements: { races: 'Elf' } } }
  assert.match(M.kitWarnings(warriorKit, multi)[0], /single-class warriors/)
  assert.deepEqual(M.kitWarnings(warriorKit, single), [])
  assert.match(M.kitWarnings(thiefKit, multi)[0], /single-class thieves/)
  assert.match(M.kitWarnings(priestKit, single)[0], /limited to: Elf/)
  assert.equal(M.kitAllowsRace('Any except halfling', 'Dwarf'), true)
  assert.equal(M.kitAllowsRace('Any except halfling', 'Halfling'), false)
  assert.equal(M.kitAllowsRace('Half-elf, human', 'Elf'), false)
  assert.equal(M.kitAllowsRace('Half-elf, human', 'Half-Elf'), true)
  assert.equal(M.kitAllowsRace('Any except dwarves and halflings', 'Dwarf'), false)
})

test('dreno de nível (PHB): classe mais alta; empate, a que exige mais XP', () => {
  assert.deepEqual(M.levelDrainTarget({ characterClass: 'Fighter', level: 3, multiClasses: [{ characterClass: 'Mage', level: 5 }] }), { index: 0, characterClass: 'Mage', level: 5 })
  // Empate no 4: Mage (nível 4 exige mais XP que Fighter 4).
  const tie = M.levelDrainTarget({ characterClass: 'Fighter', level: 4, multiClasses: [{ characterClass: 'Mage', level: 4 }] })
  const expected = (R.xpRequired(4, 'Mage') ?? 0) > (R.xpRequired(4, 'Fighter') ?? 0) ? 'Mage' : 'Fighter'
  assert.equal(tie?.characterClass, expected)
  assert.equal(M.levelDrainTarget({ characterClass: 'Fighter', level: 1, multiClasses: [{ characterClass: 'Mage', level: 1 }] }), null)
})
