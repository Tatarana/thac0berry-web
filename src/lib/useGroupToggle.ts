import { useState } from 'react'

/**
 * Abre/fecha os grupos recolhíveis dos compêndios.
 *
 * Sem busca nem filtro, tudo começa fechado e o usuário abre o que quiser.
 * Com busca ou filtro ativo (`autoExpand`), tudo abre sozinho, mas o usuário
 * ainda pode fechar um grupo (antes, com filtro ativo, os grupos não fechavam).
 * Mesmo comportamento do compêndio de itens mágicos do iPad.
 */
export function useGroupToggle(autoExpand: boolean) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const isExpanded = (key: string) => (autoExpand ? !collapsed.has(key) : expanded.has(key))

  function toggle(key: string) {
    const setter = autoExpand ? setCollapsed : setExpanded
    setter((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return { isExpanded, toggle }
}
