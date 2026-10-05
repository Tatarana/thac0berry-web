import { useEffect, useState } from 'react'
import { findDeityByName, loadDeities, type Deity } from '../data/deities'
import { displaySections, type Kit } from '../data/kits'
import { DeityDetail } from './DeityDetail'
import { Field, PaperModal, TextBlock } from './DetailBits'

// Ficha do kit (KitDetailSheet do iPad), com o atalho para a divindade do
// sacerdote especialista quando ela existe no compêndio.
export function KitDetail({ kit, onClose }: { kit: Kit; onClose: () => void }) {
  const [deity, setDeity] = useState<Deity | null>(null)
  const [showDeity, setShowDeity] = useState(false)

  useEffect(() => {
    if (!kit.deity) return
    loadDeities()
      .then((all) => setDeity(findDeityByName(all, kit.deity ?? '') ?? null))
      .catch(() => setDeity(null))
  }, [kit])

  if (showDeity && deity) return <DeityDetail deity={deity} onClose={() => setShowDeity(false)} />

  const { mechanics, features } = kit
  const subtitle = [`${kit.classEligibility.subclass} kit`, kit.titleInChurch, kit.pantheon].filter(Boolean).join(' · ')
  const abilities = Object.entries(mechanics.requirements.abilities)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ability, score]) => `${ability} ${score}+`)
    .join(', ')
  const turnUndead = mechanics.turnUndead.capable
    ? mechanics.turnUndead.mode.charAt(0).toUpperCase() + mechanics.turnUndead.mode.slice(1)
    : 'No'
  const slots = mechanics.weaponSlots
  const slotsText = slots
    ? [
        slots.initial != null ? `${slots.initial} initial` : null,
        // Mesmo texto do iPad (KitDetailSheet.weaponSlotsText).
        slots.additional != null ? `+${slots.additional} per level` : null,
        slots.nonproficiencyPenalty ? `${slots.nonproficiencyPenalty} nonproficiency` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <PaperModal title={kit.name} subtitle={subtitle} onClose={onClose}>
      {deity && (
        <button className="paper-link" onClick={() => setShowDeity(true)}>
          View deity: {deity.name} →
        </button>
      )}
      <div className="detail-grid">
        <Field label="Starting Cash" value={mechanics.startingCash} />
        <Field label="Ability Requirements" value={abilities} />
        <Field label="Alignment" value={mechanics.requirements.alignments.join(', ')} />
        <Field label="Races" value={mechanics.requirements.races} />
        {kit.classEligibility.classGroup === 'Priest' && <Field label="Turn Undead" value={turnUndead} />}
        <Field label="Weapon Slots" value={slotsText} />
        <Field label="Source" value={kit.sourceBook} />
      </div>
      <div className="detail-field">
        <span className="paper-label">Description</span>
        {displaySections(kit.description.fullText).map((section, index) => (
          <div key={index} className="detail-section">
            {section.title && <span className="section-title">{section.title}</span>}
            <p className="detail-description">{section.body}</p>
          </div>
        ))}
      </div>
      <TextBlock label="Role" text={features.role} />
      <TextBlock label="Requirements" text={features.requirements} />
      <TextBlock label="Special Benefits" text={features.specialBenefits} />
      <TextBlock label="Special Hindrances" text={features.specialHindrances} />
      <TextBlock label="Wealth Options" text={features.wealthOptions} />
      <TextBlock label="Weapon Proficiencies" text={features.weaponProficiencies} />
      <TextBlock label="Nonweapon Proficiencies" text={features.nonweaponProficiencies} />
      <TextBlock label="Equipment" text={features.equipment} />
    </PaperModal>
  )
}
