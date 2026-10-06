import { useEffect, useRef, useState, type ReactNode } from 'react'

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
  className,
}: {
  label?: string
  /** Só leitura: o que mostrar. Editável: o texto cru (sem o "—"). */
  value: ReactNode
  onChange?: (text: string) => void
  /** Classe extra (destaque de consequência, por exemplo). */
  className?: string
}) {
  return (
    <div className={className ? `rec-cell ${className}` : 'rec-cell'}>
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
 * TallyBoard do iPad: clicar na caixa soma um uso; clicar num grupo de
 * pauzinhos tira um.
 */
export function TallyBoard({ count, exhausted, label, onChange }: { count: number; exhausted: boolean; label: string; onChange: (n: number) => void }) {
  const groups: number[] = []
  for (let left = count; left > 0; left -= 5) groups.push(Math.min(5, left))
  return (
    <button
      type="button"
      className={exhausted ? 'tally tally-board tally-exhausted' : 'tally tally-board'}
      aria-label={`${label}: ${count} used. Click to add one; click a mark to remove one.`}
      title="Click to add a use; click a mark to remove one"
      onClick={() => onChange(count + 1)}
    >
      {groups.map((size, index) => (
        <span
          key={index}
          className="tally-group tally-hit"
          onClick={(event) => {
            event.stopPropagation()
            onChange(Math.max(0, count - 1))
          }}
        >
          {Array.from({ length: Math.min(size, 4) }, (_, bar) => (
            <span key={bar} className="tally-bar" />
          ))}
          {size === 5 && <span className="tally-cross" />}
        </span>
      ))}
    </button>
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
  onAdd,
}: {
  /** Uma por página (dica ao passar o mouse e nome para leitor de tela). */
  titles: string[]
  current: number
  onSelect: (page: number) => void
  /** Como cada bolinha se anuncia: "Page 2", "Day 3"… */
  noun?: string
  /** Mostra o "+" tracejado no fim (AddBeadLabel do iPad): dia novo. */
  onAdd?: () => void
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
      {onAdd && (
        <button className="bead bead-add" aria-label={`New ${noun.toLowerCase()}`} title={`New ${noun.toLowerCase()}`} onClick={onAdd}>
          +
        </button>
      )}
    </nav>
  )
}

export interface PickerOption {
  value: string
  label: string
  /** Texto menor à direita (sigla, título do especialista…). */
  hint?: string
}

/**
 * Seletor de opções fixas no traço da ficha (no iPad, um botão que abre a
 * lista; aqui, uma lista em papel logo abaixo). Esc ou clique fora fecha;
 * setas navegam. Valor fora da lista (ficha antiga) aparece como está.
 */
export function InkPicker({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: string
  options: PickerOption[]
  onChange: (value: string) => void
  label: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // Abre com o foco na opção atual (ou na primeira).
    root.current?.querySelector<HTMLButtonElement>('.ink-picker-option[aria-selected="true"], .ink-picker-option')?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const move = (event: React.KeyboardEvent, delta: number) => {
    event.preventDefault()
    const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('.ink-picker-option') ?? [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    items[(index + delta + items.length) % items.length]?.focus()
  }

  return (
    <span className={className ? `ink-picker ${className}` : 'ink-picker'} ref={root}>
      <button type="button" className="ink-picker-button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="rec-value">{current?.label ?? (value || '—')}</span>
        <span className="ink-picker-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <span className="ink-picker-list" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className="ink-picker-option"
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') move(event, 1)
                if (event.key === 'ArrowUp') move(event, -1)
              }}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {option.hint && <span className="ink-picker-hint">{option.hint}</span>}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
