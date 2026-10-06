import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadSpellIndex, type SpellIndexEntry } from '../data/spells'
import { normalize } from '../lib/search'
import {
  sortSlotChoices,
  spellMatches,
  sphereSignal,
  sphereSignalLabel,
  wizardSpellbookFreeNames,
  wizardSpellbookIDs,
  type SpellChoice,
} from '../rules/spellSheets'
import type { PlayerCharacter, SpellSlot } from '../types/library'
import { PaperModal } from './DetailBits'

// Trocar a magia memorizada num slot (SlotEditorSheet do iPad): escrever o
// nome (com sugestões parecidas) ou escolher na lista do círculo, que vem
// ordenada por favoritas, esferas e mais usadas. O mago só vê o próprio
// grimório; o sacerdote pode usar um nome livre ("use as-is").
// Embaixo: limpar o slot e marcar/desmarcar como gasto.

/** SpellMatch.confidenceLabel do iPad. */
const confidenceLabel = (score: number) => (score >= 0.85 ? 'near match' : score >= 0.6 ? 'likely' : 'guess')

export function SlotEditor({
  slot,
  character,
  favorites,
  usage,
  onAssign,
  onClear,
  onToggleSpent,
  onClose,
}: {
  slot: SpellSlot
  character: Pick<PlayerCharacter, 'sphereAccess' | 'wizardSpellbook'>
  favorites: Set<string>
  usage: Map<string, number>
  onAssign: (choice: { id: string | null; name: string }) => void
  onClear: () => void
  onToggleSpent: () => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<SpellIndexEntry[] | null>(null)
  const arcane = slot.caster === 'arcane'

  useEffect(() => {
    let cancelled = false
    void loadSpellIndex().then((index) => {
      if (cancelled) return
      const list = (arcane ? index.arcane : index.divine).filter((s) => s.level === slot.level)
      // O mago só memoriza o que está no próprio grimório.
      const book = wizardSpellbookIDs(character)
      setEntries(arcane ? list.filter((s) => book.has(s.id)) : list)
    })
    return () => {
      cancelled = true
    }
  }, [arcane, slot.level, character])

  const choices: SpellChoice[] = useMemo(
    () => (entries ?? []).map((e) => ({ id: e.id, name: e.name, level: e.level, spheres: e.spheres })),
    [entries],
  )
  const freeNames = arcane ? wizardSpellbookFreeNames(character, slot.level) : []
  const candidates = spellMatches(query, choices)
  const listed = sortSlotChoices(choices, character, favorites, usage)
  const typed = query.trim()
  const freeMatch = arcane ? freeNames.find((e) => normalize(e.name) === normalize(typed)) : undefined

  const row = (choice: SpellChoice, hint?: string) => {
    const signal = sphereSignal(character, choice)
    return (
      <li key={choice.id}>
        <button className="slot-choice" onClick={() => onAssign({ id: choice.id, name: choice.name })}>
          <span className="rec-value">{choice.name}</span>
          {favorites.has(choice.id) && <span className="slot-choice-fav" aria-label="favorite">★</span>}
          {signal && <span className="slot-choice-signal">{sphereSignalLabel[signal]}</span>}
          {hint && <span className="rec-soft">{hint}</span>}
        </button>
      </li>
    )
  }

  return createPortal(
    <PaperModal title={`Level ${slot.level} · ${arcane ? 'Wizard' : 'Priest'}`} onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Memorize</span>
        <input className="ink-input" value={query} placeholder="write the spell" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      {entries === null && <p className="paper-soft">Loading spells…</p>}
      <ul className="slot-choices">
        {typed !== '' && candidates.length === 0 && (
          <li>
            {arcane ? (
              freeMatch ? (
                <button className="slot-choice" onClick={() => onAssign({ id: null, name: freeMatch.name })}>
                  <span className="rec-value">use "{freeMatch.name}" as-is</span>
                </button>
              ) : (
                <p className="paper-soft">"{typed}" isn't in your spellbook — add it from "My Spellbook" on the character sheet.</p>
              )
            ) : (
              <button className="slot-choice" onClick={() => onAssign({ id: null, name: typed })}>
                <span className="rec-value">use "{typed}" as-is</span>
              </button>
            )}
          </li>
        )}
        {typed !== '' && candidates.map((m) => row(m.spell, confidenceLabel(m.score)))}
        {typed === '' && listed.map((choice) => row(choice))}
        {typed === '' &&
          freeNames.map((entry) => (
            <li key={entry.id}>
              <button className="slot-choice" onClick={() => onAssign({ id: null, name: entry.name })}>
                <span className="rec-value">{entry.name}</span>
              </button>
            </li>
          ))}
        {typed === '' && entries !== null && listed.length === 0 && freeNames.length === 0 && (
          <li className="paper-soft">
            {arcane
              ? `Your spellbook has no circle ${slot.level} spells yet — add some from "My Spellbook" on the character sheet.`
              : "The built-in spell list doesn't cover this level — write the name by hand."}
          </li>
        )}
      </ul>
      <div className="slot-actions">
        <button className="paper-link" onClick={onClear}>clear slot</button>
        <button className="paper-link" onClick={onToggleSpent}>{slot.isSpent ? 'unmark as used' : 'mark as used'}</button>
      </div>
    </PaperModal>,
    document.body,
  )
}
