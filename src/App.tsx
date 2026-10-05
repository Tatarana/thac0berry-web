import { HashRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { ComingSoon } from './pages/ComingSoon'
import { Diagnostics } from './pages/Diagnostics'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'

// HashRouter: o GitHub Pages só serve arquivos estáticos; com rotas em "#/…"
// qualquer recarga de página continua funcionando.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/compendium" element={<ComingSoon title="Compendium" note="Grimoires, kits, rules and items arrive in the next step (W1)." />} />
          <Route path="/characters" element={<ComingSoon title="Characters" note="Character sheets synced with your account arrive in step W2." />} />
          <Route path="/campaigns" element={<ComingSoon title="Campaigns" note="Campaigns, sessions and the notebook arrive after the characters." />} />
          <Route path="*" element={<ComingSoon title="Not found" note="This page does not exist." />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
