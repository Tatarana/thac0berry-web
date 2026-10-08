// Livros e cenários (src/rules/books.ts; dados em thac0berry-data/data/books.json).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { booksInSetting, settingOfBook, settingsOf, sortBooks, unlistedBooks, type Book } from '../src/rules/books.ts'

const books: Book[] = [
  { id: 'DSC', title: 'Dark Sun Campaign Setting', setting: 'Dark Sun', order: 3 },
  { id: 'PHB', title: "Player's Handbook", setting: 'Core', order: 1 },
  { id: 'RL', title: 'Ravenloft', setting: 'Ravenloft', order: 4 },
  { id: 'DMG', title: "Dungeon Master's Guide", setting: 'Core', order: 2 },
]

test('ordem, cenários (Core primeiro), livros de um cenário, cenário de um livro', () => {
  assert.deepEqual(sortBooks(books).map((b) => b.id), ['PHB', 'DMG', 'DSC', 'RL'])
  assert.deepEqual(settingsOf(books), ['Core', 'Dark Sun', 'Ravenloft'])
  assert.deepEqual(booksInSetting(books, 'Core').map((b) => b.id), ['PHB', 'DMG'])
  assert.equal(booksInSetting(books, null).length, 4)
  assert.equal(settingOfBook(books, 'DSC'), 'Dark Sun')
  assert.equal(settingOfBook(books, 'XYZ'), 'Core')
  assert.deepEqual(unlistedBooks(books, ['PHB', 'XYZ', 'XYZ', 'ABC']), ['ABC', 'XYZ'])
})

test('dados reais: todo livro das regras está em books.json; Dark Sun tem DSC, DK e WatW', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const real: Book[] = JSON.parse(readFileSync(join(source, 'books.json'), 'utf8'))
  const rules: { book: string }[] = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8'))
  assert.deepEqual(unlistedBooks(real, rules.map((r) => r.book)), [])
  assert.deepEqual(booksInSetting(real, 'Dark Sun').map((b) => b.id), ['DSC', 'DK', 'WatW'])
  assert.equal(sortBooks(real)[0].id, 'PHB')
})
