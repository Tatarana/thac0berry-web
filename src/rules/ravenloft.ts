// Ravenloft (Domains of Dread, GT4b; docs/ravenloft.md): classes jogáveis do
// cenário e os testes de medo, horror e loucura. Classes feitas primeiro na web
// (o iPad lê valor desconhecido como Fighter). Só funções puras.

import type { CharacterClass, PlayerCharacter } from '../types/library.ts'
import { hasClass, type ClassChoice } from './multiclass.ts'
import { matchRace } from './raceKit.ts'
import { canonicalClass, type CanonicalClass } from './rules.ts'

/** O nome do cenário em `campaign.enabled_settings` (lista de `lib/campaigns.ts`). */
export const RAVENLOFT = 'Ravenloft'

/** Classes do Domains of Dread que o jogador pode escolher (decisão do usuário: Anchorite e Gypsy). */
export const ravenloftClasses: CanonicalClass[] = ['Anchorite', 'Gypsy']

export const isRavenloftClass = (cls: CharacterClass | string) => ravenloftClasses.includes(canonicalClass(cls))

/**
 * Decisão do usuário (2026-10-10): a classe só aparece no seletor quando a
 * campanha do personagem tem Ravenloft ligado. Sem campanha, ou campanha sem
 * cenário ligado, não aparece (diferente do filtro "nenhum ligado = tudo").
 */
export const campaignAllowsRavenloft = (settings: string[] | null | undefined) => !!settings?.includes(RAVENLOFT)

/** As classes do seletor: as de sempre, mais as de Ravenloft quando a campanha permite. */
export function classOptionsFor(base: CharacterClass[], settings: string[] | null | undefined): CharacterClass[] {
  return campaignAllowsRavenloft(settings) ? [...base, ...(ravenloftClasses as CharacterClass[])] : base
}

/**
 * Kits de Ravenloft (Denizens of Dread, `setting: "Ravenloft"` no kits.json):
 * mesma regra das classes, só com o cenário ligado na campanha.
 */
export const kitAllowedInCampaign = (kit: { setting?: string | null }, settings: string[] | null | undefined) =>
  kit.setting !== RAVENLOFT || campaignAllowsRavenloft(settings)

/** Requisitos de cada classe (Domains of Dread): atributos mínimos e raças. */
const requirements: Partial<
  Record<CanonicalClass, { plural: string; abilities: Partial<Record<keyof PlayerCharacter['abilities'], number>>; races: string[]; racesText: string }>
> = {
  Anchorite: { plural: 'Anchorites', abilities: { wisdom: 12, charisma: 15 }, races: ['Human'], racesText: 'human' },
  // Half-Vistani é raça do Domains of Dread que o app ainda não tem: fica fora do aviso.
  Gypsy: {
    plural: 'Gypsies',
    abilities: { constitution: 13, intelligence: 13, wisdom: 13, charisma: 15 },
    races: ['Human', 'Half-Elf'],
    racesText: 'human, half-elf or Half-Vistani',
  },
}

const abilityName: Record<string, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

/**
 * Avisos de uma classe de Ravenloft (só aviso, como no resto da ficha): a
 * campanha desligou o cenário, atributo abaixo do mínimo, raça não permitida.
 */
export function ravenloftWarnings(
  c: Pick<PlayerCharacter, 'characterClass' | 'abilities' | 'race'>,
  settings: string[] | null | undefined,
): string[] {
  const cls = canonicalClass(c.characterClass)
  if (!isRavenloftClass(cls)) return []
  const warnings: string[] = []
  if (!campaignAllowsRavenloft(settings)) warnings.push(`${cls} is a Ravenloft class, and this character's campaign does not have the Ravenloft setting on.`)
  const req = requirements[cls]
  if (req) {
    for (const [ability, min] of Object.entries(req.abilities)) {
      const score = c.abilities[ability as keyof PlayerCharacter['abilities']] as number
      if (score < (min ?? 0)) warnings.push(`${req.plural} need ${abilityName[ability]} ${min} or more (Domains of Dread); this character has ${score}.`)
    }
    const race = matchRace(c.race)
    if (race && !req.races.includes(race)) warnings.push(`${req.plural} must be ${req.racesText} (Domains of Dread).`)
  }
  return warnings
}

// --- Fear, Horror and Madness Checks ---------------------------------------------------
//
// Do thac0berry-data (regra dod_ch00_fear_horror_and_madness_checks): as duas
// transcrições dos fãs batem em todos os valores. Acima do 20º nível não há valores.

export interface ScareChecks {
  fear: number
  horror: number
  madness: number
}

const band = (maxLevel: number, fear: number, horror: number, madness: number) => ({ maxLevel, values: { fear, horror, madness } })

/** Grupo Priest (a tabela do Anchorite). */
const priestChecks = [
  band(0, 14, 16, 19),
  band(2, 13, 15, 18),
  band(4, 12, 14, 17),
  band(6, 11, 13, 16),
  band(8, 10, 12, 15),
  band(10, 9, 11, 14),
  band(12, 7, 10, 13),
  band(14, 5, 9, 12),
  band(16, 3, 7, 11),
  band(18, 2, 5, 10),
  band(20, 2, 3, 8),
]

/** Grupo Rogue (Tabela 95, a do Gypsy). */
const rogueChecks = [
  band(0, 16, 16, 19),
  band(2, 15, 15, 18),
  band(4, 14, 14, 17),
  band(6, 13, 13, 16),
  band(8, 12, 12, 15),
  band(10, 11, 11, 14),
  band(12, 9, 10, 13),
  band(14, 7, 9, 12),
  band(16, 5, 7, 11),
  band(18, 3, 5, 10),
  band(20, 2, 3, 8),
]

const checksByClass: Partial<Record<CanonicalClass, typeof priestChecks>> = {
  Anchorite: priestChecks,
  Gypsy: rogueChecks,
}

/** Os números dos testes da classe no nível; null fora das classes de Ravenloft ou acima do 20º. */
export function scareChecks(cls: CharacterClass | string, level: number): ScareChecks | null {
  const table = checksByClass[canonicalClass(cls)]
  return table?.find((b) => level <= b.maxLevel)?.values ?? null
}

// --- Habilidades do Gypsy -----------------------------------------------------------------

/** Gypsy Lore: 5% por nível de saber algo sobre um tema (Domains of Dread), até 100%. */
export const gypsyLore = (level: number) => Math.max(0, Math.min(100, 5 * level))

/**
 * Especialização do Gypsy: só na faca ("the knife"), +1 no ataque e +2 no
 * dano, sem ataque extra (Domains of Dread, Knife Fighting).
 */
export const gypsyCanSpecialize = (weaponName: string) => /\bknife\b/i.test(weaponName)

/** Só o Gypsy (sem Mage nem Bard): o grimório vira a lista de magias conhecidas, só de adivinhação. */
export const gypsyKnownSpellsOnly = (c: ClassChoice) => hasClass(c, 'Gypsy') && !hasClass(c, 'Mage') && !hasClass(c, 'Bard')

/** Só a magia de adivinhação conta para o Gypsy (lesser e greater divination: a escola Divination). */
export const isGypsySpell = (schools: string[] | null | undefined) => (schools ?? []).includes('Divination')
