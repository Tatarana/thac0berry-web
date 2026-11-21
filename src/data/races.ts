// Raças (formato: schemas/race.schema.json no thac0berry-data; gerado lá por
// scripts/build_races.py). scripts/build-data.mjs grava public/data/races.json
// sem o texto longo do livro, que vai para races-content.json (lido só no detalhe).
//
// As regras de raça (src/rules/raceKit.ts) são funções síncronas usadas em
// render; por isso as raças são carregadas uma vez, no início do app
// (`loadRaces()` em main.tsx, antes do primeiro render), e entregues ao
// registro de raceKit.ts com `setRaceData`.

import { setRaceData } from '../rules/raceKit.ts'
import { loadData } from './load.ts'

export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export interface RaceCombatModifier {
  label: string
  value: string
}

export type RaceHiddenReason = 'humanoid-not-playable' | 'setting-not-in-forge' | 'undecided' | 'duplicate'

export interface Race {
  id: string
  /** O texto que a ficha grava no campo Raça. */
  name: string
  label?: string
  gender?: 'male' | 'female'
  aliases?: string[]
  /** Ausente = jogável. */
  playable?: boolean
  hiddenReason?: RaceHiddenReason
  duplicateOf?: string
  /** null = livros gerais (Core). */
  campaignSetting?: string | null
  /** Grupo da lista do Forge: "Player's Handbook", "Subraces" ou o cenário. */
  group?: string
  /** Id de uma das 6 raças do PHB. */
  baseRace?: string
  inheritsFromBase?: string[]
  source?: { label?: string; book?: string | null; page?: string | null; category?: string | null; minedId?: string | null }
  note?: string

  size?: string | null
  speed?: string | null
  hitPoints?: string | null
  armorClass?: string | null
  languages?: string | null
  vision?: string | null
  height?: string | null
  weight?: string | null
  attackBonus?: string | null
  resistance?: string | null
  alignment?: string | null
  briefSummary?: string | null

  abilityScoreRequirements?: Partial<Record<AbilityKey, { min: number; max: number }>> | null
  abilityScoreAdjustments?: { ability: AbilityKey; modifier: number }[] | null
  noLevelLimit?: boolean
  classLevelLimits?: { class: string; levelLimit: number | 'unlimited' }[] | null
  classCombinations?: string[][] | null

  /** Movimento base em polegadas (12 = 12"). */
  baseMovement?: number
  racialAbilities?: string | null
  spellResistance?: string | null
  combatModifiers?: { toHit?: RaceCombatModifier[]; ac?: RaceCombatModifier[] }
  constitutionSaveBonus?: string
  singleClassBonus?: number
  demiBardKits?: Record<string, number>
  bardCombos?: { classes: string[]; kits: string[] }[]
  bonusProficiencies?: string[]
  kitForms?: string[]
  ruleId?: string
}

/** Carrega races.json uma vez (e o entrega ao registro de raceKit.ts). */
export async function loadRaces(): Promise<Race[]> {
  const races = await loadData<Race[]>('races.json')
  setRaceData(races)
  return races
}

/** Texto longo (markdown) do livro, só para o detalhe da raça. */
export async function loadRaceContent(id: string): Promise<string | null> {
  const all = await loadData<Record<string, string>>('races-content.json')
  return all[id] ?? null
}
