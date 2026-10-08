import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadRulesIndex, type RuleIndexEntry } from '../data/rules'
import { tableLabel, type GrimoireTable } from '../rules/tableIndex'
import { PaperModal } from './DetailBits'
import { RuleDetail, RuleTableView } from './RuleDetail'

// Ficha de uma tabela do Table Grimoire: a tabela no formato das regras e o
// link para a regra de onde ela vem (e as outras que a repetem).
export function TableDetail({ table, onClose }: { table: GrimoireTable; onClose: () => void }) {
  const [rules, setRules] = useState<RuleIndexEntry[] | null>(null)
  const [openRule, setOpenRule] = useState<RuleIndexEntry | null>(null)

  useEffect(() => {
    loadRulesIndex()
      .then(setRules)
      .catch(() => setRules([]))
  }, [])

  const ruleOf = (id: string) => rules?.find((r) => r.id === id) ?? null
  const sources = [table.ruleID, ...table.alsoIn].map(ruleOf).filter((r): r is RuleIndexEntry => r !== null)

  return createPortal(
    <>
      <PaperModal title={tableLabel(table)} subtitle={`${table.book} · Ch. ${table.chapterNumber}: ${table.chapterTitle}`} onClose={onClose} wide>
        {table.setting !== 'Core' && <p className="paper-soft">Campaign setting: {table.setting}</p>}
        <RuleTableView table={{ tableNumber: table.number ?? '', title: '', headers: table.headers, rows: table.rows }} />
        {sources.length > 0 && (
          <p className="paper-soft">
            From{' '}
            {sources.map((rule, index) => (
              <span key={rule.id}>
                {index > 0 && ', '}
                <button className="paper-link" onClick={() => setOpenRule(rule)}>
                  {rule.book}: {rule.topic}
                </button>
              </span>
            ))}
          </p>
        )}
      </PaperModal>
      {openRule && <RuleDetail entry={openRule} onClose={() => setOpenRule(null)} />}
    </>,
    document.body,
  )
}
