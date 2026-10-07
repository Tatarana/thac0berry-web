import { modeLabels, setMode, useMode, type AppMode } from '../lib/mode'

// Escolha do modo (Jogador ou Mestre), pedida uma vez por aparelho depois do
// login, e o seletor do topo que troca o modo a qualquer momento.

const art: Record<AppMode, { image: string; position: string }> = {
  player: { image: 'mode_player.jpg', position: '50% 40%' },
  dm: { image: 'mode_dm.jpg', position: '50% 18%' },
}

export function ModeChooser() {
  const base = import.meta.env.BASE_URL
  return (
    <div className="mode-chooser">
      <div className="smallcaps">Advanced Dungeons &amp; Dragons · 2nd Edition</div>
      <h1 className="title-hand mode-question">How are you playing today?</h1>
      <p className="soft">You can switch any time from the top of the screen.</p>
      <div className="mode-cards">
        {(['player', 'dm'] as const).map((mode) => (
          <button key={mode} className={`mode-card mode-card-${mode}`} onClick={() => setMode(mode)}>
            <span
              className="mode-card-art"
              style={{ backgroundImage: `url(${base}images/${art[mode].image})`, backgroundPosition: art[mode].position }}
              aria-hidden="true"
            />
            <span className="mode-card-shade" aria-hidden="true" />
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

/** Seletor "Player ⇄ DM" do topo. Não aparece antes da primeira escolha. */
export function ModeSwitch() {
  const mode = useMode()
  if (!mode) return null
  return (
    <div className="mode-switch" role="group" aria-label="App mode">
      {(['player', 'dm'] as const).map((m) => (
        <button key={m} className={m === mode ? 'mode-switch-on' : ''} aria-pressed={m === mode} onClick={() => setMode(m)}>
          {modeLabels[m].short}
        </button>
      ))}
    </div>
  )
}
