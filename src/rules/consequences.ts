// Motor de consequências, portado do iPad (Store/ConsequenceEngine.swift e
// as funções de "retrato" do PlayerCharacter em Models/Character.swift).
//
// A ficha guarda um retrato do último estado revisado (lastAppliedLevel,
// lastAppliedAbilities, lastAppliedClass). Mudou nível, atributo ou classe:
// a diferença entre o retrato e o estado atual vira a lista "What Changes",
// e o jogador aplica as mudanças automáticas (ou só fecha, se não houver).
// Só funções puras sobre a ficha.
//
// Diferença intencional do iPad: aplicar os saves preserva os modificadores
// e a resistência a magia digitados pelo jogador (no iPad, o bloco inteiro é
// trocado e esses dois campos se perdem; bug registrado no TODO.md de lá).

import type { AbilityScores, CharacterClass, ClassLevel, PlayerCharacter, SavingThrows } from '../types/library.ts'
import {
  canonicalClass,
  hitDieType,
  refreshLevelChanges,
  resolveRule,
  rulesData,
  xpNeededForNextLevel,
  xpRequired,
  type AbilityDetailKey,
  type RuleContext,
  type RuleKey,
  type RuleValue,
} from './rules.ts'

export type ConsequenceKind = 'autoApplicable' | 'alreadyAutomatic'

export interface ConsequenceItem {
  id: RuleKey
  label: string
  oldValue: RuleValue | null
  newValue: RuleValue | null
  sourceRuleID: string | null
  kind: ConsequenceKind
}

const abilityLabels: Record<AbilityDetailKey, string> = {
  strengthHit: 'Strength — Hit Probability (Table 1)',
  strengthDamage: 'Strength — Damage Adjustment (Table 1)',
  strengthWeight: 'Strength — Weight Allowance (Table 1)',
  strengthMaxPress: 'Strength — Maximum Press (Table 1)',
  strengthDoors: 'Strength — Open Doors (Table 1)',
  strengthBars: 'Strength — Bend Bars/Lift Gates (Table 1)',
  dexterityReaction: 'Dexterity — Reaction Adjustment (Table 2)',
  dexterityMissile: 'Dexterity — Missile Attack Adjustment (Table 2)',
  dexterityDefense: 'Dexterity — Defensive Adjustment (Table 2)',
  constitutionHP: 'Constitution — Hit Point Adjustment (Table 3)',
  constitutionShock: 'Constitution — System Shock (Table 3)',
  constitutionResurrection: 'Constitution — Resurrection Survival (Table 3)',
  constitutionPoison: 'Constitution — Poison Save (Table 3)',
  intelligenceLanguages: 'Intelligence — Number of Languages (Table 4)',
  intelligenceMaxLevel: 'Intelligence — Max Spell Level (Table 4)',
  intelligenceLearn: 'Intelligence — Chance to Learn Spell (Table 4)',
  intelligenceMaxPerLevel: 'Intelligence — Max Spells per Level (Table 4)',
  wisdomDefense: 'Wisdom — Magical Defense Adjustment (Table 5)',
  wisdomFailure: 'Wisdom — Spell Failure (Table 5)',
  wisdomBonusSpells: 'Wisdom — Bonus Spells (Table 5)',
  charismaHenchmen: 'Charisma — Maximum Henchmen (Table 6)',
  charismaLoyalty: 'Charisma — Loyalty Base (Table 6)',
  charismaReaction: 'Charisma — Reaction Adjustment (Table 6)',
}

const abilityRuleID = (key: AbilityDetailKey) => `phb_ch01_${key.match(/^[a-z]+/)![0]}`

/** ConsequenceEngine.trackedRules, na mesma ordem. */
const trackedRules: { key: RuleKey; kind: ConsequenceKind; label: string; ruleID: string | null }[] = [
  { key: 'thac0', kind: 'autoApplicable', label: 'THAC0 by Level (Table 53)', ruleID: rulesData.thac0.sourceRuleID },
  { key: 'savingThrows', kind: 'autoApplicable', label: 'Saving Throws by Level (Table 60)', ruleID: rulesData.savingThrows.sourceRuleID },
  { key: 'priestSpellSlots', kind: 'alreadyAutomatic', label: 'Priest Spell Slots per Level (Table 24)', ruleID: 'phb_ch03_priest_tables' },
  { key: 'wizardSpellSlots', kind: 'alreadyAutomatic', label: 'Wizard Spell Slots per Level (Table 21)', ruleID: 'phb_ch03_wizard_tables' },
  ...(Object.keys(abilityLabels) as AbilityDetailKey[]).map((key) => ({
    key,
    kind: 'autoApplicable' as const,
    label: abilityLabels[key],
    ruleID: abilityRuleID(key),
  })),
]

