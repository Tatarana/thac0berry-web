// Raças em dados (2026-11-20): races.json do thac0berry-data, carregado por tests/setup-races.ts.
// A não-regressão das 17 raças de antes está em raceKitSnapshot.test.ts; aqui, o que é novo:
// jogáveis por cenário, escondidas, subraças (baseRace) e o filtro dos seletores.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { forgeArtRaces } from '../src/rules/forgeCombos.ts'
import * as M from '../src/rules/multiclass.ts'
import * as K from '../src/rules/raceKit.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const records = K.raceRecords()
const playable = records.filter((r) => r.playable !== false)
const char = () =>
  ({
    race: '',
    characterClass: 'Fighter',
    level: 5,
    abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { spellResistance: 'old' },
    racialAbilities: null,
    page2Movement: null,
    proficiencies: [],
  }) as unknown as PlayerCharacter

test('ids e nomes são únicos; toda raça escondida tem motivo; baseRace aponta para uma das 6 do PHB', () => {
  assert.equal(new Set(records.map((r) => r.id)).size, records.length)
  assert.equal(new Set(records.map((r) => r.name)).size, records.length)
  const phb = new Set(['human', 'elf', 'dwarf', 'gnome', 'half_elf', 'halfling'])
  for (const r of records) {
    if (r.playable === false) assert.ok(r.hiddenReason, `${r.id} escondida sem motivo`)
    if (r.baseRace) assert.ok(phb.has(r.baseRace), `${r.id}: baseRace ${r.baseRace}`)
  }
})

test('jogáveis novas por cenário', () => {
  const count = (setting: string | null, baseOnly?: boolean) =>
    playable.filter((r) => (r.campaignSetting ?? null) === setting && (baseOnly === undefined || !!r.baseRace === baseOnly)).length
  assert.equal(playable.length, 83)
  assert.equal(count('Dark Sun'), 10)
  assert.equal(count(null, true), 17) // subraças dos Complete Books (Core)
  assert.equal(count(null, false), 6) // PHB
  assert.equal(count('Planescape'), 12) // 10 de antes + Nathri + Nethling
  assert.equal(count('Forgotten Realms'), 5)
  assert.equal(count('Greyhawk'), 1)
  assert.equal(count('Ravenloft'), 1)
  assert.equal(count('Council of Wyrms'), 22)
  assert.equal(count('Spelljammer'), 9)
})

test('as 17 de antes vêm primeiro e são as que têm arte própria', () => {
  assert.deepEqual(K.allRaces.slice(0, 17), [...forgeArtRaces])
})

test('humanoides, cenários fora do Forge e duplicatas nunca são jogáveis nem casam com o texto da ficha', () => {
  for (const name of ['Orc', 'Goblin', 'Half-Orc', 'Kender', 'Gully Dwarf', 'Tinker Gnome', 'Hengeyokai', 'Tortle', 'Hill Dwarf (duplicate entry)', 'Athasian Halfling (CBGH)', 'Avariel']) {
    assert.ok(K.raceRecord(name), name)
    assert.equal(K.matchRace(name), null, name)
    assert.ok(!K.allRaces.includes(name), name)
    assert.equal(K.raceSelectable(name, null), false, name)
  }
  assert.equal(K.raceRecord('Kender')?.campaignSetting, 'Dragonlance')
  assert.equal(K.raceRecord('Orc')?.hiddenReason, 'humanoid-not-playable')
  assert.equal(K.raceRecord('Kender')?.hiddenReason, 'setting-not-in-forge')
})

test('seletores: cenário em construção nunca aparece, nem sem filtro nem com o cenário ligado', () => {
  const all = K.selectableRaces(null)
  const dragonsOrShips = (list: string[]) => list.filter((n) => ['Red Dragon', 'Giff', 'Scro', 'Hadozee'].includes(n))
  assert.deepEqual(dragonsOrShips(all), [])
  assert.deepEqual(dragonsOrShips(K.selectableRaces(['Council of Wyrms', 'Spelljammer'])), [])
  assert.ok(K.raceRecord('Red Dragon') && K.raceRecord('Giff'))
  assert.equal(all.length, 83 - 22 - 9)
})

test('seletores: Core mais os cenários escolhidos; a raça já escolhida fica', () => {
  const fr = K.selectableRaces(['Forgotten Realms'])
  assert.ok(fr.includes('Human') && fr.includes('Drow') && fr.includes('Triton'))
  assert.ok(!fr.includes('Tiefling') && !fr.includes('Athasian Elf') && !fr.includes('Half-Vistani'))
  const ds = K.selectableRaces(['Dark Sun'])
  assert.ok(ds.includes('Thri-Kreen') && ds.includes('Mul') && !ds.includes('Nathri'))
  assert.ok(K.selectableRaces(['Dark Sun'], 'Tiefling').includes('Tiefling'))
  assert.ok(K.selectableRaces(['Planescape']).includes('Nethling'))
})

