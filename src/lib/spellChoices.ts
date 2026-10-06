import { useEffect, useState } from 'react'
import { loadSpellIndex } from '../data/spells'
import type { SpellChoice } from '../rules/spellSheets'

// Magias do compêndio (índice) para sugestões de nome, com o tipo de conjurador.

export type Caster = 'arcane' | 'divine'
export type CasterChoice = SpellChoice & { caster: Caster }

let allChoices: Promise<CasterChoice[]> | null = null

/** Todas as magias do compêndio, de sacerdote e de mago. */
export function loadSpellChoices(): Promise<CasterChoice[]> {
  allChoices ??= loadSpellIndex().then((index) => [
    ...index.divine.map((e) => ({ id: e.id, name: e.name, level: e.level, spheres: e.spheres, caster: 'divine' as const })),
    ...index.arcane.map((e) => ({ id: e.id, name: e.name, level: e.level, spheres: e.spheres, caster: 'arcane' as const })),
  ])
  return allChoices
}

/** As magias dos conjuradores pedidos (ex.: só sacerdote). */
export function useSpellChoices(casters: Caster[]) {
  const [choices, setChoices] = useState<CasterChoice[]>([])
  const key = casters.join('|')
  useEffect(() => {
    let cancelled = false
    void loadSpellChoices().then((all) => {
      if (!cancelled) setChoices(all.filter((c) => key.split('|').includes(c.caster)))
    })
    return () => {
      cancelled = true
    }
  }, [key])
  return choices
}

