import type { ReactNode } from 'react'

// Negrito (**…**) e itálico (*…*) dentro do texto das regras — o mesmo que o
// Text(LocalizedStringKey) do iPad mostra. Monta elementos React (nunca HTML
// cru), então nenhum texto dos dados vira marcação executável.
const pattern = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*/g

export function InlineMarkdown({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let last = 0
  let index = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    if (match[1] !== undefined) parts.push(<strong key={index++}>{match[1]}</strong>)
    else parts.push(<em key={index++}>{match[2]}</em>)
    last = start + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}
