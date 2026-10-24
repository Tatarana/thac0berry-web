// Magias favoritas da conta (`user_preferences.favorite_spell_ids`), como o
// `toggleFavorite` do iPad: a estrela do grimório marca e desmarca; a folha de
// magia põe as favoritas no topo do seletor. Sem sessão, não há favoritas.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/context'
import { savePreferences } from './preferences'
import { supabase } from './supabase'

export interface FavoriteSpells {
  /** false sem sessão: a estrela some. */
  available: boolean
  ids: Set<string>
  has: (spellID: string) => boolean
  toggle: (spellID: string) => void
  /** Última falha ao gravar (a marcação volta ao que estava). */
  error: string | null
}

export function useFavoriteSpells(): FavoriteSpells {
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const [ids, setIDs] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  // As gravações vão em fila, cada uma com a lista inteira mais recente.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const current = useRef<Set<string>>(ids)

  useEffect(() => {
    if (!userID) return
    let cancelled = false
    supabase
      .from('user_preferences')
      .select('favorite_spell_ids')
      .eq('user_id', userID)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const loaded = new Set((data as { favorite_spell_ids: string[] } | null)?.favorite_spell_ids ?? [])
        current.current = loaded
        setIDs(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [userID])

  const toggle = useCallback(
    (spellID: string) => {
      if (!userID) return
      const before = current.current
      const next = new Set(before)
      if (next.has(spellID)) next.delete(spellID)
      else next.add(spellID)
      current.current = next
      setIDs(next)
      setError(null)
      queue.current = queue.current.then(() =>
        savePreferences(userID, { favorite_spell_ids: [...current.current].sort() }).catch((reason: unknown) => {
          current.current = before
          setIDs(before)
          setError(reason instanceof Error ? reason.message : String(reason))
        }),
      )
    },
    [userID],
  )

  return { available: userID !== null, ids, has: (spellID) => ids.has(spellID), toggle, error }
}
