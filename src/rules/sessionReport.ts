// Relatório da sessão (SessionReportView do iPad): o que um personagem
// gastou nos dias de uma sessão. Só funções puras.
//
// - Magias por círculo: slots riscados + magias adicionais com círculo
//   conhecido (cada uma conta `castCount`, no mínimo 1); as sem círculo vão
//   para "Other"; Turn Undead é uma barra à parte, no fim.
// - Cargas de itens mágicos: usos de cada magia de item, somados por
//   item + magia, do mais usado para o menos usado.

import type { SpellSheet } from '../types/library.ts'

type Sheet = Pick<SpellSheet, 'slotBoard' | 'entries' | 'magicItems' | 'turnUndeadUsed'>

export interface ReportBar {
  id: string
  label: string
  count: number
  kind: 'spell' | 'turnUndead'
}

export interface ItemCharge {
  itemName: string
  spellName: string
  used: number
}

/** chartRows do iPad: círculo 1 em diante, depois "Other", depois Turn Undead. */
export function spellBars(sheets: Sheet[]): ReportBar[] {
  const byLevel = new Map<number, number>()
  let other = 0
  for (const sheet of sheets) {
    for (const slot of sheet.slotBoard.slots) if (slot.isSpent) byLevel.set(slot.level, (byLevel.get(slot.level) ?? 0) + 1)
    for (const entry of sheet.entries) {
      const count = Math.max(entry.castCount, 1)
      if (entry.spellLevel != null) byLevel.set(entry.spellLevel, (byLevel.get(entry.spellLevel) ?? 0) + count)
      else other += count
    }
  }
  const bars: ReportBar[] = [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, count]) => ({ id: `level-${level}`, label: `Level ${level}`, count, kind: 'spell' }))
  if (other > 0) bars.push({ id: 'other', label: 'Other', count: other, kind: 'spell' })
  const turnUndead = sheets.reduce((sum, s) => sum + s.turnUndeadUsed, 0)
  if (turnUndead > 0) bars.push({ id: 'turn-undead', label: 'Turn Undead', count: turnUndead, kind: 'turnUndead' })
  return bars
}

/** itemCharges do iPad. */
export function itemCharges(sheets: Sheet[]): ItemCharge[] {
  const totals = new Map<string, ItemCharge>()
  for (const sheet of sheets) {
    for (const item of sheet.magicItems) {
      for (const use of item.spells) {
        if (use.usedCount <= 0) continue
        const itemName = item.name === '' ? 'Unnamed item' : item.name
        const spellName = use.spellName === '' ? 'unnamed spell' : use.spellName
        const key = `${itemName}|${spellName}`
        const found = totals.get(key) ?? { itemName, spellName, used: 0 }
        found.used += use.usedCount
        totals.set(key, found)
      }
    }
  }
  return [...totals.values()].sort((a, b) => b.used - a.used)
}

/** barWidth do iPad: fração da maior barra; barra com valor nunca some (mínimo visível). */
export function barFraction(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0
  return count / maxCount
}
