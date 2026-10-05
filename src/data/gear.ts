// Armas, armaduras e equipamento comum (schemas weapon/armor/mundane-item no
// thac0berry-data; Models/Weapon.swift, ArmorPiece.swift, MundaneItem.swift
// no iPad).

export interface Weapon {
  id: string
  name: string
  size?: string | null
  type?: string | null
  speedFactor: number
  attacksPerRound: string
  damageSmall?: string | null
  damageLarge?: string | null
  range?: { short?: string | null; medium?: string | null; long?: string | null } | null
  source?: string | null
}

export interface ArmorPiece {
  id: string
  name: string
  kind: 'armor' | 'helmet' | 'shield'
  baseAC?: number | null
  cost?: string | null
  weight?: string | null
}

export interface MundaneItem {
  id: string
  name: string
  category: string
  cost?: string | null
  weight?: string | null
}

/** "S/M/L" do alcance, como Weapon.formattedRange do iPad. */
export function formattedRange(weapon: Weapon): string | null {
  if (!weapon.range) return null
  const { short, medium, long } = weapon.range
  return `${short ?? '—'}/${medium ?? '—'}/${long ?? '—'}`
}

/** Grupos de arma por tipo de dano (WeaponCompendiumView do iPad). */
export function weaponTypeLabel(type: string | null | undefined): string {
  if (type === 'P') return 'Piercing'
  if (type === 'S') return 'Slashing'
  if (type === 'B') return 'Bludgeoning'
  return type ?? 'Unclassified'
}

export const armorKindLabel: Record<ArmorPiece['kind'], string> = {
  armor: 'Armor',
  helmet: 'Helmets',
  shield: 'Shields',
}

/** Ordem das categorias, igual ao MundaneItemCompendiumView do iPad. */
export const mundaneCategoryOrder = [
  'Miscellaneous Equipment',
  'Clothing',
  'Food & Lodging',
  'Household Provisioning',
  'Services',
  'Tack & Harness',
  'Transport',
]
