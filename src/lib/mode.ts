import { useSyncExternalStore } from 'react'

// Modo de uso do app (2026-10-07, decisão do usuário): Jogador ou Mestre.
// É só uma "lente" sobre o que aparece; quem pode o quê em cada campanha
// continua definido pelo papel na campanha (backend). Escolhido uma vez por
// aparelho, no primeiro acesso depois do login; depois só pelo seletor do topo.
// Fica no localStorage do aparelho (o iPad da mesa pode estar em DM e o
// celular em Jogador).

export type AppMode = 'player' | 'dm'

const KEY = 'thac0berry.mode'
const EVENT = 'thac0berry-mode'

function read(): AppMode | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'player' || value === 'dm' ? value : null
  } catch {
    return null
  }
}

export function setMode(mode: AppMode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Sem armazenamento (aba anônima etc.): vale só até fechar a página.
    memory = mode
  }
  window.dispatchEvent(new Event(EVENT))
}

let memory: AppMode | null = null

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Modo atual deste aparelho; null = ainda não escolhido. */
export function useMode(): AppMode | null {
  return useSyncExternalStore(subscribe, () => read() ?? memory)
}

export const modeLabels: Record<AppMode, { title: string; short: string; blurb: string }> = {
  player: { title: 'Player', short: 'Player', blurb: 'Your characters, sheets and notebook — ready for the table.' },
  dm: { title: 'Dungeon Master', short: 'DM', blurb: 'Your campaigns, the party and the sessions you run.' },
}
