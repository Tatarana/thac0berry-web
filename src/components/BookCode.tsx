import { useBookTitles } from '../lib/bookTitles'

// Sigla de um livro das regras (PHB, DMG, PWH…) com o título completo no
// tooltip (pedido do usuário, 2026-10-12: as siglas ficaram muitas).

/** A sigla, com o título completo ao passar o mouse. */
export function BookCode({ id }: { id: string }) {
  const title = useBookTitles().get(id)
  return title ? (
    <abbr className="book-code" title={title}>
      {id}
    </abbr>
  ) : (
    <>{id}</>
  )
}
