// Ravenloft (docs/ravenloft.md): Anchorite jogável (Domains of Dread) e os
// testes de medo, horror e loucura.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import * as M from '../src/rules/multiclass.ts'
import * as R from '../src/rules/rules.ts'
import * as V from '../src/rules/ravenloft.ts'
import * as S from '../src/rules/sessionReport.ts'
import { levelLimitWarning } from '../src/rules/raceKit.ts'
import type { CharacterClass, PlayerCharacter } from '../src/types/library.ts'

const abilities = { strength: 12, dexterity: 10, constitution: 12, intelligence: 10, wisdom: 16, charisma: 15 }

function anchorite(over: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return { characterClass: 'Anchorite', level: 5, race: 'Human', abilities: { ...abilities }, ...over } as unknown as PlayerCharacter
}

test('Anchorite e Gypsy sempre no seletor (2026-10-17: o cenário só avisa, não esconde)', () => {
  assert.deepEqual(V.ravenloftClasses, ['Anchorite', 'Gypsy'])
  assert.equal(V.isRavenloftClass('Gypsy'), true)
  assert.equal(V.isRavenloftClass('Fighter'), false)
  assert.equal(V.campaignAllowsRavenloft(null), false)
  assert.equal(V.campaignAllowsRavenloft(['Ravenloft', 'Dark Sun']), true)
})

test('avisos do Anchorite: campanha sem Ravenloft, WIS/CHA abaixo do mínimo, raça', () => {
  assert.deepEqual(V.ravenloftWarnings(anchorite(), ['Ravenloft']), [])
  const all = V.ravenloftWarnings(anchorite({ race: 'Dwarf', abilities: { ...abilities, wisdom: 11, charisma: 14 } }), null)
  assert.equal(all.length, 4)
  assert.match(all[0], /does not have the Ravenloft setting/)
  assert.match(all[1], /Wisdom 12/)
  assert.match(all[2], /Charisma 15/)
  assert.match(all[3], /must be human/)
  // Outras classes não ganham aviso nenhum.
  assert.deepEqual(V.ravenloftWarnings(anchorite({ characterClass: 'Cleric' }), null), [])
  assert.match(levelLimitWarning('Elf', 'Anchorite', 1)!, /Domains of Dread/)
})

test('Anchorite: grupo Priest, d8, THAC0, saves e slots do sacerdote, XP próprio', () => {
  assert.equal(R.canonicalClass('Anchorite'), 'Anchorite')
  assert.equal(R.classGroup('Anchorite'), 'Priest')
  assert.equal(R.hitDieType('Anchorite'), 'd8')
  assert.equal(R.hasSpellSheet('Anchorite'), true)
  assert.equal(R.isArcaneCaster('Anchorite'), false)
  for (let level = 1; level <= 20; level++) {
    const ctx = (cls: string) => ({ level, characterClass: cls, abilities })
    assert.deepEqual(R.resolveRule('thac0', ctx('Anchorite')), R.resolveRule('thac0', ctx('Cleric')))
    assert.deepEqual(R.resolveRule('savingThrows', ctx('Anchorite')), R.resolveRule('savingThrows', ctx('Cleric')))
    assert.deepEqual(R.resolveRule('priestSpellSlots', ctx('Anchorite')), R.resolveRule('priestSpellSlots', ctx('Cleric')))
  }
  assert.equal(R.xpNeededForNextLevel(1, 'Anchorite'), '2,000')
  const slots = (cls: CharacterClass) => R.computedSpellSlotAllotments({ characterClass: cls, level: 9, abilities })
  assert.deepEqual(slots('Anchorite'), slots('Cleric'))
  assert.ok(slots('Anchorite').length > 0)
  assert.deepEqual(S.primeRequisites.Anchorite, ['wisdom'])
})

test('Fear/Horror/Madness Checks do Anchorite pelo nível (tabela do grupo Priest)', () => {
  assert.deepEqual(V.scareChecks('Anchorite', 1), { fear: 13, horror: 15, madness: 18 })
  assert.deepEqual(V.scareChecks('Anchorite', 7), { fear: 10, horror: 12, madness: 15 })
  assert.deepEqual(V.scareChecks('Anchorite', 20), { fear: 2, horror: 3, madness: 8 })
  assert.equal(V.scareChecks('Anchorite', 21), null)
  assert.equal(V.scareChecks('Cleric', 5), null)
})

