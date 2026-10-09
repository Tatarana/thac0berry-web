import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { loadRulesIndex, type RuleIndexEntry } from '../data/rules'
import { formatDice, rollDice } from '../rules/dice'
import { tableLabel, type GrimoireTable } from '../rules/tableIndex'
import { findRow, rollPlan, rowRefs, tableRefs, typedResult, type TableRef } from '../rules/tableRoll'
import { PaperModal } from './DetailBits'
import { RuleDetail } from './RuleDetail'

/** Uma rolagem ou consulta do histórico da sessão (vale para todas as tabelas). */
export interface RollRecord {
  id: number
  tableID: string
  table: string
  /** "d100: 37" ou "typed 37". */
  how: string
  /** O que a linha diz (sem a faixa); "no row" quando nenhuma linha cobre o valor. */
  result: string
}

// Ficha de uma tabela do Table Grimoire: a tabela, o Roll (motor de dados) e o
// resultado digitado com a linha em destaque (GT2); citações a outras tabelas
// viram links e o resultado oferece rolar na próxima (GT3); as regras de onde
// a tabela vem.
export function TableDetail({
  table,
  tables,
  autoRoll,
  history,
  onRecord,
  onOpen,
  onClose,
  pin,
}: {
  table: GrimoireTable
  /** Todas as tabelas (para achar as citadas). */
  tables: GrimoireTable[]
  /** Abriu por "Roll on Table N": rola sozinha ao abrir. */
  autoRoll: boolean
  history: RollRecord[]
  onRecord: (record: Omit<RollRecord, 'id'>) => void
  onOpen: (table: GrimoireTable, autoRoll: boolean) => void
  onClose: () => void
  /** Fixar a tabela na faixa do Combat Tracker (CT4). */
  pin?: { pinned: boolean; onToggle: () => void }
}) {
  const plan = useMemo(() => rollPlan(table), [table])
  const [value, setValue] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [lastRoll, setLastRoll] = useState<number[] | null>(null)
  const [rules, setRules] = useState<RuleIndexEntry[] | null>(null)
  const [openRule, setOpenRule] = useState<RuleIndexEntry | null>(null)

  useEffect(() => {
    loadRulesIndex()
      .then(setRules)
      .catch(() => setRules([]))
  }, [])

  const hit = plan && value !== null ? findRow(plan, value) : -1
  const describe = (index: number) => (index < 0 ? 'no row' : table.rows[index].slice(1).filter((c) => c.trim() !== '').join(' · ') || table.rows[index][0])
  const target = (ref: TableRef) => tables.find((t) => t.book === ref.book && t.number === ref.number) ?? null

  const roll = () => {
    if (!plan?.dice) return
    const result = rollDice(plan.dice)
    setValue(result.total)
    setTyped('')
    setLastRoll(result.dice)
    onRecord({ tableID: table.id, table: tableLabel(table), how: `${formatDice(plan.dice)}: ${result.total}`, result: describe(findRow(plan, result.total)) })
  }

  // "Roll on Table N" de outra tabela: rola ao abrir, uma vez (a trava segura o
  // efeito dobrado do StrictMode).
  const autoRolled = useRef(false)
  const rollOnOpen = useEffectEvent(roll)
  useEffect(() => {
    if (!autoRoll || autoRolled.current) return
    autoRolled.current = true
    rollOnOpen()
  }, [autoRoll])

  // Resultado digitado entra no histórico no Enter ou ao sair do campo (uma vez por valor).
  const recordedTyped = useRef<string | null>(null)
  const lookUp = () => {
    const v = typedResult(typed, plan?.dice ?? null)
    if (v === null || !plan || recordedTyped.current === typed) return
    recordedTyped.current = typed
    onRecord({ tableID: table.id, table: tableLabel(table), how: `typed ${v}`, result: describe(findRow(plan, v)) })
  }

  /** Texto da célula com "Table N" virando link quando a tabela existe. */
  const cellText = (text: string): ReactNode => {
    const refs = tableRefs(text, table.book)
    if (refs.length === 0) return text
    const parts: ReactNode[] = []
    let at = 0
    refs.forEach((ref, i) => {
      parts.push(text.slice(at, ref.start))
      const found = target(ref)
      const label = text.slice(ref.start, ref.end)
      parts.push(
        found ? (
          <button key={i} type="button" className="paper-link table-ref" onClick={() => onOpen(found, false)}>
            {label}
          </button>
        ) : (
          <span key={i} className="table-ref-missing" title="This table is not in the data yet">
            {label}
          </span>
        ),
      )
      at = ref.end
    })
    parts.push(text.slice(at))
    return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)
  }

  const next = hit >= 0 ? rowRefs(table.rows[hit], table.book) : []
  const ruleOf = (id: string) => rules?.find((r) => r.id === id) ?? null
  const sources = [table.ruleID, ...table.alsoIn].map(ruleOf).filter((r): r is RuleIndexEntry => r !== null)
  const typedValue = typedResult(typed, plan?.dice ?? null)

  return createPortal(
    <>
      <PaperModal title={tableLabel(table)} subtitle={`${table.book} · Ch. ${table.chapterNumber}: ${table.chapterTitle}`} onClose={onClose} wide>
        {table.setting !== 'Core' && <p className="paper-soft">Campaign setting: {table.setting}</p>}
        {pin && (
          <button className={pin.pinned ? 'chip chip-on table-pin' : 'chip table-pin'} onClick={pin.onToggle} title={pin.pinned ? 'Remove from the Combat Tracker tables' : 'Show this table in the Combat Tracker'}>
            {pin.pinned ? '★ In the Combat Tracker' : '☆ Combat Tracker'}
          </button>
        )}

        {plan && (
          <form
            className="table-roller"
            onSubmit={(event) => {
              event.preventDefault()
              lookUp()
            }}
          >
            {plan.dice && (
              <button type="button" className="chip chip-on table-roll" onClick={roll}>
                Roll {formatDice(plan.dice)}
              </button>
            )}
            <label className="table-typed">
              <span className="paper-label">{plan.dice ? 'or your roll' : 'Look up'}</span>
              <input
                className="paper-search"
                inputMode="numeric"
                value={typed}
                placeholder={plan.dice ? formatDice(plan.dice) : 'value'}
                aria-label={plan.dice ? 'Your roll' : 'Value to look up'}
                onChange={(event) => {
                  setTyped(event.target.value)
                  const v = typedResult(event.target.value, plan.dice)
                  setValue(v)
                  setLastRoll(null)
                }}
                onBlur={() => typedValue !== null && lookUp()}
              />
            </label>
            {value !== null && (
              <p className="table-result">
                <strong>{value}</strong>
                {lastRoll && lastRoll.length > 1 ? ` (${lastRoll.join(' + ')})` : ''} → {cellText(describe(hit))}
              </p>
            )}
            {next.map((ref, i) => {
              const found = target(ref)
              return found ? (
                <button key={i} type="button" className="paper-link table-next" onClick={() => onOpen(found, rollPlan(found)?.dice != null)}>
                  {rollPlan(found)?.dice ? 'Roll on' : 'Open'} {tableLabel(found)} ›
                </button>
              ) : (
                <p key={i} className="paper-soft">
                  Table {ref.number} ({ref.book}) is not in the data yet.
                </p>
              )
            })}
            {plan.headerMismatch && plan.dice && (
              <p className="paper-soft">The book's header says “{table.headers[0]}”, but the ranges need a {formatDice(plan.dice)}.</p>
            )}
          </form>
        )}

        <div className="rule-table">
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
                  <tr key={rowIndex} className={rowIndex === hit ? 'table-hit' : undefined}>
                    {row.map((cell, cellIndex) => (
                      // "0" que o motor leu como 00 (zero perdido na extração) aparece como 00.
                      <td key={cellIndex}>{cellIndex === 0 && cell.trim() === '0' && plan?.ranges[rowIndex]?.low === 100 ? '00' : cellText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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

        {history.length > 0 && (
          <section className="table-history">
            <span className="paper-label">This session</span>
            <ul>
              {history.slice(0, 8).map((record) => {
                const found = tables.find((t) => t.id === record.tableID)
                return (
                  <li key={record.id}>
                    {found && found.id !== table.id ? (
                      <button className="paper-link" onClick={() => onOpen(found, false)}>
                        {record.table}
                      </button>
                    ) : (
                      <span>{record.table}</span>
                    )}
                    <span className="paper-soft">
                      {' '}
                      · {record.how} → {record.result}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </PaperModal>
      {openRule && <RuleDetail entry={openRule} onClose={() => setOpenRule(null)} />}
    </>,
    document.body,
  )
}