const same = (a: RuleValue | null, b: RuleValue | null) => JSON.stringify(a) === JSON.stringify(b)

/** ConsequenceEngine.diff: regras rastreadas cujo valor mudou entre os dois estados. */
export function diffConsequences(old: RuleContext, next: RuleContext): ConsequenceItem[] {
  const items: ConsequenceItem[] = []
  for (const rule of trackedRules) {
    const oldValue = resolveRule(rule.key, old)
    const newValue = resolveRule(rule.key, next)
    if (same(oldValue, newValue)) continue
    // Psionicist (feito primeiro na web): THAC0 e saves vêm das Tabelas 7 e 8 do CPsiH.
    const psionic = canonicalClass(next.characterClass) === 'Psionicist' && (rule.key === 'thac0' || rule.key === 'savingThrows')
    const label = psionic ? (rule.key === 'thac0' ? 'THAC0 by Level (CPsiH Table 7)' : 'Saving Throws by Level (CPsiH Table 8)') : rule.label
    const ruleID = psionic ? 'cpsih_ch01_special_abilities' : rule.ruleID
    items.push({ id: rule.key, label, oldValue, newValue, sourceRuleID: ruleID, kind: rule.kind })
  }
  return items
}

/** RuleValue.displaySummary do iPad. */
export function displaySummary(value: RuleValue | null): string {
  if (value === null) return '—'
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (Array.isArray(value)) {
    const parts = value.flatMap((count, index) => (count > 0 ? [`${count}× circle ${index + 1}`] : []))
    return parts.length === 0 ? 'no spells yet' : parts.join(', ')
  }
  const s = value as SavingThrows
  return `PPD ${s.paralyzationPoisonDeath} · RSW ${s.rodStaffWand} · PP ${s.petrificationPolymorph} · BW ${s.breathWeapon} · Sp ${s.spell}`
}

// --- Retrato do último estado revisado -------------------------------------------

type Snapshot = Pick<
  PlayerCharacter,
  | 'level'
  | 'abilities'
  | 'characterClass'
  | 'lastAppliedLevel'
  | 'lastAppliedAbilities'
  | 'lastAppliedClass'
  | 'multiClasses'
  | 'lastAppliedMultiClasses'
  | 'formerClasses'
  | 'lastAppliedFormerClasses'
>

export function currentRuleContext(c: Snapshot): RuleContext {
  return { level: c.level, characterClass: c.characterClass, abilities: c.abilities, multiClasses: c.multiClasses ?? null, formerClasses: c.formerClasses ?? null }
}

export function lastAppliedRuleContext(c: Snapshot): RuleContext | null {
  if (c.lastAppliedLevel == null || !c.lastAppliedAbilities) return null
  return {
    level: c.lastAppliedLevel,
    characterClass: c.lastAppliedClass ?? c.characterClass,
    abilities: c.lastAppliedAbilities,
    // Retrato sem o campo (ficha de antes da multiclasse) = as classes de agora.
    multiClasses: c.lastAppliedMultiClasses === undefined ? (c.multiClasses ?? null) : c.lastAppliedMultiClasses,
    formerClasses: c.lastAppliedFormerClasses === undefined ? (c.formerClasses ?? null) : c.lastAppliedFormerClasses,
  }
}

/** As outras classes de um multiclasse, comparáveis (ausente e vazio contam igual). */
const sameMultiClasses = (a: Snapshot['multiClasses'], b: Snapshot['multiClasses']) =>
  JSON.stringify((a ?? []).map((k) => [canonicalClass(k.characterClass), k.level])) ===
  JSON.stringify((b ?? []).map((k) => [canonicalClass(k.characterClass), k.level]))

const sameAbilities = (a: AbilityScores, b: AbilityScores) =>
  a.strength === b.strength &&
  (a.exceptionalStrength ?? null) === (b.exceptionalStrength ?? null) &&
  a.dexterity === b.dexterity &&
  a.constitution === b.constitution &&
  a.intelligence === b.intelligence &&
  a.wisdom === b.wisdom &&
  a.charisma === b.charisma

