import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadMonster, type Monster, type MonsterIndexEntry, type MonsterVariant } from '../data/monsters'
import { combatRows, ecologyRows, extraRows, textBlocks, type StatRow } from '../rules/monsters'
import { PaperModal, TextBlock } from './DetailBits'

// Ficha do monstro: bloco de estatísticas no formato do Monstrous Manual (uma
// coluna por variante em tela larga; abas por variante no celular) e a descrição.

const sectionLabels: Record<string, string> = { combat: 'Combat', habitatSociety: 'Habitat/Society', ecology: 'Ecology' }

/** Tela estreita (celular): variantes em abas em vez de colunas lado a lado. */
function useNarrow() {
  const query = '(max-width: 640px)'
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setNarrow(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return narrow
}

function StatTable({ variants, rows, showNames }: { variants: MonsterVariant[]; rows: StatRow[]; showNames: boolean }) {
  return (
    <table className="monster-stats">
      {showNames && (
        <thead>
          <tr>
            <th />
            {variants.map((v, i) => (
              <th key={i} scope="col">
                {v.name}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}:</th>
            {variants.map((v, i) => (
              <td key={i}>{row.value(v) ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Body({ monster }: { monster: Monster }) {
  const narrow = useNarrow()
  const [active, setActive] = useState(0)
  const many = monster.variants.length > 1
  const shown = narrow && many ? [monster.variants[Math.min(active, monster.variants.length - 1)]] : monster.variants
  const rows = [...ecologyRows, ...combatRows, ...extraRows(monster.variants)]
  const sections = Object.entries(monster.description.sections ?? {})
  const notes = monster.variants.filter((v) => v.note)
  const books = [...new Set(monster.sources.map((s) => s.book).filter(Boolean))]

  return (
    <>
      {narrow && many && (
        <div className="chip-row chip-row-scroll monster-tabs" role="tablist">
          {monster.variants.map((v, i) => (
            <button key={i} role="tab" aria-selected={i === active} className={i === active ? 'chip chip-on' : 'chip'} onClick={() => setActive(i)}>
              {v.name}
            </button>
          ))}
        </div>
      )}
      <div className="monster-stats-wrap">
        <StatTable variants={shown} rows={rows} showNames={many && !narrow} />
      </div>
      {notes.map((v) => (
        <p key={v.name} className="paper-soft">
          {many ? `${v.name}: ` : ''}
          {v.note}
        </p>
      ))}

      {monster.description.summary && <p className="monster-summary">{monster.description.summary}</p>}
      {sections.length > 0
        ? sections.map(([key, text]) => <TextBlock key={key} label={sectionLabels[key] ?? key} text={text} />)
        : textBlocks(monster.description.fullText).map((b, i) => <TextBlock key={i} label={b.heading ?? 'Description'} text={b.text} />)}

      <p className="paper-soft monster-source">
        {monster.collection}
        {books.length > 0 ? ` · ${books.join('; ')}` : ''}
      </p>
    </>
  )
}

export function MonsterDetail({ entry, onClose }: { entry: MonsterIndexEntry; onClose: () => void }) {
  const [monster, setMonster] = useState<Monster | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    loadMonster(entry)
      .then(setMonster)
      .catch((reason: unknown) => setError(String(reason)))
  }, [entry])

  return createPortal(
    <PaperModal title={entry.name} subtitle={entry.collection} onClose={onClose} wide>
      {monster ? <Body monster={monster} /> : <p className="paper-soft">{error ? `Could not load: ${error}` : 'Loading…'}</p>}
    </PaperModal>,
    document.body,
  )
}
