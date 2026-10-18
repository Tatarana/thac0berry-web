import type { ReactNode } from 'react'
import type { RollPlan } from '../rules/tableRoll'
import type { GrimoireTable } from '../rules/tableIndex'

// A tabela em si (cabeçalho + linhas), o mesmo <table> do Table Grimoire
// (antes só dentro de TableDetail): componentizado pra nunca duplicar a
// visualização — quem mais mostra uma tabela (o Shield) usa isto.
export function GrimoireTableBody({
  table,
  plan,
  highlightIndex,
  cellText,
}: {
  table: GrimoireTable
  plan: RollPlan | null
  /** A linha do último resultado, em destaque (como no Table Grimoire). */
  highlightIndex?: number
  /** Citações "Table N" viram link; default = texto puro. */
  cellText?: (text: string) => ReactNode
}) {
  return (
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
              <tr key={rowIndex} className={rowIndex === highlightIndex ? 'table-hit' : undefined}>
                {row.map((cell, cellIndex) => {
                  // "0" que o motor leu como 00 (zero perdido na extração) aparece como 00.
                  const text = cellIndex === 0 && cell.trim() === '0' && plan?.ranges[rowIndex]?.low === 100 ? '00' : cell
                  return <td key={cellIndex}>{cellText ? cellText(text) : text}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
