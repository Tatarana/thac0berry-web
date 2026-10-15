import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCampaignCharacters } from '../lib/campaignCharacters'
import { addExperience } from '../lib/roster'
import type { Encounter } from '../rules/combat'
import { xpLines, type SheetForXp, type XpApplied } from '../rules/xpToSheets'
import { PaperModal } from './DetailBits'

// XP do encontro nas fichas (CT9, docs/controle-de-combate.md): a parte de
// cada um (com o bônus de 10% do atributo principal), editável, somada ao
// "Total XPs" das fichas do App. O encontro guarda o que foi lançado.

export function XpToSheetsWindow({ encounter, onApplied, onClose }: { encounter: Encounter; onApplied: (applied: XpApplied) => void; onClose: () => void }) {
  const award = encounter.xpAward
  const applied = encounter.xpApplied
  const { characters, error: loadError } = useCampaignCharacters(encounter.campaignID)
  const sheets = useMemo(() => new Map((characters ?? []).map((c) => [c.id.toLowerCase(), c.data as unknown as SheetForXp])), [characters])
  const lines = award ? xpLines(award, encounter.combatants, sheets) : []
  const withSheet = lines.filter((l) => l.characterID)
  const byHand = lines.filter((l) => !l.characterID)
  const [typed, setTyped] = useState<Record<string, string>>({})
  const [off, setOff] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amountOf = (id: string, fallback: number) => {
    const text = typed[id]
    return text === undefined ? fallback : /^\d+$/.test(text.trim()) ? Number(text.trim()) : null
  }
  const chosen = withSheet.filter((l) => !off.includes(l.combatantID))
  const ready = chosen.length > 0 && chosen.every((l) => amountOf(l.combatantID, l.base + l.bonus) !== null)

  async function apply() {
    setBusy(true)
    setError(null)
    const done: XpApplied['entries'] = []
    const failed: string[] = []
    for (const l of chosen) {
      const amount = amountOf(l.combatantID, l.base + l.bonus)!
      try {
        if (amount > 0) await addExperience(l.characterID!, amount)
        done.push({ characterID: l.characterID!, name: l.name, amount, prime: l.bonus > 0 && amount === l.base + l.bonus })
      } catch (reason) {
        failed.push(`${l.name}: ${reason instanceof Error ? reason.message : String(reason)}`)
      }
    }
    setBusy(false)
    if (done.length > 0) onApplied({ at: new Date().toISOString(), entries: done })
    if (failed.length > 0) setError(`Could not add to ${failed.join('; ')}`)
    else onClose()
  }

  return createPortal(
    <PaperModal title="Add XP to the sheets" subtitle={award ? `${award.each.toLocaleString('en-US')} XP each, plus 10% for a prime requisite of 16+ (PHB)` : 'No experience in this encounter'} onClose={onClose}>
      {applied ? (
        <>
          <p className="paper-soft">Added on {new Date(applied.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}:</p>
          <ul className="xp-list">
            {applied.entries.map((e) => (
              <li key={e.characterID}>
                {e.name} <strong>+{e.amount.toLocaleString('en-US')} XP</strong>
                {e.prime && <span className="paper-soft"> (prime +10%)</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {loadError && <p className="paper-soft save-error">Could not load the campaign characters: {loadError}</p>}
          {encounter.campaignID && !characters && !loadError && <p className="paper-soft">Loading the sheets…</p>}
          {withSheet.length === 0 && (characters || !encounter.campaignID) && <p className="paper-soft">No one who shared the XP has a sheet in the App.</p>}
          {withSheet.length > 0 && (
            <table className="effect-save-table">
              <thead>
                <tr>
                  <th />
                  <th>Character</th>
                  <th>Share</th>
                  <th>Prime</th>
                  <th>Add</th>
                </tr>
              </thead>
              <tbody>
                {withSheet.map((l) => (
                  <tr key={l.combatantID}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Add XP to ${l.name}`}
                        checked={!off.includes(l.combatantID)}
                        onChange={() => setOff(off.includes(l.combatantID) ? off.filter((x) => x !== l.combatantID) : [...off, l.combatantID])}
                      />
                    </td>
                    <td>{l.name}</td>
                    <td>{l.base.toLocaleString('en-US')}</td>
                    <td className="paper-soft">{l.bonus > 0 ? `+${l.bonus.toLocaleString('en-US')}` : (l.note ?? '—')}</td>
                    <td>
                      <input
                        className="ink-input xp-amount"
                        inputMode="numeric"
                        aria-label={`${l.name}: XP to add`}
                        value={typed[l.combatantID] ?? String(l.base + l.bonus)}
                        onChange={(event) => setTyped({ ...typed, [l.combatantID]: event.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {byHand.length > 0 && <p className="paper-soft">Not in the App (give it by hand): {byHand.map((l) => `${l.name} ${l.base.toLocaleString('en-US')}`).join(', ')}.</p>}
          {error && <p className="paper-soft save-error">{error}</p>}
          <div className="chip-row initiative-actions">
            <button className="chip chip-on" disabled={!ready || busy} onClick={() => void apply()}>
              {busy ? 'Adding…' : `Add to ${chosen.length} sheet${chosen.length === 1 ? '' : 's'}`}
            </button>
          </div>
          <p className="paper-soft">Each amount is added to the character’s Total XPs. Players with the sheet open see the change right away.</p>
        </>
      )}
    </PaperModal>,
    document.body,
  )
}
