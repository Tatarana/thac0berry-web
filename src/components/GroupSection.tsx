import type { ReactNode } from 'react'

// Seção recolhível dos compêndios: tarja escura com o nome e a contagem.
export function GroupSection({
  label,
  count,
  expanded,
  onToggle,
  children,
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="level-section">
      <button className="level-header" onClick={onToggle} aria-expanded={expanded}>
        <span>{label}</span>
        <span className="level-count">
          {count} {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded && <ul className="spell-list">{children}</ul>}
    </section>
  )
}
