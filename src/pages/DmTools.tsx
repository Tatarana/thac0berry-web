import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { ActiveCampaignCard } from '../components/CampaignChooser'
import { DmOnly } from '../components/DmOnly'
import { PageHeader } from '../components/PageHeader'

interface ToolEntry {
  title: string
  subtitle: string
  to: string
  image?: string
  accent: string
}

// Ferramentas do DM (2026-10-07): o catálogo de monstros é a primeira; o
// Table Grimoire (2026-10-08) a segunda; o Combat Tracker (2026-10-09) a
// terceira; as
// próximas (encontros, combate) entram aqui. Sem `image` = ainda sem arte (✦).
// Medalhões de Monsters (2026-10-07) e Table Grimoire (2026-10-09): arte do usuário.
const tools: ToolEntry[] = [
  { title: 'Monsters', subtitle: '2,386 monsters · Monstrous Manual, Annuals & settings', to: '/dm/monsters', image: 'icon_monsters', accent: 'var(--crimson)' },
  { title: 'Table Grimoire', subtitle: '512 tables · DMG, PHB, Complete Handbooks & Dark Sun', to: '/dm/tables', image: 'icon_table_grimoire', accent: 'var(--brass)' },
  { title: 'Combat Tracker', subtitle: 'Party and foes, hit points, conditions · kept on this device', to: '/dm/combat', image: 'icon_combat_tracker', accent: 'var(--crimson)' },
]

export function DmTools() {
  return (
    <DmOnly>
      <div className="page">
        <PageHeader title="DM Tools" />
        <ActiveCampaignCard />
        <div className="hub-grid">
          {tools.map((tool) => (
            <Link key={tool.title} to={tool.to} className="ember-card hub-row" style={{ '--accent': tool.accent } as CSSProperties}>
              {tool.image ? (
                <img src={`${import.meta.env.BASE_URL}images/${tool.image}.png`} alt="" />
              ) : (
                <span className="hub-icon-placeholder" aria-hidden="true">
                  ✦
                </span>
              )}
              <div>
                <div className="hub-title">{tool.title}</div>
                <p className="soft">{tool.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DmOnly>
  )
}
