import { supabase } from './supabase'

// Avisos ao vivo do banco (Fase 3 do backend: Realtime do Supabase, que respeita o
// RLS — cada um só é avisado das linhas que já pode ler). O aviso só diz que uma
// linha mudou; quem assina relê pela API, como no carregamento.

export interface RowChange {
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  /** Colunas da linha nova (vazias num DELETE). */
  row: Record<string, unknown>
}

let counter = 0

/**
 * Assina as mudanças de uma tabela, com um filtro do Realtime ("id=eq.<uuid>",
 * "character_id=eq.<uuid>"; vazio = sem filtro — o Realtime não filtra DELETE
 * por coluna). Devolve a função que cancela a assinatura.
 */
export function subscribeRows(table: string, filter: string, onChange: (change: RowChange) => void): () => void {
  // Nome único: o supabase-js reaproveita canais de mesmo nome.
  const channel = supabase
    .channel(`${table}:${filter}:${++counter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, (payload) => {
      onChange({ event: payload.eventType, row: (payload.new ?? {}) as Record<string, unknown> })
    })
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}

/** O Postgres manda o uuid em minúsculas; o filtro também (o app grava ids em maiúsculas). */
export const uuidFilter = (column: string, id: string) => `${column}=eq.${id.toLowerCase()}`
