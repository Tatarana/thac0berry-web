// Paridade das regras TypeScript (src/rules/rules.ts) com o app iPad: compara
// cada função com os valores que o próprio código Swift calculou
// (thac0berry-data/fixtures/rules/rules-fixtures.json, gerado no CI do iPad).
// Roda com `npm test` (node --test, sem dependência).
//
// Origem do arquivo: $DATA_DIR/../fixtures/rules ou ../thac0berry-data/fixtures/rules.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import type { AbilityScores } from '../src/types/library.ts'
import * as R from '../src/rules/rules.ts'

const root = resolve(import.meta.dirname, '..')
const dataDir = resolve(process.env.DATA_DIR ?? join(root, '..', 'thac0berry-data', 'data'))
const fixtures = JSON.parse(readFileSync(join(dataDir, '..', 'fixtures', 'rules', 'rules-fixtures.json'), 'utf8'))

const classes = Object.keys(fixtures.classes)
const levels = Array.from({ length: 22 }, (_, i) => i)
const scores = Array.from({ length: 25 }, (_, i) => i + 1)

/** nil do Swift vira null no JSON; campo opcional ausente no TS é o mesmo que null. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, clean(v)]),
    )
  }
  return value
}

/** Junta as diferenças e falha mostrando as primeiras, em vez de parar na primeira. */
function compare(label: string, pairs: Iterable<[string, unknown, unknown]>) {
  const diffs: string[] = []
  let count = 0
  for (const [where, actual, expected] of pairs) {
    count++
    try {
      assert.deepStrictEqual(clean(actual), clean(expected))
    } catch {
      diffs.push(`${where}: TS=${JSON.stringify(actual)} Swift=${JSON.stringify(expected)}`)
    }
  }
  assert.ok(count > 0, `${label}: nenhum caso comparado`)
  assert.equal(diffs.length, 0, `${label}: ${diffs.length} de ${count} diferentes\n${diffs.slice(0, 15).join('\n')}`)
}

const base = (): AbilityScores => ({ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 })

test('tabelas de atributo (1 a 25)', () => {
  compare('abilityDetails', function* () {
    for (const key of R.abilityDetailKeys) {
      const ability = (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).find((a) =>
        key.startsWith(a),
      )!
      for (const score of scores) {
        yield [`${key} ${score}`, R.abilityDetail(key, { ...base(), [ability]: score }), fixtures.abilityDetails[key][score]]
      }
    }
  }())
  assert.deepEqual(R.abilityDetailKeys.toSorted(), Object.keys(fixtures.abilityDetails).toSorted())
})

test('força excepcional (18/01 a 18/00)', () => {
  compare('strengthExceptional', function* () {
    for (const key of Object.keys(fixtures.strengthExceptional)) {
      for (let pct = 1; pct <= 100; pct++) {
        const value = R.abilityDetail(key as R.AbilityDetailKey, { ...base(), strength: 18, exceptionalStrength: pct })
        yield [`${key} 18/${pct}`, value, fixtures.strengthExceptional[key][pct]]
      }
    }
  }())
})

test('por classe e nível: THAC0, saves, slots, XP, backstab, slots de arma', () => {
  compare('byClassLevel', function* () {
    for (const cls of classes) {
      for (const level of levels) {
        const expected = fixtures.byClassLevel[cls][level]
        const ctx = { level, characterClass: cls, abilities: base() }
        for (const key of ['thac0', 'savingThrows', 'priestSpellSlots', 'wizardSpellSlots', 'bardSpellSlots'] as const) {
          yield [`${cls} ${level} ${key}`, R.resolveRule(key, ctx), expected[key]]
        }
        yield [`${cls} ${level} xpRequired`, R.xpRequired(level, cls), expected.xpRequired]
        yield [`${cls} ${level} xpNeededForNextLevel`, R.xpNeededForNextLevel(level, cls), expected.xpNeededForNextLevel]
        yield [`${cls} ${level} xpNote`, R.xpNote(cls, level), expected.xpNote]
        yield [`${cls} ${level} backstab`, R.backstabMultiplier(level), expected.backstabMultiplier]
        yield [`${cls} ${level} weaponSlots`, R.totalWeaponSlots(cls, level), expected.weaponSlots]
        for (const score of scores) {
          yield [`${cls} ${level} weaponSlots int ${score}`, R.totalWeaponSlots(cls, level, score), expected.weaponSlotsByIntelligence[score]]
        }
      }
    }
  }())
})

