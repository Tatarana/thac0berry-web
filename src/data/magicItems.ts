// Itens mágicos (schemas/magic-item.schema.json no thac0berry-data;
// Models/MagicItem.swift e Store/MagicItemDatabase.swift no iPad).
import { loadData } from './load'

export interface MagicItemIndexEntry {
  id: string
  name: string
  category: string
  books: string[]
  summary: string
  file: string
}

export interface SpellRef {
  id: string
  name: string
  class: string
}

export interface MagicItem {
  id: string
  name: string
  classification: { broadCategory: string; specificType: string }
  economyAndXP: { xpValue?: number | null; goldValue?: number | null; rawXP?: string | null; rawValue?: string | null }
  description: { briefSummary: string; fullText: string }
  sources?: { book?: string | null; page?: string | null }[]
  categories?: string[]
  campaignSettings?: string[]
  defenseBonus?: {
    acBonus?: number | null
    savingThrowBonus?: number | null
    magicResistance?: number | null
    abilityScoreBonus?: Record<string, number> | null
    hitPointBonus?: number | null
    attackBonus?: number | null
    resistances: string[]
    regenerates: boolean
  } | null
  enchantment?: { attackBonus?: number | null; damageBonus?: number | null } | null
  power?: { name?: string | null; chargeBased?: boolean | null; maxCharges?: number | null; spell?: SpellRef | null } | null
  containsSpells?: SpellRef[]
}

/** Ordem das categorias (MagicItemDatabase.categoryOrder do iPad). */
export const magicCategoryOrder = ['Miscellaneous', 'Weapon', 'Potion/Oil', 'Rod/Staff/Wand', 'Scroll/Book', 'Ring', 'Armor/Shield']

/** Grupos de fonte (MagicItemSourceGroup do iPad), na ordem dos chips. */
export const sourceGroups = [
  'Encyclopedia Magica',
  'Dragon Magazine',
  'Polyhedron Newszine',
  'Trading Cards',
  'Basic D&D (non-AD&D)',
  'Other Sourcebooks',
  'Unknown Source',
] as const

export type SourceGroup = (typeof sourceGroups)[number]

const basicDnDPrefixes = [
  'Dungeons & Dragons Rules Cyclopedia',
  'Dungeons & Dragons Basic Set',
  'Dungeons & Dragons Expert Set',
  'Dungeons & Dragons Companion Set',
  'Dungeons & Dragons Master Set',
  'Dungeons & Dragons Immortals Set',
]

export function groupForBook(book: string | null | undefined): SourceGroup {
  if (!book) return 'Unknown Source'
  if (book === 'Encyclopedia Magica') return 'Encyclopedia Magica'
  if (book.startsWith('Dragon Magazine')) return 'Dragon Magazine'
  if (book.startsWith('Polyhedron Newszine')) return 'Polyhedron Newszine'
  if (book.includes('Trading Cards')) return 'Trading Cards'
  if (basicDnDPrefixes.some((prefix) => book.startsWith(prefix))) return 'Basic D&D (non-AD&D)'
  return 'Other Sourcebooks'
}

/** Todos os grupos que o item toca; sem fonte = "Unknown Source". */
export function groupsFor(item: MagicItemIndexEntry): Set<SourceGroup> {
  if (item.books.length === 0) return new Set(['Unknown Source'])
  return new Set(item.books.map(groupForBook))
}

export const loadMagicIndex = () => loadData<MagicItemIndexEntry[]>('magic-index.json')

export async function loadMagicItem(entry: MagicItemIndexEntry): Promise<MagicItem | undefined> {
  const list = await loadData<MagicItem[]>(`magic/${entry.file}`)
  return list.find((item) => item.id === entry.id)
}
