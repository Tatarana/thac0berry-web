import { createPortal } from 'react-dom'
import { bardCombosFor, classLevels, classWarnings, combosFor, hitPointsRule, levelDrainTarget, multiClassOptions } from '../rules/multiclass'
import { canonicalClass } from '../rules/rules'
import type { CharacterClass, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'

// Multiclasse na ficha (MC2, docs/multiclasse.md): janela para acrescentar ou
// tirar classes, com as combinações padrão da raça, os avisos (fora da tabela é
// permitido, com aviso — decisão do usuário) e a regra de HP (o jogador calcula).

export function MultiClassWindow({
  c,
  onChange,
  onDrain,
  onClose,
}: {
  c: PlayerCharacter
  /** Lista nova das OUTRAS classes (a principal não muda aqui). */
  onChange: (multiClasses: { characterClass: CharacterClass; level: number }[]) => void
  /** Dreno de nível (MC5): −1 na classe que a regra indica (índice -1 = principal). */
  onDrain?: (index: number) => void
  onClose: () => void
}) {
  const extra = c.multiClasses ?? []
  const all = classLevels(c)
  const taken = new Set(all.map((k) => canonicalClass(k.characterClass)))
  const combos = combosFor(c.race)
  const warnings = classWarnings(c)
  const bardCombos = bardCombosFor(c.race)
  const drain = levelDrainTarget(c)
  const primary = canonicalClass(c.characterClass)

  /** Adota uma combinação padrão: mantém a principal e acrescenta as que faltam. */
  const adopt = (combo: string[]) => {
    const wanted = combo.map((n) => (n === 'Illusionist' ? 'Mage' : n)).filter((n) => n !== primary)
    const keep = extra.filter((k) => wanted.includes(canonicalClass(k.characterClass)))
    const add = wanted
      .filter((n) => !keep.some((k) => canonicalClass(k.characterClass) === n))
      .map((n) => ({ characterClass: n as CharacterClass, level: 1 }))
    onChange([...keep, ...add])
  }

  return createPortal(
    <PaperModal title="Multi-class" subtitle={`${c.race || 'No race'} · main class ${primary}`} onClose={onClose}>
      <p className="paper-soft">
        Only demihumans can be multi-class (PHB, Chapter 3). Experience is divided equally between the classes; each class has its own
        level. The character uses the best THAC0 and the best saving throw of its classes.
      </p>

      <div className="rec-cell-label rec-left-label">Classes</div>
      <ul className="slot-choices">
        <li className="mc-row">
          <span className="rec-value">{primary}</span>
          <span className="rec-soft">main class · level {c.level}</span>
        </li>
        {extra.map((k, index) => (
          <li key={`${k.characterClass}-${index}`} className="mc-row">
            <span className="rec-value">{canonicalClass(k.characterClass)}</span>
            <span className="rec-soft">level {k.level}</span>
            <button className="paper-link" onClick={() => onChange(extra.filter((_, i) => i !== index))}>
              remove
            </button>
          </li>
        ))}
      </ul>

      <div className="rec-cell-label rec-left-label">Add a class</div>
      <div className="chip-row">
        {multiClassOptions
          .filter((o) => !taken.has(canonicalClass(o)))
          .map((o) => (
            <button key={o} className="chip" onClick={() => onChange([...extra, { characterClass: o, level: 1 }])}>
              + {o}
            </button>
          ))}
      </div>

      {combos.length > 0 && (
        <>
          <div className="rec-cell-label rec-left-label">Standard {c.race} combinations (PHB, CPsiH)</div>
          <div className="chip-row">
            {combos.map((combo) => (
              <button key={combo.join('/')} className="chip" onClick={() => adopt(combo)}>
                {combo.join('/')}
              </button>
            ))}
          </div>
        </>
      )}

      {bardCombos.length > 0 && (
        <>
          <div className="rec-cell-label rec-left-label">{c.race} bard combinations (CBH) — with the kit</div>
          <div className="chip-row">
            {bardCombos.map((combo) => (
              <button key={combo.classes.join('/')} className="chip" title={`Kit: ${combo.kits.join(' or ')}`} onClick={() => adopt(combo.classes)}>
                {combo.classes.join('/')} · {combo.kits.join(', ')}
              </button>
            ))}
          </div>
        </>
      )}

      {warnings.length > 0 && (
        <ul className="mc-warnings">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}

      {all.length > 1 && onDrain && (
        <>
          <div className="rec-cell-label rec-left-label">Level drain</div>
          <p className="paper-soft">
            A drained multi-class character loses a level in the class with the highest level first; when levels are equal, in the class that
            needs the most experience (PHB, Chapter 3).
          </p>
          <div className="slot-actions mc-drain">
            <button className="paper-link" disabled={!drain} onClick={() => drain && onDrain(drain.index)}>
              {drain ? `Level drain (−1): ${drain.characterClass} ${drain.level} → ${drain.level - 1}` : 'Level drain (−1): every class is at level 1'}
            </button>
          </div>
        </>
      )}

      {all.length > 1 && (
        <>
          <div className="rec-cell-label rec-left-label">Hit points (you work them out)</div>
          <p className="paper-soft">{hitPointsRule(all)}</p>
        </>
      )}
    </PaperModal>,
    document.body,
  )
}
