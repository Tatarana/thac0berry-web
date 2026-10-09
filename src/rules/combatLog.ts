// Log do combate (CT5b, docs/controle-de-combate.md): o que aconteceu, rodada
// a rodada. Quase tudo sai da diferença entre o encontro antes e depois de
// cada mudança (dano, cura, quem caiu, condições, moral, rodadas); as
// rolagens que não mudam nada (ataque, salvamento) entram como nota.

import { sideLabels, statusOf, type Combatant, type Encounter, type Side } from './combat.ts'

export interface LogEntry {
  id: number
  round: number
  text: string
  /** Mudança de PV (junta as seguidas do mesmo combatente: digitar "12" não vira duas linhas). */
  hp?: { combatantID: string; name: string; from: number | null; to: number | null }
  /** De quem é a linha de estado ("is down"), para a junção dos PV passar por cima dela. */
  about?: string
  /** Quando (ms): só junta PV digitados em sequência (poucos segundos). */
  at?: number
}

/** Mudanças de PV do mesmo combatente dentro deste intervalo são a mesma digitação. */
export const typingWindow = 4000

/** Máximo de linhas guardadas (as mais antigas saem). */
export const logLimit = 500

/** Texto de uma linha (a de PV é montada na hora, com o antes e o depois). */
export function logText(entry: LogEntry): string {
  if (!entry.hp) return entry.text
  const { name, from, to } = entry.hp
  const delta = from !== null && to !== null ? to - from : null
  const what = delta === null ? '' : delta < 0 ? ` (${-delta} damage)` : delta > 0 ? ` (healed ${delta})` : ''
  return `${name}: HP ${from ?? '—'} → ${to ?? '—'}${what}`
}

type NewEntry = Omit<LogEntry, 'id' | 'round'>

/**
 * Junta ao log. Uma mudança de PV logo depois de outra do mesmo combatente
 * (digitando os PV, em poucos segundos) vira uma linha só; a linha de estado
 * que a digitação criou no meio ("is back up") sai se o estado voltar.
 */
export function appendLog(log: LogEntry[] | undefined, round: number, entries: NewEntry[], now = Date.now()): LogEntry[] {
  const out = [...(log ?? [])]
  for (const entry of entries) {
    const last = out[out.length - 1]
    if (entry.hp) {
      // A última mudança de PV do mesmo combatente nesta rodada, passando só por linhas de estado dele.
      let i = out.length - 1
      while (i >= 0 && out[i].round === round && !out[i].hp && out[i].about === entry.hp.combatantID) i--
      const prev = out[i]
      if (prev?.hp && prev.round === round && prev.hp.combatantID === entry.hp.combatantID && prev.at !== undefined && now - prev.at < typingWindow) {
        out[i] = { ...prev, at: now, hp: { ...prev.hp, to: entry.hp.to, name: entry.hp.name } }
        continue
      }
    }
    out.push({ ...entry, id: (last?.id ?? 0) + 1, round, at: now })
  }
  return out.slice(-logLimit)
}

const statusText = { ok: 'is back up', down: 'is down', dead: 'is dead' } as const

/** O que mudou num combatente: PV, estado, condições, moral. */
function combatantChanges(before: Combatant, after: Combatant, deathAt: number): NewEntry[] {
  const out: NewEntry[] = []
  // PV máximos mudaram (o "roll" antes da luta, ou o DM corrigiu o máximo): são os PV
  // do combatente, não dano nem cura.
  if (before.hpMax !== after.hpMax) out.push({ text: `${after.name}: hit points ${before.hp ?? '—'}/${before.hpMax ?? '—'} → ${after.hp ?? '—'}/${after.hpMax ?? '—'}`, about: after.id })
  else if (before.hp !== after.hp) out.push({ text: '', hp: { combatantID: after.id, name: after.name, from: before.hp, to: after.hp } })
  const [s0, s1] = [statusOf(before, deathAt), statusOf(after, deathAt)]
  if (s0 !== s1) out.push({ text: `${after.name} ${statusText[s1]}`, about: after.id })
  const names = (c: Combatant) => new Set(c.conditions.map((x) => x.id))
  const [c0, c1] = [names(before), names(after)]
  for (const x of after.conditions) if (!c0.has(x.id)) out.push({ text: `${after.name}: + ${x.name}${x.rounds !== null ? ` (${x.rounds} round${x.rounds === 1 ? '' : 's'})` : ''}` })
  for (const x of before.conditions) if (!c1.has(x.id)) out.push({ text: `${after.name}: − ${x.name}` })
  const m = after.lastMorale
  if (m && (m.round !== before.lastMorale?.round || m.count !== before.lastMorale?.count || m.roll !== before.lastMorale?.roll)) {
    out.push({ text: `Morale: ${after.name} rolled ${m.roll} vs ${m.target} — ${m.holds ? 'holds' : 'fails'}` })
  }
  return out
}