test('dados reais: as tabelas do código batem com o Domains of Dread no rules.json', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const rules = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')) as { id: string; tables: { title: string; rows: string[][] }[] }[]
  const table = (ruleID: string, title: string) => rules.find((r) => r.id === ruleID)!.tables.find((t) => t.title === title)!
  const number = (text: string) => Number(text.replace(/,/g, ''))
  // XP e slots da progressão do Anchorite.
  const progression = table('dod_ch00_anchorite', 'Anchorite Progression')
  progression.rows.forEach((row, i) => {
    const level = i + 1
    assert.equal(R.xpRequired(level, 'Anchorite'), number(row[1]), `XP do nível ${level}`)
    // Com WIS 18 (libera os círculos 6 e 7), tirando o bônus de Sabedoria do PHB (+2/+2/+1/+1 nos círculos 1–4).
    const book = row.slice(4).map((cell) => (cell === '—' ? 0 : Number(cell)))
    assert.deepEqual(R.priestSpellProgression(level, 18).map((n, c) => n - [2, 2, 1, 1, 0, 0, 0][c] * (n > 0 ? 1 : 0)), book, `slots do nível ${level}`)
  })
  // Testes do grupo Priest.
  const checks = table('dod_ch00_fear_horror_and_madness_checks', 'Priest Fear, Horror and Madness Checks')
  for (const [levels, fear, horror, madness] of checks.rows) {
    const level = Number(levels.split('-').pop())
    if (level === 0) continue
    assert.deepEqual(V.scareChecks('Anchorite', level), { fear: Number(fear), horror: Number(horror), madness: Number(madness) }, `nível ${levels}`)
  }
})

// --- Gypsy (R3) ---------------------------------------------------------------------------

function gypsy(over: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    characterClass: 'Gypsy',
    level: 5,
    race: 'Human',
    abilities: { strength: 10, dexterity: 16, constitution: 13, intelligence: 13, wisdom: 13, charisma: 16 },
    ...over,
  } as unknown as PlayerCharacter
}

test('Gypsy: avisos de atributos e raça (agora Half-Vistani também é aceita)', () => {
  assert.deepEqual(V.ravenloftWarnings(gypsy(), ['Ravenloft']), [])
  assert.deepEqual(V.ravenloftWarnings(gypsy({ race: 'Half-Elf' }), ['Ravenloft']), [])
  assert.deepEqual(V.ravenloftWarnings(gypsy({ race: 'Half-Vistani' }), ['Ravenloft']), [])
  const all = V.ravenloftWarnings(gypsy({ race: 'Dwarf', abilities: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 13, charisma: 14 } }), ['Ravenloft'])
  assert.deepEqual(all.length, 3)
  assert.match(all[0], /Gypsies need Constitution 13/)
  assert.match(all[1], /Gypsies need Charisma 15/)
  assert.match(all[2], /human, half-elf or Half-Vistani/)
  assert.equal(levelLimitWarning('Half-Elf', 'Gypsy', 15), null)
  assert.equal(levelLimitWarning('Half-Vistani', 'Gypsy', 20), null)
  assert.match(levelLimitWarning('Halfling', 'Gypsy', 1)!, /Domains of Dread/)
})

test('Gypsy: Rogue em dados de vida, THAC0, saves, XP, proficiências e perícias', () => {
  assert.equal(R.classGroup('Gypsy'), 'Rogue')
  assert.equal(R.hitDieType('Gypsy'), 'd6')
  assert.equal(R.isArcaneCaster('Gypsy'), true)
  assert.equal(R.hasSpellSheet('Gypsy'), true)
  for (let level = 1; level <= 20; level++) {
    const ctx = (cls: string) => ({ level, characterClass: cls, abilities })
    assert.deepEqual(R.resolveRule('thac0', ctx('Gypsy')), R.resolveRule('thac0', ctx('Thief')))
    assert.deepEqual(R.resolveRule('savingThrows', ctx('Gypsy')), R.resolveRule('savingThrows', ctx('Thief')))
    assert.equal(R.xpRequired(level, 'Gypsy'), R.xpRequired(level, 'Thief'))
    assert.equal(R.totalWeaponSlots('Gypsy', level), R.totalWeaponSlots('Thief', level))
  }
  assert.deepEqual(R.thievingSkillsFor('Gypsy'), R.allThievingSkills)
  assert.equal(R.thievingSeedTotal('Climb Walls', 'Gypsy', 'Human', 10), '60%')
  assert.deepEqual(S.primeRequisites.Gypsy, ['dexterity', 'charisma'])
})

test('Gypsy: magias da Tabela 104 (arcanas, só adivinhação), Lore e faca', () => {
  const slots = (level: number) => R.computedSpellSlotAllotments({ characterClass: 'Gypsy', level, abilities })
  assert.deepEqual(slots(1), [{ caster: 'arcane', level: 1, count: 1 }])
  assert.deepEqual(
    slots(19).map((a) => a.count),
    [3, 3, 2, 1],
  )
  assert.equal(V.isGypsySpell(['Divination']), true)
  assert.equal(V.isGypsySpell(['Evocation']), false)
  assert.equal(V.gypsyKnownSpellsOnly({ characterClass: 'Gypsy', level: 3 }), true)
  assert.equal(V.gypsyLore(12), 60)
  assert.equal(V.gypsyLore(25), 100)
  assert.equal(V.gypsyCanSpecialize('Knife'), true)
  assert.equal(V.gypsyCanSpecialize('Knife, buckle'), true)
  assert.equal(V.gypsyCanSpecialize('Dagger'), false)
  assert.deepEqual(V.scareChecks('Gypsy', 11), { fear: 9, horror: 10, madness: 13 })
})

