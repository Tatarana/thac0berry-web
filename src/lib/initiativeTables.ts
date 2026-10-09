import { useEffect, useMemo, useState } from 'react'
import { loadTables } from '../data/tables'
import { initiativeModifiers, type InitiativeMethod, type InitiativeModifier } from '../rules/combat'

// Modificadores de iniciativa do Combat Tracker, lidos do Table Grimoire:
// Tabela 40 (padrão) e 41 (opcionais, só na iniciativa individual).

/** Modificadores do método: Tabela 40, mais a 41 no individual. */
export function useInitiativeModifiers(method: InitiativeMethod) {
  const [tables, setTables] = useState<{ standard: InitiativeModifier[]; optional: InitiativeModifier[] }>({ standard: [], optional: [] })
  useEffect(() => {
    void loadTables().then((all) => {
      const rows = (id: string) => all.find((t) => t.id === id)?.rows ?? []
      setTables({ standard: initiativeModifiers(rows('dmg-40')), optional: initiativeModifiers(rows('dmg-41')) })
    })
  }, [])
  return useMemo(() => (method === 'individual' ? [...tables.standard, ...tables.optional] : tables.standard), [method, tables])
}
