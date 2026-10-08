// Livros das regras e o cenário de campanha de cada um (thac0berry-data
// `data/books.json`, gerado por scripts/build_books.py de lá). Substitui a
// lista fixa `bookOrder` (decisão 6 do Table Grimoire, 2026-10-08). Só
// funções puras.

export interface Book {
  /** Código usado no campo `book` das regras: PHB, DMG, DSC… */
  id: string
  title: string
  /** "Core" para os livros gerais; senão o cenário ("Dark Sun", "Ravenloft"…). */
  setting: string
  order: number
}

export const CORE_SETTING = 'Core'

/** Livros na ordem de exibição. */
export const sortBooks = (books: Book[]) => [...books].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

/** Cenários presentes, "Core" primeiro e os outros em ordem alfabética. */
export function settingsOf(books: Book[]): string[] {
  return [...new Set(books.map((b) => b.setting))].sort((a, b) => (a === CORE_SETTING ? -1 : b === CORE_SETTING ? 1 : a.localeCompare(b)))
}

/** Livros de um cenário (null = todos), na ordem de exibição. */
export const booksInSetting = (books: Book[], setting: string | null) => sortBooks(books.filter((b) => setting === null || b.setting === setting))

/** Cenário de um livro; "Core" se o livro não está na lista. */
export function settingOfBook(books: Book[], id: string): string {
  return books.find((b) => b.id === id)?.setting ?? CORE_SETTING
}

/** Códigos que aparecem nas regras e faltam na lista de livros (o build para se houver). */
export function unlistedBooks(books: Book[], used: Iterable<string>): string[] {
  const known = new Set(books.map((b) => b.id))
  return [...new Set(used)].filter((id) => !known.has(id)).sort()
}
