// Kits (formato: schemas/kit.schema.json no thac0berry-data; modelo Swift
// Models/Kit.swift no app iPad). Um arquivo por grupo de classe, gerado por
// scripts/build-data.mjs sem o texto bruto de wiki.

import { markdownTables } from '../rules/tableIndex.ts'
import type { RuleTable } from './rules'

export type ClassGroup = 'Priest' | 'Wizard' | 'Warrior' | 'Rogue' | 'Psionicist' | 'Demihuman'

/**
 * Proficiências nonweapon do kit (thac0berry-data, kit.schema.json): nomes exatos de
 * proficiencies.json; os campos opcionais ficam ausentes quando vazios.
 */
export interface KitProficiencies {
  /** Grátis (0 slots). */
  bonus?: string[] | null
  /** Grátis, uma de cada lista ("Hunting or Fishing"). */
  bonusChoices?: string[][] | null
  /** O kit obriga a tomar (gasta slots). */
  required?: string[] | null
  requiredChoices?: string[][] | null
  recommended?: string[] | null
  forbidden?: string[] | null
  notes?: string | null
}

/** Especialização lida do livro: armas, se é obrigatória e se as outras ficam proibidas. */
export interface KitSpecializationData {
  weapons: string[]
  mustSpecialize: boolean
  othersForbidden: boolean
}

/** Armas do kit: nomes do PHB sem o parêntese ("Long bow") ou em maiúscula, fora do PHB ("Katana"). */
export interface KitWeapons {
  notes?: string | null
  required?: string[] | null
  requiredChoices?: string[][] | null
  recommended?: string[] | null
  forbidden?: string[] | null
  /** As únicas armas do kit; alguns kits limitam só as iniciais, por isso é aviso. */
  allowed?: string[] | null
  specialization?: KitSpecializationData | null
}

export interface Kit {
  id: string
  name: string
  classEligibility: { classGroup: string; subclass: string; allowedClasses: string[]; combination?: string[] }
  sourceBook: string
  features: {
    role?: string | null
    requirements?: string | null
    specialBenefits?: string | null
    specialHindrances?: string | null
    wealthOptions?: string | null
    weaponProficiencies?: string | null
    nonweaponProficiencies?: string | null
    equipment?: string | null
  }
  description: { briefSummary: string; fullText: string }
  categories: string[]
  mechanics: {
    requirements: { abilities: Record<string, number>; alignments: string[]; races?: string | null }
    turnUndead: { capable: boolean; mode: string; notes: string }
    startingCash?: string | null
    weapons?: KitWeapons | null
    weaponSlots?: { initial?: number | null; additional?: number | null; nonproficiencyPenalty?: string | null } | null
    nonweaponSlots?: { initial?: number | null; bonus?: number | null; perLevels?: number | null; notes?: string | null } | null
    proficiencies?: KitProficiencies | null
  }
  deity?: string | null
  pantheon?: string | null
  setting?: string | null
  titleInChurch?: string | null
}

/** Ordem dos subgrupos, igual ao KitCompendiumView do iPad. */
export const subclassOrder: Record<ClassGroup, string[]> = {
  Priest: ['Cleric', 'Druid', 'Any Priest', 'Specialty Priest'],
  // 'Ravenloft': kits do Dragon Magazine Annual 1998 (Denizens of Dread), antes fora da lista.
  Wizard: ['Wizard', 'Ravenloft'],
  Warrior: ['Fighter', 'Paladin', 'Ranger', 'Barbarian', 'Ravenloft'],
  Rogue: ['Thief', 'Bard', 'Ninja', 'Ravenloft'],
  // Kits de Psionicist (2026-10-06): The Will and the Way, Dragon Magazine etc.
  Psionicist: ['Psionicist'],
  // Kits de raça (Complete Book of Elves, Dragon Magazine; 2026-11-16): o subgrupo é a raça; a classe vem de allowedClasses.
  Demihuman: ['Elf', 'Half-Elf', 'Dwarf', 'Avariel'],
}

const cache = new Map<ClassGroup, Promise<Kit[]>>()

export function loadKits(group: ClassGroup): Promise<Kit[]> {
  let promise = cache.get(group)
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}data/kits-${group.toLowerCase()}.json`).then((response) => {
      if (!response.ok) throw new Error(`kits-${group.toLowerCase()}.json: HTTP ${response.status}`)
      return response.json() as Promise<Kit[]>
    })
    cache.set(group, promise)
  }
  return promise
}

let allKits: Promise<Kit[]> | null = null

/** Todos os kits, de todo grupo (RaceKitPickers e o aviso de cenário ao mudar de campanha). */
export function loadAllKits(): Promise<Kit[]> {
  allKits ??= Promise.all((['Priest', 'Wizard', 'Warrior', 'Rogue', 'Psionicist', 'Demihuman'] as const).map((g) => loadKits(g))).then((groups) => groups.flat())
  return allKits
}

export interface TextSection {
  title: string
  body: string
  /** O corpo em texto e tabelas em markdown ("| … |" + linha "---"). */
  parts: DescriptionPart[]
}

export type DescriptionPart = { kind: 'text'; text: string } | { kind: 'table'; table: RuleTable }

/** Texto e tabelas em markdown do corpo; a linha só em negrito logo acima da tabela vira o título dela. */
export function descriptionParts(body: string): DescriptionPart[] {
  const parts: DescriptionPart[] = []
  let text: string[] = []
  const flush = () => {
    const joined = text.join('\n').trim()
    if (joined !== '') parts.push({ kind: 'text', text: joined.replaceAll('**', '') })
    text = []
  }
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; ) {
    if (!lines[i].trim().startsWith('|')) {
      text.push(lines[i++])
      continue
    }
    const run: string[] = []
    while (i < lines.length && lines[i].trim().startsWith('|')) run.push(lines[i++])
    const tables = markdownTables(run.join('\n'))
    if (tables.length === 0) {
      text.push(...run)
      continue
    }
    while (text.length > 0 && text[text.length - 1].trim() === '') text.pop()
    const bold = text.length > 0 ? /^\*\*(.+?)\*\*:?$/.exec(text[text.length - 1].trim()) : null
    if (bold) text.pop()
    flush()
    tables.forEach((table, index) =>
      parts.push({ kind: 'table', table: { tableNumber: '', title: index === 0 && bold ? bold[1] : '', headers: table.headers, rows: table.rows } }),
    )
  }
  flush()
  return parts
}

/**
 * Seções da descrição (KitDescription.displaySections do iPad): tira a
 * tabela de wiki "{| … |}", quebra nos títulos "## " e remove "**".
 */
export function displaySections(fullText: string): TextSection[] {
  let text = fullText
  const start = text.indexOf('{|')
  const end = text.indexOf('|}')
  if (start !== -1 && end !== -1 && end > start) text = text.slice(0, start) + text.slice(end + 2)
  text = text.trim()
  if (text === '') return []

  const sections: TextSection[] = []
  let title = ''
  let body: string[] = []
  const flush = () => {
    const joined = body.join('\n').trim()
    if (title !== '' || joined !== '') sections.push({ title, body: joined.replaceAll('**', ''), parts: descriptionParts(joined) })
    body = []
  }
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      flush()
      title = line.slice(3).trim()
    } else {
      body.push(line)
    }
  }
  flush()
  return sections.length > 0 ? sections : [{ title: '', body: text.replaceAll('**', ''), parts: descriptionParts(text) }]
}
