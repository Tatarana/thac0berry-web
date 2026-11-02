// Custo das proficiências nonweapon por classe (PHB cap. 5, Tabela 37,
// "Nonweapon Proficiency Group Crossovers") e as proficiências bônus de raça e
// kit no construtor (The Forge, etapas 6 e 7). Só funções puras.
//
// Regra: a proficiência de um grupo da classe (ou General) custa os slots do
// livro; de qualquer outro grupo, um slot a mais. Multiclasse e classe dupla
// juntam os grupos de todas as classes.

import type { PlayerCharacter, ProficiencyGrant } from '../types/library.ts'
import { allClasses } from './multiclass.ts'
import { grantProficiencies, matchRace, raceBonusProficiencies, revokeProficiencies } from './raceKit.ts'
import { canonicalClass, classGroup } from './rules.ts'

export type ProficiencyGroup = 'General' | 'Priest' | 'Rogue' | 'Warrior' | 'Wizard' | 'Psionicist'

/** Tabela 37 (PHB) e o Complete Psionics Handbook; outras classes: General mais o grupo da classe. */
const crossovers: Record<string, ProficiencyGroup[]> = {
  Bard: ['General', 'Rogue', 'Warrior', 'Wizard'],
  Cleric: ['General', 'Priest'],
  Druid: ['General', 'Priest', 'Warrior'],
  Fighter: ['General', 'Warrior'],
  Mage: ['General', 'Wizard'],
  Paladin: ['General', 'Priest', 'Warrior'],
  Ranger: ['General', 'Warrior', 'Wizard'],
  Thief: ['General', 'Rogue'],
  Psionicist: ['General', 'Psionicist'],
}

/** Grupos de proficiência de uma classe. */
export function classProficiencyGroups(characterClass: string): ProficiencyGroup[] {
  return crossovers[canonicalClass(characterClass)] ?? ['General', classGroup(characterClass) as ProficiencyGroup]
}

/** Grupos de proficiência do personagem: os de todas as classes (multiclasse e classe dupla somam). */
export function characterProficiencyGroups(c: Parameters<typeof allClasses>[0]): Set<ProficiencyGroup> {
  return new Set(allClasses(c).flatMap((k) => classProficiencyGroups(k.characterClass)))
}

// O campo `groups` dos dados vem do texto dos livros ("Warrior (Rogue - Thief's
// Handbook)", "Priest - Paladin"…). Vale qualquer grupo citado, mesmo entre
// parênteses (o suplemento abre o grupo para outra classe) — a favor do jogador.
const groupWords: [RegExp, ProficiencyGroup][] = [
  [/\bgeneral\b/i, 'General'],
  [/\b(priest|druid|shaman)s?\b/i, 'Priest'],
  [/\b(rogue|thief)s?\b/i, 'Rogue'],
  [/\b(warrior|fighter|barbarian|gladiator)s?\b/i, 'Warrior'],
  [/\bwizards?\b/i, 'Wizard'],
  [/\bpsionicists?\b/i, 'Psionicist'],
]

/** Os grupos citados no campo `groups` de uma proficiência. */
export function proficiencyGroupsIn(groups: string[]): Set<ProficiencyGroup> {
  const text = groups.join(' | ')
  return new Set(groupWords.filter(([re]) => re.test(text)).map(([, group]) => group))
}

/** A proficiência está num grupo do personagem (ou é General)? */
export function inCharacterGroups(groups: string[], characterGroups: Set<ProficiencyGroup>): boolean {
  const own = proficiencyGroupsIn(groups)
  return [...own].some((g) => g === 'General' || characterGroups.has(g))
}

/** Slots que a proficiência custa para o personagem: os do livro, ou um a mais fora dos grupos dele. */
export function nonweaponCost(p: { mechanics: { groups: string[]; slotsRequired: number } }, characterGroups: Set<ProficiencyGroup>): number {
  return p.mechanics.slotsRequired + (inCharacterGroups(p.mechanics.groups, characterGroups) ? 0 : 1)
}

/**
 * Armas que o kit exige e recomenda, lidas do texto do kit ("* Required:
 * Lance. * Recommended: Spear, long bow…", "Recommended—staff."). Devolve as
 * chaves de proficiência (weaponProficiencyKey) citadas em cada parte; texto
 * sem essas palavras (só um número de slots, por exemplo) não marca nada.
 */