test('propriedades de cada classe e Level Changes', () => {
  compare('classes', function* () {
    for (const cls of classes) {
      const e = fixtures.classes[cls]
      yield [`${cls} proficiencyGroup`, R.classGroup(cls), e.proficiencyGroup]
      yield [`${cls} hitDieType`, R.hitDieType(cls), e.hitDieType]
      yield [`${cls} hasSpellSheet`, R.hasSpellSheet(cls), e.hasSpellSheet]
      yield [`${cls} isArcaneCaster`, R.isArcaneCaster(cls), e.isArcaneCaster]
      yield [`${cls} hasReferencePage`, R.hasReferencePage(cls), e.hasReferencePage]
      yield [`${cls} hasThievingSkills`, R.hasThievingSkills(cls), e.hasThievingSkills]
      yield [`${cls} recordSheetPageCount`, R.recordSheetPageCount(cls), e.recordSheetPageCount]
      yield [`${cls} proficiencyTableGroup`, R.proficiencyTableGroup(cls), e.proficiencyTableGroup]
      yield [`${cls} proficiencyRow`, R.proficiencyRow(cls), e.proficiencyRow]
      yield [`${cls} nonProficiencyPenalty`, R.nonProficiencyPenalty(cls), e.nonProficiencyPenalty]
      yield [`${cls} thievingSkills`, R.thievingSkillsFor(cls), e.thievingSkills]
      for (const skill of R.allThievingSkills) {
        yield [`${cls} base ${skill}`, R.thievingBaseScore(skill, cls), e.thievingBaseScores[skill]]
      }
      yield [`${cls} levelChanges`, R.levelChanges(cls, base()), e.levelChanges]
    }
  }())
})

test('progressão de magias (nível × atributo)', () => {
  compare('spellProgression', function* () {
    for (const level of levels) {
      for (const score of scores) {
        yield [`priest ${level}/${score}`, R.priestSpellProgression(level, score), fixtures.spellProgression.priest[level][score]]
        yield [`wizard ${level}/${score}`, R.wizardSpellProgression(level, score), fixtures.spellProgression.wizard[level][score]]
        yield [`bard ${level}/${score}`, R.bardSpellProgression(level, score), fixtures.spellProgression.bard[level][score]]
      }
    }
  }())
})

test('slots de magia da ficha (computedSpellSlotAllotments)', () => {
  const cases: [string, string, string | null][] = [
    ['Cleric', 'Cleric', null],
    ['Mage', 'Mage', null],
    ['Mage (specialist)', 'Mage', 'Abjuration'],
    ['Bard', 'Bard', null],
  ]
  compare('slotAllotments', function* () {
    for (const [label, cls, school] of cases) {
      for (const level of levels) {
        for (const score of scores) {
          const abilities = { ...base(), wisdom: score, intelligence: score }
          const actual = R.computedSpellSlotAllotments({ characterClass: cls, level, abilities, wizardSchool: school })
          yield [`${label} ${level}/${score}`, actual, fixtures.slotAllotments[label][level][score]]
        }
      }
    }
  }())
})

test('perícias de ladrão: Destreza e raça', () => {
  compare('thieving', function* () {
    for (const score of scores) {
      for (const skill of R.allThievingSkills) {
        yield [`dex ${score} ${skill}`, R.dexterityAdjustment(skill, score), fixtures.thieving.dexterityAdjustment[score][skill]]
      }
    }
    for (const race of Object.keys(fixtures.thieving.racialAdjustment)) {
      for (const skill of R.allThievingSkills) {
        yield [`race "${race}" ${skill}`, R.racialAdjustment(skill, race), fixtures.thieving.racialAdjustment[race][skill]]
      }
    }
  }())
  assert.deepEqual(R.allThievingSkills, fixtures.thieving.allSkills)
})

test('Half-Elf usa a linha de Half-Elf, não a de Elf (correção em relação ao iPad)', () => {
  const table = fixtures.tables['ThievingSkillsTable.racialAdjustments']['Half-Elf']
  for (const skill of R.allThievingSkills) assert.equal(R.racialAdjustment(skill, 'Half-Elf'), table[skill] ?? 0, skill)
})

test('Sabedoria e Inteligência', () => {
  compare('wisdom/intelligence', function* () {
    for (const score of scores) {
      yield [`wis ${score} bonusSpells`, R.bonusSpells(score), fixtures.wisdom[score].bonusSpells]
      yield [`wis ${score} bonusSpellTotals`, R.bonusSpellTotals(score), fixtures.wisdom[score].bonusSpellTotals]
      yield [`int ${score} maxSpellLevelInt`, R.maxSpellLevelInt(score), fixtures.intelligence[score].maxSpellLevelInt]
      yield [`int ${score} bonusLanguages`, R.bonusLanguages(score), fixtures.intelligence[score].bonusLanguages]
    }
  }())
})

test('nomes de classe antigos em português (CharacterClass.init(from:))', () => {
  assert.equal(R.canonicalClass('Clérigo'), 'Cleric')
  assert.equal(R.canonicalClass('Ladino'), 'Thief')
  assert.equal(R.canonicalClass('Desconhecida'), 'Fighter')
  assert.equal(R.thac0ForLevel('Mago', 1), R.thac0ForLevel('Mage', 1))
})
