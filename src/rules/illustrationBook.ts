// Livro de ilustrações dos monstros ("Illustrations"): regras puras que montam os
// capítulos (um por coleção) e a navegação entre as pranchas. A tela só exibe.

import { monsterCollections } from './monsters.ts'

/** O mínimo do índice de monstros que o livro usa. */
export interface BookMonster {
  id: string
  name: string
  collection: string
}

export interface BookPlate {
  id: string
  name: string
}

export interface BookChapter {
  /** Número do capítulo, a partir de 1. */
  number: number
  /** Numeração romana: I, II, III… */
  roman: string
  collection: string
  /** Trecho do endereço: "monstrous-manual-core". */
  slug: string
  /** Em ordem alfabética do nome. */
  plates: BookPlate[]
}

/** Número romano (1 a 3999); fora disso, devolve o número em algarismos. */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n)
  const table: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let rest = n
  let out = ''
  for (const [value, symbol] of table) {
    while (rest >= value) {
      out += symbol
      rest -= value
    }
  }
  return out
}

/** "Mystara & Savage Coast" → "mystara-savage-coast". */
export function collectionSlug(collection: string): string {
  return collection
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Capítulos do livro: uma coleção por capítulo, só as que têm ao menos uma imagem.
 * Ordem: a de `monsterCollections`; coleções fora dessa lista vêm depois, na ordem em
 * que aparecem no índice. Monstros sem imagem (ou imagens sem monstro no índice) ficam de fora.
 */
export function buildChapters(index: readonly BookMonster[], withImage: ReadonlySet<string>): BookChapter[] {
  const byCollection = new Map<string, BookPlate[]>()
  for (const m of index) {
    if (!withImage.has(m.id)) continue
    const list = byCollection.get(m.collection)
    if (list) list.push({ id: m.id, name: m.name })
    else byCollection.set(m.collection, [{ id: m.id, name: m.name }])
  }
  const known: readonly string[] = monsterCollections
  const order = [...known.filter((c) => byCollection.has(c)), ...[...byCollection.keys()].filter((c) => !known.includes(c))]
  return order.map((collection, i) => ({
    number: i + 1,
    roman: toRoman(i + 1),
    collection,
    slug: collectionSlug(collection),
    plates: (byCollection.get(collection) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id)),
  }))
}

export const totalPlates = (chapters: readonly BookChapter[]) => chapters.reduce((sum, c) => sum + c.plates.length, 0)

/** Resumo do topo do sumário: "661 plates · 6 chapters". */
export function bookSummary(chapters: readonly BookChapter[]): string {
  const plates = totalPlates(chapters)
  return `${plates} ${plates === 1 ? 'plate' : 'plates'} · ${chapters.length} ${chapters.length === 1 ? 'chapter' : 'chapters'}`
}

export interface PlateNav {
  /** Posição da prancha, a partir de 1. */
  position: number
  total: number
  /** "Plate 41 of 41". */
  label: string
  previousId: string | null
  nextId: string | null
}

/** Onde a prancha está no capítulo e quais são as vizinhas; null se não for do capítulo. */
export function plateNav(chapter: BookChapter, plateId: string): PlateNav | null {
  const i = chapter.plates.findIndex((p) => p.id === plateId)
  if (i < 0) return null
  const total = chapter.plates.length
  return {
    position: i + 1,
    total,
    label: `Plate ${i + 1} of ${total}`,
    previousId: i > 0 ? chapter.plates[i - 1].id : null,
    nextId: i < total - 1 ? chapter.plates[i + 1].id : null,
  }
}

export interface DotWindow {
  /** Primeiro índice (a partir de 0) mostrado. */
  start: number
  /** Quantidade de pontos. */
  count: number
  /** Índice do ponto atual dentro da janela (0 a count - 1). */
  active: number
}

/** Pontos indicadores: no máximo `max`, deslizando em volta da prancha atual (índice a partir de 0). */
export function dotWindow(total: number, current: number, max = 9): DotWindow {
  if (total <= 0) return { start: 0, count: 0, active: 0 }
  const at = Math.min(Math.max(current, 0), total - 1)
  const count = Math.min(total, Math.max(1, max))
  const start = Math.min(Math.max(at - Math.floor(count / 2), 0), total - count)
  return { start, count, active: at - start }
}
