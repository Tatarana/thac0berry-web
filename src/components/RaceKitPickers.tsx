import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadAllKits, type Kit } from '../data/kits'
import { normalize } from '../lib/search'
import { allClasses, filterApplicableKits, kitWarnings } from '../rules/multiclass'
import { groupRaces, hasAbilityRequirements, kitsAllowedFor, matchRace, raceAdjustmentsText, raceWarnings, selectableRaces, type RaceName } from '../rules/raceKit'
import { vistaniTribeForRoll, vistaniTribes, vistaniTribeWarnings, type VistaniTribe } from '../rules/vistani'
import type { CharacterClass, PlayerCharacter } from '../types/library'
import { PaperModal } from './DetailBits'
import { KitApplicableFilter } from './KitApplicableFilter'
import { KitDetail } from './KitDetail'
import { RaceDetail } from './RaceDetail'

// Escolher raça (RacePickerSheet do iPad: se a ficha fica fora da Tabela 7,
// mostra os avisos antes de confirmar; desde as raças em dados, só as jogáveis dos
// cenários da campanha, agrupadas por origem) e kit
// (KitPickerSheet: kits da classe, busca por nome ou divindade, "None").

export function RacePicker({
  character,
  campaignSettings = null,
  onChoose,
  onClose,
}: {
  character: Pick<PlayerCharacter, 'race' | 'abilities' | 'characterClass' | 'level' | 'kit'>
  /** Cenários da campanha da ficha: só as raças jogáveis do Core e desses cenários entram na lista (a raça atual fica sempre); sem filtro, todas as jogáveis. */
  campaignSettings?: string[] | null
  onChoose: (race: RaceName) => void
  onClose: () => void
}) {
  const [pending, setPending] = useState<RaceName | null>(null)
  const [detail, setDetail] = useState<RaceName | null>(null)
  const current = matchRace(character.race)
  const groups = groupRaces(selectableRaces(campaignSettings, current))
  const warnings = pending ? raceWarnings(pending, character, campaignSettings) : []
  return createPortal(
    <PaperModal title={pending ? `${pending}?` : 'Choose Race'} onClose={onClose}>
      {pending ? (
        <div className="race-warning">
          <p className="paper-soft">This character doesn't fit the {pending} rules:</p>
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
          {groups.map(({ group, races }) => (
            <li key={group}>
              <p className="paper-label">{group}</p>
              <ul className="slot-choices">
                {races.map((race) => (
                  <li key={race} className="kit-choice">
                    <button
                      className="slot-choice"
                      onClick={() => (raceWarnings(race, character, campaignSettings).length > 0 ? setPending(race) : onChoose(race))}
                    >
                      <span className="slot-choice-fav">{current === race ? '★' : ''}</span>
                      <span className="rec-value">{race}</span>
                      <span className="rec-soft">
                        {[raceAdjustmentsText(race), hasAbilityRequirements(race) ? 'ability score minimums apply' : 'no ability score restrictions']
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                    <button className="info-btn" aria-label={`About ${race}`} title="Read about this race" onClick={() => setDetail(race)}>
                      ⓘ
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="paper-soft">Choosing a race applies its ability adjustments to the scores on the sheet.</li>
        </ul>
      )}
      {detail && <RaceDetail race={detail} onClose={() => setDetail(null)} />}
    </PaperModal>,
    document.body,
  )
}

/**
 * Tribo de Vistani (Domains of Dread, Tabela 68; só faz sentido com a raça
 * Half-Vistani): sorteio em 1d100 ou escolha livre. Restrição de classe por
 * tribo é só aviso (como o resto do app, não bloqueia).
 */
export function VistaniTribePicker({
  character,
  onChoose,
  onClose,
}: {
  character: Pick<PlayerCharacter, 'characterClass'>
  onChoose: (tribe: VistaniTribe) => void
  onClose: () => void
}) {
  return createPortal(
    <PaperModal title="Choose a Tribe" subtitle="Table 68: Vistani Ancestry — roll 1d100, or pick one" onClose={onClose}>
      <div className="chip-row">
        <button
          className="chip chip-on"
          onClick={() => {
            const tribe = vistaniTribeForRoll(1 + Math.floor(Math.random() * 100))
            if (tribe) onChoose(tribe)
          }}
        >
          Roll 1d100
        </button>
      </div>
      <ul className="slot-choices">
        {vistaniTribes.map((tribe) => (
          <li key={tribe.id}>
            <button className="slot-choice" onClick={() => onChoose(tribe)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">{tribe.name}</span>
              <span className="rec-soft">{tribe.summary}</span>
              {vistaniTribeWarnings(tribe, character.characterClass as CharacterClass).map((w) => (
                <span key={w} className="kit-warning">
                  ⚠ {w}
                </span>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </PaperModal>,
    document.body,
  )
}

export function KitPicker({
  character,
  campaignSettings = null,
  onChoose,
  onClose,
}: {
  character: Pick<PlayerCharacter, 'kit' | 'characterClass' | 'level' | 'race' | 'multiClasses' | 'formerClasses'>
  /** Cenários da campanha: os kits de Ravenloft só aparecem com ele ligado. */
  campaignSettings?: string[] | null
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
    // Classe dupla (CBH): o kit pode vir de qualquer classe, inclusive as anteriores.
    const classes = allClasses(character).map((k) => k.characterClass)
    void loadAllKits().then((all) => {
      const seen = new Set<string>()
      const list = classes
        .flatMap((cls) => kitsAllowedFor(all, cls))
        .filter((k) => (seen.has(k.id) ? false : (seen.add(k.id), true)))
      setKits(list.sort((a, b) => a.name.localeCompare(b.name)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.characterClass, JSON.stringify(character.multiClasses ?? []), JSON.stringify(character.formerClasses ?? []), JSON.stringify(campaignSettings)])
  // Filtro "Only applicable kits" (ligado por padrão; o kit já escolhido fica sempre).
  const [onlyApplicable, setOnlyApplicable] = useState(true)
  const applicable = useMemo(
    () => filterApplicableKits(kits ?? [], character, character.kit, onlyApplicable),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kits, onlyApplicable, character.kit, character.race, character.characterClass, JSON.stringify(character.multiClasses ?? [])],
  )
  const filtered = useMemo(() => {
    const target = normalize(query)
    return applicable.filter((k) => target === '' || normalize(k.name).includes(target) || normalize(k.deity ?? '').includes(target))
  }, [applicable, query])

  return createPortal(
    <PaperModal title="Choose a Kit" onClose={onClose}>
      <label className="slot-write">
        <span className="rec-cell-label rec-left-label">Search</span>
        <input className="ink-input" value={query} placeholder="kit or deity name" autoFocus onChange={(e) => setQuery(e.target.value)} />
      </label>
      {kits === null && <p className="paper-soft">Loading kits…</p>}
      {kits !== null && <KitApplicableFilter on={onlyApplicable} hidden={kits.length - applicable.length} onToggle={() => setOnlyApplicable(!onlyApplicable)} />}
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
              {kitWarnings(kit, character, campaignSettings).map((w) => (
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
