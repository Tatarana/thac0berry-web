import { useSearchParams } from 'react-router'

// Voltar ao Shield (docs/dm-shield.md, PS3): os links que o Shield abre levam
// de onde vieram ("back", a URL do Shield na tela que o mestre estava); as
// telas que podem ser abertas a partir dele usam isso no botão de voltar, em
// vez do destino de sempre, pra não fazer o mestre navegar de novo.

/** A query string a anexar num link que sai do Shield. */
export function shieldBackLink(screen: number): string {
  return `back=${encodeURIComponent(`/dm/shield?screen=${screen}`)}`
}

/** O destino (e rótulo) do botão "voltar": o `back` da URL, ou o padrão da tela. */
export function useBackTo(defaultTo: string, defaultLabel: string): { to: string; label: string } {
  const [params] = useSearchParams()
  const back = params.get('back')
  if (!back) return { to: defaultTo, label: defaultLabel }
  const to = decodeURIComponent(back)
  return { to, label: to.startsWith('/dm/shield') ? 'Shield' : defaultLabel }
}
