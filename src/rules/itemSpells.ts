// Itens que lançam magias na spell sheet (pedido do usuário, 2026-10-24): ao
// criar a folha, cada item de Magic Items da ficha com funções no catálogo
// (`power.uses`, ou o `power.spell` antigo) entra na folha com uma linha por
// função. Só funções puras; quem carrega o catálogo é `src/lib/itemSpells.ts`.

import type { MagicItem as CatalogItem, PowerUse, SpellRef } from '../data/magicItems.ts'
import { normalize } from '../lib/search.ts'
import type { MagicItem as SheetItem, SpellSheet } from '../types/library.ts'

const newID = () => crypto.randomUUID().toUpperCase()

/** O padrão de usos de uma linha de item quando o livro não dá limite (o mesmo do "+ add spell"). */
export const defaultItemUses = 20

/**
 * As funções do item: `power.uses`, ou só a magia do `power.spell` dos itens
 * ainda não levantados. `uses: []` é "nenhuma função" (efeito passivo, como o
 * Ring of Free Action), mesmo com `power.spell`.
 */
export function itemPowerUses(item: Pick<CatalogItem, 'power'>): PowerUse[] {
  const power = item.power
  if (power?.uses) return power.uses
  if (power?.spell) return [{ name: power.spell.name, spell: power.spell, chargeCost: power.chargeBased ? 1 : null }]
  return []
}

/**
 * O item como a folha guarda: uma linha por função, com a magia ligada
 * (`spellID` acha o id da base de magias pelo SpellRef), o limite (por dia,
 * senão as cargas do item, senão o padrão) e o dano ou cura do item.
 */
export function sheetItemFromCatalog(item: CatalogItem, spellID: (ref: SpellRef) => string | null): SheetItem | null {
  const uses = itemPowerUses(item)
  if (uses.length === 0) return null
  return {
    id: newID(),
    name: item.name,
    matchedItemID: item.id,
    itemDescription: '',
    spells: uses.map((u) => ({
      id: newID(),
      spellName: u.name,
      matchedSpellID: u.spell ? spellID(u.spell) : null,
      damageNote: u.effect ?? '',
      maxUses: Math.min(99, Math.max(1, u.perDay ?? item.power?.maxCharges ?? defaultItemUses)),
      usedCount: 0,
    })),
  }
}

/** O item já está na folha (mesmo item do catálogo, ou o mesmo nome)? */
export function sheetHasItem(sheet: Pick<SpellSheet, 'magicItems'>, item: Pick<SheetItem, 'name' | 'matchedItemID'>): boolean {
  return sheet.magicItems.some(
    (m) => (!!item.matchedItemID && m.matchedItemID === item.matchedItemID) || normalize(m.name) === normalize(item.name),
  )
}

/** Acrescenta à folha os itens que ainda não estão nela (a folha herda os do dia anterior). */
export function addSheetItems<T extends Pick<SpellSheet, 'magicItems'>>(sheet: T, items: SheetItem[]): T {
  const missing = items.filter((item) => !sheetHasItem(sheet, item))
  return missing.length === 0 ? sheet : { ...sheet, magicItems: [...sheet.magicItems, ...missing] }
}
