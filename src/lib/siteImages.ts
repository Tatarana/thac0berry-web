import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useAuth } from '../auth/context'
import { monsterSlot, resolveSiteImages } from './siteImageRules'
import { SITE_IMAGES_BASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'
import { supabase } from './supabase'
import { MAX_IMAGE_BYTES, functionErrorMessage, joinURL, parsePresign, putErrorMessage } from './siteImageUploadRules'

// Imagens do site trocadas pelo admin navegando no app. As versões ficam no
// Supabase (tabela site_image_version); os arquivos, num bucket S3 atrás do
// CloudFront (SITE_IMAGES_BASE_URL). Hoje, os personagens do The Forge; depois,
// o Grimório. Quem manda é a versão atual do slot; sem
// versão (ou sem rede), vale o arquivo do repo. A lista das atuais é carregada
// uma vez por sessão e recarregada depois de cada troca. Os monstros são milhares
// e ficam de fora dessa lista: cada um é buscado ao abrir a ficha.

export interface SiteImageVersion {
  slot: string
  version: number
  storage_path: string
  uploaded_at: string
  is_current: boolean
}

/** Endereço público do arquivo (o `storage_path` é relativo e igual no S3 e no CloudFront). */
export const siteImageURL = (path: string) => joinURL(SITE_IMAGES_BASE_URL, path)

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
      .not('slot', 'like', 'monster/%')
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
  return useMemo(() => resolveSiteImages(key.split('|').filter(Boolean), map), [key, map])
}

/** A ilustração do monstro: `undefined` enquanto busca, `null` se não houver. */
export function useMonsterImage(id: string): string | null | undefined {
  const refreshed = useSyncExternalStore(subscribe, () => current)
  const slot = monsterSlot(id)
  const [found, setFound] = useState<{ slot: string; url: string | null } | null>(null)
  useEffect(() => {
    let alive = true
    void Promise.resolve(supabase.from('site_image_version').select('storage_path').eq('slot', slot).eq('is_current', true).maybeSingle()).then(({ data }) => {
      if (alive) setFound({ slot, url: data ? siteImageURL((data as { storage_path: string }).storage_path) : null })
    })
    return () => {
      alive = false
    }
  }, [slot, refreshed])
  return found?.slot === slot ? found.url : undefined
}

/** O mesmo fora do React, para quem precisa do arquivo logo depois do login. */
export async function currentSiteImages(images: string[]): Promise<string[]> {
  if (current.size === 0) await refreshSiteImages()
  return resolveSiteImages(images, current)
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

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/site-image-upload`

/** Chama a Edge Function site-image-upload com o login do usuário. */
async function callUploadFunction(body: Record<string, unknown>): Promise<unknown> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sign in as the admin to change site images.')
  let res: Response
  try {
    res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the upload service. Check your connection.')
  }
  const answer: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const message = typeof answer === 'object' && answer !== null && 'error' in answer ? String((answer as { error: unknown }).error) : undefined
    throw new Error(functionErrorMessage(res.status, message))
  }
  return answer
}

/**
 * Envia o WebP pronto como a versão seguinte do slot, que passa a ser a atual:
 * 1) a função confere o admin e devolve uma URL de PUT assinada (5 minutos);
 * 2) o navegador envia o arquivo direto ao S3, com os cabeçalhos assinados;
 * 3) a função confere o arquivo no bucket e registra a versão.
 */
export async function addSiteImageVersion(slot: string, webp: Blob, size: { width: number; height: number }): Promise<void> {
  if (webp.size > MAX_IMAGE_BYTES) throw new Error('The image is larger than 5 MB. Lower the quality and try again.')
  const presign = parsePresign(await callUploadFunction({ action: 'presign', slot, bytes: webp.size, width: size.width, height: size.height }), slot)
  let put: Response
  try {
    put = await fetch(presign.url, { method: 'PUT', headers: presign.headers, body: webp })
  } catch {
    throw new Error('Could not send the file to the storage. Check your connection and try again.')
  }
  if (!put.ok) throw new Error(putErrorMessage(put.status))
  await callUploadFunction({ action: 'finalize', slot, path: presign.path, width: size.width, height: size.height })
  await refreshSiteImages()
}

/** Volta o slot para uma versão que já existe. */
export async function setCurrentSiteImage(slot: string, version: number): Promise<void> {
  const { error } = await supabase.rpc('set_current_site_image', { p_slot: slot, p_version: version })
  if (error) throw new Error(error.message)
  await refreshSiteImages()
}
