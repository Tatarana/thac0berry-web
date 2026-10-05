// Busca por nome no espírito do Utils/Fuzzy.swift do app iPad: ignora
// acentos, maiúsculas e pontuação; aceita trecho do nome ("missile") e
// iniciais ("mm" acha Magic Missile).

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function matchesName(name: string, query: string): boolean {
  const normalizedQuery = normalize(query)
  if (normalizedQuery === '') return true
  const normalizedName = normalize(name)
  if (normalizedName.includes(normalizedQuery)) return true
  const initials = normalizedName
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
  const compactQuery = normalizedQuery.replaceAll(' ', '')
  return compactQuery.length >= 2 && initials.startsWith(compactQuery)
}
