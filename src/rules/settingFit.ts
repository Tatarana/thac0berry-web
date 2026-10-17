// Cenário que a raça, a classe ou o kit já escolhidos na ficha pedem, mas a
// campanha de destino não tem ligado (backlog, 2026-10-17: Half-Vistani fora
// de campanha Ravenloft). Só funções puras — nunca bloqueia, só gera a nota
// curta mostrada ao mudar um personagem de campanha ("Move to…", "Add from
// Sandbox"); o mestre pode misturar mundos. A regra de cada tipo já existe em
// `raceKit.ts` (raça) e `ravenloft.ts` (classe); aqui só junta as três.

import { matchRace, raceCampaignSetting } from './raceKit.ts'
import { isRavenloftClass, RAVENLOFT } from './ravenloft.ts'
import { canonicalClass } from './rules.ts'

export interface SettingFitCharacter {
  race: string
  characterClass: string
  kit?: string | null
}

/** Nome do kit (como salvo na ficha) → cenário do livro de origem; de `loadAllKits()`. */
export type KitSettings = Map<string, string | null | undefined>

export const kitSettingsFrom = (kits: { name: string; setting?: string | null }[]): KitSettings => new Map(kits.map((k) => [k.name, k.setting]))

/** Uma nota curta por descompasso ("Half-Vistani is a Ravenloft race."); [] se bate tudo (ou falta raça/classe reconhecida). */
export function settingFitNotes(c: SettingFitCharacter, campaignSettings: string[] | null | undefined, kitSettings: KitSettings): string[] {
  const notes: string[] = []
  const race = matchRace(c.race)
  if (race) {
    const setting = raceCampaignSetting(race)
    if (setting && !campaignSettings?.includes(setting)) notes.push(`${race} is a ${setting} race.`)
  }
  if (isRavenloftClass(c.characterClass) && !campaignSettings?.includes(RAVENLOFT)) {
    notes.push(`${canonicalClass(c.characterClass)} is a Ravenloft class.`)
  }
  if (c.kit) {
    const setting = kitSettings.get(c.kit)
    if (setting && !campaignSettings?.includes(setting)) notes.push(`${c.kit} is a ${setting} kit.`)
  }
  return notes
}
