// Regras de jogo de AD&D 2e, portadas do app iPad (Store/RuleEngine,
// Models/Character.swift, ExperienceProgressionTable, ThievingSkillsTable,
// ProficiencySlotsTable). Só funções puras: não leem nem gravam a ficha.
//
// Dados: as tabelas vêm do próprio código Swift (seção `tables` de
// thac0berry-data/fixtures/rules/rules-fixtures.json), e THAC0, saves e XP dos
// JSON de data/. scripts/build-data.mjs junta tudo em generated/rules-data.json.
// Paridade: tests/rules.test.ts compara cada função com os valores que o
// Swift calculou (o mesmo rules-fixtures.json). Mudou algo aqui, rode
// `npm test`.
//
// Única diferença intencional: racialAdjustment testa Half-Elf antes de Elf
// (no iPad, a ordem depende de um dicionário e muda a cada execução; bug
// registrado no TODO.md de lá).

import { normalize } from '../lib/search.ts'
import type { AbilityScores, CharacterClass, LevelChangesTable, SavingThrows } from '../types/library.ts'
import data from './generated/rules-data.json' with { type: 'json' }

// --- Tipos dos dados -----------------------------------------------------------

type Text = Record<string, string>
interface ProficiencyRow {
  group: string
  initialWeapon: string
  levelsWeapon: string
  penalty: string
  initialNonweapon: string
  levelsNonweapon: string
}
interface SaveValues {
  paralyzationPoisonDeath: number
  rodStaffWand: number
  petrificationPolymorph: number
  breathWeapon: number
  spell: number
}
interface RulesData {
  tables: {
    'StrengthTable.byScore': Record<string, Text>
    'StrengthTable.byExceptionalUpperBound': { upperBound: number; row: Text }[]
    'DexterityTable.byScore': Record<string, Text>
    'ConstitutionTable.byScore': Record<string, Text>
    'IntelligenceTable.byScore': Record<string, Text>
    'WisdomTable.byScore': Record<string, Text>
    'CharismaTable.byScore': Record<string, Text>
    'PriestTables.spellProgressionRows': (number | null)[][]
    'PriestTables.wisdomRequirementByCircle': Record<string, number>
    'PriestTables.turningUndeadLevels': string[]
    'PriestTables.turningUndeadRows': { type: string; results: string[] }[]
    'PriestTables.turningUndeadFootnotes': string[]
    'PriestTables.wisdomRows': { score: number; magDef: string; bonus: string; failure: string; immunity: string }[]
    'WizardTables.spellProgressionRows': (number | null)[][]
    'BardTables.spellProgressionRows': (number | null)[][]
    'ThievingSkillsTable.thiefBaseScores': Record<string, number>
    'ThievingSkillsTable.ninjaBaseScores': Record<string, number>
    'ThievingSkillsTable.bardBaseScores': Record<string, number>
    'ThievingSkillsTable.racialAdjustments': Record<string, Record<string, number>>
    'ThievingSkillsTable.dexterityAdjustments': Record<string, Record<string, number>>
    'ThievingSkillsTable.thiefArmorColumns': string[]
    'ThievingSkillsTable.thiefArmorAdjustments': Record<string, number[]>
    'ThievingSkillsTable.ninjaArmorColumns': string[]
    'ThievingSkillsTable.ninjaArmorAdjustments': Record<string, number[]>
    'ProficiencySlotsTable.rows': ProficiencyRow[]
  }
  thac0: { sourceRuleID: string; groups: Record<string, number[]> }
  savingThrows: { sourceRuleID: string; groups: Record<string, { maxLevel: number | null; values: SaveValues }[]> }
  experience: { thresholds: Record<string, number[]>; classNotes?: Record<string, { fromLevel: number; text: string }> | null }
}

export const rulesData = data as unknown as RulesData
const T = rulesData.tables

/** Int(texto) do Swift: só dígitos, com sinal opcional; senão null. */
function swiftInt(text: string | undefined): number | null {
  return text !== undefined && /^[+-]?\d+$/.test(text) ? Number(text) : null
}

// --- Classes -----------------------------------------------------------------------

