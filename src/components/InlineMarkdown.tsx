import { parseInlineMarkdown } from '../lib/inlineMarkdown'

// Negrito e itálico do texto das regras (ver src/lib/inlineMarkdown.ts). Monta
// elementos React (nunca HTML cru), então nenhum texto dos dados vira marcação
// executável.
export function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((part, index) =>
        part.style === 'bold' ? (
          <strong key={index}>{part.text}</strong>
        ) : part.style === 'italic' ? (
          <em key={index}>{part.text}</em>
        ) : (
          part.text
        ),
      )}
    </>
  )
}
