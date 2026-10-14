import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCampaignCharacters } from '../lib/campaignCharacters'
import { rollDice } from '../rules/dice'
import type { Encounter } from '../rules/combat'
import {
  distanceDiceLabel,
  distanceFromSurprise,
  distanceOptions,
  reactionAttitudes,
  reactionFor,
  reactionTotal,
  rollDistance,
  type DistanceOption,
} from '../rules/encounterStart'
import { charismaReactionAdjustment } from '../rules/rules'
import { useTable } from './CombatExtras'
import { PaperModal } from './DetailBits'

// CT6 do Combat Tracker (docs/controle-de-combate.md): distância e reação
// antes da rodada 1 (DMG cap. 11, Tabelas 58 e 59). A regra está em
// src/rules/encounterStart.ts.

const d2x10 = { count: 2, sides: 10, modifier: 0 }
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0')
const intOrNull = (text: string) => (/^-?\d+$/.test(text.trim()) ? Number(text.trim()) : null)

/** Distância do encontro (Tabela 58): a surpresa já escolhe a linha; senão, o terreno. */
export function DistanceWindow({ encounter, onChange, onClose }: { encounter: Encounter; onChange: (next: Encounter) => void; onClose: () => void }) {
  const table = useTable('dmg-58')
  const options = useMemo(() => distanceOptions(table?.rows ?? []), [table])
  const fromSurprise = distanceFromSurprise(options, encounter.surprise)
  const [picked, setPicked] = useState<string | null>(null)
  const option: DistanceOption | null = options.find((o) => o.label === picked) ?? fromSurprise
  const [feet, setFeet] = useState<number | null>(null)

  const choose = (o: DistanceOption) => {
    setPicked(o.label)
    setFeet(rollDistance(o))
  }

  return createPortal(
    <PaperModal title="Encounter distance" subtitle="How far apart the groups are when they notice each other (DMG Table 58)" onClose={onClose}>
      {fromSurprise && <p className="paper-soft">From the surprise check: {fromSurprise.label.toLowerCase()}.</p>}
      <div className="chip-row surprise-mods">
        {options.map((o) => (
          <button key={o.label} className={option?.label === o.label ? 'chip chip-on' : 'chip'} onClick={() => choose(o)}>
            {o.label} · {distanceDiceLabel(o)}
          </button>
        ))}
      </div>
      {option && (
        <div className="surprise-head start-result">
          <strong>{option.label}</strong>
          {option.dice && (
            <button className="chip" onClick={() => setFeet(rollDistance(option))}>
              Roll {distanceDiceLabel(option)}
            </button>
          )}
          <input
            className="ink-input ink-number"
            inputMode="numeric"
            placeholder="ft"
            aria-label="Distance in feet"
            value={feet ?? ''}
            onChange={(event) => setFeet(/^\d+$/.test(event.target.value.trim()) ? Number(event.target.value.trim()) : null)}
          />
          <span className="surprise-result">{feet !== null ? `${feet} ft` : option.dice ? '' : 'as far as they can see: type it'}</span>
        </div>
      )}
      <div className="chip-row initiative-actions">
        <button
          className="chip chip-on"
          disabled={!option || feet === null}
          onClick={() => {
            onChange({ ...encounter, distance: { situation: option!.label, feet: feet! } })
            onClose()
          }}
        >
          Apply
        </button>
        {encounter.distance && (
          <button
            className="chip"
            onClick={() => {
              onChange({ ...encounter, distance: null })
              onClose()
            }}
          >
            Clear distance
          </button>
        )}
      </div>
      <p className="paper-soft">At night or in a dungeon, the encounter starts at the limit of sight: type the distance.</p>
    </PaperModal>,
    document.body,
  )
}

