// Efeitos ativos (magias, poções e outros com duração), portados do iPad:
// Models/ActiveEffect.swift e as funções de efeito do PlayerCharacter
// (Models/Character.swift). Aplicar um efeito mexe nos números da ficha e
// guarda o valor anterior em cada componente; terminar desfaz. Só funções puras.

import type { ActiveEffect, EffectComponent, PlayerCharacter, SavingThrows } from '../types/library.ts'

type Character = PlayerCharacter
const newID = () => crypto.randomUUID().toUpperCase()

export const saveLabels: { id: string; label: string }[] = [
  { id: 'ppd', label: 'Paralyzation / Poison / Death' },
  { id: 'rsw', label: 'Rod / Staff / Wand' },
  { id: 'pp', label: 'Petrification / Polymorph' },
  { id: 'bw', label: 'Breath Weapon' },
  { id: 'sp', label: 'Spell' },
]

export const kindLabels: Record<EffectComponent['kind'], string> = {
  flatBonus: 'Flat Bonus',
  statOverride: 'Stat Override',
  attackNegation: 'Attack Negation',
  bankedHeal: 'Banked Heal',
  tempHP: 'Temporary HP',
  note: 'Note',
}

export const kindHints: Record<EffectComponent['kind'], string> = {
  flatBonus: 'e.g. Recitation: +3 To Hit (add a 2nd effect for +3 Saves)',
  statOverride: 'e.g. Potion of Giant Strength: Strength becomes 22',
  attackNegation: 'e.g. Stone Skin: negates the next N attacks',
  bankedHeal: 'e.g. Regenerate: heals once you next take damage',
  tempHP: 'e.g. extra HP added now, lost to damage never comes back',
  note: 'just a reminder, no automatic effect',
}

export const bonusTargetLabels: Record<EffectComponent['bonusTarget'], string> = {
  toHit: 'To Hit',
  allSaves: 'Saving Throws',
  armorClass: 'Armor Class',
  damage: 'Damage',
}

export const overrideStatLabels: Record<EffectComponent['overrideStat'], string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
  armorClass: 'Armor Class',
  thac0: 'THAC0',
}

/** EffectComponent novo, com os valores padrão do iPad. */
export function newComponent(): EffectComponent {
  return {
    id: newID(),
    kind: 'flatBonus',
    bonusTarget: 'toHit',
    bonusAmount: 0,
    overrideStat: 'strength',
    overrideValue: 0,
    previousValue: 0,
    usedCount: 0,
    maxUses: 1,
    healIsBanked: true,
    healWindowLabel: '6 hours',
    tempHPGranted: 0,
    tempHPRemaining: 0,
  }
}

export function newEffect(): ActiveEffect {
  return { id: newID(), name: '', durationLabel: '', notes: '', components: [newComponent()] }
}

/** effectiveSaveIDs: sem escolha, vale para todos os saves. */
const effectiveSaveIDs = (c: EffectComponent) => new Set(c.savingThrowIDs ?? saveLabels.map((s) => s.id))

/** EffectComponent.summary. */
export function componentSummary(c: EffectComponent): string {
  switch (c.kind) {
    case 'flatBonus': {
      const amount = c.bonusAmount >= 0 ? `+${c.bonusAmount}` : `${c.bonusAmount}`
      if (c.bonusTarget === 'allSaves') {
        const ids = effectiveSaveIDs(c)
        if (ids.size === saveLabels.length && saveLabels.every((s) => ids.has(s.id))) return `${amount} Saving Throws (all)`
        const names = saveLabels.filter((s) => ids.has(s.id)).map((s) => s.label)
        return `${amount} Saving Throws (${names.length === 0 ? 'none selected' : names.join(', ')})`
      }
      return `${amount} ${bonusTargetLabels[c.bonusTarget]}`
    }
    case 'statOverride':
      return `${overrideStatLabels[c.overrideStat]} → ${c.overrideValue}`
    case 'attackNegation':
      return `Negates ${c.maxUses} attack${c.maxUses === 1 ? '' : 's'}`
    case 'bankedHeal':
      return `Heals ${c.maxUses} HP (1/round once triggered)`
    case 'tempHP':
      return `+${c.tempHPGranted} temporary HP`
    case 'note':
      return 'Note'
  }
}

