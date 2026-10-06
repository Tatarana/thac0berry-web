import { useCallback, useEffect, useRef, useState } from 'react'
import { isoNow } from '../rules/spellSheets'
import type { SaveState } from './useCharacterDoc'
import { supabase } from './supabase'

// Campanhas (CampaignListView/CampaignDetailView do iPad): criar, listar e
// editar os campos da própria campanha. Sessões e caderno ficam em tabelas
// próprias (W3.2 e W3.3).
//
// Mesmo contrato do useCharacterDoc: INSERT para a campanha nova; UPDATE
// levando o `version` conhecido; nunca upsert. Gravação automática 1 s depois
// da última mudança.

/** Colunas da tabela `campaign` que a tela usa. */
export interface CampaignRow {
  id: string
  name: string
  started_date: string | null
  notes: string
  is_archived: boolean
  enabled_settings: string[] | null
}

export type CampaignFields = Omit<CampaignRow, 'id'>

/** Campaign.displayTitle do iPad. */
export const campaignTitle = (c: Pick<CampaignRow, 'name'>) => (c.name.trim() === '' ? 'Unnamed Campaign' : c.name)

/** CampaignSettingCatalog.all do iPad: as ambientações oficiais. */
export const campaignSettings = [
  'Al-Qadim',
  'Council of Wyrms',
  'Dark Sun',
  'Forgotten Realms',
  'Greyhawk',
  'Planescape',
  'Ravenloft',
  'Spelljammer',
]

/**
 * CharacterLibrary.addCampaign do iPad: campanha sem nome, começando hoje,
 * sem filtro de ambientação. Devolve o id (UUID em maiúsculas, como o iPad).
 */
export async function createCampaign(name = ''): Promise<string> {
  const id = crypto.randomUUID().toUpperCase()
  const { error } = await supabase
    .from('campaign')
    .insert({ id, name, started_date: isoNow(), notes: '', is_archived: false, enabled_settings: null })
  if (error) throw new Error(error.message)
  return id
}

/** "2026-09-20T03:00:00+00:00" → "2026-09-20" no fuso local, para o campo de data. */
export function dateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "2026-09-20" → meia-noite local em ISO-8601 sem fração (o DatePicker do iPad grava assim). */
export function dateFromInput(value: string): string | null {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return isoNow(new Date(y, m - 1, d))
}

const SAVE_DELAY_MS = 1000

/** Campanha aberta para edição, com gravação automática. */
export function useCampaignDoc(id: string | undefined, userID: string | null) {
  const [campaign, setCampaign] = useState<CampaignRow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'saved', at: '' })
  const [conflict, setConflict] = useState(false)

  const version = useRef<number | null>(null)
  // Só os campos mudados desde a última gravação.
  const draft = useRef<Partial<CampaignFields> | null>(null)
  const timer = useRef<number | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('campaign')
        .select('id, name, started_date, notes, is_archived, enabled_settings, version, updated_at')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (cancelled) return
      if (error) return setLoadError(error.message)
      if (!data) return setLoadError('This campaign is not on your account.')
      const { version: v, updated_at, ...row } = data as CampaignRow & { version: number; updated_at: string }
      version.current = v
      setCampaign(row)
      setSave({ kind: 'saved', at: updated_at })
    })()
    return () => {
      cancelled = true
    }
  }, [userID, id])

  const flushRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    if (inFlight.current || !draft.current || !id) return
    const pending = draft.current
    draft.current = null
    inFlight.current = true
    setSave({ kind: 'saving' })
    try {
      const { data, error } = await supabase
        .from('campaign')
        .update({ ...pending, version: version.current })
        .eq('id', id)
        .select('version, updated_at, conflicted_at')
        .single()
      if (error) throw new Error(error.message)
      const row = data as { version: number; updated_at: string; conflicted_at: string | null }
      version.current = row.version
      if (row.conflicted_at) setConflict(true)
      setSave(draft.current ? { kind: 'pending' } : { kind: 'saved', at: row.updated_at })
    } catch (reason) {
      // Junta de volta ao que chegou depois (o mais novo vence) e avisa.
      draft.current = { ...pending, ...(draft.current as Partial<CampaignFields> | null) }
      setSave({ kind: 'error', message: reason instanceof Error ? reason.message : String(reason) })
    } finally {
      inFlight.current = false
    }
    if (draft.current && timer.current === null) timer.current = window.setTimeout(() => void flushRef.current(), SAVE_DELAY_MS)
  }, [id])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  /** Muda campos da campanha e agenda a gravação. */
  const update = useCallback(
    (patch: Partial<CampaignFields>) => {
      setCampaign((current) => (current ? { ...current, ...patch } : current))
      draft.current = { ...draft.current, ...patch }
      setSave({ kind: 'pending' })
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush],
  )

  // Ao sair da página ou fechar a aba, grava o que estiver pendente.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (draft.current || inFlight.current) {
        void flush()
        event.preventDefault()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      void flush()
    }
  }, [flush])

  return { campaign, loadError, save, conflict, dismissConflict: () => setConflict(false), update, retry: flush }
}
