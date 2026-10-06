import { useCallback, useEffect, useRef, useState } from 'react'
import { isoNow } from '../rules/spellSheets'
import { supabase } from './supabase'

// Caderno do personagem (aba Notebook da ficha do iPad): folhas com título,
// data e texto, em papel liso, pautado ou quadriculado. Cada personagem tem o
// seu (pedido do usuário, 2026-10-06; formato 2 do iPad). Cada folha é uma
// linha de `notebook_entry` com `character_id`, e só o autor a vê (RLS).
//
// Folhas "freeform" (desenho do PencilKit) só existem no iPad: aqui aparecem,
// mas o desenho não abre e não dá para criar uma.

export type PaperStyle = 'plain' | 'lined' | 'grid'
export const paperStyles: { value: PaperStyle; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'lined', label: 'Lined' },
  { value: 'grid', label: 'Grid' },
]

export interface NotebookPage {
  id: string
  date: string | null
  title: string
  text: string
  /** null = "transcribed" (folhas antigas não tinham o campo). */
  kind: 'transcribed' | 'freeform' | null
  /** null = "plain". */
  paper_style: PaperStyle | null
  drawing_attachment: string | null
}

type Editable = Partial<Pick<NotebookPage, 'title' | 'text' | 'paper_style'>>

const SAVE_DELAY_MS = 1000
const byDate = (a: NotebookPage, b: NotebookPage) => (a.date ?? '').localeCompare(b.date ?? '')

export function useNotebook(characterID: string | undefined, userID: string | null) {
  const [pages, setPages] = useState<NotebookPage[] | null>(null)
  const [defaultStyle, setDefaultStyle] = useState<PaperStyle>('plain')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const versions = useRef(new Map<string, number>())
  const drafts = useRef(new Map<string, Editable>())
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    if (!userID || !characterID) return
    let cancelled = false
    void Promise.all([
      supabase
        .from('notebook_entry')
        .select('id, date, title, text, kind, paper_style, drawing_attachment, version')
        .eq('character_id', characterID)
        .is('deleted_at', null),
      supabase.from('user_preferences').select('default_notebook_paper_style').eq('user_id', userID).maybeSingle(),
    ]).then(([found, prefs]) => {
      if (cancelled) return
      if (found.error) return setError(found.error.message)
      const rows = found.data as (NotebookPage & { version: number })[]
      for (const row of rows) versions.current.set(row.id, row.version)
      setPages(rows.map(({ version: _v, ...row }) => row).sort(byDate))
      // Settings → padrão do papel da folha nova (defaultNotebookPaperStyle do iPad).
      const style = (prefs.data as { default_notebook_paper_style: string | null } | null)?.default_notebook_paper_style
      if (style === 'lined' || style === 'grid' || style === 'plain') setDefaultStyle(style)
    })
    return () => {
      cancelled = true
    }
  }, [userID, characterID])

  const flush = useCallback(async (pageID: string) => {
    const timer = timers.current.get(pageID)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(pageID)
    const pending = drafts.current.get(pageID)
    if (!pending) return
    drafts.current.delete(pageID)
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('notebook_entry')
        .update({ ...pending, version: versions.current.get(pageID) })
        .eq('id', pageID)
        .select('version')
        .single()
      if (error) throw new Error(error.message)
      versions.current.set(pageID, (data as { version: number }).version)
      setError(null)
    } catch (reason) {
      drafts.current.set(pageID, { ...pending, ...drafts.current.get(pageID) })
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }, [])

  /** Muda uma folha e agenda a gravação (ou grava já, se `now`). */
  const update = useCallback(
    (pageID: string, patch: Editable, now = false) => {
      setPages((current) => current?.map((p) => (p.id === pageID ? { ...p, ...patch } : p)) ?? current)
      drafts.current.set(pageID, { ...drafts.current.get(pageID), ...patch })
      const timer = timers.current.get(pageID)
      if (timer !== undefined) window.clearTimeout(timer)
      if (now) void flush(pageID)
      else timers.current.set(pageID, window.setTimeout(() => void flush(pageID), SAVE_DELAY_MS))
    },
    [flush],
  )

  // Ao sair da página ou fechar a aba, grava o que estiver pendente.
  useEffect(() => {
    const pending = drafts.current
    const flushAll = () => {
      for (const id of [...pending.keys()]) void flush(id)
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushAll()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      flushAll()
    }
  }, [flush])

  /** addNotebookPage do iPad: folha transcrita nova, no papel padrão. Devolve o id. */
  const addPage = useCallback(async (): Promise<string | null> => {
    if (!characterID) return null
    const page: NotebookPage = {
      id: crypto.randomUUID().toUpperCase(),
      date: isoNow(),
      title: '',
      text: '',
      kind: 'transcribed',
      paper_style: defaultStyle,
      drawing_attachment: null,
    }
    const { drawing_attachment: _d, ...row } = page
    // Sem campanha: a folha é do personagem e o acompanha se ele mudar de campanha.
    const { error } = await supabase.from('notebook_entry').insert({ ...row, character_id: characterID })
    if (error) throw new Error(error.message)
    versions.current.set(page.id, 1)
    setPages((current) => [...(current ?? []), page].sort(byDate))
    return page.id
  }, [characterID, defaultStyle])

  /** Apagar folha: `deleted_at` (fica no histórico do servidor). */
  const deletePage = useCallback(async (pageID: string) => {
    const timer = timers.current.get(pageID)
    if (timer !== undefined) window.clearTimeout(timer)
    drafts.current.delete(pageID)
    const { error } = await supabase
      .from('notebook_entry')
      .update({ deleted_at: new Date().toISOString(), version: versions.current.get(pageID) })
      .eq('id', pageID)
    if (error) throw new Error(error.message)
    setPages((current) => current?.filter((p) => p.id !== pageID) ?? current)
  }, [])

  return { pages, error, saving, update, addPage, deletePage }
}
