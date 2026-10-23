import { Field, PaperModal, TextBlock } from './DetailBits'

// Um poder psiônico (schemas/psionic-power.schema.json; data/psionic-powers.json)
// e a ficha dele, usada no compêndio, no "Add a power" e na lista de poderes da ficha.

export interface PsionicPower {
  id: string
  title: string
  discipline: string
  powerTier: string
  powerScore: { raw: string; baseAbility: string; modifier: number }
  pspCost: { initial: string; maintenance?: string | null; summary: string }
  tacticalCombat?: { mac: string } | null
  parameters: { range: string; preparationTime: string; areaOfEffect: string; prerequisites: string[] }
  description: {
    briefSummary: string
    fullText: string
    sections: { effect: string; powerScoreRollResults?: { powerScoreSuccess: string; criticalFailure20: string } | null }
  }
  sources: { book: string; page?: number | null }[]
}

export function PowerDetail({ power, onClose }: { power: PsionicPower; onClose: () => void }) {
  const rolls = power.description.sections.powerScoreRollResults
  return (
    <PaperModal title={power.title} subtitle={`${power.discipline} · ${power.powerTier}`} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Power Score" value={power.powerScore.raw} />
        <Field label="PSP Cost (initial/maint.)" value={power.pspCost.summary} />
        <Field label="MAC" value={power.tacticalCombat?.mac} />
        <Field label="Range" value={power.parameters.range} />
        <Field label="Preparation Time" value={power.parameters.preparationTime} />
        <Field label="Area of Effect" value={power.parameters.areaOfEffect} />
        <Field label="Prerequisites" value={power.parameters.prerequisites.join(', ')} />
        <Field label="Source" value={power.sources.map((source) => source.book).join(', ')} />
      </div>
      <TextBlock label="Effect" text={power.description.sections.effect} />
      {rolls && (
        <>
          <TextBlock label="Power Score (exceptional success)" text={rolls.powerScoreSuccess} />
          <TextBlock label="Roll of 20 (critical failure)" text={rolls.criticalFailure20} />
        </>
      )}
    </PaperModal>
  )
}
