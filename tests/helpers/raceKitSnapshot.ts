// Foto da saída das funções públicas de raça (raceKit, multiclass, forgeCombos,
// description, settingFit) para as 17 raças que existiam em código antes de
// "Raças em dados" (2026-11-20). O fixture `tests/fixtures/raceKit.snapshot.json`
// foi gerado ANTES do refactor; o teste `raceKitSnapshot.test.ts` exige que a
// versão que lê os dados (races.json) devolva exatamente o mesmo.
// Regerar (só se a regra mudar de propósito): UPDATE_SNAPSHOT=1 npm test.

import * as D from '../../src/rules/description.ts'
import * as F from '../../src/rules/forgeCombos.ts'
import * as M from '../../src/rules/multiclass.ts'
import * as K from '../../src/rules/raceKit.ts'
import * as S from '../../src/rules/settingFit.ts'
import type { PlayerCharacter } from '../../src/types/library.ts'

/** As raças de antes, na ordem do seletor de então. */
export const legacyRaces = [
  'Human',
  'Dwarf',
  'Elf',
  'Gnome',
  'Half-Elf',
  'Halfling',
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
  'Half-Vistani',
]

const classes = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', 'Anchorite', 'Gypsy', 'Wizard', 'Priest']
const levels = [1, 8, 9, 12, 13, 16, 20]
const kits = ['', 'Chanter', 'Herald', 'Skald', 'Gypsy', 'Loremaster', 'Minstrel', 'Professor', 'Jester', 'Whistler', 'Jongleur', 'True Bard', 'Meistersinger']
const kitTexts = [
  null,
  '',
  'Any',
  'Human',
  'Elf',
  'Half-elf, human',
  'Dwarf (gold, shield), gnome (forest, rock), halfling',
  'Any except elf',
  'Any except dwarves and halflings',
  'Elf (moon, wild), half-elf (moon, wild)',
  'Gnome',
  'Halfling',
  'Vistani',
  'Bariaur',
  'Genasi',
  'Tiefling',
  'Modron',
  'Aasimar',
  'Githzerai',
  'Half-Elf',
  'Human, elf, half-elf',
]
const matchTexts = [
  'Human',
  'human',
  ' HUMAN ',
  'Elf',
  'elf',
  'Dwarf',
  'Gnome',
  'Half-Elf',
  'half elf',
  'Half-elf',
  'Halfling',
  'Aasimar',
  'Bariaur (male)',
  'bariaur (female)',
  'Bariaur',
  'Genasi (fire)',
  'Genasi (Water)',
  'genasi',
  'Githzerai',
  'Modron',
  'Tiefling',
  'Half-Vistani',
  'half vistani',
  '',
  '   ',
  'Orc',
  'Elven',
  'Martian',
]
const settingSets: (string[] | null)[] = [null, [], ['Planescape'], ['Ravenloft'], ['Forgotten Realms'], ['Planescape', 'Ravenloft']]

