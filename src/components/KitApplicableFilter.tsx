// Chip "Only applicable kits" dos dois seletores de kit (Forge e ficha), com a
// contagem discreta dos ocultos. Ligado por padrão; o estado fica em quem usa.

export function KitApplicableFilter({ on, hidden, onToggle }: { on: boolean; hidden: number; onToggle: () => void }) {
  return (
    <div className="chip-row kit-applicable-filter">
      <button type="button" className={on ? 'chip chip-on' : 'chip'} aria-pressed={on} onClick={onToggle}>
        Only applicable kits
      </button>
      {on && hidden > 0 && <span className="kit-applicable-hidden">{hidden} hidden</span>}
    </div>
  )
}
