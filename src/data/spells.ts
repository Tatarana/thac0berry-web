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
  damageDice?: SpellDamage | null
  summary: string
  spheres?: string[]
  schools?: string[]
  fullDescription?: string | null
  setting?: string | null
}

/** Dados de dano/cura (SpellDamage do iPad). */
export interface SpellDamage {
  dice: number
  sides: number
  bonus: number
  scalesWithLevel: boolean
  maxDice?: number | null
  isHealing: boolean
  bonusPerLevel?: number
  maxBonus?: number | null
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

let byID: Promise<Map<string, SpellIndexEntry>> | null = null

/** Entrada do índice pelo id da magia (sacerdote ou mago). */
export async function findSpellEntry(id: string): Promise<SpellIndexEntry | undefined> {
  byID ??= loadSpellIndex().then((index) => {
    const map = new Map<string, SpellIndexEntry>()
    for (const entry of [...index.divine, ...index.arcane]) map.set(entry.id, entry)
    return map
  })
  return (await byID).get(id)
}

/**
 * Texto de dano/cura para o nível do conjurador, igual a
 * SpellDamage.text(casterLevel:) do iPad (ex.: "3d6", "1d8 + 2").
 */
export function damageText(d: SpellDamage, casterLevel: number): string {
  const level = Math.max(casterLevel, 1)
  const raw = d.scalesWithLevel ? d.dice * level : d.dice
  const count = d.scalesWithLevel ? Math.min(raw, d.maxDice ?? raw) : d.dice
  let bonus = d.bonus
  if ((d.bonusPerLevel ?? 0) > 0) {
    const scaled = (d.bonusPerLevel ?? 0) * level
    bonus += Math.min(scaled, d.maxBonus ?? scaled)
  }
  let text = d.sides > 0 ? `${count}d${d.sides}` : `${count}`
  if (bonus > 0) text += ` + ${bonus}`
  if (bonus < 0) text += ` - ${Math.abs(bonus)}`
  return text
}

/** Tempo de conjuração curto da folha ("2 t", "1 r"), como no iPad. */
export function shortCastingTime(raw: string): string {
  const space = raw.indexOf(' ')
  if (space === -1) return raw
  const count = raw.slice(0, space)
  const unit = raw.slice(space + 1).toLowerCase()
  if (unit.startsWith('turn')) return `${count} t`
  if (unit.startsWith('round')) return `${count} r`
  return raw
}
