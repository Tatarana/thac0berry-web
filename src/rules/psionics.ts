// Bloco psiônico do Psionicist (Complete Psionics Handbook, cap. 1), feito
// primeiro na web (2026-10-06). Só funções puras.
//
// - Tabela 4: disciplinas, ciências, devoções e modos de defesa por nível.
// - Tabela 5: PSPs. Base pela Sabedoria, mais os modificadores de
//   Inteligência e Constituição no 1º nível; a cada nível novo, 10 + o
//   modificador de Sabedoria. Os dados de referência só trazem a tabela para
//   atributos de 15 a 18: fora disso o máximo não é calculado (o jogador
//   escreve à mão).
// - Tabela 3 (XP individual): 10 XP por PSP gasto para superar um inimigo ou
//   problema. Decisão do usuário: registrar só os PSPs gastos e sugerir sempre
//   essa taxa (evitar combate vale 15/PSP e uso sem importância 0, a critério
//   do mestre).

import type { PsionicPowerEntry, PsionicUse, Psionics } from '../types/library.ts'

export const disciplines = ['Clairsentience', 'Psychokinesis', 'Psychometabolism', 'Psychoportation', 'Telepathy', 'Metapsionics'] as const

/** Os cinco modos de defesa (todos da Telepatia; não contam no limite de poderes). */
export const defenseModes = ['Mind Blank', 'Thought Shield', 'Mental Barrier', 'Tower of Iron Will', 'Intellect Fortress'] as const

/** Tabela 4, linhas 1 a 20: [disciplinas, ciências, devoções, modos de defesa]. */
export const progressionRows: [number, number, number, number][] = [
  [1, 1, 3, 1], [2, 1, 5, 1], [2, 2, 7, 2], [2, 2, 9, 2], [2, 3, 10, 3],
  [3, 3, 11, 3], [3, 4, 12, 4], [3, 4, 13, 4], [3, 5, 14, 5], [4, 5, 15, 5],
  [4, 6, 16, 5], [4, 6, 17, 5], [4, 7, 18, 5], [5, 7, 19, 5], [5, 8, 20, 5],
  [5, 8, 21, 5], [5, 9, 22, 5], [6, 9, 23, 5], [6, 10, 24, 5], [6, 10, 25, 5],
]

export interface Progression {
  disciplines: number
  sciences: number
  devotions: number
  defenseModes: number
}

/** Tabela 4 (acima do 20º, vale a linha do 20º). */
export function progression(level: number): Progression {
  const [d, s, v, m] = progressionRows[Math.max(1, Math.min(level, 20)) - 1]
  return { disciplines: d, sciences: s, devotions: v, defenseModes: m }
}

/** Tabela 5: base pela Sabedoria (15 a 18). */
export const baseByWisdom: Record<number, number> = { 15: 20, 16: 22, 17: 24, 18: 26 }

/** Tabela 5: modificador (15 a 18); abaixo de 15 não há modificador. */
function abilityModifier(score: number): number | null {
  if (score < 15) return 0
  return ({ 15: 0, 16: 1, 17: 2, 18: 3 } as Record<number, number>)[score] ?? null
}

/**
 * PSPs máximos pela Tabela 5, ou null quando a tabela não cobre os atributos
 * (Sabedoria fora de 15–18, ou Inteligência/Constituição acima de 18).
 */
export function pspMaximum(level: number, abilities: { wisdom: number; intelligence: number; constitution: number }): number | null {
  const base = baseByWisdom[abilities.wisdom]
  const wis = abilityModifier(abilities.wisdom)
  const int = abilityModifier(abilities.intelligence)
  const con = abilityModifier(abilities.constitution)
  if (base === undefined || wis === null || int === null || con === null) return null
  return base + int + con + Math.max(0, level - 1) * (10 + wis)
}

/** Máximo valendo: o escrito à mão, senão o calculado. */
export function pspMax(p: Pick<Psionics, 'pspMaxOverride'> | null | undefined, calculated: number | null): number | null {
  return p?.pspMaxOverride ?? calculated
}

/** Contagem de ciências e devoções conhecidas. */
export function powerCounts(powers: PsionicPowerEntry[]): { sciences: number; devotions: number } {
  return {
    sciences: powers.filter((p) => p.tier === 'Science').length,
    devotions: powers.filter((p) => p.tier !== 'Science').length,
  }
}

/** Primeiro número de um custo do compêndio ("8+4/round" → 8); null se não houver. */
export function initialCost(text: string | null | undefined): number | null {
  const match = (text ?? '').match(/\d+/)
  return match ? Number(match[0]) : null
}

/** O power score de um poder no compêndio ("Int -3", atributo e modificador). */
export interface PowerScoreSource {
  raw: string
  baseAbility: string
  modifier: number
}