export type CanonicalClass = 'Fighter' | 'Paladin' | 'Ranger' | 'Mage' | 'Cleric' | 'Druid' | 'Thief' | 'Bard' | 'Ninja'

const legacyClassNames: Record<string, CanonicalClass> = {
  Guerreiro: 'Fighter',
  Paladino: 'Paladin',
  Patrulheiro: 'Ranger',
  Mago: 'Mage',
  Clérigo: 'Cleric',
  Druida: 'Druid',
  Ladino: 'Thief',
  Bardo: 'Bard',
}
const canonicalClasses: CanonicalClass[] = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja']

/** Como o CharacterClass.init(from:) do iPad: nome antigo em português vira o atual; desconhecido vira Fighter. */
export function canonicalClass(value: CharacterClass | string): CanonicalClass {
  if ((canonicalClasses as string[]).includes(value)) return value as CanonicalClass
  return legacyClassNames[value] ?? 'Fighter'
}

export type ClassGroup = 'Warrior' | 'Wizard' | 'Priest' | 'Rogue'

/** CoreClassGroup / CharacterClass.proficiencyGroup. */
export function classGroup(value: CharacterClass | string): ClassGroup {
  switch (canonicalClass(value)) {
    case 'Fighter':
    case 'Paladin':
    case 'Ranger':
      return 'Warrior'
    case 'Mage':
      return 'Wizard'
    case 'Cleric':
    case 'Druid':
      return 'Priest'
    default:
      return 'Rogue'
  }
}

export function hitDieType(value: CharacterClass | string): string {
  return { Warrior: 'd10', Wizard: 'd4', Priest: 'd8', Rogue: 'd6' }[classGroup(value)]
}

export function hasSpellSheet(value: CharacterClass | string): boolean {
  return ['Cleric', 'Mage', 'Bard'].includes(canonicalClass(value))
}

export function isArcaneCaster(value: CharacterClass | string): boolean {
  return ['Mage', 'Bard'].includes(canonicalClass(value))
}

export function hasThievingSkills(value: CharacterClass | string): boolean {
  return classGroup(value) === 'Rogue'
}

export function hasReferencePage(value: CharacterClass | string): boolean {
  return hasSpellSheet(value) || classGroup(value) === 'Warrior' || classGroup(value) === 'Rogue'
}

export function recordSheetPageCount(value: CharacterClass | string): number {
  return hasReferencePage(value) ? 4 : 3
}

// --- Atributos (Tabelas 1 a 6) -------------------------------------------------------

export function strengthRow(score: number, exceptionalPercentile: number | null | undefined): Text | null {
  if (score === 18 && exceptionalPercentile != null && exceptionalPercentile > 0) {
    const clamped = Math.max(1, Math.min(exceptionalPercentile, 100))
    for (const entry of T['StrengthTable.byExceptionalUpperBound']) {
      if (clamped <= entry.upperBound) return entry.row
    }
  }
  return T['StrengthTable.byScore'][score] ?? null
}

/** Tabela 4: nível máximo de magia como número ("9th" → 9; fora da tabela → 0). */
export function maxSpellLevelInt(intelligence: number): number {
  const text = T['IntelligenceTable.byScore'][intelligence]?.maxSpellLevel
  if (text === undefined) return 0
  return swiftInt(text.replace(/\D/g, '')) ?? 0
}

/** Tabela 4: idiomas extras como número. */
export function bonusLanguages(intelligence: number): number {
  return swiftInt(T['IntelligenceTable.byScore'][intelligence]?.languages) ?? 0
}

// Tabela 5, coluna "Bonus Spells", ainda não acumulada (WisdomTable.bonusSpellsByScore,
// privada no Swift; os resultados acumulados são conferidos pelo teste).
const bonusSpellsByScore: Record<number, number[]> = {
  13: [1], 14: [1], 15: [2], 16: [2], 17: [3], 18: [4],
  19: [1, 3], 20: [2, 4], 21: [3, 5], 22: [4, 5], 23: [1, 6], 24: [5, 6], 25: [6, 7],
}

