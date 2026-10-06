import { useState } from 'react'
import { useSpellChoices, type Caster, type CasterChoice } from '../lib/spellChoices'
import { spellMatches } from '../rules/spellSheets'

// Campo de nome de magia com sugestões do compêndio (como a escrita à caneta
// do iPad, que sugere as parecidas). Escolher uma sugestão liga a magia ao
// compêndio (id); o texto digitado sempre pode ficar como está ("custom",
// para magias que não estão na base).

const casterLabel = (c: Caster) => (c === 'divine' ? 'Priest' : 'Wizard')
const confidence = (score: number) => (score >= 0.85 ? 'near match' : score >= 0.6 ? 'likely' : 'guess')

/** Lista de sugestões para o texto: as parecidas e, por último, o próprio texto como "custom". */
export function SpellSuggestions({
  text,
  choices,
  showCaster,
  customLabel,
  onPick,
}: {
  text: string
  choices: CasterChoice[]
  showCaster: boolean
  /** Texto do botão "custom" (ex.: `use "Zap" (custom)`). */
  customLabel: (typed: string) => string
  onPick: (name: string, spell: CasterChoice | null) => void
}) {
  const typed = text.trim()
  if (typed === '') return null
  const matches = spellMatches(typed, choices, 6)
  const exact = matches.some((m) => m.spell.name.toLowerCase() === typed.toLowerCase())
  return (
    <ul className="slot-choices spell-suggestions">
      {matches.map((m) => (
        <li key={m.spell.id}>
          <button type="button" className="slot-choice" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(m.spell.name, m.spell as CasterChoice)}>
            <span className="rec-value">{m.spell.name}</span>
            <span className="rec-soft">
              {showCaster ? `${casterLabel((m.spell as CasterChoice).caster)} ` : ''}level {m.spell.level}
            </span>
            <span className="rec-soft">{confidence(m.score)}</span>
          </button>
        </li>
      ))}
      {!exact && (
        <li>
          <button type="button" className="slot-choice" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(typed, null)}>
            <span className="rec-value">{customLabel(typed)}</span>
          </button>
        </li>
      )}
    </ul>
  )
}

/**
 * Nome de magia editável com sugestões (magias de item). Digitar grava o texto
 * como magia livre; escolher uma sugestão grava o nome e o id do compêndio.
 */
export function SpellNameField({
  value,
  label,
  placeholder,
  casters,
  onChange,
}: {
  value: string
  label: string
  placeholder?: string
  casters: Caster[]
  onChange: (name: string, spellID: string | null) => void
}) {
  const [focused, setFocused] = useState(false)
  const choices = useSpellChoices(casters)
  return (
    <span className="spell-field">
      <input
        className="ink-input"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value, null)}
      />
      {focused && (
        <SpellSuggestions
          text={value}
          choices={choices}
          showCaster={casters.length > 1}
          customLabel={(typed) => `keep "${typed}" (custom spell)`}
          onPick={(name, spell) => {
            onChange(name, spell?.id ?? null)
            ;(document.activeElement as HTMLElement | null)?.blur()
          }}
        />
      )}
    </span>
  )
}
