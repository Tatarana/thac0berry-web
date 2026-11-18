import type { RuleTable } from '../data/rules'

// Tabela de regra (RuleTableView do iPad): cabeçalho escuro, linhas alternadas,
// rolagem horizontal quando é larga.
export function RuleTableView({ table }: { table: RuleTable }) {
  return (
    <div className="rule-table">
      {table.title && <p className="paper-soft">{table.title}</p>}
      <div className="rule-table-scroll">
        <table>
          {/* Tabela sem cabeçalho (pares "rótulo | valor" dos suplementos): sem thead. */}
          {table.headers.some((header) => header.trim() !== '') && (
            <thead>
              <tr>
                {table.headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
          )}
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
