import { useEffect, useState } from 'react'
import { loadBooks } from '../data/books'

// Título completo de cada sigla de livro das regras (data/books.json),
// carregado uma vez para o app inteiro (tooltip das siglas, 2026-10-12).

let titles: Promise<Map<string, string>> | null = null
const loadTitles = () => {
  titles ??= loadBooks()
    .then((books) => new Map(books.map((b) => [b.id, b.title])))
    .catch(() => new Map<string, string>())
  return titles
}

/** Título completo de cada sigla (vazio enquanto carrega). */
export function useBookTitles(): Map<string, string> {
  const [map, setMap] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    let cancelled = false
    void loadTitles().then((m) => !cancelled && setMap(m))
    return () => {
      cancelled = true
    }
  }, [])
  return map
}
