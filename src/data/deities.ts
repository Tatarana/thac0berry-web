// Divindades (schemas/deity.schema.json no thac0berry-data; Models/Deity.swift
// no iPad): Faiths & Avatars e Powers & Pantheons (Forgotten Realms) e, desde
// 2026-10-13, os deuses de Krynn do Tales of the Lance (Dragonlance).
import { normalize } from '../lib/search.ts'

export interface Deity {
  id: string
  name: string
  book: string
  bookCode: string
  rank?: string | null
  plane?: string | null
  alignment?: string | null
  status?: string | null
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
  return deities.find((deity) => normalize(deity.name) === target)
}
