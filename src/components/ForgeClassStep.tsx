import { useEffect, useState } from 'react'
import { loadAllKits, type Kit } from '../data/kits'
import { changeClass, setFormerClasses, setMultiClasses } from '../rules/consequences'
import {
  allClasses,
  bardCombosFor,
  classLevels,
  classWarnings,
  combosFor,
  dualClassOptions,
  dualHitPointsRule,
  hitPointsRule,
  isDualClass,
  isMultiClass,
  kitWarnings,
  multiClassOptions,
} from '../rules/multiclass'
import { kitsAllowedFor, levelLimit, matchRace } from '../rules/raceKit'
import { ravenloftClasses, ravenloftWarnings } from '../rules/ravenloft'
import { canonicalClass } from '../rules/rules'
import type { CharacterClass, ClassLevel, PlayerCharacter } from '../types/library'
import { KitDetail } from './KitDetail'
import { RuleLink } from './RuleLink'

// Etapa 4 do The Forge: classe principal, com o ramo natural de classe dupla
// (humano) ou multiclasse (semi-humano) de multiclass.ts, e depois o kit —
// mesma lógica e dados de kits.ts/RaceKitPickers.tsx, numa galeria de cartões
// em vez de uma janela pequena.

const classOptions: CharacterClass[] = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', ...ravenloftClasses]

export function ForgeClassStep({
  draft,
  mutate,
  onNext,
  onBack,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onNext: () => void
  onBack: () => void
}) {
  const race = matchRace(draft.race)
  const primary = canonicalClass(draft.characterClass)

  const selectPrimary = (cls: CharacterClass) => {
    mutate((c) => {
      changeClass(c, cls, null)
      c.multiClasses = null
      c.formerClasses = null
    })
  }

  return (
    <section className="forge-step">
      <h2 className="forge-step-title">
        Class &amp; Kit
        <RuleLink ruleID="phb_ch03_multi_class_and_dual_class_characters" title="Multi-class and dual-class characters" />
      </h2>

      <div className="forge-grid">
        {classOptions.map((cls) => {
          const canonical = canonicalClass(cls)
          const limit = race ? levelLimit(race, cls) : 'unlimited'
          const limitText = limit === 'unlimited' ? 'no level limit for this race' : limit === 'forbidden' ? `${race} cannot normally be a ${canonical}` : `${race} is limited to level ${limit} as ${canonical}`
          const warnings = ravenloftWarnings({ characterClass: cls, abilities: draft.abilities, race: draft.race }, null)
          return (
            <button
              key={cls}
              type="button"
              className={primary === canonical ? 'ember-card forge-card-selected' : 'ember-card'}
              onClick={() => selectPrimary(cls)}
            >
              <span className="card-title">
                {primary === canonical ? '★ ' : ''}
                {canonical}
              </span>
              <span className="soft">{race ? limitText : 'choose a race first for the level limit'}</span>
              {limit === 'forbidden' && <span className="forge-warn">⚠ {limitText}</span>}
              {warnings.map((w) => (
                <span key={w} className="forge-warn">
                  ⚠ {w}
                </span>
              ))}
            </button>
          )
        })}
      </div>

      {race === 'Human' && <DualClassBranch draft={draft} mutate={mutate} />}
      {race && race !== 'Human' && <MultiClassBranch draft={draft} mutate={mutate} />}

      <KitGallery draft={draft} mutate={mutate} />

      <div className="btn-row">
        <button className="btn" onClick={onBack}>← Back</button>
        <button className="btn" onClick={onNext}>
          Next →
        </button>
      </div>
    </section>
  )
}