/**
 * Power score do personagem: o atributo base mais o modificador do poder (o
 * número a tirar ou menos no d20). O modificador vem do texto ("Wis -3",
 * "Cha –2") quando ele tem um, porque o campo numérico dos dados pode estar
 * errado; senão, do campo. null se o atributo não for um dos seis.
 */
export function powerScoreFor(score: PowerScoreSource, abilities: Record<string, number>): { value: number; label: string } | null {
  const key = score.baseAbility.trim().toLowerCase()
  const base = abilities[key]
  if (typeof base !== 'number') return null
  const fromText = /([+\-–−])\s*(\d+)/.exec(score.raw)
  const modifier = fromText ? (fromText[1] === '+' ? 1 : -1) * Number(fromText[2]) : score.modifier
  const short = score.baseAbility.slice(0, 3)
  return { value: base + modifier, label: modifier === 0 ? short : `${short} ${modifier > 0 ? '+' : '−'}${Math.abs(modifier)}` }
}

/** Alcance curto para a lista ("special (50 yards - Revised)" → "special"); o completo fica no tooltip. */
export const shortRange = (range: string) => range.replace(/\s*\(.*\)\s*$/, '').trim() || range

/** XP sugerido dos usos de uma sessão: 10 XP por PSP (Tabela 3, "superar"). */
export function psionicXP(uses: Pick<PsionicUse, 'psp'>[]): { psp: number; xp: number } {
  const psp = uses.reduce((sum, u) => sum + Math.max(0, u.psp), 0)
  return { psp, xp: psp * 10 }
}

// --- Tabelas de referência (página 4 da ficha), conferidas com o CPsiH no rules.json ---

/** Tabela 3: prêmios de XP individuais. */
export const classAwardRows: [string, string][] = [
  ['Psionic power used to overcome foe or problem', '10 XP/PSP'],
  ['Psionic power used to avoid combat', '15 XP/PSP'],
  ['Defeat psionic opponent', '100 XP/level or hit dice'],
  ['Create psionic item', '500 XP x level'],
]

/** Tabela 6: PSPs recuperados por atividade física. */
export const recoveryRows: [string, string][] = [
  ['Hard exertion*', 'none'],
  ['Walking, riding', '3/hour (1 every 2 turns)'],
  ['Sitting, resting, reading', '6/hour (1/turn)'],
  ['Rejuvenating**, sleeping', '12/hour (2/turn)'],
]

/** Tabela 9: redução do power score por armadura. */
export const armorPenaltyRows: [string, number][] = [
  ['Padded, leather, studded leather, hide', 0],
  ['Brigandine, ring, scale, splint mail', -1],
  ['Chain, banded mail', -2],
  ['Plate mail', -3],
  ['Field plate', -5],
  ['Full plate', -7],
]

/** Tabela 14: colunas (modos de defesa, na ordem do livro). */
export const defenseModeColumns = ['Mind Blank', 'Thought Shield', 'Mental Barrier', 'Intellect Fortress', 'Tower of Iron Will'] as const

/** Tabela 14: modificador do power score do atacante, ataque × defesa. */
export const attackVsDefenseRows: [string, number[]][] = [
  ['Mind Thrust', [5, -2, -4, -4, -5]],
  ['Ego Whip', [5, 0, -3, -4, -3]],
  ['Id Insinuation', [-3, 2, 4, -1, -3]],
  ['Psychic Crush', [1, -3, -1, -3, -4]],
  ['Psionic Blast', [2, 3, 0, -1, -2]],
]

// --- Escolha de poderes no The Forge (CPH, cap. 1: "two simple rules") ---
//
// 1. Numa disciplina, as devoções conhecidas são pelo menos o dobro das ciências.
// 2. A primeira disciplina é a primária: nenhuma outra pode ter tantas ciências
//    (ou devoções) quanto ela tem.
// Mais os limites da Tabela 4 e os pré-requisitos de cada poder (outro poder,
// ou um nível mínimo). Os modos de defesa não contam como poderes.

/** Bloco psiônico vazio (a ficha e o Forge o criam do mesmo jeito). */
export const emptyPsionics = (): Psionics => ({ pspMaxOverride: null, pspCurrent: null, primaryDiscipline: null, disciplines: [], powers: [], defenseModes: [], uses: [] })

/** Chave de comparação de um poder pelo nome ("Teleport (Psionic)" → "teleport"). */
export const powerKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export type PowerPrerequisite = { kind: 'level'; level: number } | { kind: 'power'; key: string; text: string }

/**
 * Pré-requisitos do compêndio, limpos: "Contact\n(None - Revised)" vira
 * "Contact"; "Clairvoyance, detection, 10th level" e "Mindlink & Contact"
 * viram vários; "None" some. Uma alternativa ("Empower or valuable gem") não
 * se cobra: o jogador escolhe.
 */
