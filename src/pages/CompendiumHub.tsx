import { Link } from 'react-router'
import type { CSSProperties } from 'react'
import { PageHeader } from '../components/PageHeader'

interface HubEntry {
  title: string
  subtitle: string
  to?: string
  image?: string
  accent: string
}

// Mesmos itens e textos do CompendiumHubView do iPad. Sem `to` = ainda não
// existe na web (entra nas próximas partes da W1).
const entries: HubEntry[] = [
  { title: 'Priest Grimoire', subtitle: '1,795 spells · search, spheres, settings', to: '/compendium/priest', image: 'icon_priest_grimoire', accent: 'var(--amber)' },
  { title: 'Mage Grimoire', subtitle: '2,608 spells · search, schools, settings', to: '/compendium/mage', image: 'icon_mage_grimoire', accent: 'var(--teal)' },
  { title: 'Priest Kits', subtitle: '91 kits · origins & specialty priests', to: '/compendium/kits/priest', image: 'icon_priest_kits', accent: 'var(--amber)' },
  { title: 'Wizard Kits', subtitle: "41 kits · Complete Wizard's Handbook & Tome of Magic", to: '/compendium/kits/wizard', accent: 'var(--teal)' },
  { title: 'Warrior Kits', subtitle: '114 kits · Fighter, Paladin, Ranger & Barbarian', to: '/compendium/kits/warrior', accent: 'var(--crimson)' },
  { title: 'Rogue Kits', subtitle: '73 kits · Thief, Bard & Ninja', to: '/compendium/kits/rogue', accent: 'var(--mint-glow)' },
  { title: 'Deities', subtitle: '79 deities · Faiths & Avatars, Powers & Pantheons', to: '/compendium/deities', image: 'icon_deities', accent: 'var(--brass)' },
  { title: 'Rules Reference', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Proficiencies', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Weapons', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Armor', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Equipment', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Magic Items', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
  { title: 'Psionic Powers', subtitle: 'Coming soon', accent: 'var(--brass-dim)' },
]

function HubRow({ entry }: { entry: HubEntry }) {
  const style = { '--accent': entry.accent } as CSSProperties
  const content = (
    <>
      {entry.image ? (
        <img src={`${import.meta.env.BASE_URL}images/${entry.image}.png`} alt="" />
      ) : (
        <span className="hub-icon-placeholder" aria-hidden="true">✦</span>
      )}
      <div>
        <div className="hub-title">{entry.title}</div>
        <p className="soft">{entry.subtitle}</p>
      </div>
    </>
  )
  if (!entry.to) {
    return (
      <div className="ember-card hub-row hub-row-disabled" style={style}>
        {content}
      </div>
    )
  }
  return (
    <Link to={entry.to} className="ember-card hub-row" style={style}>
      {content}
    </Link>
  )
}

export function CompendiumHub() {
  return (
    <div className="page">
      <PageHeader title="Compendium" />
      <div className="hub-grid">
        {entries.map((entry) => (
          <HubRow key={entry.title} entry={entry} />
        ))}
      </div>
    </div>
  )
}
