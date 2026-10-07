import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { DmOnly } from '../components/DmOnly'
import { PageHeader } from '../components/PageHeader'

interface ToolEntry {
  title: string
  subtitle: string
  to: string
  accent: string
}

// Ferramentas do DM (2026-10-07): o catálogo de monstros é a primeira; as
// próximas (encontros, combate) entram aqui. Sem arte ainda (✦), como os
// itens do compêndio sem imagem.
const tools: ToolEntry[] = [
  { title: 'Monsters', subtitle: '2,386 monsters · Monstrous Manual, Annuals & settings', to: '/dm/monsters', accent: 'var(--crimson)' },
]

export function DmTools() {
  return (
    <DmOnly>
      <div className="page">
        <PageHeader title="DM Tools" />
        <div className="hub-grid">
          {tools.map((tool) => (
            <Link key={tool.title} to={tool.to} className="ember-card hub-row" style={{ '--accent': tool.accent } as CSSProperties}>
              <span className="hub-icon-placeholder" aria-hidden="true">
                ✦
              </span>
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
