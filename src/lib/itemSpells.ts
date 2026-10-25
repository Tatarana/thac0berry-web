// Itens que lançam magias na spell sheet nova (regras em src/rules/itemSpells.ts):
// carrega do catálogo os itens de Magic Items da ficha e acrescenta à folha os
// que têm funções e ainda não estão nela. Melhor esforço: se o catálogo não
// carregar, a folha nasce sem eles (o "+ add item" continua lá).

import { loadMagicIndex, loadMagicItem, type SpellRef } from '../data/magicItems'
import { loadSpellIndex, type SpellIndexEntry } from '../data/spells'
import { addSheetItems, sheetItemFromCatalog } from '../rules/itemSpells'
import type { MagicItem as SheetItem, PlayerCharacter, SpellSheet } from '../types/library'
import { normalize } from './search'

/** Os itens da ficha (página 2, Magic Items) que lançam magias, como a folha os guarda. */
export async function characterSpellItems(c: Pick<PlayerCharacter, 'page2MagicItems'>): Promise<SheetItem[]> {
  // Item criado (homebrew) não tem funções no catálogo.
  const lines = (c.page2MagicItems ?? []).filter((line) => !line.customItem && (line.matchedItemID || (line.name ?? '').trim() !== ''))
  if (lines.length === 0) return []
  const [index, spells] = await Promise.all([loadMagicIndex(), loadSpellIndex()])
  const byName = (list: SpellIndexEntry[], name: string) => {
    const found = list.filter((s) => normalize(s.name) === normalize(name))
    return found.find((s) => s.setting === 'Generic') ?? found[0]
  }
  const spellID = (ref: SpellRef) => byName(ref.class === 'Wizard' ? spells.arcane : spells.divine, ref.name)?.id ?? null
  const items = await Promise.all(
    lines.map(async (line) => {
      const entry =
        index.find((e) => e.id === line.matchedItemID) ?? index.find((e) => normalize(e.name) === normalize(line.name ?? ''))
      const item = entry ? await loadMagicItem(entry) : undefined
      return item ? sheetItemFromCatalog(item, spellID) : null
    }),
  )
  return items.filter((item): item is SheetItem => item !== null)
}

/** A folha nova com os itens da ficha que lançam magias (sem repetir os herdados). */
export async function withCharacterItems<T extends Pick<SpellSheet, 'magicItems'>>(sheet: T, c: Pick<PlayerCharacter, 'page2MagicItems'>): Promise<T> {
  try {
    return addSheetItems(sheet, await characterSpellItems(c))
  } catch {
    return sheet
  }
}
