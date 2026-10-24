// Raça e kit, portados do iPad: Models/Race.swift (Tabela 7 do PHB:
// requisitos e ajustes de atributo, limites de nível, o que a raça grava na
// ficha) e o addBonusProficiencies do cabeçalho da ficha (item A1 do
// inventário de regras nas telas). Só funções puras.
//
// Fiel ao iPad: aplicar uma raça SOMA os ajustes de atributo, sem desfazer
// os da raça anterior (trocar de raça duas vezes acumula; registrado no
// TODO.md do iPad como provável bug).

import { normalize } from '../lib/search.ts'
import type { AbilityScores, CharacterClass, PlayerCharacter, ProficiencyEntry, ProficiencyGrant } from '../types/library.ts'
import { ensureConsequenceSnapshot } from './consequences.ts'
import { canonicalClass } from './rules.ts'

export type PhbRace = 'Human' | 'Dwarf' | 'Elf' | 'Gnome' | 'Half-Elf' | 'Halfling'
/**
 * Raças planares (The Planewalker's Handbook, tabelas "Planar Races"; backlog,
 * 2026-10-13): só em campanhas com o cenário Planescape. Bariaur e genasi têm
 * números diferentes por sexo e por elemento, então cada variação é uma raça.
 */
export type PlanarRace =
  | 'Aasimar'
  | 'Bariaur (male)'
  | 'Bariaur (female)'
  | 'Genasi (air)'
  | 'Genasi (earth)'
  | 'Genasi (fire)'
  | 'Genasi (water)'
  | 'Githzerai'
  | 'Modron'
  | 'Tiefling'
/**
 * Raças de Ravenloft (Domains of Dread; backlog, 2026-10-17): só o
 * Half-Vistani (glomorgo) — a raça pura vistani é proibida a jogadores, como
 * o livro diz.
 */
