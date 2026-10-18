// Fixar no Shield (opção A do DM Shield, 2026-10-17): o mestre fixa tabelas,
// monstros ou fichas na campanha ativa (coluna `campaign.pinned_items`), para
// acesso rápido em DM Tools. Só funções puras.

export type PinKind = 'table' | 'monster' | 'character' | 'session'

export interface WidgetSize {
  w: number
  h: number
}

export interface PinnedItem {
  kind: PinKind
  refID: string
  label: string
  /** Página da tela Pinned (PS5): ausente/`undefined` = página 0 (fichas antigas). */
  page?: number
  /** Tamanho do widget na grade da tela Pinned (PS6), de 1×1 a 3×3; ausente = 1×1. */
  size?: WidgetSize
}

export const defaultWidgetSize: WidgetSize = { w: 1, h: 1 }
export const widgetSizeOf = (item: PinnedItem): WidgetSize => item.size ?? defaultWidgetSize

export const isPinned = (items: PinnedItem[], kind: PinKind, refID: string): boolean => items.some((i) => i.kind === kind && i.refID === refID)

/** Fixa (no fim, sem repetir) ou desafixa. */
export function togglePin(items: PinnedItem[], item: PinnedItem): PinnedItem[] {
  return isPinned(items, item.kind, item.refID) ? items.filter((i) => !(i.kind === item.kind && i.refID === item.refID)) : [...items, item]
}

const pinKey = (item: PinnedItem) => `${item.kind}:${item.refID}`

/** As páginas que já têm algo fixado (widget: tabela ou monstro), em ordem; `[0]` se nenhuma. */
export function widgetPages(items: PinnedItem[]): number[] {
  const set = new Set((items.length ? items : []).filter((i) => i.kind === 'table' || i.kind === 'monster').map((i) => i.page ?? 0))
  if (set.size === 0) set.add(0)
  return [...set].sort((a, b) => a - b)
}

/** Recoloca um subconjunto (mesma página) na ordem pedida, sem mexer no resto da lista. */
export function reorderWithin(all: PinnedItem[], orderedSubset: PinnedItem[]): PinnedItem[] {
  const keys = new Set(orderedSubset.map(pinKey))
  const queue = [...orderedSubset]
  return all.map((item) => (keys.has(pinKey(item)) ? (queue.shift() ?? item) : item))
}

/** Move um item fixado pra outra página (mantém o lugar dele na lista). */
export function moveToPage(items: PinnedItem[], target: PinnedItem, page: number): PinnedItem[] {
  return items.map((item) => (item.kind === target.kind && item.refID === target.refID ? { ...item, page } : item))
}

/** Muda o tamanho (1×1 a 3×3) de um widget fixado. */
export function resizeWidget(items: PinnedItem[], target: PinnedItem, size: WidgetSize): PinnedItem[] {
  return items.map((item) => (item.kind === target.kind && item.refID === target.refID ? { ...item, size } : item))
}
