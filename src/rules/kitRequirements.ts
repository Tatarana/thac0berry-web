// Avisos do kit sobre proficiências (thac0berry-data, kit.mechanics.proficiencies e .weapons):
// o que o kit exige, o que proíbe e as únicas armas que deixa usar. Só funções puras; a Forja
// e a ficha exibem as linhas. Nada bloqueia o jogador: tudo aqui é aviso.

import { normalize } from '../lib/search.ts'
import type { KitProficiencies, KitWeapons } from '../data/kits.ts'
import { kitWeaponKey } from './proficiencyCost.ts'

const listed = (names: string[]) => names.join(', ')

/**
 * Avisos de proficiência nonweapon: exigida que falta ("Clansman requires Endurance."),
 * escolha exigida sem nenhuma tomada ("Clansman requires one of: A, B, C.") e proibida tomada
 * ("Skyrider forbids Jousting."). `owned` são os nomes que o personagem tem, de qualquer origem.
 */
export function kitProficiencyWarnings(kitName: string | null | undefined, rules: KitProficiencies | null | undefined, owned: string[]): string[] {
  if (!kitName || !rules) return []
  const has = (name: string) => owned.some((o) => normalize(o) === normalize(name))
  const warnings: string[] = []
  for (const name of rules.required ?? []) if (!has(name)) warnings.push(`${kitName} requires ${name}.`)
  for (const group of rules.requiredChoices ?? []) {
    if (group.length > 0 && !group.some(has)) warnings.push(`${kitName} requires one of: ${listed(group)}.`)
  }
  for (const name of rules.forbidden ?? []) if (has(name)) warnings.push(`${kitName} forbids ${name}.`)
  return warnings
}

/**
 * Avisos de arma. `ownedKeys` são as chaves (weaponProficiencyKey) das armas do personagem e
 * `knownKeys` as do compêndio: uma arma exigida que o compêndio não tem (Katana) só avisa se
 * `knownKeys` for omitido, porque na Forja ela não dá para escolher. `allowed` vale também só
 * para as armas iniciais em alguns kits, e o texto diz isso.
 */
export function kitWeaponWarnings(
  kitName: string | null | undefined,
  rules: KitWeapons | null | undefined,
  ownedKeys: string[],
  knownKeys?: string[],
): string[] {
  if (!kitName || !rules) return []
  const owned = new Set(ownedKeys)
  const mapped = (name: string) => !knownKeys || kitWeaponKey(name, knownKeys) !== null
  const has = (name: string) => owned.has(name.trim().toLowerCase())
  const warnings: string[] = []
  for (const name of rules.required ?? []) if (mapped(name) && !has(name)) warnings.push(`${kitName} requires ${name}.`)
  for (const group of rules.requiredChoices ?? []) {
    if (group.some(mapped) && !group.some(has)) warnings.push(`${kitName} requires one of: ${listed(group)}.`)
  }
  for (const name of rules.forbidden ?? []) if (has(name)) warnings.push(`${kitName} forbids ${name}.`)
  const allowed = rules.allowed ?? []
  if (allowed.length > 0) {
    const ok = new Set(allowed.map((n) => n.trim().toLowerCase()))
    if (ownedKeys.some((k) => k !== '' && !ok.has(k))) {
      warnings.push(`${kitName} may only use: ${listed(allowed)} (some kits limit only the starting weapons).`)
    }
  }
  return warnings
}
