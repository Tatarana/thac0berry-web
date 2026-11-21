import { useEffect, useState } from 'react'
import { loadRaceContent } from '../data/races'
import { combosFor } from '../rules/multiclass'
import { raceAdjustmentsText, raceLevelLimits, raceRecord, type RaceName } from '../rules/raceKit'
import { Field, PaperModal, TextBlock } from './DetailBits'

// Ficha da raça (ⓘ do seletor de raça e "About" do Forge): os números que o app usa
// (ajustes, limites de nível, combinações), os dados do livro (tamanho, movimento,
// visão, idiomas) e o texto do livro. Para as raças que vieram dos dados, é aqui
// que as regras especiais aparecem (só texto; o app não as aplica sozinho).

export function RaceDetail({ race, onClose }: { race: RaceName; onClose: () => void }) {
  const r = raceRecord(race)
  const [content, setContent] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    if (r) {
      loadRaceContent(r.id)
        .then((text) => alive && setContent(text))
        .catch(() => alive && setContent(null))
    }
    return () => {
      alive = false
    }
  }, [r])
  if (!r) return null

  const limits = r.noLevelLimit ? 'No level limits' : raceLevelLimits(race).map((l) => `${l.characterClass} ${l.limit === 'unlimited' ? 'unlimited' : l.limit}`).join(', ')
  const combos = combosFor(race)
    .map((c) => c.join('/'))
    .join(', ')
  const subtitle = [r.group, r.source?.label].filter(Boolean).join(' · ')

  return (
    <PaperModal readable title={race} subtitle={subtitle} onClose={onClose}>
      <Field label="Setting" value={r.campaignSetting ?? 'Core rules'} />
      <Field label="Source" value={r.source?.book} />
      <Field label="Ability adjustments" value={raceAdjustmentsText(race) || 'None'} />
      <Field label="Class level limits" value={limits || 'None of the 12 classes'} />
      <Field label="Multi-class combinations" value={combos || (r.classCombinations?.length ? 'None with the classes of this app' : 'None')} />
      <Field label="Size" value={r.size} />
      <Field label="Movement" value={r.speed ?? (r.baseMovement !== undefined ? `${r.baseMovement}` : null)} />
      <Field label="Vision" value={r.vision} />
      <Field label="Languages" value={r.languages} />
      <Field label="Height" value={r.height} />
      <Field label="Weight" value={r.weight} />
      <Field label="Attack bonus" value={r.attackBonus} />
      <Field label="Resistance" value={r.resistance} />
      <Field label="Alignment" value={r.alignment} />
      {content ? <TextBlock label="From the book" text={content} /> : <TextBlock label="Racial abilities" text={r.racialAbilities} />}
    </PaperModal>
  )
}
