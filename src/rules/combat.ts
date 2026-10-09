// Combat Tracker (docs/controle-de-combate.md): o modelo de um encontro e as
// regras do combate na mesa. Só funções puras; a tela só exibe e chama.
// Dados de rolagem pelo motor único (dice.ts).

import { diceForRange, formatDice, rollDice, type DiceSpec, type Random } from './dice.ts'

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
  /** Tabela de THAC0 por PV do livro (Beholder): o THAC0 acompanha os PV rolados. */
  thac0Text?: string
  /** Último teste de moral (CT3); ausente em combatentes de antes do CT3. */
  lastMorale?: MoraleCheck | null
}

export interface Encounter {
  id: string
  name: string
  campaignID: string | null
  createdAt: string
  updatedAt: string
  round: number
  combatants: Combatant[]
  /** Iniciativa da rodada (CT2); ausente em encontros de antes do CT2. */
  initiative?: InitiativeRound | null
  /** Fotos do começo de cada rodada, para voltar no tempo; ausente em encontros antigos. */
  history?: RoundSnapshot[]
  /** Quando o DM encerrou o encontro ("End encounter"); ausente/null = em andamento. */
  endedAt?: string | null
  /** Teste de surpresa antes da rodada 1 (CT5a); o lado surpreso não age na rodada 1. */
  surprise?: SurpriseResult | null
  /** XP do fim do encontro (CT5a), guardado ao encerrar. */
  xpAward?: XpAward | null
}

/** Resultado da surpresa: o d10 modificado de cada lado e quem ficou surpreso. */
export interface SurpriseResult {
  totals: Partial<Record<'party' | 'enemies', number>>
  surprised: Side[]
}

/** XP de grupo do encontro (DMG cap. 8): total dos inimigos vencidos, dividido em partes iguais. */
export interface XpAward {
  total: number
  shares: number
  each: number
  foes: string[]
  members: string[]
}

/** Estado de combate de um combatente numa foto (nome, notas e lado não voltam). */
export interface CombatantState {
  hp: number | null
  hpMax: number | null
  thac0: number | null
  conditions: Condition[]
  lastMorale: MoraleCheck | null
}

/** Foto do encontro no começo de uma rodada. */
export interface RoundSnapshot {
  round: number
  combatants: Record<string, CombatantState>
  /** Iniciativa da rodada (a ordem, quando a rodada começou). */
  initiative: InitiativeRound
}

export interface CombatSettings {
  /** Decisão 2: o DM escolhe o padrão (DMG: por lado; opcional: individual). */
  initiative: 'side' | 'individual'
  /** Decisão 5: PV de monstro rolados pelos DV ou pela média. */
  monsterHp: 'roll' | 'average'
  /** PV em que o combatente morre: -10 (regra opcional do DMG, "Hovering on Death's Door") ou 0. */
  deathAt: number
  /** Tabelas rápidas do DM (CT4, src/rules/quickTables.ts); ausente = a lista padrão. */
  quickTables?: string[] | null
}

export const defaultSettings: CombatSettings = { initiative: 'side', monsterHp: 'roll', deathAt: -10 }

export const sideLabels: Record<Side, string> = { party: 'Party', enemies: 'Enemies', others: 'Others' }

// --- PV pelos Dados de Vida ------------------------------------------------------------

/** O que dá para tirar do texto de DV: dados (d8 por DV) ou um valor fixo de PV. */
export type HitDiceSpec = { dice: DiceSpec; bonus?: DiceSpec } | { fixed: number } | { between: [number, number] }

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
  // Gigantes: "14 + 1-4 hit points" (14d8 mais 1d4 PV).
  const giant = /^(\d+)\s*\+\s*(\d+)\s*[-–]\s*(\d+)\s*hp$/i.exec(clean)
  if (giant) {
    const bonus = diceForRange(Number(giant[2]), Number(giant[3]))
    return bonus ? { dice: { count: Number(giant[1]), sides: 8, modifier: 0 }, bonus } : null
  }
  return hpText(clean) ?? diceText(clean)
}

