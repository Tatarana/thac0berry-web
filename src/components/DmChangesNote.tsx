import { useCallback, useEffect, useState } from 'react'
import { acceptDmChange, fetchDmChanges, resolveMessage, type CombatMessage } from '../lib/combatMessages'
import { subscribeRows, uuidFilter } from '../lib/realtime'
import { supabase } from '../lib/supabase'
import { hpChangeText, type HpChange } from '../rules/dmChanges'

// Combat Tracker interativo, I2: o que o mestre mandou a este personagem. As
// pendentes com Accept / Decline (só para quem fala pelo personagem); as aceitas
// nas últimas 12 h ficam destacadas até o jogador dar OK (guardado no aparelho).

const seenKey = 'thac0berry.dmChanges.seen'

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function markSeen(ids: string[]) {
  try {
    const all = [...readSeen(), ...ids].slice(-200)
    localStorage.setItem(seenKey, JSON.stringify(all))
  } catch {
    // Sem armazenamento: o destaque volta ao recarregar; não é grave.
  }
}

const textOf = (m: CombatMessage) => (m.kind === 'hp' ? hpChangeText(m.payload as unknown as HpChange) : m.kind)
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { timeStyle: 'short' })

export function DmChangesNote({ characterID, userID }: { characterID: string; userID: string | null }) {
  const [messages, setMessages] = useState<CombatMessage[]>([])
  const [mine, setMine] = useState(false)
  const [seen, setSeen] = useState(readSeen)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchDmChanges(characterID)
      .then(setMessages)
      .catch(() => setMessages([]))
  }, [characterID])

  useEffect(() => {
    if (!userID) return
    load()
    // Quem responde: o dono (ou quem tem o acesso temporário, conferido no servidor).
    void supabase
      .rpc('speaks_for_character', { p_character: characterID })
      .then(({ data }) => setMine(data === true))
    return subscribeRows('combat_message', uuidFilter('character_id', characterID), load)
  }, [characterID, userID, load])

  const pending = messages.filter((m) => m.status === 'pending')
  const recent = messages.filter((m) => m.status === 'accepted' && !seen.has(m.id))
  if (pending.length === 0 && recent.length === 0) return null

  async function answer(m: CombatMessage, accept: boolean) {
    setBusy(m.id)
    setError(null)
    try {
      if (accept) await acceptDmChange(m)
      else await resolveMessage(m.id, false)
      load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="dm-changes" role="status">
      {pending.map((m) => (
        <p key={m.id} className="dm-change dm-change-pending">
          <strong>From the DM:</strong> {textOf(m)} <span className="soft">· {timeOf(m.created_at)}</span>{' '}
          {mine && (
            <>
              <button className="btn btn-small" disabled={busy === m.id} onClick={() => void answer(m, true)}>
                Accept
              </button>{' '}
              <button className="btn btn-small" disabled={busy === m.id} onClick={() => void answer(m, false)}>
                Decline
              </button>
            </>
          )}
        </p>
      ))}
      {recent.length > 0 && (
        <p className="dm-change dm-change-done">
          <strong>Changed by the DM:</strong> {recent.map((m) => `${textOf(m)} · ${timeOf(m.resolved_at ?? m.created_at)}`).join('; ')}{' '}
          <button
            className="paper-link"
            onClick={() => {
              markSeen(recent.map((m) => m.id))
              setSeen(readSeen())
            }}
          >
            OK
          </button>
        </p>
      )}
      {error && <p className="soft save-error">Could not answer: {error}</p>}
    </div>
  )
}