export function powerPrerequisites(list: string[]): PowerPrerequisite[] {
  const out: PowerPrerequisite[] = []
  for (const item of list) {
    const first = item.split('\n')[0].replace(/\(.*?\)/g, '')
    for (const raw of first.split(/,|&|\band\b/i)) {
      const text = raw.trim().replace(/\.$/, '')
      if (!text || /^(none|na|-)$/i.test(text) || /\bor\b/i.test(text)) continue
      const level = /(\d+)(?:st|nd|rd|th)\s*level/i.exec(text)
      out.push(level ? { kind: 'level', level: Number(level[1]) } : { kind: 'power', key: powerKey(text), text })
    }
  }
  return out
}

export type PowerTierFilter = 'all' | 'sciences' | 'devotions'

/** O filtro do Forge por tipo de poder (os modos de defesa são devoções). */
export const passesTierFilter = (p: Pick<PowerChoice, 'science'>, filter: PowerTierFilter) =>
  filter === 'all' || (filter === 'sciences') === p.science

export type PsionicBook = 'CPH' | 'WatW' | 'Dragon'

/**
 * De que livro o poder vem, para o filtro do Forge. Os do Dragon Kings
 * (Psionic Enhancements, do 21º nível em diante) ficam de fora: null.
 */
export function psionicBook(sources: { book: string }[]): PsionicBook | null {
  const names = sources.map((s) => s.book)
  if (names.some((n) => n.includes('Complete Psionics'))) return 'CPH'
  if (names.length === 1 && names[0] === 'The Will and the Way') return 'WatW'
  if (names.length > 0 && names.every((n) => n.startsWith('Dragon Magazine'))) return 'Dragon'
  return null
}

/** O poder é um dos cinco modos de defesa (vão para `defenseModes`, não para `powers`). */
export const isDefenseMode = (title: string) => defenseModes.some((m) => powerKey(m) === powerKey(title))

/** O que o Forge precisa de um poder para julgar e desenhar. */
export interface PowerChoice {
  id: string
  title: string
  key: string
  /** Disciplina, ou "Defense" para os modos de defesa. */
  discipline: string
  science: boolean
  prerequisites: PowerPrerequisite[]
}

export function powerChoice(p: { id: string; title: string; discipline: string; powerTier: string; parameters: { prerequisites: string[] } }): PowerChoice {
  return {
    id: p.id,
    title: p.title,
    key: powerKey(p.title),
    discipline: isDefenseMode(p.title) ? 'Defense' : p.discipline,
    science: p.powerTier === 'Science',
    prerequisites: powerPrerequisites(p.parameters.prerequisites),
  }
}

export interface LearnVerdict {
  ok: boolean
  action: 'learn' | 'forget'
  reason?: string
}

type TierCount = { sciences: number; devotions: number }

/** Ciências e devoções conhecidas em cada disciplina. */
export function disciplineCounts(powers: PsionicPowerEntry[]): Record<string, TierCount> {
  const out: Record<string, TierCount> = {}
  for (const d of disciplines) out[d] = { sciences: 0, devotions: 0 }
  for (const p of powers) {
    const d = p.discipline ?? ''
    out[d] ??= { sciences: 0, devotions: 0 }
    if (p.tier === 'Science') out[d].sciences++
    else out[d].devotions++
  }
  return out
}

/** Os poderes (e modos de defesa) já conhecidos, pela chave do nome. */
export function knownPowerKeys(psi: Psionics): Set<string> {
  return new Set([...(psi.powers ?? []).map((k) => powerKey(k.name)), ...(psi.defenseModes ?? []).map(powerKey)])
}

/**
 * Pode aprender (ou esquecer) este poder agora? `all` são os poderes do
 * compêndio, para achar os pré-requisitos e quem depende deste.
 */
