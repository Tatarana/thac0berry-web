// Fixar no Shield (opção A do DM Shield, 2026-10-17): o mestre fixa tabelas,
// monstros ou fichas na campanha ativa (coluna `campaign.pinned_items`), para
// acesso rápido em DM Tools. Só funções puras.

export type PinKind = 'table' | 'monster' | 'character' | 'session'

export interface PinnedItem {
  kind: PinKind
  refID: string
  label: string
}

export const isPinned = (items: PinnedItem[], kind: PinKind, refID: string): boolean => items.some((i) => i.kind === kind && i.refID === refID)

/** Fixa (no fim, sem repetir) ou desafixa. */
export function togglePin(items: PinnedItem[], item: PinnedItem): PinnedItem[] {
  return isPinned(items, item.kind, item.refID) ? items.filter((i) => !(i.kind === item.kind && i.refID === item.refID)) : [...items, item]
}
