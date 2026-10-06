import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerCharacter } from '../types/library'
import { loadValidators } from './libraryImport'
import { supabase } from './supabase'

// Ficha aberta para edição, com gravação automática (decisão do usuário:
// "assim simula o funcionamento da versão iPad", que grava o library.json
// 0,4 s depois da última mudança; aqui 1 s, porque cada gravação vai pela rede).
//
// Contrato do backend (thac0berry-backend, docs/modelo-de-dados-e-sync.md §6):
// UPDATE levando o `version` conhecido. Se outro lugar gravou antes, o
// servidor aceita (a última gravação vence), guarda a anterior em
// record_history e marca `conflicted_at`; aqui isso vira um aviso.
//
// Antes de gravar, a ficha passa pelo library.schema.json: a web nunca grava
// algo que o iPad descartaria ao ler.

/** `character.data` no servidor: o PlayerCharacter sem folhas de magia e retrato. */
export type ServerCharacter = Omit<PlayerCharacter, 'spellSheets' | 'portraitImageData'>

export type SaveState =
  | { kind: 'saved'; at: string }
  | { kind: 'pending' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }

export interface CharacterDoc {
  character: ServerCharacter
  campaignID: string | null
  portraitAttachment: string | null
}

const SAVE_DELAY_MS = 1000

export function useCharacterDoc(id: string | undefined, userID: string | null) {
  const [doc, setDoc] = useState<CharacterDoc | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'saved', at: '' })
  const [conflict, setConflict] = useState(false)

  // Estado de gravação fora do React: versão conhecida, rascunho pendente e o timer.
  const version = useRef<number | null>(null)
  const draft = useRef<ServerCharacter | null>(null)
  const timer = useRef<number | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('character')
        .select('data, version, campaign_id, portrait_attachment, updated_at')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (cancelled) return
      if (error) return setLoadError(error.message)
      if (!data) return setLoadError('This character is not on your account.')
      const row = data as {
        data: ServerCharacter
        version: number
        campaign_id: string | null
        portrait_attachment: string | null
        updated_at: string
      }
      version.current = row.version
      setDoc({ character: row.data, campaignID: row.campaign_id, portraitAttachment: row.portrait_attachment })
      setSave({ kind: 'saved', at: row.updated_at })
    })()
    return () => {
      cancelled = true
    }
  }, [userID, id])

  // Referência estável para o timer chamar a versão atual de `flush`.
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
      const { character } = await loadValidators()
      // O schema descreve o PlayerCharacter inteiro; no servidor as folhas ficam à parte.
      const problem = character({ ...pending, spellSheets: [] })
      if (problem) throw new Error(`the sheet would not open on the iPad (${problem})`)
      const { data, error } = await supabase
        .from('character')
        .update({ data: pending, version: version.current })
        .eq('id', id)
        .select('version, updated_at, conflicted_at')
        .single()
      if (error) throw new Error(error.message)
      const row = data as { version: number; updated_at: string; conflicted_at: string | null }
      version.current = row.version
      if (row.conflicted_at) setConflict(true)
      setSave(draft.current ? { kind: 'pending' } : { kind: 'saved', at: row.updated_at })
    } catch (reason) {
      // Volta o rascunho para a fila (se nada mais novo chegou) e avisa.
      draft.current ??= pending
      setSave({ kind: 'error', message: reason instanceof Error ? reason.message : String(reason) })
    } finally {
      inFlight.current = false
    }
    // Mudanças feitas durante a gravação saem logo em seguida.
    if (draft.current && timer.current === null) timer.current = window.setTimeout(() => void flushRef.current(), SAVE_DELAY_MS)
  }, [id])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  /** Aplica uma mudança na ficha (sobre uma cópia) e agenda a gravação. */
  const update = useCallback(
    (mutate: (c: ServerCharacter) => void) => {
      setDoc((current) => {
        if (!current) return current
        const next = structuredClone(current.character)
        mutate(next)
        draft.current = next
        return { ...current, character: next }
      })
      setSave({ kind: 'pending' })
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush],
  )

  /**
   * Troca (ou tira, com null) o retrato: coluna `portrait_attachment` da
   * mesma linha, então grava antes o que estiver pendente e segue a mesma
   * versão da ficha.
   */
  const setPortrait = useCallback(
    async (attachmentID: string | null) => {
      if (!id) return
      await flush()
      while (inFlight.current) await new Promise((resolve) => window.setTimeout(resolve, 100))
      const { data, error } = await supabase
        .from('character')
        .update({ portrait_attachment: attachmentID, version: version.current })
        .eq('id', id)
        .select('version, updated_at, conflicted_at')
        .single()
      if (error) throw new Error(error.message)
      const row = data as { version: number; updated_at: string; conflicted_at: string | null }
      version.current = row.version
      if (row.conflicted_at) setConflict(true)
      setDoc((current) => (current ? { ...current, portraitAttachment: attachmentID } : current))
      if (!draft.current) setSave({ kind: 'saved', at: row.updated_at })
    },
    [id, flush],
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

  return { doc, loadError, save, conflict, dismissConflict: () => setConflict(false), update, setPortrait, retry: flush }
}