/** SavingThrows.setModifier: 0 apaga; sem entradas, `modifiers` some. */
function setSaveModifier(saves: SavingThrows, id: string, value: number) {
  const next = { ...(saves.modifiers ?? {}) }
  if (value === 0) delete next[id]
  else next[id] = value
  saves.modifiers = Object.keys(next).length === 0 ? null : next
}

type Stat = EffectComponent['overrideStat']

function readStat(c: Character, stat: Stat): number {
  if (stat === 'armorClass') return c.armorClass
  if (stat === 'thac0') return c.thac0
  return c.abilities[stat]
}

function writeStat(c: Character, stat: Stat, value: number) {
  if (stat === 'armorClass') c.armorClass = value
  else if (stat === 'thac0') c.thac0 = value
  else c.abilities = { ...c.abilities, [stat]: value }
}

/** applyComponent: aplica um componente e guarda o valor anterior nele. */
function applyComponent(c: Character, comp: EffectComponent, itemName: string) {
  switch (comp.kind) {
    case 'flatBonus':
      switch (comp.bonusTarget) {
        case 'toHit':
          // "+N para acertar" é "−N no THAC0".
          comp.previousValue = c.thac0
          c.thac0 -= comp.bonusAmount
          break
        case 'armorClass':
          comp.previousValue = c.armorClass
          c.armorClass -= comp.bonusAmount
          break
        case 'allSaves': {
          const saves = { ...c.saves }
          for (const s of saveLabels) if (effectiveSaveIDs(comp).has(s.id)) setSaveModifier(saves, s.id, (saves.modifiers?.[s.id] ?? 0) + comp.bonusAmount)
          c.saves = saves
          break
        }
        case 'damage': {
          // Não há um número de dano na ficha: vira uma linha lembrete em Damage Modifiers.
          const row = { id: newID(), name: itemName === '' ? 'Effect' : itemName, note: comp.bonusAmount >= 0 ? `+${comp.bonusAmount}` : `${comp.bonusAmount}` }
          c.damageModifiers = [...(c.damageModifiers ?? []), row]
          comp.appliedDamageRowID = row.id
          break
        }
      }
      break
    case 'statOverride':
      comp.previousValue = readStat(c, comp.overrideStat)
      writeStat(c, comp.overrideStat, comp.overrideValue)
      break
    case 'tempHP':
      comp.tempHPRemaining = comp.tempHPGranted
      c.hitPointsCurrent += comp.tempHPGranted
      break
    default:
      break
  }
}

/** revertComponent: desfaz o que o componente aplicou. */
function revertComponent(c: Character, comp: EffectComponent) {
  switch (comp.kind) {
    case 'flatBonus':
      switch (comp.bonusTarget) {
        case 'toHit':
          c.thac0 = comp.previousValue
          break
        case 'armorClass':
          c.armorClass = comp.previousValue
          break
        case 'allSaves': {
          const saves = { ...c.saves }
          for (const s of saveLabels) if (effectiveSaveIDs(comp).has(s.id)) setSaveModifier(saves, s.id, (saves.modifiers?.[s.id] ?? 0) - comp.bonusAmount)
          c.saves = saves
          break
        }
        case 'damage':
          c.damageModifiers = (c.damageModifiers ?? []).filter((row) => row.id !== comp.appliedDamageRowID)
          break
      }
      break
    case 'statOverride':
      writeStat(c, comp.overrideStat, comp.previousValue)
      break
    case 'tempHP':
      c.hitPointsCurrent -= comp.tempHPRemaining
      break
    default:
      break
  }
}

