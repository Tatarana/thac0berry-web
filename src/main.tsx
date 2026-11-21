import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadRaces } from './data/races.ts'

const root = createRoot(document.getElementById('root')!)

// As regras de raça são síncronas e leem do registro de raceKit.ts: as raças
// (races.json) são carregadas antes do primeiro render.
loadRaces()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    console.error(error)
    root.render(<p style={{ padding: '2rem' }}>Could not load the game data. Check your connection and reload the page.</p>)
  })
