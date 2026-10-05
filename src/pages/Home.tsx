import { Link } from 'react-router'
import { HomeTile } from '../components/HomeTile'

export function Home() {
  const base = import.meta.env.BASE_URL
  return (
    // Como no HomeView do iPad: título no alto; um espaço flexível empurra a
    // linha de latão e as 3 caixas para a parte de baixo da tela.
    <div className="page home-page">
      <img className="home-badge" src={`${base}images/main_badge.png`} alt="" />
      <div className="home-header">
        <div>
          <div className="smallcaps">Advanced Dungeons &amp; Dragons · 2nd Edition</div>
          <h1 className="title-hand">THAC0berry</h1>
        </div>
        <Link to="/settings" className="gear" aria-label="Settings" title="Settings">
          <img src={`${base}images/icon_settings.png`} alt="" />
        </Link>
      </div>
      <div className="home-spacer" />
      <hr className="divider" />
      <div className="tile-grid">
        <HomeTile to="/campaigns" image="icon_campaigns" title="Campaigns" subtitle="Coming soon" accent="var(--amber)" />
        <HomeTile to="/characters" image="icon_characters" title="Characters" subtitle="Coming soon" accent="var(--crimson)" />
        <HomeTile to="/compendium" image="icon_compendium" title="Compendium" subtitle="Grimoires & references" accent="var(--teal)" />
      </div>
    </div>
  )
}
