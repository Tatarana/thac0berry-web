// Bônus de AC dos itens mágicos (pedido do usuário, 2026-10-24). Cada linha de
// Magic Items pode ter um bônus de AC (`acBonus`, ou o sugerido: item criado, ou
// o "+N" do nome de armadura, escudo ou item de proteção) e estar em uso ou
// guardada (`worn`). Regras do DMG para os itens de proteção:
// - Ring of Protection: não melhora a AC com armadura mágica (só os saves) e
//   vários anéis não somam (vale o mais forte).
// - Cloak of Protection: não funciona com armadura mágica nem com escudo (e
//   também não com armadura comum que não seja de couro; isso a ficha não sabe).
// Só funções puras; a CA final fica em `finalArmorClass` (rules.ts).

import type { PlayerCharacter, QuantifiedItem } from '../types/library.ts'

export type ACItemKind = 'ring' | 'cloak' | 'shield' | 'armor' | 'other'

/** O tipo do item pelo nome (o que importa para as regras acima). */
export function acItemKind(name: string): ACItemKind {
  const n = name.toLowerCase()
  if (/\bring of protection\b/.test(n)) return 'ring'
  if (/\bcloak of protection\b/.test(n)) return 'cloak'
  if (/\bshield\b/.test(n)) return 'shield'
  if (/\b(armou?r|mail|plate|leather|hide|brigandine|banded|splint|scale|studded)\b/.test(n)) return 'armor'
  return 'other'
}

