// O Forge mostra o que foge da regra da classe. Nada é proibido, mas a lista precisa bater com o livro.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { marketWares } from '../src/rules/market.ts'
import { classGear, fitsFirst, outsideRuleLine, type GearArmor, type GearWeapon } from '../src/rules/classGear.ts'
import { weaponProficiencyKey } from '../src/rules/rules.ts'

type Hero = Parameters<typeof classGear>[0]
const hero = (characterClass: string, extra: Partial<Hero> = {}) => ({ characterClass, level: 1, ...extra }) as Hero
const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const data = <T>(file: string) => JSON.parse(readFileSync(join(source, file), 'utf8')) as T

const weapons = data<GearWeapon[]>('weapons.json')
const armor = data<GearArmor[]>('armor.json')
const weapon = (name: string) => weapons.find((w) => weaponProficiencyKey(w.name) === name)!
const piece = (name: string) => armor.find((a) => a.name === name)!
const allowed = (h: Hero) => new Set(weapons.filter(classGear(h).weaponFits).map((w) => weaponProficiencyKey(w.name)))

test('clérigo: só concussão pura; P/B e sem tipo ficam de fora', () => {
  const gear = classGear(hero('Cleric'))
  for (const name of ['club', "footman's mace", 'warhammer', 'sling', 'quarterstaff']) assert.equal(gear.weaponFits(weapon(name)), true, name)
  for (const name of ['long sword', 'dagger or dirk', 'lucern hammer', 'whip']) assert.equal(gear.weaponFits(weapon(name)), false, name)
})

test('as listas fechadas batem com os nomes dos dados: nenhuma arma do livro se perdeu', () => {
  assert.equal(allowed(hero('Druid')).size, 8)
  assert.equal(allowed(hero('Thief')).size, 12)
  assert.equal(allowed(hero('Mage')).size, 5)
  assert.equal(allowed(hero('Psionicist')).size, 13)
})

test('classes sem restrição de arma não marcam nada', () => {
  for (const cls of ['Fighter', 'Paladin', 'Ranger', 'Bard', 'Ninja']) assert.equal(allowed(hero(cls)).size, new Set(weapons.map((w) => weaponProficiencyKey(w.name))).size, cls)
})

test('Gypsy fica em aberto nas armas, mas a regra aparece em texto', () => {
  const gear = classGear(hero('Gypsy'))
  assert.equal(gear.weaponFits(weapon('two-handed sword')), true)
  assert.match(gear.weaponNotes[0], /one-handed/)
})

test('Anchorite: leal segue o clérigo; neutro fica em aberto', () => {
  assert.equal(classGear(hero('Anchorite', { alignment: 'Lawful Good' })).weaponFits(weapon('long sword')), false)
  assert.equal(classGear(hero('Anchorite', { alignment: 'True Neutral' })).weaponFits(weapon('long sword')), true)
  assert.equal(classGear(hero('Anchorite')).armorFits(piece('Leather')), false)
  assert.equal(classGear(hero('Anchorite')).armorFits(piece('Plate mail')), true)
})

test('multiclasse: as listas somam, mas a de sacerdote sempre vale', () => {
  const fighterMage = hero('Fighter', { multiClasses: [{ characterClass: 'Mage', level: 1 }] })
  assert.equal(classGear(fighterMage).weaponFits(weapon('long sword')), true)
  assert.equal(classGear(fighterMage).armorFits(piece('Plate mail')), true)
  assert.match(classGear(fighterMage).armorNotes[0], /cannot cast spells/)
  const fighterCleric = hero('Fighter', { multiClasses: [{ characterClass: 'Cleric', level: 1 }] })
  assert.equal(classGear(fighterCleric).weaponFits(weapon('long sword')), false)
  assert.equal(classGear(fighterCleric).who, 'your classes')
})

test('classe dupla: vale a classe em uso', () => {
  const dual = hero('Fighter', { formerClasses: [{ characterClass: 'Cleric', level: 3 }] })
  assert.equal(classGear(dual).weaponFits(weapon('long sword')), true)
})

test('Specialty Priest e arma do kit não levam selo', () => {
  assert.equal(classGear(hero('Cleric'), { specialtyPriest: true }).weaponFits(weapon('long sword')), true)
  assert.equal(classGear(hero('Mage'), { kitWeapons: new Set(['long sword']) }).weaponFits(weapon('long sword')), true)
})

test('armaduras: cada classe com a sua regra', () => {
  const fits = (cls: string, name: string) => classGear(hero(cls)).armorFits(piece(name))
  assert.equal(fits('Cleric', 'Full plate'), true)
  assert.equal(fits('Druid', 'Hide'), true)
  assert.equal(fits('Druid', 'Chain mail'), false)
  assert.equal(fits('Druid', 'Medium Shield'), true)
  assert.equal(fits('Thief', 'Studded leather'), true)
  assert.equal(fits('Thief', 'Chain mail'), false)
  assert.equal(fits('Thief', 'Small Shield'), true)
  assert.equal(fits('Mage', 'Leather'), false)
  assert.equal(fits('Mage', 'Small Shield'), false)
  assert.equal(fits('Bard', 'Chain mail'), true)
  assert.equal(fits('Bard', 'Banded mail'), false)
  assert.equal(fits('Bard', 'Small Shield'), false)
  assert.equal(fits('Psionicist', 'Small Shield'), true)
  assert.equal(fits('Psionicist', 'Medium Shield'), false)
  assert.equal(fits('Psionicist', 'Basinet'), false)
  assert.equal(fits('Ninja', 'Medium Shield'), true)
  assert.equal(fits('Ninja', 'Plate mail'), false)
  assert.equal(fits('Gypsy', 'Chain mail'), false)
  assert.equal(fits('Gypsy', 'Small Shield'), false)
})

test('munição segue as armas que a disparam', () => {
  const ammo = (name: string) => marketWares(data('weapons.json'), [], []).find((w) => w.name === name)!
  const fits = (cls: string, name: string) => ammo(name).launchers!.some(classGear(hero(cls)).weaponFits)
  assert.equal(fits('Thief', 'Flight arrow'), true)
  assert.equal(fits('Cleric', 'Flight arrow'), false)
  assert.equal(fits('Mage', 'Hand quarrel'), false)
})

test('ordem e aviso', () => {
  assert.deepEqual(fitsFirst(['a', 'B', 'c', 'D'], (x) => x === x.toUpperCase()), ['B', 'D', 'a', 'c'])
  assert.match(outsideRuleLine({ who: 'Clerics' }, ['Long sword']), /Clerics: Long sword/)
})
