import { useState } from 'react'
import { pantheonOf, type Deity } from '../data/deities'
import { useDeityImage } from '../lib/siteImages'
import { deitySlot } from '../lib/siteImageRules'
import { raceRecords } from '../rules/raceKit'
import { Field, PaperModal, TextBlock } from './DetailBits'
import { SlotArt } from './SlotArt'

// Ficha da divindade (DeityDetailSheet do iPad).
export function DeityDetail({ deity, onClose }: { deity: Deity; onClose: () => void }) {
  const [showAvatar, setShowAvatar] = useState(false)
  const art = useDeityImage(deity.id)
  const subtitle = [pantheonOf(deity), deity.rank, deity.status && deity.status !== 'None' ? deity.status : null, deity.bookCode]
    .filter(Boolean)
    .join(' · ')

  return (
    <PaperModal readable title={deity.name} subtitle={subtitle} onClose={onClose}>
      {art !== undefined && <SlotArt slot={deitySlot(deity.id)} name={deity.name} url={art} />}
      <div className="detail-grid">
        <Field label="Pantheon" value={pantheonOf(deity)} />
        <Field label="Race" value={deity.race ? (raceRecords().find((r) => r.id === deity.race)?.name ?? deity.race) : null} />
        <Field label="Alignment" value={deity.alignment} />
        <Field label="Portfolio" value={deity.portfolio} />
        <Field label="Symbol" value={deity.symbol} />
        <Field label="Worshiper Alignments" value={deity.worshiperAlignments} />
        <Field label="Home Plane" value={deity.plane} />
        <Field label="Domain" value={deity.domainName} />
        <Field label="Superior" value={deity.superior} />
        <Field label="Aliases" value={deity.aliases} />
        <Field label="Allies" value={deity.allies} />
        <Field label="Foes" value={deity.foes} />
        <Field label="Source" value={deity.book} />
      </div>
      <TextBlock label="Mythology & Clergy" text={deity.fullText} />
      {deity.avatarDescription && (
        <div className="detail-field">
          <button className="paper-link" onClick={() => setShowAvatar((v) => !v)}>
            {showAvatar ? '▾' : '▸'} Avatar statblock{deity.avatarClassLevels ? ` · ${deity.avatarClassLevels}` : ''}
          </button>
          {showAvatar && <p className="detail-description">{deity.avatarDescription}</p>}
        </div>
      )}
    </PaperModal>
  )
}
