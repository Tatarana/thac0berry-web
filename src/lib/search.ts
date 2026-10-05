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

/** Distância de edição clássica (Fuzzy.levenshtein do iPad). */
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

/**
 * Semelhança 0…1 entre dois textos JÁ normalizados (Fuzzy.similarity do iPad):
 * prefixo de 3+ letras pontua alto; substring ganha um empurrão; iniciais
 * ("mm") valem 0,9; o resto é Levenshtein proporcional ao tamanho.
 */
export function similarity(lhs: string, rhs: string): number {
  if (lhs === rhs) return 1
  if (lhs === '' || rhs === '') return 0
  if (lhs.length >= 3) {
    if (rhs.startsWith(lhs)) return 0.75 + 0.25 * (lhs.length / rhs.length)
    if (lhs.startsWith(rhs)) return 0.75 + 0.25 * (rhs.length / lhs.length)
  }
  let score = 1 - levenshtein(lhs, rhs) / Math.max(lhs.length, rhs.length)
  if (lhs.length >= 3 && (rhs.includes(lhs) || lhs.includes(rhs))) score += 0.1
  const initials = rhs
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
  if (initials.length > 1 && initials === lhs) score = Math.max(score, 0.9)
  return Math.min(score, 1)
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
