import { HashRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { CampaignDetail } from './pages/CampaignDetail'
import { Campaigns } from './pages/Campaigns'
import { Characters } from './pages/Characters'
import { CharacterSheet } from './pages/CharacterSheet'
import { CompendiumHub } from './pages/CompendiumHub'
import { DeityCompendium } from './pages/DeityCompendium'
import { ComingSoon } from './pages/ComingSoon'
import { Diagnostics } from './pages/Diagnostics'
import { ArmorCompendium, EquipmentCompendium, WeaponCompendium } from './pages/GearCompendiums'
import { Grimoire } from './pages/Grimoire'
import { Home } from './pages/Home'
import { ImportBackup } from './pages/ImportBackup'
import { ProficiencyCompendium } from './pages/ProficiencyCompendium'
import { KitCompendium } from './pages/KitCompendium'
import { MagicItemCompendium } from './pages/MagicItemCompendium'
import { PsionicCompendium } from './pages/PsionicCompendium'
import { RulesCompendium } from './pages/RulesCompendium'
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
          <Route path="/compendium" element={<CompendiumHub />} />
          <Route path="/compendium/priest" element={<Grimoire key="divine" caster="divine" />} />
          <Route path="/compendium/mage" element={<Grimoire key="arcane" caster="arcane" />} />
          <Route path="/compendium/kits/priest" element={<KitCompendium key="Priest" group="Priest" />} />
          <Route path="/compendium/kits/wizard" element={<KitCompendium key="Wizard" group="Wizard" />} />
          <Route path="/compendium/kits/warrior" element={<KitCompendium key="Warrior" group="Warrior" />} />
          <Route path="/compendium/kits/rogue" element={<KitCompendium key="Rogue" group="Rogue" />} />
          <Route path="/compendium/deities" element={<DeityCompendium />} />
          <Route path="/compendium/proficiencies" element={<ProficiencyCompendium />} />
          <Route path="/compendium/rules" element={<RulesCompendium />} />
          <Route path="/compendium/magic-items" element={<MagicItemCompendium />} />
          <Route path="/compendium/psionics" element={<PsionicCompendium />} />
          <Route path="/compendium/weapons" element={<WeaponCompendium />} />
          <Route path="/compendium/armor" element={<ArmorCompendium />} />
          <Route path="/compendium/equipment" element={<EquipmentCompendium />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterSheet />} />
          <Route path="/import" element={<ImportBackup />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="*" element={<ComingSoon title="Not found" note="This page does not exist." />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
