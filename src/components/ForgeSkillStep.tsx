import { useEffect, useState } from 'react'
import { loadAllKits, type Kit } from '../data/kits'
import { loadData } from '../data/load'
import type { Proficiency } from '../data/proficiencies'
import { allowedBySettings } from '../rules/campaignFilter'
import { nonweaponProficiencySlots, nonweaponSlotsUsed } from '../rules/multiclass'
import {
  characterProficiencyGroups,
  inCharacterGroups,
  kitBonusProficiencies,
  nonweaponCost,
  proficiencyGroupsIn,
  syncBonusProficiencies,
  type ProficiencyGroup,
} from '../rules/proficiencyCost'
import { proficiencyFromCompendium } from '../rules/sheetEdits'
import type { PlayerCharacter } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeSlotSockets } from './ForgeParts'
import { ProficiencyDetail } from './ProficiencyDetail'

// Etapa 7 do The Forge: proficiências nonweapon. Slots pela classe e nível
// (Tabela 34; Inteligência soma). Custa os slots do livro nos grupos da classe
// ou em General e um a mais fora deles (Tabela 37, proficiencyCost.ts). As
// bônus de raça e kit entram de graça (syncBonusProficiencies). Gastar além
// dos slots só avisa — o mestre decide. Vai para a ficha do mesmo jeito que
// pelo seletor dela (proficiencyFromCompendium).

type GroupFilter = 'mine' | 'all' | ProficiencyGroup

const groupFilters: { key: GroupFilter; label: string }[] = [
  { key: 'mine', label: 'Your groups' },
  { key: 'General', label: 'General' },
  { key: 'Warrior', label: 'Warrior' },
  { key: 'Priest', label: 'Priest' },
  { key: 'Rogue', label: 'Rogue' },
  { key: 'Wizard', label: 'Wizard' },
  { key: 'Psionicist', label: 'Psionicist' },
  { key: 'all', label: 'All' },
]

const PREVIEW = 24

const abilityShort: Record<string, string> = {
  Strength: 'Str',
  Dexterity: 'Dex',
  Constitution: 'Con',
  Intelligence: 'Int',
  Wisdom: 'Wis',
  Charisma: 'Cha',
}

const settingAllows = (p: Proficiency, settings: string[]) =>
  p.campaignSettings.length === 0 || p.campaignSettings.some((s) => allowedBySettings(s === 'Core' ? null : s, settings))

