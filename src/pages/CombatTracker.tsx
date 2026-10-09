import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AddMonsterWindow, AddPersonWindow, CombatantRow, CombatSettingsWindow } from '../components/CombatParts'
import { DmOnly } from '../components/DmOnly'
import { MonsterDetail } from '../components/MonsterDetail'
import { loadMonsterIndex, type MonsterIndexEntry } from '../data/monsters'
import { useCombatStore } from '../lib/combatStore'
import { newEncounter, ofSide, sideLabels, statusOf, type Combatant, type Encounter, type Side } from '../rules/combat'

// Combat Tracker (ferramenta do DM, docs/controle-de-combate.md): encontros
// guardados no aparelho, com os combatentes de cada lado. CT1: combatentes,
// PV, estados e condições; iniciativa (CT2), moral (CT3) e tabelas (CT4)
// entram depois.

export function CombatTracker() {
  return (
    <DmOnly>
      <Tracker />
    </DmOnly>
  )
}

const sides: Side[] = ['party', 'enemies', 'others']

function Tracker() {
  const { store, update, saveError } = useCombatStore()
  const [adding, setAdding] = useState<'monster' | 'pc' | 'npc' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [monsterIndex, setMonsterIndex] = useState<MonsterIndexEntry[] | null>(null)
  const [openMonster, setOpenMonster] = useState<MonsterIndexEntry | null>(null)

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
              <button className="paper-link" onClick={remove}>
                delete encounter
              </button>
            </div>
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

            {current.combatants.length === 0 && <p className="paper-soft">Add the party and their foes to start.</p>}
            {sides.map((side) => {
              const list = ofSide(current, side)
              if (list.length === 0) return null
              const standing = list.filter((c) => statusOf(c, store.settings.deathAt) === 'ok').length
              return (
                <section key={side} className="combat-side">
                  <h2 className="rec-title combat-side-title">
                    {sideLabels[side]} <span className="paper-soft">· {standing} of {list.length} standing</span>
                  </h2>
                  <ul className="combatant-list">
                    {list.map((c) => {
                      const entry = c.monsterID ? monsterIndex?.find((m) => m.id === c.monsterID) : undefined
                      return (
                        <CombatantRow
                          key={c.id}
                          c={c}
                          settings={store.settings}
                          onChange={replace}
                          onRemove={() => drop(c.id)}
                          onOpenMonster={entry ? () => setOpenMonster(entry) : undefined}
                        />
                      )
                    })}
                  </ul>
                </section>
              )
            })}
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
      {openMonster && <MonsterDetail entry={openMonster} onClose={() => setOpenMonster(null)} />}
    </div>
  )
}
