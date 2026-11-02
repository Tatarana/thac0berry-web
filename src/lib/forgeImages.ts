// Ilustrações do The Forge, em public/images/forge/ (nomes combinados com o
// usuário, que produz a arte; lista e prompts em docs/forge-arte.md).

import { raceGender, type RaceName } from '../rules/raceKit'

export type Gender = 'male' | 'female'

/** Caminho de uma imagem do Forge. */
export const forgeImage = (name: string) => `${import.meta.env.BASE_URL}images/forge/${name}.webp`

/** Nome de arquivo a partir do nome da raça/classe: "Genasi (air)" → "genasi-air". */
export const forgeSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

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
