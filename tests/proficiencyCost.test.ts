// Custo das proficiências por classe e bônus de raça/kit (src/rules/proficiencyCost.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as P from '../src/rules/proficiencyCost.ts'
import { kitProficiencyWarnings, kitWeaponWarnings } from '../src/rules/kitRequirements.ts'
import { kitSpecialization } from '../src/rules/specialization.ts'
import { weaponProficiencyKey } from '../src/rules/rules.ts'
import type { Kit } from '../src/data/kits.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

const groupsOf = (characterClass: string, extra: Partial<PlayerCharacter> = {}) =>
  P.characterProficiencyGroups({ characterClass, level: 1, ...extra } as unknown as PlayerCharacter)

test('grupos de cada classe (Tabela 37)', () => {
  assert.deepEqual(P.classProficiencyGroups('Bard'), ['General', 'Rogue', 'Warrior', 'Wizard'])
  assert.deepEqual(P.classProficiencyGroups('Ranger'), ['General', 'Warrior', 'Wizard'])
  assert.deepEqual(P.classProficiencyGroups('Psionicist'), ['General', 'Psionicist'])
  assert.deepEqual(P.classProficiencyGroups('Ninja'), ['General', 'Rogue'])
  assert.deepEqual([...groupsOf('Fighter', { multiClasses: [{ characterClass: 'Mage', level: 1 }] })].sort(), ['General', 'Warrior', 'Wizard'])
  assert.deepEqual([...groupsOf('Thief', { formerClasses: [{ characterClass: 'Cleric', level: 3 }] })].sort(), ['General', 'Priest', 'Rogue'])
})

test('grupos citados no texto dos livros', () => {
  assert.deepEqual([...P.proficiencyGroupsIn(["Warrior (Rogue - Thief's Handbook)"])].sort(), ['Rogue', 'Warrior'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Priest - Paladin'])], ['Priest'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Priest', 'Wizard'])].sort(), ['Priest', 'Wizard'])
  assert.deepEqual([...P.proficiencyGroupsIn(['Dragons'])], [])
})

test('custo: slots do livro no grupo da classe ou em General; um a mais fora', () => {
  const tracking = { mechanics: { groups: ["Warrior (Rogue - Thief's Handbook)"], slotsRequired: 2 } }
  const healing = { mechanics: { groups: ['Priest'], slotsRequired: 2 } }
  const riding = { mechanics: { groups: ['General'], slotsRequired: 1 } }
  const dragon = { mechanics: { groups: ['Dragons'], slotsRequired: 1 } }
  const fighter = groupsOf('Fighter')
  assert.equal(P.nonweaponCost(tracking, fighter), 2)
  assert.equal(P.nonweaponCost(healing, fighter), 3)
  assert.equal(P.nonweaponCost(riding, fighter), 1)
  assert.equal(P.nonweaponCost(dragon, fighter), 2)
  assert.equal(P.nonweaponCost(tracking, groupsOf('Thief')), 2)
  assert.equal(P.nonweaponCost(healing, groupsOf('Mage')), 3)
  assert.equal(P.nonweaponCost(healing, groupsOf('Paladin')), 2)
})

test('bônus de raça e kit: entram de graça, saem quando a origem muda, não repetem', () => {
  const compendium = [
    { id: 'endurance', name: 'Endurance', mechanics: { slotsRequired: 2 } },
    { id: 'riding', name: 'Riding, Land-Based', mechanics: { slotsRequired: 1 } },
    { id: 'etiquette', name: 'Etiquette', mechanics: { slotsRequired: 1 } },
  ]
  const c = { race: 'Dwarf', kit: 'Cavalier', proficiencies: [{ id: 'A', name: 'Etiquette', slots: 1, matchedProficiencyID: 'etiquette' }] } as unknown as PlayerCharacter
  P.syncBonusProficiencies(c, ['Riding, Land-Based', 'Etiquette'], compendium)
  const names = (c.proficiencies ?? []).map((p) => `${p.name}:${p.slots}:${p.grantedBy?.kind ?? 'bought'}`)
  assert.deepEqual(names, ['Etiquette:1:bought', 'Endurance:0:race', 'Riding, Land-Based:0:kit'])
  P.syncBonusProficiencies(c, ['Riding, Land-Based', 'Etiquette'], compendium)
  assert.equal(c.proficiencies?.length, 3)
  c.race = 'Elf'
  c.kit = null
  P.syncBonusProficiencies(c, [], compendium)
  assert.deepEqual((c.proficiencies ?? []).map((p) => p.name), ['Etiquette'])
})

