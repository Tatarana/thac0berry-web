// Itens mágicos criados pelo mestre ou pelo jogador (2026-10-24; backend
// `custom_magic_item`). Só funções puras: o item novo (vazio ou copiado de um
// item do livro), a cópia que a linha da ficha guarda e a atualização dessas
// cópias quando o item muda (decisão do usuário: atualiza sozinha).

import type { MagicItem } from '../data/magicItems.ts'
import type { CustomItemSnapshot, CustomMagicItemData, PlayerCharacter } from '../types/library.ts'

/** Item novo, em branco. */
export const emptyCustomItem = (): CustomMagicItemData => ({ name: '', category: 'Miscellaneous', summary: '', description: '' })

/** Começar de um item do livro: copia nome, categoria, texto, valores, cargas e bônus. */
export function customItemFromCompendium(item: MagicItem): CustomMagicItemData {
  const defense = item.defenseBonus ?? null
  return {
    name: item.name,
    category: item.classification.broadCategory || 'Miscellaneous',
    summary: item.description.briefSummary,
    description: item.description.fullText,
    xpValue: item.economyAndXP.xpValue ?? null,
    goldValue: item.economyAndXP.goldValue ?? null,
    charges: item.power?.maxCharges ?? null,
    attackBonus: item.enchantment?.attackBonus ?? defense?.attackBonus ?? null,
    damageBonus: item.enchantment?.damageBonus ?? null,
    acBonus: defense?.acBonus ?? null,
    saveBonus: defense?.savingThrowBonus ?? null,
    basedOn: item.id,
  }
}

/** Ids iguais, sem diferença de maiúsculas (o banco devolve o uuid em minúsculas; a ficha grava em maiúsculas). */
export const sameID = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.toUpperCase() === b.toUpperCase()

/** A cópia que a linha da ficha guarda. */
export const customSnapshot = (row: { id: string; version: number; data: CustomMagicItemData }): CustomItemSnapshot => ({
  id: row.id.toUpperCase(),
  version: row.version,
  data: row.data,
})

/**
 * Atualiza as cópias das linhas de Magic Items cujo item mudou (versão maior)
 * e o nome da linha junto. Devolve true se mudou algo.
 */
export function refreshCustomItems(c: Pick<PlayerCharacter, 'page2MagicItems'>, rows: { id: string; version: number; data: CustomMagicItemData }[]): boolean {
  let changed = false
  c.page2MagicItems = (c.page2MagicItems ?? []).map((line) => {
    const snap = line.customItem
    if (!snap) return line
    const row = rows.find((r) => sameID(r.id, snap.id))
    if (!row || row.version <= snap.version) return line
    changed = true
    return { ...line, name: row.data.name, customItem: customSnapshot(row) }
  })
  return changed
}

/** Bônus do item em texto curto ("+2 attack, +2 damage, −1 AC"), para a lista e a descrição. */
export function customItemBonuses(d: CustomMagicItemData): string[] {
  const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')
  const out: string[] = []
  if (d.attackBonus) out.push(`${signed(d.attackBonus)} attack`)
  if (d.damageBonus) out.push(`${signed(d.damageBonus)} damage`)
  // Na 2e, CA menor é melhor: um bônus de proteção +2 baixa a CA em 2.
  if (d.acBonus) out.push(`${signed(d.acBonus)} AC bonus`)
  if (d.saveBonus) out.push(`${signed(d.saveBonus)} saving throws`)
  if (d.charges) out.push(`${d.charges} charges`)
  return out
}
