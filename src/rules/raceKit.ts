// Raça e kit, portados do iPad: Models/Race.swift (Tabela 7 do PHB:
// requisitos e ajustes de atributo, limites de nível, o que a raça grava na
// ficha) e o addBonusProficiencies do cabeçalho da ficha (item A1 do
// inventário de regras nas telas). Só funções puras.
//
// Desde 2026-11-20 ("Raças em dados") as raças vêm de races.json
// (thac0berry-data, ver src/data/races.ts) e não mais de tabelas aqui. As
// funções continuam síncronas porque o app carrega as raças uma vez, antes do
// primeiro render (`loadRaces()` em main.tsx), e as entrega a `setRaceData`.
// Os testes fazem o mesmo (tests/setup-races.ts). Antes de `setRaceData` não há
// raça nenhuma: `matchRace` devolve null e as demais funções dão o vazio.
//
// Fiel ao iPad: aplicar uma raça SOMA os ajustes de atributo, sem desfazer
// os da raça anterior (trocar de raça duas vezes acumula; registrado no
// TODO.md do iPad como provável bug).

import type { Race } from '../data/races.ts'
import { normalize } from '../lib/search.ts'
import type { AbilityScores, CharacterClass, PlayerCharacter, ProficiencyEntry, ProficiencyGrant } from '../types/library.ts'
import { allowedBySettings, settingUnderConstruction } from './campaignFilter.ts'
import { ensureConsequenceSnapshot } from './consequences.ts'
import { canonicalClass } from './rules.ts'

/** O nome da raça como a ficha o grava ("Elf", "Genasi (fire)", "Drow"). Desde as raças em dados, qualquer texto; `matchRace` reconhece os que existem. */
export type RaceName = string

// --- Registro (as raças carregadas) --------------------------------------------------------

let records: Race[] = []
const byName = new Map<string, Race>()
const byId = new Map<string, Race>()
const limitTables = new Map<string, Map<string, LevelLimit>>()

/** Raças que o seletor mostra (jogáveis), na ordem do dado. Preenchido por `setRaceData` (mesma referência). */
export const allRaces: RaceName[] = []
/** PWH, nota * da tabela de limites: aasimar e tiefling de uma classe só sobem dois níveis além. */
export const singleClassBonus: Partial<Record<RaceName, number>> = {}
/** CBH Tabela 13: demi-bardos (semi-humanos só são bardos com estes kits, até este nível). */
export const demiBardKits: Partial<Record<RaceName, Record<string, number>>> = {}

/** As 12 classes do app: só elas entram nos limites de nível e combinações (as outras ficam no dado). */
const appClasses = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', 'Anchorite', 'Gypsy']
/** Nas combinações entra também o Illusionist (Mage da escola Illusion/Phantasm). */
const comboClasses = new Set([...appClasses, 'Illusionist'])

const isPlayable = (r: Race) => r.playable !== false

/** Entrega as raças (races.json) ao registro; chamar de novo troca tudo. */
export function setRaceData(list: Race[]) {
  records = list
  byName.clear()
  byId.clear()
  limitTables.clear()
  allRaces.length = 0
  for (const key of Object.keys(singleClassBonus)) delete singleClassBonus[key]
  for (const key of Object.keys(demiBardKits)) delete demiBardKits[key]
  for (const r of list) {
    byName.set(r.name, r)
    byId.set(r.id, r)
    if (isPlayable(r)) allRaces.push(r.name)
    if (r.singleClassBonus) singleClassBonus[r.name] = r.singleClassBonus
    if (r.demiBardKits) demiBardKits[r.name] = { ...r.demiBardKits }
  }
}

/** Todas as raças carregadas, inclusive as escondidas (para o futuro módulo do mestre). */
export const raceRecords = (): readonly Race[] => records

/** O registro da raça pelo nome exato (qualquer raça, jogável ou não). */
export const raceRecord = (race: RaceName | null | undefined): Race | undefined => (race ? byName.get(race) : undefined)

/** A raça-base (uma das 6 do PHB) de uma subraça; undefined se não for subraça. */
export const baseRaceRecord = (race: RaceName | null | undefined): Race | undefined => {
  const base = raceRecord(race)?.baseRace
  return base ? byId.get(base) : undefined
}