export function hasPendingConsequences(c: Snapshot): boolean {
  if (c.lastAppliedLevel == null || !c.lastAppliedAbilities) return false
  const classChanged = c.lastAppliedClass != null && canonicalClass(c.lastAppliedClass) !== canonicalClass(c.characterClass)
  const multiChanged = c.lastAppliedMultiClasses !== undefined && !sameMultiClasses(c.lastAppliedMultiClasses, c.multiClasses)
  const formerChanged = c.lastAppliedFormerClasses !== undefined && !sameMultiClasses(c.lastAppliedFormerClasses, c.formerClasses)
  return c.lastAppliedLevel !== c.level || !sameAbilities(c.lastAppliedAbilities, c.abilities) || classChanged || multiChanged || formerChanged
}

export function pendingConsequences(c: Snapshot): ConsequenceItem[] {
  const old = lastAppliedRuleContext(c)
  return old ? diffConsequences(old, currentRuleContext(c)) : []
}

/** markConsequencesReviewed: o estado atual vira o novo retrato. */
export function markConsequencesReviewed(c: Snapshot) {
  c.lastAppliedLevel = c.level
  c.lastAppliedAbilities = { ...c.abilities }
  c.lastAppliedClass = c.characterClass
  // Só grava o retrato de multiclasse quando há multiclasse (ficha de classe
  // única fica exatamente como antes).
  if ((c.multiClasses ?? []).length > 0 || c.lastAppliedMultiClasses != null) {
    c.lastAppliedMultiClasses = (c.multiClasses ?? []).map((k) => ({ ...k }))
  }
  if ((c.formerClasses ?? []).length > 0 || c.lastAppliedFormerClasses != null) {
    c.lastAppliedFormerClasses = (c.formerClasses ?? []).map((k) => ({ ...k }))
  }
}

/** ensureConsequenceSnapshotInitialized: ficha sem retrato ganha um com o estado atual. */
export function ensureConsequenceSnapshot(c: Snapshot) {
  if (c.lastAppliedClass == null && c.lastAppliedLevel != null) c.lastAppliedClass = c.characterClass
  if (c.lastAppliedLevel == null && c.lastAppliedAbilities == null) markConsequencesReviewed(c)
}

/** ConsequenceEngine.applyAutomatic (os itens "auto-updates" já mudam sozinhos). */
export function applyAutomatic(items: ConsequenceItem[], c: PlayerCharacter) {
  for (const item of items) {
    if (item.kind !== 'autoApplicable' || item.newValue === null) continue
    if (item.id === 'thac0' && typeof item.newValue === 'number') {
      c.thac0 = item.newValue
    } else if (item.id === 'savingThrows' && typeof item.newValue === 'object' && !Array.isArray(item.newValue)) {
      const next = item.newValue as SavingThrows
      // Preserva o que o jogador digitou (ver o topo do arquivo).
      c.saves = { ...next, modifiers: c.saves.modifiers ?? null, spellResistance: c.saves.spellResistance ?? null }
    } else if (typeof item.newValue === 'string') {
      ;(c.details as unknown as Record<string, string>)[item.id] = item.newValue
    }
  }
}

// --- Mudanças que disparam consequências --------------------------------------------

/** refreshXPNeededNextLevel: grava o XP do próximo nível quando a tabela tem (até o 20). */
function refreshXPNeeded(c: PlayerCharacter) {
  const text = xpNeededForNextLevel(c.level, c.characterClass)
  if (text !== null && c.xpNeededNextLevel !== text) c.xpNeededNextLevel = text
}

/**
 * Multiclasse (MC2): troca as outras classes (lista nova). Passa pelo motor
 * de consequências como uma troca de nível ou de classe: THAC0, saves e magia
 * ficam pendentes até o jogador revisar. Lista vazia = volta a classe única.
 */
export function setMultiClasses(c: PlayerCharacter, multiClasses: ClassLevel[]) {
  ensureConsequenceSnapshot(c)
  // Primeiro multiclasse da ficha: o retrato guarda o estado de antes (classe única).
  if (c.lastAppliedMultiClasses === undefined) c.lastAppliedMultiClasses = (c.multiClasses ?? []).map((k) => ({ ...k }))
  c.multiClasses = multiClasses.length ? multiClasses.map((k) => ({ ...k })) : null
  // Dado de vida "d10/d4" quando não foi escrito à mão (o padrão segue as classes).
  const dice = [c.characterClass, ...multiClasses.map((k) => k.characterClass)].map((k) => hitDieType(k)).join('/')
  const current = c.combat?.hitDiceType
  if (!current || /^d\d+(\/d\d+)*$/.test(current)) c.combat = { ...(c.combat ?? {}), hitDiceType: dice }
}