/** O bônus sugerido: o do item criado, ou o "+N" (ou "−N") do nome de armadura, escudo ou item de proteção. */
export function suggestedACBonus(line: Pick<QuantifiedItem, 'name' | 'customItem'>): number | null {
  const custom = line.customItem?.data.acBonus
  if (custom != null) return custom
  if (acItemKind(line.name) === 'other') return null
  const m = /(?:^|[\s,(])([+\-−])\s?(\d)\b/.exec(line.name)
  if (!m) return null
  return (m[1] === '+' ? 1 : -1) * Number(m[2])
}

/**
 * Preenche o bônus de AC das linhas de Magic Items ligadas a um item do livro
 * com bônus fixo (Laeral's Storm Armor +2, Shield of the Holy +1...), quando a
 * linha ainda não tem bônus nem sugestão pelo nome. Grava na linha (o Combat
 * Tracker lê a ficha); o jogador corrige se o dele for outro. Devolve true se
 * mudou algo.
 */
export function fillCatalogACBonuses(
  c: Pick<PlayerCharacter, 'page2MagicItems'>,
  index: { id: string; name: string; acBonus?: number }[],
): boolean {
  let changed = false
  for (const line of c.page2MagicItems ?? []) {
    if (line.acBonus != null || line.customItem || suggestedACBonus(line) != null) continue
    const entry =
      index.find((e) => e.id === line.matchedItemID) ?? index.find((e) => e.name.trim().toLowerCase() === line.name.trim().toLowerCase())
    if (entry?.acBonus) {
      line.acBonus = entry.acBonus
      changed = true
    }
  }
  return changed
}

/** O bônus que vale para a linha: o digitado, senão o sugerido. */
export const lineACBonus = (line: Pick<QuantifiedItem, 'name' | 'customItem' | 'acBonus'>): number | null =>
  line.acBonus ?? suggestedACBonus(line)

export interface ItemACPart {
  id: string
  name: string
  kind: ACItemKind
  bonus: number
  /** Por que o bônus não conta (null = conta). */
  ignored: string | null
}

/** Os itens em uso com bônus de AC, e quais contam (as regras de proteção acima). */
export function itemACParts(items: QuantifiedItem[] | null | undefined): ItemACPart[] {
  const parts: ItemACPart[] = (items ?? [])
    .filter((line) => line.worn !== false)
    .flatMap((line) => {
      const bonus = lineACBonus(line)
      return bonus ? [{ id: line.id, name: line.name, kind: acItemKind(line.name), bonus, ignored: null }] : []
    })
  const magicArmor = parts.some((p) => p.kind === 'armor' && p.bonus > 0)
  const magicShield = parts.some((p) => p.kind === 'shield' && p.bonus > 0)
  const bestRing = Math.max(-Infinity, ...parts.filter((p) => p.kind === 'ring').map((p) => p.bonus))
  let ringUsed = false
  for (const p of parts) {
    if (p.kind === 'ring') {
      if (magicArmor) p.ignored = 'no AC with magical armor (saves only)'
      else if (ringUsed || p.bonus < bestRing) p.ignored = 'rings of protection don’t combine (the strongest counts)'
      else ringUsed = true
    } else if (p.kind === 'cloak') {
      if (magicArmor) p.ignored = 'doesn’t work with magical armor'
      else if (magicShield) p.ignored = 'doesn’t work with a shield'
    }
  }
  return parts
}

/** Soma dos bônus que contam (a CA baixa nesse tanto). */
export const itemACBonus = (items: QuantifiedItem[] | null | undefined): number =>
  itemACParts(items).reduce((sum, p) => sum + (p.ignored ? 0 : p.bonus), 0)

// --- Armadura e escudo comuns (página 2, 2026-10-24) ------------------------------
// Os campos Armor/Shield da página 2 guardam o número, no formato do iPad
// (`ArmorPickerSheet`): a armadura grava o AC base dela ("3" = plate mail), o
// escudo grava "-1" (regra do PHB: qualquer escudo melhora a AC em 1). A caixa
// ARMOR da página 1 é armadura + escudo, recalculada quando uma peça muda (o
// jogador pode digitar por cima; a próxima troca recalcula). Os nomes vão para
// "Type Worn". Diferença do iPad: lá o bônus mágico também sai da caixa; aqui
// ele sai da CA final (itemACParts), e o iPad tem a pendência de alinhar.

/** "3", "-1", "−1" → número; vazio ou outra coisa → null. */
export function parsedRating(text: string | null | undefined): number | null {
  const t = (text ?? '').trim().replace(/[−–—]/g, '-')
  return /^[+-]?\d+$/.test(t) ? parseInt(t, 10) : null
}

/** A caixa ARMOR pelas peças: AC base da armadura (sem armadura, 10) + escudo; null se não há peça. */
export function armorBoxFromPieces(c: Pick<PlayerCharacter, 'armorRating' | 'shieldRating'>): number | null {
  const armor = parsedRating(c.armorRating)
  const shield = parsedRating(c.shieldRating)
  if (armor == null && shield == null) return null
  return (armor ?? 10) + (shield ?? 0)
}

export interface ArmorPick {
  name: string
  /** AC base da armadura; escudo: o ajuste (−1). */
  rating: number
}

/**
 * Troca a armadura ou o escudo (null = tirar; undefined = não mexer): grava o
 * número no formato do iPad, os nomes em Type Worn e recalcula a caixa ARMOR.
 */
export function setArmorPieces(
  c: Pick<PlayerCharacter, 'armorRating' | 'shieldRating' | 'armorClass' | 'combat'>,
  pieces: { armor?: ArmorPick | null; shield?: ArmorPick | null; armorName?: string | null; shieldName?: string | null },
) {
  if (pieces.armor !== undefined) c.armorRating = pieces.armor ? String(pieces.armor.rating) : ''
  if (pieces.shield !== undefined) c.shieldRating = pieces.shield ? String(pieces.shield.rating) : ''
  const armorName = pieces.armor !== undefined ? (pieces.armor?.name ?? null) : (pieces.armorName ?? null)
  const shieldName = pieces.shield !== undefined ? (pieces.shield?.name ?? null) : (pieces.shieldName ?? null)
  const worn = [armorName, shieldName].filter((n): n is string => !!n).join(', ')
  c.combat = { ...(c.combat ?? {}), typeWorn: worn === '' ? null : worn }
  c.armorClass = armorBoxFromPieces(c) ?? 10
}

/** A peça escolhida, achada pelo nome em Type Worn (e conferida pelo número) ou só pelo número. */
export function currentPiece<T extends { name: string; baseAC?: number | null }>(
  options: T[],
  rating: number | null,
  typeWorn: string | null | undefined,
  ratingOf: (piece: T) => number | null,
): T | null {
  if (rating == null) return null
  const worn = (typeWorn ?? '').toLowerCase()
  const same = options.filter((p) => ratingOf(p) === rating)
  return same.find((p) => worn.includes(p.name.toLowerCase())) ?? same[0] ?? null
}
