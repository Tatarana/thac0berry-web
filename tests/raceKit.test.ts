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

test('proficiências bônus do kit: casam com o compêndio, ocupam a linha vazia, não repetem, 0 slots e a origem', () => {
  const c = base()
  const compendium = [{ id: 'etiquette', name: 'Etiquette' }, { id: 'heraldry', name: 'Heraldry' }]
  const cavalier = { kind: 'kit' as const, name: 'Cavalier' }
  K.grantProficiencies(c, cavalier, ['etiquette', 'Heraldry', 'Underwater Basket Weaving'], compendium)
  assert.deepEqual(c.proficiencies!.map((p) => [p.name, p.matchedProficiencyID ?? null, p.slots, p.grantedBy?.name]), [
    ['Etiquette', 'etiquette', 0, 'Cavalier'],
    ['Heraldry', 'heraldry', 0, 'Cavalier'],
    ['Underwater Basket Weaving', null, 0, 'Cavalier'],
  ])
  assert.equal(c.proficiencies![0].id, 'a')
  K.grantProficiencies(c, { kind: 'race', name: 'Human' }, ['Etiquette'], compendium)
  assert.equal(c.proficiencies!.length, 3)
})

test('proficiências bônus: comprada não duplica nem sai; usada é perguntada; mantida vira comprada', () => {
  const compendium = [
    { id: 'riding', name: 'Riding, Land-based', mechanics: { slotsRequired: 1 } },
    { id: 'etiquette', name: 'Etiquette', mechanics: { slotsRequired: 1 } },
    { id: 'endurance', name: 'Endurance', mechanics: { slotsRequired: 2 } },
  ]
  const kit = { kind: 'kit' as const, name: 'Cavalier' }
  const c = { proficiencies: [{ id: 'B', name: 'Etiquette', slots: 1, checked: false, matchedProficiencyID: 'etiquette' }] } as unknown as PlayerCharacter
  K.grantProficiencies(c, kit, ['Riding, Land-based', 'Etiquette'], compendium)
  // Etiquette já era comprada: não entra outra linha, e a comprada continua sem marca.
  assert.deepEqual(c.proficiencies!.map((p) => [p.name, p.grantedBy?.name ?? null]), [
    ['Etiquette', null],
    ['Riding, Land-based', 'Cavalier'],
  ])
  assert.deepEqual(K.usedGrantedProficiencies(c, kit), [])
  const riding = c.proficiencies![1]
  riding.target = 'warhorse'
  assert.deepEqual(K.usedGrantedProficiencies(c, kit).map((p) => p.name), ['Riding, Land-based'])
  // Mantida: perde a marca e passa a custar o do compêndio.
  K.revokeProficiencies(c, kit, new Set([riding.id!]), compendium)
  assert.deepEqual(c.proficiencies!.map((p) => [p.name, p.grantedBy ?? null, p.slots]), [
    ['Etiquette', null, 1],
    ['Riding, Land-based', null, 1],
  ])
  // Removida: sai; a comprada nunca sai.
  K.grantProficiencies(c, { kind: 'race', name: 'Dwarf' }, K.raceBonusProficiencies('Dwarf'), compendium)
  assert.equal(c.proficiencies!.find((p) => p.name === 'Endurance')?.slots, 0)
  K.revokeProficiencies(c, { kind: 'race', name: 'Dwarf' }, new Set(), compendium)
  assert.deepEqual(c.proficiencies!.map((p) => p.name), ['Etiquette', 'Riding, Land-based'])
  assert.deepEqual(K.raceBonusProficiencies('Elf'), [])
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

test('raças planares (PWH): sempre na lista (2026-10-17: o cenário só avisa, não esconde); ajustes, limites, multiclasse e ladrão', () => {
  // 6 do PHB + 10 planares (Planescape) + 1 (Half-Vistani, Ravenloft).
  assert.equal(K.allRaces.length, 17)
  assert.match(K.raceSettingWarning('Tiefling', null) ?? '', /Planescape race .*The Planewalker's Handbook.*does not have the Planescape setting on/)
  assert.equal(K.raceSettingWarning('Tiefling', ['Planescape']), null)
  assert.equal(K.raceSettingWarning('Human', null), null)
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

test('Half-Vistani (Domains of Dread): ajuste fixo, sem limite de nível, aviso de cenário', () => {
  assert.equal(K.raceAdjustmentsText('Half-Vistani'), '+1 Int, +1 Wis, -2 Cha')
  assert.equal(K.hasAbilityRequirements('Half-Vistani'), false)
  assert.equal(K.levelLimit('Half-Vistani', 'Gypsy'), 'unlimited')
  assert.equal(K.levelLimit('Half-Vistani', 'Mage'), 'unlimited')
  assert.equal(K.levelLimitWarning('Half-Vistani', 'Fighter', 20), null)

  const c = base()
  K.applyRace(c, 'Half-Vistani')
  assert.deepEqual([c.abilities.intelligence, c.abilities.wisdom, c.abilities.charisma], [11, 11, 8])
  assert.match(c.racialAbilities ?? '', /tralaks/)
  assert.equal(c.page2Movement?.base, '12"')
  assert.equal(c.saves.spellResistance, null)

  // O cenário só avisa (não bloqueia): sem Ravenloft na campanha, "choose anyway" continua valendo.
  assert.deepEqual(K.raceWarnings('Half-Vistani', { ...base(), characterClass: 'Gypsy', level: 1 }, ['Ravenloft']), [])
  assert.match(
    K.raceWarnings('Half-Vistani', { ...base(), characterClass: 'Gypsy', level: 1 }, null)[0],
    /Half-Vistani is a Ravenloft race \(Domains of Dread\), and this campaign does not have the Ravenloft setting on\./,
  )
  // Sem campanha em mente (3º argumento ausente, como o resto da ficha chama): sem esse aviso.
  assert.deepEqual(K.raceWarnings('Half-Vistani', { ...base(), characterClass: 'Gypsy', level: 1 }), [])
})

test('tabelas da raça na página 4: atributos, limites de nível e bônus de Constituição', () => {
  const dwarf = K.raceAbilityRows('Dwarf')
  assert.deepEqual(dwarf.find((r) => r.ability === 'Constitution'), { ability: 'Constitution', range: '11–18', adjustment: 1 })
  assert.deepEqual(dwarf.find((r) => r.ability === 'Charisma'), { ability: 'Charisma', range: '3–17', adjustment: -1 })
  // Humano: sem faixa e sem ajuste; Half-Vistani: só os ajustes (DoD não dá faixa).
  assert.ok(K.raceAbilityRows('Human').every((r) => r.range === null && r.adjustment === 0))
  assert.deepEqual(K.raceAbilityRows('Half-Vistani').filter((r) => r.adjustment !== 0).map((r) => [r.ability, r.adjustment]), [
    ['Intelligence', 1],
    ['Wisdom', 1],
    ['Charisma', -2],
  ])

  assert.deepEqual(K.raceLevelLimits('Human'), [])
  assert.deepEqual(K.raceLevelLimits('Dwarf'), [
    { characterClass: 'Cleric', limit: 10 },
    { characterClass: 'Fighter', limit: 15 },
    { characterClass: 'Thief', limit: 12 },
    { characterClass: 'Ninja', limit: 'unlimited' },
    { characterClass: 'Psionicist', limit: 8 },
  ])
  // A tabela bate com o levelLimit dos avisos da ficha.
  for (const { characterClass, limit } of K.raceLevelLimits('Tiefling')) assert.equal(K.levelLimit('Tiefling', characterClass), limit)

  assert.equal(K.constitutionSaveBonusApplies('Elf'), null)
  assert.match(K.constitutionSaveBonusApplies('Dwarf') ?? '', /poison/)
  assert.doesNotMatch(K.constitutionSaveBonusApplies('Gnome') ?? '', /poison/)
  assert.deepEqual(K.constitutionSaveBonusRows.map((r) => r.bonus), [1, 2, 3, 4, 5])
  assert.equal(K.raceRuleID('Tiefling'), 'pwh_ch00_racial_tables')
})

test('modificadores de combate da raça (PHB cap. 2): ataque e penalidade de quem ataca', () => {
  assert.deepEqual(K.racialCombatModifiers('Dwarf').toHit, [{ label: 'Melee vs. orcs, half-orcs, goblins, hobgoblins', value: '+1' }])
  assert.match(K.racialCombatModifiers('Dwarf').ac[0].label, /titans/)
  assert.match(K.racialCombatModifiers('Gnome').ac[0].label, /^Gnolls, bugbears/)
  assert.equal(K.racialCombatModifiers('Elf').ac.length, 0)
  assert.equal(K.racialCombatModifiers('Halfling').toHit[0].value, '+1')
  assert.deepEqual(K.racialCombatModifiers('Human'), { toHit: [], ac: [] })
  assert.deepEqual(K.racialCombatModifiers(null), { toHit: [], ac: [] })
})
