import { allRaces, levelLimit, raceGender, type RaceName } from './raceKit.ts'
import { ravenloftWarnings } from './ravenloft.ts'
import { canonicalClass } from './rules.ts'

// Retratos do The Forge por combinação de raça, classe e gênero: o anão clérigo
// tem arte própria. Só as combinações de uma classe permitidas pela regra. Fora
// delas, inclusive quem só entra por kit (bardo anão), a classe fica sem imagem
// (a genérica mostra um humano); multiclasse usa a da classe principal. Lista e prompts em docs/forge-arte.md.

export type Gender = 'male' | 'female'

export const forgeClasses = ['Fighter', 'Paladin', 'Ranger', 'Mage', 'Cleric', 'Druid', 'Thief', 'Bard', 'Ninja', 'Psionicist', 'Anchorite', 'Gypsy'] as const

const bestAbilities = { strength: 18, dexterity: 18, constitution: 18, intelligence: 18, wisdom: 18, charisma: 18 }

/** Nome de arquivo a partir do nome da raça/classe: "Genasi (air)" → "genasi-air". */
export const forgeSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** A regra permite a raça nesta classe? Atributos não contam: a arte é da combinação. */
export function comboAllowed(race: RaceName, characterClass: string): boolean {
  if (levelLimit(race, characterClass) === 'forbidden') return false
  return ravenloftWarnings({ characterClass, race, abilities: bestAbilities } as Parameters<typeof ravenloftWarnings>[0], ['Ravenloft']).length === 0
}

/**
 * Nome da imagem da combinação, ou null se ela não tiver arte própria. O gênero
 * entra no fim; quem não precisa dele não o repete: Bariaur já o tem na raça, e
 * o modron não tem sexo.
 */
export function comboName(race: RaceName, characterClass: string, gender: Gender | null): string | null {
  const cls = canonicalClass(characterClass)
  if (!comboAllowed(race, cls)) return null
  const name = `combo-${forgeSlug(race)}-${forgeSlug(cls)}`
  if (raceGender(race) || race === 'Modron') return name
  return gender ? `${name}-${gender}` : null
}

/** Todas as combinações com arte própria, uma por imagem. */
export function forgeCombos(): { name: string; race: RaceName; characterClass: string; gender: Gender | null }[] {
  const seen = new Set<string>()
  return allRaces.flatMap((race) =>
    forgeClasses.flatMap((characterClass) =>
      (['male', 'female'] as const).flatMap((gender) => {
        const only = raceGender(race)
        const name = only && only !== gender ? null : comboName(race, characterClass, gender)
        if (!name || seen.has(name)) return []
        seen.add(name)
        return [{ name, race, characterClass, gender: race === 'Modron' ? null : gender }]
      }),
    ),
  )
}
