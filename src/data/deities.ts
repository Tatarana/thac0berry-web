// Divindades (schemas/deity.schema.json no thac0berry-data; Models/Deity.swift
// no iPad): Faiths & Avatars e Powers & Pantheons (Forgotten Realms) e, desde
// 2026-10-13, os deuses de Krynn do Tales of the Lance (Dragonlance). Desde
// 2026-11 também os panteões do Legends & Lore, do Monster Mythology e do
// Dragon Magazine (pantheon, forgeSelectable e race, todos opcionais).
import { normalize } from '../lib/search.ts'

export interface Deity {
  id: string
  name: string
  book: string
  bookCode: string
  /** Pode vir nulo nos registros novos. */
  rank?: string | null
  plane?: string | null
  alignment?: string | null
  status?: string | null
  /** Pode vir vazio nos registros novos. */
  portfolio: string
  aliases?: string | null
  domainName?: string | null
  superior?: string | null
  allies?: string | null
  foes?: string | null
  symbol?: string | null
  worshiperAlignments?: string | null
  avatarClassLevels?: string | null
  avatarDescription?: string | null
  briefSummary: string
  fullText: string
  categories: string[]
  /** Panteão ("Faerûnian", "Greek", "Dwarven"…); ausente nos dados antigos. */
  pantheon?: string
  /** Ausente = true; false = só no compêndio (o Forge nunca oferece). */
  forgeSelectable?: boolean
  /** Raça-base (id, "dwarf") dos deuses semi-humanos. */
  race?: string
}

/** Ordem dos grupos por posto, igual ao DeityCompendiumView do iPad. */
export const rankOrder = ['Over-power', 'Greater Power', 'Intermediate Power', 'Lesser Power', 'Demipower', 'Other']

/** Posto divino do grupo; o TotL diz "Greater God", o FA "Greater Power": mesmo grupo. */
export function rankGroup(rank: string | null | undefined): string {
  const god = /^(Greater|Intermediate|Lesser) God(?:dess)?$/.exec(rank ?? '')
  const name = god ? `${god[1]} Power` : rank === 'Demigod' ? 'Demipower' : rank
  return name && rankOrder.includes(name) ? name : 'Other'
}

/** Livros na ordem em que aparecem nos dados (filtro do compêndio). */
export const deityBooks = (deities: Pick<Deity, 'book'>[]) => [...new Set(deities.map((d) => d.book))]

const settingBooks = ['Faiths & Avatars', 'Powers & Pantheons', 'Tales of the Lance']

/** O panteão da divindade; nos dados antigos, deduzido do livro. */
export function pantheonOf(deity: Pick<Deity, 'pantheon' | 'book'>): string {
  if (deity.pantheon) return deity.pantheon
  return deity.book === 'Tales of the Lance' ? 'Dragonlance' : settingBooks.includes(deity.book) ? 'Faerûnian' : deity.book
}

/** O Forge oferece esta divindade como patrono? (ausente = sim). */
export const isForgeSelectable = (deity: Pick<Deity, 'forgeSelectable'>) => deity.forgeSelectable !== false

/** Grupos de panteões do filtro do compêndio, na ordem de exibição. */
export const pantheonGroupOrder = ['Campaign settings', 'Demihuman', 'Legends & Lore', 'Monster pantheons', 'Other']

/** Em que grupo o panteão da divindade aparece no filtro. */
export function pantheonGroup(deity: Pick<Deity, 'book' | 'race'>): string {
  if (deity.race) return 'Demihuman'
  if (settingBooks.includes(deity.book)) return 'Campaign settings'
  if (deity.book === 'Legends & Lore') return 'Legends & Lore'
  if (deity.book === 'Monster Mythology') return 'Monster pantheons'
  return 'Other'
}

/** Panteões agrupados (grupo → panteões em ordem alfabética), para o filtro do compêndio. */
export function pantheonGroups(deities: Pick<Deity, 'book' | 'race' | 'pantheon'>[]): { group: string; pantheons: string[] }[] {
  const byGroup = new Map<string, Set<string>>()
  for (const d of deities) {
    const group = pantheonGroup(d)
    byGroup.set(group, (byGroup.get(group) ?? new Set()).add(pantheonOf(d)))
  }
  return pantheonGroupOrder
    .filter((group) => byGroup.has(group))
    .map((group) => ({ group, pantheons: [...(byGroup.get(group) ?? [])].sort((a, b) => a.localeCompare(b)) }))
}

/** Nomes que se repetem entre panteões (Tyr, Set, Isis…), normalizados. */
export function duplicateNames(deities: Pick<Deity, 'name'>[]): Set<string> {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const d of deities) {
    const key = normalize(d.name)
    if (seen.has(key)) repeated.add(key)
    seen.add(key)
  }
  return repeated
}

/** O nome na lista: com o panteão ao lado quando o nome se repete ("Tyr (Norse)"). */
export const deityLabel = (deity: Pick<Deity, 'name' | 'pantheon' | 'book'>, repeated: Set<string>) =>
  repeated.has(normalize(deity.name)) ? `${deity.name} (${pantheonOf(deity)})` : deity.name

let promise: Promise<Deity[]> | null = null

export function loadDeities(): Promise<Deity[]> {
  promise ??= fetch(`${import.meta.env.BASE_URL}data/deities.json`).then((response) => {
    if (!response.ok) throw new Error(`deities.json: HTTP ${response.status}`)
    return response.json() as Promise<Deity[]>
  })
  return promise
}

/** Acha a divindade pelo nome, como DeityDatabase.deity(named:) do iPad. */
export function findDeityByName(deities: Deity[], name: string): Deity | undefined {
  const target = normalize(name)
  if (target === '') return undefined
  // Nome repetido entre panteões (Tyr): a divindade que o Forge oferece vem antes.
  const named = deities.filter((deity) => normalize(deity.name) === target)
  return named.find(isForgeSelectable) ?? named[0]
}
