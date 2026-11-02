// Etapa de magias do The Forge (src/rules/spellbook.ts): grimório inicial do
// DMG cap. 7, bardo do PHB cap. 3 e esferas do sacerdote.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as B from '../src/rules/spellbook.ts'
import { wizardLearning } from '../src/rules/rules.ts'

const spell = (name: string, level: number, schools: string[]): B.BookSpell => ({ id: name.toLowerCase().replace(/ /g, '-'), name, level, schools })
const spells = [
  spell('Read Magic', 1, ['Divination']),
  spell('Detect Magic', 1, ['Divination']),
  spell('Magic Missile', 1, ['Invocation/Evocation']),
  spell('Phantasmal Force', 1, ['Illusion/Phantasm']),
  spell('Sleep', 1, ['Enchantment/Charm']),
  spell('Shield', 1, ['Evocation', 'Abjuration']),
  spell('Burning Hands', 1, ['Alteration']),
  spell('Web', 2, ['Evocation', 'Conjuration/Summoning']),
  spell('Invisibility', 2, ['Illusion/Phantasm']),
]
const byID = new Map(spells.map((s) => [s.id, s]))
const find = (name: string) => spells.find((s) => s.name === name)!
const base = { mage: true, level: 1, castable: 1, chance: 70, perCircle: 11, school: null }

test('Tabela 4: chance de aprender e máximo por círculo', () => {
  assert.deepEqual(wizardLearning(16), { chance: 70, perCircle: 11 })
  assert.deepEqual(wizardLearning(19), { chance: 95, perCircle: null })
  assert.equal(wizardLearning(8), null)
})

test('trial: Read/Detect Magic de graça, 3d4 limitado pela Inteligência', () => {
  let st = B.chooseMethod('trial', 'perLevel', true, spells)
  assert.deepEqual(Object.values(st.book), ['auto', 'auto'])
  let ctx = B.bookContext(base, st)
  assert.equal(ctx.first, null)
  assert.match(B.spellVerdict(find('Sleep'), ctx, st, byID).reason!, /Roll 3d4/)
  st = { ...st, dice: [4, 4, 4] }
  ctx = B.bookContext({ ...base, perCircle: 9 }, st)
  assert.equal(ctx.first, 9)
  assert.equal(B.spellVerdict(find('Read Magic'), ctx, st, byID).ok, false)
})

test('rolagem: passa e escreve; falha e tranca até o próximo nível', () => {
  let st = { ...B.chooseMethod('trial', 'perLevel', true, spells), dice: [1, 1, 2] }
  const ctx = B.bookContext(base, st)
  let r = B.studySpell(st, find('Sleep'), ctx, 70)
  assert.equal(r.ok, true)
  st = r.state
  assert.equal(st.book[find('Sleep').id], 'roll')
  r = B.studySpell(st, find('Magic Missile'), ctx, 71)
  assert.equal(r.ok, false)
  st = r.state
  assert.match(B.spellVerdict(find('Magic Missile'), ctx, st, byID).reason!, /rolled 71/)
  // 4 magias no livro (2 + Sleep + ...): o livro de 4 enche
  st = B.studySpell(st, find('Shield'), ctx, 1).state
  assert.match(B.spellVerdict(find('Burning Hands'), ctx, st, byID).reason!, /full \(4\)/)
})

test('gift: 6 magias sem rolar', () => {
  const st = B.chooseMethod('gift', 'perLevel', true, spells)
  const ctx = B.bookContext(base, st)
  assert.equal(ctx.first, 6)
  assert.equal(ctx.rolls, false)
  const r = B.studySpell(st, find('Sleep'), ctx, null)
  assert.equal(r.state.book[find('Sleep').id], 'given')
})

test('library: nada de graça, até o máximo da Inteligência', () => {
  const st = B.chooseMethod('library', 'perLevel', true, spells)
  assert.deepEqual(st.book, {})
  assert.equal(B.bookContext(base, st).first, 11)
})

test('especialista: ±15%, escola oposta lacrada, adivinhação menor aberta, presente da escola', () => {
  const ctx = B.bookContext({ ...base, school: 'Illusion/Phantasm' }, { method: 'trial', dice: [3, 3, 3] })
  assert.equal(B.learnChance(find('Phantasmal Force'), ctx), 85)
  assert.equal(B.learnChance(find('Sleep'), ctx), 55)
  assert.equal(B.opposedSpell('Illusion/Phantasm', find('Magic Missile')), true)
  assert.equal(B.opposedSpell('Illusion/Phantasm', find('Detect Magic')), false)
  assert.equal(B.opposedSpell('Conjuration/Summoning', find('Detect Magic')), true)
  const st = B.chooseMethod('trial', 'perLevel', true, spells)
  const r = B.studySpell({ ...st, dice: [3, 3, 3] }, find('Phantasmal Force'), ctx, null)
  assert.equal(r.state.book[find('Phantasmal Force').id], 'gift')
  assert.equal(B.schoolGiftOpen(ctx, r.state), false)
  // trocar de escola tira o presente e as opostas
  const swapped = B.chooseSchool({ ...r.state, book: { ...r.state.book, [find('Magic Missile').id]: 'roll' } }, 'Invocation/Evocation', byID)
  assert.equal(swapped.book[find('Phantasmal Force').id], undefined)
  assert.equal(swapped.book[find('Magic Missile').id], 'roll')
})

