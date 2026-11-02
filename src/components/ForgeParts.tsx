import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { loadRulesIndex, type RuleIndexEntry } from '../data/rules'
import { campaignSettings, settingLogo } from '../lib/campaigns'
import { BookCode } from './BookCode'
import { RuleDetail } from './RuleDetail'

// Peças repetidas em todas as etapas do The Forge (protótipo: Trail.dc.html /
// Footer.dc.html). Regra de design 4 do docs/criacao-de-personagem.md: uma
// peça só, igual em toda etapa — nunca reestilizar por etapa.

/**
 * Rodapé Back / Next. Sem `onBack`, o Back aparece apagado (primeira etapa).
 * Toda etapa o põe também no topo (`top`), mais compacto.
 */
export function ForgeFooter({ onBack, onNext, nextLabel, ready, top = false }: { onBack?: () => void; onNext: () => void; nextLabel: string; ready: boolean; top?: boolean }) {
  return (
    <div className={top ? 'forge-foot forge-foot-top' : 'forge-foot'}>
      <button type="button" className="forge-ghost-button" disabled={!onBack} onClick={onBack}>
        ← Back
      </button>
      <button type="button" className={ready ? 'forge-next-button forge-next-ready' : 'forge-next-button'} disabled={!ready} onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  )
}

const emberSpots = [
  { left: '12%', delay: '0s' },
  { left: '24%', delay: '1.4s' },
  { left: '40%', delay: '0.6s' },
  { left: '58%', delay: '2.2s' },
  { left: '72%', delay: '0.2s' },
  { left: '85%', delay: '1.8s' },
  { left: '66%', delay: '3s' },
  { left: '30%', delay: '2.6s' },
]

/** Brasas subindo atrás da etapa (o pai precisa ser `.forge-hero`). */
export function ForgeEmbers() {
  return (
    <div className="forge-embers" aria-hidden="true">
      {emberSpots.map((spot) => (
        <span key={spot.left} className="forge-ember" style={{ left: spot.left, animationDelay: spot.delay }} />
      ))}
    </div>
  )
}

/**
 * Ilustração com reserva: tenta as imagens na ordem (ex.: a do gênero, depois
 * a única) e, sem nenhuma ainda, mostra a silhueta de "arte a caminho" — a
 * ilustração entra sozinha quando o arquivo existir.
 */
export function ForgeImage({ images, alt, compact = false }: { images: string | string[]; alt: string; compact?: boolean }) {
  const list = Array.isArray(images) ? images : [images]
  const key = list.join('|')
  const [tried, setTried] = useState({ key, index: 0 })
  const index = tried.key === key ? tried.index : 0
  if (index >= list.length) {
    return (
      <span className="forge-card-noart" aria-hidden="true">
        <svg viewBox="0 0 64 72">
          <circle cx="32" cy="24" r="13" fill="currentColor" />
          <path d="M6 72c0-16 12-27 26-27s26 11 26 27Z" fill="currentColor" />
        </svg>
        {!compact && <span>Art coming</span>}
      </span>
    )
  }
  return <img src={list[index]} alt={alt} onError={() => setTried({ key, index: index + 1 })} />
}

/**
 * Card ilustrado de escolha (gênero, raça, classe): o escolhido sobe e ganha a
 * faixa "Chosen", os outros escurecem.
 */
export function ForgeCard({
  image,
  alt,
  label,
  size = 'tile',
  chosen = false,
  dimmed = false,
  flag,
  onClick,
  children,
}: {
  image: string | string[]
  alt: string
  label: string
  size?: 'hero' | 'tile'
  chosen?: boolean
  dimmed?: boolean
  /** Aviso (não bloqueia): mostra o "!" no canto, com o texto no title. */
  flag?: string
  onClick: () => void
  children?: ReactNode
}) {
  const cls = ['forge-card', `forge-card-${size}`, chosen ? 'forge-card-chosen' : dimmed ? 'forge-card-dimmed' : ''].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-pressed={chosen} onClick={onClick}>
      <ForgeImage images={image} alt={alt} />
      <span className="forge-card-shade" />
      {flag && (
        <span className="forge-card-flag" title={flag}>
          !
        </span>
      )}
      <span className="forge-card-stamp">Chosen</span>
      <span className="forge-card-body">
        <span className="forge-card-name">{label}</span>
        {children}
      </span>
    </button>
  )
}

/**
 * Card de combinação de classes (multiclasse): as ilustrações das classes lado
 * a lado em fatias, no mesmo formato e estados do ForgeCard.
 */
export function ForgeComboCard({
  parts,
  label,
  sub,
  chosen = false,
  dimmed = false,
  onClick,
}: {
  parts: { images: string[]; alt: string }[]
  label: string
  sub?: string
  chosen?: boolean
  dimmed?: boolean
  onClick: () => void
}) {
  const cls = ['forge-card', 'forge-card-tile', 'forge-combo', chosen ? 'forge-card-chosen' : dimmed ? 'forge-card-dimmed' : ''].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-pressed={chosen} onClick={onClick}>
      <span className="forge-combo-slices">
        {parts.map((part) => (
          <span key={part.alt} className="forge-combo-slice">
            <ForgeImage images={part.images} alt={part.alt} compact />
          </span>
        ))}
      </span>
      <span className="forge-card-shade" />
      <span className="forge-card-stamp">Chosen</span>
      <span className="forge-card-body">
        <span className="forge-card-name">{label}</span>
        {sub && <span className="adj-pills"><span className="adj-pill">{sub}</span></span>}
      </span>
    </button>
  )
}

