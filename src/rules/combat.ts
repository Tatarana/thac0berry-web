// Combat Tracker (docs/controle-de-combate.md): o modelo de um encontro e as
// regras do combate na mesa. Só funções puras; a tela só exibe e chama.
// Dados de rolagem pelo motor único (dice.ts).

import { diceForRange, rollDice, type DiceSpec, type Random } from './dice.ts'

export type Side = 'party' | 'enemies' | 'others'
export type CombatantKind = 'pc' | 'npc' | 'monster'

export interface Condition {
  id: string
  name: string
  /** Rodadas que faltam; null = sem prazo. */
  rounds: number | null
}

/** "Steady (11-12)": a faixa de moral do Monstrous Manual (DMG cap. 9, Tabela 49). */
export interface MoraleRating {
  text: string
  low: number
  high: number
}

export interface Combatant {
  id: string
  name: string
  kind: CombatantKind
  side: Side
  ac: number | null
  /** Como veio da fonte ("6 (10)": com e sem armadura). */
  acText: string
  hp: number | null
  hpMax: number | null
  thac0: number | null
  attacks: string
  damage: string
  morale: MoraleRating | null
  xp: number | null
  hitDice: string
  notes: string
  conditions: Condition[]
  /** PC do App (ficha na campanha). */
  characterID: string | null
  /** Monstro do catálogo (abre a ficha). */
  monsterID: string | null
  monsterFile: string | null
}

export interface Encounter {
  id: string
  name: string
  campaignID: string | null
  createdAt: string
  updatedAt: string
  round: number
  combatants: Combatant[]
}

export interface CombatSettings {
  /** Decisão 2: o DM escolhe o padrão (DMG: por lado; opcional: individual). */
  initiative: 'side' | 'individual'
  /** Decisão 5: PV de monstro rolados pelos DV ou pela média. */
  monsterHp: 'roll' | 'average'
  /** PV em que o combatente morre: -10 (regra opcional do DMG, "Hovering on Death's Door") ou 0. */
  deathAt: number
}

export const defaultSettings: CombatSettings = { initiative: 'side', monsterHp: 'roll', deathAt: -10 }

export const sideLabels: Record<Side, string> = { party: 'Party', enemies: 'Enemies', others: 'Others' }

// --- PV pelos Dados de Vida ------------------------------------------------------------

/** O que dá para tirar do texto de DV: dados (d8 por DV) ou um valor fixo de PV. */
export type HitDiceSpec = { dice: DiceSpec } | { fixed: number }

/**
 * DV do Monstrous Manual: "4", "4+1", "1-1", "11+", "12 (base)" (d8 cada);
 * "½" (1d4) e "¼" (1d2); "1 hp"/"1 hit point" (fixo); "1-4 hp" e "1d4 hp"
 * (o dado). Com PV entre parênteses, valem eles: "9 (40 hp)" e "3+1 (hp 27)"
 * são fixos; "½ (1-4 hp)" rola a faixa. null quando é escolha ou não dá
 * ("Varies", "8, 12, or 16", "2 to 4"): o DM digita os PV.
 */
export function parseHitDice(text: string | null | undefined): HitDiceSpec | null {
  const first = (text ?? '').split('\n')[0].trim().replace(/hit points?/gi, 'hp')
  // PV entre parênteses mandam: "9 (40 hp)", "3+1 (hp 27)", "½ (1-4 hp)".
  const inner = /\(([^)]*\bhp\b[^)]*)\)/i.exec(first)?.[1].replace(/^hp\s*(\d+)$/i, '$1 hp')
  if (inner) {
    const fromInner = hpText(inner.trim())
    if (fromInner) return fromInner
  }
  const clean = first.replace(/\s*\([^)]*\)\s*$/, '').trim()
  return hpText(clean) ?? diceText(clean)
}

/** "40 hp", "1-4 hp", "1d4 hp". */
function hpText(text: string): HitDiceSpec | null {
  let match = /^(\d+)\s*hp$/i.exec(text)
  if (match) return { fixed: Number(match[1]) }
  match = /^(\d+)\s*[-–]\s*(\d+)\s*hp$/i.exec(text)
  if (match) {
    const spec = diceForRange(Number(match[1]), Number(match[2]))
    return spec ? { dice: spec } : null
  }
  match = /^(\d*)d(\d+)\s*hp$/i.exec(text)
  if (match) return { dice: { count: Number(match[1] || 1), sides: Number(match[2]), modifier: 0 } }
  return null
}

/** "4", "4+1", "1-1", "11+", "½", "¼": d8 por DV. */
function diceText(text: string): HitDiceSpec | null {
  const clean = text.replace('½', '1/2').replace('¼', '1/4')
  if (clean === '1/2') return { dice: { count: 1, sides: 4, modifier: 0 } }
  if (clean === '1/4') return { dice: { count: 1, sides: 2, modifier: 0 } }
  const match = /^(\d+)\s*(?:([+-])\s*(\d+))?\+?$/.exec(clean)
  if (!match) return null
  const count = Number(match[1])
  if (count < 1) return null
  const modifier = match[3] ? Number(match[3]) * (match[2] === '-' ? -1 : 1) : 0
  return { dice: { count, sides: 8, modifier } }
}

/** PV de um monstro: rolados ou na média (arredonda para baixo); nunca menos que 1. */
export function hitPoints(spec: HitDiceSpec, mode: CombatSettings['monsterHp'], random?: Random): number {
  if ('fixed' in spec) return Math.max(1, spec.fixed)
  const { count, sides, modifier } = spec.dice
  const value = mode === 'average' ? Math.floor((count * (sides + 1)) / 2) + modifier : rollDice(spec.dice, random).total
  return Math.max(1, value)
}

