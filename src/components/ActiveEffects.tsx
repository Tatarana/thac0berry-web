import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  activateBankedHeal,
  addEffect,
  adjustUses,
  bonusTargetLabels,
  abilityStats,
  componentSummary,
  endEffect,
  isAbilityBonus,
  kindHints,
  kindLabels,
  logBankedHeal,
  newComponent,
  newEffect,
  overrideStatLabels,
  saveEditedEffect,
  saveLabels,
} from '../rules/effects'
import { useConfirm } from '../lib/useConfirm'
import type { ActiveEffect, EffectComponent, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import type { Edit } from './RecordSheet'
import { InkInput, InkNumber, InkPicker, TallyBoard } from './SheetBits'

// Efeitos ativos (ActiveEffectsView do iPad): magias, poções e outros com
// duração, que entram e saem no meio da sessão. Na web, uma janela que abre
// pelo ícone de brilhos, por cima da ficha (pedido do usuário: normalmente há
// 1 ou 2 efeitos, não precisa de uma tela inteira). Cada efeito já está aplicado
// aos números da ficha; "End" desfaz. Editar um efeito em curso reaplica com
// os valores novos. Regras em src/rules/effects.ts.

/** Contador de riscos padrão (TallyBoard): a caixa soma um, um risco tira um. */
function Counter({ count, max, exhausted, label, onChange }: { count: number; max: number; exhausted: boolean; label: string; onChange: (delta: 1 | -1) => void }) {
  return <TallyBoard count={count} max={max} exhausted={exhausted} label={label} onChange={(n) => onChange(n > count ? 1 : -1)} />
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
// Alvos do Flat Bonus: os do iPad e os seis atributos (estes gravados como
// Stat Override calculado; ver src/rules/effects.ts).
const targetOptions = [
  ...(Object.keys(bonusTargetLabels) as EffectComponent['bonusTarget'][]).map((k) => ({ value: k, label: bonusTargetLabels[k] })),
  ...abilityStats.map((k) => ({ value: k, label: overrideStatLabels[k], hint: k.slice(0, 3).toUpperCase() })),
]
const statOptions = (Object.keys(overrideStatLabels) as EffectComponent['overrideStat'][]).map((k) => ({ value: k, label: overrideStatLabels[k] }))

/** Um componente no editor (EffectComponentEditor do iPad): tipo e os campos dele. */
function ComponentEditor({ comp, onChange, onDelete }: { comp: EffectComponent; onChange: (c: EffectComponent) => void; onDelete?: () => void }) {
  const set = (patch: Partial<EffectComponent>) => onChange({ ...comp, ...patch })
  const saveIDs = new Set(comp.savingThrowIDs ?? saveLabels.map((s) => s.id))
  // Bônus em atributo aparece e se edita como Flat Bonus.
  const abilityBonus = isAbilityBonus(comp)
  const shownKind = abilityBonus ? 'flatBonus' : comp.kind
  return (
    <div className="effect-editor-component">
      <div className="effect-editor-row">
        <InkPicker
          value={shownKind}
          options={kindOptions}
          label="Effect type"
          onChange={(v) => {
            if (v === shownKind) return
            // Sair do bônus em atributo para um Stat Override "de verdade": zera o marcador.
            set(abilityBonus ? { kind: v as EffectComponent['kind'], bonusAmount: 0 } : { kind: v as EffectComponent['kind'] })
          }}
        />
        {onDelete && (
          <button className="remove-btn" aria-label="Remove this part" title="Remove this part" onClick={onDelete}>
            ×
          </button>
        )}
      </div>
      <p className="rec-soft">{kindHints[shownKind]}</p>
      {shownKind === 'flatBonus' && (
        <>
          <div className="effect-editor-row">
            <span className="effect-field">
              <span className="rec-cell-label rec-left-label">Bonus (+/−)</span>
              {/* Bônus somado ao valor da ficha (ex.: +3), diferente do Stat Override, que troca o valor. */}
              <InkNumber
                className="effect-number"
                value={comp.bonusAmount}
                min={-99}
                max={99}
                label="Bonus"
                // Em atributo, o bônus é o que distingue do Stat Override: zero não vale.
                onChange={(v) => (abilityBonus && v === 0 ? undefined : set({ bonusAmount: v }))}
              />
            </span>
            <span className="effect-field">
              <span className="rec-cell-label rec-left-label">Applies to</span>
              <InkPicker
                value={abilityBonus ? comp.overrideStat : comp.bonusTarget}
                options={targetOptions}
                label="Applies to"
                onChange={(v) =>
                  (abilityStats as readonly string[]).includes(v)
                    ? set({ kind: 'statOverride', overrideStat: v as EffectComponent['overrideStat'], bonusAmount: comp.bonusAmount || 1 })
                    : set({ kind: 'flatBonus', bonusTarget: v as EffectComponent['bonusTarget'] })
                }
              />
            </span>
            <span className="rec-soft">= {componentSummary(comp)}</span>
          </div>
          {!abilityBonus && comp.bonusTarget === 'allSaves' && (
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
          {!abilityBonus && comp.bonusTarget === 'damage' && (
            <p className="rec-soft">No single Damage number exists on the sheet — this only adds a reminder row to Damage Modifiers.</p>
          )}
        </>
      )}
      {shownKind === 'statOverride' && (
        <div className="effect-editor-row">
          <span className="effect-field">
            <span className="rec-cell-label rec-left-label">Stat</span>
            <InkPicker value={comp.overrideStat} options={statOptions} label="Stat" onChange={(v) => set({ overrideStat: v as EffectComponent['overrideStat'] })} />
          </span>
          <span className="effect-field">
            <span className="rec-cell-label rec-left-label">Becomes</span>
            <InkNumber className="effect-number" value={comp.overrideValue} min={-10} max={99} label="New value" onChange={(v) => set({ overrideValue: v })} />
          </span>
        </div>
      )}
      {comp.kind === 'attackNegation' && (
        <div className="effect-editor-row">
          <span className="rec-soft">Attacks negated</span>
          <InkNumber className="effect-number" value={comp.maxUses} min={1} max={99} label="Attacks negated" onChange={(v) => set({ maxUses: v })} />
        </div>
      )}
      {comp.kind === 'bankedHeal' && (
        <>
          <div className="effect-editor-row">
            <span className="rec-soft">HP pool</span>
            <InkNumber className="effect-number" value={comp.maxUses} min={1} max={999} label="HP pool" onChange={(v) => set({ maxUses: v })} />
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
            <InkNumber className="effect-number" value={comp.tempHPGranted} min={1} max={999} label="Temporary HP" onChange={(v) => set({ tempHPGranted: v })} />
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
    <PaperModal title={isNew ? 'New Effect' : 'Edit Effect'} onClose={onClose} wide>
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

export function ActiveEffectsWindow({ c, edit, onClose }: { c: PlayerCharacter; edit?: Edit; onClose: () => void }) {
  const [editing, setEditing] = useState<{ effect: ActiveEffect; isNew: boolean } | null>(null)
  const effects = c.activeEffects ?? []
  const { confirm, dialog } = useConfirm()
  return createPortal(
    <PaperModal title="Active Effects" subtitle="Spells, potions, and other effects with a finite duration." onClose={onClose}>
      <div className="effects-window">
      {dialog}
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
                  onClick={async () => {
                    if (await confirm(`End "${effect.name || 'this effect'}"? Its changes to the sheet are undone.`, 'End effect')) edit((x) => endEffect(x, effect.id))
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
    </PaperModal>,
    document.body,
  )
}

/**
 * Contador sempre à vista dos ataques negados (Stone Skin e afins): fica
 * flutuando no canto da ficha, em qualquer aba, enquanto o efeito durar
 * (activeAttackNegations do iPad). Cada ataque que bate conta um.
 */
export function AttackNegationFloat({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const negations = (c.activeEffects ?? []).flatMap((effect) =>
    effect.components.filter((comp) => comp.kind === 'attackNegation').map((comp) => ({ effect, comp })),
  )
  if (negations.length === 0) return null
  return (
    <aside className="negation-float" aria-label="Attacks negated">
      <span className="negation-float-title">Attacks negated</span>
      {negations.map(({ effect, comp }) => {
        const left = Math.max(0, comp.maxUses - comp.usedCount)
        return (
          <div key={comp.id} className={left === 0 ? 'negation-row negation-done' : 'negation-row'}>
            <span className="rec-soft">{effect.name || 'Effect'}</span>
            <span className="effect-uses">
              <span className="negation-left">
                {left === 0 ? 'none left' : `${left} left`} <span className="rec-soft">of {comp.maxUses}</span>
              </span>
              {edit && (
                <Counter
                  count={comp.usedCount}
                  max={comp.maxUses}
                  exhausted={left === 0}
                  label={`${effect.name || 'Effect'} attacks negated`}
                  onChange={(d) => edit((x) => adjustUses(x, effect.id, comp.id, d))}
                />
              )}
            </span>
          </div>
        )
      })}
    </aside>
  )
}
