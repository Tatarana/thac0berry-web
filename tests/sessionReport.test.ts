// Relatório da sessão (src/rules/sessionReport.ts), comparado com o
// SessionReportView do iPad.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { itemCharges, spellBars } from '../src/rules/sessionReport.ts'
import type { SpellSheet } from '../src/types/library.ts'

type Sheet = Pick<SpellSheet, 'slotBoard' | 'entries' | 'magicItems' | 'turnUndeadUsed'>

const day = (over: Partial<Sheet>): Sheet => ({ slotBoard: { slots: [] }, entries: [], magicItems: [], turnUndeadUsed: 0, ...over })

test('magias por círculo: slots riscados e magias adicionais; sem círculo vira Other; Turn Undead por último', () => {
  const sheets = [
    day({
      slotBoard: {
        slots: [
          { id: 'a', level: 2, caster: 'divine', isSpent: true, orderKey: 0 },
          { id: 'b', level: 1, caster: 'divine', isSpent: true, orderKey: 1 },
          { id: 'c', level: 1, caster: 'divine', isSpent: false, orderKey: 2 },
        ],
      },
      entries: [
        { id: 'e1', rawText: 'Bless', displayName: 'Bless', spellLevel: 1, castCount: 2 },
        { id: 'e2', rawText: 'Homebrew', displayName: 'Homebrew', castCount: 0 },
      ],
      turnUndeadUsed: 1,
    }),
    day({ turnUndeadUsed: 2, slotBoard: { slots: [{ id: 'd', level: 1, caster: 'divine', isSpent: true, orderKey: 0 }] } }),
  ]
  assert.deepEqual(
    spellBars(sheets).map((b) => [b.label, b.count]),
    [
      ['Level 1', 4],
      ['Level 2', 1],
      ['Other', 1],
      ['Turn Undead', 3],
    ],
  )
})

test('nada gasto: nenhuma barra', () => {
  assert.deepEqual(spellBars([day({})]), [])
})

test('cargas de item: somadas por item e magia, do mais usado ao menos', () => {
  const wand = (used: number) => ({
    id: 'w',
    name: 'Wand of Frost',
    itemDescription: '',
    spells: [
      { id: 's1', spellName: 'Cone of Cold', usedCount: used, maxUses: 10 },
      { id: 's2', spellName: '', usedCount: 1, maxUses: 1 },
    ],
  })
  const ring = { id: 'r', name: '', itemDescription: '', spells: [{ id: 's3', spellName: 'Shield', usedCount: 0, maxUses: 3 }] }
  const charges = itemCharges([day({ magicItems: [wand(1), ring] }), day({ magicItems: [wand(2)] })])
  assert.deepEqual(
    charges.map((c) => [c.itemName, c.spellName, c.used]),
    [
      ['Wand of Frost', 'Cone of Cold', 3],
      ['Wand of Frost', 'unnamed spell', 2],
    ],
  )
})
