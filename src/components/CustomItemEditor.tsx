import { useState } from 'react'
import { createPortal } from 'react-dom'
import { loadMagicIndex, loadMagicItem, magicCategoryOrder, type MagicItemIndexEntry } from '../data/magicItems'
import type { CustomItemVisibility } from '../lib/customItems'
import { useConfirm } from '../lib/useConfirm'
import { customItemFromCompendium } from '../rules/customItems'
import type { CustomMagicItemData } from '../types/library'
import { CompendiumPicker } from './CompendiumPicker'
import { PaperModal } from './DetailBits'

// Editor de um item mágico criado pelo mestre ou pelo jogador (2026-10-24):
// nome, categoria, resumo, descrição, valores, cargas e bônus; pode começar
// copiando um item do livro. Numa campanha, "Share with the campaign" deixa os
// membros verem (sem marcar, só o dono e o mestre da campanha).

type NumberKey = 'xpValue' | 'goldValue' | 'charges' | 'attackBonus' | 'damageBonus' | 'acBonus' | 'saveBonus'
const numberFields: [NumberKey, string][] = [
  ['attackBonus', 'Attack bonus'],
  ['damageBonus', 'Damage bonus'],
  ['acBonus', 'AC bonus'],
  ['saveBonus', 'Saving throw bonus'],
  ['charges', 'Charges'],
  ['xpValue', 'XP value'],
  ['goldValue', 'Gold value'],
]

export function CustomItemEditor({
  initial,
  initialVisibility,
  inCampaign,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  initial: CustomMagicItemData
  initialVisibility: CustomItemVisibility
  /** A ficha está numa campanha: dá para compartilhar com ela. */
  inCampaign: boolean
  isNew: boolean
  onSave: (data: CustomMagicItemData, visibility: CustomItemVisibility) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) {
  const [data, setData] = useState<CustomMagicItemData>(() => structuredClone(initial))
  const [visibility, setVisibility] = useState<CustomItemVisibility>(initialVisibility)
  const [copying, setCopying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const set = <K extends keyof CustomMagicItemData>(key: K, value: CustomMagicItemData[K]) => setData((d) => ({ ...d, [key]: value }))

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setBusy(false)
    }
  }

  async function copyFrom(entry: MagicItemIndexEntry) {
    setCopying(false)
    const item = await loadMagicItem(entry)
    if (item) setData(customItemFromCompendium(item))
  }

  async function remove() {
    if (!onDelete) return
    if (!(await confirm(`Delete “${data.name || 'this item'}”? Sheets that have it keep their copy.`, 'Delete'))) return
    await run(onDelete)
  }

  return createPortal(
    <PaperModal title={isNew ? 'New magic item' : 'Edit magic item'} subtitle="Homebrew" onClose={onClose} wide>
      <div className="dm-table-editor">
        {isNew && (
          <button className="paper-link" onClick={() => setCopying(true)}>
            start from a book item…
          </button>
        )}
        <label className="dm-table-field">
          <span className="paper-label">Name</span>
          <input className="paper-search" value={data.name} placeholder="e.g. Kelmon's Blade +2" autoFocus={isNew} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="dm-table-field">
          <span className="paper-label">Category</span>
          <select className="paper-search" value={data.category ?? 'Miscellaneous'} onChange={(e) => set('category', e.target.value)}>
            {magicCategoryOrder.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="dm-table-field">
          <span className="paper-label">Summary</span>
          <input className="paper-search" value={data.summary ?? ''} placeholder="one line" onChange={(e) => set('summary', e.target.value)} />
        </label>
        <label className="dm-table-field">
          <span className="paper-label">Description</span>
          <textarea className="paper-search" rows={6} value={data.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </label>
        <div className="custom-item-numbers">
          {numberFields.map(([key, label]) => (
            <label key={key} className="dm-table-field">
              <span className="paper-label">{label}</span>
              <input
                className="paper-search"
                inputMode="numeric"
                value={data[key] ?? ''}
                placeholder="—"
                onChange={(e) => {
                  const text = e.target.value.trim().replace('−', '-')
                  set(key, /^[+-]?\d+$/.test(text) ? Number(text) : null)
                }}
              />
            </label>
          ))}
        </div>
        {inCampaign && (
          <label className="print-options">
            <span>
              <input type="checkbox" checked={visibility === 'campaign'} onChange={(e) => setVisibility(e.target.checked ? 'campaign' : 'private')} /> Share with the campaign
            </span>
          </label>
        )}
        {data.basedOn && <p className="paper-soft">Started from a book item ({data.basedOn}).</p>}
        {error && <p className="paper-soft save-error">Could not save: {error}</p>}
        <div className="slot-actions">
          {onDelete ? (
            <button className="paper-link" disabled={busy} onClick={() => void remove()}>
              delete item
            </button>
          ) : (
            <span />
          )}
          <button
            className="consequence-apply"
            disabled={busy || data.name.trim() === ''}
            onClick={() => void run(() => onSave({ ...data, name: data.name.trim() }, inCampaign ? visibility : 'private'))}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {copying && (
        <CompendiumPicker<MagicItemIndexEntry>
          title="Start from a book item"
          load={loadMagicIndex}
          hint={(i) => i.category}
          onChoose={(i) => void copyFrom(i)}
          onTyped={() => setCopying(false)}
          onClose={() => setCopying(false)}
        />
      )}
      {dialog}
    </PaperModal>,
    document.body,
  )
}