// --- Moral ------------------------------------------------------------------------------

/** "Steady (11-12)", "Elite (13)", "12" → faixa; null se não houver número. */
export function parseMorale(text: string | null | undefined): MoraleRating | null {
  const clean = (text ?? '').split('\n')[0].trim()
  const match = /(\d+)(?:\s*[-–]\s*(\d+))?/.exec(clean)
  if (!match) return null
  const low = Number(match[1])
  const high = match[2] ? Number(match[2]) : low
  return { text: clean, low: Math.min(low, high), high: Math.max(low, high) }
}

// --- Combatentes -------------------------------------------------------------------------

const newID = () => crypto.randomUUID().toUpperCase()

export function blankCombatant(kind: CombatantKind, side: Side, name = ''): Combatant {
  return {
    id: newID(),
    name,
    kind,
    side,
    ac: null,
    acText: '',
    hp: null,
    hpMax: null,
    thac0: null,
    attacks: '',
    damage: '',
    morale: null,
    xp: null,
    hitDice: '',
    notes: '',
    conditions: [],
    characterID: null,
    monsterID: null,
    monsterFile: null,
  }
}

/**
 * Nomes para `count` cópias: "Orc" sozinho se é o primeiro e único; senão
 * "Orc 1", "Orc 2"… continuando depois do maior número que já existe.
 */
export function numberedNames(base: string, count: number, existing: string[]): string[] {
  const name = base.trim() || 'Combatant'
  const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`)
  const numbers = existing.map((n) => pattern.exec(n)?.[1]).filter((n): n is string => n !== undefined).map(Number)
  const taken = existing.includes(name)
  if (count === 1 && numbers.length === 0 && !taken) return [name]
  const start = Math.max(0, ...numbers, taken ? 1 : 0)
  return Array.from({ length: count }, (_, i) => `${name} ${start + i + 1}`)
}

/** Estatísticas de uma variante de monstro (o texto da ficha, com os números quando há). */
export interface MonsterStats {
  name: string
  armorClass?: { text: string; value: number | null }
  hitDice?: { text: string; value: number | null }
  thac0?: { text: string; value: number | null }
  xp?: { text: string; value: number | null }
  attacks?: string
  damage?: string
  morale?: string
}

/**
 * `count` combatentes de um monstro do catálogo: CA, THAC0, ataques, dano,
 * moral e XP da ficha; PV pelos DV (rolados ou na média) — sem DV legível, os
 * PV ficam em branco para o DM digitar.
 */
export function monsterCombatants(
  stats: MonsterStats,
  source: { monsterID: string; monsterFile: string },
  count: number,
  side: Side,
  existingNames: string[],
  mode: CombatSettings['monsterHp'],
  random?: Random,
): Combatant[] {
  const spec = parseHitDice(stats.hitDice?.text)
  return numberedNames(stats.name, count, existingNames).map((name) => {
    const hp = spec ? hitPoints(spec, mode, random) : null
    return {
      ...blankCombatant('monster', side, name),
      ac: stats.armorClass?.value ?? null,
      acText: stats.armorClass?.text.split('\n')[0] ?? '',
      hp,
      hpMax: hp,
      thac0: stats.thac0?.value ?? null,
      attacks: stats.attacks ?? '',
      damage: stats.damage ?? '',
      morale: parseMorale(stats.morale),
      xp: stats.xp?.value ?? null,
      hitDice: stats.hitDice?.text.split('\n')[0] ?? '',
      ...source,
    }
  })
}

/** Um PC do App: nome, CA, PV e THAC0 da ficha. */
export function characterCombatant(id: string, pc: { name: string; armorClass: number; hitPointsMax: number; hitPointsCurrent: number; thac0: number }): Combatant {
  return {
    ...blankCombatant('pc', 'party', pc.name || 'Unnamed Character'),
    ac: pc.armorClass,
    acText: String(pc.armorClass),
    hp: pc.hitPointsCurrent,
    hpMax: pc.hitPointsMax,
    thac0: pc.thac0,
    characterID: id,
  }
}

// --- PV e estados --------------------------------------------------------------------------

export type Status = 'ok' | 'down' | 'dead'

/** Caído com 0 PV ou menos; morto ao chegar em `deathAt` (−10 pela regra opcional; 0 = morre em 0). */
export function statusOf(c: Pick<Combatant, 'hp'>, deathAt: number): Status {
  if (c.hp === null) return 'ok'
  if (c.hp <= deathAt) return 'dead'
  return c.hp <= 0 ? 'down' : 'ok'
}

/** Dano (delta negativo) ou cura (positivo); a cura não passa do máximo. */
export function changeHp<T extends Pick<Combatant, 'hp' | 'hpMax'>>(c: T, delta: number): T {
  if (c.hp === null || !Number.isFinite(delta) || delta === 0) return c
  const raised = c.hp + delta
  const hp = delta > 0 && c.hpMax !== null ? Math.min(raised, Math.max(c.hpMax, c.hp)) : raised
  return { ...c, hp }
}

/** Fim de rodada: as condições com prazo perdem uma rodada e as que chegam a 0 saem. */
export function tickConditions(conditions: Condition[]): Condition[] {
  return conditions.flatMap((c) => (c.rounds === null ? [c] : c.rounds > 1 ? [{ ...c, rounds: c.rounds - 1 }] : []))
}

// --- Encontros ------------------------------------------------------------------------------

export function newEncounter(name: string, campaignID: string | null, now: string): Encounter {
  return { id: newID(), name, campaignID, createdAt: now, updatedAt: now, round: 0, combatants: [] }
}

/** Combatentes de um lado, na ordem em que entraram. */
export const ofSide = (e: Pick<Encounter, 'combatants'>, side: Side) => e.combatants.filter((c) => c.side === side)