export function learnVerdict(power: PowerChoice, level: number, psi: Psionics, all: PowerChoice[]): LearnVerdict {
  const prog = progression(level)
  const known = psi.powers ?? []
  const modes = psi.defenseModes ?? []
  const knownKeys = knownPowerKeys(psi)
  const counts = disciplineCounts(known)
  const total = powerCounts(known)
  const primary = psi.primaryDiscipline ?? null
  const none: TierCount = { sciences: 0, devotions: 0 }
  const tier = (science: boolean) => (science ? 'sciences' : 'devotions')

  if (knownKeys.has(power.key)) {
    const needers = all.filter((q) => knownKeys.has(q.key) && q.prerequisites.some((r) => r.kind === 'power' && r.key === power.key))
    if (needers.length > 0) return { ok: false, action: 'forget', reason: `Needed by ${needers.map((q) => q.title).join(', ')} — forget that first.` }
    if (power.discipline !== 'Defense') {
      const own = counts[power.discipline] ?? none
      if (!power.science && own.devotions - 1 < 2 * own.sciences) {
        return { ok: false, action: 'forget', reason: `That would leave fewer than twice as many devotions as sciences in ${power.discipline}.` }
      }
      if (power.discipline === primary) {
        const left = own[tier(power.science)] - 1
        const clash = disciplines.find((d) => d !== primary && counts[d][tier(power.science)] > 0 && counts[d][tier(power.science)] >= left)
        if (clash) return { ok: false, action: 'forget', reason: `Your primary discipline must stay ahead of ${clash}.` }
      }
    }
    return { ok: true, action: 'forget' }
  }

  if (power.discipline === 'Defense') {
    if (modes.length < prog.defenseModes) return { ok: true, action: 'learn' }
    return { ok: false, action: 'learn', reason: `All ${prog.defenseModes} defense mode slot${prog.defenseModes > 1 ? 's are' : ' is'} used at level ${level}.` }
  }
  if (!(psi.disciplines ?? []).includes(power.discipline)) return { ok: false, action: 'learn', reason: `Take up ${power.discipline} first — tap the heart of the map.` }
  for (const r of power.prerequisites) {
    if (r.kind === 'level') {
      if (level < r.level) return { ok: false, action: 'learn', reason: `Requires level ${r.level}.` }
      continue
    }
    const q = all.find((x) => x.key === r.key)
    if (q && !knownKeys.has(q.key)) return { ok: false, action: 'learn', reason: `Learn ${q.title} first.` }
  }
  const own = counts[power.discipline] ?? none
  if (power.science) {
    if (total.sciences >= prog.sciences) return { ok: false, action: 'learn', reason: `No science left at level ${level} (you hold ${prog.sciences}).` }
    const needed = 2 * (own.sciences + 1)
    if (own.devotions < needed) return { ok: false, action: 'learn', reason: `Needs ${needed} devotions in ${power.discipline} first — twice as many devotions as sciences.` }
  } else if (total.devotions >= prog.devotions) {
    return { ok: false, action: 'learn', reason: `No devotion left at level ${level} (you hold ${prog.devotions}).` }
  }
  if (primary && power.discipline !== primary) {
    const limit = (counts[primary] ?? none)[tier(power.science)]
    if (own[tier(power.science)] + 1 >= limit) {
      return { ok: false, action: 'learn', reason: `No other discipline may match your primary, ${primary} (${limit} ${tier(power.science)}).` }
    }
  }
  return { ok: true, action: 'learn' }
}

/** Aprende ou esquece (sem julgar: chame learnVerdict antes). */
export function togglePower(psi: Psionics, power: PowerChoice, tier: string, newID: () => string) {
  if (power.discipline === 'Defense') {
    const list = psi.defenseModes ?? []
    const has = list.some((m) => powerKey(m) === power.key)
    const name = defenseModes.find((m) => powerKey(m) === power.key) ?? power.title
    const next = has ? list.filter((m) => powerKey(m) !== power.key) : [...list, name]
    psi.defenseModes = defenseModes.filter((m) => next.includes(m))
    return
  }
  const list = psi.powers ?? []
  const mine = list.find((k) => k.powerID === power.id || powerKey(k.name) === power.key)
  psi.powers = mine ? list.filter((k) => k !== mine) : [...list, { id: newID(), powerID: power.id, name: power.title, discipline: power.discipline, tier }]
}

export type DisciplineAction = { kind: 'take'; primary: boolean } | { kind: 'release' } | { kind: 'locked'; label: string }

/** O que o núcleo da disciplina oferece: assumir, liberar ou nada (com o motivo). */
export function disciplineAction(d: string, level: number, psi: Psionics): DisciplineAction {
  const taken = psi.disciplines ?? []
  const isPrimary = psi.primaryDiscipline === d
  if (taken.includes(d)) {
    const used = (psi.powers ?? []).some((k) => k.discipline === d)
    if (used || (isPrimary && taken.length > 1)) return { kind: 'locked', label: isPrimary ? 'Primary discipline' : 'Discipline taken' }
    return { kind: 'release' }
  }
  if (taken.length >= progression(level).disciplines) return { kind: 'locked', label: `No discipline left at level ${level}` }
  return { kind: 'take', primary: taken.length === 0 }
}

/** Assume a disciplina (a primeira vira a primária) ou a libera. */
export function toggleDiscipline(psi: Psionics, d: string) {
  const set = new Set(psi.disciplines ?? [])
  if (set.has(d)) {
    set.delete(d)
    if (psi.primaryDiscipline === d) psi.primaryDiscipline = null
  } else {
    set.add(d)
    psi.primaryDiscipline ??= d
  }
  psi.disciplines = disciplines.filter((k) => set.has(k))
}
