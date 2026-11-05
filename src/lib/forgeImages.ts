// Ilustrações do The Forge, em public/images/forge/ (nomes combinados com o
// usuário, que produz a arte; lista e prompts em docs/forge-arte.md).

import { classArtAllowed, comboName, forgeSlug, type Gender } from '../rules/forgeCombos'
import { raceGender, type RaceName } from '../rules/raceKit'

export type { Gender }

/** Caminho de uma imagem do Forge. */
export const forgeImage = (name: string) => `${import.meta.env.BASE_URL}images/forge/${name}.webp`

/** O campo `sex` da ficha (texto livre) como gênero do Forge. */
export function genderOf(sex: string): Gender | null {
  const text = sex.trim().toLowerCase()
  return text === 'male' ? 'male' : text === 'female' ? 'female' : null
}

/**
 * Imagens de uma raça, na ordem de tentativa: a do gênero escolhido na etapa 2
 * (race-elf-female.webp) e, se ela ainda não existir, a única da raça
 * (race-elf.webp). Raça de um sexo só (Bariaur) já tem o sexo no nome.
 */
export function raceImages(race: RaceName, gender: Gender | null): string[] {
  const slug = forgeSlug(race)
  if (raceGender(race) || !gender) return [forgeImage(`race-${slug}`)]
  return [forgeImage(`race-${slug}-${gender}`), forgeImage(`race-${slug}`)]
}

/** Imagens de uma classe, na mesma ordem: a do gênero, depois a única. */
export function classImages(characterClass: string, gender: Gender | null): string[] {
  const slug = forgeSlug(characterClass)
  return gender ? [forgeImage(`class-${slug}-${gender}`), forgeImage(`class-${slug}`)] : [forgeImage(`class-${slug}`)]
}

/** A imagem da combinação de raça, classe e gênero, se ela tiver arte própria. */
export function comboImages(race: RaceName | null, characterClass: string, gender: Gender | null): string[] {
  const name = race && comboName(race, characterClass, gender)
  return name ? [forgeImage(name)] : []
}

/** A arte da classe no card: a combinação e a genérica; nada se a raça não puder ser dessa classe. */
export function classCardImages(race: RaceName | null, characterClass: string, gender: Gender | null): string[] {
  if (race && !classArtAllowed(race, characterClass)) return []
  return [...comboImages(race, characterClass, gender), ...classImages(characterClass, gender)]
}

/** O retrato do herói: a arte da classe, depois a raça. */
export function heroImages(race: RaceName | null, characterClass: string, gender: Gender | null): string[] {
  return [...classCardImages(race, characterClass, gender), ...(race ? raceImages(race, gender) : [])]
}
