// Tribos de Vistani (Domains of Dread, Tabela 68): o Half-Vistani escolhe ou
// sorteia uma. Decisão do usuário (2026-10-17): perícias de graça entram na
// ficha (como as de kit); restrição de classe é só aviso (nunca bloqueia, o
// mestre pode abrir exceção); o resto (bônus de reação, antídotos, a
// iniciativa do Zarovan etc.) fica em texto, como qualquer habilidade
// racial — nenhuma raça tem mecânica automática além de atributo e
// proficiência. Só funções puras.

import { hasSpellSheet } from './rules.ts'
import type { CharacterClass } from '../types/library.ts'

export interface VistaniTribe {
  id: string
  name: string
  /** Faixa no 1d100 da Tabela 68 ("00" vale 100). */
  roll: { low: number; high: number }
  summary: string
  /** Perícias que a tribo dá de graça (nomes do compêndio quando existem). */
  freeProficiencies: string[]
  /** O resto da regra da tribo, em texto (vai para `racialAbilities`). */
  text: string
  /** null = nenhuma restrição de classe; senão, por que a classe não bate (só aviso). */
  classWarning?: (cls: CharacterClass | string) => string | null
}

const notCaster = (cls: CharacterClass | string) => (hasSpellSheet(cls) ? 'Kamii are never spellcasters (Domains of Dread).' : null)
const onlyThiefFighterMage = (cls: CharacterClass | string) =>
  ['Thief', 'Fighter', 'Mage'].includes(cls) ? null : 'Corvara are almost always thieves, sometimes fighters or wizards — no other class is open to them (Domains of Dread).'
const onlyMage = (tribe: string) => (cls: CharacterClass | string) => (cls === 'Mage' ? null : `${tribe} are always wizards (Domains of Dread).`)

export const vistaniTribes: VistaniTribe[] = [
  {
    id: 'kamii',
    name: 'Kamii',
    roll: { low: 1, high: 40 },
    summary: 'Quiet and the least confrontational of the tribes; mostly thieves (60%) or reluctant warriors (40%).',
    freeProficiencies: ['Blacksmithing'],
    text: 'Can identify metals as a druid identifies plants, and tell whether a metal item was forged beyond the Mists (5% cumulative chance per level to name its world or plane of origin). 25% chance to detect a curse on an item made by a Vistana before it affects them.',
    classWarning: notCaster,
  },
  {
    id: 'equaar',
    name: 'Equaar',
    roll: { low: 41, high: 60 },
    summary: 'Nature-loving; often rangers, though any class is open to them.',
    freeProficiencies: ['Animal Lore', 'Riding, Land-Based'],
    text: 'Can buy the tracking proficiency for a single slot, regardless of class.',
  },
  {
    id: 'vatraska',
    name: 'Vatraska',
    roll: { low: 61, high: 80 },
    summary: 'Skilled healers and herbalists; cold and somewhat condescending. Seldom priests, though nothing forbids it.',
    freeProficiencies: ['Herbalism'],
    text: 'Can buy the healing proficiency for a single slot, regardless of class. Can identify poisons as a druid identifies plants, and concoct an antidote in ten minutes (one turn) with herbs on hand (the recipient saves vs. poison or dies from the cure itself). Given 1d6+1 days to work, can brew an herbal sleeping draught (1d4 doses; drinker saves vs. poison or sleeps 1d4 hours; potent for 7 days).',
  },
  {
    id: 'naiat',
    name: 'Naiat',
    roll: { low: 81, high: 90 },
    summary: 'Flamboyant and outgoing; often gypsies.',
    freeProficiencies: ['Singing', 'Dancing'],
    text: "Can buy the musical instrument proficiency like a bard; specializing in the violin lets them affect NPC reactions and inspire allies like a bard. +1 to a new NPC's initial reaction roll, +2 if the player plays up a friendly approach (DM's call).",
  },
  {
    id: 'corvara',
    name: 'Corvara',
    roll: { low: 91, high: 97 },
    summary: 'Distrustful and profit-minded ("what\'s in it for me?").',
    freeProficiencies: ['Set Snares'],
    text: 'Corvara thieves get +10% to Pick Locks.',
    classWarning: onlyThiefFighterMage,
  },
  {
    id: 'canjar',
    name: 'Canjar',
    roll: { low: 98, high: 99 },
    summary: 'Aloof and prideful; covet magic items and spells, and share neither.',
    freeProficiencies: [],
    text: 'Can leave one 1st-level and one 2nd-level spell slot open each day, to be filled later with any spell recorded in their spellbooks (treated as memorized normally once filled).',
    classWarning: onlyMage('Canjar'),
  },
  {
    id: 'zarovan',
    name: 'Zarovan',
    roll: { low: 100, high: 100 },
    summary: 'Quiet, introspective and poor traveling companions; claim to be adrift in time. No more than one per party.',
    freeProficiencies: [],
    text: 'Initiative quirk: each round, roll 1d6 and 1d10. On a 1–3, subtract the d10 from initiative (acts a bit early); on a 4–6, add it (acts a bit late). A modified result above 10 means the character acts last that round.',
    classWarning: onlyMage('Zarovan'),
  },
]

/** "00" da Tabela 68 vale 100, como em qualquer d100 do app. */
export function vistaniTribeForRoll(roll: number): VistaniTribe | null {
  const value = roll === 0 ? 100 : roll
  return vistaniTribes.find((t) => value >= t.roll.low && value <= t.roll.high) ?? null
}

export const matchVistaniTribe = (id: string | null | undefined): VistaniTribe | null => vistaniTribes.find((t) => t.id === id) ?? null

/** Só aviso (nunca bloqueia): a classe da ficha não bate com a tribo escolhida. */
export function vistaniTribeWarnings(tribe: VistaniTribe, characterClass: CharacterClass | string): string[] {
  const warning = tribe.classWarning?.(characterClass)
  return warning ? [warning] : []
}
