// Edições da ficha que carregam regra, portadas das telas do iPad
// (CharacterSheetView.swift) e de PlayerCharacter.applyDamage. Só funções
// puras; ficam fora dos componentes (ver o inventário de regras nas telas do
// iPad: A7 ferimentos, especialização, colunas do equipamento, seletores).

import type { AbilityScores, Page2EquipmentEntry, PlayerCharacter, ProficiencyEntry, WeaponEntry } from '../types/library.ts'

const newID = () => crypto.randomUUID().toUpperCase()

/**
 * PlayerCharacter.applyDamage: dano positivo sai inteiro dos PV atuais (o PV
 * temporário de efeitos já foi somado a eles ao ativar o efeito; aqui só se
 * desconta o que ainda resta em cada um) e "solta" as curas em reserva. Valor
 * negativo cura.
 */
export function applyDamage(c: Pick<PlayerCharacter, 'hitPointsCurrent' | 'activeEffects'>, amount: number) {
  if (amount <= 0) {
    c.hitPointsCurrent -= amount
    return
  }
  if (c.activeEffects) {
    let toAccount = amount
    for (const effect of c.activeEffects) {
      for (const component of effect.components) {
        if (toAccount === 0) break
        if (component.kind !== 'tempHP' || component.tempHPRemaining <= 0) continue
        const consumed = Math.min(toAccount, component.tempHPRemaining)
        component.tempHPRemaining -= consumed
        toAccount -= consumed
      }
      if (toAccount === 0) break
    }
    for (const effect of c.activeEffects) {
      for (const component of effect.components) {
        if (component.kind === 'bankedHeal' && component.healIsBanked) component.healIsBanked = false
      }
    }
  }
  c.hitPointsCurrent -= amount
}

/** WoundsBlock.commit (A7): desconta dos PV e acrescenta o ferimento à lista. Zero não conta. */
export function recordWound(c: Pick<PlayerCharacter, 'hitPointsCurrent' | 'activeEffects' | 'combat'>, amount: number) {
  if (!Number.isInteger(amount) || amount === 0) return
  applyDamage(c, amount)
  const existing = c.combat?.wounds ?? ''
  c.combat = { ...(c.combat ?? {}), wounds: existing === '' ? `${amount}` : `${existing}\n${amount}` }
}

/** WoundsBlock.clearAll: apaga a lista (os PV ficam como estão). */
export function clearWounds(c: Pick<PlayerCharacter, 'combat'>) {
  if (c.combat) c.combat = { ...c.combat, wounds: '' }
}

/**
 * WeaponFormRow.toggleSpecialization (só guerreiro Fighter mostra o botão):
 * ligar preenche os ajustes vazios do livro: arco ou besta, "+2*" de acerto
 * (point-blank); corpo a corpo, +1 de acerto e +2 de dano.
 */
export function toggleSpecialization(w: WeaponEntry) {
  w.isSpecialized = !(w.isSpecialized ?? false)
  if (!w.isSpecialized) return
  const name = w.name.toLowerCase()
  if (name.includes('bow') || name.includes('crossbow')) {
    if (w.thac0 === '') w.thac0 = '+2*'
  } else {
    if (w.thac0 === '') w.thac0 = '+1'
    if (!w.dmgAdj) w.dmgAdj = '+2'
  }
}

/** Page2EquipmentForm.leastFilledColumn: o item novo vai para a coluna com menos itens. */
export function leastFilledColumn(items: Pick<Page2EquipmentEntry, 'column'>[]): number {
  const count0 = items.filter((e) => (e.column ?? 0) === 0).length
  const count1 = items.filter((e) => (e.column ?? 0) === 1).length
  return count0 <= count1 ? 0 : 1
}

// --- Linhas novas a partir do compêndio (os seletores do iPad) ---------------------------

export function emptyWeapon(name = ''): WeaponEntry {
  return { id: newID(), name, attacks: '1', thac0: '', damageSmall: '', damageLarge: '', range: '—' }
}

/** WeaponPickerSheet.choose: a arma do compêndio preenche tamanho, tipo, velocidade, ataques, dano e alcance. */
export function weaponFromCompendium(w: {
  id: string
  name: string
  size?: string | null
  type?: string | null
  speedFactor: number
  attacksPerRound: string
  damageSmall?: string | null
  damageLarge?: string | null
  formattedRange: string | null
}): WeaponEntry {
  return {
    ...emptyWeapon(w.name),
    size: w.size ?? null,
    weaponType: w.type ?? null,
    speed: String(w.speedFactor),
    attacks: w.attacksPerRound,
    damageSmall: w.damageSmall ?? '',
    damageLarge: w.damageLarge ?? '',
    range: w.formattedRange ?? '—',
    matchedWeaponID: w.id,
  }
}

const abilityByName: Record<string, keyof AbilityScores> = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
}

/** ProficiencyPickerSheet.choose: nome, slots do livro e o teste sugerido (atributo + modificador). */
export function proficiencyFromCompendium(
  p: { id: string; name: string; mechanics: { slotsRequired: number; relevantAbility: string; checkModifier: number } },
  abilities: AbilityScores,
): ProficiencyEntry {
  const key = abilityByName[p.mechanics.relevantAbility]
  const score = key ? (abilities[key] as number) : undefined
  return {
    id: newID(),
    name: p.name,
    slots: p.mechanics.slotsRequired,
    checked: false,
    target: score === undefined ? null : String(score + p.mechanics.checkModifier),
    matchedProficiencyID: p.id,
  }
}
