import { useEffect, useState, type ReactNode } from 'react'
import { loadMagicItem, type MagicItem, type MagicItemIndexEntry } from '../data/magicItems'
import { Field, PaperModal, TextBlock } from './DetailBits'

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-field">
      <span className="paper-label">{label}</span>
      <div className="detail-lines">{children}</div>
    </div>
  )
}

function Body({ item }: { item: MagicItem }) {
  const economy = item.economyAndXP
  const xp = economy.xpValue != null ? `${economy.xpValue} xp` : (economy.rawXP ?? '—')
  const gold = economy.goldValue != null ? `${economy.goldValue} gp` : (economy.rawValue ?? '—')
  const sources = (item.sources ?? [])
    .map((source) => (source.book ? (source.page ? `${source.book} (p. ${source.page})` : source.book) : null))
    .filter(Boolean)
    .join('; ')
  const settings = item.campaignSettings ?? []
  const spells = item.containsSpells ?? []
  const { enchantment, power, defenseBonus: defense } = item

  return (
    <>
      <div className="detail-grid">
        <Field label="XP Value" value={xp} />
        <Field label="Gold Value" value={gold} />
        <Field label="Source" value={sources} />
      </div>
      {settings.length > 0 && <Field label="Campaign Settings" value={settings.join(', ')} />}
      <TextBlock label="Description" text={item.description.fullText} />

      {enchantment && (enchantment.attackBonus != null || enchantment.damageBonus != null) && (
        <Section label="Enchantment">
          {enchantment.attackBonus != null && <span>Attack +{enchantment.attackBonus}</span>}
          {enchantment.damageBonus != null && <span>Damage +{enchantment.damageBonus}</span>}
        </Section>
      )}

      {power && (
        <Section label="Power">
          {power.name && <span>{power.name}</span>}
          {power.chargeBased && (
            <span>{power.maxCharges != null ? `Charge-based, up to ${power.maxCharges} charges` : 'Charge-based'}</span>
          )}
          {power.spell && <span>Replicates: {power.spell.name} ({power.spell.class})</span>}
        </Section>
      )}

      {spells.length > 0 && (
        <Section label="Contains Spells">
          <span>{spells.map((spell) => `${spell.name} (${spell.class})`).join(', ')}</span>
        </Section>
      )}

      {defense && (
        <Section label="Defense">
          {defense.acBonus != null && <span>AC +{defense.acBonus}</span>}
          {defense.savingThrowBonus != null && <span>Saving Throws +{defense.savingThrowBonus}</span>}
          {defense.magicResistance != null && <span>Magic Resistance +{defense.magicResistance}%</span>}
          {defense.hitPointBonus != null && <span>Hit Points +{defense.hitPointBonus}</span>}
          {defense.attackBonus != null && <span>Attack +{defense.attackBonus}</span>}
          {defense.abilityScoreBonus && Object.keys(defense.abilityScoreBonus).length > 0 && (
            <span>
              {Object.entries(defense.abilityScoreBonus)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([ability, bonus]) => `${ability} +${bonus}`)
                .join(', ')}
            </span>
          )}
          {defense.resistances.length > 0 && <span>Resists: {defense.resistances.join(', ')}</span>}
          {defense.regenerates && <span className="paper-soft">Regenerates</span>}
        </Section>
      )}
    </>
  )
}

// Ficha do item mágico (MagicItemDetailSheet do iPad).
export function MagicItemDetail({ entry, onClose }: { entry: MagicItemIndexEntry; onClose: () => void }) {
  const [item, setItem] = useState<MagicItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMagicItem(entry)
      .then((found) => (found ? setItem(found) : setError('Item not found in its file.')))
      .catch((reason: unknown) => setError(String(reason)))
  }, [entry])

  return (
    <PaperModal title={entry.name} subtitle={item?.classification.specificType ?? entry.category} onClose={onClose}>
      {error && <p className="paper-soft">Could not load the item: {error}</p>}
      {!item && !error && <p className="paper-soft">Loading…</p>}
      {item && <Body item={item} />}
    </PaperModal>
  )
}
