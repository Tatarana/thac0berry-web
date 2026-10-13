// Raça e kit (src/rules/raceKit.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as M from '../src/rules/multiclass.ts'
import * as K from '../src/rules/raceKit.ts'
import * as R from '../src/rules/rules.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const base = () =>
  ({
    race: 'Human',
    characterClass: 'Thief',
    level: 14,
    abilities: { strength: 12, dexterity: 16, constitution: 9, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { paralyzationPoisonDeath: 13, rodStaffWand: 14, petrificationPolymorph: 12, breathWeapon: 16, spell: 15, spellResistance: 'old' },
    racialAbilities: null,
    page2Movement: null,
    proficiencies: [{ id: 'a', name: '', slots: 1, checked: false }],
    level_: 0,
  }) as unknown as PlayerCharacter

test('aplicar raça: ajustes de atributo, resistência a magia, habilidades e movimento (só se vazios)', () => {
  const c = base()
  K.applyRace(c, 'Elf')
  assert.equal(c.race, 'Elf')
  assert.deepEqual([c.abilities.dexterity, c.abilities.constitution], [17, 8])
  assert.equal(c.saves.spellResistance, '90% vs. sleep & charm')
  assert.match(c.racialAbilities ?? '', /^Infravision 60 ft/)
  assert.equal(c.page2Movement?.base, '12"')
  assert.equal(c.lastAppliedAbilities?.dexterity, 16)
  K.applyRace(c, 'Human')
  assert.equal(c.saves.spellResistance, null)
  assert.match(c.racialAbilities ?? '', /^Infravision/)
  assert.equal(c.page2Movement?.base, '12"')
})

test('avisos: atributo fora da faixa e limite de nível da Tabela 7', () => {
  const c = base()
  assert.deepEqual(K.raceWarnings('Dwarf', c), [
    'Constitution 9 is outside the 11–18 range Dwarf requires (PHB Table 7).',
    'Dwarf Thiefs are normally limited to level 12 (PHB Table 7) — this character is already level 14.',
  ])
  assert.equal(K.levelLimitWarning('Gnome', 'Mage', 1), 'Gnome cannot normally be a Mage (PHB Table 7).')
  assert.deepEqual(K.raceWarnings('Human', c), [])
})

test('kits da classe (Cleric vê os de Specialty Priest)', () => {
  const kits = [
    { name: 'A', classEligibility: { allowedClasses: ['Cleric'] }, mechanics: {} },
    { name: 'B', classEligibility: { allowedClasses: ['Specialty Priest'] }, mechanics: {} },
    { name: 'C', classEligibility: { allowedClasses: ['Fighter'] }, mechanics: {} },
  ]
  assert.deepEqual(K.kitsAllowedFor(kits, 'Cleric').map((k) => k.name), ['A', 'B'])
  assert.deepEqual(K.kitsAllowedFor(kits, 'Fighter').map((k) => k.name), ['C'])
})

test('proficiências bônus do kit: casam com o compêndio, ocupam a linha vazia, não repetem', () => {
  const c = base()
  const compendium = [{ id: 'etiquette', name: 'Etiquette' }, { id: 'heraldry', name: 'Heraldry' }]
  K.addKitBonusProficiencies(c, ['etiquette', 'Heraldry', 'Underwater Basket Weaving'], compendium)
  assert.deepEqual(c.proficiencies!.map((p) => [p.name, p.matchedProficiencyID ?? null]), [
    ['Etiquette', 'etiquette'],
    ['Heraldry', 'heraldry'],
    ['Underwater Basket Weaving', null],
  ])
  assert.equal(c.proficiencies![0].id, 'a')
  K.addKitBonusProficiencies(c, ['Etiquette'], compendium)
  assert.equal(c.proficiencies!.length, 3)
})

test('seletor de raça: bardo semi-humano recebe o aviso do CBH, não o "cannot normally" do PHB', () => {
  const bard = { abilities: base().abilities, characterClass: 'Bard' as const, level: 3 }
  const noKit = K.raceWarnings('Elf', bard)
  assert.ok(noKit.some((w) => w.startsWith('An Elf can only be a bard')))
  assert.ok(!noKit.some((w) => w.includes('cannot normally')))
  assert.deepEqual(K.raceWarnings('Elf', { ...bard, kit: 'Minstrel' }), [])
  assert.ok(K.raceWarnings('Elf', { ...bard, level: 10, kit: 'Gypsy' }).some((w) => w.includes('limited to level 9')))
  // Meio-elfo continua pelo PHB (pode ser bardo sem kit).
  assert.deepEqual(K.raceWarnings('Half-Elf', bard), [])
})

test('raças planares (PWH): só em campanha Planescape; ajustes, limites, multiclasse e ladrão', () => {
  assert.equal(K.racesForCampaign(null).length, 6)
  assert.equal(K.racesForCampaign(['Ravenloft']).length, 6)
  assert.equal(K.racesForCampaign(['Planescape']).length, 16)
  assert.equal(K.matchRace('genasi (water)'), 'Genasi (water)')

  const c = base()
  K.applyRace(c, 'Tiefling')
  assert.deepEqual([c.abilities.strength, c.abilities.intelligence, c.abilities.wisdom, c.abilities.charisma], [11, 11, 9, 11])
  assert.match(c.racialAbilities ?? '', /Darkness 15-ft/)
  const g = base()
  K.applyRace(g, 'Githzerai')
  assert.equal(g.saves.spellResistance, '5% per level, max. 95% (warriors & thieves)')
  const b = base()
  K.applyRace(b, 'Bariaur (male)')
  assert.equal(b.page2Movement?.base, '15"')

  // Bariaur: só a fêmea pode ser maga; só o macho, ranger (nota ** do PWH).
  assert.equal(K.levelLimit('Bariaur (male)', 'Mage'), 'forbidden')
  assert.equal(K.levelLimit('Bariaur (female)', 'Mage'), 13)
  assert.equal(K.levelLimit('Bariaur (female)', 'Ranger'), 'forbidden')
  // Aasimar de uma classe só: dois níveis além da tabela (Cleric 12 → 14).
  assert.equal(K.levelLimitWarning('Aasimar', 'Cleric', 14), null)
  assert.match(K.levelLimitWarning('Aasimar', 'Cleric', 15) ?? '', /limited to level 12; 2 more if single-classed \(The Planewalker's Handbook\)/)
  assert.match(K.levelLimitWarning('Modron', 'Thief', 1) ?? '', /cannot normally be a Thief \(The Planewalker's Handbook\)/)
  assert.match(K.abilityWarnings('Aasimar', base().abilities)[0], /Intelligence 10 is outside the 11–18 range Aasimar requires/)

  // Multiclasse: as combinações do PWH (o aasimar fighter/bard não depende de kit).
  const fm = { characterClass: 'Fighter' as const, level: 3, wizardSchool: null }
  assert.deepEqual(M.multiClassWarnings({ ...fm, race: 'Aasimar', multiClasses: [{ characterClass: 'Bard', level: 3 }] }), [])
  assert.deepEqual(M.multiClassWarnings({ ...fm, race: 'Githzerai', multiClasses: [{ characterClass: 'Mage', level: 3 }] }), [])
  assert.match(M.multiClassWarnings({ ...fm, race: 'Modron', multiClasses: [{ characterClass: 'Mage', level: 3 }] })[0], /not a standard Modron multi-class combination \(The Planewalker's Handbook\)/)
  assert.equal(M.kitAllowsRace('Human, tiefling', 'Tiefling'), true)

  // Ladrão: ajuste racial do PWH (Tiefling: Hide in Shadows +10).
  assert.equal(R.racialAdjustment('Hide in Shadows', 'Tiefling'), 10)
  assert.equal(R.racialAdjustment('Hide in Shadows', 'Genasi (water)'), 10)
  assert.equal(R.racialAdjustment('Hide in Shadows', 'Genasi (fire)'), 0)
})
