// Filtros que começam pela campanha ativa (CA3, docs/campanha-ativa.md): o
// "Campaign Settings" da campanha diz que cenários valem; os livros gerais
// (Core) valem sempre. Só funções puras.

import { CORE_SETTING } from './books.ts'

/** Cenários que valem na campanha: Core mais os dela; null = a campanha não restringe (todos). */
export function campaignSettingSet(settings: string[] | null | undefined): Set<string> | null {
  if (!settings || settings.length === 0) return null
  return new Set([CORE_SETTING, ...settings])
}

/** Coleções de monstros dos livros gerais: valem em qualquer campanha. */
export const coreMonsterCollections = ['Monstrous Manual Core', 'MC Annuals']

/**
 * Cenário de campanha → coleção do catálogo de monstros (os nomes não são
 * iguais): Al-Qadim (os "Zakhara") e Council of Wyrms estão em "Other
 * Campaigns / Magazines".
 */
const settingCollections: Record<string, string[]> = {
  'Al-Qadim': ['Other Campaigns / Magazines'],
  'Council of Wyrms': ['Other Campaigns / Magazines'],
  'Dark Sun': ['Dark Sun'],
  'Forgotten Realms': ['Forgotten Realms & Continents'],
  Greyhawk: ['Greyhawk'],
  Planescape: ['Planescape'],
  Ravenloft: ['Ravenloft'],
  Spelljammer: ['Spelljammer'],
}

/** Coleções de monstros que valem na campanha; null = todas. */
export function campaignMonsterCollections(settings: string[] | null | undefined): Set<string> | null {
  if (!settings || settings.length === 0) return null
  return new Set([...coreMonsterCollections, ...settings.flatMap((s) => settingCollections[s] ?? [])])
}

/** Rótulo do chip: "Campaign (Core + Dark Sun)". */
export const campaignFilterLabel = (settings: string[]) => `Campaign (${[CORE_SETTING, ...settings].join(' + ')})`