/** applyActiveEffect + addActiveEffect: efeito novo entra já aplicado. */
export function addEffect(c: Character, effect: ActiveEffect) {
  const applied = structuredClone(effect)
  for (const comp of applied.components) applyComponent(c, comp, applied.name)
  c.activeEffects = [...(c.activeEffects ?? []), applied]
}

/** endActiveEffect: desfaz e tira da lista. */
export function endEffect(c: Character, effectID: string) {
  const effect = c.activeEffects?.find((e) => e.id === effectID)
  if (!effect) return
  for (const comp of effect.components) revertComponent(c, comp)
  c.activeEffects = (c.activeEffects ?? []).filter((e) => e.id !== effectID)
}

/**
 * saveEditedActiveEffect: editar um efeito em curso. Componente removido é
 * desfeito; os que ficam são desfeitos e reaplicados com os valores novos; o
 * PV temporário só ajusta pela diferença (o que já foi perdido não volta).
 */
export function saveEditedEffect(c: Character, edited: ActiveEffect) {
  const old = c.activeEffects?.find((e) => e.id === edited.id)
  if (!old) return
  const next = structuredClone(edited)
  const oldByID = new Map(old.components.map((comp) => [comp.id, comp]))
  const newIDs = new Set(next.components.map((comp) => comp.id))
  for (const comp of old.components) if (!newIDs.has(comp.id)) revertComponent(c, comp)
  for (const comp of next.components) {
    const previous = oldByID.get(comp.id)
    if (previous) revertComponent(c, previous)
    if (comp.kind === 'flatBonus' || comp.kind === 'statOverride') {
      applyComponent(c, comp, next.name)
    } else if (comp.kind === 'tempHP') {
      const prevRemaining = previous?.kind === 'tempHP' ? previous.tempHPRemaining : 0
      const prevGranted = previous?.kind === 'tempHP' ? previous.tempHPGranted : 0
      const remaining = Math.max(0, Math.min(comp.tempHPGranted, prevRemaining + comp.tempHPGranted - prevGranted))
      comp.tempHPRemaining = remaining
      c.hitPointsCurrent += remaining
    }
  }
  c.activeEffects = (c.activeEffects ?? []).map((e) => (e.id === next.id ? next : e))
}

function updateComponent(c: Character, effectID: string, componentID: string, change: (comp: EffectComponent) => void) {
  c.activeEffects = (c.activeEffects ?? []).map((e) =>
    e.id !== effectID ? e : { ...e, components: e.components.map((comp) => (comp.id === componentID ? (change(comp), comp) : comp)) },
  )
}

/** Ataque negado (Stone Skin): conta um uso a mais ou a menos, entre 0 e o máximo. */
export function adjustUses(c: Character, effectID: string, componentID: string, delta: number) {
  updateComponent(c, effectID, componentID, (comp) => {
    comp.usedCount = Math.min(Math.max(comp.usedCount + delta, 0), comp.maxUses)
  })
}

/** Cura em reserva: ativar à mão (o personagem tomou dano). */
export function activateBankedHeal(c: Character, effectID: string, componentID: string) {
  updateComponent(c, effectID, componentID, (comp) => void (comp.healIsBanked = false))
}

/** A8: cada ponto curado na rodada soma 1 PV (até o máximo); desfazer tira 1 PV. */
export function logBankedHeal(c: Character, effectID: string, componentID: string, delta: 1 | -1) {
  const comp = c.activeEffects?.find((e) => e.id === effectID)?.components.find((x) => x.id === componentID)
  if (!comp) return
  if (delta > 0) {
    if (comp.usedCount >= comp.maxUses) return
    updateComponent(c, effectID, componentID, (x) => void (x.usedCount += 1))
    c.hitPointsCurrent = Math.min(c.hitPointsMax, c.hitPointsCurrent + 1)
  } else {
    if (comp.usedCount <= 0) return
    updateComponent(c, effectID, componentID, (x) => void (x.usedCount -= 1))
    c.hitPointsCurrent -= 1
  }
}
