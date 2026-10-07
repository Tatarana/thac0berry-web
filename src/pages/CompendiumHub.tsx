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

// Mesmos itens e textos do CompendiumHubView do iPad. Sem `image` = ainda sem
// arte própria (aparece ✦). Medalhões dos kits e de Psionic Powers: arte nova
// do usuário (2026-10-06), só na web por enquanto.
const entries: HubEntry[] = [
  { title: 'Priest Grimoire', subtitle: '1,795 spells · search, spheres, settings', to: '/compendium/priest', image: 'icon_priest_grimoire', accent: 'var(--amber)' },
  { title: 'Mage Grimoire', subtitle: '2,608 spells · search, schools, settings', to: '/compendium/mage', image: 'icon_mage_grimoire', accent: 'var(--teal)' },
  { title: 'Priest Kits', subtitle: '90 kits · origins & specialty priests', to: '/compendium/kits/priest', image: 'icon_priest_kits', accent: 'var(--amber)' },
  { title: 'Wizard Kits', subtitle: "41 kits · Complete Wizard's Handbook & Tome of Magic", to: '/compendium/kits/wizard', image: 'icon_wizard_kits', accent: 'var(--teal)' },
  { title: 'Warrior Kits', subtitle: '114 kits · Fighter, Paladin, Ranger & Barbarian', to: '/compendium/kits/warrior', image: 'icon_warrior_kits', accent: 'var(--crimson)' },
  { title: 'Rogue Kits', subtitle: '73 kits · Thief, Bard & Ninja', to: '/compendium/kits/rogue', image: 'icon_rogue_kits', accent: 'var(--mint-glow)' },
  { title: 'Psionicist Kits', subtitle: '33 kits · The Will and the Way & Dragon Magazine', to: '/compendium/kits/psionicist', image: 'icon_psionicist_kits', accent: 'var(--teal)' },
  { title: 'Deities', subtitle: '79 deities · Faiths & Avatars, Powers & Pantheons', to: '/compendium/deities', image: 'icon_deities', accent: 'var(--brass)' },
  { title: 'Rules Reference', subtitle: '888 rules · PHB, DMG, 8 Complete Handbooks & Psionics', to: '/compendium/rules', image: 'icon_rules_reference', accent: 'var(--brass)' },
  { title: 'Proficiencies', subtitle: '372 proficiencies · general, class & racial', to: '/compendium/proficiencies', image: 'icon_proficiencies', accent: 'var(--teal)' },
  { title: 'Weapons', subtitle: '75 weapons · PHB & CPrH', to: '/compendium/weapons', image: 'icon_weapons', accent: 'var(--crimson)' },
  { title: 'Armor', subtitle: '20 items · armor, helmets & shields', to: '/compendium/armor', image: 'icon_armor', accent: 'var(--brass)' },
  { title: 'Equipment', subtitle: '183 items · gear, clothing, food & more', to: '/compendium/equipment', image: 'icon_equipment', accent: 'var(--amber)' },
  { title: 'Magic Items', subtitle: '5,669 items · full corpus, filter by source', to: '/compendium/magic-items', image: 'icon_magic_items', accent: 'var(--glow)' },
  { title: 'Psionic Powers', subtitle: '257 powers · 6 disciplines, Complete Psionics Handbook', to: '/compendium/psionics', image: 'icon_psionic_powers', accent: 'var(--teal)' },
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