/** Botão pequeno com o retrato da classe (adicionar/tirar classe no multiclasse); sem `onClick`, só mostra. */
export function ForgeThumbButton({ images, label, on = false, onClick }: { images: string[]; label: string; on?: boolean; onClick?: () => void }) {
  const cls = on ? 'forge-thumb forge-thumb-on' : 'forge-thumb'
  const content = (
    <>
      <span className="forge-thumb-face">
        <ForgeImage images={images} alt="" compact />
      </span>
      <span>{label}</span>
    </>
  )
  if (!onClick) return <span className={`${cls} forge-thumb-fixed`}>{content}</span>
  return (
    <button type="button" className={cls} aria-pressed={on} onClick={onClick}>
      {content}
    </button>
  )
}

/**
 * Os cenários da mesa (mesma lista e emblemas do "Campaign Settings" da
 * campanha). Nenhum escolhido = todos os mundos; escolhidos = livros gerais
 * mais eles. Usado igual nas etapas de raça e de classe.
 */
export function ForgeSettingsPicker({ settings, onChange }: { settings: string[]; onChange: (next: string[]) => void }) {
  const toggle = (setting: string) => onChange(settings.includes(setting) ? settings.filter((s) => s !== setting) : [...settings, setting])
  return (
    <div className="forge-worlds">
      <p className="forge-panel-label">{settings.length === 0 ? 'All worlds · tap the ones your table plays in' : `Core rules + ${settings.join(' + ')}`}</p>
      <div className="forge-worlds-row" role="group" aria-label="Campaign settings">
        {campaignSettings.map((setting) => {
          const on = settings.includes(setting)
          const logo = `url(${settingLogo(setting)})`
          return (
            <button key={setting} type="button" className={on ? 'forge-world forge-world-on' : 'forge-world'} aria-pressed={on} onClick={() => toggle(setting)}>
              <span className="forge-world-emblem" style={{ maskImage: logo, WebkitMaskImage: logo }} />
              <span className="forge-world-name">{setting}</span>
            </button>
          )
        })}
      </div>
      {settings.length > 0 && (
        <button type="button" className="forge-help-rule" onClick={() => onChange([])}>
          Show all worlds
        </button>
      )}
    </div>
  )
}

/** O "?" ao lado do título da etapa; abre/fecha a `ForgeHelpNote`. */
export function ForgeHelpButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="forge-help-button" aria-expanded={open} aria-label="Help" onClick={onToggle}>
      ?
    </button>
  )
}

/** Explicação da etapa; com `ruleID`, acrescenta o link para a regra do livro. */
export function ForgeHelpNote({ ruleID, children }: { ruleID?: string; children: ReactNode }) {
  const [entry, setEntry] = useState<RuleIndexEntry | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (!ruleID) return
    let cancelled = false
    loadRulesIndex()
      .then((index) => !cancelled && setEntry(index.find((r) => r.id === ruleID) ?? null))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ruleID])

  return (
    <div className="forge-help-note">
      {children}
      {entry && (
        <>
          {' '}
          <button type="button" className="forge-help-rule" onClick={() => setReading(true)}>
            Read the rule: <BookCode id={entry.book} />, {entry.topic}
          </button>
        </>
      )}
      {reading && entry && createPortal(<RuleDetail entry={entry} onClose={() => setReading(false)} />, document.body)}
    </div>
  )
}

/** Encaixes de slot (proficiências): os gastos acesos, os que passam do total em vermelho. */
export function ForgeSlotSockets({ label, used, total }: { label: string; used: number; total: number }) {
  const count = Math.max(used, total)
  return (
    <div className="slot-pool">
      <span className="slot-pool-label">{label}</span>
      <span className="slot-sockets" aria-label={`${used} of ${total} slots used`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={i >= total ? 'slot-socket slot-over' : i < used ? 'slot-socket slot-used' : 'slot-socket'} />
        ))}
      </span>
      <span className="slot-pool-count">
        {used}/{total}
      </span>
    </div>
  )
}

/**
 * Faixa que corre para os lados, com a ilustração do grupo ao fundo (some até o
 * arquivo existir). As setas andam quase uma tela; no toque, arrasta-se.
 */
export function ForgeCarousel({ title, note, art, children }: { title: string; note?: string; art?: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [artOk, setArtOk] = useState(true)

  const measure = () => {
    const t = track.current
    if (t) setEdges({ start: t.scrollLeft <= 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 })
  }
  useEffect(() => {
    const t = track.current
    if (!t) return
    // O observador mede na hora e de novo quando a faixa muda (busca, janela).
    const observer = new ResizeObserver(measure)
    observer.observe(t)
    for (const child of Array.from(t.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [children])

  const page = (direction: number) => {
    const t = track.current
    t?.scrollBy({ left: direction * t.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="forge-carousel">
      {art && artOk && <img className="forge-carousel-art" src={art} alt="" aria-hidden="true" onError={() => setArtOk(false)} />}
      <header className="forge-carousel-head">
        <p className="forge-panel-label">{title}</p>
        {note && <span className="forge-carousel-note">{note}</span>}
        <span className="forge-carousel-arrows">
          <button type="button" className="forge-carousel-arrow" aria-label={`Scroll ${title} back`} disabled={edges.start} onClick={() => page(-1)}>
            ‹
          </button>
          <button type="button" className="forge-carousel-arrow" aria-label={`Scroll ${title} forward`} disabled={edges.end} onClick={() => page(1)}>
            ›
          </button>
        </span>
      </header>
      <div ref={track} className="forge-carousel-track" onScroll={measure}>
        {children}
      </div>
    </section>
  )
}