const baseCharacter = () =>
  ({
    race: 'Human',
    characterClass: 'Thief',
    level: 14,
    abilities: { strength: 12, dexterity: 16, constitution: 9, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { paralyzationPoisonDeath: 13, rodStaffWand: 14, petrificationPolymorph: 12, breathWeapon: 16, spell: 15, spellResistance: 'old' },
    racialAbilities: null,
    page2Movement: null,
    proficiencies: [{ id: 'a', name: '', slots: 1, checked: false }],
  }) as unknown as PlayerCharacter

const abilityProfiles = [
  { strength: 12, dexterity: 16, constitution: 9, intelligence: 10, wisdom: 10, charisma: 10 },
  { strength: 18, dexterity: 18, constitution: 18, intelligence: 18, wisdom: 18, charisma: 18 },
  { strength: 3, dexterity: 3, constitution: 3, intelligence: 3, wisdom: 3, charisma: 3 },
]

const attempt = <T>(fn: () => T): T | string => {
  try {
    return fn()
  } catch (error) {
    return `THROWS ${(error as Error).message}`
  }
}

const state = (c: PlayerCharacter) => ({ race: c.race, abilities: c.abilities, saves: c.saves, racialAbilities: c.racialAbilities, movement: c.page2Movement })

export function snapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const race of legacyRaces) {
    const r: Record<string, unknown> = {}
    r.hasAbilityRequirements = K.hasAbilityRequirements(race)
    r.adjustmentsText = K.raceAdjustmentsText(race)
    r.adjustments = K.raceAdjustments(race)
    r.abilityRows = K.raceAbilityRows(race)
    r.levelLimits = K.raceLevelLimits(race)
    r.levelLimitByClass = Object.fromEntries(classes.map((cls) => [cls, K.levelLimit(race, cls)]))
    r.levelLimitWarnings = Object.fromEntries(classes.map((cls) => [cls, levels.map((lv) => K.levelLimitWarning(race, cls, lv))]))
    r.singleClassBonus = K.singleClassBonus[race] ?? null
    r.demiBardKits = K.demiBardKits[race] ?? null
    r.demiBardWarnings = Object.fromEntries(kits.map((kit) => [kit, levels.map((lv) => K.demiBardWarning(race, kit, lv))]))
    r.constitutionSave = K.constitutionSaveBonusApplies(race)
    r.combat = K.racialCombatModifiers(race)
    r.bonusProficiencies = K.raceBonusProficiencies(race)
    r.ruleID = K.raceRuleID(race)
    r.setting = K.raceCampaignSetting(race)
    r.settingWarnings = settingSets.map((s) => K.raceSettingWarning(race, s))
    r.gender = K.raceGender(race)
    r.label = K.raceLabel(race)
    r.forMale = K.raceForGender(race, 'male')
    r.forFemale = K.raceForGender(race, 'female')
    r.isPlanar = K.isPlanarRace(race)
    r.isRavenloft = K.isRavenloftRace(race)
    r.matched = K.matchRace(race)
    r.warnings = abilityProfiles.flatMap((abilities) =>
      classes.flatMap((cls) => [1, 13, 20].map((level) => K.raceWarnings(race, { abilities, characterClass: cls, level, kit: 'Chanter' } as never, ['Forgotten Realms']))),
    )
    const applied = baseCharacter()
    K.applyRace(applied, race)
    r.applied = state(applied)
    const replaced = baseCharacter()
    K.replaceRace(replaced, 'Dwarf')
    K.replaceRace(replaced, race)
    K.replaceRace(replaced, 'Elf')
    K.replaceRace(replaced, race)
    r.replaced = state(replaced)
    r.multiclassCombos = M.combosFor(race)
    r.bardCombos = M.bardCombosFor(race)
    r.kitAllows = kitTexts.map((t) => M.kitAllowsRace(t, race))
    const withExtra = (extra: string[], wizardSchool: string | null, kit: string | null) =>
      M.multiClassWarnings({ race, characterClass: 'Fighter', level: 6, multiClasses: extra.map((characterClass) => ({ characterClass, level: 5 })), wizardSchool, kit } as never)
    r.multiClassWarnings = [
      withExtra(['Thief'], null, null),
      withExtra(['Mage'], null, null),
      withExtra(['Cleric'], null, null),
      withExtra(['Mage'], 'Illusion/Phantasm', null),
      withExtra(['Bard'], null, 'Gypsy'),
      withExtra(['Mage', 'Thief'], null, null),
    ]
    r.demiBardChar = M.demiBardWarnings({ race, characterClass: 'Bard', level: 12, kit: 'Herald' } as never)
    r.dualWarnings = M.dualClassWarnings({ race, characterClass: 'Mage', level: 4, formerClasses: [{ characterClass: 'Fighter', level: 5 }], abilities: abilityProfiles[0] } as never)
    r.bodyTable = D.bodyTable(race)
    r.forgeComboAllowed = Object.fromEntries(classes.map((cls) => [cls, F.comboAllowed(race, cls)]))
    r.forgeComboName = Object.fromEntries(classes.flatMap((cls) => [null, 'male', 'female'].map((g) => [`${cls}/${g}`, attempt(() => F.comboName(race, cls, g as never))])))
    r.settingFit = settingSets.map((s) => S.settingFitNotes({ race, characterClass: 'Fighter' }, s, new Map()))
    out[race] = r
  }
  out.matchRace = Object.fromEntries(matchTexts.map((t) => [t, K.matchRace(t)]))
  const legacy = new Set(legacyRaces)
  out.allRacesOrder = K.allRaces.filter((r) => legacy.has(r))
  out.forGender = Object.fromEntries([null, 'male', 'female'].map((g) => [String(g), K.racesForGender(g as never).filter((r) => legacy.has(r))]))
  out.forgeCombos = F.forgeCombos().filter((c) => legacy.has(c.race))
  out.constitutionSaveRows = K.constitutionSaveBonusRows
  return out
}
