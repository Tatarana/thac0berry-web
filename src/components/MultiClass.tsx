import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConfirm } from '../lib/useConfirm'
import { canUndoDualClass } from '../rules/consequences'
import {
  allClasses,
  bardCombosFor,
  classLevels,
  classWarnings,
  combosFor,
  dualClassRequirements,
  dualClassRestriction,
  dualHitPointsRule,
  hitPointsRule,
  isDualClass,
  isMultiClass,
  levelDrainTarget,
  multiClassOptions,
} from '../rules/multiclass'
import { matchRace } from '../rules/raceKit'
import { canonicalClass, xpRequired } from '../rules/rules'
import type { CharacterClass, ClassLevel, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import { InkNumber } from './SheetBits'

// Multiclasse na ficha (MC2, docs/multiclasse.md): janela para acrescentar ou
// tirar classes, com as combinações padrão da raça, os avisos (fora da tabela é
// permitido, com aviso — decisão do usuário) e a regra de HP (o jogador calcula).
//
// Classe dupla (MC4): segunda aba da mesma janela. A troca é explícita (o
// seletor de classe do cabeçalho continua livre, para experimentar).

type Tab = 'multi' | 'dual'

export function MultiClassWindow({
  c,
  initialTab,
  onChange,
  onDrain,
  onDualSwitch,
  onUndoDual,
  onFormerChange,
  onClose,
}: {
  c: PlayerCharacter
  /** Aba ao abrir; sem ela, a da ficha (classe dupla, multiclasse) ou a da raça (humano = Dual-class). */
  initialTab?: Tab
  /** Lista nova das OUTRAS classes (a principal não muda aqui). */
  onChange: (multiClasses: { characterClass: CharacterClass; level: number }[]) => void
  /** Dreno de nível (MC5): −1 na classe que a regra indica (índice -1 = principal). */
  onDrain?: (index: number) => void
  /** Classe dupla (MC4): troca para a classe nova. */
  onDualSwitch: (next: CharacterClass) => void
  onUndoDual: () => void
  /** Classe dupla: lista nova das classes anteriores (edição à mão). */
  onFormerChange: (formerClasses: ClassLevel[]) => void
  onClose: () => void
}) {
  const defaultTab: Tab = isDualClass(c) ? 'dual' : isMultiClass(c) ? 'multi' : matchRace(c.race) === 'Human' ? 'dual' : 'multi'
  const [tab, setTab] = useState<Tab>(initialTab ?? defaultTab)
  const primary = canonicalClass(c.characterClass)

  return createPortal(
    <PaperModal title={tab === 'multi' ? 'Multi-class' : 'Dual-class'} subtitle={`${c.race || 'No race'} · ${tab === 'multi' ? 'main' : 'current'} class ${primary}`} onClose={onClose}>
      <div className="mc-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'multi'} className={tab === 'multi' ? 'mc-tab mc-tab-on' : 'mc-tab'} onClick={() => setTab('multi')}>
          Multi-class
        </button>
        <button role="tab" aria-selected={tab === 'dual'} className={tab === 'dual' ? 'mc-tab mc-tab-on' : 'mc-tab'} onClick={() => setTab('dual')}>
          Dual-class
        </button>
      </div>
      {tab === 'multi' ? (
        <MultiPanel c={c} onChange={onChange} onDrain={onDrain} />
      ) : (
        <DualPanel c={c} onSwitch={onDualSwitch} onUndo={onUndoDual} onFormerChange={onFormerChange} />
      )}
    </PaperModal>,
    document.body,
  )
}

function MultiPanel({
  c,
  onChange,
  onDrain,
}: {
  c: PlayerCharacter
  onChange: (multiClasses: { characterClass: CharacterClass; level: number }[]) => void
  onDrain?: (index: number) => void
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

  return (
    <>
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
    </>
  )
}

/**
 * Classe dupla (MC4, PHB cap. 3): as classes anteriores (nível editável, ou
 * acrescentadas à mão para quem já joga assim), a troca explícita para uma
 * classe nova (requisitos só como aviso, confirmação na página) e o desfazer.
 */
function DualPanel({
  c,
  onSwitch,
  onUndo,
  onFormerChange,
}: {
  c: PlayerCharacter
  onSwitch: (next: CharacterClass) => void
  onUndo: () => void
  onFormerChange: (formerClasses: ClassLevel[]) => void
}) {
  const { confirm, dialog } = useConfirm()
  const [target, setTarget] = useState<CharacterClass | null>(null)
  const former = c.formerClasses ?? []
  const current = canonicalClass(c.characterClass)
  const restriction = dualClassRestriction(c)
  const taken = new Set(allClasses(c).map((k) => canonicalClass(k.characterClass)))
  const options = multiClassOptions.filter((o) => !taken.has(canonicalClass(o)))
  const requirements = target ? dualClassRequirements(c, target) : []
  // Depois da troca, a restrição vai até passar o maior nível entre as anteriores e a atual.
  const untilAfter = Math.max(c.level, ...former.map((k) => k.level)) + 1
  const last = former[former.length - 1]
  const warnings = classWarnings(c)

  async function switchClass() {
    if (!target) return
    const ok = await confirm(
      <p>
        {current} {c.level} is frozen: it no longer earns experience or levels. {target} starts at level 1 with 0 XP; hit points are kept.
      </p>,
      `Dual-class to ${target}`,
    )
    if (!ok) return
    onSwitch(target)
    setTarget(null)
  }

  async function undo() {
    if (!last) return
    const lastClass = canonicalClass(last.characterClass)
    const xp = xpRequired(last.level, last.characterClass) ?? 0
    const ok = await confirm(
      <p>
        Back to {lastClass} {last.level}. Experience is set to {xp.toLocaleString('en-US')} XP, the minimum for that level — the XP the
        character had when switching was not kept.
      </p>,
      'Undo dual-class',
    )
    if (ok) onUndo()
  }

  return (
    <>
      {dialog}
      <p className="paper-soft">
        Only humans can be dual-classed (PHB, Chapter 3). The current class is the only one that advances; a former class keeps the level at
        which the character left it. Changing the class in the sheet header does not dual-class: it only swaps the current class.
      </p>

      <div className="rec-cell-label rec-left-label">Classes</div>
      <ul className="slot-choices">
        <li className="mc-row">
          <span className="rec-value">{current}</span>
          <span className="rec-soft">
            current class · level {c.level} · {c.experience.toLocaleString('en-US')} XP
          </span>
        </li>
        {former.map((k, index) => (
          <li key={`${k.characterClass}-${index}`} className="mc-row">
            <span className="rec-value">ex-{canonicalClass(k.characterClass)}</span>
            <span className="rec-soft">level</span>
            <InkNumber
              value={k.level}
              min={1}
              max={30}
              label={`${canonicalClass(k.characterClass)} level`}
              className="mc-former-level"
              onChange={(v) => onFormerChange(former.map((x, i) => (i === index ? { ...x, level: v } : x)))}
            />
            <button className="paper-link" onClick={() => onFormerChange(former.filter((_, i) => i !== index))}>
              remove
            </button>
          </li>
        ))}
      </ul>

      {restriction && (
        <p className="mc-dual-status">
          Former class abilities are restricted until {restriction.characterClass} {restriction.untilLevel}: using them in an encounter earns no
          XP for it and only half for the adventure. Until then THAC0 and saving throws come from {restriction.characterClass} alone.
        </p>
      )}
      {former.length > 0 && !restriction && (
        <p className="paper-soft">
          The restriction is over: the character uses the abilities of every class, and the best THAC0 and saving throws among them.
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="mc-warnings">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}

      <div className="rec-cell-label rec-left-label">Switch to a new class</div>
      <div className="chip-row">
        {options.map((o) => (
          <button key={o} className={target === o ? 'chip mc-chip-on' : 'chip'} aria-pressed={target === o} onClick={() => setTarget(target === o ? null : o)}>
            {o}
          </button>
        ))}
      </div>
      {target && (
        <>
          <ul className="mc-reqs">
            {requirements.map((r) => (
              <li key={r.text} className={r.ok ? 'mc-req-ok' : 'mc-req-bad'}>
                {r.ok ? '✓' : '⚠'} {r.text}
              </li>
            ))}
          </ul>
          <p className="paper-soft">
            {current} {c.level} is frozen · {target} 1, 0 XP · hit points kept · restricted until {target} {untilAfter}.
          </p>
          <div className="slot-actions mc-drain">
            <button className="consequence-apply" onClick={() => void switchClass()}>
              Dual-class to {target}
            </button>
          </div>
        </>
      )}

      {canUndoDualClass(c) && last && (
        <div className="slot-actions mc-drain">
          <button className="paper-link" onClick={() => void undo()}>
            Undo dual-class (back to {canonicalClass(last.characterClass)} {last.level})
          </button>
        </div>
      )}

      <div className="rec-cell-label rec-left-label">Add a former class by hand</div>
      <p className="paper-soft">For a character who was already dual-classed before this sheet: the class and the level at which it was left.</p>
      <div className="chip-row">
        {options.map((o) => (
          <button key={o} className="chip" onClick={() => onFormerChange([...former, { characterClass: o, level: 2 }])}>
            + ex-{o}
          </button>
        ))}
      </div>

      {former.length > 0 && (
        <>
          <div className="rec-cell-label rec-left-label">Hit points (you work them out)</div>
          <p className="paper-soft">{dualHitPointsRule(c)}</p>
        </>
      )}
    </>
  )
}
