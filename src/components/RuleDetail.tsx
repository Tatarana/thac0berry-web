import { useEffect, useState } from 'react'
import { loadRule, parseRuleContent, type RuleEntry, type RuleIndexEntry, type RuleTable } from '../data/rules'
import { PaperModal } from './DetailBits'
import { InlineMarkdown } from './InlineMarkdown'

// Tabela de regra (RuleTableView do iPad): cabeçalho escuro, linhas alternadas,
// rolagem horizontal quando é larga.
export function RuleTableView({ table }: { table: RuleTable }) {
  return (
    <div className="rule-table">
      <p className="paper-soft">{table.title}</p>
      <div className="rule-table-scroll">
        <table>
          <thead>
            <tr>
              {table.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RuleBody({ rule }: { rule: RuleEntry }) {
  const blocks = parseRuleContent(rule.content, rule.tables)
  return (
    <div className="rule-body">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h3 key={index} className="rule-heading">
                <InlineMarkdown text={block.text} />
              </h3>
            )
          case 'subheading':
            return (
              <h4 key={index} className="rule-subheading">
                <InlineMarkdown text={block.text} />
              </h4>
            )
          case 'paragraph':
            return (
              <p key={index} className="detail-description">
                <InlineMarkdown text={block.text} />
              </p>
            )
          case 'list':
            return (
              <ul key={index} className="rule-list">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineMarkdown text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'table':
            return <RuleTableView key={index} table={block.table} />
        }
      })}
    </div>
  )
}

// Ficha da regra (RuleDetailSheet do iPad): tópico, caminho no livro e o
// texto em blocos, com as tabelas no lugar das referências.
export function RuleDetail({ entry, onClose }: { entry: RuleIndexEntry; onClose: () => void }) {
  const [rule, setRule] = useState<RuleEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRule(entry)
      .then((found) => (found ? setRule(found) : setError('Rule not found in its book file.')))
      .catch((reason: unknown) => setError(String(reason)))
  }, [entry])

  return (
    <PaperModal title={entry.topic} subtitle={rule?.breadcrumbs ?? `${entry.book} · Ch. ${entry.chapterNumber}: ${entry.chapterTitle}`} onClose={onClose}>
      {error && <p className="paper-soft">Could not load the rule: {error}</p>}
      {!rule && !error && <p className="paper-soft">Loading…</p>}
      {rule && <RuleBody rule={rule} />}
    </PaperModal>
  )
}
