import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  activateBankedHeal,
  addEffect,
  adjustUses,
  bonusTargetLabels,
  componentSummary,
  endEffect,
  kindHints,
  kindLabels,
  logBankedHeal,
  newComponent,
  newEffect,
  overrideStatLabels,
  saveEditedEffect,
  saveLabels,
} from '../rules/effects'
import type { ActiveEffect, EffectComponent, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import type { Edit } from './RecordSheet'
import { InkInput, InkNumber, InkPicker, SectionTitle, TallyMarks } from './SheetBits'

// Efeitos ativos (ActiveEffectsView do iPad): magias, poções e outros com
// duração, que entram e saem no meio da sessão. Cada efeito já está aplicado
// aos números da ficha; "End" desfaz. Editar um efeito em curso reaplica com
// os valores novos. Regras em src/rules/effects.ts.

function Counter({ count, max, exhausted, label, onChange }: { count: number; max: number; exhausted: boolean; label: string; onChange: (delta: 1 | -1) => void }) {
  return (
    <span className="counter">
      <button className="counter-btn" aria-label={`${label}: one less`} disabled={count <= 0} onClick={() => onChange(-1)}>
        −
      </button>
      <TallyMarks count={count} exhausted={exhausted} />
      <button className="counter-btn" aria-label={`${label}: one more`} disabled={count >= max} onClick={() => onChange(1)}>
        +
      </button>
    </span>
  )
}

function ComponentLine({ effect, comp, edit }: { effect: ActiveEffect; comp: EffectComponent; edit: Edit }) {
  const exhausted = comp.usedCount >= comp.maxUses
  return (
    <li className="effect-line">
      <span className="rec-value">{componentSummary(comp)}</span>
      {comp.kind === 'tempHP' && (
        <p className="rec-soft">
          {comp.tempHPRemaining} of {comp.tempHPGranted} left — added to Current HP; what's lost to damage while this is active never heals back.
        </p>
      )}
      {comp.kind === 'attackNegation' && (
        <span className="effect-uses">
          <Counter count={comp.usedCount} max={comp.maxUses} exhausted={exhausted} label="Attacks negated" onChange={(d) => edit((x) => adjustUses(x, effect.id, comp.id, d))} />
          <span className="rec-soft">
            {comp.usedCount} of {comp.maxUses}
          </span>
        </span>
      )}
      {comp.kind === 'bankedHeal' &&
        (comp.healIsBanked ? (
          <p className="rec-soft">
            Banked — starts healing 1/round the moment this character next takes damage (window: {comp.healWindowLabel}, or it fades).{' '}
            <button className="paper-link" onClick={() => edit((x) => activateBankedHeal(x, effect.id, comp.id))}>
              Activate now (took damage)
            </button>
          </p>
        ) : (
          <span className="effect-uses">
            <span className="rec-soft">Healing 1/round — log each round's point (also raises Current HP).</span>
            <Counter count={comp.usedCount} max={comp.maxUses} exhausted={exhausted} label="HP healed" onChange={(d) => edit((x) => logBankedHeal(x, effect.id, comp.id, d))} />
            <span className="rec-soft">
              {comp.usedCount} of {comp.maxUses} HP healed
            </span>
          </span>
        ))}
    </li>
  )
}

const kindOptions = (Object.keys(kindLabels) as EffectComponent['kind'][]).map((k) => ({ value: k, label: kindLabels[k] }))
const targetOptions = (Object.keys(bonusTargetLabels) as EffectComponent['bonusTarget'][]).map((k) => ({ value: k, label: bonusTargetLabels[k] }))
const statOptions = (Object.keys(overrideStatLabels) as EffectComponent['overrideStat'][]).map((k) => ({ value: k, label: overrideStatLabels[k] }))

/** Um componente no editor (EffectComponentEditor do iPad): tipo e os campos dele. */
function ComponentEditor({ comp, onChange, onDelete }: { comp: EffectComponent; onChange: (c: EffectComponent) => void; onDelete?: () => void }) {
  const set = (patch: Partial<EffectComponent>) => onChange({ ...comp, ...patch })
  const saveIDs = new Set(comp.savingThrowIDs ?? saveLabels.map((s) => s.id))
  return (
    <div className="effect-editor-component">
      <div className="effect-editor-row">
        <InkPicker value={comp.kind} options={kindOptions} label="Effect type" onChange={(v) => set({ kind: v as EffectComponent['kind'] })} />
        {onDelete && (
          <button className="remove-btn" aria-label="Remove this part" title="Remove this part" onClick={onDelete}>
            ×
          </button>
        )}
      </div>
      <p className="rec-soft">{kindHints[comp.kind]}</p>
      {comp.kind === 'flatBonus' && (
        <>
          <div className="effect-editor-row">
            <InkPicker value={comp.bonusTarget} options={targetOptions} label="Applies to" onChange={(v) => set({ bonusTarget: v as EffectComponent['bonusTarget'] })} />
            <InkNumber className="ink-short" value={comp.bonusAmount} min={-99} max={99} label="Bonus" onChange={(v) => set({ bonusAmount: v })} />
          </div>
          {comp.bonusTarget === 'allSaves' && (
            <div className="chip-row">
              {saveLabels.map((s) => (
                <button
                  key={s.id}
                  className={saveIDs.has(s.id) ? 'chip chip-on' : 'chip'}
                  onClick={() => {
                    const next = new Set(saveIDs)
                    if (next.has(s.id)) next.delete(s.id)
                    else next.add(s.id)
                    set({ savingThrowIDs: next.size === saveLabels.length ? null : saveLabels.map((x) => x.id).filter((id) => next.has(id)) })
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {comp.bonusTarget === 'damage' && (
            <p className="rec-soft">No single Damage number exists on the sheet — this only adds a reminder row to Damage Modifiers.</p>
          )}
        </>
      )}
      {comp.kind === 'statOverride' && (
        <div className="effect-editor-row">
          <InkPicker value={comp.overrideStat} options={statOptions} label="Stat" onChange={(v) => set({ overrideStat: v as EffectComponent['overrideStat'] })} />
          <span className="rec-soft">becomes</span>
          <InkNumber className="ink-short" value={comp.overrideValue} min={-10} max={99} label="New value" onChange={(v) => set({ overrideValue: v })} />
        </div>
      )}
      {comp.kind === 'attackNegation' && (
        <div className="effect-editor-row">
          <span className="rec-soft">Attacks negated</span>
          <InkNumber className="ink-short" value={comp.maxUses} min={1} max={99} label="Attacks negated" onChange={(v) => set({ maxUses: v })} />
        </div>
      )}
      {comp.kind === 'bankedHeal' && (
        <>
          <div className="effect-editor-row">
            <span className="rec-soft">HP pool</span>
            <InkNumber className="ink-short" value={comp.maxUses} min={1} max={999} label="HP pool" onChange={(v) => set({ maxUses: v })} />
            <span className="rec-soft">window</span>
            <InkInput value={comp.healWindowLabel} label="Heal window" onChange={(v) => set({ healWindowLabel: v })} />
          </div>
          <p className="rec-soft">
            Roll the pool once now (e.g. 3d4+6) and enter the total above — it heals 1/round once activated, starting the moment this character next takes damage.
          </p>
        </>
      )}
      {comp.kind === 'tempHP' && (
        <>
          <div className="effect-editor-row">
            <span className="rec-soft">Temporary HP</span>
            <InkNumber className="ink-short" value={comp.tempHPGranted} min={1} max={999} label="Temporary HP" onChange={(v) => set({ tempHPGranted: v })} />
          </div>
          <p className="rec-soft">Added straight to Current HP when saved. Damage burns this first, and what's lost can never be healed back.</p>
        </>
      )}
    </div>
  )
}

/** ActiveEffectEditorSheet: nome, duração, notas e as partes do efeito. Salvar aplica. */
function EffectEditor({ initial, isNew, onSave, onClose }: { initial: ActiveEffect; isNew: boolean; onSave: (e: ActiveEffect) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<ActiveEffect>(() => structuredClone(initial))
  return createPortal(
    <PaperModal title={isNew ? 'New Effect' : 'Edit Effect'} onClose={onClose}>
      <div className="effect-editor">
        <label className="slot-write">
          <span className="rec-cell-label rec-left-label">Name</span>
          <input className="ink-input" value={draft.name} placeholder="e.g. Bless, Potion of Heroism" autoFocus onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="slot-write">
          <span className="rec-cell-label rec-left-label">Duration</span>
          <input className="ink-input" value={draft.durationLabel} placeholder="e.g. 6 rounds, 1 turn/level" onChange={(e) => setDraft({ ...draft, durationLabel: e.target.value })} />
        </label>
        {draft.components.map((comp, index) => (
          <ComponentEditor
            key={comp.id}
            comp={comp}
            onChange={(next) => setDraft({ ...draft, components: draft.components.map((c, i) => (i === index ? next : c)) })}
            onDelete={draft.components.length > 1 ? () => setDraft({ ...draft, components: draft.components.filter((_, i) => i !== index) }) : undefined}
          />
        ))}
        <button className="paper-link add-line" onClick={() => setDraft({ ...draft, components: [...draft.components, newComponent()] })}>
          + add another
        </button>
        <label className="slot-write">
          <span className="rec-cell-label rec-left-label">Notes</span>
          <textarea className="ink-input ink-area" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </label>
        <div className="btn-row consequence-actions">
          <button className="consequence-apply" onClick={() => onSave(draft)}>
            {isNew ? 'Add effect' : 'Save changes'}
          </button>
        </div>
      </div>
    </PaperModal>,
    document.body,
  )
}

export function ActiveEffectsPage({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const [editing, setEditing] = useState<{ effect: ActiveEffect; isNew: boolean } | null>(null)
  const effects = c.activeEffects ?? []
  return (
    <div className="rec-sheet">
      <SectionTitle>Active Effects</SectionTitle>
      <p className="rec-soft">Spells, potions, and other effects with a finite duration — tracked here instead of the printed sheet, since they come and go mid-session.</p>
      {effects.length === 0 && (
        <p className="rec-soft">No active effects. {edit ? 'Use “+ Add effect” when your character gets buffed, debuffed, or otherwise affected for a limited time.' : ''}</p>
      )}
      {effects.map((effect) => (
        <section key={effect.id} className="effect-card">
          <header className="effect-card-head">
            <span className="rec-value effect-name">{effect.name || 'Unnamed effect'}</span>
            {effect.durationLabel && <span className="rec-soft">{effect.durationLabel}</span>}
            {edit && (
              <span className="effect-card-actions">
                <button className="paper-link" onClick={() => setEditing({ effect, isNew: false })}>
                  edit
                </button>
                <button
                  className="paper-link"
                  onClick={() => {
                    if (window.confirm(`End "${effect.name || 'this effect'}"? Its changes to the sheet are undone.`)) edit((x) => endEffect(x, effect.id))
                  }}
                >
                  End
                </button>
              </span>
            )}
          </header>
          <ul className="effect-lines">
            {effect.components.map((comp) =>
              edit ? (
                <ComponentLine key={comp.id} effect={effect} comp={comp} edit={edit} />
              ) : (
                <li key={comp.id} className="effect-line">
                  <span className="rec-value">{componentSummary(comp)}</span>
                </li>
              ),
            )}
          </ul>
          {effect.notes && <p className="rec-soft">{effect.notes}</p>}
        </section>
      ))}
      {edit && (
        <button className="paper-link add-line" onClick={() => setEditing({ effect: newEffect(), isNew: true })}>
          + Add effect
        </button>
      )}
      {editing && edit && (
        <EffectEditor
          initial={editing.effect}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={(effect) => {
            edit((x) => (editing.isNew ? addEffect(x, effect) : saveEditedEffect(x, effect)))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
