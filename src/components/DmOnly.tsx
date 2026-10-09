import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useCheckedActiveCampaign } from '../lib/activeCampaign'
import { setMode, useMode } from '../lib/mode'
import { CampaignChooserPage } from './CampaignChooser'

// Ferramentas do DM só aparecem no modo DM (decisão do usuário, 2026-10-07).
// É só tela: os dados são públicos (estão nos livros); o que não se quer é
// oferecê-los ao jogador dentro do app. Quem chega pelo endereço no modo
// Jogador vê o aviso e o botão para trocar de modo. No modo DM, sem campanha
// ativa, pede a campanha primeiro (docs/campanha-ativa.md).
export function DmOnly({ children }: { children: ReactNode }) {
  const mode = useMode()
  const campaign = useCheckedActiveCampaign()
  if (mode === 'dm') return campaign ? <>{children}</> : <CampaignChooserPage />
  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/" className="paper-link">‹ Home</Link>
        </div>
        <h1 className="paper-title">Dungeon Master tool</h1>
        <p className="paper-soft">This is a Dungeon Master tool. Switch to DM mode to open it.</p>
        <div className="slot-actions dm-only-actions">
          <button className="consequence-apply" onClick={() => setMode('dm')}>
            Switch to DM mode
          </button>
        </div>
      </div>
    </div>
  )
}
