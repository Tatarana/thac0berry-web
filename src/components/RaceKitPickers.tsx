import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadKits, type Kit } from '../data/kits'
import { normalize } from '../lib/search'
import { classLevels, kitWarnings } from '../rules/multiclass'
import { hasAbilityRequirements, kitsAllowedFor, matchRace, raceAdjustmentsText, races, raceWarnings, type RaceName } from '../rules/raceKit'
import type { PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import { KitDetail } from './KitDetail'

// Escolher raça (RacePickerSheet do iPad: lista das raças do PHB; se a ficha
// fica fora da Tabela 7, mostra os avisos antes de confirmar) e kit
// (KitPickerSheet: kits da classe, busca por nome ou divindade, "None").

export function RacePicker({
  character,
  onChoose,
  onClose,
}: {
  character: Pick<PlayerCharacter, 'race' | 'abilities' | 'characterClass' | 'level'>
  onChoose: (race: RaceName) => void
  onClose: () => void
}) {
  const [pending, setPending] = useState<RaceName | null>(null)
  const current = matchRace(character.race)
  const warnings = pending ? raceWarnings(pending, character) : []
  return createPortal(
    <PaperModal title={pending ? `${pending}?` : 'Choose Race'} onClose={onClose}>
      {pending ? (
        <div className="race-warning">
          <p className="paper-soft">This character doesn't fit the {pending} rules (PHB Table 7):</p>
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="slot-actions">
            <button className="paper-link" onClick={() => setPending(null)}>back</button>
            <button className="paper-link" onClick={() => onChoose(pending)}>choose {pending} anyway</button>
          </div>
        </div>
      ) : (
        <ul className="slot-choices">
          {races.map((race) => (
            <li key={race}>
              <button
                className="slot-choice"
                onClick={() => (raceWarnings(race, character).length > 0 ? setPending(race) : onChoose(race))}
              >
                <span className="slot-choice-fav">{current === race ? '★' : ''}</span>
                <span className="rec-value">{race}</span>
                <span className="rec-soft">
                  {[raceAdjustmentsText(race), hasAbilityRequirements(race) ? 'ability score minimums apply' : 'no ability score restrictions']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
          <li className="paper-soft">Choosing a race applies its ability adjustments to the scores on the sheet.</li>
        </ul>
      )}
    </PaperModal>,
    document.body,
  )
}

let allKits: Promise<Kit[]> | null = null
const loadAllKits = () => {
  allKits ??= Promise.all((['Priest', 'Wizard', 'Warrior', 'Rogue', 'Psionicist'] as const).map((g) => loadKits(g))).then((groups) => groups.flat())
  return allKits
}

export function KitPicker({
  character,
  onChoose,
  onClose,
}: {
  character: Pick<PlayerCharacter, 'kit' | 'characterClass' | 'level' | 'race' | 'multiClasses'>
  /** null = "None" (sem kit). */
  onChoose: (kit: Kit | null) => void
  onClose: () => void
}) {
  const [kits, setKits] = useState<Kit[] | null>(null)
  const [query, setQuery] = useState('')
  // Descrição do kit (KitDetailSheet do iPad, aberto pelo ⓘ da linha).
  const [detail, setDetail] = useState<Kit | null>(null)
  useEffect(() => {
    // Multiclasse (MC5): os kits de todas as classes do personagem (um kit no total).
    const classes = classLevels(character).map((k) => k.characterClass)
    void loadAllKits().then((all) => {
      const seen = new Set<string>()
      const list = classes.flatMap((cls) => kitsAllowedFor(all, cls)).filter((k) => (seen.has(k.id) ? false : (seen.add(k.id), true)))
      setKits(list.sort((a, b) => a.name.localeCompare(b.name)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.characterClass, JSON.stringify(character.multiClasses ?? [])])
  const filtered = useMemo(() => {
    const target = normalize(query)
    return (kits ?? []).filter((k) => target === '' || normalize(k.name).includes(target) || normalize(k.deity ?? '').includes(target))
  }, [kits, query])

  return createPortal(
    <PaperModal title="Choose a Kit" onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input className="ink-input" value={query} placeholder="kit or deity name" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      {kits === null && <p className="paper-soft">Loading kits…</p>}
      <ul className="slot-choices">
        <li>
          <button className="slot-choice" onClick={() => onChoose(null)}>
            <span className="slot-choice-fav">{character.kit ? '' : '★'}</span>
            <span className="rec-value">None</span>
            <span className="rec-soft">no kit</span>
          </button>
        </li>
        {filtered.map((kit) => (
          <li key={kit.id} className="kit-choice">
            <button className="slot-choice" onClick={() => onChoose(kit)}>
              <span className="slot-choice-fav">{character.kit === kit.name ? '★' : ''}</span>
              <span className="rec-value">{kit.name}</span>
              <span className="rec-soft">{[kit.classEligibility.subclass, kit.deity].filter(Boolean).join(' · ')}</span>
              {kitWarnings(kit, character).map((w) => (
                <span key={w} className="kit-warning">
                  ⚠ {w}
                </span>
              ))}
            </button>
            <button className="info-btn" aria-label={`About ${kit.name}`} title="Read the kit description" onClick={() => setDetail(kit)}>
              ⓘ
            </button>
          </li>
        ))}
        {kits !== null && filtered.length === 0 && <li className="paper-soft">No kit for this class matches.</li>}
      </ul>
      {detail && (
        <>
          <KitDetail kit={detail} onClose={() => setDetail(null)} />
          <div className="kit-detail-choose">
            <button
              className="consequence-apply"
              onClick={() => {
                const chosen = detail
                setDetail(null)
                onChoose(chosen)
              }}
            >
              Choose {detail.name}
            </button>
          </div>
        </>
      )}
    </PaperModal>,
    document.body,
  )
}
