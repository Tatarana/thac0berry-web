import { createPortal } from 'react-dom'
import { classLevels, combosFor, hitPointsRule, multiClassWarnings } from '../rules/multiclass'
import { canonicalClass } from '../rules/rules'
import type { CharacterClass, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'

// Multiclasse na ficha (MC2, docs/multiclasse.md): janela para acrescentar ou
// tirar classes, com as combinações padrão da raça, os avisos (fora da tabela é
// permitido, com aviso — decisão do usuário) e a regra de HP (o jogador calcula).

/** Classes que podem entrar num multiclasse (as do PHB; variantes na MC5). */
const options: CharacterClass[] = ['Fighter', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Paladin', 'Bard', 'Psionicist']

export function MultiClassWindow({
  c,
  onChange,
  onClose,
}: {
  c: PlayerCharacter
  /** Lista nova das OUTRAS classes (a principal não muda aqui). */
  onChange: (multiClasses: { characterClass: CharacterClass; level: number }[]) => void
  onClose: () => void
}) {
  const extra = c.multiClasses ?? []
  const all = classLevels(c)
  const taken = new Set(all.map((k) => canonicalClass(k.characterClass)))
  const combos = combosFor(c.race)
  const warnings = multiClassWarnings(c)
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
        {options
          .filter((o) => !taken.has(canonicalClass(o)))
          .map((o) => (
            <button key={o} className="chip" onClick={() => onChange([...extra, { characterClass: o, level: 1 }])}>
              + {o}
            </button>
          ))}
      </div>

      {combos.length > 0 && (
        <>
          <div className="rec-cell-label rec-left-label">Standard {c.race} combinations (PHB)</div>
          <div className="chip-row">
            {combos.map((combo) => (
              <button key={combo.join('/')} className="chip" onClick={() => adopt(combo)}>
                {combo.join('/')}
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
