import { useState } from 'react'
import { campaignSettings, settingLogo } from '../lib/campaigns'
import { settingUnderConstruction } from '../rules/campaignFilter'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote } from './ForgeParts'

// Etapa 1 do The Forge: os cenários da mesa. Os emblemas (os mesmos do "Campaign
// Settings" da campanha, pintados de latão) são o herói da tela. Valem para raças,
// classes, kits, proficiências e magias das etapas seguintes. Vários podem ser
// escolhidos (aventura entre mundos); nenhum = todos os mundos. Cenários ainda sem
// conteúdo (settingUnderConstruction) aparecem apagados e não se escolhem.

export function ForgeSettingStep({ settings, onChange, onNext }: { settings: string[]; onChange: (next: string[]) => void; onNext: () => void }) {
  const [help, setHelp] = useState(false)
  const toggle = (setting: string) => onChange(settings.includes(setting) ? settings.filter((s) => s !== setting) : [...settings, setting])
  const nav = { onNext, nextLabel: 'Next: Ability Scores →', ready: true }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 1</p>
      <h2 className="forge-title">
        Choose Your World
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Every tale begins somewhere. Pick the world your table plays in — or several, for a journey across worlds.</p>
      {help && (
        <ForgeHelpNote>
          The core rules are always open. The worlds you light up add their own kindreds, callings, kits, proficiencies and spells to the steps
          that follow; tap a world again to put it out. You can pick more than one for a cross-world adventure, or none to leave every world
          open. Worlds marked &ldquo;Under construction&rdquo; are not ready yet. You can come back here at any step.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <p className="forge-panel-label forge-worlds-label">{settings.length === 0 ? 'All worlds' : `Core rules + ${settings.join(' + ')}`}</p>
      <div className="forge-worlds-stage" role="group" aria-label="Campaign settings">
        {campaignSettings.map((setting) => {
          const building = settingUnderConstruction(setting)
          const on = !building && settings.includes(setting)
          const logo = `url(${settingLogo(setting)})`
          const cls = ['forge-world-big', on ? 'forge-world-big-on' : '', building ? 'forge-world-big-building' : ''].filter(Boolean).join(' ')
          return (
            <button
              key={setting}
              type="button"
              className={cls}
              aria-pressed={on}
              aria-disabled={building || undefined}
              disabled={building}
              title={building ? `${setting}: under construction` : undefined}
              onClick={() => toggle(setting)}
            >
              <span className="forge-world-big-emblem" style={{ maskImage: logo, WebkitMaskImage: logo }} />
              <span className="forge-world-big-name">{setting}</span>
              {building && <span className="forge-world-big-tag">Under construction</span>}
            </button>
          )
        })}
      </div>
      {settings.length > 0 && (
        <button type="button" className="forge-help-rule forge-worlds-clear" onClick={() => onChange([])}>
          Show all worlds
        </button>
      )}

      <ForgeFooter {...nav} />
    </section>
  )
}