/** Reação das criaturas (Tabela 59): 2d10 + modificadores − Carisma de quem fala, na coluna da atitude dos PCs. */
export function ReactionWindow({ encounter, onChange, onClose }: { encounter: Encounter; onChange: (next: Encounter) => void; onClose: () => void }) {
  const table = useTable('dmg-59')
  const attitudes = useMemo(() => reactionAttitudes(table?.headers ?? []), [table])
  const { characters } = useCampaignCharacters(encounter.campaignID)
  // Quem pode falar pelo grupo: os do lado Party (PCs e NPCs aliados).
  const party = encounter.combatants.filter((c) => c.side === 'party')
  const [attitude, setAttitude] = useState(1)
  const [speakerID, setSpeakerID] = useState<string>('')
  const [charismaText, setCharismaText] = useState('0')
  const [modifierText, setModifierText] = useState('0')
  const [roll, setRoll] = useState<number | null>(null)

  const pickSpeaker = (id: string) => {
    setSpeakerID(id)
    const c = party.find((x) => x.id === id)
    const sheet = c?.characterID ? characters?.find((x) => x.id.toLowerCase() === c.characterID!.toLowerCase())?.data : undefined
    setCharismaText(String(sheet ? charismaReactionAdjustment(sheet) : 0))
  }

  const charisma = intOrNull(charismaText) ?? 0
  const modifier = intOrNull(modifierText) ?? 0
  const total = roll === null ? null : reactionTotal(roll, charisma, modifier)
  const result = total === null || !table ? null : reactionFor(table.rows, total, attitude)
  const speaker = party.find((c) => c.id === speakerID)

  return createPortal(
    <PaperModal title="Encounter reaction" subtitle="When you don’t know how the creatures will react (DMG Table 59)" onClose={onClose}>
      <div className="chip-row surprise-mods">
        <span className="paper-label">The PCs are:</span>
        {attitudes.map((a, i) => (
          <button key={a} className={attitude === i ? 'chip chip-on' : 'chip'} onClick={() => setAttitude(i)}>
            {a}
          </button>
        ))}
      </div>
      <div className="surprise-head start-result">
        <label>
          <span className="paper-label">Speaking for the group</span>{' '}
          <select className="ink-input" value={speakerID} onChange={(event) => pickSpeaker(event.target.value)}>
            <option value="">nobody in particular</option>
            {party.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label title="Charisma reaction adjustment (PHB Table 6); from the sheet for characters in the App">
          <span className="paper-label">Cha reaction</span>{' '}
          <input className="ink-input ink-number" inputMode="numeric" aria-label="Charisma reaction adjustment" value={charismaText} onChange={(event) => setCharismaText(event.target.value)} />
        </label>
        <label title="From the creature description or the morale modifiers (Table 50)">
          <span className="paper-label">Other modifier</span>{' '}
          <input className="ink-input ink-number" inputMode="numeric" aria-label="Other modifier" value={modifierText} onChange={(event) => setModifierText(event.target.value)} />
        </label>
      </div>
      <div className="surprise-head start-result">
        <input
          className="ink-input ink-number"
          inputMode="numeric"
          placeholder="2d10"
          aria-label="Reaction 2d10"
          value={roll ?? ''}
          onChange={(event) => setRoll(/^\d+$/.test(event.target.value.trim()) ? Number(event.target.value.trim()) : null)}
        />
        <button className="chip" onClick={() => setRoll(rollDice(d2x10).total)}>
          Roll 2d10
        </button>
        {total !== null && (
          <span className="surprise-result">
            {roll}
            {modifier !== 0 && ` ${signed(modifier)}`}
            {charisma !== 0 && ` ${signed(-charisma)} (Cha)`} = {total} · {result ?? '—'}
          </span>
        )}
      </div>
      <div className="chip-row initiative-actions">
        <button
          className="chip chip-on"
          disabled={total === null || !result}
          onClick={() => {
            onChange({ ...encounter, reaction: { roll: roll!, total: total!, attitude: attitudes[attitude], result: result!, ...(speaker ? { speaker: speaker.name } : {}) } })
            onClose()
          }}
        >
          Apply
        </button>
        {encounter.reaction && (
          <button
            className="chip"
            onClick={() => {
              onChange({ ...encounter, reaction: null })
              onClose()
            }}
          >
            Clear reaction
          </button>
        )}
      </div>
      <p className="paper-soft">
        Low is friendly: a good Charisma reaction adjustment lowers the roll. The result is a general indication; the DM interprets it to fit the situation. Use it only when you have no idea how the creatures would react.
      </p>
    </PaperModal>,
    document.body,
  )
}
