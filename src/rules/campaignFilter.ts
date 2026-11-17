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

/**
 * Algo de um cenário (raça, classe, kit; null = livros gerais) entra no filtro
 * de cenários escolhido? Filtro vazio = tudo; senão, Core mais os escolhidos.
 */
export function allowedBySettings(setting: string | null | undefined, settings: string[] | null | undefined): boolean {
  const allowed = campaignSettingSet(settings)
  return allowed === null || allowed.has(setting ?? CORE_SETTING)
}

/**
 * Armas de cenário (Dark Sun…) só aparecem quando o cenário vale; sem filtro de
 * cenários, todas. `keep` mantém à vista o que já foi escolhido (como kits e raças).
 */
export function weaponsForSettings<T extends { campaignSetting?: string | null }>(
  weapons: T[],
  settings: string[] | null | undefined,
  keep?: (w: T) => boolean,
): T[] {
  return weapons.filter((w) => allowedBySettings(w.campaignSetting, settings) || keep?.(w) === true)
}

/** Rótulo do chip: "Campaign (Core + Dark Sun)". */
export const campaignFilterLabel = (settings: string[]) => `Campaign (${[CORE_SETTING, ...settings].join(' + ')})`

/**
 * Cenários ainda sem raças, classes ou kits no app: aparecem esmaecidos no Forge
 * ("Under construction") e não dá para escolhê-los. Tirar daqui quando chegarem.
 */
export const settingsUnderConstruction: readonly string[] = ['Al-Qadim', 'Greyhawk', 'Spelljammer']

export const settingUnderConstruction = (setting: string) => settingsUnderConstruction.includes(setting)

/** O Forge novo começa nos Forgotten Realms (rascunho retomado mantém o que gravou). */
export const defaultForgeSettings = ['Forgotten Realms']
