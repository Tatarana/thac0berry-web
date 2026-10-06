import { useState, type ReactNode } from 'react'

// Peças comuns das páginas da ficha oficial (caixinhas com moldura fina,
// rótulo impresso e valor à caneta, como os FormCell/FormSectionTitle do iPad).
// As que aceitam `onChange` viram campo editável à caneta (EditableText /
// EditableNumber do iPad); sem `onChange`, só mostram o valor.

/** Campo de texto à caneta, sem moldura própria (a caixinha em volta é a moldura). */
export function InkInput({
  value,
  onChange,
  label,
  placeholder = '—',
  className,
}: {
  value: string | null | undefined
  onChange: (text: string) => void
  /** Nome para leitor de tela (o rótulo impresso nem sempre está colado). */
  label?: string
  placeholder?: string
  className?: string
}) {
  return (
    <input
      className={className ? `ink-input ${className}` : 'ink-input'}
      value={value ?? ''}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

/**
 * Número à caneta. Enquanto se digita, guarda o texto (para aceitar "-" no
 * meio do caminho); só repassa valores inteiros dentro do intervalo.
 */
export function InkNumber({
  value,
  onChange,
  label,
  min = -9999999,
  max = 999999999,
  className,
}: {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  className?: string
}) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  return (
    <input
      className={className ? `ink-input ink-number ${className}` : 'ink-input ink-number'}
      inputMode="numeric"
      value={focused ? text : String(value)}
      aria-label={label}
      onFocus={() => {
        setText(String(value))
        setFocused(true)
      }}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const next = event.target.value.trim()
        setText(next)
        if (/^[+-]?\d+$/.test(next)) {
          const number = Number(next)
          if (number >= min && number <= max) onChange(number)
        }
      }}
    />
  )
}

export function Cell({
  label,
  value,
  onChange,
}: {
  label?: string
  /** Só leitura: o que mostrar. Editável: o texto cru (sem o "—"). */
  value: ReactNode
  onChange?: (text: string) => void
}) {
  return (
    <div className="rec-cell">
      {label && <span className="rec-cell-label">{label}</span>}
      {onChange ? (
        <InkInput value={typeof value === 'string' ? value : String(value ?? '')} onChange={onChange} label={label} />
      ) : (
        <span className="rec-value">{value}</span>
      )}
    </div>
  )
}

/** Caixinha com número editável (PV, CA, moedas…). */
export function NumberCell({ label, value, onChange, min, max }: { label?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="rec-cell">
      {label && <span className="rec-cell-label">{label}</span>}
      <InkNumber value={value} onChange={onChange} label={label} min={min} max={max} />
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="rec-title">{children}</h2>
}

export function HeaderLine({
  label,
  children,
  edit,
}: {
  label: string
  children?: ReactNode
  /** Linha editável: o texto e quem recebe a mudança. */
  edit?: { value: string | null | undefined; onChange: (text: string) => void; className?: string }
}) {
  return (
    <div className="rec-header-line">
      {edit ? (
        <InkInput value={edit.value} onChange={edit.onChange} label={label} placeholder="" className={edit.className} />
      ) : (
        <span className="rec-value rec-header-value">{children}</span>
      )}
      <span className="rec-cell-label">{label}</span>
    </div>
  )
}

/** Texto longo à caneta (personalidade, histórico, habilidades raciais). */
export function TextBox({
  label,
  text,
  onChange,
}: {
  label: string
  text: string | null | undefined
  onChange?: (text: string) => void
}) {
  return (
    <div className="rec-textbox">
      <span className="rec-cell-label rec-left-label">{label}</span>
      {onChange ? (
        <textarea className="ink-input ink-area" value={text ?? ''} aria-label={label} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <p className="rec-value rec-long">{text?.trim() ? text : '—'}</p>
      )}
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
