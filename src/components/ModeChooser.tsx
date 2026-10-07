import { Link, useLocation } from 'react-router'
import { modeLabels, setMode, useMode, type AppMode } from '../lib/mode'

// Escolha do modo (Jogador ou Mestre): pedida uma vez por aparelho depois do
// login e reaberta pelo botão do topo (decisão do usuário, 2026-10-07: um
// botão que leva à tela com as imagens, no lugar de um seletor).

const art: Record<AppMode, { image: string; position: string }> = {
  player: { image: 'mode_player.jpg', position: '50% 40%' },
  dm: { image: 'mode_dm.jpg', position: '50% 18%' },
}

/** A tela das duas imagens. `onChosen` roda depois de gravar a escolha. */
export function ModeChooser({ onChosen }: { onChosen?: () => void }) {
  const base = import.meta.env.BASE_URL
  const current = useMode()
  return (
    <div className="mode-chooser">
      <div className="smallcaps">Advanced Dungeons &amp; Dragons · 2nd Edition</div>
      <h1 className="title-hand mode-question">How are you playing today?</h1>
      <p className="soft">You can change this any time with the mode button at the top of the screen.</p>
      <div className="mode-cards">
        {(['player', 'dm'] as const).map((mode) => (
          <button
            key={mode}
            className={`mode-card mode-card-${mode}${current === mode ? ' mode-card-current' : ''}`}
            aria-pressed={current === mode}
            onClick={() => {
              setMode(mode)
              onChosen?.()
            }}
          >
            <span
              className="mode-card-art"
              style={{ backgroundImage: `url(${base}images/${art[mode].image})`, backgroundPosition: art[mode].position }}
              aria-hidden="true"
            />
            <span className="mode-card-shade" aria-hidden="true" />
            {current === mode && <span className="mode-card-badge">Current mode</span>}
            <span className="mode-card-text">
              <span className="mode-card-kicker">{mode === 'player' ? 'Play as a' : 'Play as the'}</span>
              <span className="mode-card-title">{modeLabels[mode].title}</span>
              <span className="mode-card-blurb">{modeLabels[mode].blurb}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Botão do topo: mostra o modo atual e abre a tela de escolha. */
export function ModeSwitch() {
  const mode = useMode()
  const location = useLocation()
  if (!mode) return null
  return (
    <Link
      to="/mode"
      state={{ from: location.pathname + location.search }}
      className="mode-button"
      title="Change mode"
      aria-label={`Mode: ${modeLabels[mode].title}. Change mode`}
    >
      <span className={`mode-button-dot mode-button-dot-${mode}`} aria-hidden="true" />
      {modeLabels[mode].short}
      <span className="mode-button-arrows" aria-hidden="true">⇄</span>
    </Link>
  )
}