test('dados reais: o Gypsy do código bate com o Domains of Dread no rules.json', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const rules = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8')) as { id: string; tables: { title: string; rows: string[][] }[] }[]
  const table = (ruleID: string, title: string) => rules.find((r) => r.id === ruleID)!.tables.find((t) => t.title === title)!
  const number = (text: string) => Number(text.replace(/,/g, ''))
  // XP, THAC0 e proficiências da progressão do Gypsy.
  table('dod_ch00_gypsy', 'Gypsy Progression').rows.forEach((row, i) => {
    const level = i + 1
    assert.equal(R.xpRequired(level, 'Gypsy'), number(row[1]), `XP do nível ${level}`)
    assert.deepEqual(R.resolveRule('thac0', { level, characterClass: 'Gypsy', abilities }), number(row[3]), `THAC0 do nível ${level}`)
    assert.equal(R.totalWeaponSlots('Gypsy', level), number(row[4]), `slots de arma do nível ${level}`)
  })
  // Tabela 104: magias por faixa de nível.
  for (const row of table('dod_ch00_gypsy', 'Table 104: Gypsy Spell Progression').rows) {
    const level = Number(row[0].split('-')[0].replace('+', ''))
    const book = row.slice(1).map((cell) => (cell === '—' ? 0 : Number(cell))).filter((n) => n > 0)
    assert.deepEqual(R.gypsySpellProgression(level), book, `magias do nível ${row[0]}`)
  }
  // Tabela 95: testes de medo.
  for (const [levels, fear, horror, madness] of table('dod_ch00_gypsy', 'Table 95: Gypsy Fear, Horror and Madness Checks').rows) {
    const level = Number(levels.split('-').pop())
    if (level === 0) continue
    assert.deepEqual(V.scareChecks('Gypsy', level), { fear: Number(fear), horror: Number(horror), madness: Number(madness) }, `nível ${levels}`)
  }
  // Tabela 97: bases das perícias = as do ladrão do PHB.
  for (const [skill, score] of table('dod_ch00_gypsy_thieving_skills', 'Table 97: Thieving Skill Base Scores').rows) {
    const name = skill === 'Remove Traps' ? 'Find/Remove Traps' : skill
    assert.equal(R.thievingBaseScore(name, 'Gypsy'), number(score.replace('%', '')), skill)
  }
})

// --- Kits de Ravenloft (Denizens of Dread) -------------------------------------------------

test('kits de Ravenloft: sempre na lista; aviso (não bloqueio) sem o cenário na campanha; as classes certas', async () => {
  const c = { characterClass: 'Gypsy' as const, level: 3, wizardSchool: null, race: 'Human' }
  const kit = { name: 'Danseur', classEligibility: { classGroup: 'Rogue' }, setting: 'Ravenloft' }
  assert.deepEqual(M.kitWarnings(kit, c, null), ['This kit is from the Ravenloft setting, and this campaign does not have it on.'])
  assert.deepEqual(M.kitWarnings(kit, c, ['Dark Sun']), ['This kit is from the Ravenloft setting, and this campaign does not have it on.'])
  assert.deepEqual(M.kitWarnings(kit, c, ['Ravenloft']), [])
  // Sem campanha em mente (campaignSettings ausente): sem esse aviso.
  assert.deepEqual(M.kitWarnings(kit, c), [])
  assert.deepEqual(M.kitWarnings({ ...kit, setting: null }, c, null), [])
  const { kitsAllowedFor } = await import('../src/rules/raceKit.ts')
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const kits = JSON.parse(readFileSync(join(source, 'kits.json'), 'utf8')) as {
    name: string
    setting?: string | null
    classEligibility: { classGroup: string; subclass: string; allowedClasses: string[] }
    mechanics: { proficiencies: { bonus: string[] } }
  }[]
  const ravenloft = kits.filter((k) => k.setting === 'Ravenloft')
  assert.equal(ravenloft.length, 6)
  const names = (cls: string) => kitsAllowedFor(ravenloft, cls).map((k) => k.name).sort()
  assert.deepEqual(names('Gypsy'), ['Danseur', 'Investigator - Ravenloft', 'Psychologue', 'Stalker - Ravenloft'])
  assert.deepEqual(names('Anchorite'), ['Investigator - Ravenloft', 'Psychologue', 'Stalker - Ravenloft', 'Warder'])
  // As proficiências bônus existem no compêndio (a ficha as acrescenta pelo nome).
  const proficiencies = JSON.parse(readFileSync(join(source, 'proficiencies.json'), 'utf8')) as { name: string }[] | Record<string, { name: string }[]>
  const list = Array.isArray(proficiencies) ? proficiencies : Object.values(proficiencies).flat()
  const known = new Set(list.map((p) => p.name))
  for (const k of ravenloft) for (const b of k.mechanics.proficiencies.bonus) assert.ok(known.has(b), `${k.name}: ${b}`)
})