export function ForgeSkillStep({
  draft,
  mutate,
  settings,
  onBack,
  onFinish,
  creating,
  finishLabel = 'Create character',
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  settings: string[]
  onBack: () => void
  onFinish: () => void
  creating: boolean
  /** Psionicista ainda tem a etapa dos poderes: o botão leva até ela. */
  finishLabel?: string
}) {
  const [help, setHelp] = useState(false)
  const [filter, setFilter] = useState<GroupFilter>('mine')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [compendium, setCompendium] = useState<Proficiency[] | null>(null)
  const [kit, setKit] = useState<Kit | null>(null)
  const [reading, setReading] = useState<Proficiency | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadData<Proficiency[]>('proficiencies.json'), loadAllKits()]).then(([profs, kits]) => {
      if (cancelled) return
      const chosenKit = kits.find((k) => k.name === draft.kit) ?? null
      setCompendium(profs)
      setKit(chosenKit)
      // As bônus de raça e kit, já com os escolhidos nas etapas 3 e 4.
      mutate((c) => syncBonusProficiencies(c, kitBonusProficiencies(chosenKit, profs), profs))
    })
    return () => {
      cancelled = true
    }
    // Só ao entrar na etapa: raça e kit não mudam aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skillTotal = nonweaponProficiencySlots(draft)
  const skillUsed = nonweaponSlotsUsed(draft)
  const groups = characterProficiencyGroups(draft)
  const recommended = new Set((kit?.mechanics.proficiencies?.recommended ?? []).map((n) => n.toLowerCase()))
  const query = search.trim().toLowerCase()

  const granted = (draft.proficiencies ?? []).filter((p) => p.grantedBy)
  const ownedIDs = new Set((draft.proficiencies ?? []).flatMap((p) => (p.matchedProficiencyID ? [p.matchedProficiencyID] : [])))

  const toggleSkill = (p: Proficiency, cost: number) =>
    mutate((c) => {
      const list = c.proficiencies ?? []
      const mine = list.find((e) => e.matchedProficiencyID === p.id && !e.grantedBy)
      c.proficiencies = mine ? list.filter((e) => e !== mine) : [...list, { ...proficiencyFromCompendium(p, c.abilities), slots: cost }]
    })

  const shownSkills = (compendium ?? [])
    .filter((p) => settingAllows(p, settings))
    .filter((p) => {
      if (filter === 'all') return true
      if (filter === 'mine') return inCharacterGroups(p.mechanics.groups, groups)
      return proficiencyGroupsIn(p.mechanics.groups).has(filter)
    })
    .filter((p) => query === '' || p.name.toLowerCase().includes(query))
    .filter((p) => !granted.some((g) => g.matchedProficiencyID === p.id))
  const visibleSkills = showAll || query !== '' ? shownSkills : shownSkills.slice(0, PREVIEW)
  const open = skillTotal - skillUsed

  // Back / Next no topo e no fim da etapa (o mesmo rodapé).
  const nav = { onBack, onNext: onFinish, nextLabel: creating ? 'Creating…' : finishLabel, ready: !creating }

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 7</p>
      <h2 className="forge-title">
        Hone Your Skills
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Everything you learned outside the fighting: the trades, lore and knacks you picked up along the way.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch05_proficiencies">
          Your class and level give the slots (PHB Table 34); a high Intelligence adds more. A skill from one of your class&rsquo;s groups — or
          General — costs the slots in the book; from any other group it costs one slot more (Table 37). What your kindred or kit grants comes
          free. Going over your slots only warns you.
        </ForgeHelpNote>
      )}

      <div className="rule" aria-hidden="true">
        <span className="rule-gem" />
      </div>

      <div className="slot-pools">
        <ForgeSlotSockets label="Skill slots" used={skillUsed} total={skillTotal} />
      </div>
      {skillUsed > skillTotal && <p className="forge-warn-line">! {skillUsed - skillTotal} skill slot(s) over what your class, level and Intelligence give.</p>}

      <div className="forge-search">
        <input aria-label="Search skills" placeholder="Search the skills…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {compendium === null && <p className="forge-panel-note">Opening the books…</p>}

      {compendium !== null && (
        <>
          {granted.length > 0 && (
            <>
              <p className="forge-panel-label">Granted free</p>
              <div className="kit-grid">
                {granted.map((p) => {
                  const entry = compendium.find((x) => x.id === p.matchedProficiencyID)
                  return (
                    <div key={p.id ?? p.name} className="kit-tile kit-tile-granted">
                      <div className="kit-tile-hit kit-tile-static">
                        <span className="kit-tile-name">{p.name}</span>
                        <span className="kit-tile-sub">
                          from your {p.grantedBy?.kind}: {p.grantedBy?.name}
                        </span>
                      </div>
                      {entry && (
                        <button type="button" className="kit-tile-about" onClick={() => setReading(entry)}>
                          about
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="method-row" role="group" aria-label="Filter by group">
            {groupFilters.map(({ key, label }) => (
              <button key={key} type="button" className={filter === key ? 'method-pill method-active' : 'method-pill'} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="kit-grid">
            {visibleSkills.map((p) => {
              const cost = nonweaponCost(p, groups)
              const outside = !inCharacterGroups(p.mechanics.groups, groups)
              const chosen = ownedIDs.has(p.id)
              const ability = abilityShort[p.mechanics.relevantAbility]
              const score = ability ? (draft.abilities[p.mechanics.relevantAbility.toLowerCase() as keyof PlayerCharacter['abilities']] as number) : null
              return (
                <div key={p.id} className={chosen ? 'kit-tile kit-tile-chosen' : 'kit-tile'}>
                  <button type="button" className="kit-tile-hit" aria-pressed={chosen} onClick={() => toggleSkill(p, cost)}>
                    <span className="kit-tile-name">{p.name}</span>
                    <span className="adj-pills adj-pills-left">
                      <span className="slot-cost" aria-label={`${cost} slot${cost > 1 ? 's' : ''}`}>
                        {Array.from({ length: cost }, (_, i) => (
                          <span key={i} className="slot-socket slot-used" />
                        ))}
                      </span>
                      {ability && score !== null && (
                        <span className="adj-pill">
                          {ability} {p.mechanics.checkModifier >= 0 ? '+' : '−'}
                          {Math.abs(p.mechanics.checkModifier)} → {score + p.mechanics.checkModifier}
                        </span>
                      )}
                      {outside && <span className="adj-pill adj-down">other group +1</span>}
                      {recommended.has(p.name.toLowerCase()) && <span className="adj-pill adj-up">kit suggests</span>}
                    </span>
                  </button>
                  <button type="button" className="kit-tile-about" onClick={() => setReading(p)}>
                    about
                  </button>
                </div>
              )
            })}
          </div>
          {!showAll && query === '' && shownSkills.length > PREVIEW && (
            <div className="method-row">
              <button type="button" className="method-pill" onClick={() => setShowAll(true)}>
                Show all {shownSkills.length} skills
              </button>
            </div>
          )}
          {shownSkills.length === 0 && <p className="forge-panel-note">No skill matches.</p>}
        </>
      )}

      {open > 0 && (
        <p className="forge-panel-note">
          {open} skill slot{open > 1 ? 's' : ''} still open — spend {open > 1 ? 'them' : 'it'} now or save for later, if your DM allows.
        </p>
      )}

      {reading && <ProficiencyDetail proficiency={reading} onClose={() => setReading(null)} />}

      <ForgeFooter {...nav} />
    </section>
  )
}
