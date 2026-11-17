// Especialização em arma (PHB cap. 5; Complete Fighter's Handbook cap. 4): quem pode
// especializar, o aviso de multiclasse e o que o texto do kit diz sobre isso.
// Só funções puras; a Forja e a ficha só exibem o resultado. Nada bloqueia o jogador
// além de esconder o botão para quem não é guerreiro: o resto é aviso.

import { hasClass, isMultiClass, type ClassChoice } from './multiclass.ts'
import { gypsyCanSpecialize } from './ravenloft.ts'
import { canonicalClass } from './rules.ts'

/** Aviso de multiclasse com Fighter: o PHB não deixa, mas alguns kits (Spellarcher) deixam. */
export const multiClassSpecializationNote =
  "Multi-class characters can't normally specialize (PHB, Chapter 5); some kits, like the Spellarcher, allow it. Check with your DM."

export type SpecializationRule = {
  /** Mostra o botão de especializar. */
  allowed: boolean
  /** Só em armas de faca (Gypsy, Domains of Dread). */
  knifeOnly: boolean
  /** Multiclasse com Fighter: pode, mas com o aviso. */
  multiClassNote: boolean
}

/**
 * Quem especializa: Fighter de classe única, qualquer multiclasse que inclua Fighter
 * (com aviso) e a Gypsy de classe única, só na faca. As demais não.
 */
export function specializationRule(c: ClassChoice): SpecializationRule {
  if (isMultiClass(c)) {
    const fighter = hasClass(c, 'Fighter')
    return { allowed: fighter, knifeOnly: false, multiClassNote: fighter }
  }
  const cls = canonicalClass(c.characterClass)
  if (cls === 'Fighter') return { allowed: true, knifeOnly: false, multiClassNote: false }
  if (cls === 'Gypsy') return { allowed: true, knifeOnly: true, multiClassNote: false }
  return { allowed: false, knifeOnly: false, multiClassNote: false }
}

/** Esta arma pode ser especializada por este personagem? */
export function canSpecializeWeapon(c: ClassChoice, weaponName: string): boolean {
  const rule = specializationRule(c)
  return rule.allowed && (!rule.knifeOnly || gypsyCanSpecialize(weaponName))
}

/** O que o texto do kit diz sobre especialização em arma. */
export type KitSpecialization = {
  /** Chaves das armas em que o kit manda (ou só deixa) especializar. */
  weapons: Set<string>
  /** O kit proíbe especializar em qualquer outra arma. */
  forbidsOthers: boolean
  /** O kit proíbe especializar de vez ("may not specialize in weapon use"). */
  forbidsAll: boolean
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Chaves de arma citadas no trecho (mesmo casamento do kitWeaponHints, com plural). */
function citedKeys(part: string, weaponKeys: string[]): string[] {
  return weaponKeys.filter((key) => key !== '' && new RegExp(`\\b${escapeRe(key)}s?\\b`).test(part))
}

// "must specialize in/with X", "can specialize only in X", "free specialization in X",
// "automatically gains specialization ... X", "Bonus: Specialization in X".
const mandatory = [
  /\bmust\s+(?:also\s+)?specializ\w*\s+(?:in|with)\b/,
  /\bspecializ\w*\s+only\s+(?:in|with)\b/,
  /\b(?:free|automatic\w*)\s+(?:gains?\s+)?specializ\w*/,
  /\bbonus\s*:\s*specializ\w*/,
]
// "must choose one of these ... for specialization" (Northman) e "specialization taken must be
// with one of these" (Hoplite): remetem às armas da frase anterior.
const pointsBack = [/\bspecializ\w*.*\bone of these\b/, /\bone of (?:these|the above).*\bspecializ/]
// "may not specialize in any other weapon", "may never specialize in another weapon".
const othersRe = /\b(?:may|can)\s*(?:not|never)\s+specializ\w*\s+in\s+(?:any\s+)?(?:other|another)\b|\bnever\s+specializ\w*\s+in\s+(?:any\s+)?(?:other|another)\b/
const forbidRe = /\b(?:may not|may never|cannot|can not|can't)\s+specializ/

/**
 * Lê o texto do kit (features.weaponProficiencies e mechanics.weapons.notes) e acha as armas
 * em que ele manda especializar e se proíbe as outras. Frase por frase; só reconhece os jeitos
 * de dizer que aparecem nos livros, o resto fica de fora (sem aviso, nunca com aviso falso).
 */
export function kitSpecialization(texts: (string | null | undefined)[], weaponKeys: string[]): KitSpecialization {
  const result: KitSpecialization = { weapons: new Set(), forbidsOthers: false, forbidsAll: false }
  const sentences = [
    ...new Set(
      texts
        .filter((t): t is string => !!t)
        .flatMap((t) => t.split(/(?<=[.!?])\s+|\s*\*\s+/))
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s !== ''),
    ),
  ]
  let previous: string[] = []
  for (const s of sentences) {
    const cited = citedKeys(s, weaponKeys)
    if (/specializ/.test(s)) {
      if (othersRe.test(s)) result.forbidsOthers = true
      else if (forbidRe.test(s) && cited.length === 0) result.forbidsAll = true
      else if (mandatory.some((re) => re.test(s)) && cited.length > 0) {
        cited.forEach((k) => result.weapons.add(k))
        // "can specialize only in Spear or Long Bow" (Amazon): as outras ficam proibidas.
        if (/\bspecializ\w*\s+only\s+(?:in|with)\b/.test(s)) result.forbidsOthers = true
      } else if (cited.length === 0 && previous.length > 0 && pointsBack.some((re) => re.test(s))) {
        // "must choose one of these" (Northman, Hoplite): as armas da frase anterior, e só elas.
        previous.forEach((k) => result.weapons.add(k))
        result.forbidsOthers = true
      }
    }
    if (cited.length > 0) previous = cited
  }
  return result
}

/**
 * Aviso do kit sobre as armas especializadas ("Spellarcher may not specialize in any weapon
 * other than long bow"); null se nada foge do que o kit diz. `labelOf` dá o nome de exibição da chave.
 */
export function kitSpecializationWarning(
  kitName: string | null | undefined,
  spec: KitSpecialization,
  specialized: string[],
  labelOf: (key: string) => string = (k) => k,
): string | null {
  if (!kitName || specialized.length === 0) return null
  if (spec.forbidsAll) return `${kitName} may not specialize in weapon use.`
  if (spec.forbidsOthers && spec.weapons.size > 0) {
    if (specialized.every((k) => spec.weapons.has(k))) return null
    const allowed = [...spec.weapons].map(labelOf)
    return `${kitName} may not specialize in any weapon other than ${allowed.join(' or ')}.`
  }
  return null
}
