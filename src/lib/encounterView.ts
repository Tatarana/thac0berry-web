import { useEffect, useRef, useState } from 'react'
import type { Encounter } from '../rules/combat'
import { isShared, playerView, type PlayerView } from '../rules/playerView'
import { subscribeRows, uuidFilter } from './realtime'
import { supabase } from './supabase'

// Combat Tracker ao vivo (backend `encounter_view`): o app do mestre publica a
// vista filtrada dos encontros compartilhados da campanha ativa e tira a dos
// que deixaram de ser (desligado, encerrado, apagado). Só publica o que mudou,
// 1 s depois da última mudança; erro (ex.: o encontro ainda não subiu para a
// conta) tenta de novo em 5 s.

const key = (id: string) => id.toLowerCase()

export function usePlayerViewPublisher(encounters: Encounter[], campaignID: string | null, deathAt: number, userID: string | null) {
  // O que está publicado agora (id → JSON), lido da conta ao abrir.
  const published = useRef<Map<string, string> | null>(null)
  const [loaded, setLoaded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    published.current = null
    setLoaded(null)
    if (!userID || !campaignID) return
    let cancelled = false
    void supabase
      .from('encounter_view')
      .select('encounter_id, data')
      .eq('campaign_id', campaignID)
      .eq('owner_id', userID)
      .then(({ data, error: e }) => {
        if (cancelled) return
        if (e) {
          setError(e.message)
          return
        }
        published.current = new Map((data as { encounter_id: string; data: PlayerView }[]).map((r) => [key(r.encounter_id), JSON.stringify(r.data)]))
        setLoaded(campaignID)
      })
    return () => {
      cancelled = true
    }
  }, [userID, campaignID])

  useEffect(() => {
    if (!userID || !campaignID || loaded !== campaignID) return
    const timer = setTimeout(() => {
      const now = published.current
      if (!now) return
      const wanted = new Map(encounters.filter((e) => e.campaignID === campaignID && isShared(e)).map((e) => [key(e.id), JSON.stringify(playerView(e, deathAt))]))
      const jobs: Promise<void>[] = []
      for (const [id, json] of wanted) {
        if (now.get(id) === json) continue
        jobs.push(
          (async () => {
            const { error: e } = await supabase.rpc('publish_encounter_view', { p_encounter: id, p_data: JSON.parse(json) })
            if (e) throw new Error(e.message)
            now.set(id, json)
          })(),
        )
      }
      for (const id of now.keys()) {
        if (wanted.has(id)) continue
        jobs.push(
          (async () => {
            const { error: e } = await supabase.rpc('unpublish_encounter_view', { p_encounter: id })
            if (e) throw new Error(e.message)
            now.delete(id)
          })(),
        )
      }
      if (jobs.length === 0) return
      void Promise.allSettled(jobs).then((results) => {
        const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
        setError(failed ? String(failed.reason instanceof Error ? failed.reason.message : failed.reason) : null)
        if (failed) setTimeout(() => setRetry((n) => n + 1), 5000)
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [encounters, campaignID, deathAt, userID, loaded, retry])

  return { error }
}

// --- Lado dos jogadores (L3) ---------------------------------------------------------------

export interface LiveEncounter {
  encounterID: string
  data: PlayerView
  updatedAt: string
}

/** As vistas ao vivo de uma campanha (null enquanto carrega), relidas a cada aviso do Realtime. */
export function useLiveEncounters(campaignID: string | null) {
  const [views, setViews] = useState<LiveEncounter[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!campaignID) return
    let cancelled = false
    const load = () =>
      void supabase
        .from('encounter_view')
        .select('encounter_id, data, updated_at')
        .eq('campaign_id', campaignID)
        .order('updated_at', { ascending: false })
        .then(({ data, error: e }) => {
          if (cancelled) return
          if (e) setError(e.message)
          else {
            setError(null)
            setViews((data as { encounter_id: string; data: PlayerView; updated_at: string }[]).map((r) => ({ encounterID: r.encounter_id, data: r.data, updatedAt: r.updated_at })))
          }
        })
    load()
    const stop = subscribeRows('encounter_view', uuidFilter('campaign_id', campaignID), load)
    // O mestre tirou a vista: o DELETE não passa pelo filtro de coluna; vem só com o id.
    const stopDeletes = subscribeRows('encounter_view', '', (change) => change.event === 'DELETE' && load())
    return () => {
      cancelled = true
      stop()
      stopDeletes()
    }
  }, [campaignID])
  return { views, error }
}
