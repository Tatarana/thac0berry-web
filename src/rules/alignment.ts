// Alinhamento no The Forge (etapa "Weigh Your Soul", logo depois da raça;
// protótipo "Step 4 · Alignment" no canvas). Só funções puras.
//
// - Os nove alinhamentos do PHB cap. 4, na ordem do tabuleiro (Lei → Caos nas
//   colunas, Bem → Mal nas linhas).
// - O que cada classe aceita: PHB cap. 3 (paladino, ranger, druida, ladrão,
//   bardo), CPsiH (psionicista), Complete Ninja's Handbook (clã padrão) e
//   Domains of Dread (anchorite, gypsy). Fora da regra vira aviso, não bloqueio.
// - Os dilemas: cada resposta empurra [lei (+) / caos (−), bem (+) / mal (−)];
//   a média, um pouco ampliada, dá a posição no tabuleiro.

import { canonicalClass } from './rules.ts'

export type AlignmentCode = 'LG' | 'NG' | 'CG' | 'LN' | 'TN' | 'CN' | 'LE' | 'NE' | 'CE'

export const alignments: { code: AlignmentCode; name: string }[] = [
  { code: 'LG', name: 'Lawful Good' },
  { code: 'NG', name: 'Neutral Good' },
  { code: 'CG', name: 'Chaotic Good' },
  { code: 'LN', name: 'Lawful Neutral' },
  { code: 'TN', name: 'True Neutral' },
  { code: 'CN', name: 'Chaotic Neutral' },
  { code: 'LE', name: 'Lawful Evil' },
  { code: 'NE', name: 'Neutral Evil' },
  { code: 'CE', name: 'Chaotic Evil' },
]

/** O código a partir do nome da ficha ("Lawful Good" → "LG"); null se não for um dos nove. */
export const alignmentCode = (name: string | null | undefined): AlignmentCode | null => alignments.find((a) => a.name === name)?.code ?? null

const lawful: AlignmentCode[] = ['LG', 'LN', 'LE']
const good: AlignmentCode[] = ['LG', 'NG', 'CG']
const evil: AlignmentCode[] = ['LE', 'NE', 'CE']
const chaotic: AlignmentCode[] = ['CG', 'CN', 'CE']
const all = alignments.map((a) => a.code)
const except = (out: AlignmentCode[]) => all.filter((a) => !out.includes(a))

/** O que cada classe aceita, com o motivo em uma linha (null = qualquer). */
export const classAlignments: Record<string, { allowed: AlignmentCode[]; rule: string } | null> = {
  Fighter: null,
  Mage: null,
  Cleric: null,
  Paladin: { allowed: ['LG'], rule: 'lawful good only' },
  Ranger: { allowed: good, rule: 'always good' },
  Druid: { allowed: ['TN'], rule: 'true neutral only' },
  Thief: { allowed: except(['LG']), rule: 'never lawful good' },
  Bard: { allowed: ['NG', 'LN', 'TN', 'CN', 'NE'], rule: 'always partly neutral' },
  Psionicist: { allowed: except(chaotic), rule: 'never chaotic' },
  Ninja: { allowed: except(chaotic), rule: 'lawful or neutral (the standard clan)' },
  Anchorite: { allowed: ['LG', 'LN', 'TN'], rule: 'one step from lawful neutral, never evil' },
  Gypsy: { allowed: except(chaotic), rule: 'lawful or neutral' },
}

/** A classe aceita este alinhamento? (Sem alinhamento escolhido: sim.) */
export function classAllows(characterClass: string, alignment: string | null | undefined): boolean {
  const code = alignmentCode(alignment)
  const rule = classAlignments[canonicalClass(characterClass)]
  return !code || !rule || rule.allowed.includes(code)
}

/** Aviso de classe fora do alinhamento, para o card da etapa de classe. */
export function classAlignmentWarning(characterClass: string, alignment: string | null | undefined): string | null {
  if (classAllows(characterClass, alignment)) return null
  const cls = canonicalClass(characterClass)
  return `A ${cls.toLowerCase()} is ${classAlignments[cls]!.rule} — you chose ${alignment}.`
}

/**
 * Os alinhamentos que o texto do kit aceita ("True Neutral", "Any nonlawful",
 * "Any but LG", "LG, NG, LN, N; rarely LE"…); null quando o texto não diz nada
 * que dê para ler (o Forge não avisa).
 */
export function kitAlignments(texts: string[] | null | undefined): AlignmentCode[] | null {
  if (!texts?.length) return null
  const out = new Set<AlignmentCode>()
  let understood = false
  for (const raw of texts) {
    const text = raw.split(';')[0].replace(/\(.*?\)/g, '').trim()
    const lower = text.toLowerCase()
    const exact = alignments.find((a) => a.name.toLowerCase() === lower)
    if (exact) {
      out.add(exact.code)
      understood = true
      continue
    }
    if (lower.startsWith('any')) {
      let set = all
      if (/non-?lawful/.test(lower)) set = except(lawful)
      else if (/non-?good/.test(lower)) set = except(good)
      else if (/non-?evil/.test(lower)) set = except(evil)
      else if (/non-?chaotic/.test(lower)) set = except(chaotic)
      else if (/but lg/.test(lower)) set = except(['LG'])
      for (const a of set) out.add(a)
      understood = true
      continue
    }
    const codes = text.split(',').map((s) => s.trim().toUpperCase().replace(/^N$/, 'TN'))
    if (codes.length && codes.every((c) => all.includes(c as AlignmentCode))) {
      for (const c of codes) out.add(c as AlignmentCode)
      understood = true
    }
  }
  return understood ? [...out] : null
}

/** Aviso de kit fora do alinhamento (null se o kit aceita, ou se não dá para saber). */
export function kitAlignmentWarning(texts: string[] | null | undefined, alignment: string | null | undefined): string | null {
  const code = alignmentCode(alignment)
  const allowed = kitAlignments(texts)
  if (!code || !allowed || allowed.includes(code)) return null
  return `This kit asks for: ${texts!.join('; ')}.`
}

// --- Os dilemas -------------------------------------------------------------------------

/** Uma resposta: quanto empurra para a lei (+) ou o caos (−), e para o bem (+) ou o mal (−). */
export type Lean = [law: number, good: number]

const clamp = (n: number) => Math.max(-1, Math.min(1, n))

/** Posição no tabuleiro, de −1 a 1 em cada eixo: a média das respostas, ampliada em 30%. */
export function soulPosition(answers: Lean[]): { law: number; good: number } {
  if (answers.length === 0) return { law: 0, good: 0 }
  const law = answers.reduce((n, a) => n + a[0], 0) / answers.length
  const goodness = answers.reduce((n, a) => n + a[1], 0) / answers.length
  return { law: clamp(law * 1.3), good: clamp(goodness * 1.3) }
}

/** A casa onde a posição cai (um terço de cada eixo para cada lado). */
export function soulReading(answers: Lean[]): AlignmentCode {
  const { law, good: g } = soulPosition(answers)
  const col = law > 0.34 ? 0 : law < -0.34 ? 2 : 1
  const row = g > 0.34 ? 0 : g < -0.34 ? 2 : 1
  return alignments[row * 3 + col].code
}
