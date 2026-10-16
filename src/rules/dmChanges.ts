// Mudanças que o mestre manda ao personagem durante um encontro compartilhado
// (Combat Tracker interativo, I2; backend `combat_message`, direction
// 'to_player'). Decisão do usuário: o jogador escolhe nas Settings se aceita
// sozinho (a mudança entra na ficha e fica destacada) ou se aceita/recusa cada
// uma. Hoje só os PV (dano e cura). Só funções puras.

import type { Encounter } from './combat.ts'
import { isShared } from './playerView.ts'

export interface HpChange {
  /** PV no Combat Tracker antes e depois (o que o mestre viu). */
  from: number
  to: number
  /** O que entra na ficha: a diferença (a ficha pode estar com outro valor). */
  delta: number
  encounter: string
}

/** "−7 hp" / "+3 hp". */
export const hpDeltaText = (delta: number) => `${delta > 0 ? '+' : '−'}${Math.abs(delta)} hp`

/** "−7 hp (Bridge)". */
export const hpChangeText = (c: Pick<HpChange, 'delta' | 'encounter'>) => `${hpDeltaText(c.delta)}${c.encounter ? ` (${c.encounter})` : ''}`

/** PV da ficha depois da mudança: a cura não passa do máximo; o dano não tem piso (−10 é a morte). */
export function applyHpDelta(current: number, max: number, delta: number): number {
  const next = current + delta
  return delta > 0 && max > 0 ? Math.min(next, Math.max(max, current)) : next
}

export interface PendingHpSend extends HpChange {
  key: string
  encounterID: string
  characterID: string
}

/**
 * O que mandar aos jogadores: os PCs do App nos encontros compartilhados da
 * campanha cujos PV mudaram desde o último envio. Quem aparece pela primeira
 * vez (ou o encontro acabou de ser compartilhado) só entra na base, sem envio.
 * Devolve os envios e a base nova (sem os envios: ela muda quando o envio dá certo).
 */
export function hpChangesToSend(encounters: Encounter[], campaignID: string | null, baseline: Map<string, number>): { sends: PendingHpSend[]; seen: Map<string, number> } {
  const seen = new Map<string, number>()
  const sends: PendingHpSend[] = []
  for (const e of encounters) {
    if (!campaignID || e.campaignID !== campaignID || !isShared(e)) continue
    for (const c of e.combatants) {
      if (c.side !== 'party' || !c.characterID || c.hp === null) continue
      const key = `${e.id}:${c.id}`
      const before = baseline.get(key)
      if (before === undefined) seen.set(key, c.hp)
      else if (before !== c.hp) sends.push({ key, encounterID: e.id, characterID: c.characterID, from: before, to: c.hp, delta: c.hp - before, encounter: e.name })
    }
  }
  return { sends, seen }
}
