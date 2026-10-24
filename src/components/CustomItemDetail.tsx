import { createPortal } from 'react-dom'
import { customItemBonuses } from '../rules/customItems'
import type { CustomMagicItemData } from '../types/library'
import { Field, PaperModal, TextBlock } from './DetailBits'

// Ficha de um item mágico criado (2026-10-24): o mesmo jeito dos itens do
// livro, com a marca "Homebrew"; "Edit" só para quem criou.

export function CustomItemDetail({ data, onEdit, onClose }: { data: CustomMagicItemData; onEdit?: () => void; onClose: () => void }) {
  const bonuses = customItemBonuses(data)
  return createPortal(
    <PaperModal title={data.name} subtitle={`${data.category ?? 'Miscellaneous'} · Homebrew`} onClose={onClose}>
      {onEdit && (
        <button className="paper-link" onClick={onEdit}>
          Edit this item →
        </button>
      )}
      <div className="detail-grid">
        <Field label="Bonuses" value={bonuses.length > 0 ? bonuses.join(', ') : null} />
        <Field label="XP Value" value={data.xpValue != null ? `${data.xpValue} xp` : null} />
        <Field label="Gold Value" value={data.goldValue != null ? `${data.goldValue} gp` : null} />
      </div>
      <TextBlock label="Summary" text={data.summary} />
      <TextBlock label="Description" text={data.description} />
    </PaperModal>,
    document.body,
  )
}
