// Multiclasse (PHB cap. 3, "Multi-Class and Dual-Class Characters"). Plano e
// decisões em docs/multiclasse.md. Só funções puras.
//
// A classe principal continua em characterClass/level; as outras ficam em
// `multiClasses`. Sem esse campo (ou vazio), é classe única e tudo dá o mesmo
// resultado de antes.
//
// Classe dupla (MC4): characterClass/level é a classe atual (a única que
// avança); as anteriores ficam em `formerClasses`, congeladas. Os recursos de
// classe (magia, perícias de ladrão, tabelas de referência) contam as
// anteriores; XP, combinações e proficiências, não.

import type { CharacterClass, ClassLevel, PlayerCharacter } from '../types/library.ts'
import { normalize } from '../lib/search.ts'
import { primeRequisites } from './sessionReport.ts'
import { demiBardKits, demiBardWarning, levelLimitWarning, matchRace, type RaceName } from './raceKit.ts'
import {
  bestSaves,
  bestTHAC0,
  canonicalClass,
  hasSpellSheet,
  hasThievingSkills,
  hitDieType,
  isArcaneCaster,
  proficiencyRow,
  referenceKind,
  xpRequired,
  type CanonicalClass,
  type ReferenceKind,
} from './rules.ts'

type WithClasses = Pick<PlayerCharacter, 'characterClass' | 'level'> & { multiClasses?: ClassLevel[] | null; formerClasses?: ClassLevel[] | null }

/** As classes de um personagem (principal, nível e as outras). */
export type ClassChoice = WithClasses

/** Todas as classes do personagem, a principal primeiro (classe única = uma só). */
export function classLevels(c: WithClasses): ClassLevel[] {
  return [{ characterClass: c.characterClass, level: c.level }, ...(c.multiClasses ?? [])]
}

export const isMultiClass = (c: WithClasses) => (c.multiClasses ?? []).length > 0

/** Classe dupla (MC4): tem classes anteriores. */
export const isDualClass = (c: WithClasses) => (c.formerClasses ?? []).length > 0

/** As classes ativas e as anteriores (classe dupla): para os recursos de classe. */
export function allClasses(c: WithClasses): ClassLevel[] {
  return [...classLevels(c), ...(c.formerClasses ?? [])]
}

/** "Fighter/Mage" e "5/4", como no cabeçalho da ficha. */
export function classLabel(c: WithClasses): string {
  return classLevels(c).map((k) => canonicalClass(k.characterClass)).join('/')
}
export function levelLabel(c: WithClasses): string {
  return classLevels(c).map((k) => k.level).join('/')
}

// --- Recursos por classe (MC3): cada um pelo nível da classe que o dá --------------

/** Nível do personagem na classe pedida (null se não tem a classe). */
export function levelOf(c: WithClasses, wanted: CanonicalClass): number | null {
  return allClasses(c).find((k) => canonicalClass(k.characterClass) === wanted)?.level ?? null
}

export const hasClass = (c: WithClasses, wanted: CanonicalClass) => levelOf(c, wanted) !== null

/** Alguma classe tem folha de magia (Cleric, Mage, Bard). */
export const hasSpellSheetAny = (c: WithClasses) => allClasses(c).some((k) => hasSpellSheet(k.characterClass))

/** Alguma classe conjura magia arcana (Mage, Bard): grimório. */
export const isArcaneCasterAny = (c: WithClasses) => allClasses(c).some((k) => isArcaneCaster(k.characterClass))

/** Alguma classe conjura magia divina com folha (Cleric). */
export const isDivineCasterAny = (c: WithClasses) => allClasses(c).some((k) => hasSpellSheet(k.characterClass) && !isArcaneCaster(k.characterClass))

/**
 * Atributo congelado na folha de magia: Sabedoria (dá slots extras ao
 * sacerdote), ou Inteligência quando só há classe arcana (mago, bardo).
 */
export function spellSheetAbility(c: WithClasses & Pick<PlayerCharacter, 'abilities'>): number {
  return isArcaneCasterAny(c) && !isDivineCasterAny(c) ? c.abilities.intelligence : c.abilities.wisdom
}

