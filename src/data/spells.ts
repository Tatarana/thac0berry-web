// Magias do compêndio. Os arquivos vêm do repo thac0berry-data, copiados para
// public/data/ por scripts/build-data.mjs. Formato: schemas/spell.schema.json
// (thac0berry-data), o mesmo que o app iPad decodifica.

export type Caster = 'divine' | 'arcane'

/** Entrada leve do índice (lista e busca). */
export interface SpellIndexEntry {
  id: string
  name: string
  level: number
  school: string
  spheres: string[]
  schools: string[]
  setting: string | null
  file: string
}

/** Magia completa (ficha de detalhe). */
export interface Spell {
  id: string
  name: string
  level: number
  caster: Caster
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  areaOfEffect: string
  savingThrow: string
  damage?: string | null
  summary: string
  spheres?: string[]
  schools?: string[]
  fullDescription?: string | null
  setting?: string | null
}

type SpellIndex = Record<Caster, SpellIndexEntry[]>

const dataURL = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

let indexPromise: Promise<SpellIndex> | null = null
const filePromises = new Map<string, Promise<Spell[]>>()

export function loadSpellIndex(): Promise<SpellIndex> {
  indexPromise ??= fetch(dataURL('spells-index.json')).then((response) => {
    if (!response.ok) throw new Error(`spells-index.json: HTTP ${response.status}`)
    return response.json() as Promise<SpellIndex>
  })
  return indexPromise
}

/** Carrega (uma vez) o arquivo de um círculo e devolve a magia completa. */
export async function loadSpell(entry: SpellIndexEntry): Promise<Spell | undefined> {
  let promise = filePromises.get(entry.file)
  if (!promise) {
    promise = fetch(dataURL(`spells/${entry.file}`)).then((response) => {
      if (!response.ok) throw new Error(`${entry.file}: HTTP ${response.status}`)
      return response.json() as Promise<Spell[]>
    })
    filePromises.set(entry.file, promise)
  }
  const spells = await promise
  return spells.find((spell) => spell.id === entry.id)
}

/** Rótulo do círculo, igual ao do app iPad (SpellbookView.levelLabel). */
export function levelLabel(caster: Caster, level: number): string {
  if (caster === 'arcane') {
    if (level === 0) return 'Cantrips'
    if (level >= 10) return `High-Level / Epic (tier ${level})`
    return `Level ${level}`
  }
  if (level === 0) return 'Orisons'
  if (level === 8) return 'Quest Spells'
  if (level >= 9) return `High-Level / Epic (tier ${level})`
  return `Level ${level}`
}

/** Sem cenário, "Generic" ou "Core" = vale em qualquer campanha. */
export function isGenericSetting(setting: string | null): boolean {
  return setting === null || setting === 'Generic' || setting === 'Core'
}

/** Eixo do filtro: esferas (sacerdote) ou escolas (mago). */
export function axisValues(caster: Caster, spell: SpellIndexEntry): string[] {
  return caster === 'arcane' ? spell.schools : spell.spheres
}
