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

// --- XP sugerido (prêmios individuais, opcionais) ---------------------------
//
// DMG cap. 8, Tabela 34 (Individual Class Awards), conferido em 2026-10-06:
// - sacerdote (clérigo, druida): 100 XP por nível de magia lançada a favor do
//   ethos; 100 XP por uso bem-sucedido de poder concedido (Turn Undead);
// - mago: 50 XP por nível de magia lançada para superar inimigos ou problemas;
// - guerreiros (inclusive paladino e ranger) e ladrão: nada por magia;
// - bardo: 25 XP por nível de magia, pela tabela opcional do Complete Bard's
//   Handbook (decisão do usuário).
// O DMG deixa esses prêmios a critério do mestre ("uso significativo"); o
// relatório só sugere. Decisões do usuário: Turn Undead conta todas as
// tentativas (a folha não registra sucesso), com aviso; nada é somado à ficha.
//
// PHB: +10% de XP com 16 ou mais em TODOS os atributos principais da classe.

type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

/** Atributos principais de cada classe (PHB). Ninja não é do PHB: sem bônus. */
export const primeRequisites: Record<string, Ability[]> = {
  Fighter: ['strength'],
  Paladin: ['strength', 'charisma'],
  Ranger: ['strength', 'dexterity', 'wisdom'],
  Mage: ['intelligence'],
  Cleric: ['wisdom'],
  Druid: ['wisdom', 'charisma'],
  Thief: ['dexterity'],
  Bard: ['dexterity', 'charisma'],
  // CPsiH: Constitution e Wisdom.
  Psionicist: ['constitution', 'wisdom'],
}

/** XP por nível de magia lançada, por classe (nada = a classe não ganha por magia). */
const spellAward: Record<string, { perLevel: number; source: string }> = {
  Cleric: { perLevel: 100, source: 'DMG Table 34, priest' },
  Druid: { perLevel: 100, source: 'DMG Table 34, priest' },
  Mage: { perLevel: 50, source: 'DMG Table 34, wizard' },
  Bard: { perLevel: 25, source: "Complete Bard's Handbook" },
}

/** Classes que ganham por Turn Undead (poder concedido de sacerdote). */
const turnUndeadAward: Record<string, number> = { Cleric: 100, Druid: 100 }

export interface XpLine {
  label: string
  detail: string
  xp: number
}

export interface XpSuggestion {
  lines: XpLine[]
  subtotal: number
  /** Atributos principais e se valem o +10%. */
  primeBonus: { abilities: Ability[]; applies: boolean; xp: number } | null
  total: number
  /** Turn Undead entrou contando tentativas (a regra pede só as bem-sucedidas). */
  countsAttempts: boolean
}

/**
 * XP sugerido de um personagem nos dias de uma sessão. `cls` já canônica
 * (Cleric, Mage…); `abilities` são os valores sem efeitos temporários.
 * Magias de nível 0, sem nível conhecido e de itens mágicos não contam.
 */
export function suggestedXP(cls: string, abilities: Record<Ability, number>, sheets: Sheet[]): XpSuggestion {
  const lines: XpLine[] = []
  const award = spellAward[cls]
  if (award) {
    const byLevel = new Map<number, number>()
    for (const sheet of sheets) {
      for (const slot of sheet.slotBoard.slots) if (slot.isSpent && slot.level > 0) byLevel.set(slot.level, (byLevel.get(slot.level) ?? 0) + 1)
      for (const entry of sheet.entries) {
        if (entry.spellLevel == null || entry.spellLevel <= 0) continue
        byLevel.set(entry.spellLevel, (byLevel.get(entry.spellLevel) ?? 0) + Math.max(entry.castCount, 1))
      }
    }
    for (const [level, count] of [...byLevel.entries()].sort(([a], [b]) => a - b)) {
      lines.push({ label: `Level ${level} spells`, detail: `${count} × ${award.perLevel * level} XP`, xp: count * award.perLevel * level })
    }
  }
  const turnXP = turnUndeadAward[cls]
  const attempts = sheets.reduce((sum, s) => sum + s.turnUndeadUsed, 0)
  const countsAttempts = turnXP !== undefined && attempts > 0
  if (countsAttempts) lines.push({ label: 'Turn Undead', detail: `${attempts} × ${turnXP} XP`, xp: attempts * turnXP })

  const subtotal = lines.reduce((sum, l) => sum + l.xp, 0)
  const prime = primeRequisites[cls]
  const applies = prime !== undefined && prime.every((a) => abilities[a] >= 16)
  const bonus = applies ? Math.floor(subtotal / 10) : 0
  return {
    lines,
    subtotal,
    primeBonus: prime ? { abilities: prime, applies, xp: bonus } : null,
    total: subtotal + bonus,
    countsAttempts,
  }
}