/** Magias bônus de Sabedoria acumuladas por círculo; null abaixo de 9 ou sem bônus. */
export function bonusSpellTotals(wisdom: number): Record<number, number> | null {
  if (wisdom < 9) return null
  const totals: Record<number, number> = {}
  for (let s = 1; s <= wisdom; s++) {
    for (const circle of bonusSpellsByScore[s] ?? []) totals[circle] = (totals[circle] ?? 0) + 1
  }
  return Object.keys(totals).length === 0 ? null : totals
}

/** "+N / +N / ..." (posição = círculo). */
export function bonusSpells(wisdom: number): string | null {
  const totals = bonusSpellTotals(wisdom)
  if (!totals) return null
  const maxCircle = Math.max(...Object.keys(totals).map(Number))
  return Array.from({ length: maxCircle }, (_, i) => `+${totals[i + 1] ?? 0}`).join(' / ')
}

export type AbilityDetailKey =
  | 'strengthHit' | 'strengthDamage' | 'strengthWeight' | 'strengthMaxPress' | 'strengthDoors' | 'strengthBars'
  | 'dexterityReaction' | 'dexterityMissile' | 'dexterityDefense'
  | 'constitutionHP' | 'constitutionShock' | 'constitutionResurrection' | 'constitutionPoison'
  | 'intelligenceLanguages' | 'intelligenceMaxLevel' | 'intelligenceLearn' | 'intelligenceMaxPerLevel'
  | 'wisdomDefense' | 'wisdomFailure' | 'wisdomBonusSpells'
  | 'charismaHenchmen' | 'charismaLoyalty' | 'charismaReaction'

const abilityLookups: Record<AbilityDetailKey, (a: AbilityScores) => string | null | undefined> = {
  strengthHit: (a) => strengthRow(a.strength, a.exceptionalStrength)?.hit,
  strengthDamage: (a) => strengthRow(a.strength, a.exceptionalStrength)?.dmg,
  strengthWeight: (a) => strengthRow(a.strength, a.exceptionalStrength)?.weight,
  strengthMaxPress: (a) => strengthRow(a.strength, a.exceptionalStrength)?.maxPress,
  strengthDoors: (a) => strengthRow(a.strength, a.exceptionalStrength)?.doors,
  strengthBars: (a) => strengthRow(a.strength, a.exceptionalStrength)?.bars,
  dexterityReaction: (a) => T['DexterityTable.byScore'][a.dexterity]?.reaction,
  dexterityMissile: (a) => T['DexterityTable.byScore'][a.dexterity]?.missile,
  dexterityDefense: (a) => T['DexterityTable.byScore'][a.dexterity]?.defense,
  constitutionHP: (a) => T['ConstitutionTable.byScore'][a.constitution]?.hpAdjustment,
  constitutionShock: (a) => T['ConstitutionTable.byScore'][a.constitution]?.systemShock,
  constitutionResurrection: (a) => T['ConstitutionTable.byScore'][a.constitution]?.resurrectionSurvival,
  constitutionPoison: (a) => T['ConstitutionTable.byScore'][a.constitution]?.poisonSave,
  intelligenceLanguages: (a) => T['IntelligenceTable.byScore'][a.intelligence]?.languages,
  intelligenceMaxLevel: (a) => T['IntelligenceTable.byScore'][a.intelligence]?.maxSpellLevel,
  intelligenceLearn: (a) => T['IntelligenceTable.byScore'][a.intelligence]?.learnChance,
  intelligenceMaxPerLevel: (a) => T['IntelligenceTable.byScore'][a.intelligence]?.maxSpellsPerLevel,
  wisdomDefense: (a) => T['WisdomTable.byScore'][a.wisdom]?.magicDefense,
  wisdomFailure: (a) => T['WisdomTable.byScore'][a.wisdom]?.spellFailure,
  wisdomBonusSpells: (a) => bonusSpells(a.wisdom),
  charismaHenchmen: (a) => T['CharismaTable.byScore'][a.charisma]?.maxHenchmen,
  charismaLoyalty: (a) => T['CharismaTable.byScore'][a.charisma]?.loyaltyBase,
  charismaReaction: (a) => T['CharismaTable.byScore'][a.charisma]?.reaction,
}