/** As linhas que uma mudança no encontro gera. */
export function describeChanges(before: Encounter, after: Encounter, deathAt: number): NewEntry[] {
  const out: NewEntry[] = []
  const nameOf = (e: Encounter, key: string) => (after.initiative?.method === 'individual' ? (e.combatants.find((c) => c.id === key)?.name ?? '?') : sideLabels[key as Side])
  // Rodadas: fim, volta no tempo. Mudanças em massa nessas horas não viram linha por combatente.
  if (after.round > before.round && before.round > 0) {
    out.push({ text: `End of round ${before.round}` })
    // No fim da rodada, só as condições que acabaram (o resto é a contagem das rodadas).
    for (const c of before.combatants) {
      const now = after.combatants.find((x) => x.id === c.id)
      for (const x of c.conditions) if (now && !now.conditions.some((y) => y.id === x.id)) out.push({ text: `${c.name}: ${x.name} ends` })
    }
    return out
  }
  if (after.round < before.round) return [{ text: `Back to the start of round ${after.round} (time reversed)` }]
  // Iniciativa: a rodada começa (ou recomeça com nova ordem).
  const started = after.initiative?.step === 0 && after.initiative.order
  const orderText = (e: Encounter) => (e.initiative?.order ?? []).map((s) => `${s.keys.map((k) => nameOf(e, k)).join(' + ')} (${s.score})`).join(', ')
  if (started && (before.initiative?.step === null || before.initiative?.step === undefined || before.round !== after.round)) out.push({ text: `Round ${after.round} starts: ${orderText(after)}` })
  else if (started && orderText(before) !== orderText(after)) out.push({ text: `Round ${after.round} restarted: ${orderText(after)}` })
  // Surpresa.
  if (after.surprise && JSON.stringify(after.surprise) !== JSON.stringify(before.surprise ?? null)) {
    out.push({ text: after.surprise.surprised.length ? `Surprise: ${after.surprise.surprised.map((s) => sideLabels[s]).join(' and ')} surprised` : 'Surprise: no one surprised' })
  }
  // Quem entrou e saiu.
  const ids0 = new Set(before.combatants.map((c) => c.id))
  const ids1 = new Set(after.combatants.map((c) => c.id))
  const joined = after.combatants.filter((c) => !ids0.has(c.id))
  if (joined.length) out.push({ text: `Joined: ${joined.map((c) => c.name).join(', ')}` })
  for (const c of before.combatants) if (!ids1.has(c.id)) out.push({ text: `Removed: ${c.name}` })
  // Cada combatente.
  for (const c of after.combatants) {
    const old = before.combatants.find((x) => x.id === c.id)
    if (old) out.push(...combatantChanges(old, c, deathAt))
  }
  // Fim do encontro.
  if (after.endedAt && !before.endedAt) {
    out.push({ text: after.xpAward ? `Encounter ended: ${after.xpAward.total.toLocaleString('en-US')} XP, ${after.xpAward.each.toLocaleString('en-US')} each` : 'Encounter ended' })
  }
  return out
}

/** O log agrupado por rodada, a mais recente primeiro (para a janela). */
export function logByRound(log: LogEntry[]): { round: number; entries: LogEntry[] }[] {
  const groups: { round: number; entries: LogEntry[] }[] = []
  for (const entry of [...log].reverse()) {
    const g = groups[groups.length - 1]
    if (g && g.round === entry.round) g.entries.push(entry)
    else groups.push({ round: entry.round, entries: [entry] })
  }
  return groups
}

/** Texto para copiar: "Round 1" e as linhas, na ordem em que aconteceram. */
export function logPlainText(log: LogEntry[]): string {
  const lines: string[] = []
  let round = -1
  for (const e of log) {
    if (e.round !== round) {
      round = e.round
      lines.push(round > 0 ? `Round ${round}` : 'Before the fight')
    }
    lines.push(`  ${logText(e)}`)
  }
  return lines.join('\n')
}