/**
 * Nível de conjurador para os slots de um tipo: o da classe arcana (Mage, Bard)
 * ou divina (Cleric). Sem classe desse tipo, o da principal.
 */
export function casterLevel(c: WithClasses, caster: 'arcane' | 'divine'): number {
  const k = allClasses(c).find((x) => hasSpellSheet(x.characterClass) && isArcaneCaster(x.characterClass) === (caster === 'arcane'))
  return k?.level ?? c.level
}

/** A classe ladina do personagem (Thief, Bard, Ninja), com o nível dela; null se não tem. */
export function rogueClass(c: WithClasses): { characterClass: CanonicalClass; level: number } | null {
  const k = allClasses(c).find((x) => hasThievingSkills(x.characterClass))
  return k ? { characterClass: canonicalClass(k.characterClass), level: k.level } : null
}

/** PHB cap. 3: mago multiclasse não conjura de armadura (exceto elfo de elven chain). */
export const multiClassWizardArmorRule =
  'A multi-classed wizard cannot cast spells while wearing armor — elves wearing elven chain can, as magic is part of their nature (PHB, Chapter 3).'

/** PHB cap. 3: sacerdote multiclasse segue as armas do culto (clérigo: só de concussão). */
export const multiClassPriestWeaponRule =
  "A multi-classed priest must abide by the weapon restrictions of his mythos — a fighter/cleric uses only bludgeoning weapons, though with the warrior's combat value (PHB, Chapter 3)."

/** PHB cap. 3: classe dupla segue as restrições da classe que está usando. */
export const dualClassRestrictionRule =
  'A dual-class character must abide by the restrictions of whichever class he is using at the moment — a dual-class fighter/mage cannot cast spells while wearing armor (PHB, Chapter 3).'

/** Avisos de restrição do multiclasse (ou da classe dupla) que valem para esta ficha (só texto). */
export function multiClassRestrictions(c: WithClasses): string[] {
  if (isDualClass(c) && !isMultiClass(c)) return [dualClassRestrictionRule]
  if (!isMultiClass(c)) return []
  const rules: string[] = []
  if (hasClass(c, 'Mage') || hasClass(c, 'Bard')) rules.push(multiClassWizardArmorRule)
  if (hasClass(c, 'Cleric') || hasClass(c, 'Druid')) rules.push(multiClassPriestWeaponRule)
  return rules
}

/** PHB cap. 3: o que o ladrão multiclasse pode fazer de armadura que ladrão não usa. */
export const multiClassThiefArmorRule =
  'A multi-classed thief cannot use any thieving abilities other than Open Locks or Detect Noise while wearing armor not normally allowed to thieves — and must remove gauntlets to open locks and the helmet to detect noise (PHB, Chapter 3).'

export interface ReferenceSection {
  kind: ReferenceKind
  characterClass: CanonicalClass
  level: number
}

/**
 * Seções da página 4 (tabelas de referência): uma por tipo de página, cada uma
 * com a classe e o nível que ela destaca. Classe única = a mesma página de
 * antes; vazio = a ficha não tem página 4.
 */
export function referenceSections(c: WithClasses): ReferenceSection[] {
  const sections: ReferenceSection[] = []
  for (const k of allClasses(c)) {
    const kind = referenceKind(k.characterClass)
    if (kind && !sections.some((s) => s.kind === kind)) sections.push({ kind, characterClass: canonicalClass(k.characterClass), level: k.level })
  }
  return sections
}

/** Páginas da ficha: 4 se alguma classe tem tabelas de referência, senão 3. */
export const recordSheetPages = (c: WithClasses) => (referenceSections(c).length > 0 ? 4 : 3)

// --- Combate: o melhor de cada classe ----------------------------------------------

/** Melhor THAC0 e melhor save de cada categoria (ficam em rules.ts, usados pelo motor de consequências). */
export const combinedTHAC0 = bestTHAC0
export const combinedSaves = bestSaves

// --- Experiência: dividida igualmente ----------------------------------------------

/** Parte do XP de cada classe (PHB: "divided equally"; frações para baixo). */
export function xpShare(totalXP: number, classCount: number): number {
  return classCount > 0 ? Math.floor(totalXP / classCount) : totalXP
}