// --- XP sugerido de um multiclasse (MC3c, docs/multiclasse.md) -----------------------
//
// Decisão 6 do usuário: o XP vai pelo tipo. Magia divina (e Turn Undead) usa a
// tabela da classe divina (Cleric/Druid, 100 XP por nível) e o bônus de 10%
// dos atributos principais dela (WIS); magia arcana usa a da classe arcana
// (Mage 50, Bard 25 por nível) e o bônus dela (INT). Magia adicional conta
// pelo id do compêndio ("priest-…"/"wizard-…"); escrita à mão, com os dois
// tipos na ficha, fica sem XP. O total é dividido igualmente entre as classes
// (PHB), como em classProgress.

type Kind = 'divine' | 'arcane'

function entryKind(id: string | null | undefined): Kind | null {
  if (!id) return null
  if (id.startsWith('priest-')) return 'divine'
  if (id.startsWith('wizard-')) return 'arcane'
  return null
}

export interface XpGroup {
  /** Classe cuja tabela e cujo bônus valem para este tipo de XP. */
  characterClass: string
  kind: Kind
  lines: XpLine[]
  subtotal: number
  primeBonus: { abilities: Ability[]; applies: boolean; xp: number } | null
}

export interface MultiXpSuggestion {
  groups: XpGroup[]
  total: number
  classCount: number
  /** Parte de cada classe (o total dividido igualmente, para baixo). */
  perClass: number
  countsAttempts: boolean
  /** Magias adicionais escritas à mão que não puderam ser atribuídas a um tipo. */
  unassigned: number
}

export function suggestedXPMulti(classes: string[], abilities: Record<Ability, number>, sheets: Sheet[]): MultiXpSuggestion {
  const kindOf = (cls: string): Kind => (cls === 'Mage' || cls === 'Bard' ? 'arcane' : 'divine')
  // Uma classe por tipo (a primeira da ficha com tabela de magia).
  const owners = new Map<Kind, string>()
  for (const cls of classes) if (spellAward[cls] && !owners.has(kindOf(cls))) owners.set(kindOf(cls), cls)
  const groups: XpGroup[] = []
  let unassigned = 0
  let countsAttempts = false

  for (const [kind, cls] of owners) {
    const award = spellAward[cls]
    const byLevel = new Map<number, number>()
    for (const sheet of sheets) {
      for (const slot of sheet.slotBoard.slots) {
        if (slot.isSpent && slot.level > 0 && slot.caster === kind) byLevel.set(slot.level, (byLevel.get(slot.level) ?? 0) + 1)
      }
      for (const entry of sheet.entries) {
        if (entry.spellLevel == null || entry.spellLevel <= 0) continue
        const found = entryKind(entry.matchedSpellID) ?? (owners.size === 1 ? kind : null)
        if (found === null) {
          if (kind === [...owners.keys()][0]) unassigned += Math.max(entry.castCount, 1)
        } else if (found === kind) {
          byLevel.set(entry.spellLevel, (byLevel.get(entry.spellLevel) ?? 0) + Math.max(entry.castCount, 1))
        }
      }
    }
    const lines: XpLine[] = [...byLevel.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, count]) => ({ label: `${cls}: level ${level} spells`, detail: `${count} × ${award.perLevel * level} XP`, xp: count * award.perLevel * level }))
    const turnXP = turnUndeadAward[cls]
    const attempts = sheets.reduce((sum, s) => sum + s.turnUndeadUsed, 0)
    if (turnXP !== undefined && attempts > 0) {
      lines.push({ label: 'Turn Undead', detail: `${attempts} × ${turnXP} XP`, xp: attempts * turnXP })
      countsAttempts = true
    }
    const subtotal = lines.reduce((sum, l) => sum + l.xp, 0)
    const prime = primeRequisites[cls]
    const applies = prime !== undefined && prime.every((a) => abilities[a] >= 16)
    groups.push({
      characterClass: cls,
      kind,
      lines,
      subtotal,
      primeBonus: prime ? { abilities: prime, applies, xp: applies ? Math.floor(subtotal / 10) : 0 } : null,
    })
  }
  const total = groups.reduce((sum, g) => sum + g.subtotal + (g.primeBonus?.xp ?? 0), 0)
  const classCount = Math.max(1, classes.length)
  return { groups, total, classCount, perClass: Math.floor(total / classCount), countsAttempts, unassigned }
}

/** barWidth do iPad: fração da maior barra; barra com valor nunca some (mínimo visível). */
export function barFraction(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0
  return count / maxCount
}
