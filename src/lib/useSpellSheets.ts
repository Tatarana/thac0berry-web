import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpellSheet } from '../types/library'
import { loadValidators } from './libraryImport'
import { subscribeRows, uuidFilter } from './realtime'
import { supabase } from './supabase'
import type { SaveState } from './useCharacterDoc'

// Folhas de magia de um personagem (tabela spell_sheet), com gravação
// automática por folha: mesmo contrato da ficha (useCharacterDoc), UPDATE com
// o `version` conhecido, 1 s depois da última mudança, e validação pelo
// $defs/SpellSheet do library.schema.json antes de gravar. Ao vivo (Fase 3,
// R1): folha criada, mudada ou apagada em outro lugar relê as folhas, se não
// houver edição pendente aqui (mesma regra da ficha).

/** spell_sheet.data: o SpellSheet do iPad sem `inkNotes` (vira anexo). */
export type ServerSheet = Omit<SpellSheet, 'inkNotes'>

const SAVE_DELAY_MS = 1000

export function useSpellSheets(characterID: string | undefined, userID: string | null) {
  const [sheets, setSheets] = useState<ServerSheet[] | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'saved', at: '' })
  const [conflict, setConflict] = useState(false)
  /** Hora em que as folhas receberam uma gravação de outro lugar (o aviso); null = nada. */
  const [remoteChange, setRemoteChange] = useState<string | null>(null)

  const versions = useRef(new Map<string, number>())
  const drafts = useRef(new Map<string, ServerSheet>())
  const timers = useRef(new Map<string, number>())
  const inFlight = useRef(new Set<string>())
  const flushRef = useRef<(id: string) => Promise<void>>(() => Promise.resolve())

  useEffect(() => {
    if (!userID || !characterID) return
    let cancelled = false
    const busy = () => drafts.current.size > 0 || inFlight.current.size > 0 || timers.current.size > 0
    const load = async (remote: boolean) => {
      const { data, error } = await supabase
        .from('spell_sheet')
        .select('id, data, version, updated_at')
        .eq('character_id', characterID)
        .is('deleted_at', null)
      if (cancelled || error || (remote && busy())) return
      const rows = data as { id: string; data: ServerSheet; version: number; updated_at: string }[]
      versions.current = new Map(rows.map((row) => [row.id, row.version]))
      // Em ordem de data: cada folha é um dia de jogo.
      setSheets(rows.map((r) => r.data).sort((a, b) => a.date.localeCompare(b.date)))
      if (remote) setRemoteChange(new Date().toISOString())
    }
    void load(false)
    const unsubscribe = subscribeRows('spell_sheet', uuidFilter('character_id', characterID), ({ event, row }) => {
      const sheetID = String(row.id ?? '').toLowerCase()
      const known = [...versions.current.entries()].find(([k]) => k.toLowerCase() === sheetID)
      // Eco das próprias gravações: folha que já conhecemos, na versão que já temos.
      if (event === 'INSERT' && known) return
      if (event === 'UPDATE' && known && Number(row.version) <= known[1] && !row.deleted_at) return
      if (busy()) return
      void load(true)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userID, characterID])

  const schedule = (id: string) => {
    const old = timers.current.get(id)
    if (old !== undefined) window.clearTimeout(old)
    timers.current.set(
      id,
      window.setTimeout(() => void flushRef.current(id), SAVE_DELAY_MS),
    )
  }

  const flush = useCallback(async (id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    const pending = drafts.current.get(id)
    if (!pending || inFlight.current.has(id)) return
    drafts.current.delete(id)
    inFlight.current.add(id)
    setSave({ kind: 'saving' })
    try {
      const { spellSheet } = await loadValidators()
      const problem = spellSheet(pending)
      if (problem) throw new Error(`the spell sheet would not open on the iPad (${problem})`)
      const { data, error } = await supabase
        .from('spell_sheet')
        .update({ data: pending, version: versions.current.get(id) })
        .eq('id', id)
        .select('version, updated_at, conflicted_at')
        .single()
      if (error) throw new Error(error.message)
      const row = data as { version: number; updated_at: string; conflicted_at: string | null }
      versions.current.set(id, row.version)
      if (row.conflicted_at) setConflict(true)
      setSave(drafts.current.size > 0 ? { kind: 'pending' } : { kind: 'saved', at: row.updated_at })
    } catch (reason) {
      if (!drafts.current.has(id)) drafts.current.set(id, pending)
      setSave({ kind: 'error', message: reason instanceof Error ? reason.message : String(reason) })
    } finally {
      inFlight.current.delete(id)
    }
    if (drafts.current.has(id) && !timers.current.has(id)) schedule(id)
  }, [])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  /** Aplica uma mudança numa folha (sobre uma cópia) e agenda a gravação. */
  const update = useCallback((sheetID: string, mutate: (s: ServerSheet) => void) => {
    setSheets((current) => {
      if (!current) return current
      return current.map((sheet) => {
        if (sheet.id !== sheetID) return sheet
        const next = structuredClone(sheet)
        mutate(next)
        drafts.current.set(sheetID, next)
        return next
      })
    })
    setSave({ kind: 'pending' })
    schedule(sheetID)
  }, [])

  /** Folha nova (dia novo): INSERT, como manda o contrato para registro novo. */
  const createSheet = useCallback(
    async (sheet: ServerSheet) => {
      if (!characterID) return
      const { spellSheet } = await loadValidators()
      const problem = spellSheet(sheet)
      if (problem) throw new Error(`the new spell sheet would not open on the iPad (${problem})`)
      const { error } = await supabase
        .from('spell_sheet')
        .insert({ id: sheet.id, character_id: characterID, session_id: sheet.sessionID ?? null, data: sheet })
      if (error) throw new Error(error.message)
      versions.current.set(sheet.id, 1)
      setSheets((current) => [...(current ?? []), sheet].sort((a, b) => a.date.localeCompare(b.date)))
    },
    [characterID],
  )

  /** Apagar uma folha: marca `deleted_at` (o backend nunca apaga a linha; fica no histórico). */
  const deleteSheet = useCallback(async (sheetID: string) => {
    const timer = timers.current.get(sheetID)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(sheetID)
    drafts.current.delete(sheetID)
    const { error } = await supabase
      .from('spell_sheet')
      .update({ deleted_at: new Date().toISOString(), version: versions.current.get(sheetID) })
      .eq('id', sheetID)
    if (error) throw new Error(error.message)
    setSheets((current) => (current ?? []).filter((s) => s.id !== sheetID))
  }, [])

  const flushAll = useCallback(async () => {
    await Promise.all([...drafts.current.keys()].map((id) => flushRef.current(id)))
  }, [])

  // Ao esconder ou fechar a aba, grava o que estiver pendente.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushAll()
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (drafts.current.size > 0 || inFlight.current.size > 0) {
        void flushAll()
        event.preventDefault()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      void flushAll()
    }
  }, [flushAll])

  return {
    sheets,
    save,
    conflict,
    dismissConflict: () => setConflict(false),
    remoteChange,
    dismissRemoteChange: () => setRemoteChange(null),
    update,
    createSheet,
    deleteSheet,
    retry: flushAll,
  }
}
