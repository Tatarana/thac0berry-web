// Monstros (ferramenta do DM): schemas/monster.schema.json e
// monster-index.schema.json no thac0berry-data. Só a web usa.
import { loadData } from './load'

export interface MonsterIndexEntry {
  id: string
  name: string
  collection: string
  variants: number
  climateTerrain?: string | null
  frequency?: string | null
  hitDice?: string | null
  hitDiceMin?: number | null
  hitDiceMax?: number | null
  xpMin?: number | null
  xpMax?: number | null
  summary?: string | null
  aliases: string[]
  file: string
}

export interface Stat {
  text: string
  value: number | null
}

export interface MonsterVariant {
  name: string
  source: string | null
  note?: string
  extra?: Record<string, string>
  ecology: Partial<Record<EcologyField, string>>
  combat: Partial<Record<TextCombatField, string>> & Partial<Record<StatField, Stat>>
}

export interface Monster {
  id: string
  name: string
  aliases: string[]
  collection: string
  sources: { book: string; page?: string | number | null }[]
  variants: MonsterVariant[]
  description: { summary: string | null; sections: Record<string, string>; fullText: string | null }
  categories: string[]
}

export type EcologyField = 'climateTerrain' | 'frequency' | 'organization' | 'activityCycle' | 'diet' | 'intelligence' | 'treasure' | 'alignment'
export type StatField = 'armorClass' | 'hitDice' | 'thac0' | 'xp'
export type TextCombatField =
  | 'numberAppearing'
  | 'movement'
  | 'attacks'
  | 'damage'
  | 'specialAttacks'
  | 'specialDefenses'
  | 'magicResistance'
  | 'size'
  | 'morale'

export function loadMonsterIndex(): Promise<MonsterIndexEntry[]> {
  return loadData<MonsterIndexEntry[]>('monsters-index.json')
}

export async function loadMonster(entry: Pick<MonsterIndexEntry, 'id' | 'file'>): Promise<Monster> {
  const list = await loadData<Monster[]>(`monsters/${entry.file}`)
  const found = list.find((m) => m.id === entry.id)
  if (!found) throw new Error(`${entry.id} not found in ${entry.file}`)
  return found
}