export const abilityDetailKeys = Object.keys(abilityLookups) as AbilityDetailKey[]

/** Valor de um detalhe de atributo (AbilityDetailProvider); null quando a tabela não tem. */
export function abilityDetail(key: AbilityDetailKey, abilities: AbilityScores): string | null {
  const text = abilityLookups[key](abilities)
  return text ? text : null
}

// --- Por nível ---------------------------------------------------------------------

export function thac0ForLevel(value: CharacterClass | string, level: number): number | null {
  const row = rulesData.thac0.groups[classGroup(value)]
  const index = level - 1
  if (!row || index < 0 || index >= row.length) return null
  return row[index]
}

export function savingThrowsForLevel(value: CharacterClass | string, level: number): SavingThrows | null {
  const rows = rulesData.savingThrows.groups[classGroup(value)]
  if (!rows || level < 1) return null
  const row = rows.find((r) => level <= (r.maxLevel ?? Number.MAX_SAFE_INTEGER))
  return row ? { ...row.values } : null
}

function progressionRow(rows: (number | null)[][], level: number): (number | null)[] {
  return rows[Math.max(0, Math.min(level, rows.length) - 1)]
}

/** Tabela 24 + bônus de Sabedoria, com a exigência de Sabedoria dos círculos 6 e 7. */
export function priestSpellProgression(level: number, wisdom: number): number[] {
  const bonus = bonusSpellTotals(wisdom) ?? {}
  return progressionRow(T['PriestTables.spellProgressionRows'], level).map((count, index) => {
    const circle = index + 1
    if (count === null) return 0
    const required = T['PriestTables.wisdomRequirementByCircle'][circle]
    if (required !== undefined && wisdom < required) return 0
    return count + (bonus[circle] ?? 0)
  })
}

function arcaneProgression(rows: (number | null)[][], level: number, intelligence: number): number[] {
  const cap = maxSpellLevelInt(intelligence)
  return progressionRow(rows, level).map((count, index) => (count === null || index + 1 > cap ? 0 : count))
}

export function wizardSpellProgression(level: number, intelligence: number): number[] {
  return arcaneProgression(T['WizardTables.spellProgressionRows'], level, intelligence)
}

export function bardSpellProgression(level: number, intelligence: number): number[] {
  return arcaneProgression(T['BardTables.spellProgressionRows'], level, intelligence)
}

export interface RuleContext {
  level: number
  characterClass: CharacterClass | string
  abilities: AbilityScores
}

export type RuleKey = 'thac0' | 'savingThrows' | 'priestSpellSlots' | 'wizardSpellSlots' | 'bardSpellSlots' | AbilityDetailKey
export type RuleValue = number | number[] | SavingThrows | string

const anySlot = (counts: number[]) => (counts.some((c) => c > 0) ? counts : null)

/** RulesetRegistry.resolve do iPad (só o módulo Core). */
export function resolveRule(key: RuleKey, ctx: RuleContext): RuleValue | null {
  const cls = canonicalClass(ctx.characterClass)
  switch (key) {
    case 'thac0':
      return thac0ForLevel(cls, ctx.level)
    case 'savingThrows':
      return savingThrowsForLevel(cls, ctx.level)
    case 'priestSpellSlots':
      return cls === 'Cleric' ? anySlot(priestSpellProgression(ctx.level, ctx.abilities.wisdom)) : null
    case 'wizardSpellSlots':
      return cls === 'Mage' ? anySlot(wizardSpellProgression(ctx.level, ctx.abilities.intelligence)) : null
    case 'bardSpellSlots':
      return cls === 'Bard' ? anySlot(bardSpellProgression(ctx.level, ctx.abilities.intelligence)) : null
    default:
      return abilityDetail(key, ctx.abilities)
  }
}

// --- Experiência -------------------------------------------------------------------

export function xpRequired(level: number, value: CharacterClass | string): number | null {
  const row = rulesData.experience.thresholds[canonicalClass(value)]
  if (level < 1 || level > 20 || !row || row.length < level) return null
  return row[level - 1]
}

