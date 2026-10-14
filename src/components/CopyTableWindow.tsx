import { createPortal } from 'react-dom'
import { useCampaigns } from '../lib/campaignCharacters'
import { PaperModal } from './DetailBits'

// "Copy to another campaign…" de uma tabela do mestre (GT5b, 2026-10-14): as
// campanhas do mestre e o One-shot, menos a de agora. A cópia é independente
// (mudar uma não muda a outra).

export function CopyTableWindow({
  title,
  currentID,
  onChoose,
  onClose,
}: {
  title: string
  /** Campanha da tabela (null = One-shot), que não aparece na lista. */
  currentID: string | null
  onChoose: (campaignID: string | null, name: string) => void
  onClose: () => void
}) {
  const { campaigns, error } = useCampaigns()
  const options = [
    ...(currentID === null ? [] : [{ id: null as string | null, name: 'One-shot (no campaign)' }]),
    ...(campaigns ?? []).filter((c) => c.id !== currentID && !c.is_archived).map((c) => ({ id: c.id as string | null, name: c.name || 'Unnamed campaign' })),
  ]
  return createPortal(
    <PaperModal title={`Copy “${title}”`} subtitle="To which campaign? The copy is independent." onClose={onClose}>
      {error && <p className="paper-soft save-error">Could not load your campaigns: {error}</p>}
      {!campaigns && !error && <p className="paper-soft">Loading your campaigns…</p>}
      {campaigns && options.length === 0 && <p className="paper-soft">You have no other campaign to copy it to.</p>}
      <ul className="slot-choices">
        {options.map((o) => (
          <li key={o.id ?? 'one-shot'}>
            <button className="slot-choice" onClick={() => onChoose(o.id, o.name)}>
              <span className="slot-choice-fav" />
              <span className="rec-value">{o.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </PaperModal>,
    document.body,
  )
}
