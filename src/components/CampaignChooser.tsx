import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { oneShot, setActiveCampaign, useActiveCampaign, type ActiveCampaign } from '../lib/activeCampaign'
import { useCampaigns } from '../lib/campaignCharacters'
import { readCombatStore } from '../lib/combatStore'
import { encounterInProgress } from '../rules/combat'
import { useMode } from '../lib/mode'
import { PaperModal } from './DetailBits'
import { ModeSwitch } from './ModeChooser'

// Campanha ativa do modo DM (docs/campanha-ativa.md): a escolha ("Which
// campaign are you running?"), o chip do topo que troca e a verificação de que
// a campanha guardada ainda existe.

/** A lista para escolher: campanhas da conta (arquivadas recolhidas) e o One-shot. */
export function CampaignPicker({ onChosen }: { onChosen?: (campaign: ActiveCampaign) => void }) {
  const { signedIn, campaigns, error } = useCampaigns()
  const active = useActiveCampaign()
  const [showArchived, setShowArchived] = useState(false)
  const choose = (campaign: ActiveCampaign) => {
    // Encontro começado na campanha que fica para trás: ele continua lá; só avisa (CA2).
    const running = active && active.id !== campaign.id ? encounterInProgress(readCombatStore().encounters, active.id) : null
    if (running && !window.confirm(`“${running.name}” is still in progress in ${active?.id === null ? 'the one-shot' : active?.name}. It stays there for when you come back. Switch anyway?`)) return
    setActiveCampaign(campaign)
    onChosen?.(campaign)
  }
  const open = (campaigns ?? []).filter((c) => !c.is_archived)
  const archived = (campaigns ?? []).filter((c) => c.is_archived)
  const row = (c: ActiveCampaign, note?: string) => (
    <li key={c.id ?? 'one-shot'}>
      <button className={active && active.id === c.id ? 'campaign-choice campaign-choice-on' : 'campaign-choice'} aria-pressed={!!active && active.id === c.id} onClick={() => choose(c)}>
        <span className="campaign-choice-name">{c.id === null ? 'One-shot (no campaign)' : c.name || 'Unnamed campaign'}</span>
        {active && active.id === c.id ? <span className="campaign-choice-note">current</span> : note ? <span className="campaign-choice-note">{note}</span> : null}
      </button>
    </li>
  )
  return (
    <div className="campaign-picker">
      {error && <p className="paper-soft save-error">Could not load your campaigns: {error}</p>}
      {!signedIn && <p className="paper-soft">Sign in to run one of your campaigns; without signing in you can run a one-shot.</p>}
      {signedIn && !campaigns && !error && <p className="paper-soft">Loading your campaigns…</p>}
      <ul className="campaign-choices">
        {open.map((c) => row({ id: c.id, name: c.name }))}
        {row(oneShot, 'a game without a campaign')}
      </ul>
      {archived.length > 0 && (
        <>
          <button className="paper-link" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'hide archived campaigns' : `archived campaigns (${archived.length})`}
          </button>
          {showArchived && <ul className="campaign-choices">{archived.map((c) => row({ id: c.id, name: c.name }, 'archived'))}</ul>}
        </>
      )}
      {signedIn && campaigns && campaigns.length === 0 && (
        <p className="paper-soft">
          No campaigns yet. <Link to="/campaigns">Create one</Link>, or run a one-shot.
        </p>
      )}
    </div>
  )
}

/** Tela da primeira escolha (modo DM sem campanha ativa). */
export function CampaignChooserPage() {
  return (
    <div className="paper-page">
      <div className="paper-sheet campaign-chooser">
        {/* O topo leva ao modo (a Home, no modo DM, volta a esta escolha). */}
        <div className="paper-top paper-top-end">
          <ModeSwitch />
        </div>
        <h1 className="paper-title">Which campaign are you running?</h1>
        <p className="paper-soft">Everything you do as the Dungeon Master goes to this campaign until you change it with the campaign button at the top.</p>
        <CampaignPicker />
      </div>
    </div>
  )
}

/** Chip do topo (só no modo DM): a campanha ativa; um toque abre a troca. */
export function CampaignSwitch() {
  const mode = useMode()
  const active = useActiveCampaign()
  const [open, setOpen] = useState(false)
  if (mode !== 'dm') return null
  return (
    <>
      <button className="mode-button campaign-button" title="Change campaign" aria-label={`Campaign: ${active?.name ?? 'none'}. Change campaign`} onClick={() => setOpen(true)}>
        <span aria-hidden="true">⚔</span>
        <span className="campaign-button-name">{active ? (active.id === null ? 'One-shot' : active.name || 'Unnamed campaign') : 'Choose a campaign'}</span>
        <span className="mode-button-arrows" aria-hidden="true">▾</span>
      </button>
      {open &&
        createPortal(
          <PaperModal title="Which campaign are you running?" subtitle="Everything you do as the DM goes to this campaign" onClose={() => setOpen(false)}>
            <CampaignPicker onChosen={() => setOpen(false)} />
          </PaperModal>,
          document.body,
        )}
    </>
  )
}

/** No topo do DM Tools: a campanha que o DM está conduzindo e os atalhos dela. */
export function ActiveCampaignCard() {
  const active = useActiveCampaign()
  if (!active) return null
  return (
    <section className="ember-card active-campaign">
      <div className="smallcaps">Running</div>
      <div className="active-campaign-name">{active.id === null ? 'One-shot (no campaign)' : active.name || 'Unnamed campaign'}</div>
      <div className="btn-row">
        {active.id && (
          <Link className="btn" to={`/campaigns/${active.id}`}>
            Sessions & cast
          </Link>
        )}
        <Link className="btn" to="/dm/combat">
          Combat Tracker
        </Link>
        <CampaignSwitch />
      </div>
    </section>
  )
}