/** "XPs Needed for Next Level", com separador de milhar como no iPad ("27,500"). */
export function xpNeededForNextLevel(currentLevel: number, value: CharacterClass | string): string | null {
  const xp = xpRequired(currentLevel + 1, value)
  return xp === null ? null : xp.toLocaleString('en-US')
}

export function xpNote(value: CharacterClass | string, level: number): string | null {
  const note = rulesData.experience.classNotes?.[canonicalClass(value)]
  return note && level >= note.fromLevel ? note.text : null
}

// --- Proficiências -----------------------------------------------------------------

/** Linha da tabela de proficiências usada pela classe (Fighter, Thief, Wizard, Cleric). */
export function proficiencyTableGroup(value: CharacterClass | string): string {
  return { Warrior: 'Fighter', Rogue: 'Thief', Wizard: 'Wizard', Priest: 'Cleric' }[classGroup(value)]
}

export function proficiencyRow(value: CharacterClass | string): ProficiencyRow | null {
  return T['ProficiencySlotsTable.rows'].find((r) => r.group === proficiencyTableGroup(value)) ?? null
}

export function nonProficiencyPenalty(value: CharacterClass | string): string {
  return proficiencyRow(value)?.penalty ?? '-2'
}

/** Slots de proficiência de arma (com o bônus opcional de Inteligência). */
export function totalWeaponSlots(value: CharacterClass | string, level: number, intelligence?: number): number {
  const row = proficiencyRow(value)
  if (!row) return 0
  const initial = swiftInt(row.initialWeapon) ?? 0
  const perLevels = swiftInt(row.levelsWeapon) ?? 0
  const fromLevels = perLevels > 0 ? Math.trunc(level / perLevels) : 0
  const intBonus = intelligence === undefined ? 0 : bonusLanguages(intelligence)
  return initial + fromLevels + intBonus
}

// --- Perícias de ladrão --------------------------------------------------------------

export const allThievingSkills = [
  'Pick Pockets', 'Open Locks', 'Find/Remove Traps', 'Move Silently',
  'Hide in Shadows', 'Detect Noise', 'Climb Walls', 'Read Languages',
]

export function thievingSkillsFor(value: CharacterClass | string): string[] {
  const cls = canonicalClass(value)
  if (cls === 'Bard') return ['Climb Walls', 'Detect Noise', 'Pick Pockets', 'Read Languages']
  if (cls === 'Thief' || cls === 'Ninja') return [...allThievingSkills]
  return []
}

export function thievingBaseScore(skill: string, value: CharacterClass | string): number {
  const cls = canonicalClass(value)
  const table =
    cls === 'Bard'
      ? T['ThievingSkillsTable.bardBaseScores']
      : cls === 'Ninja'
        ? T['ThievingSkillsTable.ninjaBaseScores']
        : T['ThievingSkillsTable.thiefBaseScores']
  return table[skill] ?? 0
}

/**
 * Ajuste racial (Tabela 27). O campo Race é texto livre ("Hill Dwarf"), então
 * casa por trecho do nome. Testa do nome mais longo para o mais curto, para
 * "Half-Elf" não cair em "Elf" (diferença intencional do iPad, ver topo).
 */
export function racialAdjustment(skill: string, race: string): number {
  const target = normalize(race)
  if (target === '') return 0
  const table = T['ThievingSkillsTable.racialAdjustments']
  const keys = Object.keys(table).sort((a, b) => normalize(b).length - normalize(a).length)
  for (const key of keys) {
    if (target.includes(normalize(key))) return table[key][skill] ?? 0
  }
  return 0
}

export function dexterityAdjustment(skill: string, dexterity: number): number {
  const clamped = Math.max(9, Math.min(19, dexterity))
  return T['ThievingSkillsTable.dexterityAdjustments'][clamped]?.[skill] ?? 0
}

export function backstabMultiplier(level: number): string {
  if (level < 1) return '—'
  if (level <= 4) return 'x2'
  if (level <= 8) return 'x3'
  if (level <= 12) return 'x4'
  return 'x5'
}

