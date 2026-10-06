import type { ReactNode } from 'react'

// Peças comuns das páginas da ficha oficial (caixinhas com moldura fina,
// rótulo impresso e valor à caneta, como os FormCell/FormSectionTitle do iPad).

export function Cell({ label, value }: { label?: string; value: ReactNode }) {
  return (
    <div className="rec-cell">
      {label && <span className="rec-cell-label">{label}</span>}
      <span className="rec-value">{value}</span>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="rec-title">{children}</h2>
}

export function HeaderLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rec-header-line">
      <span className="rec-value rec-header-value">{children}</span>
      <span className="rec-cell-label">{label}</span>
    </div>
  )
}

/** Texto longo à caneta (personalidade, histórico, habilidades raciais). */
export function TextBox({ label, text }: { label: string; text: string | null | undefined }) {
  return (
    <div className="rec-textbox">
      <span className="rec-cell-label rec-left-label">{label}</span>
      <p className="rec-value rec-long">{text?.trim() ? text : '—'}</p>
    </div>
  )
}

/**
 * Bloco com tarja escura no título e contador à direita (SheetBlock do
 * iPad), usado nas listas da página 2: itens mágicos, idiomas, aliados etc.
 */
export function SheetBlock({ title, trailing, children }: { title: string; trailing?: string; children: ReactNode }) {
  return (
    <section className="sheet-block">
      <header className="sheet-block-bar">
        <span>{title}</span>
        {trailing !== undefined && <span className="sheet-block-trailing">{trailing}</span>}
      </header>
      <div className="sheet-block-body">{children}</div>
    </section>
  )
}

/**
 * Marcas de contagem (TallyMarks do iPad): grupos de cinco, o quinto
 * cruzando os outros quatro, num "poço de tinta" escuro. Claras enquanto sobra
 * carga; avermelhadas quando o item esgota. Só o desenho, sem o gesto de riscar.
 */
export function TallyMarks({ count, exhausted }: { count: number; exhausted: boolean }) {
  const groups: number[] = []
  for (let left = count; left > 0; left -= 5) groups.push(Math.min(5, left))
  return (
    <span className={exhausted ? 'tally tally-exhausted' : 'tally'} aria-label={`${count} used`}>
      {groups.map((size, index) => (
        <span key={index} className="tally-group">
          {Array.from({ length: Math.min(size, 4) }, (_, bar) => (
            <span key={bar} className="tally-bar" />
          ))}
          {size === 5 && <span className="tally-cross" />}
        </span>
      ))}
    </span>
  )
}

/**
 * Bolinhas numeradas sobre uma linha pontilhada (RecordSheetBeadRow /
 * InkDayBead do iPad): uma por página da ficha; a atual fica cheia, maior.
 */
export function PageBeads({
  titles,
  current,
  onSelect,
  noun = 'Page',
}: {
  /** Uma por página (dica ao passar o mouse e nome para leitor de tela). */
  titles: string[]
  current: number
  onSelect: (page: number) => void
  /** Como cada bolinha se anuncia: "Page 2", "Day 3"… */
  noun?: string
}) {
  return (
    <nav className="beads" aria-label={`${noun}s`}>
      {titles.map((title, index) => {
        const page = index + 1
        const selected = page === current
        return (
          <button
            key={page}
            className={selected ? 'bead bead-on' : 'bead'}
            title={title}
            aria-label={`${noun} ${page}: ${title}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onSelect(page)}
          >
            {page}
          </button>
        )
      })}
    </nav>
  )
}