test('armas que o kit exige e recomenda, lidas do texto', () => {
  const keys = ['long bow', 'spear', 'lance', 'staff', 'short sword', 'battle axe']
  const a = P.kitWeaponHints('* Required: Lance. * Recommended: Spear, long bow; if possible, various axes and swords.', keys)
  assert.deepEqual([...a.required], ['lance'])
  assert.deepEqual([...a.recommended].sort(), ['long bow', 'spear'])
  const b = P.kitWeaponHints('Recommended—staff.', keys)
  assert.deepEqual([...b.required], [])
  assert.deepEqual([...b.recommended], ['staff'])
  assert.equal(P.kitWeaponHints('2', keys).recommended.size, 0)
  assert.equal(P.kitWeaponHints(null, keys).required.size, 0)
})


// --- Dados curados dos kits (thac0berry-data/data/kits.json, weapons.json, proficiencies.json) ---
const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
const readJSON = <T>(file: string) => JSON.parse(readFileSync(join(source, file), 'utf8')) as T
const kits = readJSON<Kit[]>('kits.json')
const compendium = readJSON<{ id: string; name: string; mechanics?: { slotsRequired?: number } }[]>('proficiencies.json')
const weaponKeys = [...new Set(readJSON<{ name: string }[]>('weapons.json').map((w) => weaponProficiencyKey(w.name)))]
const kitNamed = (id: string) => {
  const kit = kits.find((k) => k.id === id)
  assert.ok(kit, `kit ${id} não achado`)
  return kit
}
const sheet = (kit: string | null, names: string[] = []) =>
  ({ kit, race: '', proficiencies: names.map((name) => ({ name, slots: 1 })) }) as unknown as PlayerCharacter

test('bônus do kit: só a lista estruturada (Spellarcher)', () => {
  assert.deepEqual(P.kitBonusProficiencies(kitNamed('spellarcher')), ['Bowyer/Fletcher', 'Spellcraft'])
  assert.deepEqual(P.kitBonusProficiencies(null), [])
  assert.deepEqual(P.kitBonusProficiencies(kitNamed('peasant_hero_fighter')), [])
})

test('escolhas grátis do kit: peasant hero escolhe uma de cada lista e a escolha sobrevive ao sync', () => {
  const kit = kitNamed('peasant_hero_fighter')
  const groups = P.kitBonusChoiceGroups(kit)
  assert.deepEqual(groups, [['Agriculture', 'Fishing'], ['Weather Sense', 'Animal Lore']])
  const c = sheet(kit.name, ['Fishing'])
  assert.equal(P.unresolvedKitBonusChoices(c, kit).length, 2)

  // "Fishing" já estava comprada: vira bônus do kit, de graça.
  P.setKitBonusChoice(c, kit, groups[0], 'Fishing', compendium)
  assert.equal(P.chosenKitBonus(c, kit, groups[0]), 'Fishing')
  assert.equal(c.proficiencies?.length, 1)
  assert.equal(c.proficiencies?.[0].slots, 0)
  assert.deepEqual(c.proficiencies?.[0].grantedBy, { kind: 'kit', name: kit.name })
  assert.deepEqual(P.unresolvedKitBonusChoices(c, kit), [groups[1]])

  // Trocar tira a anterior; o sync do Forge mantém a escolha.
  P.setKitBonusChoice(c, kit, groups[0], 'Agriculture', compendium)
  assert.deepEqual(c.proficiencies?.map((e) => e.name), ['Agriculture'])
  P.syncBonusProficiencies(c, P.kitBonusProficiencies(kit), compendium)
  assert.equal(P.chosenKitBonus(c, kit, groups[0]), 'Agriculture')
  assert.equal(c.proficiencies?.length, 1)

  // Mudar de kit leva as escolhas junto.
  c.kit = 'Soldier'
  P.syncBonusProficiencies(c, [], compendium)
  assert.equal(c.proficiencies?.length, 0)

  // Desfazer a escolha.
  c.kit = kit.name
  P.setKitBonusChoice(c, kit, groups[1], 'Animal Lore', compendium)
  P.setKitBonusChoice(c, kit, groups[1], null, compendium)
  assert.equal(P.chosenKitBonus(c, kit, groups[1]), null)
})

