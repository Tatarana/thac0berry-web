// Negrito (**…**) e itálico (*…*) dentro do texto das regras — o mesmo que o
// Text(LocalizedStringKey) do iPad mostra. Só divide o texto em pedaços; quem
// desenha é o componente InlineMarkdown. Um `*` sem par (nota de rodapé de
// tabela, por exemplo) fica como texto.
const pattern = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*/g

export interface InlinePart {
  text: string
  style: 'plain' | 'bold' | 'italic'
}

export function parseInlineMarkdown(text: string): InlinePart[] {
  const parts: InlinePart[] = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ text: text.slice(last, start), style: 'plain' })
    if (match[1] !== undefined) parts.push({ text: match[1], style: 'bold' })
    else parts.push({ text: match[2], style: 'italic' })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), style: 'plain' })
  return parts
}
