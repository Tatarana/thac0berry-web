import { useEffect, useState } from 'react'
import { loadSpell, type Spell, type SpellIndexEntry } from '../data/spells'

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="detail-field">
      <span className="paper-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

// Ficha da magia (SpellDetailSheet do iPad): campos do cabeçalho do livro,
// esferas/escolas e a descrição completa. Carrega o arquivo do círculo só
// quando a ficha abre.
export function SpellDetail({ entry, onClose }: { entry: SpellIndexEntry; onClose: () => void }) {
  const [spell, setSpell] = useState<Spell | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSpell(entry)
      .then((found) => (found ? setSpell(found) : setError('Spell not found in its file.')))
      .catch((reason: unknown) => setError(String(reason)))
  }, [entry])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const kind = entry.file.startsWith('wizard_') ? 'wizard' : 'priest'
  const spheres = spell?.spheres ?? []
  const schools = spell?.schools ?? []

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="paper-sheet modal-sheet" role="dialog" aria-modal="true" aria-label={entry.name} onClick={(event) => event.stopPropagation()}>
        <div className="detail-header">
          <div>
            <h2 className="paper-title">{entry.name}</h2>
            <p className="paper-soft">
              Level {entry.level} {kind} spell · {entry.school}
            </p>
          </div>
          <button className="paper-link" onClick={onClose}>close</button>
        </div>
        <hr className="paper-rule" />

        {error && <p className="paper-soft">Could not load the details: {error}</p>}
        {!spell && !error && <p className="paper-soft">Loading…</p>}

        {spell && (
          <>
            <div className="detail-grid">
              <Field label="Casting Time" value={spell.castingTime} />
              <Field label="Range" value={spell.range} />
              <Field label="Duration" value={spell.duration} />
              <Field label="Area of Effect" value={spell.areaOfEffect} />
              <Field label="Saving Throw" value={spell.savingThrow} />
              <Field label="Components" value={spell.components} />
              <Field label="Damage" value={spell.damage} />
              <Field label="Setting" value={spell.setting} />
            </div>
            {spheres.length > 0 && <Field label="Spheres" value={spheres.join(', ')} />}
            {schools.length > 0 && <Field label="Schools" value={schools.join(', ')} />}
            <div className="detail-field">
              <span className="paper-label">Description</span>
              <p className="detail-description">{spell.fullDescription ?? spell.summary}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