test('armas do kit estruturadas: village druid e skyrider', () => {
  const druid = kitNamed('village_druid')
  const h = P.kitWeaponHints(druid.features.weaponProficiencies, weaponKeys, druid.mechanics.weapons)
  assert.deepEqual([...h.recommended], ['quarterstaff'])
  assert.equal(h.choices.length, 1)
  assert.deepEqual([...h.choices[0]].sort(), ['scythe', 'sickle'])
  const sky = kitNamed('skyrider')
  const hs = P.kitWeaponHints(sky.features.weaponProficiencies, weaponKeys, sky.mechanics.weapons)
  assert.ok(hs.recommended.has('long bow') && hs.recommended.has('sling'))
  // Sem lista estruturada, o texto ainda vale.
  const text = P.kitWeaponHints('* Required: Lance.', ['lance'], { required: [], recommended: [] })
  assert.deepEqual([...text.required], ['lance'])
  // Nome fora do compêndio (Katana) não vira chave.
  const samurai = kitNamed('samurai_fighter')
  assert.equal(P.kitWeaponHints(null, weaponKeys, samurai.mechanics.weapons).required.size, 0)
  assert.equal(P.kitWeaponKey('Katana', weaponKeys), null)
  assert.equal(P.kitWeaponKey('Long bow', weaponKeys), 'long bow')
})

test('especialização estruturada vence o texto', () => {
  const arch = kitNamed('spellarcher')
  const spec = kitSpecialization([arch.features.weaponProficiencies, arch.mechanics.weapons?.notes], weaponKeys, arch.mechanics.weapons?.specialization)
  assert.deepEqual([...spec.weapons], ['long bow'])
  assert.equal(spec.forbidsOthers, true)
  assert.equal(spec.forbidsAll, false)
  const samurai = kitNamed('samurai_fighter')
  const s = kitSpecialization([], weaponKeys, samurai.mechanics.weapons?.specialization)
  assert.deepEqual([...s.weapons].sort(), ['daikyu', 'katana'])
  assert.equal(s.forbidsOthers, false)
  assert.equal(kitSpecialization([], weaponKeys, { weapons: [], othersForbidden: true }).forbidsAll, true)
  // Sem dado estruturado: cai no texto.
  assert.deepEqual([...kitSpecialization(['Must specialize in long bow.'], weaponKeys, null).weapons], ['long bow'])
})

test('avisos nonweapon: exigida, escolha exigida e proibida', () => {
  const clan = kitNamed('clansman')
  const rules = clan.mechanics.proficiencies
  assert.deepEqual(kitProficiencyWarnings(clan.name, rules, []), [
    'Clansman requires Endurance.',
    'Clansman requires one of: Riding, Land-Based, Blind-fighting, Gaming, Heraldry, Survival.',
  ])
  assert.deepEqual(kitProficiencyWarnings(clan.name, rules, ['endurance', 'Heraldry']), [])
  const sky = kitNamed('skyrider')
  assert.deepEqual(kitProficiencyWarnings(sky.name, sky.mechanics.proficiencies, ['Jousting']), ['Skyrider forbids Jousting.'])
  assert.deepEqual(kitProficiencyWarnings(sky.name, sky.mechanics.proficiencies, ['Hunting']), [])
  assert.deepEqual(kitProficiencyWarnings(null, rules, []), [])
  const samurai = kitNamed('samurai_fighter')
  assert.deepEqual(kitProficiencyWarnings(samurai.name, samurai.mechanics.proficiencies, []), [`${samurai.name} requires Reading/Writing.`])
})

test('avisos de arma: exigida, escolha, proibida e só-permitidas', () => {
  const druid = kitNamed('village_druid')
  assert.deepEqual(kitWeaponWarnings(druid.name, druid.mechanics.weapons, ['quarterstaff'], weaponKeys), ['Village Druid requires one of: Sickle, Scythe.'])
  assert.deepEqual(kitWeaponWarnings(druid.name, druid.mechanics.weapons, ['sickle'], weaponKeys), [])
  // Katana e Daikyu não estão no compêndio: sem aviso na Forja, mas com aviso se a lista de chaves for omitida.
  const samurai = kitNamed('samurai_fighter')
  assert.deepEqual(kitWeaponWarnings(samurai.name, samurai.mechanics.weapons, [], weaponKeys), [])
  assert.equal(kitWeaponWarnings(samurai.name, samurai.mechanics.weapons, ['katana']).length, 1)
  const rules = { forbidden: ['Dagger or dirk'], allowed: ['Long bow', 'Sling'] }
  assert.deepEqual(kitWeaponWarnings('Test', rules, ['long bow']), [])
  const out = kitWeaponWarnings('Test', rules, ['long bow', 'dagger or dirk'])
  assert.equal(out.length, 2)
  assert.equal(out[0], 'Test forbids Dagger or dirk.')
  assert.match(out[1], /^Test may only use: Long bow, Sling \(some kits limit only the starting weapons\)\.$/)
  assert.deepEqual(kitWeaponWarnings('Test', null, ['x']), [])
})
