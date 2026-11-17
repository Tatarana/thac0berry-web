// Especialização em arma: quem pode, o aviso de multiclasse e a leitura do texto dos kits
// (dados reais de thac0berry-data/data/kits.json e weapons.json).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import {
  canSpecializeWeapon,
  kitSpecialization,
  kitSpecializationWarning,
  multiClassSpecializationNote,
  specializationRule,
} from '../src/rules/specialization.ts'
import { weaponProficiencyKey } from '../src/rules/rules.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const kits: { name: string; features: { weaponProficiencies?: string | null }; mechanics: { weapons?: { notes?: string | null } | null } }[] = JSON.parse(
  readFileSync(join(source, 'kits.json'), 'utf8'),
)
const weaponKeys = [...new Set((JSON.parse(readFileSync(join(source, 'weapons.json'), 'utf8')) as { name: string }[]).map((w) => weaponProficiencyKey(w.name)))]
const spec = (name: string) => {
  const kit = kits.find((k) => k.name === name)
  assert.ok(kit, `kit ${name} não achado`)
  return kitSpecialization([kit.features.weaponProficiencies, kit.mechanics.weapons?.notes], weaponKeys)
}

const single = (characterClass: string) => ({ characterClass, level: 1 }) as never
const multi = (a: string, b: string) => ({ characterClass: a, level: 1, multiClasses: [{ characterClass: b, level: 1 }] }) as never

test('Fighter de classe única especializa, sem aviso', () => {
  assert.deepEqual(specializationRule(single('Fighter')), { allowed: true, knifeOnly: false, multiClassNote: false })
  assert.ok(canSpecializeWeapon(single('Fighter'), 'Long sword'))
})

test('multiclasse com Fighter especializa, com aviso', () => {
  assert.deepEqual(specializationRule(multi('Fighter', 'Mage')), { allowed: true, knifeOnly: false, multiClassNote: true })
  assert.ok(specializationRule(multi('Mage', 'Fighter')).multiClassNote)
  assert.match(multiClassSpecializationNote, /Spellarcher/)
})

test('Ranger, Paladin, Mage, Thief e multiclasses sem Fighter não especializam', () => {
  for (const c of ['Ranger', 'Paladin', 'Mage', 'Thief', 'Cleric']) assert.equal(specializationRule(single(c)).allowed, false, c)
  assert.equal(specializationRule(multi('Mage', 'Thief')).allowed, false)
  assert.equal(specializationRule(multi('Cleric', 'Ranger')).allowed, false)
  assert.equal(canSpecializeWeapon(single('Ranger'), 'Long bow'), false)
})

test('Gypsy só na faca', () => {
  assert.ok(canSpecializeWeapon(single('Gypsy'), 'Knife'))
  assert.equal(canSpecializeWeapon(single('Gypsy'), 'Long sword'), false)
})

test('Spellarcher: long bow exigido, as outras proibidas', () => {
  const s = spec('Spellarcher')
  assert.deepEqual([...s.weapons], ['long bow'])
  assert.equal(s.forbidsOthers, true)
  assert.equal(s.forbidsAll, false)
  assert.equal(kitSpecializationWarning('Spellarcher', s, ['long bow']), null)
  assert.equal(kitSpecializationWarning('Spellarcher', s, ['long sword']), 'Spellarcher may not specialize in any weapon other than long bow.')
  assert.equal(kitSpecializationWarning('Spellarcher', s, []), null)
})

test('kits que proíbem especializar de vez', () => {
  for (const name of ['Diplomat - Dragon', 'Military Scout', 'Redeemer']) {
    const s = spec(name)
    assert.equal(s.forbidsAll, true, name)
    assert.match(kitSpecializationWarning(name, s, ['dagger']) ?? '', /may not specialize/)
  }
})

test('kits com armas de especialização fixas', () => {
  assert.deepEqual([...spec('Amazon - Fighter').weapons].sort(), ['long bow', 'spear'])
  assert.equal(spec('Amazon - Fighter').forbidsOthers, true)
  assert.deepEqual([...spec('Northman').weapons].sort(), ['battle axe', 'long sword'])
  assert.equal(spec('Northman').forbidsOthers, true)
  assert.deepEqual([...spec('Hoplite').weapons].sort(), ['short sword', 'spear'])
  assert.deepEqual([...spec('Errant').weapons], ['jousting lance'])
  assert.deepEqual([...spec('Aristocrat').weapons], [])
  assert.equal(spec('Noble Warrior').weapons.size, 0)
})

test('kit sem texto de especialização não marca nada', () => {
  for (const text of [undefined, null, '', 'Required: Spear. Recommended: Sling, dagger.', 'Barbarian fighters may specialize in any weapon.']) {
    const s = kitSpecialization([text], weaponKeys)
    assert.equal(s.weapons.size, 0)
    assert.equal(s.forbidsOthers, false)
    assert.equal(s.forbidsAll, false)
  }
  assert.equal(kitSpecializationWarning('Barbarian - Fighter', kitSpecialization([null], weaponKeys), ['spear']), null)
})
