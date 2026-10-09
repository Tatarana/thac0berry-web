// Tabelas rápidas do Combat Tracker (CT4, docs/controle-de-combate.md): a
// faixa de tabelas de combate do DMG, que o DM ajusta (tira, põe qualquer
// tabela do Table Grimoire, volta ao padrão). Só funções puras; os títulos
// vêm dos dados.

import type { GrimoireTable } from './tableIndex.ts'

/** Lista padrão: as tabelas de combate do DMG (cap. 9 e encontros do cap. 11). */
export const defaultQuickTables = [
  'dmg-35', // Combat Modifiers
  'dmg-36', // Weapon Type vs. Armor Modifiers
  'dmg-39', // Creature THAC0
  'dmg-40', // Standard Modifiers to Initiative
  'dmg-41', // Optional Modifiers to Initiative
  'dmg-43', // Punching and Wrestling Results
  'dmg-44', // Cover and Concealment Modifiers
  'dmg-46', // Character Saving Throws
  'dmg-47', // Turning Undead
  'dmg-48', // Hit Dice vs. Immunity
  'dmg-49', // Morale Ratings
  'dmg-50', // Situational Modifiers (moral)
  'dmg-51', // Poison Strength
  'dmg-57', // Surprise Modifiers
  'dmg-58', // Encounter Distance
  'dmg-59', // Encounter Reactions
]

/** A lista do DM (null/ausente = a padrão). */
export const quickTableIDs = (saved: string[] | null | undefined) => saved ?? defaultQuickTables

/** As tabelas da faixa, na ordem da lista; ids que não existem nos dados ficam de fora. */
export function resolveQuickTables(ids: string[], tables: GrimoireTable[]): GrimoireTable[] {
  const byID = new Map(tables.map((t) => [t.id, t]))
  return ids.flatMap((id) => byID.get(id) ?? [])
}

/** Põe no fim (sem repetir) ou tira; devolve null quando a lista volta a ser igual à padrão. */
export function toggleQuickTable(saved: string[] | null | undefined, id: string): string[] | null {
  const ids = quickTableIDs(saved)
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  return sameList(next, defaultQuickTables) ? null : next
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/** Nomes curtos das tabelas padrão (a faixa cabe em uma ou duas linhas); o título completo fica no tooltip e na janela. */
const shortNames: Record<string, string> = {
  'dmg-35': 'Combat mods',
  'dmg-36': 'Weapon vs armor',
  'dmg-39': 'Creature THAC0',
  'dmg-40': 'Init mods',
  'dmg-41': 'Init optional',
  'dmg-43': 'Punch & wrestle',
  'dmg-44': 'Cover',
  'dmg-46': 'Saves',
  'dmg-47': 'Turn undead',
  'dmg-48': 'HD vs immunity',
  'dmg-49': 'Morale',
  'dmg-50': 'Morale mods',
  'dmg-51': 'Poison',
  'dmg-57': 'Surprise',
  'dmg-58': 'Distance',
  'dmg-59': 'Reactions',
}

/** Rótulo do chip: "35 Combat mods" nas padrão; nas outras, o título dos dados ("CFH 12 Fighter Kits"). */
export function quickTableLabel(t: Pick<GrimoireTable, 'id' | 'book' | 'number' | 'title'>): string {
  const number = t.number ? `${t.number} ` : ''
  if (shortNames[t.id]) return `${number}${shortNames[t.id]}`
  return t.book === 'DMG' ? `${number}${t.title}` : `${t.book} ${number}${t.title}`
}