export type RavenloftRace = 'Half-Vistani'
export type RaceName = PhbRace | PlanarRace | RavenloftRace
export const races: PhbRace[] = ['Human', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Halfling']
export const planarRaces: PlanarRace[] = [
  'Aasimar',
  'Bariaur (male)',
  'Bariaur (female)',
  'Genasi (air)',
  'Genasi (earth)',
  'Genasi (fire)',
  'Genasi (water)',
  'Githzerai',
  'Modron',
  'Tiefling',
]
export const ravenloftRaces: RavenloftRace[] = ['Half-Vistani']
/** Todas as raças do seletor (decisão do usuário, 2026-10-17): sempre as mesmas, o cenário só avisa (não esconde) — ver `raceCampaignSetting`. */
export const allRaces: RaceName[] = [...races, ...planarRaces, ...ravenloftRaces]

export const isPlanarRace = (race: RaceName): race is PlanarRace => (planarRaces as RaceName[]).includes(race)
export const isRavenloftRace = (race: RaceName): race is RavenloftRace => (ravenloftRaces as RaceName[]).includes(race)

/** De onde vêm os números da raça (texto dos avisos). */
const raceSource = (race: RaceName) => (isPlanarRace(race) ? "The Planewalker's Handbook" : isRavenloftRace(race) ? 'Domains of Dread' : 'PHB Table 7')

/**
 * O cenário da campanha que esta raça pede (null = PHB, qualquer campanha).
 * Decisão do usuário (2026-10-17): nunca bloqueia a escolha — o mestre pode
 * misturar mundos —, só gera o aviso de `raceSettingWarning`.
 */
export function raceCampaignSetting(race: RaceName): string | null {
  if (isPlanarRace(race)) return 'Planescape'
  if (isRavenloftRace(race)) return 'Ravenloft'
  return null
}

/** "Half-Vistani is a Ravenloft race (Domains of Dread), and this campaign does not have the Ravenloft setting on."; null se bate ou a raça não pede cenário. */
export function raceSettingWarning(race: RaceName, campaignSettings: string[] | null | undefined): string | null {
  const setting = raceCampaignSetting(race)
  if (!setting || campaignSettings?.includes(setting)) return null
  return `${race} is a ${setting} race (${raceSource(race)}), and this campaign does not have the ${setting} setting on.`
}

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
  // PWH, "Planar Races: Ability Requirements".
  Aasimar: { Strength: r(8, 18), Dexterity: r(5, 18), Constitution: r(5, 18), Intelligence: r(11, 18), Wisdom: r(11, 18), Charisma: r(13, 18) },
  'Bariaur (male)': { Strength: r(10, 18), Dexterity: r(3, 18), Constitution: r(11, 18), Intelligence: r(3, 18), Wisdom: r(3, 17), Charisma: r(3, 18) },
  'Bariaur (female)': { Strength: r(3, 18), Dexterity: r(3, 17), Constitution: r(5, 18), Intelligence: r(9, 18), Wisdom: r(11, 18), Charisma: r(3, 18) },
  'Genasi (air)': { Strength: r(3, 18), Dexterity: r(9, 18), Constitution: r(3, 18), Intelligence: r(5, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  'Genasi (earth)': { Strength: r(9, 18), Dexterity: r(3, 18), Constitution: r(9, 18), Intelligence: r(3, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  'Genasi (fire)': { Strength: r(3, 18), Dexterity: r(5, 18), Constitution: r(3, 18), Intelligence: r(5, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  'Genasi (water)': { Strength: r(5, 18), Dexterity: r(5, 18), Constitution: r(5, 18), Intelligence: r(5, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  Githzerai: { Strength: r(3, 18), Dexterity: r(7, 18), Constitution: r(3, 18), Intelligence: r(9, 18), Wisdom: r(3, 18), Charisma: r(3, 18) },
  Modron: { Strength: r(9, 18), Dexterity: r(3, 18), Constitution: r(7, 18), Intelligence: r(3, 18), Wisdom: r(3, 18), Charisma: r(3, 17) },
  Tiefling: { Strength: r(3, 18), Dexterity: r(7, 18), Constitution: r(3, 18), Intelligence: r(9, 18), Wisdom: r(3, 18), Charisma: r(9, 18) },
}

const adjustments: Record<RaceName, [AbilityName, number][]> = {
  Human: [],
  'Half-Elf': [],
  Dwarf: [['Constitution', 1], ['Charisma', -1]],
  Elf: [['Dexterity', 1], ['Constitution', -1]],
  Gnome: [['Intelligence', 1], ['Wisdom', -1]],
  Halfling: [['Dexterity', 1], ['Strength', -1]],
  // PWH, "Planar Races: Ability Adjustments".
  Aasimar: [['Strength', 1], ['Constitution', -2], ['Wisdom', 1]],
  'Bariaur (male)': [['Strength', 1], ['Dexterity', -1], ['Constitution', 1], ['Wisdom', -1]],
  'Bariaur (female)': [['Strength', -1], ['Dexterity', -1], ['Intelligence', 1], ['Wisdom', 1]],
  'Genasi (air)': [['Dexterity', 1], ['Intelligence', 1], ['Wisdom', -1], ['Charisma', -1]],
  'Genasi (earth)': [['Strength', 1], ['Constitution', 1], ['Wisdom', -1], ['Charisma', -1]],
  'Genasi (fire)': [['Intelligence', 1], ['Charisma', -1]],
  'Genasi (water)': [['Constitution', 1], ['Charisma', -1]],
  Githzerai: [['Strength', -1], ['Dexterity', 1], ['Intelligence', 1], ['Wisdom', -1]],
  Modron: [['Dexterity', -1], ['Constitution', 1], ['Intelligence', 1], ['Charisma', -1]],
  Tiefling: [['Strength', -1], ['Intelligence', 1], ['Wisdom', -1], ['Charisma', 1]],
  // Domains of Dread, "Half-Vistani: Ability Scores": ajuste fixo, sem faixa mínima/máxima.
  'Half-Vistani': [['Intelligence', 1], ['Wisdom', 1], ['Charisma', -2]],
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
    return score < range.min || score > range.max ? [`${name} ${score} is outside the ${range.min}–${range.max} range ${race} requires (${raceSource(race)}).`] : []
  })
}

type LevelLimit = 'unlimited' | 'forbidden' | number

/** Nível máximo da raça em cada classe (DMG Tabela 7; ausente = a raça não pode). */
const levelLimitTable: Record<RaceName, Partial<Record<string, LevelLimit>>> = {
  Human: {},
  // Psionicist: CPsiH Tabela 1 (Psionicist Racial Level Limits).
  Dwarf: { Cleric: 10, Fighter: 15, Thief: 12, Ninja: 'unlimited', Psionicist: 8 },
  Elf: { Cleric: 12, Fighter: 12, Mage: 15, Ranger: 15, Thief: 12, Psionicist: 7 },
  Gnome: { Cleric: 9, Fighter: 11, Thief: 13, Psionicist: 9 },
  // Gypsy (Domains of Dread): humano, meio-elfo e Half-Vistani (que tem a linha especial abaixo); o livro não dá limite de nível.
  'Half-Elf': { Bard: 'unlimited', Cleric: 14, Druid: 9, Fighter: 14, Mage: 12, Ranger: 16, Thief: 12, Psionicist: 7, Gypsy: 'unlimited' },
  Halfling: { Cleric: 8, Fighter: 9, Thief: 15, Ninja: 'unlimited', Psionicist: 10 },
  // Domains of Dread: "quase humano" (sem tabela de limite); vale a linha especial abaixo.
  'Half-Vistani': {},
  // PWH, "Planar Races: Level Limits" (Wizard = Mage); classe fora da tabela = N/A.
  Aasimar: { Fighter: 14, Ranger: 14, Paladin: 14, Mage: 14, Cleric: 12, Druid: 15, Thief: 15, Bard: 9 },
  // Só o macho pode ser ranger ou paladino; só a fêmea, mago (PWH, nota **).
  'Bariaur (male)': { Fighter: 13, Ranger: 13, Paladin: 13, Cleric: 13, Druid: 13 },
  'Bariaur (female)': { Fighter: 13, Mage: 13, Cleric: 13, Druid: 13 },
  'Genasi (air)': { Fighter: 10, Mage: 15, Cleric: 15 },
  // Paladino: só stone champions (PWH, nota ***).
  'Genasi (earth)': { Fighter: 15, Paladin: 15, Mage: 15, Cleric: 13 },
  'Genasi (fire)': { Fighter: 14, Mage: 16 },
  'Genasi (water)': { Fighter: 12, Mage: 15, Cleric: 14, Thief: 15, Bard: 12 },
  Githzerai: { Fighter: 9, Mage: 12, Thief: 15 },
  Modron: { Fighter: 15, Mage: 12 },
  Tiefling: { Fighter: 12, Mage: 14, Cleric: 10, Thief: 15 },
}

/** RaceOption.levelLimit: nível máximo da raça na classe. */
export function levelLimit(race: RaceName, characterClass: CharacterClass | string): LevelLimit {
  const cls = canonicalClass(characterClass)
  // Half-Vistani: "Although human in body…" — sem tabela de limite, tratado como humano.
  if (race === 'Human' || race === 'Half-Vistani') return 'unlimited'
  return levelLimitTable[race][cls] ?? 'forbidden'
}

// --- Tabelas da raça (página 4 da ficha) ---------------------------------------------

/** Regra do compêndio com as tabelas da raça (o "?" das tabelas). */
export function raceRuleID(race: RaceName): string {
  if (isPlanarRace(race)) return 'pwh_ch00_racial_tables'
  if (isRavenloftRace(race)) return 'dod_ch00_half_vistani'
  return 'phb_ch02_character_race_tables'
}

export interface RaceAbilityRow {
  ability: AbilityName
  /** "8–18"; null quando a raça não tem faixa (humano, Half-Vistani). */
  range: string | null
  /** Ajuste da raça (0 = nenhum). */
  adjustment: number
}

/** Uma linha automática dos modificadores de combate da ficha (não gravada: sai da raça). */
export interface RaceCombatModifier {
  label: string
  value: string
}

/**
 * Bônus de ataque e penalidade dos atacantes pela raça (PHB cap. 2, texto de
 * cada raça). Só as raças do PHB por enquanto; as planares (PWH) e o
 * Half-Vistani ficam para conferir depois.
 */
export function racialCombatModifiers(race: RaceName | null): { toHit: RaceCombatModifier[]; ac: RaceCombatModifier[] } {
  switch (race) {
    case 'Dwarf':
      return {
        toHit: [{ label: 'Melee vs. orcs, half-orcs, goblins, hobgoblins', value: '+1' }],
        ac: [{ label: 'Ogres, trolls, ogre magi, giants, titans attacking you (their roll)', value: '−4' }],
      }
    case 'Gnome':
      return {
        toHit: [{ label: 'Melee vs. kobolds, goblins', value: '+1' }],
        ac: [{ label: 'Gnolls, bugbears, ogres, trolls, ogre magi, giants, titans attacking you (their roll)', value: '−4' }],
      }
    case 'Elf':
      return { toHit: [{ label: 'Bows (not crossbows), short and long swords', value: '+1' }], ac: [] }
    case 'Halfling':
      return { toHit: [{ label: 'Thrown weapons and slings', value: '+1' }], ac: [] }
    default:
      return { toHit: [], ac: [] }
  }
}

/** Tabelas 7 e 8 do PHB (ou as da PWH/DoD), só a linha da raça: faixa e ajuste de cada atributo. */
export function raceAbilityRows(race: RaceName): RaceAbilityRow[] {
  const req = requirements[race]
  return (Object.keys(abilityKey) as AbilityName[]).map((ability) => ({
    ability,
    range: req ? `${req[ability].min}–${req[ability].max}` : null,
    adjustment: adjustments[race].find(([name]) => name === ability)?.[1] ?? 0,
  }))
}

/** Limites de nível da raça, classe a classe (as que ela pode ter); vazio = sem limite (humano, Half-Vistani). */
export function raceLevelLimits(race: RaceName): { characterClass: string; limit: number | 'unlimited' }[] {
  if (race === 'Human' || race === 'Half-Vistani') return []
  return Object.entries(levelLimitTable[race]).flatMap(([characterClass, limit]) =>
    limit === undefined || limit === 'forbidden' ? [] : [{ characterClass, limit }],
  )
}

/** PHB Tabela 9: bônus de resistência pela Constituição (anão, gnomo, halfling). */
export const constitutionSaveBonusRows: { range: [number, number]; bonus: number }[] = [
  { range: [4, 6], bonus: 1 },
  { range: [7, 10], bonus: 2 },
  { range: [11, 13], bonus: 3 },
  { range: [14, 17], bonus: 4 },
  { range: [18, 19], bonus: 5 },
]

/** Contra o que vale o bônus da Tabela 9 (anão e halfling também contra veneno); null = a raça não tem. */
export function constitutionSaveBonusApplies(race: RaceName): string | null {
  if (race === 'Dwarf' || race === 'Halfling') return 'Saving throws vs. rods, staves, wands and spells, and vs. poison.'
  if (race === 'Gnome') return 'Saving throws vs. rods, staves, wands and spells.'
  return null
}

/** PWH, nota * da tabela de limites: aasimar e tiefling de uma classe só sobem dois níveis além. */
export const singleClassBonus: Partial<Record<RaceName, number>> = { Aasimar: 2, Tiefling: 2 }

/** RaceOption.levelLimitWarning. */
export function levelLimitWarning(race: RaceName, characterClass: CharacterClass | string, level: number): string | null {
  const limit = levelLimit(race, characterClass)
  const cls = canonicalClass(characterClass)
  if (limit === 'unlimited') return null
  // Anchorite e Gypsy (Domains of Dread): as raças vêm do livro.
  if (limit === 'forbidden') return `${race} cannot normally be a ${cls} (${cls === 'Anchorite' || cls === 'Gypsy' ? 'Domains of Dread' : raceSource(race)}).`
  // Aasimar e tiefling: o limite da tabela + 2 (de uma classe só, o caso comum; o aviso diz a regra).
  const bonus = singleClassBonus[race] ?? 0
  const note = bonus ? `; ${bonus} more if single-classed` : ''
  return level > limit + bonus ? `${race} ${cls}s are normally limited to level ${limit}${note} (${raceSource(race)}) — this character is already level ${level}.` : null
}

/** CBH Tabela 13: demi-bardos (semi-humanos só são bardos com estes kits, até este nível). */
export const demiBardKits: Partial<Record<RaceName, Record<string, number>>> = {
  Dwarf: { Chanter: 15, Herald: 6, Skald: 12 },
  Elf: { Gypsy: 9, Herald: 6, Loremaster: 12, Meistersinger: 15, Minstrel: 15 },
  Gnome: { Charlatan: 6, Herald: 6, Professor: 15, Jester: 15, Jongleur: 9, Riddlemaster: 8 },
  Halfling: { Herald: 6, Jester: 8, Jongleur: 12, Riddlemaster: 9, Whistler: 15 },
}

/** Aviso de demi-bardo (CBH Tabela 13): sem o kit da raça, ou acima do nível dele; null se nada a avisar. */
export function demiBardWarning(race: RaceName, kit: string | null | undefined, level: number): string | null {
  const table = demiBardKits[race]
  if (!table) return null
  const k = normalize(kit ?? '')
  const name = Object.keys(table).find((n) => k !== '' && k.includes(normalize(n)))
  if (!name) return `${/^[AEIOU]/.test(race) ? 'An' : 'A'} ${race} can only be a bard with one of these kits: ${Object.keys(table).join(', ')} (CBH, Table 13).`
  return level > table[name] ? `${race} ${name} bards are limited to level ${table[name]} (CBH, Table 13) — this character is level ${level}.` : null
}

/**
 * As três juntas, como o RacePickerSheet mostra antes de confirmar. Bardo
 * semi-humano: o aviso do CBH (demi-bardo, com o kit) no lugar do "cannot
 * normally be a Bard" do PHB. `campaignSettings` opcional: some o aviso de
 * cenário quando não vem (ex.: os testes antigos sem campanha em mente).
 */
export function raceWarnings(
  race: RaceName,
  c: Pick<PlayerCharacter, 'abilities' | 'characterClass' | 'level'> & { kit?: string | null },
  campaignSettings?: string[] | null,
): string[] {
  const demiBard = canonicalClass(c.characterClass) === 'Bard' && demiBardKits[race] !== undefined
  const warning = demiBard ? demiBardWarning(race, c.kit, c.level) : levelLimitWarning(race, c.characterClass, c.level)
  const settingWarning = campaignSettings !== undefined ? raceSettingWarning(race, campaignSettings) : null
  return [...abilityWarnings(race, c.abilities), ...(warning ? [warning] : []), ...(settingWarning ? [settingWarning] : [])]
}

const spellResistance: Partial<Record<RaceName, string>> = {
  Elf: '90% vs. sleep & charm',
  'Half-Elf': '30% vs. sleep & charm',
  Aasimar: '10% (non-wizards)',
  Githzerai: '5% per level, max. 95% (warriors & thieves)',
  Modron: '30% vs. illusions & mind-affecting',
}

const baseMovement: Record<RaceName, string> = {
  Human: '12"',
  Elf: '12"',
  'Half-Elf': '12"',
  Dwarf: '6"',
  Gnome: '6"',
  Halfling: '6"',
  Aasimar: '12"',
  'Bariaur (male)': '15"',
  'Bariaur (female)': '15"',
  'Genasi (air)': '12"',
  'Genasi (earth)': '12"',
  'Genasi (fire)': '12"',
  'Genasi (water)': '12"',
  Githzerai: '12"',
  Modron: '15"',
  Tiefling: '12"',
  'Half-Vistani': '12"',
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
  // PWH, a página de cada raça.
  Aasimar:
    'Infravision 60 ft. +1 to surprise checks. Half damage from heat and cold attacks. +2 to saving throws vs. charm, fear, emotion and domination effects. Non-wizards have 10% magic resistance. Any non-evil alignment.',
  'Bariaur (male)':
    'Infravision 60 ft., movement 15. Head butt with the horns for 1d8 (+ Strength bonus), tripled when charging at least 30 ft in a straight line (on a hit, save vs. breath weapon or take the same damage).',
  'Bariaur (female)': 'Infravision 60 ft., movement 15. +2 to surprise rolls and +3 to saving throws vs. spell. No horns. Can be fighters, priests or wizards.',
  'Genasi (air)':
    "No need to breathe. Levitate once per day as a 5th-level wizard. +1 to saving throws vs. air-based magic per 5 levels. Air elementalists only, if specialist wizards; can't be druids. −2 reaction from other planar races.",
  'Genasi (earth)':
    "Natural AC 8. Innate knowledge of stone (as the appraising proficiency). Pass without trace once per day as a 5th-level priest. +1 to saving throws vs. earth-based magic per 5 levels. Can't be multiclassed or druids; earth elementalists only. Any non-chaotic alignment. −2 reaction from other planar races.",
  'Genasi (fire)':
    "Infravision 60 ft. No damage from normal fire (magical fire still burns). Affect normal fires once per day as a 5th-level wizard. +1 to saving throws vs. fire-based magic per 5 levels. −2 reaction from other planar races.",
  'Genasi (water)':
    "Amphibious (breathes water as easily as air), swims at 15. Create water once per day as a 5th-level caster. +1 to saving throws vs. water-based magic per 5 levels. Water elementalists only; can't be druids. Any neutral alignment. −2 reaction from other planar races.",
  Githzerai:
    'Infravision 60 ft. Warriors and thieves have magic resistance of 5% per level (max. 95%), which also affects the magical items they use (an item that fails is useless to them forever); wizards give it up to cast spells. Any non-lawful alignment.',
  Modron:
    "Natural AC 8, movement 15. 30% resistance to illusions, energy drain, charm, sleep, fear, domination and similar mind-affecting spells. +1 to saving throws vs. fire, cold and acid. When surprised, stays surprised twice as long. Can't be multiclassed.",
  Tiefling:
    'Infravision 60 ft. Darkness 15-ft. radius once per day. Half damage from cold; +2 to saving throws vs. fire, electricity and poison (or roll five times on the Tiefling Abilities table instead). Any alignment except lawful good.',
  // Domains of Dread, "Half-Vistani"; tribal abilities (Kamii, Equaar, etc., Table 68) ficam fora: backlog.
  'Half-Vistani':
    'Can identify plants, animals and safe water, as a druid does. Can start a fire in 1d4 rounds given fuel. Can read tralaks (Vistani glyphs) with an Intelligence check. On the 3 nights of the full moon (lunatio): cannot heal or memorize spells, −2 to all saving throws, and a madness check each night.',
}

/** RaceOption.match: o campo Race (texto livre) que bate exatamente com uma raça. */
export function matchRace(text: string): RaceName | null {
  const target = normalize(text)
  return target === '' ? null : (allRaces.find((race) => normalize(race) === target) ?? null)
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

// --- Proficiências bônus (kit, raça, tribo) ------------------------------------------------
//
// Decisões do usuário (2026-10-24): entram marcadas com a origem (`grantedBy`)
// e 0 slots (só as aplicadas daqui em diante; as fichas antigas ficam como
// estão); não duplicam o que o jogador já tem; saem quando a origem sai, mas
// a tela pergunta antes de tirar uma que já foi usada (marcada ou com notas).

type CompendiumProficiency = { id: string; name: string; mechanics?: { slotsRequired?: number } }

/** Proficiências bônus da raça. Complete Book of Dwarves: Endurance a 0 slots para anão (os dados: "0 Slots - Dwarf"). */
export function raceBonusProficiencies(race: RaceName | null): string[] {
  return race === 'Dwarf' ? ['Endurance'] : []
}

const sameGrant = (a: ProficiencyGrant | null | undefined, b: ProficiencyGrant) => !!a && a.kind === b.kind && a.name === b.name

/**
 * addBonusProficiencies (A1): as bônus entram na ficha casadas pelo nome com o
 * compêndio, marcadas com a origem e com 0 slots; o que o personagem já tem
 * (comprado ou dado por outra origem) não se repete; ocupa primeiro as linhas
 * vazias.
 */
export function grantProficiencies(c: Pick<PlayerCharacter, 'proficiencies'>, grant: ProficiencyGrant, names: string[], compendium: CompendiumProficiency[]) {
  if (names.length === 0) return
  const entries: ProficiencyEntry[] = (c.proficiencies ?? []).map((e) => ({ ...e }))
  const existing = new Set(
    entries.flatMap((e) => {
      if (e.matchedProficiencyID) return [e.matchedProficiencyID]
      const n = normalize(e.name ?? '')
      return n === '' ? [] : [n]
    }),
  )
  let added = false
  for (const bonus of names) {
    const matched = compendium.find((p) => normalize(p.name) === normalize(bonus))
    const key = matched?.id ?? normalize(bonus)
    if (key === '' || existing.has(key)) continue
    const entry = { name: matched?.name ?? bonus, slots: 0, matchedProficiencyID: matched?.id ?? null, grantedBy: grant }
    const blank = entries.findIndex((e) => (e.name ?? '').trim() === '' && !e.matchedProficiencyID)
    if (blank >= 0) entries[blank] = { ...entries[blank], ...entry }
    else entries.push({ id: crypto.randomUUID().toUpperCase(), checked: false, ...entry })
    existing.add(key)
    added = true
  }
  if (added) c.proficiencies = entries
}

/** As bônus de uma origem que o jogador já usou: marcadas ("checked") ou com anotação. A tela pergunta antes de tirar. */
export function usedGrantedProficiencies(c: Pick<PlayerCharacter, 'proficiencies'>, grant: ProficiencyGrant): ProficiencyEntry[] {
  return (c.proficiencies ?? []).filter((e) => sameGrant(e.grantedBy, grant) && (e.checked === true || (e.target ?? '').trim() !== ''))
}

/**
 * Tira as bônus de uma origem. As de `keepIDs` (o jogador escolheu ficar)
 * viram compradas: perdem a marca e passam a custar os slots do compêndio.
 */
export function revokeProficiencies(
  c: Pick<PlayerCharacter, 'proficiencies'>,
  grant: ProficiencyGrant,
  keepIDs: Set<string>,
  compendium: CompendiumProficiency[],
) {
  const entries = c.proficiencies ?? []
  if (!entries.some((e) => sameGrant(e.grantedBy, grant))) return
  c.proficiencies = entries.flatMap((e) => {
    if (!sameGrant(e.grantedBy, grant)) return [e]
    if (!e.id || !keepIDs.has(e.id)) return []
    const slots = compendium.find((p) => p.id === e.matchedProficiencyID)?.mechanics?.slotsRequired ?? 1
    return [{ ...e, grantedBy: null, slots }]
  })
}
