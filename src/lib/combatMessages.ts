import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/context'
import type { Encounter } from '../rules/combat'
import { applyHpDelta, hpChangesToSend, type HpChange } from '../rules/dmChanges'
import { loadPreferences } from './preferences'
import { subscribeRows, uuidFilter } from './realtime'
import { editCharacter } from './roster'
import { supabase } from './supabase'

// Mensagens do combate (Combat Tracker interativo; backend `combat_message`):
// o mestre manda ao personagem (I2: os PV), o jogador aceita — sozinho, se
// ligou "Accept changes from the DM" nas Settings, ou um a um na ficha.

export interface CombatMessage {
  id: string
  encounter_id: string
  character_id: string
  direction: 'to_dm' | 'to_player'
  kind: string
  payload: Record<string, unknown>
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  created_at: string
  resolved_at: string | null
}

const columns = 'id, encounter_id, character_id, direction, kind, payload, status, created_at, resolved_at'

export async function sendToPlayer(encounterID: string, characterID: string, kind: string, payload: object) {
  const { error } = await supabase.rpc('send_to_player', { p_encounter: encounterID, p_character: characterID, p_kind: kind, p_payload: payload })
  if (error) throw new Error(error.message)
}

/** Jogador → mestre (I3: a iniciativa, o d20 de um salvamento pedido). */
export async function sendToDm(encounterID: string, characterID: string, kind: string, payload: object) {
  const { error } = await supabase.rpc('send_to_dm', { p_encounter: encounterID, p_character: characterID, p_kind: kind, p_payload: payload })
  if (error) throw new Error(error.message)
}

export async function resolveMessage(id: string, accept: boolean) {
  const { error } = await supabase.rpc('resolve_combat_message', { p_message: id, p_accept: accept })
  if (error) throw new Error(error.message)
}

/** Aceitar uma mudança do mestre: grava a ficha e marca a mensagem. */
export async function acceptDmChange(m: CombatMessage) {
  if (m.kind === 'hp') {
    const change = m.payload as unknown as HpChange
    await editCharacter(m.character_id, (c) => {
      c.hitPointsCurrent = applyHpDelta(c.hitPointsCurrent, c.hitPointsMax, change.delta)
    })
  }
  await resolveMessage(m.id, true)
}

/** As mensagens do mestre a um personagem: as pendentes e as aceitas nas últimas 12 h. */
export async function fetchDmChanges(characterID: string): Promise<CombatMessage[]> {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('combat_message')
    .select(columns)
    .eq('character_id', characterID)
    .eq('direction', 'to_player')
    .or(`status.eq.pending,and(status.eq.accepted,resolved_at.gte.${since})`)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data as CombatMessage[]
}

// --- Mestre: manda as mudanças de PV dos PCs do App -------------------------------------

/**
 * Nos encontros compartilhados da campanha ativa, a mudança de PV de um PC do
 * App vai ao jogador 2 s depois da última edição (as edições seguidas somam).
 */