/** Valor inicial de uma perícia (base + raça + Destreza), como "35%". */
export function thievingSeedTotal(skill: string, value: CharacterClass | string, race: string, dexterity: number): string {
  return `${thievingBaseScore(skill, value) + racialAdjustment(skill, race) + dexterityAdjustment(skill, dexterity)}%`
}

// --- Slots de magia da ficha -----------------------------------------------------------

export interface SlotAllotment {
  caster: 'arcane' | 'divine'
  level: number
  count: number
}

/** PlayerCharacter.computedSpellSlotAllotments: slots por círculo que a ficha deveria ter. */
export function computedSpellSlotAllotments(c: {
  characterClass: CharacterClass | string
  level: number
  abilities: AbilityScores
  wizardSchool?: string | null
}): SlotAllotment[] {
  const toAllotments = (counts: number[], caster: SlotAllotment['caster'], bonus = 0) =>
    counts.flatMap((count, index) => (count > 0 ? [{ caster, level: index + 1, count: count + bonus }] : []))
  switch (canonicalClass(c.characterClass)) {
    case 'Cleric':
      return toAllotments(priestSpellProgression(c.level, c.abilities.wisdom), 'divine')
    case 'Mage':
      // Especialista: +1 slot em todo círculo que já tem magia (Tabela 22).
      return toAllotments(wizardSpellProgression(c.level, c.abilities.intelligence), 'arcane', c.wizardSchool ? 1 : 0)
    case 'Bard':
      return toAllotments(bardSpellProgression(c.level, c.abilities.intelligence), 'arcane')
    default:
      return []
  }
}

// --- Level Changes -------------------------------------------------------------------

function condense(levels: number[]): string {
  if (levels.length === 0) return ''
  const ranges: [number, number][] = []
  let start = levels[0]
  let end = levels[0]
  for (const level of levels.slice(1)) {
    if (level === end + 1) {
      end = level
    } else {
      ranges.push([start, end])
      start = level
      end = level
    }
  }
  ranges.push([start, end])
  return ranges.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')
}

function sameValue(a: RuleValue, b: RuleValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** ConsequenceEngine.levelChangeRow: em que níveis a regra muda (1 a 20). */
function levelChangeRow(key: 'thac0' | 'savingThrows', ctx: Omit<RuleContext, 'level'>, embedValue: boolean) {
  const points: { level: number; value: RuleValue; delta: number | null }[] = []
  let previous: RuleValue | null = null
  for (let level = 1; level <= 20; level++) {
    const value = resolveRule(key, { ...ctx, level })
    if (value === null) continue
    if (previous !== null && !sameValue(previous, value)) {
      const delta = typeof previous === 'number' && typeof value === 'number' ? value - previous : null
      points.push({ level, value, delta })
    }
    previous = value
  }
  if (points.length === 0) return null
  if (!embedValue) return { by: '', atLevels: condense(points.map((p) => p.level)) }
  return {
    by: points.map((p) => (p.delta === null ? '?' : p.delta > 0 ? `+${p.delta}` : `${p.delta}`)).join(', '),
    atLevels: points.map((p) => (typeof p.value === 'number' ? `${p.level} (→${p.value})` : `${p.level}`)).join(', '),
  }
}

/**
 * Tabela "Level Changes" que o iPad grava ao (re)calcular com força total
 * (ConsequenceEngine.refreshLevelChanges(force: true), a partir de uma tabela vazia).
 */
export function levelChanges(characterClass: CharacterClass | string, abilities: AbilityScores): LevelChangesTable {
  const empty = () => ({ by: '', atLevels: '' })
  const table: LevelChangesTable = {
    thac0: empty(),
    savingThrows: empty(),
    weaponProficiencies: empty(),
    nonWeaponProficiencies: empty(),
  }
  const ctx = { characterClass, abilities }
  const thac0 = levelChangeRow('thac0', ctx, true)
  if (thac0) table.thac0 = thac0
  const saves = levelChangeRow('savingThrows', ctx, false)
  if (saves) table.savingThrows = { by: table.savingThrows.by, atLevels: saves.atLevels }
  return table
}
