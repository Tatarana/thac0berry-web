// Catálogo de monstros (ferramenta do DM): busca, filtros, ordenação e as
// linhas do bloco de estatísticas no formato do Monstrous Manual. Só funções puras.

import { normalize } from '../lib/search.ts'
import type { EcologyField, MonsterIndexEntry, MonsterVariant, StatField, TextCombatField } from '../data/monsters.ts'

/** Ordem das coleções nos chips (o Monstrous Manual primeiro). */
export const monsterCollections = [
  'Monstrous Manual Core',
  'MC Annuals',
  'Forgotten Realms & Continents',
  'Greyhawk',
  'Dragonlance',
  'Ravenloft',
  'Dark Sun',
  'Planescape',
  'Spelljammer',
  'Mystara & Savage Coast',
  'Other Campaigns / Magazines',
]

export const frequencyBuckets = ['Common', 'Uncommon', 'Rare', 'Very rare', 'Unique', 'Other'] as const
export type FrequencyBucket = (typeof frequencyBuckets)[number]

/** Faixa de frequência pelo começo do texto ("Very rare (common in the Abyss)" -> Very rare). */
export function frequencyBucket(frequency: string | null | undefined): FrequencyBucket {
  const f = (frequency ?? '').trim().toLowerCase()
  if (f.startsWith('very rare') || f.startsWith('very')) return 'Very rare'
  if (f.startsWith('unique')) return 'Unique'
  if (f.startsWith('uncommon')) return 'Uncommon'
  if (f.startsWith('rare')) return 'Rare'
  if (f.startsWith('common')) return 'Common'
  return 'Other'
}

export type MonsterSort = 'name' | 'hitDice' | 'xp'

export interface MonsterFilter {
  query: string
  collection: string | null
  frequency: FrequencyBucket | null
  sort: MonsterSort
}

/** Busca (nome e apelidos), filtros e ordenação; sem valor numérico vai para o fim. */
export function filterMonsters(list: MonsterIndexEntry[], f: MonsterFilter): MonsterIndexEntry[] {
  const target = normalize(f.query)
  const out = list.filter((m) => {
    if (f.collection && m.collection !== f.collection) return false
    if (f.frequency && frequencyBucket(m.frequency) !== f.frequency) return false
    if (target === '') return true
    return normalize(m.name).includes(target) || m.aliases.some((a) => normalize(a).includes(target))
  })
  const byName = (a: MonsterIndexEntry, b: MonsterIndexEntry) => a.name.localeCompare(b.name)
  const byNumber = (pick: (m: MonsterIndexEntry) => number | null | undefined) => (a: MonsterIndexEntry, b: MonsterIndexEntry) => {
    const x = pick(a)
    const y = pick(b)
    if (x == null && y == null) return byName(a, b)
    if (x == null) return 1
    if (y == null) return -1
    return x - y || byName(a, b)
  }
  if (f.sort === 'hitDice') return out.sort(byNumber((m) => m.hitDiceMin))
  if (f.sort === 'xp') return out.sort(byNumber((m) => m.xpMin))
  return out.sort(byName)
}

/** "1,400" ou "1,400–3,000" (variantes), ou o texto do HD; null sem nada. */
export function xpLabel(m: Pick<MonsterIndexEntry, 'xpMin' | 'xpMax'>): string | null {
  if (m.xpMin == null) return null
  const fmt = (n: number) => n.toLocaleString('en-US')
  return m.xpMax != null && m.xpMax !== m.xpMin ? `${fmt(m.xpMin)}–${fmt(m.xpMax)}` : fmt(m.xpMin)
}

export interface StatRow {
  label: string
  value: (v: MonsterVariant) => string | null
}

const eco = (field: EcologyField) => (v: MonsterVariant) => v.ecology[field] ?? null
const text = (field: TextCombatField) => (v: MonsterVariant) => v.combat[field] ?? null
const stat = (field: StatField) => (v: MonsterVariant) => v.combat[field]?.text ?? null

/** Linhas do bloco de estatísticas, na ordem do Monstrous Manual. */
export const ecologyRows: StatRow[] = [
  { label: 'Climate/Terrain', value: eco('climateTerrain') },
  { label: 'Frequency', value: eco('frequency') },
  { label: 'Organization', value: eco('organization') },
  { label: 'Activity Cycle', value: eco('activityCycle') },
  { label: 'Diet', value: eco('diet') },
  { label: 'Intelligence', value: eco('intelligence') },
  { label: 'Treasure', value: eco('treasure') },
  { label: 'Alignment', value: eco('alignment') },
]

export const combatRows: StatRow[] = [
  { label: 'No. Appearing', value: text('numberAppearing') },
  { label: 'Armor Class', value: stat('armorClass') },
  { label: 'Movement', value: text('movement') },
  { label: 'Hit Dice', value: stat('hitDice') },
  { label: 'THAC0', value: stat('thac0') },
  { label: 'No. of Attacks', value: text('attacks') },
  { label: 'Damage/Attack', value: text('damage') },
  { label: 'Special Attacks', value: text('specialAttacks') },
  { label: 'Special Defenses', value: text('specialDefenses') },
  { label: 'Magic Resistance', value: text('magicResistance') },
  { label: 'Size', value: text('size') },
  { label: 'Morale', value: text('morale') },
  { label: 'XP Value', value: stat('xp') },
]

/** Linhas extras de cenário (Birthright: Bloodline...), na ordem em que aparecem. */
export function extraRows(variants: MonsterVariant[]): StatRow[] {
  const labels: string[] = []
  for (const v of variants) for (const k of Object.keys(v.extra ?? {})) if (!labels.includes(k)) labels.push(k)
  return labels.map((label) => ({ label, value: (v: MonsterVariant) => v.extra?.[label] ?? null }))
}

/** Texto completo em blocos: "## Combat" vira título; o resto, parágrafos. */
export function textBlocks(full: string | null | undefined): { heading: string | null; text: string }[] {
  const blocks: { heading: string | null; text: string }[] = []
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] }
  const flush = () => {
    const t = current.lines.join('\n').trim()
    if (t || current.heading) blocks.push({ heading: current.heading, text: t })
  }
  for (const line of (full ?? '').split('\n')) {
    const m = line.match(/^#{1,4}\s*(.+?)\s*$/)
    if (m) {
      flush()
      current = { heading: m[1], lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  flush()
  return blocks.filter((b) => b.text || b.heading)
}