export function useHpChangeSender(encounters: Encounter[], campaignID: string | null, userID: string | null) {
  const baseline = useRef(new Map<string, number>())
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    baseline.current = new Map()
  }, [campaignID, userID])
  useEffect(() => {
    if (!userID || !campaignID) return
    const timer = setTimeout(() => {
      const { sends, seen } = hpChangesToSend(encounters, campaignID, baseline.current)
      for (const [key, hp] of seen) baseline.current.set(key, hp)
      for (const s of sends) {
        // Marca já, para a próxima rodada do efeito não mandar de novo; volta se falhar.
        baseline.current.set(s.key, s.to)
        sendToPlayer(s.encounterID, s.characterID, 'hp', { from: s.from, to: s.to, delta: s.delta, encounter: s.encounter })
          .then(() => setError(null))
          .catch((reason: unknown) => {
            baseline.current.set(s.key, s.from)
            setError(reason instanceof Error ? reason.message : String(reason))
          })
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [encounters, campaignID, userID])
  return { error }
}

// --- Mestre: o que os jogadores mandaram (I3) --------------------------------------------

/** As mensagens pendentes dos jogadores para um encontro (iniciativa, salvamento), ao vivo. */
export function usePendingToDm(encounterID: string | null) {
  const [messages, setMessages] = useState<CombatMessage[]>([])
  useEffect(() => {
    if (!encounterID) {
      setMessages([])
      return
    }
    let cancelled = false
    const load = () =>
      void supabase
        .from('combat_message')
        .select(columns)
        .eq('encounter_id', encounterID)
        .eq('direction', 'to_dm')
        .eq('status', 'pending')
        .order('created_at')
        .then(({ data, error }) => {
          if (!cancelled && !error) setMessages(data as CombatMessage[])
        })
    load()
    return subscribeRows('combat_message', uuidFilter('encounter_id', encounterID), load)
  }, [encounterID])
  return messages
}

/** As mensagens pendentes que este personagem mandou ao mestre (para a tela "sent, waiting"). */
export function usePendingFromMe(characterID: string | null, encounterID: string | null) {
  const [messages, setMessages] = useState<CombatMessage[]>([])
  useEffect(() => {
    if (!characterID || !encounterID) {
      setMessages([])
      return
    }
    let cancelled = false
    const load = () =>
      void supabase
        .from('combat_message')
        .select(columns)
        .eq('character_id', characterID)
        .eq('encounter_id', encounterID)
        .eq('direction', 'to_dm')
        .eq('status', 'pending')
        .order('created_at')
        .then(({ data, error }) => {
          if (!cancelled && !error) setMessages(data as CombatMessage[])
        })
    load()
    return subscribeRows('combat_message', uuidFilter('character_id', characterID), load)
  }, [characterID, encounterID])
  return messages
}

// --- Jogador: quais personagens ele pode falar por, na campanha (I3) --------------------

/** Ids (minúsculos) dos personagens da campanha que esta conta pode falar por: donos e acessos temporários. */
export function useMyCharacterIDs(campaignID: string | null, userID: string | null) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!campaignID || !userID) {
      setIds(new Set())
      return
    }
    let cancelled = false
    void (async () => {
      const mine = await supabase.from('character').select('id').eq('campaign_id', campaignID).eq('owner_id', userID).is('deleted_at', null)
      const granted = await supabase.from('character_grant').select('character_id').eq('grantee_id', userID).is('revoked_at', null).gt('expires_at', new Date().toISOString())
      if (cancelled) return
      const own = (mine.data as { id: string }[] | null)?.map((r) => r.id) ?? []
      const grantedIDs = (granted.data as { character_id: string }[] | null)?.map((r) => r.character_id) ?? []
      // Confere a campanha de cada acesso temporário (ele pode ser de outra campanha).
      let grantedInCampaign: string[] = []
      if (grantedIDs.length > 0) {
        const grants = await supabase.from('character').select('id').eq('campaign_id', campaignID).in('id', grantedIDs).is('deleted_at', null)
        grantedInCampaign = (grants.data as { id: string }[] | null)?.map((r) => r.id) ?? []
      }
      if (cancelled) return
      setIds(new Set([...own, ...grantedInCampaign].map((id) => id.toLowerCase())))
    })()
    return () => {
      cancelled = true
    }
  }, [campaignID, userID])
  return ids
}

// --- Jogador: aceita sozinho, se a preferência estiver ligada ---------------------------

/** Avisa o app que as preferências mudaram (Settings), para a caixa de entrada reler. */
export const preferencesChanged = () => window.dispatchEvent(new Event('thac0berry:preferences'))

/**
 * Montado no App: com "Accept changes from the DM" ligado, aceita as mudanças
 * pendentes dos personagens da conta (as que chegam e as que esperavam o app
 * abrir). Só o dono do personagem aplica (quem tem acesso temporário vê na ficha).
 */
export function DmChangesInbox() {
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const [accept, setAccept] = useState(false)
  const busy = useRef(new Set<string>())

  useEffect(() => {
    if (!userID) return
    const read = () =>
      void loadPreferences(userID)
        .then((p) => setAccept(!!(p as { accept_dm_changes?: boolean }).accept_dm_changes))
        .catch(() => setAccept(false))
    read()
    window.addEventListener('thac0berry:preferences', read)
    return () => window.removeEventListener('thac0berry:preferences', read)
  }, [userID])

  useEffect(() => {
    if (!userID || !accept) return
    let cancelled = false
    const run = async () => {
      const mine = await supabase.from('character').select('id').eq('owner_id', userID).not('campaign_id', 'is', null).is('deleted_at', null)
      if (mine.error || cancelled) return
      const ids = (mine.data as { id: string }[]).map((r) => r.id)
      if (ids.length === 0) return
      const pending = await supabase.from('combat_message').select(columns).eq('direction', 'to_player').eq('status', 'pending').in('character_id', ids).order('created_at')
      if (pending.error || cancelled) return
      for (const m of pending.data as CombatMessage[]) {
        if (busy.current.has(m.id)) continue
        busy.current.add(m.id)
        try {
          await acceptDmChange(m)
        } catch {
          // Fica pendente: a ficha mostra, e a próxima passada tenta de novo.
        } finally {
          busy.current.delete(m.id)
        }
      }
    }
    void run()
    const stop = subscribeRows('combat_message', '', (change) => change.event === 'INSERT' && void run())
    return () => {
      cancelled = true
      stop()
    }
  }, [userID, accept])

  return null
}