export interface ClassProgress {
  characterClass: CanonicalClass
  level: number
  xp: number
  /** XP para o próximo nível desta classe (null fora da tabela). */
  next: number | null
  /** A parte do XP já passa do próximo nível desta classe. */
  ready: boolean
}

/** XP de cada classe e quanto falta para o próximo nível dela. */
export function classProgress(c: WithClasses & Pick<PlayerCharacter, 'experience'>): ClassProgress[] {
  const classes = classLevels(c)
  const share = xpShare(c.experience, classes.length)
  return classes.map((k) => {
    const next = xpRequired(k.level + 1, k.characterClass)
    return { characterClass: canonicalClass(k.characterClass), level: k.level, xp: share, next, ready: next !== null && share >= next }
  })
}

// --- Proficiências: maior número inicial, ritmo mais rápido -------------------------

const num = (text: string | undefined) => (text !== undefined && /^[+-]?\d+$/.test(text) ? Number(text) : null)

/**
 * Slots de proficiência de um multiclasse: o maior número inicial entre as
 * classes, mais um slot a cada N níveis pelo ritmo mais rápido (a classe com o
 * menor N, contando o nível dela). `kind` escolhe arma ou perícia.
 */
export function combinedProficiencySlots(classes: ClassLevel[], kind: 'weapon' | 'nonweapon'): number {
  const rows = classes
    .map((k) => ({ k, row: proficiencyRow(k.characterClass) }))
    .filter((x): x is { k: ClassLevel; row: NonNullable<ReturnType<typeof proficiencyRow>> } => x.row !== null)
  if (rows.length === 0) return 0
  const initial = Math.max(...rows.map((x) => num(kind === 'weapon' ? x.row.initialWeapon : x.row.initialNonweapon) ?? 0))
  const fastest = rows
    .map((x) => ({ level: x.k.level, every: num(kind === 'weapon' ? x.row.levelsWeapon : x.row.levelsNonweapon) ?? 0 }))
    .filter((x) => x.every > 0)
    .sort((a, b) => a.every - b.every || b.level - a.level)[0]
  return initial + (fastest ? Math.trunc(fastest.level / fastest.every) : 0)
}

/** Penalidade sem proficiência: a menor entre as classes ("-2" é melhor que "-5"). */
export function combinedNonProficiencyPenalty(classes: ClassLevel[]): string {
  const values = classes.map((k) => num(proficiencyRow(k.characterClass)?.penalty)).filter((v): v is number => v !== null)
  return values.length ? String(Math.max(...values)) : '-2'
}

// --- Pontos de vida: o jogador calcula; o app mostra a regra (decisão 2) -------------

export function hitPointsRule(classes: ClassLevel[]): string {
  const dice = classes.map((k) => `${hitDieType(k.characterClass)} (${canonicalClass(k.characterClass)})`)
  const fighter = classes.some((k) => canonicalClass(k.characterClass) === 'Fighter')
  return (
    `Roll ${dice.join(' + ')} at 1st level, add them and divide by ${classes.length} (round down), then add the Constitution bonus. ` +
    `On a new level in one class, roll that class's die and divide by ${classes.length} (minimum 1). ` +
    `The Constitution bonus is split between the classes${fighter ? '; as a fighter you can use the warrior Constitution bonus (+3/+4)' : ''}.`
  )
}

// --- Combinações permitidas (PHB) — fora da tabela é permitido, com aviso (decisão 3) --

type Combo = string[]

/**
 * PHB: combinações por raça. Illusionist = Mage com escola Illusion/Phantasm.
 * Psionicist (CPsiH, cap. 1): só anões e halflings, com Fighter ou Thief.
 */