/** Semi-humano: acrescentar classes (multiclasse), com as combinações padrão da raça como atalho. */
function MultiClassBranch({ draft, mutate }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void }) {
  const [open, setOpen] = useState(isMultiClass(draft))
  const extra = draft.multiClasses ?? []
  const all = classLevels(draft)
  const taken = new Set(all.map((k) => canonicalClass(k.characterClass)))
  const combos = combosFor(draft.race)
  const bardCombos = bardCombosFor(draft.race)
  const warnings = classWarnings(draft)
  const primary = canonicalClass(draft.characterClass)

  const change = (multiClasses: ClassLevel[]) => mutate((c) => setMultiClasses(c, multiClasses))

  const adopt = (combo: string[]) => {
    const wanted = combo.map((n) => (n === 'Illusionist' ? 'Mage' : n)).filter((n) => n !== primary)
    const keep = extra.filter((k) => wanted.includes(canonicalClass(k.characterClass)))
    const add = wanted.filter((n) => !keep.some((k) => canonicalClass(k.characterClass) === n)).map((n) => ({ characterClass: n as CharacterClass, level: 1 }))
    change([...keep, ...add])
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Make this a multi-class character ({draft.race} demihuman)
      </button>
    )
  }

  return (
    <div className="ember-card">
      <p className="soft">Only demihumans can be multi-class. Experience is divided equally between the classes; the character uses the best THAC0 and the best saving throw among them.</p>
      <div className="forge-chip-row">
        {extra.map((k, index) => (
          <button key={`${k.characterClass}-${index}`} className="forge-chip forge-chip-on" onClick={() => change(extra.filter((_, i) => i !== index))}>
            {canonicalClass(k.characterClass)} {k.level} ✕
          </button>
        ))}
      </div>
      <p className="forge-sub-label">Add a class</p>
      <div className="forge-chip-row">
        {multiClassOptions.filter((o) => !taken.has(canonicalClass(o))).map((o) => (
          <button key={o} className="forge-chip" onClick={() => change([...extra, { characterClass: o, level: 1 }])}>
            + {o}
          </button>
        ))}
      </div>
      {combos.length > 0 && (
        <>
          <p className="forge-sub-label">Standard {draft.race} combinations</p>
          <div className="forge-chip-row">
            {combos.map((combo) => (
              <button key={combo.join('/')} className="forge-chip" onClick={() => adopt(combo)}>
                {combo.join('/')}
              </button>
            ))}
          </div>
        </>
      )}
      {bardCombos.length > 0 && (
        <>
          <p className="forge-sub-label">{draft.race} bard combinations (with the kit)</p>
          <div className="forge-chip-row">
            {bardCombos.map((combo) => (
              <button key={combo.classes.join('/')} className="forge-chip" title={`Kit: ${combo.kits.join(' or ')}`} onClick={() => adopt(combo.classes)}>
                {combo.classes.join('/')} · {combo.kits.join(', ')}
              </button>
            ))}
          </div>
        </>
      )}
      {warnings.map((w) => (
        <p key={w} className="forge-warn">⚠ {w}</p>
      ))}
      {all.length > 1 && <p className="soft">Hit points (work them out by hand on the sheet): {hitPointsRule(all)}</p>}
      <button className="btn" onClick={() => { setOpen(false); change([]) }}>
        Cancel multi-class
      </button>
    </div>
  )
}

