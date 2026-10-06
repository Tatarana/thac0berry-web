// Raça e kit, portados do iPad: Models/Race.swift (Tabela 7 do PHB:
// requisitos e ajustes de atributo, limites de nível, o que a raça grava na
// ficha) e o addBonusProficiencies do cabeçalho da ficha (item A1 do
// inventário de regras nas telas). Só funções puras.
//
// Fiel ao iPad: aplicar uma raça SOMA os ajustes de atributo, sem desfazer
// os da raça anterior (trocar de raça duas vezes acumula; registrado no
// TODO.md do iPad como provável bug).

import { normalize } from '../lib/search.ts'
import type { AbilityScores, CharacterClass, PlayerCharacter, ProficiencyEntry } from '../types/library.ts'
import { ensureConsequenceSnapshot } from './consequences.ts'
import { canonicalClass } from './rules.ts'

export type RaceName = 'Human' | 'Dwarf' | 'Elf' | 'Gnome' | 'Half-Elf' | 'Halfling'
export const races: RaceName[] = ['Human', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Halfling']

type AbilityName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Wisdom' | 'Charisma'
const abilityKey: Record<AbilityName, keyof AbilityScores> = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
}
const r = (min: number, max: number) => ({ min, max })

/** Tabela 7: faixa de cada atributo (Human não tem). */
const requirements: Partial<Record<RaceName, Record<AbilityName, { min: number; max: number }>>> = {
  Dwarf: { Strength: r(8, 18), Dexterity: r(3, 17), Constitution: r(11, 18), Intelligence: r(3, 18), Wisdom: r(3, 18), Charisma: r(3, 17) },
  Elf: { Strength: r(3, 18), Dexterity: r(6, 18), Constitution: r(7, 18), Intelligence: r(8, 18), Wisdom: r(3, 18), Charisma: r(8, 18) },
  Gnome: { Strength: r(6, 18), Dexterity: r(3, 18), Constitution: r(8, 18), Intelligence: r(6, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  'Half-Elf': { Strength: r(3, 18), Dexterity: r(6, 18), Constitution: r(6, 18), Intelligence: r(4, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  Halfling: { Strength: r(7, 18), Dexterity: r(7, 18), Constitution: r(10, 18), Intelligence: r(6, 18), Wisdom: r(3, 17), Charisma: r(3, 18) },
}

const adjustments: Record<RaceName, [AbilityName, number][]> = {
  Human: [],
  'Half-Elf': [],
  Dwarf: [['Constitution', 1], ['Charisma', -1]],
  Elf: [['Dexterity', 1], ['Constitution', -1]],
  Gnome: [['Intelligence', 1], ['Wisdom', -1]],
  Halfling: [['Dexterity', 1], ['Strength', -1]],
}

export function hasAbilityRequirements(race: RaceName) {
  return requirements[race] !== undefined
}

export function raceAdjustmentsText(race: RaceName): string {
  return adjustments[race].map(([name, delta]) => `${delta > 0 ? '+' : ''}${delta} ${name.slice(0, 3)}`).join(', ')
}

/** RaceOption.abilityWarnings: atributos fora da faixa da raça. */
export function abilityWarnings(race: RaceName, abilities: AbilityScores): string[] {
  const req = requirements[race]
  if (!req) return []
  return (Object.keys(abilityKey) as AbilityName[]).flatMap((name) => {
    const range = req[name]
    const score = abilities[abilityKey[name]] as number
    return score < range.min || score > range.max ? [`${name} ${score} is outside the ${range.min}–${range.max} range ${race} requires.`] : []
  })
}

type LevelLimit = 'unlimited' | 'forbidden' | number

/** RaceOption.levelLimit: Tabela 7, nível máximo da raça em cada classe. */
export function levelLimit(race: RaceName, characterClass: CharacterClass | string): LevelLimit {
  const cls = canonicalClass(characterClass)
  const table: Record<RaceName, Partial<Record<string, LevelLimit>>> = {
    Human: {},
    Dwarf: { Cleric: 10, Fighter: 15, Thief: 12, Ninja: 'unlimited' },
    Elf: { Cleric: 12, Fighter: 12, Mage: 15, Ranger: 15, Thief: 12 },
    Gnome: { Cleric: 9, Fighter: 11, Thief: 13 },
    'Half-Elf': { Bard: 'unlimited', Cleric: 14, Druid: 9, Fighter: 14, Mage: 12, Ranger: 16, Thief: 12 },
    Halfling: { Cleric: 8, Fighter: 9, Thief: 15, Ninja: 'unlimited' },
  }
  if (race === 'Human') return 'unlimited'
  return table[race][cls] ?? 'forbidden'
}

/** RaceOption.levelLimitWarning. */
export function levelLimitWarning(race: RaceName, characterClass: CharacterClass | string, level: number): string | null {
  const limit = levelLimit(race, characterClass)
  const cls = canonicalClass(characterClass)
  if (limit === 'unlimited') return null
  if (limit === 'forbidden') return `${race} cannot normally be a ${cls} (PHB Table 7).`
  return level > limit ? `${race} ${cls}s are normally limited to level ${limit} (PHB Table 7) — this character is already level ${level}.` : null
}

/** As duas juntas, como o RacePickerSheet mostra antes de confirmar. */
export function raceWarnings(race: RaceName, c: Pick<PlayerCharacter, 'abilities' | 'characterClass' | 'level'>): string[] {
  const warning = levelLimitWarning(race, c.characterClass, c.level)
  return [...abilityWarnings(race, c.abilities), ...(warning ? [warning] : [])]
}

const spellResistance: Partial<Record<RaceName, string>> = {
  Elf: '90% vs. sleep & charm',
  'Half-Elf': '30% vs. sleep & charm',
}

const baseMovement: Record<RaceName, string> = {
  Human: '12"',
  Elf: '12"',
  'Half-Elf': '12"',
  Dwarf: '6"',
  Gnome: '6"',
  Halfling: '6"',
}

const specialAbilities: Partial<Record<RaceName, string>> = {
  Dwarf:
    'Infravision 60 ft. Saving throw bonus vs. wands/staves/rods/spells and vs. poison (+1 per 3½ points of Constitution — see Saving Throws). 20% chance a non-class magic item malfunctions when used. +1 to hit orcs, half-orcs, goblins, hobgoblins; ogres/trolls/giants/titans suffer −4 to hit dwarves. Can detect grade/slope, new construction, shifting walls, stonework traps, and approximate depth underground.',
  Elf: "Infravision 60 ft. 90% resistance to sleep and charm-related spells. +1 to hit with bow (except crossbow) or short/long sword. Good chance to notice secret/concealed doors. Surprise bonus if unarmored in metal, alone or with elves/halflings, or 90+ ft from the party: −4 to opponents' surprise roll (−2 if opening a door).",
  Gnome:
    'Infravision 60 ft. Saving throw bonus vs. wands/staves/rods/spells (+1 per 3½ points of Constitution — see Saving Throws). 20% chance a non-class, non-illusionist magic item malfunctions when used. +1 to hit kobolds/goblins; gnolls/bugbears/ogres/trolls/giants/titans suffer −4 to hit gnomes. Can detect grade/slope, unsafe walls/ceilings/floors, and approximate depth/direction underground.',
  'Half-Elf': 'Infravision 60 ft. 30% resistance to sleep and charm-related spells. Good chance to notice secret/concealed doors, same as elves.',
  Halfling:
    "High resistance to magic and poison: saving throw bonus vs. wands/staves/rods/spells and vs. poison (+1 per point of Constitution — see Saving Throws). +1 to attack rolls with thrown weapons and slings. Surprise bonus if unarmored in metal, alone or with halflings/elves, or 90+ ft from the party: −4 to opponents' surprise roll (−2 if opening a door). Chance of infravision (60 ft or 30 ft) depending on lineage.",
}

/** RaceOption.match: o campo Race (texto livre) que bate exatamente com uma raça. */
export function matchRace(text: string): RaceName | null {
  const target = normalize(text)
  return target === '' ? null : (races.find((race) => normalize(race) === target) ?? null)
}

/**
 * RaceOption.apply: grava a raça, soma os ajustes de atributo (que, como
 * qualquer mudança de atributo, passam pelo motor de consequências), grava a
 * resistência a magia da raça (ou apaga, se ela não tem) e preenche as
 * habilidades raciais e o movimento base só se estiverem vazios.
 */
export function applyRace(c: PlayerCharacter, race: RaceName) {
  ensureConsequenceSnapshot(c)
  c.race = race
  const abilities = { ...c.abilities }
  for (const [name, delta] of adjustments[race]) (abilities[abilityKey[name]] as number) += delta
  c.abilities = abilities
  c.saves = { ...c.saves, spellResistance: spellResistance[race] ?? null }
  if (!c.racialAbilities && specialAbilities[race]) c.racialAbilities = specialAbilities[race]
  const movement = c.page2Movement ?? { base: '', jog: '', runX3: '', runX4: '', runX5: '', day: '' }
  if (movement.base === '') c.page2Movement = { ...movement, base: baseMovement[race] }
}

// --- Kit -----------------------------------------------------------------------------

export interface KitChoice {
  name: string
  classEligibility: { allowedClasses: string[] }
  mechanics: { proficiencies?: { bonus?: string[] | null } | null }
}

/** KitDatabase.kits(allowedFor:): kits da classe (Cleric também vê os de Specialty Priest). */
export function kitsAllowedFor<T extends KitChoice>(kits: T[], characterClass: CharacterClass | string): T[] {
  const cls = canonicalClass(characterClass)
  return kits.filter((k) => k.classEligibility.allowedClasses.includes(cls) || (cls === 'Cleric' && k.classEligibility.allowedClasses.includes('Specialty Priest')))
}

/**
 * addBonusProficiencies (A1): as proficiências bônus do kit entram na ficha,
 * casadas pelo nome com o compêndio; não repete o que já tem; ocupa primeiro
 * as linhas vazias.
 */
export function addKitBonusProficiencies(
  c: Pick<PlayerCharacter, 'proficiencies'>,
  bonusNames: string[],
  compendium: { id: string; name: string }[],
) {
  if (bonusNames.length === 0) return
  const entries: ProficiencyEntry[] = (c.proficiencies ?? []).map((e) => ({ ...e }))
  const existing = new Set(
    entries.flatMap((e) => {
      if (e.matchedProficiencyID) return [e.matchedProficiencyID]
      const n = normalize(e.name ?? '')
      return n === '' ? [] : [n]
    }),
  )
  let added = false
  for (const bonus of bonusNames) {
    const matched = compendium.find((p) => normalize(p.name) === normalize(bonus))
    const key = matched?.id ?? normalize(bonus)
    if (key === '' || existing.has(key)) continue
    const entry = { name: matched?.name ?? bonus, slots: 1, matchedProficiencyID: matched?.id ?? null }
    const blank = entries.findIndex((e) => (e.name ?? '').trim() === '' && !e.matchedProficiencyID)
    if (blank >= 0) entries[blank] = { ...entries[blank], ...entry }
    else entries.push({ id: crypto.randomUUID().toUpperCase(), checked: false, ...entry })
    existing.add(key)
    added = true
  }
  if (added) c.proficiencies = entries
}
