// Texto das regras em blocos (src/rules/ruleContent.ts): tabelas e listas em
// markdown dos suplementos (achado do usuário na ficha Psionic Combat, DSC).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { parseRuleContent } from '../src/rules/ruleContent.ts'
import { alignTable } from '../src/rules/tableIndex.ts'

test('tabela em markdown vira tabela, com o título do negrito acima', () => {
  const blocks = parseRuleContent('Texto.\n\n**Table 2: MTHAC0 Modifiers**\n| Intelligence Score | MTHAC0 Modifier | |\n| --- | --- |\n| 15 or less | 0 |\n| 16-17 | +1 |', [])
  assert.equal(blocks[0].kind, 'paragraph')
  const table = blocks[1]
  assert.equal(table.kind, 'table')
  if (table.kind !== 'table') return
  assert.equal(table.table.title, 'Table 2: MTHAC0 Modifiers')
  assert.equal(table.table.tableNumber, '2')
  assert.deepEqual(table.table.headers, ['Intelligence Score', 'MTHAC0 Modifier'])
  assert.deepEqual(table.table.rows, [['15 or less', '0'], ['16-17', '+1']])
})

test('cabeçalho torto: falta a célula do canto, ou sobra uma vazia no fim', () => {
  assert.deepEqual(alignTable(['Mind blank', 'Thought shield'], [['Mind thrust', '+5', '+3']]).headers, ['', 'Mind blank', 'Thought shield'])
  assert.deepEqual(alignTable(['A', 'B', ''], [['1', '2']]).headers, ['A', 'B'])
  assert.deepEqual(alignTable(['A'], [['1', '2'], ['3']]), { headers: ['A', ''], rows: [['1', '2'], ['3', '']] })
})

test('listas "- " e "* ", juntas mesmo separadas por linha em branco; introdução vira parágrafo', () => {
  const blocks = parseRuleContent('Two adjustments apply:\n- One\n- Two\n\n- Three\n\n* Four', [])
  assert.deepEqual(blocks, [
    { kind: 'paragraph', text: 'Two adjustments apply:' },
    { kind: 'list', items: ['One', 'Two', 'Three', 'Four'] },
  ])
})

test('sem a linha "---": pares rótulo | valor viram tabela sem cabeçalho; uma célula vira lista; "|  |" some', () => {
  const blocks = parseRuleContent('**Table 1: Class Qualifications**\n| Ability Requirements | Strength 12 |\n| Races Allowed | Human\n\n| Single-Weapon Style |\n| Two-Hander Style |\n\n|  |', [])
  assert.equal(blocks.length, 2)
  const [table, list] = blocks
  assert.equal(table.kind, 'table')
  if (table.kind === 'table') {
    assert.equal(table.table.title, 'Table 1: Class Qualifications')
    assert.deepEqual(table.table.headers, [])
    assert.deepEqual(table.table.rows, [['Ability Requirements', 'Strength 12'], ['Races Allowed', 'Human']])
  }
  assert.deepEqual(list, { kind: 'list', items: ['Single-Weapon Style', 'Two-Hander Style'] })
})

test('tabela estruturada por [TABLE_REF] continua igual', () => {
  const table = { tableNumber: 'Table 84', title: 'Table 84: Treasure Types', headers: ['Type'], rows: [['A']] }
  assert.deepEqual(parseRuleContent('## Treasure\n\n[TABLE_REF: Table 84: Treasure Types]', [table]), [
    { kind: 'heading', text: 'Treasure' },
    { kind: 'table', table },
  ])
})

test('dados reais: nenhum parágrafo com "|" ou item "- " solto; Psionic Combat com as duas tabelas', () => {
  const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
  const rules: { id: string; content: string; tables: [] }[] = JSON.parse(readFileSync(join(source, 'rules.json'), 'utf8'))
  const leftovers = rules.filter((r) => parseRuleContent(r.content, r.tables).some((b) => b.kind === 'paragraph' && /(^|\n)(\||- )/.test(b.text)))
  assert.deepEqual(leftovers.map((r) => r.id), [])
  const psionic = parseRuleContent(rules.find((r) => r.id === 'dsc_ch00_psionic_combat')!.content, [])
  const tables = psionic.flatMap((b) => (b.kind === 'table' ? [b.table] : []))
  assert.deepEqual(tables.map((t) => t.tableNumber), ['2', '3'])
  assert.equal(tables[1].headers[0], '')
  assert.equal(tables[1].headers.length, tables[1].rows[0].length)
})
