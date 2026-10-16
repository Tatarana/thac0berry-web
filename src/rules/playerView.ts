// Combat Tracker ao vivo (docs/controle-de-combate.md; backend
// `encounter_view`): a vista dos jogadores de um encontro. O JSON do encontro
// tem PV, CA, THAC0, moral, XP e notas dos inimigos; aqui sai só o que os
// jogadores podem ver. É o que o app do mestre publica; os segredos nunca saem
// do aparelho dele. Só funções puras.

import { actingNow, missingRolls, newInitiative, sideLabels, statusOf, type Combatant, type Encounter, type InitiativeMethod, type Side } from './combat.ts'

/** Estado em palavras (decisão do usuário: os inimigos sem PV). */
export type Wounds = 'unhurt' | 'wounded' | 'badly wounded' | 'down' | 'dead'

/**
 * Pedido ao jogador (CT interativo, I3): o mestre aceita antes de valer.
 * `key`: a chave em `round.entries` que a rolagem preenche ("party" por lado,
 * ou o id do combatente no individual) — o jogador manda de volta sem mudar.
 */
export type PlayerRequest = { kind: 'initiative'; key: string } | { kind: 'save'; category: number }

export interface PlayerCombatant {
  id: string
  name: string
  side: Side
  /** null sem PV no Combat Tracker (o DM não preencheu). */
  wounds: Wounds | null
  /** Só no grupo (Party): os PV de verdade. */
  hp?: { current: number | null; max: number | null }
  conditions: { name: string; rounds: number | null }[]
  acting: boolean
  /** PC do App (I3: para quem fala pelo personagem mandar a rolagem pedida). */
  characterID?: string | null
  /** O que o mestre está esperando deste combatente; ausente = nada pedido. */
  request?: PlayerRequest
}

export interface PlayerView {
  /** Versão do formato (a tela do jogador confere). */
  v: 1
  name: string
  round: number
  /** A ordem da rodada, quando começou: "Party (3), Enemies (7)" ou um nome por passo. */
  order: { label: string; score: number; now: boolean }[]
  /** Lados surpresos (só antes e na rodada 1). */
  surprised: Side[]
  distance: { feet: number; situation: string } | null
  combatants: PlayerCombatant[]
}

/** unhurt (PV cheios), wounded (até a metade), badly wounded (abaixo da metade), down, dead. */
export function woundsOf(c: Pick<Combatant, 'hp' | 'hpMax'>, deathAt: number): Wounds | null {
  if (c.hp === null) return null
  const status = statusOf(c, deathAt)
  if (status !== 'ok') return status
  if (c.hpMax === null || c.hpMax <= 0) return null
  if (c.hp >= c.hpMax) return 'unhurt'
  return c.hp * 2 >= c.hpMax ? 'wounded' : 'badly wounded'
}

/**
 * O que falta pedir a um PC do App: a iniciativa que ele ainda não mandou (a
 * chave de `round.entries` que a rolagem preenche — "party" por lado, ou o
 * próprio id no individual) ou o salvamento que o mestre está pedindo
 * (`Encounter.saveRequest`, posto pela janela "+ Effect").
 */
function requestFor(c: Combatant, e: Encounter, deathAt: number, defaultMethod: InitiativeMethod): PlayerRequest | undefined {
  if (!c.characterID) return undefined
  const round = e.initiative ?? newInitiative(defaultMethod)
  const missing = missingRolls(e, round, deathAt)
  if (round.method === 'side') {
    if (c.side === 'party' && missing.includes('party')) return { kind: 'initiative', key: 'party' }
  } else if (c.kind === 'pc' && missing.includes(c.id)) {
    return { kind: 'initiative', key: c.id }
  }
  if (e.saveRequest?.targetIDs.includes(c.id)) return { kind: 'save', category: e.saveRequest.category }
  return undefined
}

/** A vista dos jogadores; quem está "hidden from players" fica de fora (também da ordem). */
export function playerView(e: Encounter, deathAt: number, defaultMethod: InitiativeMethod): PlayerView {
  const shown = e.combatants.filter((c) => !c.hidden)
  const shownIDs = new Set(shown.map((c) => c.id))
  const acting = new Set(actingNow(e))
  const r = e.initiative
  const started = !!r && r.step !== null && !!r.order
  const label = (key: string) => (r?.method === 'individual' ? (shownIDs.has(key) ? (e.combatants.find((c) => c.id === key)?.name ?? null) : null) : (sideLabels[key as Side] ?? null))
  const order = started
    ? r!.order!.flatMap((step, i) => {
        const names = step.keys.map(label).filter((x): x is string => !!x)
        return names.length ? [{ label: names.join(' + '), score: step.score, now: i === r!.step }] : []
      })
    : []
  return {
    v: 1,
    name: e.name,
    round: e.round,
    order,
    surprised: e.round <= 1 ? (e.surprise?.surprised ?? []) : [],
    distance: e.distance ? { feet: e.distance.feet, situation: e.distance.situation } : null,
    combatants: shown.map((c) => {
      const request = requestFor(c, e, deathAt, defaultMethod)
      return {
        id: c.id,
        name: c.name || 'Unnamed',
        side: c.side,
        wounds: woundsOf(c, deathAt),
        ...(c.side === 'party' ? { hp: { current: c.hp, max: c.hpMax } } : {}),
        conditions: c.conditions.map((x) => ({ name: x.name, rounds: x.rounds })),
        acting: acting.has(c.id),
        characterID: c.characterID,
        ...(request ? { request } : {}),
      }
    }),
  }
}

/** Publicar? Só encontro de campanha, compartilhado e não encerrado. */
export const isShared = (e: Pick<Encounter, 'campaignID' | 'sharedWithPlayers' | 'endedAt'>) => !!e.campaignID && !!e.sharedWithPlayers && !e.endedAt
