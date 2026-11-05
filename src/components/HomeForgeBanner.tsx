import { useState } from 'react'
import { Link } from 'react-router'
import { forgeImage } from '../lib/forgeImages'
import { forgeCombos, pickHeroes } from '../rules/forgeCombos'
import { ForgeImage } from './ForgeParts'

// A porta do The Forge na Home do jogador: três heróis sorteados a cada visita.
export function HomeForgeBanner({ signedIn }: { signedIn: boolean }) {
  const [heroes] = useState(() => pickHeroes(forgeCombos(), 3, Math.random))
  return (
    <Link to="/characters/forge" className="hf-banner">
      <span className="hf-heroes" aria-hidden="true">
        {heroes.map((hero) => (
          <span key={hero.name} className="hf-hero">
            <ForgeImage images={forgeImage(hero.name)} alt="" compact />
          </span>
        ))}
      </span>
      <span className="hf-words">
        <span className="hf-kicker">The Forge</span>
        <span className="hf-title">Forge a new hero</span>
        <span className="hf-line">{signedIn ? 'Roll the bones, choose a path and walk out ready for the table.' : 'Build one now. Sign in when your hero is ready to be sealed.'}</span>
        <span className="hf-go">Enter the Forge →</span>
      </span>
    </Link>
  )
}