/** A raça é esta raça do PHB ou uma subraça dela? (`isRaceOf('Drow', 'elf')`). */
export const isRaceOf = (race: RaceName | null | undefined, baseId: string): boolean => {
  const r = raceRecord(race)
  return !!r && (r.id === baseId || r.baseRace === baseId)
}

/** Humano ou subraça humana (Athasian Human): só humanos fazem classe dupla. */
export const isHumanRace = (race: RaceName | null | undefined) => isRaceOf(race, 'human')

/** A raça e a raça-base, nessa ordem (quem pergunta "é elfo?" pergunta pelos dois). */
export const raceFamily = (race: RaceName): RaceName[] => {
  const base = baseRaceRecord(race)
  return base ? [race, base.name] : [race]
}

/** De onde vêm os números da raça (texto dos avisos). */
const raceSource = (race: RaceName) => raceRecord(race)?.source?.label ?? race

const PHB_LABELS = new Set(['PHB Table 7', 'Domains of Dread'])

/** A fonte citada nos avisos de multiclasse: PHB cap. 3 para as raças do PHB e Half-Vistani; a do livro nas demais. */
export function multiClassSource(race: RaceName): string {
  const label = raceSource(race)
  return PHB_LABELS.has(label) ? 'PHB, Chapter 3' : label
}

/** O cenário da raça é este? (Planescape: raças planares; Ravenloft: Half-Vistani.) */
export const isPlanarRace = (race: RaceName | null | undefined): boolean => raceRecord(race)?.campaignSetting === 'Planescape'
export const isRavenloftRace = (race: RaceName | null | undefined): boolean => raceRecord(race)?.campaignSetting === 'Ravenloft'

/**
 * O cenário da campanha que esta raça pede (null = livros gerais, qualquer campanha).
 * Decisão do usuário (2026-10-17): na ficha, nunca bloqueia a escolha — o mestre
 * pode misturar mundos —, só gera o aviso de `raceSettingWarning`.
 */
export function raceCampaignSetting(race: RaceName): string | null {
  return raceRecord(race)?.campaignSetting ?? null
}

/** "Half-Vistani is a Ravenloft race (Domains of Dread), and this campaign does not have the Ravenloft setting on."; null se bate ou a raça não pede cenário. */
export function raceSettingWarning(race: RaceName, campaignSettings: string[] | null | undefined): string | null {
  const setting = raceCampaignSetting(race)
  if (!setting || campaignSettings?.includes(setting)) return null
  return `${race} is a ${setting} race (${raceSource(race)}), and this campaign does not have the ${setting} setting on.`
}

/**
 * A raça aparece nos seletores (Forge e troca de raça na ficha) com estes
 * cenários? Jogável, de um cenário que vale (Core sempre; filtro vazio = todos)
 * e de cenário que já dá para jogar: raça de cenário em construção
 * (Council of Wyrms, Spelljammer, Al-Qadim) nunca aparece, mesmo que o filtro a
 * deixasse passar.
 */
export function raceSelectable(race: RaceName, settings: string[] | null | undefined): boolean {
  const r = raceRecord(race)
  if (!r || !isPlayable(r)) return false
  const setting = r.campaignSetting ?? null
  return !(setting && settingUnderConstruction(setting)) && allowedBySettings(setting, settings)
}

/** As raças dos seletores para estes cenários; `keep` (a raça já escolhida) continua à vista mesmo se o filtro mudar. */
export const selectableRaces = (settings: string[] | null | undefined, keep?: RaceName | null): RaceName[] =>
  allRaces.filter((race) => race === keep || raceSelectable(race, settings))

/** O grupo da lista (Player's Handbook, Subraces ou o cenário). */
export const raceGroup = (race: RaceName): string => raceRecord(race)?.group ?? "Player's Handbook"

const groupRank = (group: string) => (group === "Player's Handbook" ? 0 : group === 'Subraces' ? 1 : 2)

