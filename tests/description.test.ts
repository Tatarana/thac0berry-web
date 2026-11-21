// Etapa "Tell Your Tale" do The Forge (src/rules/description.ts): idade, altura,
// peso pelas tabelas e o patrono.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as D from '../src/rules/description.ts'
import { deityLabel, duplicateNames, findDeityByName, pantheonGroups, pantheonOf, rankGroup, type Deity } from '../src/data/deities.ts'

const fixed = () => 0.999 // cada dado dá o máximo

test('PHB Tabelas 10 e 11: médias, rolagens e o dado de cada medida', () => {
  const dwarf = D.bodyTable('Dwarf')
  assert.equal(D.averageMeasure(dwarf, 'height', 'female'), 41 + 6)
  assert.equal(D.averageMeasure(dwarf, 'weight', 'male'), 130 + 22)
  assert.equal(D.averageMeasure(dwarf, 'age', 'male'), 40 + 18)
  assert.equal(D.rollMeasure(dwarf, 'age', 'male', fixed), 40 + 30)
  assert.equal(D.measureDice(dwarf, 'age'), '40+5d6')
  assert.equal(D.measureDice(D.bodyTable('Human'), 'weight'), '6d10')
})

test('raças planares (PWH), modron sem idade, raça desconhecida vira humana', () => {
  assert.equal(D.averageMeasure(D.bodyTable('Tiefling'), 'height', 'male'), 59 + 11)
  const modron = D.bodyTable('Modron')
  assert.equal(D.averageMeasure(modron, 'height', 'male'), 72)
  assert.equal(D.averageMeasure(modron, 'age', 'male'), null)
  assert.equal(D.measureDice(modron, 'weight'), null)
  assert.equal(D.agingStage(modron, 500), null)
  assert.equal(D.bodyTable(null), D.bodyTable('Human'))
})

test('PHB Tabela 12: meia-idade, velhice, venerável', () => {
  const human = D.bodyTable('Human')
  assert.deepEqual(D.agingThresholds(human), [45, 60, 90])
  assert.equal(D.agingStage(human, 30), null)
  assert.equal(D.agingStage(human, 45), 'middle-aged')
  assert.equal(D.agingStage(human, 61), 'old')
  assert.equal(D.agingStage(human, 90), 'venerable')
  assert.deepEqual(D.agingThresholds(D.bodyTable('Elf')), [175, 233, 350])
  // os números da Tabela 12 do PHB
  assert.deepEqual(D.agingThresholds(D.bodyTable('Dwarf')), [125, 167, 250])
  assert.deepEqual(D.agingThresholds(D.bodyTable('Half-Elf')), [62, 83, 125])
  assert.deepEqual(D.agingThresholds(D.bodyTable('Halfling')), [50, 67, 100])
})

test('altura em pés e polegadas, como texto da ficha', () => {
  assert.equal(D.feetAndInches(47), `3'11"`)
  assert.equal(D.parseInches(`5'10"`), 70)
  assert.equal(D.parseInches('62'), 62)
  assert.equal(D.parseInches(''), null)
})

test('patrono: até um passo do alinhamento', () => {
  assert.equal(D.deityFits('LG', 'LG'), true)
  assert.equal(D.deityFits('NG', 'LG'), true)
  assert.equal(D.deityFits('N', 'NG'), true)
  assert.equal(D.deityFits('CG', 'LG'), false)
  assert.equal(D.deityFits('LE', 'LG'), false)
  assert.equal(D.deityFits(null, 'LG'), false)
  assert.equal(D.deitySetting('Tales of the Lance'), 'Dragonlance')
  assert.equal(D.deitySetting('Faiths & Avatars'), 'Forgotten Realms')
})

// --- Panteões e o patrono no Forge (deities.json expandido) -----------------------------

const deityData = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const allDeities = JSON.parse(readFileSync(join(deityData, 'deities.json'), 'utf8')) as Deity[]
const hasPantheons = allDeities.some((d) => d.pantheon)
const choices = (race: string | null, filter = 'all', alignment = 'LG', query = '') => D.patronChoices(allDeities, { filter, query, alignment, race })
const names = (list: Deity[]) => list.map((d) => d.name)

test('deitySetting: deus semi-humano é "Demihuman"; os demais pelo livro', () => {
  assert.equal(D.deitySetting({ book: 'Monster Mythology', race: 'dwarf' }), 'Demihuman')
  assert.equal(D.deitySetting({ book: 'Tales of the Lance' }), 'Dragonlance')
  assert.equal(D.deitySetting({ book: 'Powers & Pantheons' }), 'Forgotten Realms')
  assert.equal(D.deitySetting({ book: 'Legends & Lore' }), 'Legends & Lore')
})

test('Forge: forgeSelectable false nunca é oferecido, em nenhum filtro', { skip: !hasPantheons }, () => {
  const hidden = allDeities.filter((d) => d.forgeSelectable === false)
  assert.ok(hidden.length > 100)
  for (const filter of ['all', 'fit', 'race', 'Demihuman', 'Forgotten Realms', 'Legends & Lore', 'Monster Mythology']) {
    for (const race of [null, 'Mountain Dwarf', 'Human']) {
      for (const alignment of ['LG', 'CE', 'N']) {
        const ids = new Set(choices(race, filter, alignment).map((d) => d.id))
        assert.ok(!hidden.some((d) => ids.has(d.id)), `${filter}/${race}/${alignment}`)
      }
    }
  }
  const all = names(choices(null))
  for (const god of ['Odin', 'Zeus', 'Gruumsh', 'Thor']) assert.ok(!all.includes(god), god)
  // Tyr: só o de Faerûn (o nórdico é só do compêndio).
  assert.equal(choices(null).filter((d) => d.name === 'Tyr').length, 1)
})