/** "40 hp", "1-4 hp", "1d4 hp". */
function hpText(text: string): HitDiceSpec | null {
  let match = /^(\d+)\s*hp$/i.exec(text)
  if (match) return { fixed: Number(match[1]) }
  match = /^(\d+)\s*[-–]\s*(\d+)\s*hp$/i.exec(text)
  if (match) {
    const [low, high] = [Number(match[1]), Number(match[2])]
    const spec = diceForRange(low, high)
    // Sem dado padrão ("45-75 hp", Beholder): sorteia na faixa.
    return spec ? { dice: spec } : high > low ? { between: [low, high] } : null
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
  // "4-7" é faixa de DV (o DM escolhe, hitDiceChoices), não 4d8−7; "1-1" é modificador.
  if (match[2] === '-' && Number(match[3]) > count) return null
  const modifier = match[3] ? Number(match[3]) * (match[2] === '-' ? -1 : 1) : 0
  return { dice: { count, sides: 8, modifier } }
}

/**
 * DV para o DM escolher quando o livro dá faixa ou lista: "4-7" e "2 to 8"
 * (cada valor), "6+3 to 8+3" e "7+7 to 9+9" (mantém o padrão do bônus),
 * "8, 12, or 16"; vazio quando não é escolha ("4+1", "Varies").
 */
export function hitDiceChoices(text: string | null | undefined): string[] {
  const clean = (text ?? '').split('\n')[0].replace(/\s*\([^)]*\)\s*$/, '').trim()
  const list = clean.split(/\s*,\s*(?:or\s+)?|\s+or\s+/)
  if (list.length > 1 && list.every((x) => /^\d+(?:\+\d+)?$/.test(x))) return list
  const range = /^(\d+)(?:\+(\d+))?\s*(?:-|–|to)\s*(\d+)(?:\+(\d+))?$/.exec(clean)
  if (!range) return []
  const [low, high] = [Number(range[1]), Number(range[3])]
  if (high <= low || (range[2] === undefined) !== (range[4] === undefined)) return []
  const plus = (n: number) => {
    if (range[2] === undefined) return ''
    if (range[2] === range[4]) return `+${range[2]}` // "6+3 to 8+3"
    if (Number(range[2]) === low && Number(range[4]) === high) return `+${n}` // "7+7 to 9+9"
    return null
  }
  if (plus(low) === null) return [`${low}+${range[2]}`, `${high}+${range[4]}`] // "2+1 to 5+4": só as pontas
  return Array.from({ length: high - low + 1 }, (_, i) => `${low + i}${plus(low + i)}`)
}

/** CA do monstro: o valor da ficha, ou o primeiro número do texto ("0 (5)" → 0, "3/7" → 3). */
export function armorClassValue(ac: { text: string; value: number | null } | undefined): number | null {
  if (ac?.value != null) return ac.value
  const match = /^\s*([-–−]?\d+)/.exec((ac?.text ?? '').split('\n')[0])
  return match ? Number(match[1].replace(/[–−]/, '-')) : null
}

/**
 * THAC0 do monstro: o valor da ficha; a linha da tabela por DV que casa com
 * os DV ("4 HD: 17 / 5-6 HD: 15"); ou o primeiro número ("7 or 5" → 7,
 * "17, but see below" → 17). null quando não dá ("Varies", "Nil").
 */
export function thac0Value(thac0: { text: string; value: number | null } | undefined, hitDice: number | null): number | null {
  if (thac0?.value != null) return thac0.value
  const text = thac0?.text ?? ''
  // Linhas "DV: THAC0"; o THAC0 tem no máximo 20 (separa linhas grudadas como "2 HD: 193-4 HD: 17").
  const rows = [...text.matchAll(/(\d+)(?:\+\d+)?(?:\s*(?:-|–|to|and)\s*(\d+)(?:\+\d+)?)?\+?\s*(?:HD|Hit Dice)\s*:\s*(20|1\d|\d)/gi)].map((m) => ({
    low: Number(m[1]),
    high: m[2] ? Number(m[2]) : /\d\+\s*(?:HD|Hit Dice)/i.test(m[0]) ? Infinity : Number(m[1]),
    value: Number(m[3]),
  }))
  if (rows.length > 0) {
    if (hitDice === null) return null
    const hd = Math.floor(hitDice)
    return rows.find((r) => hd >= r.low && hd <= r.high)?.value ?? null
  }
  const match = /^\s*(\d+)(?!\d|\s*(?:-\s*\d+\s*)?(?:hp|HD|Hit Dice))/i.exec(text)
  return match ? Number(match[1]) : null
}

