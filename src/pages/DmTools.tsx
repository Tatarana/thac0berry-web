import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { ActiveCampaignCard } from '../components/CampaignChooser'
import { DmOnly } from '../components/DmOnly'
import { PageHeader } from '../components/PageHeader'
import { useActiveCampaign } from '../lib/activeCampaign'
import { fetchCampaignPins, toggleCampaignPin } from '../lib/campaignPins'
import { togglePin, type PinnedItem, type PinKind } from '../rules/pins'

interface ToolEntry {
  title: string
  subtitle: string
  /** Ausente = card desabilitado (ainda sem campanha de verdade). */
  to?: string
  image?: string
  accent: string
}

// Ferramentas do DM (2026-10-07): o catálogo de monstros é a primeira; o
// Table Grimoire (2026-10-08) a segunda; o Combat Tracker (2026-10-09) a
// terceira; o Shield (opção B do DM Shield, 2026-10-18) a quarta. Sem `image`
// = ainda sem arte (✦). Medalhões de Monsters (2026-10-07) e Table Grimoire
// (2026-10-09): arte do usuário.
function toolsFor(hasCampaign: boolean): ToolEntry[] {
  return [
    { title: 'Monsters', subtitle: '2,386 monsters · Monstrous Manual, Annuals & settings', to: '/dm/monsters', image: 'icon_monsters', accent: 'var(--crimson)' },
    { title: 'Table Grimoire', subtitle: '512 tables · DMG, PHB, Complete Handbooks & Dark Sun', to: '/dm/tables', image: 'icon_table_grimoire', accent: 'var(--brass)' },
    { title: 'Combat Tracker', subtitle: 'Party and foes, hit points, conditions · on your account when signed in', to: '/dm/combat', image: 'icon_combat_tracker', accent: 'var(--crimson)' },
    {
      title: 'Shield',
      subtitle: hasCampaign ? 'Group, encounter, pins, notes and cast — 4 screens you flip through' : 'Needs an active campaign (not the One-shot)',
      to: hasCampaign ? '/dm/shield' : undefined,
      accent: 'var(--amber)',
    },
  ]
}

const pinIcon: Record<PinKind, string> = { table: '▦', monster: '🐉', character: '●' }
const pinTo = (item: PinnedItem) =>
  item.kind === 'table' ? `/dm/tables?open=${encodeURIComponent(item.refID)}` : item.kind === 'monster' ? `/dm/monsters?open=${encodeURIComponent(item.refID)}` : `/characters/${item.refID}`

/**
 * "Pinned" (opção A do DM Shield, 2026-10-17): tabelas, monstros e fichas que
 * o mestre fixou na campanha ativa (`campaign.pinned_items`), para achar
 * rápido. Não existe no One-shot (sem linha de campanha).
 */
function PinnedSection({ campaignID }: { campaignID: string }) {
  const [items, setItems] = useState<PinnedItem[] | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let cancelled = false
    void fetchCampaignPins(campaignID).then((loaded) => {
      if (!cancelled) setItems(loaded ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [campaignID, reload])

  if (items === null || items.length === 0) return null

  async function unpin(item: PinnedItem) {
    setItems((current) => (current ? togglePin(current, item) : current))
    await toggleCampaignPin(campaignID, item)
    setReload((v) => v + 1)
  }

  return (
    <div className="ember-card pinned-card">
      <p className="card-title">Pinned</p>
      <div className="chip-row chip-row-scroll">
        {items.map((item) => (
          <span key={`${item.kind}-${item.refID}`} className="chip pinned-chip">
            <Link to={pinTo(item)} title={item.label}>
              {pinIcon[item.kind]} {item.label}
            </Link>
            <button aria-label={`Unpin ${item.label}`} title="Unpin" onClick={() => void unpin(item)}>
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export function DmTools() {
  const active = useActiveCampaign()
  return (
    <DmOnly>
      <div className="page">
        <PageHeader title="DM Tools" />
        <ActiveCampaignCard />
        {active?.id && <PinnedSection campaignID={active.id} />}
        <div className="hub-grid">
          {toolsFor(!!active?.id).map((tool) => {
            const content = (
              <>
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
              </>
            )
            const style = { '--accent': tool.accent } as CSSProperties
            return tool.to ? (
              <Link key={tool.title} to={tool.to} className="ember-card hub-row" style={style}>
                {content}
              </Link>
            ) : (
              <div key={tool.title} className="ember-card hub-row hub-row-disabled" style={style}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </DmOnly>
  )
}