test('Forge: os deuses semi-humanos valem em qualquer campanha e para qualquer raça', { skip: !hasPantheons }, () => {
  for (const race of [null, 'Human', 'Elf', 'Mountain Dwarf']) {
    const demi = names(choices(race, 'Demihuman'))
    for (const god of ['Moradin', 'Corellon Larethian', 'Garl Glittergold', 'Yondalla']) assert.ok(demi.includes(god), `${god} para ${race}`)
  }
  // Os deuses de cenário continuam fora de "Demihuman".
  assert.ok(!names(choices(null, 'Demihuman')).includes('Paladine'))
  assert.ok(names(choices(null, 'Dragonlance')).includes('Paladine'))
})

test('raça do personagem: Mountain Dwarf (subraça → raça-base) destaca Moradin; humano não', { skip: !hasPantheons }, () => {
  const moradin = allDeities.find((d) => d.name === 'Moradin')!
  assert.equal(moradin.race, 'dwarf')
  assert.equal(D.deityOfRace(moradin, 'Mountain Dwarf'), true)
  assert.equal(D.deityOfRace(moradin, 'Dwarf'), true)
  assert.equal(D.deityOfRace(moradin, 'Elf'), false)
  assert.equal(D.deityOfRace(moradin, 'Human'), false)
  assert.equal(D.deityOfRace(moradin, null), false)
  assert.equal(D.deityOfRace({ race: undefined }, 'Mountain Dwarf'), false)
  assert.equal(D.raceGodsLabel(allDeities, 'Mountain Dwarf'), 'Dwarven gods')
  assert.equal(D.raceGodsLabel(allDeities, 'High Elf'), 'Elven gods')
  assert.equal(D.raceGodsLabel(allDeities, 'Human'), null)
  // Panteões de sub-raça: Lolth é dos drow, não de qualquer elfo; o drow vê os deuses drow.
  const lolth = { race: 'elf', pantheon: 'Drow' }
  const laduguer = { race: 'dwarf', pantheon: 'Duergar' }
  assert.equal(D.deityOfRace(lolth, 'High Elf'), false)
  assert.equal(D.deityOfRace(lolth, 'Drow'), true)
  assert.equal(D.deityOfRace({ race: 'elf', pantheon: 'Elven' }, 'Drow'), false)
  assert.equal(D.deityOfRace(laduguer, 'Mountain Dwarf'), false)
  assert.equal(D.deityOfRace(laduguer, 'Duergar'), true)
  // O filtro "race" traz só os deuses anões; no "all" eles vêm primeiro.
  const dwarven = choices('Mountain Dwarf', 'race')
  assert.ok(dwarven.length >= 8 && dwarven.every((d) => d.race === 'dwarf'))
  assert.ok(names(dwarven).includes('Moradin'))
  const all = choices('Mountain Dwarf')
  assert.equal(all[0].race, 'dwarf')
  assert.ok(!names(choices('Human', 'race')).includes('Moradin'))
})

test('patrono: busca, portfólio vazio e posto nulo não quebram', () => {
  const odd: Deity = { id: 'x', name: 'Nameless', book: 'Monster Mythology', bookCode: 'MM', rank: null, portfolio: '', briefSummary: '', fullText: '', categories: [] }
  const list = D.patronChoices([odd], { filter: 'all', query: 'name', alignment: null, race: null })
  assert.deepEqual(names(list), ['Nameless'])
  assert.equal(D.patronChoices([odd], { filter: 'fit', query: '', alignment: 'LG', race: null }).length, 0)
  assert.equal(rankGroup(odd.rank), 'Other')
})

test('nomes repetidos entre panteões ficam distinguíveis; findDeityByName prefere o que o Forge oferece', { skip: !hasPantheons }, () => {
  const repeated = duplicateNames(allDeities)
  const tyrs = allDeities.filter((d) => d.name === 'Tyr')
  assert.equal(tyrs.length, 2)
  assert.deepEqual(tyrs.map((d) => deityLabel(d, repeated)).sort(), ['Tyr (Faerûnian)', 'Tyr (Norse)'])
  assert.equal(deityLabel(allDeities.find((d) => d.name === 'Moradin')!, repeated), 'Moradin')
  assert.equal(findDeityByName(allDeities, 'Tyr')?.pantheon, 'Faerûnian')
  const reversed = [...allDeities].reverse()
  assert.equal(findDeityByName(reversed, 'tyr')?.pantheon, 'Faerûnian')
})

test('pantheonGroups: cenários, semi-humanos, Legends & Lore e monstros', { skip: !hasPantheons }, () => {
  const groups = pantheonGroups(allDeities)
  assert.deepEqual(groups.map((g) => g.group).slice(0, 4), ['Campaign settings', 'Demihuman', 'Legends & Lore', 'Monster pantheons'])
  assert.ok(groups[0].pantheons.includes('Faerûnian') && groups[0].pantheons.includes('Dragonlance'))
  assert.ok(groups[1].pantheons.includes('Dwarven') && groups[1].pantheons.includes('Drow'))
  assert.ok(groups[2].pantheons.includes('Norse') && groups[2].pantheons.includes('Greek'))
  assert.equal(pantheonOf({ book: 'Faiths & Avatars' }), 'Faerûnian')
})