const combos: Partial<Record<RaceName, Combo[]>> = {
  Dwarf: [['Fighter', 'Thief'], ['Fighter', 'Cleric'], ['Fighter', 'Psionicist'], ['Thief', 'Psionicist']],
  Elf: [['Fighter', 'Mage'], ['Fighter', 'Thief'], ['Mage', 'Thief'], ['Fighter', 'Mage', 'Thief']],
  Gnome: [
    ['Fighter', 'Cleric'], ['Fighter', 'Illusionist'], ['Fighter', 'Thief'],
    ['Cleric', 'Illusionist'], ['Cleric', 'Thief'], ['Illusionist', 'Thief'],
  ],
  Halfling: [['Fighter', 'Thief'], ['Fighter', 'Psionicist'], ['Thief', 'Psionicist']],
  'Half-Elf': [
    ['Fighter', 'Cleric'], ['Fighter', 'Thief'], ['Fighter', 'Mage'], ['Cleric', 'Ranger'],
    ['Cleric', 'Mage'], ['Thief', 'Mage'], ['Fighter', 'Mage', 'Cleric'],
    // "Druid pode ocupar o lugar de Cleric" (asterisco da tabela).
    ['Fighter', 'Druid'], ['Druid', 'Ranger'], ['Druid', 'Mage'], ['Fighter', 'Mage', 'Druid'],
  ],
}