test('grupos: PHB, subraças e depois os cenários em ordem alfabética', () => {
  const groups = K.groupRaces(K.selectableRaces(null)).map((g) => g.group)
  assert.deepEqual(groups, ["Player's Handbook", 'Subraces', 'Dark Sun', 'Forgotten Realms', 'Greyhawk', 'Planescape', 'Ravenloft'])
  assert.deepEqual(K.groupRaces(K.selectableRaces(null))[0].races, ['Human', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Halfling'])
})

test('nomes da ficha: apelidos dos dados casam; Modron = Rogue Modron', () => {
  assert.equal(K.matchRace('Rogue Modron'), 'Modron')
  assert.equal(K.matchRace('human (standard)'), 'Human')
  assert.equal(K.matchRace('Half-Elf (PHB)'), 'Half-Elf')
  assert.equal(K.matchRace('Deep Gnome (Svirfneblin)'), 'Svirfneblin')
  assert.equal(K.matchRace('Mul (Half-Dwarf/Human)'), 'Mul')
  assert.equal(K.matchRace('Air Genasi'), 'Genasi (air)')
  assert.equal(K.matchRace('Drow'), 'Drow')
})

test('Dark Sun: ajustes, faixa, movimento e só as classes do app nos limites', () => {
  assert.equal(K.raceAdjustmentsText('Half-Giant'), '+4 Str, +2 Con, -2 Int, -2 Wis, -2 Cha')
  const c = char()
  K.applyRace(c, 'Thri-Kreen')
  assert.equal(c.page2Movement?.base, '18"')
  assert.match(c.racialAbilities ?? '', /chatkcha/)
  assert.equal(c.saves.spellResistance, null)
  assert.deepEqual(K.abilityWarnings('Thri-Kreen', { ...c.abilities, strength: 5, dexterity: 16 }), ['Strength 5 is outside the 8–20 range Thri-Kreen requires (Dark Sun Campaign Setting).'])
  assert.deepEqual(K.raceLevelLimits('Thri-Kreen'), [
    { characterClass: 'Fighter', limit: 16 },
    { characterClass: 'Ranger', limit: 12 },
    { characterClass: 'Cleric', limit: 12 },
    { characterClass: 'Druid', limit: 16 },
    { characterClass: 'Psionicist', limit: 'unlimited' },
  ])
  assert.equal(K.levelLimit('Thri-Kreen', 'Mage'), 'forbidden')
  // Gladiator não existe no app: fica fora das combinações; sobram as das classes do app.
  assert.deepEqual(M.combosFor('Mul'), [['Fighter', 'Thief'], ['Fighter', 'Cleric'], ['Fighter', 'Psionicist'], ['Cleric', 'Psionicist'], ['Cleric', 'Thief'], ['Psionicist', 'Thief'], ['Fighter', 'Thief', 'Psionicist'], ['Fighter', 'Thief', 'Cleric']])
  assert.equal(K.raceSettingWarning('Pterran', ['Forgotten Realms']) !== null, true)
  assert.equal(K.raceSettingWarning('Pterran', ['Dark Sun']), null)
})

test('Athasian Human: humano para classe dupla, sem limite de nível', () => {
  assert.equal(K.isHumanRace('Athasian Human'), true)
  assert.equal(K.isHumanRace('Elf'), false)
  assert.equal(K.levelLimit('Athasian Human', 'Mage'), 'unlimited')
  const c = { race: 'Athasian Human', characterClass: 'Fighter', level: 6, multiClasses: [{ characterClass: 'Thief', level: 5 }] } as never
  assert.match(M.multiClassWarnings(c).join(' '), /Humans cannot be multi-class/)
})

test('subraças: o kit de elfo aceita elfos de qualquer subraça; "Any except elf" as exclui', () => {
  for (const race of ['Drow', 'High Elf', 'Grey Elf', 'Sylvan Elf', 'Aquatic Elf', 'Athasian Elf']) {
    assert.equal(M.kitAllowsRace('Elf', race), true, race)
    assert.equal(M.kitAllowsRace('Any except elf', race), false, race)
    assert.equal(M.kitAllowsRace('Human, half-elf', race), false, race)
  }
  assert.equal(M.kitAllowsRace('Dwarf (gold, shield)', 'Hill Dwarf'), true)
  assert.equal(M.kitAllowsRace('Any except dwarves and halflings', 'Duergar'), false)
  assert.equal(M.kitAllowsRace('Halfling', 'Stout Halfling'), true)
  assert.equal(M.kitAllowsRace('Human', 'Athasian Human'), true)
  assert.equal(M.kitAllowsRace('Elf', 'Hill Dwarf'), false)
  assert.equal(M.kitAllowsRace('Gnome', 'Svirfneblin'), true)
})

test('subraças: o que herda da raça-base só quando o livro manda (Standard X Abilities)', () => {
  // Anões: bônus de CON nos testes e Endurance de graça.
  for (const race of ['Hill Dwarf', 'Mountain Dwarf', 'Deep Dwarf', 'Duergar', 'Sundered Dwarf']) {
    assert.ok(K.constitutionSaveBonusApplies(race), race)
    assert.deepEqual(K.raceBonusProficiencies(race), ['Endurance'], race)
    assert.equal(K.racialCombatModifiers(race).toHit.length, 1, race)
  }
  assert.equal(K.constitutionSaveBonusApplies('Athasian Dwarf'), null)
  assert.deepEqual(K.raceBonusProficiencies('Athasian Dwarf'), [])
  // Elfos: sono e charme 90%, menos o Drow (resistência própria, só em texto).
  for (const race of ['High Elf', 'Grey Elf', 'Sylvan Elf', 'Aquatic Elf']) {
    const c = char()
    K.applyRace(c, race)
    assert.equal(c.saves.spellResistance, '90% vs. sleep & charm', race)
  }
  const drow = char()
  K.applyRace(drow, 'Drow')
  assert.equal(drow.saves.spellResistance, null)
  assert.match(drow.racialAbilities ?? '', /dancing lights/)
  assert.equal(K.constitutionSaveBonusApplies('Rock Gnome')?.includes('rods'), true)
  assert.equal(K.constitutionSaveBonusApplies('Athasian Halfling'), null)
  // Demi-bardo: o High Elf Minstrel vale como o do elfo.
  assert.equal(K.demiBardWarning('High Elf', 'Minstrel', 10), null)
  assert.match(K.demiBardWarning('High Elf', 'Minstrel', 16) ?? '', /limited to level 15/)
})

test('subraças: limites, requisitos e ajustes são sempre os da própria raça', () => {
  assert.equal(K.levelLimit('Hill Dwarf', 'Fighter'), 15)
  assert.equal(K.levelLimit('Mountain Dwarf', 'Fighter'), 16)
  assert.equal(K.levelLimit('Deep Dwarf', 'Fighter'), 14)
  assert.equal(K.levelLimit('Duergar', 'Thief'), 14)
  assert.equal(K.raceAdjustmentsText('Drow'), '+2 Dex, +2 Int, -2 Cha, -1 Con')
  assert.deepEqual(K.abilityWarnings('Drow', { strength: 10, dexterity: 7, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }).length, 1)
})

test('hill dwarf mineirado em duplicata não vira raça', () => {
  assert.equal(K.matchRace('Hill Dwarf'), 'Hill Dwarf')
  assert.equal(K.raceRecord('Hill Dwarf (duplicate entry)')?.duplicateOf, 'hill_dwarf')
  assert.equal(K.raceRecord('Athasian Halfling')?.campaignSetting, 'Dark Sun')
  assert.equal(K.raceRecord('Aquatic Elf')?.campaignSetting, null)
  assert.equal(K.raceRecord('Aquatic Elf (Sea of Fallen Stars)')?.campaignSetting, 'Forgotten Realms')
})

test('troca de raça no Forge desfaz a anterior também com raças novas', () => {
  const c = char()
  K.replaceRace(c, 'Mul')
  assert.deepEqual([c.abilities.strength, c.abilities.constitution, c.abilities.intelligence, c.abilities.charisma], [12, 11, 9, 8])
  assert.equal(c.page2Movement?.base, '12"')
  K.replaceRace(c, 'Hill Dwarf')
  assert.deepEqual([c.abilities.strength, c.abilities.constitution, c.abilities.intelligence, c.abilities.charisma], [10, 11, 10, 9])
  assert.equal(c.page2Movement?.base, '6"')
  K.replaceRace(c, 'Human')
  assert.deepEqual(c.abilities, { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 })
})

test('raça fora dos dados (texto livre da ficha) segue como sempre: sem raça, sem aviso', () => {
  assert.equal(K.matchRace('Martian'), null)
  assert.deepEqual(K.abilityWarnings('Martian', char().abilities), [])
  assert.equal(K.levelLimit('Martian', 'Fighter'), 'forbidden')
  assert.deepEqual(M.combosFor('Martian'), [])
  assert.equal(M.kitAllowsRace('Elf', 'Martian'), true)
})

test('Bariaur: variação por sexo continua achando a outra', () => {
  assert.equal(K.raceForGender('Bariaur (male)', 'female'), 'Bariaur (female)')
  assert.equal(K.raceForGender('Drow', 'female'), 'Drow')
  assert.ok(!K.racesForGender('female').includes('Bariaur (male)'))
})