export function kitWeaponHints(text: string | null | undefined, weaponKeys: string[]): { required: Set<string>; recommended: Set<string> } {
  const empty = { required: new Set<string>(), recommended: new Set<string>() }
  if (!text) return empty
  const lower = text.toLowerCase()
  const recAt = lower.search(/recommended/)
  const reqAt = lower.search(/required/)
  const requiredPart = reqAt >= 0 ? lower.slice(reqAt, recAt > reqAt ? recAt : undefined) : ''
  const recommendedPart = recAt >= 0 ? lower.slice(recAt, reqAt > recAt ? reqAt : undefined) : ''
  const cited = (part: string) =>
    new Set(weaponKeys.filter((key) => key !== '' && new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(part)))
  return { required: cited(requiredPart), recommended: cited(recommendedPart) }
}

type CompendiumProficiency = { id: string; name: string; mechanics?: { slotsRequired?: number } }

/**
 * Proficiências bônus do kit lidas do texto ("Bonus Proficiency: Endurance."),
 * para os kits em que o thac0berry-data ainda não preencheu `proficiencies.bonus`.
 * Só nomes do compêndio; "X or Y" fica de fora (a escolha é do jogador).
 */
export function kitBonusFromText(text: string | null | undefined, compendium: Pick<CompendiumProficiency, 'name'>[]): string[] {
  if (!text) return []
  const start = /bonus(?:es)?(?: (?:nonweapon )?proficienc(?:y|ies))?\s*[:—–-]+/i.exec(text)
  if (!start) return []
  const rest = text.slice(start.index + start[0].length)
  const end = rest.search(/\.(\s|$)|\*|recommended|required|;/i)
  let part = ` ${(end >= 0 ? rest.slice(0, end) : rest).toLowerCase().replace(/\s*\(\s*/g, ', ').replace(/\s*\)/g, ' ').replace(/\d+/g, '')} `
  const names = [...compendium].sort((a, b) => b.name.length - a.name.length)
  const found: string[] = []
  for (const p of names) {
    const escaped = p.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,\s*/g, ',\\s*')
    const match = new RegExp(`(^|[^a-z])(${escaped})s?(?=[^a-z]|$)`).exec(part)
    if (!match) continue
    const at = match.index + match[1].length
    const before = part.slice(0, at)
    const after = part.slice(at + match[2].length)
    // apaga o trecho para um nome curto ("Riding") não casar dentro de um longo
    part = before + ' '.repeat(match[2].length) + after
    if (/\bor\s*$/.test(before) || /^s?\s*,?\s*or\b/.test(after)) continue
    found.push(p.name)
  }
  return found
}

type KitBonusSource = { mechanics: { proficiencies?: { bonus?: string[] | null } | null }; features: { nonweaponProficiencies?: string | null } }

/** As bônus do kit: a lista estruturada ou, sem ela, o texto do livro. */
export function kitBonusProficiencies(kit: KitBonusSource | null | undefined, compendium: Pick<CompendiumProficiency, 'name'>[]): string[] {
  if (!kit) return []
  const listed = kit.mechanics.proficiencies?.bonus ?? []
  return listed.length > 0 ? listed : kitBonusFromText(kit.features.nonweaponProficiencies, compendium)
}

/**
 * Deixa as proficiências bônus de raça e kit em dia no construtor: tira as de
 * uma raça ou kit que não é mais o do personagem (no Forge troca-se à vontade e
 * nada foi usado ainda) e dá as atuais, de graça (0 slots), sem repetir.
 */
export function syncBonusProficiencies(c: Pick<PlayerCharacter, 'proficiencies' | 'race' | 'kit'>, kitBonus: string[], compendium: CompendiumProficiency[]) {
  const race = matchRace(c.race)
  const current: ProficiencyGrant[] = [
    ...(race ? [{ kind: 'race' as const, name: race }] : []),
    ...(c.kit ? [{ kind: 'kit' as const, name: c.kit }] : []),
  ]
  const stale = new Map<string, ProficiencyGrant>()
  for (const e of c.proficiencies ?? []) {
    const g = e.grantedBy
    if (!g || g.kind === 'tribe') continue
    if (!current.some((x) => x.kind === g.kind && x.name === g.name)) stale.set(`${g.kind}:${g.name}`, g)
  }
  for (const g of stale.values()) revokeProficiencies(c, g, new Set(), compendium)
  if (race) grantProficiencies(c, { kind: 'race', name: race }, raceBonusProficiencies(race), compendium)
  if (c.kit) grantProficiencies(c, { kind: 'kit', name: c.kit }, kitBonus, compendium)
}