/** Linhas "PV: THAC0" ("45-49 hp: 11", "70+ hp: 5"), do THAC0 que depende dos PV (Beholder). */
function thac0HpRows(text: string | undefined) {
  return [...(text ?? '').matchAll(/(\d+)\s*(?:[-–]\s*(\d+)|(\+))?\s*hp\s*:\s*(20|1\d|\d)/gi)].map((m) => ({
    low: Number(m[1]),
    high: m[2] ? Number(m[2]) : m[3] ? Infinity : Number(m[1]),
    value: Number(m[4]),
  }))
}

/** O THAC0 do livro depende dos PV (tabela "45-49 hp: 11"…). */
export const thac0DependsOnHp = (text: string | undefined) => thac0HpRows(text).length > 0

/** THAC0 pela linha dos PV; null se o texto não é uma tabela por PV ou os PV não caem em nenhuma linha. */
export function thac0ByHitPoints(text: string | undefined, hp: number | null): number | null {
  if (hp === null) return null
  return thac0HpRows(text).find((r) => hp >= r.low && hp <= r.high)?.value ?? null
}

/** PV de um monstro: rolados ou na média (arredonda para baixo); nunca menos que 1. */
export function hitPoints(spec: HitDiceSpec, mode: CombatSettings['monsterHp'], random?: Random): number {
  if ('fixed' in spec) return Math.max(1, spec.fixed)
  if ('between' in spec) {
    const [low, high] = spec.between
    return mode === 'average' ? Math.floor((low + high) / 2) : low + Math.floor((random ?? Math.random)() * (high - low + 1))
  }
  const average = (d: DiceSpec) => (d.count * (d.sides + 1)) / 2 + d.modifier
  const dice = [spec.dice, ...(spec.bonus ? [spec.bonus] : [])]
  const value = mode === 'average' ? Math.floor(dice.reduce((sum, d) => sum + average(d), 0)) : dice.reduce((sum, d) => sum + rollDice(d, random).total, 0)
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

/** O que o DM confere ao adicionar um monstro: CA, THAC0, DV (escolhido na faixa) e PV fixos opcionais. */
export interface MonsterSetup {
  ac: number | null
  thac0: number | null
  /** DV usados (o escolhido, quando o livro dá faixa). */
  hitDice: string
  /** PV iguais para todos (quando os DV não dão PV, o DM digita). */
  hp: number | null
}

/** Valores iniciais: os da ficha, lidos do texto quando o valor vem vazio; faixa de DV começa no menor. */
export function monsterSetup(stats: MonsterStats, hitDice?: string): MonsterSetup {
  const hd = hitDice ?? hitDiceChoices(stats.hitDice?.text)[0] ?? stats.hitDice?.text.split('\n')[0].trim() ?? ''
  return { ac: armorClassValue(stats.armorClass), thac0: thac0Value(stats.thac0, hitDiceValue(hd)), hitDice: hd, hp: null }
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
  setup: MonsterSetup = monsterSetup(stats),
): Combatant[] {
  const spec = parseHitDice(setup.hitDice)
  // THAC0 que depende dos PV (Beholder): cada um pelo seu, e acompanha o 🎲.
  const byHp = setup.thac0 === null && thac0HpRows(stats.thac0?.text).length > 0
  return numberedNames(stats.name, count, existingNames).map((name) => {
    const hp = setup.hp ?? (spec ? hitPoints(spec, mode, random) : null)
    return {
      ...blankCombatant('monster', side, name),
      ac: setup.ac,
      acText: stats.armorClass?.text.split('\n')[0] ?? '',
      hp,
      hpMax: hp,
      thac0: byHp ? thac0ByHitPoints(stats.thac0?.text, hp) : setup.thac0,
      ...(byHp ? { thac0Text: stats.thac0?.text } : {}),
      attacks: stats.attacks ?? '',
      damage: stats.damage ?? '',
      morale: parseMorale(stats.morale),
      xp: stats.xp?.value ?? null,
      hitDice: setup.hitDice,
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

/**
 * Rola de novo os PV de um monstro pelos DV (o 🎲 da tabela); o dano já
 * sofrido continua (4/6 que rola 8 vira 6/8). Sem DV que deem PV, não muda.
 */
export function rerollHp<T extends Pick<Combatant, 'hp' | 'hpMax' | 'hitDice' | 'thac0' | 'thac0Text'>>(c: T, random?: Random): T {
  const spec = parseHitDice(c.hitDice)
  if (!spec) return c
  const hpMax = hitPoints(spec, 'roll', random)
  const taken = c.hpMax !== null && c.hp !== null ? c.hpMax - c.hp : 0
  const thac0 = c.thac0Text ? (thac0ByHitPoints(c.thac0Text, hpMax) ?? c.thac0) : c.thac0
  return { ...c, hpMax, hp: hpMax - taken, thac0 }
}

/** O dado dos PV ("4d8+1", "14d8 + 1d4"), para o tooltip do 🎲; null sem dado. */
export function hitPointDice(hitDice: string): string | null {
  const spec = parseHitDice(hitDice)
  if (!spec || 'fixed' in spec) return null
  if ('between' in spec) return `${spec.between[0]}–${spec.between[1]} hp`
  return [spec.dice, ...(spec.bonus ? [spec.bonus] : [])].map(formatDice).join(' + ')
}

/** Fim de rodada: as condições com prazo perdem uma rodada e as que chegam a 0 saem. */
export function tickConditions(conditions: Condition[]): Condition[] {
  return conditions.flatMap((c) => (c.rounds === null ? [c] : c.rounds > 1 ? [{ ...c, rounds: c.rounds - 1 }] : []))
}

// --- Encontros ------------------------------------------------------------------------------

export function newEncounter(name: string, campaignID: string | null, now: string): Encounter {
  return { id: newID(), name, campaignID, createdAt: now, updatedAt: now, round: 0, combatants: [] }
}

// --- Encerrar e começar o próximo -------------------------------------------------------

export const endEncounter = (e: Encounter, now: string, award: XpAward | null = null): Encounter => ({ ...e, endedAt: now, xpAward: award })
export const reopenEncounter = (e: Encounter): Encounter => ({ ...e, endedAt: null })

/** O encontro mais recente da campanha (sem campanha: o mais recente sem campanha), ou null. */
export function lastEncounterOf(encounters: Encounter[], campaignID: string | null): Encounter | null {
  return encounters.filter((e) => e.campaignID === campaignID).reduce<Encounter | null>((last, e) => (!last || e.createdAt > last.createdAt ? e : last), null)
}

/** Personagem do App como vem do banco (só o que o combate usa). */
export interface AppCharacter {
  id: string
  data: { name: string; armorClass: number; hitPointsMax: number; hitPointsCurrent: number; thac0: number }
}

/**
 * O grupo de um encontro novo. No primeiro da campanha: os personagens dela
 * (os que a conta lê). Nos seguintes: o lado Party do último encontro (PCs e
 * NPCs aliados, inclusive caídos e mortos — podem ter sido curados), com os
 * personagens do App recarregados da ficha (PV atuais, CA, THAC0) e os sem
 * App com os PV de como terminaram; personagem novo na campanha entra também.
 * Condições, moral e iniciativa começam limpas.
 */
export function partyForNewEncounter(previous: Encounter | null, characters: AppCharacter[]): Combatant[] {
  const byID = new Map(characters.map((c) => [c.id, c]))
  const carried = (previous?.combatants ?? [])
    .filter((c) => c.side === 'party' && c.kind !== 'monster')
    .map((c): Combatant => {
      const sheet = c.characterID ? byID.get(c.characterID) : undefined
      const fresh = sheet ? characterCombatant(sheet.id, sheet.data) : null
      return {
        ...c,
        id: newID(),
        ...(fresh ? { name: fresh.name, ac: fresh.ac, acText: fresh.acText, hp: fresh.hp, hpMax: fresh.hpMax, thac0: fresh.thac0 } : {}),
        conditions: [],
        lastMorale: null,
      }
    })
  const present = new Set(carried.flatMap((c) => (c.characterID ? [c.characterID] : [])))
  return [...carried, ...characters.filter((c) => !present.has(c.id)).map((c) => characterCombatant(c.id, c.data))]
}

// --- XP no fim (DMG cap. 8) ----------------------------------------------------------------

/** Vitória não é só matar: caídos, mortos, em fuga ou rendidos contam (DMG cap. 8). */
export function defeatedFoes(e: Pick<Encounter, 'combatants'>, deathAt: number): Combatant[] {
  return e.combatants.filter((c) => c.side !== 'party' && (statusOf(c, deathAt) !== 'ok' || c.conditions.some((x) => /^(fleeing|surrendered)$/i.test(x.name))))
}

/** Quem divide o XP por padrão: o lado Party (PCs e NPCs aliados), menos os mortos. */
export const xpMembers = (e: Pick<Encounter, 'combatants'>, deathAt: number) => e.combatants.filter((c) => c.side === 'party' && statusOf(c, deathAt) !== 'dead')

/** Prêmio de grupo: soma o XP dos vencidos e divide em partes iguais (arredonda para baixo). */
export function xpAward(foes: Pick<Combatant, 'id' | 'xp'>[], members: Pick<Combatant, 'id'>[]): XpAward {
  const total = foes.reduce((sum, c) => sum + (c.xp ?? 0), 0)
  const shares = members.length
  return { total, shares, each: shares > 0 ? Math.floor(total / shares) : 0, foes: foes.map((c) => c.id), members: members.map((c) => c.id) }
}

/** Resumo para copiar: "Encounter 3 — 270 XP: 4 Orcs (60), Ogre (210). 4 shares: 67 XP each (Rufus, …)." */
export function xpSummary(name: string, award: XpAward, combatants: Combatant[]): string {
  const nameOf = (id: string) => combatants.find((c) => c.id === id)
  const foes = award.foes.map(nameOf).filter((c): c is Combatant => !!c)
  const members = award.members.map((id) => nameOf(id)?.name).filter(Boolean)
  const foeList = foes.map((c) => `${c.name} (${(c.xp ?? 0).toLocaleString('en-US')})`).join(', ')
  return `${name} — ${award.total.toLocaleString('en-US')} XP${foeList ? `: ${foeList}` : ''}. ${award.shares} share${award.shares === 1 ? '' : 's'}: ${award.each.toLocaleString('en-US')} XP each${members.length ? ` (${members.join(', ')})` : ''}.`
}

/** Combatentes de um lado, na ordem em que entraram. */
export const ofSide = (e: Pick<Encounter, 'combatants'>, side: Side) => e.combatants.filter((c) => c.side === side)

// --- Iniciativa e rodadas (CT2; DMG cap. 9, Tabelas 40 e 41) -------------------------------

export type InitiativeMethod = CombatSettings['initiative']

/** Rolagem de um lado (método por lado) ou de um combatente (individual). */
export interface InitiativeEntry {
  /** O d10 (rolado ou digitado); null = ainda não rolou. */
  roll: number | null
  /** Modificadores escolhidos das Tabelas 40/41 (o rótulo da linha). */
  mods: string[]
  /** Valor digitado: velocidade da arma, tempo de conjuração, outro ajuste. */
  extra: number
}

export interface InitiativeRound {
  method: InitiativeMethod
  /** Chave = lado ("party", "enemies", "others") ou id do combatente. */
  entries: Record<string, InitiativeEntry>
  /** Passo atual da ordem; null = rodada não começou. */
  step: number | null
  /** Ordem fechada ao começar a rodada (quem cai depois não muda a ordem). */
  order?: InitiativeStep[]
}

/** Uma linha das Tabelas 40/41 com valor numérico ("Hasted", -2). */
export interface InitiativeModifier {
  label: string
  value: number
}

/** Linhas numéricas de uma tabela de modificadores ("Weapon speed" fica de fora: é digitado). */
export function initiativeModifiers(rows: string[][]): InitiativeModifier[] {
  return rows.flatMap(([label, value]) => (/^[+-−]?\d+$/.test((value ?? '').trim()) ? [{ label: label.replace(/\*+$/, '').trim(), value: Number(value.trim().replace('−', '-')) }] : []))
}

export const emptyEntry = (): InitiativeEntry => ({ roll: null, mods: [], extra: 0 })

/** Resultado modificado: d10 + modificadores + valor digitado; null sem o d10. */
export function entryTotal(entry: InitiativeEntry, modifiers: InitiativeModifier[]): number | null {
  if (entry.roll === null) return null
  return entry.roll + entry.extra + entry.mods.reduce((sum, label) => sum + (modifiers.find((m) => m.label === label)?.value ?? 0), 0)
}

/** Quem pode agir: caídos e mortos ficam de fora da ordem. */
const acting = (c: Combatant, deathAt: number) => statusOf(c, deathAt) === 'ok'

/** O lado ficou surpreso e a rodada é a 1 (ou antes dela): não age (PHB cap. 11). */
export const surprisedNow = (e: Partial<Pick<Encounter, 'round' | 'surprise'>>, side: Side) => (e.round ?? 0) <= 1 && !!e.surprise?.surprised.includes(side)

type RoundView = Pick<Encounter, 'combatants'> & Partial<Pick<Encounter, 'round' | 'surprise'>>
const actsNow = (e: RoundView, c: Combatant, deathAt: number) => acting(c, deathAt) && !surprisedNow(e, c.side)

/** Chaves que rolam iniciativa: os lados com alguém de pé, ou cada combatente de pé. */
export function initiativeKeys(e: RoundView, method: InitiativeMethod, deathAt: number): string[] {
  const standing = e.combatants.filter((c) => actsNow(e, c, deathAt))
  if (method === 'individual') return standing.map((c) => c.id)
  return (['party', 'enemies', 'others'] as Side[]).filter((side) => standing.some((c) => c.side === side))
}

export interface InitiativeStep {
  score: number
  /** Chaves (lados ou combatentes) que agem juntas — empate é simultâneo (DMG). */
  keys: string[]
  /** Combatentes de pé que agem neste passo. */
  combatantIDs: string[]
}

/**
 * Ordem da rodada: o menor resultado modificado age primeiro; empates agem
 * juntos ("everything happens simultaneously", DMG cap. 9). Quem não rolou
 * fica de fora até rolar.
 */
export function initiativeSteps(e: RoundView, round: InitiativeRound, modifiers: InitiativeModifier[], deathAt: number): InitiativeStep[] {
  const byScore = new Map<number, string[]>()
  for (const key of initiativeKeys(e, round.method, deathAt)) {
    const total = entryTotal(round.entries[key] ?? emptyEntry(), modifiers)
    if (total === null) continue
    byScore.set(total, [...(byScore.get(total) ?? []), key])
  }
  return [...byScore.entries()]
    .sort(([a], [b]) => a - b)
    .map(([score, keys]) => ({
      score,
      keys,
      combatantIDs: e.combatants
        .filter((c) => actsNow(e, c, deathAt) && (round.method === 'individual' ? keys.includes(c.id) : keys.includes(c.side)))
        .map((c) => c.id),
    }))
}

/**
 * Começa a rodada: fecha a ordem (com os modificadores) e vai ao primeiro
 * passo; a primeira rodada do combate é a 1.
 */
/** INIT de cada combatente: o total (o do lado dele, na iniciativa por lado) e a vez em que age (1 = primeiro). */
export function initiativeByCombatant(steps: InitiativeStep[]): Record<string, { score: number; place: number }> {
  const out: Record<string, { score: number; place: number }> = {}
  steps.forEach((step, i) => {
    for (const id of step.combatantIDs) out[id] = { score: step.score, place: i + 1 }
  })
  return out
}

export function startRound(e: Encounter, round: InitiativeRound, modifiers: InitiativeModifier[], deathAt: number): Encounter {
  const started = { ...e, round: Math.max(e.round, 1), initiative: { ...round, step: 0, order: initiativeSteps(e, round, modifiers, deathAt) } }
  return withSnapshot(started)
}

/** Quem ainda não rolou (lados ou combatentes de pé sem o d10). */
export function missingRolls(e: RoundView, round: InitiativeRound, deathAt: number): string[] {
  return initiativeKeys(e, round.method, deathAt).filter((k) => (round.entries[k]?.roll ?? null) === null)
}

/** Máximo de fotos guardadas (as mais antigas saem). */
export const historyLimit = 50

const stateOf = (c: Combatant): CombatantState => ({ hp: c.hp, hpMax: c.hpMax, thac0: c.thac0, conditions: c.conditions, lastMorale: c.lastMorale ?? null })

/**
 * Guarda a foto da rodada atual. A primeira foto de uma rodada fica com o
 * estado do começo dela; as seguintes (rolar a iniciativa de novo) só trocam
 * a iniciativa — o dano já feito na rodada não entra na foto.
 */
export function withSnapshot(e: Encounter): Encounter {
  const initiative = e.initiative ?? newInitiative(defaultSettings.initiative)
  const history = e.history ?? []
  const existing = history.find((h) => h.round === e.round)
  const snapshot: RoundSnapshot = existing
    ? { ...existing, initiative }
    : { round: e.round, combatants: Object.fromEntries(e.combatants.map((c) => [c.id, stateOf(c)])), initiative }
  return { ...e, history: [...history.filter((h) => h.round !== e.round), snapshot].sort((a, b) => a.round - b.round).slice(-historyLimit) }
}

/**
 * Volta ao começo da rodada `round` (magias que voltam no tempo): PV,
 * condições, moral e a iniciativa como estavam; as rodadas seguintes saem da
 * história. Quem entrou depois fica como está.
 */
export function goBackToRound(e: Encounter, round: number): Encounter {
  const snapshot = e.history?.find((h) => h.round === round)
  if (!snapshot) return e
  return {
    ...e,
    round,
    combatants: e.combatants.map((c) => (snapshot.combatants[c.id] ? { ...c, ...snapshot.combatants[c.id] } : c)),
    initiative: snapshot.initiative.step !== null ? { ...snapshot.initiative, step: 0 } : snapshot.initiative,
    history: (e.history ?? []).filter((h) => h.round <= round),
  }
}

/** Combatentes que agem agora (passo atual da ordem fechada); vazio fora da rodada. */
export function actingNow(e: Pick<Encounter, 'initiative'>): string[] {
  const r = e.initiative
  return r && r.step !== null ? (r.order?.[r.step]?.combatantIDs ?? []) : []
}

/** Nova rodada de iniciativa (sem rolagens), pelo método escolhido. */
export const newInitiative = (method: InitiativeMethod): InitiativeRound => ({ method, entries: {}, step: null })

/**
 * Fim da rodada: conta mais uma, as condições perdem uma rodada e a
 * iniciativa recomeça (DMG: rola-se a cada rodada), no mesmo método.
 */
export function endRound(e: Encounter): Encounter {
  // A próxima rodada já nasce com a foto do começo dela (a rodada 1 tira a sua no "Start round").
  return withSnapshot({
    ...e,
    round: e.round + 1,
    combatants: e.combatants.map((c) => ({ ...c, conditions: tickConditions(c.conditions) })),
    initiative: newInitiative(e.initiative?.method ?? defaultSettings.initiative),
  })
}

// --- Moral (CT3) ----------------------------------------------------------------------

/**
 * Um teste de moral: 2d10 contra a moral ajustada pelos modificadores da
 * Tabela 50; igual ou abaixo, mantém o combate (DMG cap. 9).
 */
export interface MoraleCheck {
  round: number
  /** Testes deste combatente nesta rodada (o 2º em diante tem −1 cada, Tabela 50). */
  count: number
  roll: number
  target: number
  holds: boolean
}

/** Linhas numéricas das Tabelas 49 (moral por tipo) e 50 (modificadores). */
export const moraleRows = initiativeModifiers

/** Modificador que a regra calcula sozinha, com o porquê. */
export interface AutoModifier extends InitiativeModifier {
  reason: string
}

/**
 * DV como número, para os modificadores de DV da Tabela 50: "4+1" → 4,
 * "½" → 0,5, "1-1" → 0,75 (mais de ½ e menos de 1), "1-4 hp" → 0,25;
 * null quando não dá ("Varies").
 */
export function hitDiceValue(text: string | null | undefined): number | null {
  const first = (text ?? '').split('\n')[0].trim().replace(/hit points?/gi, 'hp')
  const clean = first.replace(/\s*\([^)]*\)\s*$/, '').trim().replace('½', '1/2').replace('¼', '1/4')
  if (clean === '1/2') return 0.5
  if (clean === '1/4') return 0.25
  const giant = /^(\d+)\s*\+\s*\d+\s*[-–]\s*\d+\s*hp$/i.exec(clean) // "14 + 1-4 hp"
  if (giant) return Number(giant[1])
  // Só PV (sem DV): até 4 PV é menos de meio DV.
  const hp = /^(?:\d+\s*[-–]\s*)?(\d+)\s*hp$|^\d*d(\d+)\s*hp$/i.exec(clean)
  if (hp) return Number(hp[1] ?? hp[2]) <= 4 ? 0.25 : null
  const match = /^(\d+)\s*(?:([+-])\s*\d+)?\+?$/.exec(clean)
  if (!match) return null
  const count = Number(match[1])
  if (count === 1 && match[2] === '-') return 0.75
  return count >= 1 ? count : null
}

/** A linha da Tabela 50 que casa com o padrão (o texto vem dos dados). */
const rowLike = (modifiers: InitiativeModifier[], pattern: RegExp) => modifiers.find((m) => pattern.test(m.label))

/**
 * Modificadores da Tabela 50 que saem dos números do encontro: PV perdidos
 * (25% ou 50%, do combatente ou do grupo — nota * da tabela; vale o maior,
 * não somam), DV e testes repetidos na mesma rodada.
 */
export function autoMoraleModifiers(c: Combatant, e: Pick<Encounter, 'combatants' | 'round'> & Partial<Pick<Encounter, 'surprise'>>, modifiers: InitiativeModifier[], deathAt: number): AutoModifier[] {
  const auto: AutoModifier[] = []
  // Lado surpreso: o −2 de "was surprised" no primeiro teste de moral.
  const surprisedRow = e.surprise?.surprised.includes(c.side) && !c.lastMorale ? rowLike(modifiers, /was surprised/i) : undefined
  if (surprisedRow) auto.push({ ...surprisedRow, reason: 'its side was surprised' })
  const own = c.hp !== null && c.hpMax ? 1 - Math.max(c.hp, 0) / c.hpMax : 0
  const group = e.combatants.filter((x) => x.side === c.side)
  const fallen = group.length > 1 ? group.filter((x) => statusOf(x, deathAt) !== 'ok').length / group.length : 0
  const lost = Math.max(own, fallen)
  const lostRow = lost >= 0.5 ? rowLike(modifiers, /50%/) : lost >= 0.25 ? rowLike(modifiers, /25%/) : undefined
  if (lostRow) {
    const pct = (n: number) => `${Math.round(n * 100)}%`
    auto.push({ ...lostRow, reason: own >= fallen ? `lost ${pct(own)} of its hp` : `${pct(fallen)} of its side has fallen` })
  }
  const hd = hitDiceValue(c.hitDice)
  const hdRow =
    hd === null
      ? undefined
      : hd <= 0.5
        ? rowLike(modifiers, /1\/2 HD or less/i)
        : hd < 1
          ? rowLike(modifiers, /less than 1 HD/i)
          : hd >= 15
            ? rowLike(modifiers, /15 or more HD/i)
            : hd >= 9
              ? rowLike(modifiers, /9 to 14/i)
              : hd >= 4
                ? rowLike(modifiers, /4 to 8/i)
                : undefined
  if (hdRow) auto.push({ ...hdRow, reason: `HD ${c.hitDice.split('\n')[0].trim()}` })
  const again = c.lastMorale && c.lastMorale.round === e.round ? c.lastMorale.count : 0
  const againRow = again > 0 ? rowLike(modifiers, /additional check/i) : undefined
  if (againRow) auto.push({ ...againRow, value: againRow.value * again, reason: `${again} check${again > 1 ? 's' : ''} already this round` })
  return auto
}

/** Moral ajustada: a moral escolhida mais os modificadores (o 2d10 tem que ficar igual ou abaixo). */
export const moraleTarget = (rating: number, modifiers: number[]) => rating + modifiers.reduce((sum, m) => sum + m, 0)

/** Registra o teste no combatente (conta os testes da rodada, para o −1 dos seguintes). */
export function recordMorale(c: Combatant, round: number, roll: number, target: number): Combatant {
  const count = c.lastMorale && c.lastMorale.round === round ? c.lastMorale.count + 1 : 1
  return { ...c, lastMorale: { round, count, roll, target, holds: roll <= target } }
}

/** Moral da Tabela 49 para quem não tem a do livro ("Regular soldiers (12)"). */
export const moraleFromTable = (row: InitiativeModifier): MoraleRating => ({ text: `${row.label} (${row.value})`, low: row.value, high: row.value })