/** As combinações da raça, para o seletor. */
export function combosFor(race: string): Combo[] {
  const r = matchRace(race)
  return r ? (combos[r] ?? []) : []
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

/**
 * Avisos de um multiclasse (vazio = dentro das regras): raça humana, combinação
 * fora da tabela da raça, especialista (só o ilusionista gnomo pode) e limite
 * racial de nível de cada classe.
 */
export function multiClassWarnings(c: WithClasses & Pick<PlayerCharacter, 'race' | 'wizardSchool'> & { kit?: string | null }): string[] {
  if (!isMultiClass(c)) return []
  const classes = classLevels(c)
  const race = matchRace(c.race)
  const warnings: string[] = []
  const names = classes.map((k) => {
    const cls = canonicalClass(k.characterClass)
    return cls === 'Mage' && c.wizardSchool === 'Illusion/Phantasm' && race === 'Gnome' ? 'Illusionist' : cls
  })
  if (new Set(names).size !== names.length) warnings.push('The same class appears twice.')
  // CNH: ninja semi-humano não pode ser multiclasse.
  if (names.includes('Ninja')) warnings.push('Demihuman ninja cannot be multi-classed (CNH, The Ninja Class).')
  const bard = race ? bardCombo(race, names) : null
  if (!race) {
    warnings.push('Choose a race: multi-class combinations depend on it (PHB, Chapter 3).')
  } else if (race === 'Human') {
    warnings.push('Humans cannot be multi-class (they can be dual-class instead) — PHB, Chapter 3.')
  } else if (names.includes('Bard')) {
    // CBH cap. 3: o multiclasse de bardo vem ligado a kits.
    if (!bard) warnings.push(`${names.join('/')} is not a standard ${race} bard multi-class (CBH, Chapter 3).`)
    else if (!kitMatchesAny(c.kit, bard.kits)) {
      warnings.push(`A ${race} ${names.join('/')} must take the ${bard.kits.map(kitLabel).join(' or ')} kit (CBH, Chapter 3).`)
    }
  } else if (!(combos[race] ?? []).some((combo) => sameSet(combo, names))) {
    warnings.push(`${names.join('/')} is not a standard ${race} multi-class combination (${names.includes('Psionicist') ? 'CPsiH, Chapter 1' : 'PHB, Chapter 3'}).`)
  }
  if (c.wizardSchool && names.includes('Mage')) {
    warnings.push('Specialist wizards cannot be multi-class (the gnome illusionist is the only exception).')
  }
  if (race) {
    for (const k of classes) {
      // Bardo semi-humano: limite pelo kit (CBH, Tabela 13), em demiBardWarnings.
      if (canonicalClass(k.characterClass) === 'Bard' && demiBardKits[race]) continue
      const warning = levelLimitWarning(race, k.characterClass, k.level)
      if (warning) warnings.push(warning)
    }
  }
  return warnings
}

// --- MC5: bardos do CBH, kits, dreno de nível -----------------------------------------

/** O kit da ficha bate com um dos nomes (por palavra: "Chanter" ~ "Dwarven Chanter"). "True" = True Bard ou sem kit. */
function kitMatchesAny(kit: string | null | undefined, names: string[]): boolean {
  const k = normalize(kit ?? '')
  return names.some((n) => (n === 'True' ? k === '' || k.includes('true bard') : k.includes(normalize(n))))
}
const kitLabel = (n: string) => (n === 'True' ? 'True Bard (or no kit)' : n)

interface BardCombo {
  classes: string[]
  kits: string[]
}

/** CBH cap. 3: multiclasse de bardo por raça, com os kits de cada combinação ("True" = True Bard). */
const bardCombos: Partial<Record<RaceName, BardCombo[]>> = {
  Dwarf: [{ classes: ['Fighter', 'Bard'], kits: ['Chanter', 'Skald'] }],
  Elf: [
    { classes: ['Mage', 'Bard'], kits: ['Minstrel'] },
    { classes: ['Thief', 'Bard'], kits: ['Gypsy'] },
  ],
  Gnome: [
    { classes: ['Illusionist', 'Bard'], kits: ['Professor'] },
    { classes: ['Thief', 'Bard'], kits: ['Professor', 'Jongleur'] },
  ],
  'Half-Elf': [
    { classes: ['Fighter', 'Bard'], kits: ['True', 'Blade', 'Gallant', 'Skald'] },
    { classes: ['Ranger', 'Bard'], kits: ['True', 'Meistersinger'] },
    { classes: ['Mage', 'Bard'], kits: ['Loremaster', 'Riddlemaster'] },
    { classes: ['Cleric', 'Bard'], kits: ['True'] },
    { classes: ['Druid', 'Bard'], kits: ['Meistersinger'] },
    { classes: ['Thief', 'Bard'], kits: ['True', 'Gypsy', 'Jongleur', 'Thespian'] },
  ],
  Halfling: [{ classes: ['Thief', 'Bard'], kits: ['Jongleur'] }],
}

function bardCombo(race: RaceName, names: string[]): BardCombo | null {
  return (bardCombos[race] ?? []).find((combo) => sameSet(combo.classes, names)) ?? null
}

/** As combinações de bardo da raça, para o seletor (classes e kits). */
export function bardCombosFor(race: string): { classes: string[]; kits: string[] }[] {
  const r = matchRace(race)
  return r ? (bardCombos[r] ?? []).map((combo) => ({ classes: combo.classes, kits: combo.kits.map(kitLabel) })) : []
}

/**
 * CBH ("Demihumans as Bards", Tabela 13): anão, elfo, gnomo e halfling só são
 * bardos com um kit da raça, e até o nível máximo dele. Vale também para
 * classe única (decisão do usuário); só aviso. A tabela fica em raceKit.ts
 * (o seletor de raça usa o mesmo aviso).
 */
export function demiBardWarnings(c: WithClasses & Pick<PlayerCharacter, 'race' | 'kit'>): string[] {
  const race = matchRace(c.race)
  const level = levelOf(c, 'Bard')
  if (!race || level === null) return []
  const warning = demiBardWarning(race, c.kit, level)
  return warning ? [warning] : []
}

/** Todos os avisos da ficha ligados a classe e kit (multiclasse, demi-bardo), sem repetir. */
export function classWarnings(c: WithClasses & Pick<PlayerCharacter, 'race' | 'wizardSchool' | 'kit'>): string[] {
  return [...new Set([...multiClassWarnings(c), ...demiBardWarnings(c), ...dualClassWarnings(c)])]
}

/** As raças aceitas pelo texto de requisitos do kit ("Any", "Half-elf, human", "Any except halfling"…). */
export function kitAllowsRace(racesText: string | null | undefined, race: string): boolean {
  const r = matchRace(race)
  const text = normalize(racesText ?? '')
  if (!r || text === '' || text === 'none' || text === 'any') return true
  const forms: Record<RaceName, string[]> = {
    Human: ['human', 'humans'],
    Dwarf: ['dwarf', 'dwarves'],
    Elf: ['elf', 'elves'],
    Gnome: ['gnome', 'gnomes'],
    'Half-Elf': ['halfelf'],
    Halfling: ['halfling', 'halflings'],
  }
  // Palavras do texto; "half-elf(ves)" vira uma palavra só, para "elf" não casar dentro dela.
  const words = (part: string) => part.replace(/half[\s-]?el(f|ves)/g, 'halfelf').split(/[^a-z]+/)
  const mentions = (part: string) => forms[r].some((f) => words(part).includes(f))
  if (text.startsWith('any except')) return !mentions(text.slice('any except'.length))
  return mentions(text)
}

interface KitInfo {
  name: string
  classEligibility: { classGroup: string; subclass?: string | null }
  mechanics?: { requirements?: { races?: string | null } | null } | null
}

/**
 * Avisos de um kit para esta ficha (MC5): kits de guerreiro (CFH cap. 2) e de
 * ladrão (CTH cap. 3) só para classe única; kit que não aceita a raça (CPrH:
 * a ordem sacerdotal tem restrições raciais). Kits de sacerdote, de mago (o CWH
 * não restringe) e de bardo (CBH) valem num multiclasse; um kit no total.
 */
export function kitWarnings(kit: KitInfo, c: WithClasses & Pick<PlayerCharacter, 'race'>): string[] {
  const warnings: string[] = []
  if (isMultiClass(c)) {
    if (kit.classEligibility.classGroup === 'Warrior') warnings.push('Only single-class warriors can take a warrior kit (CFH, Chapter 2).')
    if (kit.classEligibility.classGroup === 'Rogue' && kit.classEligibility.subclass === 'Thief') {
      warnings.push('Only single-class thieves can take a thief kit (CTH, Chapter 3).')
    }
  }
  const races = kit.mechanics?.requirements?.races
  if (c.race && !kitAllowsRace(races, c.race)) warnings.push(`This kit is limited to: ${races}.`)
  return warnings
}

/**
 * PHB cap. 3: o dreno de nível tira primeiro da classe de nível mais alto; em
 * empate, da classe cujo nível exige mais XP. Devolve o índice (-1 = classe
 * principal; 0… = posição em multiClasses) e a classe; null se nada a drenar.
 */
export function levelDrainTarget(c: WithClasses): { index: number; former: boolean; characterClass: CanonicalClass; level: number } | null {
  // Classe dupla (MC4b): as anteriores entram também (former = true; index na lista delas).
  const all = [
    ...classLevels(c).map((k, i) => ({ index: i - 1, former: false, characterClass: canonicalClass(k.characterClass), level: k.level })),
    ...(c.formerClasses ?? []).map((k, i) => ({ index: i, former: true, characterClass: canonicalClass(k.characterClass), level: k.level })),
  ]
  const candidates = all.filter((k) => k.level > 1)
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.level - a.level || (xpRequired(b.level, b.characterClass) ?? 0) - (xpRequired(a.level, a.characterClass) ?? 0))
  return candidates[0]
}