/** Agrupa raças para a lista: PHB, Subraces e depois os cenários em ordem alfabética; dentro de cada grupo, a ordem dada. */
export function groupRaces(races: RaceName[]): { group: string; races: RaceName[] }[] {
  const groups = new Map<string, RaceName[]>()
  for (const race of races) {
    const group = raceGroup(race)
    groups.set(group, [...(groups.get(group) ?? []), race])
  }
  return [...groups.entries()].map(([group, list]) => ({ group, races: list })).sort((a, b) => groupRank(a.group) - groupRank(b.group) || a.group.localeCompare(b.group))
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
const abilityOfCode: Record<string, AbilityName> = { STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma' }
const codeOfAbility: Record<AbilityName, string> = { Strength: 'STR', Dexterity: 'DEX', Constitution: 'CON', Intelligence: 'INT', Wisdom: 'WIS', Charisma: 'CHA' }

/** Tabela 7: faixa de cada atributo (Human não tem). */
const requirementsOf = (race: RaceName) => raceRecord(race)?.abilityScoreRequirements ?? null

/** Ajustes da raça na ordem do dado: [atributo, delta]. */
const adjustmentsOf = (race: RaceName): [AbilityName, number][] =>
  (raceRecord(race)?.abilityScoreAdjustments ?? []).flatMap((a) => (abilityOfCode[a.ability] ? [[abilityOfCode[a.ability], a.modifier] as [AbilityName, number]] : []))

export function hasAbilityRequirements(race: RaceName) {
  return !!requirementsOf(race)
}

export function raceAdjustmentsText(race: RaceName): string {
  return adjustmentsOf(race)
    .map(([name, delta]) => `${delta > 0 ? '+' : ''}${delta} ${name.slice(0, 3)}`)
    .join(', ')
}

/** RaceOption.abilityWarnings: atributos fora da faixa da raça. */
export function abilityWarnings(race: RaceName, abilities: AbilityScores): string[] {
  const req = requirementsOf(race)
  if (!req) return []
  return (Object.keys(abilityKey) as AbilityName[]).flatMap((name) => {
    const range = req[codeOfAbility[name] as keyof typeof req]
    if (!range) return []
    const score = abilities[abilityKey[name]] as number
    return score < range.min || score > range.max ? [`${name} ${score} is outside the ${range.min}–${range.max} range ${race} requires (${raceSource(race)}).`] : []
  })
}

type LevelLimit = 'unlimited' | 'forbidden' | number

/** Limites de nível da raça nas classes do app, na ordem do dado (classe de fora do app não entra). */
function levelTable(race: RaceName): Map<string, LevelLimit> {
  const r = raceRecord(race)
  if (!r) return new Map()
  let table = limitTables.get(r.id)
  if (!table) {
    table = new Map()
    for (const { class: cls, levelLimit: limit } of r.classLevelLimits ?? []) if (appClasses.includes(cls) && !table.has(cls)) table.set(cls, limit)
    limitTables.set(r.id, table)
  }
  return table
}

/** RaceOption.levelLimit: nível máximo da raça na classe (DMG Tabela 7; ausente = a raça não pode). */
export function levelLimit(race: RaceName, characterClass: CharacterClass | string): LevelLimit {
  const r = raceRecord(race)
  if (!r) return 'forbidden'
  // Humano e Half-Vistani ("Although human in body…"): sem tabela de limite.
  if (r.noLevelLimit) return 'unlimited'
  return levelTable(race).get(canonicalClass(characterClass)) ?? 'forbidden'
}

// --- Tabelas da raça (página 4 da ficha) ---------------------------------------------

/** Regra do compêndio com as tabelas da raça (o "?" das tabelas). */
export function raceRuleID(race: RaceName): string {
  const r = raceRecord(race)
  if (r?.ruleId) return r.ruleId
  return r?.campaignSetting === 'Planescape' ? 'pwh_ch00_racial_tables' : 'phb_ch02_character_race_tables'
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
 * cada raça). Vem do dado (`combatModifiers`): as raças do PHB e as subraças que
 * herdam as habilidades padrão; as demais ficam sem (o texto do livro está nas
 * habilidades raciais).
 */
export function racialCombatModifiers(race: RaceName | null): { toHit: RaceCombatModifier[]; ac: RaceCombatModifier[] } {
  const m = raceRecord(race)?.combatModifiers
  return { toHit: m?.toHit ? m.toHit.map((x) => ({ ...x })) : [], ac: m?.ac ? m.ac.map((x) => ({ ...x })) : [] }
}

/** Tabelas 7 e 8 do PHB (ou as da PWH/DoD), só a linha da raça: faixa e ajuste de cada atributo. */
export function raceAbilityRows(race: RaceName): RaceAbilityRow[] {
  const req = requirementsOf(race)
  return (Object.keys(abilityKey) as AbilityName[]).map((ability) => {
    const range = req?.[codeOfAbility[ability] as keyof typeof req]
    return {
      ability,
      range: range ? `${range.min}–${range.max}` : null,
      adjustment: adjustmentsOf(race).find(([name]) => name === ability)?.[1] ?? 0,
    }
  })
}

/** Limites de nível da raça, classe a classe (as do app que ela pode ter); vazio = sem limite (humano, Half-Vistani). */
export function raceLevelLimits(race: RaceName): { characterClass: string; limit: number | 'unlimited' }[] {
  if (!raceRecord(race) || raceRecord(race)!.noLevelLimit) return []
  return [...levelTable(race)].flatMap(([characterClass, limit]) => (limit === 'forbidden' ? [] : [{ characterClass, limit }]))
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
  return raceRecord(race)?.constitutionSaveBonus ?? null
}

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

/** Habilidades especiais da raça (texto da ficha). */
const specialAbilities = (race: RaceName): string | null => raceRecord(race)?.racialAbilities ?? null

/** Movimento base da raça ("12\""); null = sem número no dado. */
const baseMovement = (race: RaceName): string | null => {
  const n = raceRecord(race)?.baseMovement
  return n === undefined ? null : `${n}"`
}

/** RaceOption.match: o campo Race (texto livre) que bate exatamente com uma raça jogável (pelo nome; depois pelos apelidos). Raça escondida não casa. */
export function matchRace(text: string): RaceName | null {
  const target = normalize(text)
  if (target === '') return null
  const named = allRaces.find((race) => normalize(race) === target)
  if (named) return named
  return records.find((r) => isPlayable(r) && (r.aliases ?? []).some((alias) => normalize(alias) === target))?.name ?? null
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
  for (const [name, delta] of adjustmentsOf(race)) (abilities[abilityKey[name]] as number) += delta
  c.abilities = abilities
  c.saves = { ...c.saves, spellResistance: raceRecord(race)?.spellResistance ?? null }
  const abilitiesText = specialAbilities(race)
  if (!c.racialAbilities && abilitiesText) c.racialAbilities = abilitiesText
  const movement = c.page2Movement ?? { base: '', jog: '', runX3: '', runX4: '', runX5: '', day: '' }
  const base = baseMovement(race)
  if (movement.base === '') c.page2Movement = { ...movement, base: base ?? '' }
}

/** Raça de um sexo só (variações por sexo, como "Bariaur (male)"); null = qualquer sexo. */
export function raceGender(race: RaceName): 'male' | 'female' | null {
  return raceRecord(race)?.gender ?? null
}

/** Nome da raça sem a marca de sexo: "Bariaur (female)" → "Bariaur". */
export const raceLabel = (race: RaceName) => raceRecord(race)?.label ?? race.replace(/ \((male|female)\)$/, '')

/** A variação da raça para o outro sexo ("Bariaur (male)" → "Bariaur (female)"); a mesma raça se ela não tiver variação. */
export function raceForGender(race: RaceName, gender: 'male' | 'female'): RaceName {
  const r = raceRecord(race)
  if (!r?.gender || r.gender === gender) return race
  const other = records.find((x) => isPlayable(x) && x.gender === gender && x.label === r.label)
  return other ? other.name : race
}

/** Raças que um personagem desse sexo pode ter (as variações do outro sexo saem). */
export function racesForGender(gender: 'male' | 'female' | null): RaceName[] {
  return allRaces.filter((race) => {
    const only = raceGender(race)
    return !gender || !only || only === gender
  })
}

/** Ajustes de atributo da raça, um por atributo (ex.: Dwarf → CON +1, CHA −1). */
export function raceAdjustments(race: RaceName): { ability: keyof AbilityScores; delta: number }[] {
  return adjustmentsOf(race).map(([name, delta]) => ({ ability: abilityKey[name], delta }))
}

/**
 * Troca de raça para o construtor (The Forge), onde se escolhe e troca à
 * vontade: desfaz os ajustes da raça anterior — e as habilidades raciais e o
 * movimento base que ela preencheu, se ainda forem os dela — antes de aplicar
 * a nova. O `applyRace` puro soma por cima (comportamento da ficha, igual ao iPad).
 */
export function replaceRace(c: PlayerCharacter, race: RaceName) {
  const previous = matchRace(c.race)
  if (previous === race) return
  if (previous) {
    const abilities = { ...c.abilities }
    for (const [name, delta] of adjustmentsOf(previous)) (abilities[abilityKey[name]] as number) -= delta
    c.abilities = abilities
    if (c.racialAbilities && c.racialAbilities === specialAbilities(previous)) c.racialAbilities = null
    if (c.page2Movement && c.page2Movement.base === baseMovement(previous)) c.page2Movement = { ...c.page2Movement, base: '' }
  }
  applyRace(c, race)
}

// --- Combinações de classe (multiclass.ts) -----------------------------------------------

/** Combinações de classe da raça (PHB; PWH; dado do livro): só as de classes do app (Illusionist conta). */
export function raceClassCombinations(race: RaceName): string[][] {
  return (raceRecord(race)?.classCombinations ?? []).filter((combo) => combo.every((cls) => comboClasses.has(cls)))
}

/** CBH cap. 3: multiclasse de bardo por raça, com os kits de cada combinação ("True" = True Bard). */
export function raceBardCombos(race: RaceName): { classes: string[]; kits: string[] }[] {
  return raceRecord(race)?.bardCombos ?? []
}

/**
 * Palavras com que o texto de requisito de raça de um kit cita a raça ("elf",
 * "elves"). Subraça: as da própria raça (a última palavra do nome: "drow") e as
 * da raça-base, então um kit "Elf" aceita Drow, Grey Elf e Athasian Elf.
 */
export function raceKitForms(race: RaceName): string[] {
  const r = raceRecord(race)
  if (!r) return []
  const words = normalizeWords(r.name)
  const own = r.kitForms ?? (words.length ? [words[words.length - 1], `${words[words.length - 1]}s`] : [])
  return [...new Set([...own, ...(baseRaceRecord(race) ? raceKitForms(baseRaceRecord(race)!.name) : [])])]
}

const normalizeWords = (text: string) => text.toLowerCase().replace(/\(.*?\)/g, '').split(/[^a-z]+/).filter(Boolean)

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
 * O kit aparece nos seletores (Forge e troca de kit na ficha)? Esconde o que os dados marcam
 * `playable: false` (raça ou classe que o app não tem, cenário fora do Forge, decisão pendente) e
 * os kits de cenário em construção (Al-Qadim, Council of Wyrms, Spelljammer), como `raceSelectable`
 * faz com as raças. `settings` = o filtro de cenários do Forge; sem ele (ficha), o cenário
 * da campanha só avisa e nunca esconde (decisão do usuário, 2026-10-17). `chosen` (o kit já
 * escolhido) continua à vista.
 */
export function kitSelectable(
  kit: { name: string; playable?: boolean | null; setting?: string | null },
  settings?: string[] | null,
  chosen?: string | null,
): boolean {
  if (kit.name === chosen) return true
  if (kit.playable === false) return false
  if (kit.setting && settingUnderConstruction(kit.setting)) return false
  return allowedBySettings(kit.setting, settings)
}

/**
 * O aviso do compêndio para um kit que o Forge e a ficha não oferecem ("Not offered in the Forge:
 * humanoid races are not playable", "Spelljammer: under construction"); null se é oferecido.
 * `reasons` = hiddenReasonLabel (data/kits.ts), passado para esta regra não importar dados.
 */
export function kitAvailabilityNote(
  kit: { playable?: boolean | null; hiddenReason?: string | null; setting?: string | null },
  reasons: Record<string, string>,
): string | null {
  if (kit.playable === false) return `Not offered in the Forge: ${reasons[kit.hiddenReason ?? 'undecided'] ?? 'hidden'}`
  if (kit.setting && settingUnderConstruction(kit.setting)) return `${kit.setting}: under construction`
  return null
}

// --- Proficiências bônus (kit, raça, tribo) ------------------------------------------------
//
// Decisões do usuário (2026-10-24): entram marcadas com a origem (`grantedBy`)
// e 0 slots (só as aplicadas daqui em diante; as fichas antigas ficam como
// estão); não duplicam o que o jogador já tem; saem quando a origem sai, mas
// a tela pergunta antes de tirar uma que já foi usada (marcada ou com notas).

type CompendiumProficiency = { id: string; name: string; mechanics?: { slotsRequired?: number } }

/** Proficiências bônus da raça. Complete Book of Dwarves: Endurance a 0 slots para anão (os dados: "0 Slots - Dwarf"); vem do dado (`bonusProficiencies`), inclusive nas subraças anãs. */
export function raceBonusProficiencies(race: RaceName | null): string[] {
  return [...(raceRecord(race)?.bonusProficiencies ?? [])]
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
