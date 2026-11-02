import { useState } from 'react'
import { matchRace, raceForGender, replaceRace } from '../rules/raceKit'
import type { PlayerCharacter } from '../types/library'
import { forgeImage, genderOf, type Gender } from '../lib/forgeImages'
import { ForgeCard, ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote } from './ForgeParts'

// Etapa 2 do The Forge, fiel ao protótipo aprovado (NameGender.dc.html):
// dois cards ilustrados para o gênero (AD&D 2e: masculino ou feminino; grava
// "Male"/"Female" em `sex`) e o nome entalhado numa faixa, com um dado que
// sugere nomes. Vem antes de raça/classe porque alguns kits são de um gênero
// só (gap: nenhum kit tem esse campo em thac0berry-data ainda).

const genders: { key: Gender; label: string; image: string; alt: string }[] = [
  { key: 'male', label: 'Male', image: 'gender-male', alt: 'A young male adventurer walking out of a town gate' },
  { key: 'female', label: 'Female', image: 'gender-female', alt: 'A young female adventurer walking out of a town gate' },
]

const suggestions: Record<Gender | 'any', string[]> = {
  male: ['Aldric', 'Thorvald', 'Corwin', 'Brannoc', 'Garrick', 'Ulfric', 'Tobin', 'Emeric'],
  female: ['Isolde', 'Maelis', 'Brynja', 'Seraphine', 'Ysolde', 'Rowena', 'Kestra', 'Aveline'],
  any: ['Wren', 'Ash', 'Rook', 'Sable', 'Morrow', 'Quill', 'Ember', 'Vesper'],
}

export function ForgeIdentityStep({
  draft,
  mutate,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onNext: () => void
  onBack: () => void
}) {
  const [help, setHelp] = useState(false)
  const gender = genderOf(draft.sex)
  const named = draft.name.trim() !== ''

  // Raça de um sexo só (Bariaur) acompanha a troca de sexo.
  const pick = (next: Gender) =>
    mutate((c) => {
      c.sex = next === 'male' ? 'Male' : 'Female'
      const race = matchRace(c.race)
      if (race && raceForGender(race, next) !== race) replaceRace(c, raceForGender(race, next))
    })

  const suggest = () => {
    const pool = suggestions[gender ?? 'any'].filter((n) => n !== draft.name)
    const name = pool[Math.floor(Math.random() * pool.length)]
    mutate((c) => { c.name = name })
  }

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext, nextLabel: 'Next: Race →', ready: !!gender && named }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 2</p>
      <h2 className="forge-title">
        Who Steps Out of the Forge?
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Choose your hero, then carve a name into the banner.</p>
      {help && (
        <ForgeHelpNote>
          Gender has no effect on the dice in AD&amp;D 2nd Edition, but a few kits are open to only one — the Forge will point that out when you choose
          a kit, never stop you. The name can be changed on the sheet at any time; the die suggests one if you&rsquo;re stuck.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <div className="hero-row" role="group" aria-label="Gender">
        {genders.map(({ key, label, image, alt }) => (
          <ForgeCard
            key={key}
            size="hero"
            image={forgeImage(image)}
            alt={alt}
            label={label}
            chosen={gender === key}
            dimmed={!!gender && gender !== key}
            onClick={() => pick(key)}
          />
        ))}
      </div>

      <div className="naming">
        <div className={named ? 'name-ribbon name-ribbon-filled' : 'name-ribbon'}>
          <input
            className="name-ribbon-input"
            placeholder="Carve a name…"
            aria-label="Character name"
            value={draft.name}
            onChange={(event) => mutate((c) => { c.name = event.target.value })}
          />
        </div>
        <button type="button" className="roll-button roll-button-small" onClick={suggest} aria-label="Suggest a name">
          <svg className="roll-die" viewBox="0 0 64 64" aria-hidden="true">
            <polygon points="32,3 58,19 58,47 32,61 6,47 6,19" fill="none" stroke="currentColor" strokeWidth={3} />
            <polygon points="32,3 58,19 32,33 6,19" fill="currentColor" opacity={0.18} />
            <line x1="32" y1="33" x2="32" y2="61" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
            <line x1="32" y1="33" x2="58" y2="19" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
            <line x1="32" y1="33" x2="6" y2="19" stroke="currentColor" strokeWidth={1.6} opacity={0.4} />
          </svg>
          <span className="roll-text">Suggest</span>
        </button>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
