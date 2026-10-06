// Relatório da sessão (src/rules/sessionReport.ts), comparado com o
// SessionReportView do iPad.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { itemCharges, spellBars, suggestedXP } from '../src/rules/sessionReport.ts'
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

// XP sugerido: DMG Tabela 34 (+ Complete Bard's Handbook) e +10% do PHB.

const abilities = (over: Partial<Record<'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma', number>> = {}) => ({
  strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10, ...over,
})

const castDay = (): Sheet =>
  day({
    slotBoard: {
      slots: [
        { id: 'a', level: 1, caster: 'divine', isSpent: true, orderKey: 0 },
        { id: 'b', level: 3, caster: 'divine', isSpent: true, orderKey: 1 },
      ],
    },
    entries: [
      { id: 'e1', rawText: 'Bless', displayName: 'Bless', spellLevel: 1, castCount: 2 },
      { id: 'e2', rawText: 'Orison', displayName: 'Orison', spellLevel: 0, castCount: 3 },
      { id: 'e3', rawText: 'Homebrew', displayName: 'Homebrew', castCount: 1 },
    ],
    turnUndeadUsed: 2,
    magicItems: [{ id: 'w', name: 'Wand', itemDescription: '', spells: [{ id: 's', spellName: 'Fireball', usedCount: 4, maxUses: 10 }] }],
  })

test('clérigo: 100 XP por nível, Turn Undead 100 por tentativa, +10% com WIS 16', () => {
  const xp = suggestedXP('Cleric', abilities({ wisdom: 16 }), [castDay()])
  assert.deepEqual(
    xp.lines.map((l) => [l.label, l.xp]),
    [
      ['Level 1 spells', 300],
      ['Level 3 spells', 300],
      ['Turn Undead', 200],
    ],
  )
  assert.deepEqual([xp.subtotal, xp.primeBonus?.applies, xp.primeBonus?.xp, xp.total, xp.countsAttempts], [800, true, 80, 880, true])
})

test('mago: 50 XP por nível e sem Turn Undead; sem bônus com INT 15', () => {
  const xp = suggestedXP('Mage', abilities({ intelligence: 15 }), [castDay()])
  assert.deepEqual([xp.subtotal, xp.primeBonus?.applies, xp.total, xp.countsAttempts], [300, false, 300, false])
})

test('bardo: 25 XP por nível; druida precisa de WIS e CHA 16', () => {
  assert.equal(suggestedXP('Bard', abilities(), [castDay()]).total, 150)
  assert.equal(suggestedXP('Druid', abilities({ wisdom: 17, charisma: 15 }), [castDay()]).primeBonus?.applies, false)
  assert.equal(suggestedXP('Druid', abilities({ wisdom: 17, charisma: 16 }), [castDay()]).primeBonus?.applies, true)
})

test('paladino e ranger não ganham XP por magia nem por Turn Undead', () => {
  for (const cls of ['Paladin', 'Ranger']) assert.deepEqual(suggestedXP(cls, abilities(), [castDay()]).lines, [])
})