test('acima do 1º nível: uma por nível, ou até a Inteligência em todo círculo', () => {
  const st = B.chooseMethod('gift', 'perLevel', true, spells)
  const ctx = B.bookContext({ ...base, level: 3, castable: 2 }, st)
  assert.equal(ctx.extra, 2)
  assert.equal(B.bookRoom(1, ctx, 'perLevel'), 8)
  assert.equal(B.bookRoom(2, ctx, 'perLevel'), 2)
  assert.equal(B.bookRoom(2, ctx, 'intMax'), 11)
  assert.equal(B.bookRoom(3, ctx, 'intMax'), 0)
  let s = B.studySpell(st, find('Web'), ctx, null).state
  assert.equal(B.spellVerdict(find('Invisibility'), ctx, s, byID).ok, true)
  // as 2 magias ganhas depois do 1º nível já foram para o 2º círculo
  s = B.studySpell(s, find('Invisibility'), ctx, null).state
  assert.match(B.spellVerdict(spell('Mirror Image', 2, ['Illusion/Phantasm']), ctx, s, new Map([...byID, ['mirror-image', spell('Mirror Image', 2, ['Illusion/Phantasm'])]])).reason!, /full \(2\)/)
  assert.equal(B.spellVerdict(find('Sleep'), ctx, s, byID).ok, true)
})

test('bardo: nada no 1º nível; 1d4 no 2º', () => {
  const bard = { ...base, mage: false }
  assert.equal(B.bookContext(bard, { method: 'trial', dice: null }).first, 0)
  assert.equal(B.bookContext({ ...bard, level: 2 }, { method: 'trial', dice: null }).first, null)
  assert.equal(B.bookContext({ ...bard, level: 2 }, { method: 'trial', dice: [3] }).first, 3)
  assert.equal(B.bookContext({ ...bard, level: 4 }, { method: 'trial', dice: [3] }).extra, 2)
})

test('bookEntries guarda o id das entradas que já existiam', () => {
  const st = B.chooseMethod('trial', 'perLevel', true, spells)
  let n = 0
  const entries = B.bookEntries(st, byID, [{ id: 'OLD', name: 'Read Magic', matchedSpellID: 'read-magic', level: null }], () => `N${++n}`)
  assert.deepEqual(entries.map((e) => [e.id, e.name]), [['N1', 'Detect Magic'], ['OLD', 'Read Magic']])
})

test('esferas: as da classe, o ciclo do especialista e o limite do minor', () => {
  const cleric = B.defaultSphereAccess('Cleric')
  assert.equal(cleric.Healing, 'major')
  assert.equal(cleric.Elemental, 'minor')
  assert.equal(B.defaultSphereAccess('Druid').Divination, 'minor')
  let a = B.cycleSphere({}, 'War')
  assert.equal(a.War, 'minor')
  a = B.cycleSphere(a, 'War')
  assert.equal(a.War, 'major')
  assert.equal(B.cycleSphere(a, 'War').War, undefined)
  assert.equal(B.sphereGrants({ level: 4, spheres: ['Elemental Fire'] }, cleric, 5), false)
  assert.equal(B.sphereGrants({ level: 3, spheres: ['Elemental Fire'] }, cleric, 5), true)
  assert.equal(B.sphereGrants({ level: 4, spheres: ['Healing'] }, cleric, 3), false)
})

test('paladino: quatro esferas, magias só do 9º nível em diante (Tabela 17)', () => {
  const access = B.defaultSphereAccess('Paladin')
  assert.deepEqual(Object.keys(access).sort(), ['Combat', 'Divination', 'Healing', 'Protection'])
  assert.deepEqual(B.paladinSpellProgression(8), [])
  assert.deepEqual(B.paladinSpellProgression(9), [1, 0, 0, 0])
  assert.deepEqual(B.paladinSpellProgression(15), [3, 2, 1, 1])
  assert.deepEqual(B.paladinSpellProgression(25), [3, 3, 3, 3])
  assert.equal(B.paladinCastingLevel(12), 4)
  assert.equal(B.paladinCastingLevel(20), 9)
})