/** As classes que aparecem no seletor de multiclasse (as do PHB e o Psionicist do CPsiH). */
export const multiClassOptions: CharacterClass[] = ['Fighter', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Paladin', 'Bard', 'Psionicist']

// --- Classe dupla (MC4, PHB cap. 3, "Dual-Class Benefits and Restrictions") ----------

/** "ex-Cleric 3, ex-Thief 4": as classes anteriores, para o cabeçalho. */
export function formerLabel(c: WithClasses): string {
  return (c.formerClasses ?? []).map((k) => `ex-${canonicalClass(k.characterClass)} ${k.level}`).join(', ')
}

export interface DualRestriction {
  /** Classe atual e o nível em que a restrição acaba (passa o maior nível anterior). */
  characterClass: CanonicalClass
  untilLevel: number
}

/**
 * Período de restrição: até o nível da classe atual passar o maior nível das
 * anteriores, usar habilidade de classe antiga custa o XP do encontro e metade
 * do da aventura, e a classe nova não dá dados de vida nem HP. null = sem
 * restrição (ou sem classe dupla).
 */
export function dualClassRestriction(c: WithClasses): DualRestriction | null {
  const former = c.formerClasses ?? []
  if (former.length === 0) return null
  const highest = Math.max(...former.map((k) => k.level))
  return c.level > highest ? null : { characterClass: canonicalClass(c.characterClass), untilLevel: highest + 1 }
}

type Abilities = PlayerCharacter['abilities']

export interface Requirement {
  text: string
  ok: boolean
}

const abilityShort: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
}

