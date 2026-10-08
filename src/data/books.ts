// Livros das regras (public/data/books.json, cópia do thac0berry-data/data/books.json).
import type { Book } from '../rules/books'
import { loadData } from './load'

export const loadBooks = () => loadData<Book[]>('books.json')
