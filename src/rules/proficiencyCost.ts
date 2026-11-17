// Custo das proficiências nonweapon por classe (PHB cap. 5, Tabela 37,
// "Nonweapon Proficiency Group Crossovers") e as proficiências bônus de raça e
// kit no construtor (The Forge, etapas 6 e 7). Só funções puras.
//
// Regra: a proficiência de um grupo da classe (ou General) custa os slots do
// livro; de qualquer outro grupo, um slot a mais. Multiclasse e classe dupla
// juntam os grupos de todas as classes.

import { normalize } from '../lib/search.ts'
import type { PlayerCharacter, ProficiencyEntry, ProficiencyGrant } from '../types/library.ts'
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

/** O que o kit diz das armas, já em chaves de proficiência (weaponProficiencyKey). */
export type KitWeaponHints = {
  required: Set<string>
  recommended: Set<string>
  /** Uma lista por escolha obrigatória ("sickle or scythe"): basta uma de cada. */
  choices: Set<string>[]
  /** Armas que o kit proíbe (nome em minúsculas; só aviso). */
  forbidden: Set<string>
  /** As únicas armas do kit (nome em minúsculas), ou null quando ele não limita. */
  allowed: Set<string> | null
}

type KitWeaponsData = {
  required?: string[] | null
  requiredChoices?: string[][] | null
  recommended?: string[] | null
  forbidden?: string[] | null
  allowed?: string[] | null
}

/** A chave de arma de um nome estruturado do kit ("Long bow" → "long bow"); null se o compêndio não tem a arma (Katana, Ninja-to…). */
export function kitWeaponKey(name: string, weaponKeys: string[]): string | null {
  const key = name.trim().toLowerCase()
  return key !== '' && weaponKeys.includes(key) ? key : null
}

/**
 * Armas que o kit exige e recomenda. Usa as listas estruturadas do kit
 * (`mechanics.weapons`: required, requiredChoices, recommended, forbidden, allowed)
 * quando ele tem required, requiredChoices ou recommended; senão lê o texto do kit
 * ("* Required: Lance. * Recommended: Spear, long bow…", "Recommended—staff.").
 * Devolve as chaves de proficiência (weaponProficiencyKey); nome fora do compêndio
 * (Katana…) não vira chave, e texto sem essas palavras (só um número de slots) não marca nada.
 */
export function kitWeaponHints(text: string | null | undefined, weaponKeys: string[], structured?: KitWeaponsData | null): KitWeaponHints {
  const lower = (names: string[] | null | undefined) => new Set((names ?? []).map((n) => n.trim().toLowerCase()).filter((n) => n !== ''))
  const keys = (names: string[] | null | undefined) => new Set((names ?? []).flatMap((n) => kitWeaponKey(n, weaponKeys) ?? []))
  const rules = {
    forbidden: lower(structured?.forbidden),
    allowed: (structured?.allowed ?? []).length > 0 ? lower(structured?.allowed) : null,
  }
  const hasStructured = !!structured && [structured.required, structured.requiredChoices, structured.recommended].some((l) => (l ?? []).length > 0)
  if (hasStructured) {
    return {
      required: keys(structured.required),
      recommended: keys(structured.recommended),
      choices: (structured.requiredChoices ?? []).map(keys).filter((g) => g.size > 0),
      ...rules,
    }
  }
  const empty = { required: new Set<string>(), recommended: new Set<string>(), choices: [], ...rules }
  if (!text) return empty
  const lowerText = text.toLowerCase()
  const recAt = lowerText.search(/recommended/)
  const reqAt = lowerText.search(/required/)
  const requiredPart = reqAt >= 0 ? lowerText.slice(reqAt, recAt > reqAt ? recAt : undefined) : ''
  const recommendedPart = recAt >= 0 ? lowerText.slice(recAt, reqAt > recAt ? reqAt : undefined) : ''
  const cited = (part: string) =>
    new Set(weaponKeys.filter((key) => key !== '' && new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(part)))
  return { ...empty, required: cited(requiredPart), recommended: cited(recommendedPart) }
}

type CompendiumProficiency = { id: string; name: string; mechanics?: { slotsRequired?: number } }

/** As proficiências bônus (grátis) do kit: só a lista estruturada `proficiencies.bonus`. */
export function kitBonusProficiencies(kit: { mechanics: { proficiencies?: { bonus?: string[] | null } | null } } | null | undefined): string[] {
  return kit?.mechanics.proficiencies?.bonus ?? []
}

type KitChoiceSource = { name: string; mechanics: { proficiencies?: { bonus?: string[] | null; bonusChoices?: string[][] | null } | null } }
type KitChoiceCharacter = Pick<PlayerCharacter, 'proficiencies' | 'kit'>

/** As listas de escolha grátis do kit ("Hunting or Fishing"): de cada uma o jogador ganha uma. */
export function kitBonusChoiceGroups(kit: KitChoiceSource | null | undefined): string[][] {
  return (kit?.mechanics.proficiencies?.bonusChoices ?? []).filter((g) => g.length > 0)
}

const grantedByKit = (e: ProficiencyEntry, kit: { name: string }) => e.grantedBy?.kind === 'kit' && e.grantedBy.name === kit.name
const sameName = (a: string | null | undefined, b: string) => normalize(a ?? '') === normalize(b)

/** A opção já escolhida de um grupo: a proficiência que o kit deu e está na lista (null = grupo sem escolha). */
export function chosenKitBonus(c: KitChoiceCharacter, kit: KitChoiceSource, group: string[]): string | null {
  const entry = (c.proficiencies ?? []).find((e) => grantedByKit(e, kit) && group.some((n) => sameName(e.name, n)))
  return entry ? (group.find((n) => sameName(entry.name, n)) ?? null) : null
}

/** Os grupos de escolha do kit que o personagem ainda não resolveu. */
export function unresolvedKitBonusChoices(c: KitChoiceCharacter, kit: KitChoiceSource | null | undefined): string[][] {
  return kit ? kitBonusChoiceGroups(kit).filter((g) => chosenKitBonus(c, kit, g) === null) : []
}

/**
 * Escolhe (ou troca) a opção grátis de um grupo: a anterior sai da ficha e a nova
 * entra como bônus do kit, com 0 slots. Se o jogador já tinha a nova comprada, ela
 * vira a bônus (devolve os slots). `choice` null só desfaz a escolha.
 */
export function setKitBonusChoice(c: Pick<PlayerCharacter, 'proficiencies'>, kit: KitChoiceSource, group: string[], choice: string | null, compendium: CompendiumProficiency[]) {
  const fixed = kit.mechanics.proficiencies?.bonus ?? []
  const entries = (c.proficiencies ?? []).filter((e) => !(grantedByKit(e, kit) && group.some((n) => sameName(e.name, n)) && !fixed.some((n) => sameName(e.name, n))))
  c.proficiencies = entries
  if (!choice) return
  const bought = entries.find((e) => !e.grantedBy && sameName(e.name, choice))
  if (bought) c.proficiencies = entries.map((e) => (e === bought ? { ...e, slots: 0, grantedBy: { kind: 'kit' as const, name: kit.name } } : e))
  else grantProficiencies(c, { kind: 'kit', name: kit.name }, [choice], compendium)
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
