// Multiclasse (PHB cap. 3, "Multi-Class and Dual-Class Characters"). Plano e
// decisões em docs/multiclasse.md. Só funções puras.
//
// A classe principal continua em characterClass/level; as outras ficam em
// `multiClasses`. Sem esse campo (ou vazio), é classe única e tudo dá o mesmo
// resultado de antes.

import type { CharacterClass, ClassLevel, PlayerCharacter } from '../types/library.ts'
import { levelLimitWarning, matchRace, type RaceName } from './raceKit.ts'
import { bestSaves, bestTHAC0, canonicalClass, hasSpellSheet, hitDieType, isArcaneCaster, proficiencyRow, xpRequired, type CanonicalClass } from './rules.ts'

type WithClasses = Pick<PlayerCharacter, 'characterClass' | 'level'> & { multiClasses?: ClassLevel[] | null }

/** As classes de um personagem (principal, nível e as outras). */
export type ClassChoice = WithClasses

/** Todas as classes do personagem, a principal primeiro (classe única = uma só). */
export function classLevels(c: WithClasses): ClassLevel[] {
  return [{ characterClass: c.characterClass, level: c.level }, ...(c.multiClasses ?? [])]
}

export const isMultiClass = (c: WithClasses) => (c.multiClasses ?? []).length > 0

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
  return classLevels(c).find((k) => canonicalClass(k.characterClass) === wanted)?.level ?? null
}

export const hasClass = (c: WithClasses, wanted: CanonicalClass) => levelOf(c, wanted) !== null

/** Alguma classe tem folha de magia (Cleric, Mage, Bard). */
export const hasSpellSheetAny = (c: WithClasses) => classLevels(c).some((k) => hasSpellSheet(k.characterClass))

/** Alguma classe conjura magia arcana (Mage, Bard): grimório. */
export const isArcaneCasterAny = (c: WithClasses) => classLevels(c).some((k) => isArcaneCaster(k.characterClass))

/** Alguma classe conjura magia divina com folha (Cleric). */
export const isDivineCasterAny = (c: WithClasses) => classLevels(c).some((k) => hasSpellSheet(k.characterClass) && !isArcaneCaster(k.characterClass))

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
  const k = classLevels(c).find((x) => hasSpellSheet(x.characterClass) && isArcaneCaster(x.characterClass) === (caster === 'arcane'))
  return k?.level ?? c.level
}

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
export function multiClassWarnings(c: WithClasses & Pick<PlayerCharacter, 'race' | 'wizardSchool'>): string[] {
  if (!isMultiClass(c)) return []
  const classes = classLevels(c)
  const race = matchRace(c.race)
  const warnings: string[] = []
  const names = classes.map((k) => {
    const cls = canonicalClass(k.characterClass)
    return cls === 'Mage' && c.wizardSchool === 'Illusion/Phantasm' && race === 'Gnome' ? 'Illusionist' : cls
  })
  if (new Set(names).size !== names.length) warnings.push('The same class appears twice.')
  if (!race) {
    warnings.push('Choose a race: multi-class combinations depend on it (PHB, Chapter 3).')
  } else if (race === 'Human') {
    warnings.push('Humans cannot be multi-class (they can be dual-class instead) — PHB, Chapter 3.')
  } else if (!(combos[race] ?? []).some((combo) => sameSet(combo, names))) {
    warnings.push(`${names.join('/')} is not a standard ${race} multi-class combination (${names.includes('Psionicist') ? 'CPsiH, Chapter 1' : 'PHB, Chapter 3'}).`)
  }
  if (c.wizardSchool && names.includes('Mage')) {
    warnings.push('Specialist wizards cannot be multi-class (the gnome illusionist is the only exception).')
  }
  if (race) {
    for (const k of classes) {
      const warning = levelLimitWarning(race, k.characterClass, k.level)
      if (warning) warnings.push(warning)
    }
  }
  return warnings
}

/** As classes que aparecem no seletor de multiclasse (as do PHB e o Psionicist do CPsiH). */
export const multiClassOptions: CharacterClass[] = ['Fighter', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Paladin', 'Bard', 'Psionicist']
