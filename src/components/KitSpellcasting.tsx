import { createPortal } from 'react-dom'
import type { KitSpellcasting, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import { InkNumber } from './SheetBits'

// Conjuração vinda de um kit (ajuste 6, 2026-10-10): grimório e folhas de magia
// para quem não é mago/sacerdote (ex.: o Shinobi Mage). Os slots por círculo são
// marcados à mão (decisão do usuário): cada kit tem a sua regra. Valem nos dias
// novos de folha de magia; as folhas que já existem ficam como estão.

const casters = [
  { key: 'arcane' as const, title: 'Wizard spells', note: 'Spellbook and the wizard spell sheet', circles: 9 },
  { key: 'divine' as const, title: 'Priest spells', note: 'The priest spell sheet', circles: 7 },
]

export function KitSpellcastingWindow({
  c,
  onChange,
  onClose,
}: {
  c: PlayerCharacter
  /** Valor novo (null = nenhuma conjuração por kit). */
  onChange: (next: KitSpellcasting | null) => void
  onClose: () => void
}) {
  const current = c.kitSpellcasting ?? {}

  function set(key: 'arcane' | 'divine', value: number[] | null) {
    const next: KitSpellcasting = { ...current, [key]: value }
    const empty = !Array.isArray(next.arcane) && !Array.isArray(next.divine)
    onChange(empty ? null : next)
  }

  return createPortal(
    <PaperModal title="Spellcasting from a kit" subtitle={c.kit ? `Kit: ${c.kit}` : 'No kit chosen'} onClose={onClose}>
      <p className="paper-soft">
        Some kits let a character cast spells without being a wizard or a priest (the Shinobi Mage, for example). Turn on the kind of magic
        the kit gives and mark the spell slots per circle by hand, as the kit describes. New spell-sheet days use these slots.
      </p>
      {casters.map(({ key, title, note, circles }) => {
        const slots = current[key]
        const on = Array.isArray(slots)
        return (
          <div key={key} className="kit-casting">
            <label className="kit-casting-toggle">
              <input type="checkbox" checked={on} onChange={(event) => set(key, event.target.checked ? [] : null)} />
              <span className="rec-value">{title}</span>
              <span className="rec-soft">{note}</span>
            </label>
            {on && (
              <div className="kit-casting-slots">
                <span className="rec-cell-label">Slots per circle</span>
                <div className="kit-casting-grid">
                  {Array.from({ length: circles }, (_, i) => (
                    <label key={i} className="kit-casting-circle">
                      <span className="rec-soft">{i + 1}</span>
                      <InkNumber
                        value={slots?.[i] ?? 0}
                        min={0}
                        max={9}
                        label={`${title}: circle ${i + 1} slots`}
                        onChange={(v) => {
                          const next = Array.from({ length: circles }, (_, j) => (j === i ? v : (slots?.[j] ?? 0)))
                          while (next.length > 0 && next[next.length - 1] === 0) next.pop()
                          set(key, next)
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </PaperModal>,
    document.body,
  )
}
