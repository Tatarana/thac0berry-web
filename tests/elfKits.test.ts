// Kits de elfo (Complete Book of Elves) e kits de livros menores (2026-11-16): dados reais de
// thac0berry-data/data/kits.json e rules.json, e as regras de elegibilidade e aviso.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { kitWarnings } from '../src/rules/multiclass.ts'
import { kitsAllowedFor } from '../src/rules/raceKit.ts'
import type { Kit } from '../src/data/kits.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const kits: (Kit & { sourceBook: string })[] = JSON.parse(readFileSync(join(source, 'kits.json'), 'utf8'))
const rules: { id: string; book: string }[] = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8'))
const kit = (name: string) => {
  const found = kits.find((k) => k.name === name)
  assert.ok(found, `kit ${name} não achado`)
  return found
}
const namesFor = (cls: string) => kitsAllowedFor(kits, cls).map((k) => k.name)

const CBE = ['Archer - Elf', 'Wilderness Runner', 'Windrider', 'Herbalist', 'Undead Slayer', 'Spellfilcher', 'Bladesinger', 'War Wizard', 'Huntsman', 'Collector', 'Infiltrator']

test('os 11 kits do CBE: grupo Demihuman, subclass Elf, só para elfos, sem id repetido', () => {
  assert.equal(new Set(kits.map((k) => k.id)).size, kits.length)
  for (const name of CBE) {
    const k = kit(name)
    assert.equal(k.sourceBook, 'The Complete Book of Elves', name)
    assert.equal(k.classEligibility.classGroup, 'Demihuman', name)
    assert.equal(k.classEligibility.subclass, 'Elf', name)
    assert.equal(k.mechanics.requirements.races, 'Elf', name)
  }
  assert.equal(kits.filter((k) => k.classEligibility.classGroup === 'Demihuman').length, 11)
})

test('requisitos conferidos no texto: Bladesinger 13/13/15/15, Collector Int 13 e Cha 15', () => {
  assert.deepEqual(kit('Bladesinger').mechanics.requirements.abilities, { Strength: 13, Constitution: 13, Dexterity: 15, Intelligence: 15 })
  assert.deepEqual(kit('Collector').mechanics.requirements.abilities, { Intelligence: 13, Charisma: 15 })
  assert.deepEqual(kit('Hero').mechanics.requirements.abilities, {}) // duas alternativas: só no texto
  assert.deepEqual(kit('Rogues of the Cold Lands').mechanics.requirements.abilities, { Dexterity: 9, Constitution: 12 })
  assert.equal(kit('Spellfilcher').mechanics.startingCash, '(2d4+1)x10 gp')
})

test('elegibilidade flexível: o kit aparece a quem tem qualquer classe dele; Undead Slayer a todos', () => {
  assert.ok(namesFor('Fighter').includes('Bladesinger'))
  assert.ok(namesFor('Mage').includes('Bladesinger'))
  assert.ok(namesFor('Fighter').includes('Archer - Elf'))
  assert.ok(namesFor('Ranger').includes('Wilderness Runner'))
  assert.ok(!namesFor('Thief').includes('Archer - Elf'))
  assert.ok(namesFor('Thief').includes('Spellfilcher'))
  assert.ok(namesFor('Cleric').includes('Herbalist'))
  assert.ok(namesFor('Druid').includes('Herbalist'))
  assert.ok(!namesFor('Fighter').includes('Herbalist'))
  for (const cls of ['Fighter', 'Mage', 'Cleric', 'Thief', 'Bard', 'Ninja', 'Psionicist']) assert.ok(namesFor(cls).includes('Undead Slayer'), cls)
})

test('avisos: kit multiclasse, raça do kit; a regra "classe única" não vale para kits de outros livros', () => {
  const elfFM = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Mage' as const, level: 3 }], race: 'Elf' }
  const elfFighter = { characterClass: 'Fighter' as const, level: 3, race: 'Elf' }
  const humanFighter = { characterClass: 'Fighter' as const, level: 3, race: 'Human' }

  assert.deepEqual(kitWarnings(kit('Bladesinger'), elfFM), [])
  assert.match(kitWarnings(kit('Bladesinger'), elfFighter).join(' '), /Fighter\/Mage kit \(The Complete Book of Elves\)/)
  assert.match(kitWarnings(kit('Bladesinger'), humanFighter).join(' '), /limited to: Elf/)
  assert.deepEqual(kitWarnings(kit('Archer - Elf'), elfFighter), [])
  // kit de grupo Demihuman não herda o aviso de guerreiro do CFH
  assert.deepEqual(kitWarnings(kit('Archer - Elf'), elfFM), [])

  const athasianElf = { characterClass: 'Fighter' as const, level: 3, multiClasses: [{ characterClass: 'Thief' as const, level: 3 }], race: 'Elf' }
  assert.deepEqual(kitWarnings(kit('Savage Hunter'), athasianElf, ['Dark Sun']), [])
  // um kit de guerreiro do CFH continua avisando
  const cfh = kits.find((k) => k.classEligibility.classGroup === 'Warrior' && k.sourceBook === "The Complete Fighter's Handbook")
  assert.ok(cfh)
  assert.match(kitWarnings(cfh, athasianElf)[0], /single-class warriors/)
})

test('kits reclassificados: livro e grupo reais', () => {
  for (const name of ['Historian', 'Seer - Chronomancer', 'Traveler', 'Guide']) assert.equal(kit(name).sourceBook, 'Chronomancer Book', name)
  assert.equal(kit('Hero').sourceBook, 'Age of Heroes Campaign Sourcebook')
  assert.equal(kit('Hoplite').classEligibility.classGroup, 'Warrior')
  assert.equal(kit('Rogues of Cormyr').sourceBook, 'Wizards & Rogues of the Realms')
  assert.equal(kit('Rogues of Cormyr').setting, 'Forgotten Realms')
  assert.equal(kit('Savage Hunter').setting, 'Dark Sun')
  assert.equal(kit('Hinterland Bandit').setting, 'Planescape')
  assert.deepEqual(kit('Windrider').mechanics.proficiencies?.bonus, ['riding, airborne', 'animal handling', 'animal training'])
})

test('regras dos 4 livros novos: contagens e ids únicos', () => {
  const count = (book: string) => rules.filter((r) => r.book === book).length
  assert.deepEqual([count('CBE'), count('CWH'), count('CBN'), count('TOM')], [69, 58, 62, 13])
  assert.equal(new Set(rules.map((r) => r.id)).size, rules.length)
})