/** Humano: declarar classes anteriores (classe dupla já em andamento, trazida de outro lugar). */
function DualClassBranch({ draft, mutate }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void }) {
  const [open, setOpen] = useState(isDualClass(draft))
  const former = draft.formerClasses ?? []
  const current = canonicalClass(draft.characterClass)
  const taken = new Set(allClasses(draft).map((k) => canonicalClass(k.characterClass)))
  const options = dualClassOptions.filter((o) => !taken.has(canonicalClass(o)))
  const warnings = classWarnings(draft)

  const changeFormer = (formerClasses: ClassLevel[]) => mutate((c) => setFormerClasses(c, formerClasses))

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + This human is already dual-classed
      </button>
    )
  }

  return (
    <div className="ember-card">
      <p className="soft">
        Only humans can be dual-classed. The class chosen above is the one that keeps advancing; a former class freezes at the level it was left
        (set the level for each one here) and the Starting point step sets the level of the current class.
      </p>
      <div className="forge-chip-row">
        {former.map((k, index) => (
          <span key={`${k.characterClass}-${index}`} className="forge-row">
            <span className="forge-chip forge-chip-on">ex-{canonicalClass(k.characterClass)}</span>
            <input
              type="number"
              className="forge-field"
              min={1}
              max={30}
              value={k.level}
              aria-label={`${canonicalClass(k.characterClass)} level`}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v) && v >= 1) changeFormer(former.map((x, i) => (i === index ? { ...x, level: v } : x)))
              }}
            />
            <button className="forge-link" onClick={() => changeFormer(former.filter((_, i) => i !== index))}>
              remove
            </button>
          </span>
        ))}
      </div>
      <p className="forge-sub-label">Add a former class</p>
      <div className="forge-chip-row">
        {options.map((o) => (
          <button key={o} className="forge-chip" onClick={() => changeFormer([...former, { characterClass: o, level: 2 }])}>
            + ex-{o}
          </button>
        ))}
      </div>
      {current && former.some((k) => canonicalClass(k.characterClass) === current) && (
        <p className="forge-warn">⚠ {current} is already a former class: a dual-class character cannot go back to a class he left.</p>
      )}
      {warnings.map((w) => (
        <p key={w} className="forge-warn">⚠ {w}</p>
      ))}
      {former.length > 0 && <p className="soft">Hit points (work them out by hand on the sheet): {dualHitPointsRule(draft)}</p>}
      <button className="btn" onClick={() => { setOpen(false); changeFormer([]) }}>
        Cancel dual-class
      </button>
    </div>
  )
}

/** Kit da classe (ou de qualquer classe do personagem, no multiclasse/classe dupla) — igual ao KitPicker da ficha. */
function KitGallery({ draft, mutate }: { draft: PlayerCharacter; mutate: (fn: (c: PlayerCharacter) => void) => void }) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [detail, setDetail] = useState<Kit | null>(null)

  useEffect(() => {
    const classes = allClasses(draft).map((k) => k.characterClass)
    void loadAllKits().then((all) => {
      const seen = new Set<string>()
      const list = classes.flatMap((cls) => kitsAllowedFor(all, cls)).filter((k) => (seen.has(k.id) ? false : (seen.add(k.id), true)))
      setKits(list.sort((a, b) => a.name.localeCompare(b.name)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.characterClass, JSON.stringify(draft.multiClasses ?? []), JSON.stringify(draft.formerClasses ?? [])])

  const chooseKit = (kit: Kit | null) => mutate((c) => { c.kit = kit ? kit.name : null })

  return (
    <div>
      <p className="forge-sub-label">Kit</p>
      {kits === null && <p className="soft">Loading kits…</p>}
      <div className="forge-grid">
        <button type="button" className={draft.kit ? 'ember-card' : 'ember-card forge-card-selected'} onClick={() => chooseKit(null)}>
          <span className="card-title">{!draft.kit ? '★ ' : ''}None</span>
          <span className="soft">no kit</span>
        </button>
        {(kits ?? []).map((kit) => {
          const warnings = kitWarnings(kit, draft, null)
          return (
            <div key={kit.id} className={draft.kit === kit.name ? 'ember-card forge-card-selected' : 'ember-card'}>
              <button type="button" className="forge-kit-hit" onClick={() => chooseKit(kit)}>
                <span className="card-title">
                  {draft.kit === kit.name ? '★ ' : ''}
                  {kit.name}
                </span>
                <span className="soft">{[kit.classEligibility.subclass, kit.deity].filter(Boolean).join(' · ')}</span>
              </button>
              {warnings.map((w) => (
                <span key={w} className="forge-warn">⚠ {w}</span>
              ))}
              <button className="forge-link" onClick={() => setDetail(kit)}>
                about this kit
              </button>
            </div>
          )
        })}
        {kits !== null && kits.length === 0 && <p className="soft">No kit for this class.</p>}
      </div>
      {detail && <KitDetail kit={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