/**
 * Requisitos para trocar para `next` (PHB; o CBH repete os mesmos limiares para
 * o bardo): humano, nível 2+ na classe atual, 15+ nos atributos principais
 * dela e 17+ nos da nova. Só informam: a troca não é bloqueada.
 */
export function dualClassRequirements(
  c: WithClasses & Pick<PlayerCharacter, 'race'> & { abilities: Abilities },
  next: CharacterClass,
): Requirement[] {
  const current = canonicalClass(c.characterClass)
  const target = canonicalClass(next)
  const scores = (cls: string, min: number, special?: { abilities: Ability[]; source: string }): Requirement => {
    const prime = special?.abilities ?? primeRequisites[cls]
    if (!prime) return { text: `${cls}: no prime requisite on the PHB tables`, ok: true }
    const values = prime.map((a) => `${abilityShort[a]} ${c.abilities[a]}`).join(', ')
    const what = special ? `${min}+ in ${prime.map((a) => abilityShort[a]).join(', ')} to ${min === 15 ? 'leave' : 'become'} a ${cls} (${special.source})` : `${min}+ in the ${cls} prime requisites`
    return { text: `${what} (${values})`, ok: prime.every((a) => c.abilities[a] >= min) }
  }
  const taken = allClasses(c).map((k) => canonicalClass(k.characterClass))
  const list: Requirement[] = [
    { text: 'Human (only humans can be dual-classed)', ok: matchRace(c.race) === 'Human' },
    { text: `Level 2 or higher as ${current} (now ${c.level})`, ok: c.level >= 2 },
    scores(current, 15, leaveRequirement[current]),
    scores(target, 17, enterRequirement[target]),
    { text: `${target} is a new class for this character`, ok: !taken.includes(target) },
    { text: 'Not multi-classed', ok: !isMultiClass(c) },
  ]
  // CPH cap. 4: o paladino não troca com guerreiros, ladrões nem magos.
  const paladinBlocked = ['Fighter', 'Ranger', 'Thief', 'Mage']
  if (current === 'Paladin' && paladinBlocked.includes(target)) list.push({ text: `A paladin cannot dual-class to ${target} (CPH, Chapter 4)`, ok: false })
  if (target === 'Paladin' && taken.some((t) => ['Fighter', 'Ranger'].includes(t))) {
    list.push({ text: 'A warrior cannot convert to a paladin (CPH, Chapter 4)', ok: false })
  }
  // CNH cap. 1: classe dupla com ninja não é recomendada.
  if (target === 'Ninja' || current === 'Ninja') list.push({ text: 'Dual-class ninja are not recommended (CNH, Chapter 1) — only if the DM allows', ok: false })
  return list
}

type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

/** CPH cap. 4: limiares próprios do paladino (os outros Complete repetem os do PHB). */
const leaveRequirement: Partial<Record<CanonicalClass, { abilities: Ability[]; source: string }>> = {
  Paladin: { abilities: ['strength', 'constitution', 'wisdom'], source: 'CPH' },
}
const enterRequirement: Partial<Record<CanonicalClass, { abilities: Ability[]; source: string }>> = {
  Paladin: { abilities: ['strength', 'dexterity', 'wisdom', 'charisma'], source: 'CPH' },
}

/** As classes que aparecem na troca de classe dupla (as do multiclasse e o ninja do CNH). */
export const dualClassOptions: CharacterClass[] = [...multiClassOptions, 'Ninja']

