import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { InitiativeBar, InitiativeWindow, RoundsWindow } from '../components/CombatInitiative'
import { MoraleWindow } from '../components/CombatMorale'
import { AddMonsterWindow, AddPersonWindow, CombatSettingsWindow, CombatTable } from '../components/CombatParts'
import { DmOnly } from '../components/DmOnly'
import { MonsterDetail } from '../components/MonsterDetail'
import { loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { useCombatStore } from '../lib/combatStore'
import { useInitiativeModifiers } from '../lib/initiativeTables'
import {
  actingNow as actingIDs,
  initiativeByCombatant,
  initiativeSteps,
  missingRolls,
  newEncounter,
  newInitiative,
  startRound,
  type Combatant,
  type Encounter,
} from '../rules/combat'

// Combat Tracker (ferramenta do DM, docs/controle-de-combate.md): encontros
// guardados no aparelho, com os combatentes de cada lado. CT1: combatentes,
// PV, estados e condições; CT2: iniciativa e rodadas; CT3: moral; tabelas
// (CT4) entram depois.

export function CombatTracker() {
  return (
    <DmOnly>
      <Tracker />
    </DmOnly>
  )
}

function Tracker() {
  const { store, update, saveError } = useCombatStore()
  const [adding, setAdding] = useState<'monster' | 'pc' | 'npc' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [monsterIndex, setMonsterIndex] = useState<MonsterIndexEntry[] | null>(null)
  const [openMonster, setOpenMonster] = useState<MonsterIndexEntry | null>(null)
  const [moraleID, setMoraleID] = useState<string | null>(null)
  const [initiativeOpen, setInitiativeOpen] = useState(false)
  const [roundsOpen, setRoundsOpen] = useState(false)

  const current = store.encounters.find((e) => e.id === store.currentID) ?? store.encounters[0] ?? null

  useEffect(() => {
    // Ficha do monstro a partir do combatente (o índice só carrega se houver monstro).
    if (!monsterIndex && current?.combatants.some((c) => c.monsterID)) void loadMonsterIndex().then(setMonsterIndex)
  }, [monsterIndex, current])

  const editEncounter = (mutate: (e: Encounter) => void) =>
    update((draft) => {
      const e = draft.encounters.find((x) => x.id === current?.id)
      if (!e) return
      mutate(e)
      e.updatedAt = new Date().toISOString()
    })

  const create = () =>
    update((draft) => {
      const e = newEncounter(`Encounter ${draft.encounters.length + 1}`, current?.campaignID ?? null, new Date().toISOString())
      draft.encounters.unshift(e)
      draft.currentID = e.id
    })

  const remove = () => {
    if (!current || !window.confirm(`Delete "${current.name}"? It is only on this device and cannot be recovered.`)) return
    update((draft) => {
      draft.encounters = draft.encounters.filter((e) => e.id !== current.id)
      draft.currentID = draft.encounters[0]?.id ?? null
    })
  }

  // Ordem da rodada (fechada no "Start round", ou a prévia com as rolagens): a linha da iniciativa e a coluna INIT.
  const round = current?.initiative ?? newInitiative(store.settings.initiative)
  const modifiers = useInitiativeModifiers(round.method)
  const steps = !current ? [] : round.step !== null && round.order ? round.order : initiativeSteps(current, round, modifiers, store.settings.deathAt)
  const initiative = initiativeByCombatant(steps)
  const canStart = !!current && round.step === null && steps.length > 0 && missingRolls(current, round, store.settings.deathAt).length === 0

  // Quem age agora (passo atual da ordem fechada no começo da rodada): destaque na lista.
  const actingNow = new Set(current ? actingIDs(current) : [])

  const moraleTarget = current?.combatants.find((c) => c.id === moraleID) ?? null

  const add = (list: Combatant[]) => editEncounter((e) => void e.combatants.push(...list))
  const replace = (next: Combatant) => editEncounter((e) => void (e.combatants = e.combatants.map((c) => (c.id === next.id ? next : c))))
  const drop = (id: string) => editEncounter((e) => void (e.combatants = e.combatants.filter((c) => c.id !== id)))

  return (
    <div className="paper-page">
      <div className="paper-sheet combat-sheet">
        <div className="paper-top">
          <Link to="/dm" className="paper-link">‹ DM Tools</Link>
          <button className="paper-link" onClick={() => setSettingsOpen(true)}>
            settings
          </button>
        </div>
        <h1 className="paper-title">Combat Tracker</h1>
        {saveError && <p className="paper-soft save-error">Could not save on this device: {saveError}</p>}

        <div className="paper-filter">
          <span className="paper-label">Encounter</span>
          <div className="chip-row chip-row-scroll">
            {store.encounters.map((e) => (
              <button key={e.id} className={e.id === current?.id ? 'chip chip-on' : 'chip'} onClick={() => update((d) => void (d.currentID = e.id))}>
                {e.name || 'Unnamed encounter'}
              </button>
            ))}
            <button className="chip" onClick={create}>
              + New encounter
            </button>
          </div>
        </div>

        {!current ? (
          <p className="paper-soft">No encounters yet. Create one to prepare a fight — it is kept on this device.</p>
        ) : (
          <>
            <div className="combat-head">
              <input className="ink-input combat-title" aria-label="Encounter name" value={current.name} onChange={(event) => editEncounter((e) => void (e.name = event.target.value))} />
              <div className="chip-row combat-add">
                <button className="chip chip-on" onClick={() => setAdding('pc')}>
                  + PC
                </button>
                <button className="chip chip-on" onClick={() => setAdding('monster')}>
                  + Monster
                </button>
                <button className="chip chip-on" onClick={() => setAdding('npc')}>
                  + NPC
                </button>
              </div>
              <button className="paper-link combat-delete" onClick={remove}>
                delete encounter
              </button>
            </div>

            {current.combatants.length === 0 ? (
              <p className="paper-soft">Add the party and their foes to start.</p>
            ) : (
              <InitiativeBar
                encounter={current}
                steps={steps}
                canStart={canStart}
                onStart={() => editEncounter((e) => Object.assign(e, startRound(e, round, modifiers, store.settings.deathAt)))}
                onChange={(next) => editEncounter((e) => Object.assign(e, next))}
                onOpen={() => setInitiativeOpen(true)}
                onRounds={current.history?.length ? () => setRoundsOpen(true) : undefined}
              />
            )}
            {current.combatants.length > 0 && (
              <CombatTable
                combatants={current.combatants}
                settings={store.settings}
                acting={actingNow}
                initiative={initiative}
                onChange={replace}
                onRemove={drop}
                onOpenMonster={(c) => {
                  const entry = c.monsterID ? monsterIndex?.find((m) => m.id === c.monsterID) : undefined
                  return entry ? () => setOpenMonster(entry) : undefined
                }}
                onMorale={(c) => setMoraleID(c.id)}
              />
            )}
          </>
        )}
      </div>

      {adding === 'monster' && current && (
        <AddMonsterWindow existingNames={current.combatants.map((c) => c.name)} settings={store.settings} onAdd={add} onClose={() => setAdding(null)} />
      )}
      {(adding === 'pc' || adding === 'npc') && current && (
        <AddPersonWindow
          kind={adding}
          campaignID={current.campaignID}
          onCampaign={(id) => editEncounter((e) => void (e.campaignID = id))}
          alreadyIn={current.combatants.flatMap((c) => (c.characterID ? [c.characterID] : []))}
          onAdd={add}
          onClose={() => setAdding(null)}
        />
      )}
      {settingsOpen && <CombatSettingsWindow settings={store.settings} onChange={(s) => update((d) => void (d.settings = s))} onClose={() => setSettingsOpen(false)} />}
      {moraleTarget && current && (
        <MoraleWindow key={moraleTarget.id} combatant={moraleTarget} encounter={current} settings={store.settings} onChange={replace} onClose={() => setMoraleID(null)} />
      )}
      {initiativeOpen && current && (
        <InitiativeWindow encounter={current} settings={store.settings} onChange={(next) => editEncounter((e) => Object.assign(e, next))} onClose={() => setInitiativeOpen(false)} />
      )}
      {roundsOpen && current && (
        <RoundsWindow encounter={current} settings={store.settings} onChange={(next) => editEncounter((e) => Object.assign(e, next))} onClose={() => setRoundsOpen(false)} />
      )}
      {openMonster && <MonsterDetail entry={openMonster} onClose={() => setOpenMonster(null)} />}
    </div>
  )
}
