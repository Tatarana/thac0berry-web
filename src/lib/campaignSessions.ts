import { useCallback, useEffect, useRef, useState } from 'react'
import { startSpellSheet } from '../rules/spellSheets'
import type { SpellSheet } from '../types/library'
import { loadValidators } from './libraryImport'
import { spellSheetBasis } from './roster'
import { supabase } from './supabase'
import type { ServerCharacter } from './useCharacterDoc'

// Sessões de mesa de uma campanha (CampaignIndexView do iPad). No iPad o
// índice fica dentro de cada personagem; aqui fica na campanha, com os dias
// de magia de cada conjurador do elenco em cada sessão.
//
// Contrato de sempre: INSERT da sessão nova; UPDATE com o `version`
// conhecido; apagar = `deleted_at`.

export interface SessionRow {
  id: string
  date: string
  title: string
  summary: string
  is_archived: boolean
}

type Editable = Partial<Pick<SessionRow, 'title' | 'summary' | 'is_archived'>>

/** Folha de magia resumida: de quem é e de que sessão. */
export interface SheetRef {
  id: string
  character_id: string
  session_id: string | null
  /** Data do dia (data.date da folha), para achar o mais recente. */
  date: string | null
}

const SAVE_DELAY_MS = 1000

export function useCampaignSessions(campaignID: string | undefined, userID: string | null) {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [sheets, setSheets] = useState<SheetRef[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const versions = useRef(new Map<string, number>())
  const drafts = useRef(new Map<string, Editable>())
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    if (!userID || !campaignID) return
    let cancelled = false
    void (async () => {
      const found = await supabase
        .from('session')
        .select('id, date, title, summary, is_archived, version')
        .eq('campaign_id', campaignID)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      if (cancelled) return
      if (found.error) return setError(found.error.message)
      const rows = found.data as (SessionRow & { version: number })[]
      for (const row of rows) versions.current.set(row.id, row.version)
      const ids = rows.map((row) => row.id)
      const days = ids.length
        ? await supabase.from('spell_sheet').select('id, character_id, session_id, date:data->>date').in('session_id', ids).is('deleted_at', null)
        : { data: [], error: null }
      if (cancelled) return
      if (days.error) return setError(days.error.message)
      setSessions(rows.map(({ version: _v, ...row }) => row))
      setSheets(days.data as SheetRef[])
    })()
    return () => {
      cancelled = true
    }
  }, [userID, campaignID])

  const flush = useCallback(async (sessionID: string) => {
    const timer = timers.current.get(sessionID)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(sessionID)
    const pending = drafts.current.get(sessionID)
    if (!pending) return
    drafts.current.delete(sessionID)
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('session')
        .update({ ...pending, version: versions.current.get(sessionID) })
        .eq('id', sessionID)
        .select('version')
        .single()
      if (error) throw new Error(error.message)
      versions.current.set(sessionID, (data as { version: number }).version)
      setError(null)
    } catch (reason) {
      drafts.current.set(sessionID, { ...pending, ...drafts.current.get(sessionID) })
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }, [])

  /** Muda campos de uma sessão e agenda a gravação (ou grava já, se `now`). */
  const update = useCallback(
    (sessionID: string, patch: Editable, now = false) => {
      setSessions((current) => current?.map((s) => (s.id === sessionID ? { ...s, ...patch } : s)) ?? current)
      drafts.current.set(sessionID, { ...drafts.current.get(sessionID), ...patch })
      const timer = timers.current.get(sessionID)
      if (timer !== undefined) window.clearTimeout(timer)
      if (now) void flush(sessionID)
      else timers.current.set(sessionID, window.setTimeout(() => void flush(sessionID), SAVE_DELAY_MS))
    },
    [flush],
  )

  // Ao sair, grava o que estiver pendente.
  useEffect(() => {
    const pending = drafts.current
    return () => {
      for (const id of [...pending.keys()]) void flush(id)
    }
  }, [flush])

  /** NewSessionSheet do iPad: data da mesa e título opcional. */
  const createSession = useCallback(
    async (date: string, title: string) => {
      if (!campaignID) return
      const id = crypto.randomUUID().toUpperCase()
      const row = { id, date, title, summary: '', is_archived: false }
      const { error } = await supabase.from('session').insert({ ...row, campaign_id: campaignID })
      if (error) throw new Error(error.message)
      versions.current.set(id, 1)
      setSessions((current) => [...(current ?? []), row].sort((a, b) => b.date.localeCompare(a.date)))
    },
    [campaignID],
  )

  /**
   * Apagar sessão: os dias de magia dela (de todo o elenco) e a sessão viram
   * `deleted_at`. No iPad o índice é por personagem e só a folha dele sai.
   */
  const deleteSession = useCallback(
    async (sessionID: string) => {
      const now = new Date().toISOString()
      const days = await supabase.from('spell_sheet').select('id, version').eq('session_id', sessionID).is('deleted_at', null)
      if (days.error) throw new Error(days.error.message)
      for (const day of days.data as { id: string; version: number }[]) {
        const { error } = await supabase.from('spell_sheet').update({ deleted_at: now, version: day.version }).eq('id', day.id)
        if (error) throw new Error(error.message)
      }
      const timer = timers.current.get(sessionID)
      if (timer !== undefined) window.clearTimeout(timer)
      drafts.current.delete(sessionID)
      const { error } = await supabase
        .from('session')
        .update({ deleted_at: now, version: versions.current.get(sessionID) })
        .eq('id', sessionID)
      if (error) throw new Error(error.message)
      setSessions((current) => current?.filter((s) => s.id !== sessionID) ?? current)
      setSheets((current) => current.filter((s) => s.session_id !== sessionID))
    },
    [],
  )

  return { sessions, sheets, error, saving, update, createSession, deleteSession }
}

/**
 * Abrir uma sessão sem dia do personagem (open/createSession do iPad): cria
 * "Day 1" naquela sessão, herdando da folha mais recente dele, como o "+" das
 * bolinhas.
 */
export async function startSessionDay(characterID: string, sessionID: string) {
  const [character, existing] = await Promise.all([
    supabase.from('character').select('data').eq('id', characterID).single(),
    supabase.from('spell_sheet').select('data').eq('character_id', characterID).is('deleted_at', null),
  ])
  if (character.error) throw new Error(character.error.message)
  if (existing.error) throw new Error(existing.error.message)
  const c = (character.data as { data: ServerCharacter }).data
  const sheets = (existing.data as { data: SpellSheet }[]).map((row) => row.data)
  const sheet = startSpellSheet(spellSheetBasis(c), sheets, { sessionID, title: 'Day 1' })
  const { spellSheet } = await loadValidators()
  const problem = spellSheet(sheet)
  if (problem) throw new Error(`the new spell sheet would not open on the iPad (${problem})`)
  const { error } = await supabase.from('spell_sheet').insert({ id: sheet.id, character_id: characterID, session_id: sessionID, data: sheet })
  if (error) throw new Error(error.message)
}