/** Avisos da ficha de classe dupla (só aviso, como no multiclasse). */
export function dualClassWarnings(c: WithClasses & Pick<PlayerCharacter, 'race'> & { kit?: string | null }): string[] {
  if (!isDualClass(c)) return []
  const warnings: string[] = []
  const race = matchRace(c.race)
  if (race && race !== 'Human') warnings.push('Only humans can be dual-classed (PHB, Chapter 3).')
  if (isMultiClass(c)) warnings.push('A character is either multi-class or dual-class, not both (PHB, Chapter 3).')
  const current = canonicalClass(c.characterClass)
  const names = (c.formerClasses ?? []).map((k) => canonicalClass(k.characterClass))
  if (names.includes(current)) warnings.push(`${current} is already a former class: a dual-class character cannot go back to a class he left (PHB, Chapter 3).`)
  if (new Set(names).size !== names.length) warnings.push('The same former class appears twice.')
  // CNH cap. 1: kits do ninja de classe dupla.
  const kit = normalize(c.kit ?? '')
  if (current === 'Ninja' && kit && !['stealer-in', 'stealer in', 'shadow warrior'].some((k) => kit.includes(k))) {
    warnings.push('A character who switches to ninja can only take the Stealer-In or Shadow Warrior kit (CNH, Chapter 1).')
  }
  if (names.includes('Ninja') && current !== 'Ninja' && !kit.includes('lone wolf')) {
    warnings.push('Only a Lone Wolf ninja can switch to another class (CNH, Chapter 1).')
  }
  return warnings
}

/** Regra de HP da classe dupla (o jogador calcula; decisão 2). */
export function dualHitPointsRule(c: WithClasses): string {
  const restriction = dualClassRestriction(c)
  const die = hitDieType(c.characterClass)
  const current = canonicalClass(c.characterClass)
  return restriction
    ? `The character keeps the Hit Dice and hit points of his former classes and gains none while advancing as ${current}, until level ${restriction.untilLevel}. From then on, roll ${die} for each new level (PHB, Chapter 3).`
    : `The character keeps the Hit Dice and hit points of his former classes and rolls ${die} (${current}) for each new level (PHB, Chapter 3).`
}

/**
 * Slots de proficiência da classe dupla (MC4d, decisão 17). Cada classe dá os
 * slots dela pela Tabela 34: os iniciais (a classe nova começa "from scratch",
 * Skills & Powers cap. 4) mais um a cada N níveis da própria classe (a anterior
 * pelo nível congelado; a nova recomeça no 1, PHB cap. 3). O personagem mantém
 * as proficiências da classe anterior (PHB cap. 3).
 */
export function dualProficiencySlots(c: WithClasses, kind: 'weapon' | 'nonweapon'): number {
  const order = [...(c.formerClasses ?? []), { characterClass: c.characterClass, level: c.level }]
  return order.reduce((sum, k) => {
    const row = proficiencyRow(k.characterClass)
    if (!row) return sum
    const initial = num(kind === 'weapon' ? row.initialWeapon : row.initialNonweapon) ?? 0
    const every = num(kind === 'weapon' ? row.levelsWeapon : row.levelsNonweapon) ?? 0
    return sum + initial + (every > 0 ? Math.trunc(k.level / every) : 0)
  }, 0)
}

/**
 * Penalidade sem proficiência da classe dupla (decisão 17): na restrição, a da
 * classe atual; depois, a melhor entre as classes (como THAC0 e saves).
 */
export function dualNonProficiencyPenalty(c: WithClasses): { penalty: string; from: string } {
  if (dualClassRestriction(c)) {
    return { penalty: combinedNonProficiencyPenalty(classLevels(c)), from: `${canonicalClass(c.characterClass)}, while restricted` }
  }
  return {
    penalty: combinedNonProficiencyPenalty(allClasses(c)),
    from: `best of ${allClasses(c).map((k) => canonicalClass(k.characterClass)).join(', ')}`,
  }
}

/** Nota da ficha: de onde vêm os slots e a penalidade da classe dupla. */
export function dualProficiencyNote(c: WithClasses): string {
  const { penalty, from } = dualNonProficiencyPenalty(c)
  const parts = [...(c.formerClasses ?? []), { characterClass: c.characterClass, level: c.level }]
    .map((k) => `${canonicalClass(k.characterClass)} ${k.level}`)
    .join(' + ')
  return `Dual-class: initial slots and level slots of each class on Table 34 (${parts}) — PHB Chapter 3, Skills & Powers Chapter 4. Non-proficiency penalty ${penalty} (${from}).`
}
