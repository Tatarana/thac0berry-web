import { useState } from 'react'
import type { ServerSheet } from '../lib/useSpellSheets'
import { PaperModal } from './DetailBits'
import type { PrintChoice } from './PrintSheet'

const dayLabel = (s: ServerSheet) => s.title || new Date(s.date).toLocaleDateString('en-US', { dateStyle: 'medium' })

// Janela de impressão: o que vai para o papel. A ficha vem marcada; das folhas
// de magia, o dia aberto (ou o mais recente); psiônicos e grimório só quando o
// personagem tem.
export function PrintDialog({
  sheets,
  openSheetID,
  hasPsionics,
  hasSpellbook,
  spellbookLabel,
  onPrint,
  onClose,
}: {
  sheets: ServerSheet[]
  openSheetID: string | null
  hasPsionics: boolean
  hasSpellbook: boolean
  spellbookLabel: string
  onPrint: (choice: PrintChoice) => void
  onClose: () => void
}) {
  const [record, setRecord] = useState(true)
  const [days, setDays] = useState<Set<string>>(() => {
    const first = openSheetID ?? sheets[sheets.length - 1]?.id
    return new Set(first ? [first] : [])
  })
  const [psionics, setPsionics] = useState(false)
  const [spellbook, setSpellbook] = useState(false)

  const toggleDay = (id: string) =>
    setDays((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const chosenSheets = sheets.filter((s) => days.has(s.id))
  const nothing = !record && chosenSheets.length === 0 && !psionics && !spellbook

  return (
    <PaperModal title="Print / PDF" subtitle="A4, one part per sheet" onClose={onClose}>
      <ul className="print-options">
        <li>
          <label>
            <input type="checkbox" checked={record} onChange={(e) => setRecord(e.target.checked)} /> Character sheet
          </label>
        </li>
        {sheets.length > 0 && (
          <li>
            <span className="paper-label">Spell Sheets</span>
            <ul className="print-options print-days">
              {sheets.map((s) => (
                <li key={s.id}>
                  <label>
                    <input type="checkbox" checked={days.has(s.id)} onChange={() => toggleDay(s.id)} /> {dayLabel(s)}
                  </label>
                </li>
              ))}
            </ul>
          </li>
        )}
        {hasPsionics && (
          <li>
            <label>
              <input type="checkbox" checked={psionics} onChange={(e) => setPsionics(e.target.checked)} /> Psionics
            </label>
          </li>
        )}
        {hasSpellbook && (
          <li>
            <label>
              <input type="checkbox" checked={spellbook} onChange={(e) => setSpellbook(e.target.checked)} /> {spellbookLabel}
            </label>
          </li>
        )}
      </ul>
      <button className="consequence-apply" disabled={nothing} onClick={() => onPrint({ record, sheets: chosenSheets, psionics, spellbook })}>
        Print
      </button>
    </PaperModal>
  )
}
