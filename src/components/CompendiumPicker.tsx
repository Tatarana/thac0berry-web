import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { normalize } from '../lib/search'
import { PaperModal } from './DetailBits'

// Escolher um item do compêndio para uma linha da ficha (WeaponPickerSheet,
// ProficiencyPickerSheet, MundaneItemPickerSheet e MagicItemPickerSheet do
// iPad): busca por trecho do nome; escolher preenche a linha com os dados do
// livro; o que não está no compêndio entra com o nome digitado.

const LIMIT = 150

export function CompendiumPicker<T extends { id: string; name: string }>({
  title,
  load,
  hint,
  onChoose,
  onTyped,
  onClose,
}: {
  title: string
  load: () => Promise<T[]>
  /** Texto menor ao lado do nome (grupo, categoria, dano…). */
  hint?: (item: T) => string
  onChoose: (item: T) => void
  onTyped: (name: string) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<T[] | null>(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    let cancelled = false
    void load().then((all) => {
      if (!cancelled) setItems([...all].sort((a, b) => a.name.localeCompare(b.name)))
    })
    return () => {
      cancelled = true
    }
  }, [load])
  const typed = query.trim()
  const filtered = useMemo(() => {
    const target = normalize(typed)
    return (items ?? []).filter((i) => target === '' || normalize(i.name).includes(target))
  }, [items, typed])

  return createPortal(
    <PaperModal title={title} onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input
          className="ink-input"
          value={query}
          placeholder="name"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typed !== '') {
              const exact = filtered.find((i) => normalize(i.name) === normalize(typed))
              if (exact) onChoose(exact)
              else onTyped(typed)
            }
          }}
        />
      </label>
      {items === null && <p className="paper-soft">Loading…</p>}
      <ul className="slot-choices">
        {typed !== '' && (
          <li>
            <button className="slot-choice" onClick={() => onTyped(typed)}>
              <span className="rec-value">use "{typed}" as typed</span>
            </button>
          </li>
        )}
        {filtered.slice(0, LIMIT).map((item) => (
          <li key={item.id}>
            <button className="slot-choice" onClick={() => onChoose(item)}>
              <span className="rec-value">{item.name}</span>
              {hint && <span className="rec-soft">{hint(item)}</span>}
            </button>
          </li>
        ))}
        {filtered.length > LIMIT && <li className="paper-soft">{filtered.length - LIMIT} more — keep typing to narrow it down.</li>}
      </ul>
    </PaperModal>,
    document.body,
  )
}
