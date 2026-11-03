import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useAuth } from '../auth/context'
import { slotOfSrc } from './siteImageRules'
import { supabase } from './supabase'

// Imagens do site trocadas pelo admin navegando no app (versões no Supabase:
// tabela site_image_version, bucket público site-images). Hoje, os personagens
// do The Forge; depois, o Grimório. Quem manda é a versão atual do slot; sem
// versão (ou sem rede), vale o arquivo do repo. A lista das atuais é carregada
// uma vez por sessão e recarregada depois de cada troca.

const bucket = 'site-images'

export interface SiteImageVersion {
  slot: string
  version: number
  storage_path: string
  uploaded_at: string
  is_current: boolean
}

export const siteImageURL = (path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

let current: ReadonlyMap<string, string> = new Map()
let loaded = false
const listeners = new Set<() => void>()

/** Recarrega as versões atuais (de 1000 em 1000, o limite por resposta da API). */
export async function refreshSiteImages(): Promise<void> {
  const next = new Map<string, string>()
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from('site_image_version')
      .select('slot, storage_path')
      .eq('is_current', true)
      .order('slot')
      .range(from, from + page - 1)
    if (error) return
    for (const row of data as { slot: string; storage_path: string }[]) next.set(row.slot, siteImageURL(row.storage_path))
    if (data.length < page) break
  }
  current = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!loaded) {
    loaded = true
    void refreshSiteImages()
  }
  return () => {
    listeners.delete(listener)
  }
}

/** Troca cada arquivo do repo pela versão atual do slot, se houver. */
export function useSiteImages(images: string[]): string[] {
  const map = useSyncExternalStore(subscribe, () => current)
  const key = images.join('|')
  return useMemo(() => key.split('|').filter(Boolean).map((src) => map.get(slotOfSrc(src) ?? '') ?? src), [key, map])
}

// Uma pergunta só por conta, por mais imagens que a tela tenha.
let adminCheck: { uid: string; answer: Promise<boolean> } | null = null

/** O usuário logado é admin? */
export function useIsAdmin(): boolean {
  const uid = useAuth().session?.user.id ?? null
  const [answer, setAnswer] = useState<{ uid: string; admin: boolean } | null>(null)
  useEffect(() => {
    if (!uid) return
    if (adminCheck?.uid !== uid) {
      adminCheck = { uid, answer: Promise.resolve(supabase.rpc('is_admin')).then(({ data }) => data === true) }
    }
    let alive = true
    void adminCheck.answer.then((admin) => {
      if (alive) setAnswer({ uid, admin })
    })
    return () => {
      alive = false
    }
  }, [uid])
  return !!uid && answer?.uid === uid && answer.admin
}

/** Todas as versões do slot, da mais nova para a mais antiga. */
export async function siteImageVersions(slot: string): Promise<SiteImageVersion[]> {
  const { data, error } = await supabase
    .from('site_image_version')
    .select('slot, version, storage_path, uploaded_at, is_current')
    .eq('slot', slot)
    .order('version', { ascending: false })
  if (error) throw new Error(error.message)
  return data as SiteImageVersion[]
}

/** Envia o WebP pronto como a versão seguinte do slot, que passa a ser a atual. */
export async function addSiteImageVersion(slot: string, webp: Blob, size: { width: number; height: number }): Promise<void> {
  const path = `${slot}/${crypto.randomUUID()}.webp`
  // Cada caminho é um arquivo que nunca muda: o navegador pode guardá-lo por um ano.
  const upload = await supabase.storage.from(bucket).upload(path, webp, { contentType: 'image/webp', cacheControl: '31536000' })
  if (upload.error) throw new Error(upload.error.message)
  const { error } = await supabase.rpc('add_site_image_version', { p_slot: slot, p_storage_path: path, p_width: size.width, p_height: size.height })
  if (error) throw new Error(error.message)
  await refreshSiteImages()
}

/** Volta o slot para uma versão que já existe. */
export async function setCurrentSiteImage(slot: string, version: number): Promise<void> {
  const { error } = await supabase.rpc('set_current_site_image', { p_slot: slot, p_version: version })
  if (error) throw new Error(error.message)
  await refreshSiteImages()
}
