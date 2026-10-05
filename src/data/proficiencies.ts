// Proficiências não-de-arma (schemas/proficiency.schema.json no thac0berry-data;
// Models/Proficiency.swift no iPad).

export interface Proficiency {
  id: string
  name: string
  primaryGroup: string
  campaignSettings: string[]
  mechanics: {
    groups: string[]
    slotsRequired: number
    rawSlots: string
    relevantAbility: string
    checkModifier: number
    rawModifier: string
    prerequisites: string[]
  }
  skillsAndPowers?: { subAbility?: string | null; characterPointCost?: number | null; baseRating: string } | null
  description: { briefSummary: string; fullText: string }
}

/** Ordem dos grupos (ProficiencyDatabase.groupOrder do iPad). */
export const proficiencyGroupOrder = ['General', 'Priest', 'Rogue', 'Warrior', 'Wizard', 'Psionicist', 'Racial / Special']

/** "Wis +1 · 1 slot" (Proficiency.mechanics.abbreviatedMechanics do iPad). */
export function abbreviatedMechanics(p: Proficiency): string {
  const parts: string[] = []
  const { relevantAbility, checkModifier, slotsRequired } = p.mechanics
  if (relevantAbility !== 'N/A') {
    const short = relevantAbility.slice(0, 3)
    parts.push(checkModifier === 0 ? short : `${short} ${checkModifier >= 0 ? '+' : ''}${checkModifier}`)
  }
  parts.push(slotsRequired === 1 ? '1 slot' : `${slotsRequired} slots`)
  return parts.join(' · ')
}

export function signedModifier(value: number): string {
  if (value === 0) return '0'
  return value > 0 ? `+${value}` : String(value)
}

/** Texto da regra opcional Skills & Powers, igual ao iPad. */
export function skillsAndPowersText(p: Proficiency): string | null {
  const sap = p.skillsAndPowers
  if (!sap) return null
  const parts: string[] = []
  if (sap.subAbility) parts.push(`sub-ability ${sap.subAbility}`)
  parts.push(`base rating ${sap.baseRating}`)
  if (sap.characterPointCost != null) parts.push(`${sap.characterPointCost} character points`)
  return parts.join(' · ')
}
