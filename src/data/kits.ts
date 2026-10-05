// Kits (formato: schemas/kit.schema.json no thac0berry-data; modelo Swift
// Models/Kit.swift no app iPad). Um arquivo por grupo de classe, gerado por
// scripts/build-data.mjs sem o texto bruto de wiki.

export type ClassGroup = 'Priest' | 'Wizard' | 'Warrior' | 'Rogue'

export interface Kit {
  id: string
  name: string
  classEligibility: { classGroup: string; subclass: string; allowedClasses: string[] }
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
    weaponSlots?: { initial?: number | null; additional?: number | null; nonproficiencyPenalty?: string | null } | null
  }
  deity?: string | null
  pantheon?: string | null
  setting?: string | null
  titleInChurch?: string | null
}

/** Ordem dos subgrupos, igual ao KitCompendiumView do iPad. */
export const subclassOrder: Record<ClassGroup, string[]> = {
  Priest: ['Cleric', 'Druid', 'Any Priest', 'Specialty Priest'],
  Wizard: ['Wizard'],
  Warrior: ['Fighter', 'Paladin', 'Ranger', 'Barbarian'],
  Rogue: ['Thief', 'Bard', 'Ninja'],
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

export interface TextSection {
  title: string
  body: string
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
    if (title !== '' || joined !== '') sections.push({ title, body: joined.replaceAll('**', '') })
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
  return sections.length > 0 ? sections : [{ title: '', body: text.replaceAll('**', '') }]
}