/** Multiclasse: muda o nível de uma das outras classes. */
export function setMultiClassLevel(c: PlayerCharacter, index: number, level: number) {
  const list = (c.multiClasses ?? []).map((k, i) => (i === index ? { ...k, level } : { ...k }))
  setMultiClasses(c, list)
}

/** Mudar o nível (onChange de `level` no cabeçalho do iPad). */
export function setLevel(c: PlayerCharacter, level: number) {
  ensureConsequenceSnapshot(c)
  c.level = level
  refreshXPNeeded(c)
  refreshLevelChanges(c)
}

export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

export function setAbility(c: PlayerCharacter, key: AbilityKey, value: number) {
  ensureConsequenceSnapshot(c)
  c.abilities = { ...c.abilities, [key]: value }
}

/**
 * Trocar a classe (ClassPicker.select do iPad): XP do próximo nível, dado de
 * vida e Level Changes recalculados; mago novo ganha "Read Magic" no grimório.
 * `readMagic` vem do compêndio (id e nome), buscado por quem chama.
 * A primeira folha de magia, que o iPad cria aqui para quem não tem nenhuma,
 * entra com a edição das folhas (W2.5c).
 */
export function setClass(c: PlayerCharacter, characterClass: CharacterClass, readMagic: { id: string; name: string } | null) {
  ensureConsequenceSnapshot(c)
  c.characterClass = characterClass
  refreshXPNeeded(c)
  const die = hitDieType(characterClass)
  if (c.combat?.hitDiceType !== die) c.combat = { ...(c.combat ?? {}), hitDiceType: die }
  refreshLevelChanges(c, true)
  if (canonicalClass(characterClass) === 'Mage' && c.wizardSpellbook.length === 0) {
    c.wizardSpellbook = [
      readMagic
        ? { id: crypto.randomUUID().toUpperCase(), name: readMagic.name, matchedSpellID: readMagic.id, level: null }
        : { id: crypto.randomUUID().toUpperCase(), name: 'Read Magic', matchedSpellID: null, level: 1 },
    ]
  }
}

// --- Classe dupla (MC4, docs/multiclasse.md) ------------------------------------------

/** Troca a lista de classes anteriores (edição à mão). Passa pelo motor de consequências. */
export function setFormerClasses(c: PlayerCharacter, formerClasses: ClassLevel[]) {
  ensureConsequenceSnapshot(c)
  if (c.lastAppliedFormerClasses === undefined) c.lastAppliedFormerClasses = (c.formerClasses ?? []).map((k) => ({ ...k }))
  c.formerClasses = formerClasses.length ? formerClasses.map((k) => ({ ...k })) : null
}

/**
 * Troca de classe dupla (PHB cap. 3): a classe atual congela no nível dela e
 * vai para as anteriores; a nova começa no nível 1 com 0 XP (decisão 14). HP
 * fica como está. THAC0, saves e magia ficam pendentes até o jogador revisar.
 */
export function dualClassSwitch(c: PlayerCharacter, next: CharacterClass, readMagic: { id: string; name: string } | null) {
  setFormerClasses(c, [...(c.formerClasses ?? []), { characterClass: c.characterClass, level: c.level }])
  setClass(c, next, readMagic)
  c.experience = 0
  setLevel(c, 1)
}

/**
 * Troca livre de classe (o seletor do cabeçalho; ajuste 5, 2026-10-10): além
 * do setClass, tira o kit — ele era da classe anterior. A troca de classe
 * dupla não passa por aqui: lá o kit fica (CFH, CTH, CPrH).
 */
export function changeClass(c: PlayerCharacter, characterClass: CharacterClass, readMagic: { id: string; name: string } | null) {
  setClass(c, characterClass, readMagic)
  if (c.kit) c.kit = null
}

/** "Undo dual-class" só enquanto a classe nova está no nível 1 com 0 XP. */
export function canUndoDualClass(c: Pick<PlayerCharacter, 'level' | 'experience' | 'formerClasses'>): boolean {
  return (c.formerClasses ?? []).length > 0 && c.level === 1 && c.experience === 0
}

/** Desfaz a última troca: volta à classe anterior, no nível dela, com o XP mínimo desse nível. */
export function undoDualClass(c: PlayerCharacter) {
  const former = c.formerClasses ?? []
  const last = former[former.length - 1]
  if (!last) return
  setFormerClasses(c, former.slice(0, -1))
  setClass(c, last.characterClass, null)
  setLevel(c, last.level)
  c.experience = xpRequired(last.level, last.characterClass) ?? 0
}
