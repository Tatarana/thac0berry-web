import { useEffect, useState } from 'react'
import { subscribeRows, uuidFilter } from './realtime'

// Pulso da campanha (Fase 3, R2, 2026-10-14; backend `campaign_pulse`): uma
// linha por campanha com a hora da última mudança (a campanha, uma ficha, uma
// folha, uma sessão, um membro, um acesso temporário). Só os membros o leem, e
// ele não leva dado nenhum: a página relê o que mostra.

/** Espera a calma antes de recarregar: quem digita grava a cada segundo. */
const QUIET_MS = 1000

/**
 * Um número que sobe a cada mudança da campanha feita em outro lugar (ou
 * aqui mesmo: recarregar o que acabou de gravar não faz mal). 0 = ainda nada.
 */
export function useCampaignPulse(campaignID: string | undefined, userID: string | null): number {
  const [live, setLive] = useState(0)
  useEffect(() => {
    if (!campaignID || !userID) return
    let timer: number | null = null
    const unsubscribe = subscribeRows('campaign_pulse', uuidFilter('campaign_id', campaignID), () => {
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = null
        setLive((v) => v + 1)
      }, QUIET_MS)
    })
    return () => {
      if (timer !== null) window.clearTimeout(timer)
      unsubscribe()
    }
  }, [campaignID, userID])
  return live
}
