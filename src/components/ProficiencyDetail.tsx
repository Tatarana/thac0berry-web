import { signedModifier, skillsAndPowersText, type Proficiency } from '../data/proficiencies'
import { Field, PaperModal, TextBlock } from './DetailBits'

/** Ficha de uma proficiência nonweapon (compêndio e The Forge). */
export function ProficiencyDetail({ proficiency, onClose }: { proficiency: Proficiency; onClose: () => void }) {
  const { mechanics } = proficiency
  return (
    <PaperModal title={proficiency.name} subtitle={proficiency.primaryGroup} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Ability" value={mechanics.relevantAbility} />
        <Field label="Check Modifier" value={signedModifier(mechanics.checkModifier)} />
        <Field label="Slots Required" value={String(mechanics.slotsRequired)} />
        <Field label="Setting" value={proficiency.campaignSettings.join(', ')} />
        <Field label="Learned by" value={mechanics.groups.join('; ')} />
        <Field label="Prerequisites" value={mechanics.prerequisites.join(', ')} />
      </div>
      <TextBlock label="Description" text={proficiency.description.fullText} />
      <TextBlock label="Skills & Powers (optional rule)" text={skillsAndPowersText(proficiency)} />
    </PaperModal>
  )
}
