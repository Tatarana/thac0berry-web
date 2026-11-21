// Kits que faltavam (2026-11-20): dados reais de thac0berry-data/data/kits.json, quais o Forge e a
// ficha oferecem, e a aceitação das subraças (baseRace) nos kits de anão, gnomo e halfling.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { hiddenReasonLabel, subclassOrder, type ClassGroup, type Kit } from '../src/data/kits.ts'
import { settingsUnderConstruction } from '../src/rules/campaignFilter.ts'
import { kitAllowsRace, kitWarnings } from '../src/rules/multiclass.ts'
import { kitAvailabilityNote, kitSelectable, kitsAllowedFor } from '../src/rules/raceKit.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const kits: Kit[] = JSON.parse(readFileSync(join(source, 'kits.json'), 'utf8'))
const kit = (name: string) => {
  const found = kits.find((k) => k.name === name)
  assert.ok(found, `kit ${name} não achado`)
  return found
}
const offered = (cls: string, settings: string[] | null = null) =>
  kitsAllowedFor(kits, cls)
    .filter((k) => kitSelectable(k, settings))
    .map((k) => k.name)

test('ids e nomes únicos (a ficha guarda o kit pelo nome); todo kit aparece no compêndio', () => {
  assert.equal(new Set(kits.map((k) => k.id)).size, kits.length)
  // "Forester" (CFH) está repetido desde antes (pendência do backlog); nenhum nome novo se repete.
  const names = kits.map((k) => k.name.toLowerCase()).filter((n) => n !== 'forester')
  assert.equal(new Set(names).size, names.length)
  const lost = kits.filter((k) => !subclassOrder[k.classEligibility.classGroup as ClassGroup]?.includes(k.classEligibility.subclass))
  assert.deepEqual(lost.map((k) => `${k.name} (${k.classEligibility.classGroup}/${k.classEligibility.subclass})`), [])
})

test('escondidos: todo playable:false tem motivo conhecido; cenário em construção só usa playable:false para o ambíguo', () => {
  const hidden = kits.filter((k) => k.playable === false)
  assert.ok(hidden.length > 60)
  for (const k of hidden) assert.ok(k.hiddenReason && k.hiddenReason in hiddenReasonLabel, k.name)
  // cenário em construção já é escondido pela web; só a classe ambígua (undecided) pede playable:false
  for (const k of kits.filter((x) => x.setting && settingsUnderConstruction.includes(x.setting) && x.playable === false)) assert.equal(k.hiddenReason, 'undecided', k.name)
  assert.equal(kit('Hedge Wizard').hiddenReason, 'humanoid-not-playable')
  assert.equal(kit('Jazst').hiddenReason, 'class-not-in-app')
  assert.equal(kit('Gaucho').hiddenReason, 'setting-not-in-forge')
  assert.equal(kit('Mystery Man').hiddenReason, 'undecided')
})

test('Forge e ficha: escondidos e cenários em construção não são oferecidos, nem com "todos os mundos"', () => {
  assert.ok(!kitSelectable(kit('Hedge Wizard'), null))
  assert.ok(!kitSelectable(kit('Gaucho'), ['Savage Coast']), 'cenário fora do Forge nunca é oferecido')
  for (const name of ['Sorcerer', 'Corsair - Spacefarer', 'Dragon Mage', 'Dragon Psionicist']) {
    assert.ok(!kitSelectable(kit(name), null), name)
    assert.ok(!kitSelectable(kit(name), ['Al-Qadim', 'Spelljammer', 'Council of Wyrms']), name)
  }
  assert.ok(kitSelectable(kit('Battlerager'), null))
  assert.ok(kitSelectable(kit('Acrobat'), ['Dark Sun']))
  assert.ok(kitSelectable(kit('Rogues of Waterdeep'), ['Forgotten Realms']))
  assert.ok(!kitSelectable(kit('Rogues of Waterdeep'), ['Dark Sun']), 'o filtro de cenários do Forge continua valendo')
  assert.ok(kitSelectable(kit('Rogues of Waterdeep'), undefined), 'na ficha o cenário só avisa')
  // o kit já escolhido continua à vista
  assert.ok(kitSelectable(kit('Hedge Wizard'), null, 'Hedge Wizard'))
  assert.ok(!offered('Mage').includes('Hedge Wizard'))
})

test('compêndio: aviso dos escondidos e dos cenários em construção', () => {
  assert.match(kitAvailabilityNote(kit('Hedge Wizard'), hiddenReasonLabel) ?? '', /humanoid races are not playable/)
  assert.match(kitAvailabilityNote(kit('Sorcerer'), hiddenReasonLabel) ?? '', /Al-Qadim: under construction/)
  assert.equal(kitAvailabilityNote(kit('Battlerager'), hiddenReasonLabel), null)
})

