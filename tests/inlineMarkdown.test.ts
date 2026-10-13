// Negrito e itálico no texto das regras (src/lib/inlineMarkdown.ts), usado no
// detalhe e no resumo da lista do Rules Reference.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { parseInlineMarkdown } from '../src/lib/inlineMarkdown.ts'

test('negrito e itálico viram pedaços sem as marcas', () => {
  assert.deepEqual(parseInlineMarkdown('**Alignment** is a tool, see *Player\'s Handbook*.'), [
    { text: 'Alignment', style: 'bold' },
    { text: ' is a tool, see ', style: 'plain' },
    { text: "Player's Handbook", style: 'italic' },
    { text: '.', style: 'plain' },
  ])
})

test('asterisco sem par (legenda de tabela) fica como texto', () => {
  const text = "H = Hundreds; K = Thousands; * = DM's choice"
  assert.deepEqual(parseInlineMarkdown(text), [{ text, style: 'plain' }])
})

test('texto sem marcas fica inteiro; texto vazio não gera pedaços', () => {
  assert.deepEqual(parseInlineMarkdown('Plain text.'), [{ text: 'Plain text.', style: 'plain' }])
  assert.deepEqual(parseInlineMarkdown(''), [])
})

test('dados reais: nenhum resumo de regra mostra ** cru na lista', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const rules: { id: string; summary: string }[] = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8'))
  const raw = rules
    .filter((rule) => parseInlineMarkdown(rule.summary).some((part) => part.style === 'plain' && part.text.includes('**')))
    .map((rule) => rule.id)
  assert.deepEqual(raw, [])
})
