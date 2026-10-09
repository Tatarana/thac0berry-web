import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { InitiativeBar, InitiativeWindow, RoundsWindow } from '../components/CombatInitiative'
import { MoraleWindow } from '../components/CombatMorale'
import { QuickTables } from '../components/CombatTables'
import { TableDetail, type RollRecord } from '../components/TableDetail'
import { AddMonsterWindow, AddPersonWindow, CombatSettingsWindow, CombatTable, NewEncounterWindow } from '../components/CombatParts'
import { DmOnly } from '../components/DmOnly'
import { MonsterDetail } from '../components/MonsterDetail'
import { loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { loadTables } from '../data/tables'
import { useCombatStore } from '../lib/combatStore'
import { useInitiativeModifiers } from '../lib/initiativeTables'
import {
  actingNow as actingIDs,
  endEncounter,
  initiativeByCombatant,
  initiativeSteps,
  missingRolls,
  newEncounter,
  newInitiative,
  reopenEncounter,
  startRound,
  type Combatant,
  type Encounter,
} from '../rules/combat'
import { quickTableIDs, toggleQuickTable } from '../rules/quickTables'
import type { GrimoireTable } from '../rules/tableIndex'

// Combat Tracker (ferramenta do DM, docs/controle-de-combate.md): encontros
// guardados no aparelho, com os combatentes de cada lado. CT1: combatentes,
// PV, estados e condições; CT2: iniciativa e rodadas; CT3: moral; CT4:
// tabelas rápidas.

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
  // Tabelas rápidas (CT4): a janela é a do Table Grimoire; o histórico vale para a visita.
  const [tables, setTables] = useState<GrimoireTable[]>([])
  const [openTable, setOpenTable] = useState<{ table: GrimoireTable; autoRoll: boolean; opened: number } | null>(null)
  const [rollHistory, setRollHistory] = useState<RollRecord[]>([])
  const showTable = (table: GrimoireTable, autoRoll = false) => setOpenTable((now) => ({ table, autoRoll, opened: (now?.opened ?? 0) + 1 }))

  useEffect(() => {
    void loadTables().then(setTables)
  }, [])

  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [showPast, setShowPast] = useState(false)
  // Encerrados ("End encounter") saem da fila e ficam em "Past encounters".
  const active = store.encounters.filter((e) => !e.endedAt)
  const past = store.encounters.filter((e) => e.endedAt)
  const current = store.encounters.find((e) => e.id === store.currentID) ?? active[0] ?? null

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

  const create = (name: string, campaignID: string | null, party: Combatant[]) => {
    update((draft) => {
      const e = newEncounter(name, campaignID, new Date().toISOString())
      e.combatants = party
      draft.encounters.unshift(e)
      draft.currentID = e.id
    })
    setCreating(false)
  }

  // Encerra (fica guardado em "Past encounters") e volta à tela anterior.
  const finish = () => {
    if (!current || !window.confirm(`End "${current.name}"? It is kept under Past encounters and can be reopened.`)) return
    update((draft) => {
      draft.encounters = draft.encounters.map((e) => (e.id === current.id ? endEncounter(e, new Date().toISOString()) : e))
      draft.currentID = draft.encounters.find((e) => !e.endedAt)?.id ?? null
    })
    navigate('/dm')
  }

  const remove = () => {
    if (!current || !window.confirm(`Delete "${current.name}"? It is only on this device and cannot be recovered.`)) return
    update((draft) => {
      draft.encounters = draft.encounters.filter((e) => e.id !== current.id)
      draft.currentID = draft.encounters.find((e) => !e.endedAt)?.id ?? null
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
            {(showPast ? [...active, ...past] : active).map((e) => (
              <button key={e.id} className={[e.id === current?.id ? 'chip chip-on' : 'chip', e.endedAt ? 'chip-past' : ''].join(' ')} onClick={() => update((d) => void (d.currentID = e.id))}>
                {e.name || 'Unnamed encounter'}
                {e.endedAt ? ' · ended' : ''}
              </button>
            ))}
            <button className="chip" onClick={() => setCreating(true)}>
              + New encounter
            </button>
            {past.length > 0 && (
              <button className="paper-link" onClick={() => setShowPast(!showPast)}>
                {showPast ? 'hide past encounters' : `past encounters (${past.length})`}
              </button>
            )}
          </div>
        </div>

        {!current ? (
          <p className="paper-soft">No encounters in progress. Create one to prepare a fight — it is kept on this device.</p>
        ) : (
          <>
            {current.endedAt && (
              <p className="paper-soft combat-ended">
                Ended on {new Date(current.endedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}, round {current.round}.{' '}
                <button className="chip" onClick={() => editEncounter((e) => Object.assign(e, reopenEncounter(e)))}>
                  Reopen
                </button>
              </p>
            )}
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
              {!current.endedAt && (
                <button className="chip chip-on combat-end" onClick={finish}>
                  End encounter
                </button>
              )}
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
            {tables.length > 0 && (
              <QuickTables tables={tables} saved={store.settings.quickTables} onSave={(next) => update((d) => void (d.settings.quickTables = next))} onOpen={(t) => showTable(t)} />
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
      {creating && <NewEncounterWindow encounters={store.encounters} campaignID={current?.campaignID ?? null} onCreate={create} onClose={() => setCreating(false)} />}
      {roundsOpen && current && (
        <RoundsWindow encounter={current} settings={store.settings} onChange={(next) => editEncounter((e) => Object.assign(e, next))} onClose={() => setRoundsOpen(false)} />
      )}
      {openTable && (
        <TableDetail
          key={`${openTable.table.id}-${openTable.opened}`}
          table={openTable.table}
          tables={tables}
          autoRoll={openTable.autoRoll}
          history={rollHistory}
          onRecord={(record) => setRollHistory((list) => [{ ...record, id: (list[0]?.id ?? 0) + 1 }, ...list].slice(0, 50))}
          onOpen={showTable}
          onClose={() => setOpenTable(null)}
          pin={{
            pinned: quickTableIDs(store.settings.quickTables).includes(openTable.table.id),
            onToggle: () => update((d) => void (d.settings.quickTables = toggleQuickTable(d.settings.quickTables, openTable.table.id))),
          }}
        />
      )}
      {openMonster && <MonsterDetail entry={openMonster} onClose={() => setOpenMonster(null)} />}
    </div>
  )
}