test('kits de raça aceitam as subraças pela raça-base', () => {
  const dwarfKit = kit('Battlerager')
  assert.equal(dwarfKit.mechanics.requirements.races, 'Dwarf')
  for (const race of ['Dwarf', 'Mountain Dwarf', 'Hill Dwarf', 'Duergar', 'Deep Dwarf', 'Athasian Dwarf']) assert.ok(kitAllowsRace('Dwarf', race), race)
  for (const race of ['Elf', 'Human', 'Halfling']) assert.ok(!kitAllowsRace('Dwarf', race), race)
  assert.deepEqual(kitWarnings(dwarfKit, { characterClass: 'Fighter', level: 1, race: 'Mountain Dwarf' }), [])
  assert.match(kitWarnings(dwarfKit, { characterClass: 'Fighter', level: 1, race: 'Elf' }).join(' '), /limited to: Dwarf/)
  const gnomes = kit('Imagemaker').mechanics.requirements.races
  assert.ok(kitAllowsRace(gnomes, 'Rock Gnome'))
  assert.ok(kitAllowsRace(gnomes, 'Svirfneblin'))
  assert.ok(!kitAllowsRace(gnomes, 'Hairfoot Halfling'))
  const halflings = kit('Archer - Halfling').mechanics.requirements.races
  assert.ok(kitAllowsRace(halflings, 'Stout Halfling'))
  assert.ok(!kitAllowsRace(halflings, 'Forest Gnome'))
})

test('classes: o kit aparece a quem a página permite', () => {
  assert.ok(offered('Fighter').includes('Battlerager'))
  assert.ok(!offered('Thief').includes('Battlerager'))
  assert.ok(offered('Thief').includes('Locksmith'))
  assert.ok(offered('Cleric').includes('Ritual Priest'), 'Specialty Priest entra pelo Cleric')
  assert.ok(offered('Mage').includes('Imagemaker'))
  assert.ok(offered('Paladin').includes('Kshatriya'))
  // Skills & Powers: abertos a todas as classes do livro, menos as barradas
  assert.ok(offered('Mage').includes('Scholar') && !offered('Fighter').includes('Scholar'))
  assert.ok(offered('Fighter').includes('Barbarian') && !offered('Paladin').includes('Barbarian') && !offered('Bard').includes('Barbarian'))
  assert.deepEqual(kit('Jester').classEligibility.allowedClasses, ['Thief', 'Bard'])
  assert.deepEqual(kit('Champion').classEligibility.combination, ['Fighter', 'Cleric'])
})

test('livros de verdade por trás dos rótulos "AD&D 2e Supplements" e "Arabian Adventures"', () => {
  assert.equal(kit('Archetypal Necromancer').sourceBook, 'The Complete Book of Necromancers')
  assert.equal(kit('Floating Sorcerer').sourceBook, "The Planewalker's Handbook")
  assert.equal(kit('Floating Sorcerer').setting, 'Planescape')
  assert.equal(kit('Wizards of Halruaa').sourceBook, 'Wizards & Rogues of the Realms')
  assert.equal(kit('Clockwork Mage').sourceBook, "The Complete Sha'ir's Handbook")
  assert.equal(kit('Tekchakak').sourceBook, 'Thri-Kreen of Athas')
  assert.equal(kit('Kshatriya').sourceBook, 'Dragon Magazine #225')
})

test('curadoria estruturada dos kits novos', () => {
  const b = kit('Battlerager').mechanics
  assert.deepEqual(b.proficiencies?.bonus, ['Endurance', 'Intimidation', 'Singing'])
  assert.deepEqual(b.weapons?.required, ['Battle axe', 'Warhammer'])
  assert.deepEqual(b.weapons?.specialization, { weapons: ['Battle axe', 'Warhammer'], mustSpecialize: true, othersForbidden: false })
  assert.equal(kit('Entertainer').mechanics.proficiencies?.bonusChoices?.length, 2)
  assert.deepEqual(kit('Explorer').mechanics.proficiencies?.bonus, ['Survival'])
  assert.equal(kit('Clansdwarf').mechanics.nonweaponSlots?.bonus, 2)
  assert.deepEqual(kit('Tekchakak').mechanics.proficiencies?.required, ['Water Find'])
  assert.deepEqual(kit('Rogues of Anauroch').mechanics.weaponSlots, { initial: 2, additional: 4, nonproficiencyPenalty: '-3' })
  assert.equal(kit('Vindicator').mechanics.startingCash, '5d4x10 gp')
  assert.equal(kit('Highborn').mechanics.startingCash, null) // 400 gp + 5d4x10: não é uma fórmula só
  for (const k of kits.slice(506)) assert.ok(!k.description.briefSummary.includes('*') && !k.description.briefSummary.startsWith(':'), k.name)
})
