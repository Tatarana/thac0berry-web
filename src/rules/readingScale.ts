// Tamanho do texto de leitura nas janelas de detalhe (lógica pura, sem DOM).
// O índice é a posição em READING_STEPS; o valor gravado no aparelho é o percentual.

/** Passos de escala, do menor ao maior. */
export const READING_STEPS = [0.9, 1, 1.15, 1.3, 1.5] as const

/** Posição do 100%. */
export const DEFAULT_READING_INDEX = 1

const lastIndex = READING_STEPS.length - 1

/** Percentual inteiro de um passo (evita 114.99999 de 1.15 * 100). */
function percentOf(index: number): number {
  return Math.round(READING_STEPS[index] * 100)
}

/** Índice válido mais próximo; valor que não é inteiro finito vira o 100%. */
export function clampReadingIndex(index: number): number {
  if (!Number.isInteger(index)) return DEFAULT_READING_INDEX
  return Math.min(lastIndex, Math.max(0, index))
}

/** Índice depois de andar `delta` passos, sem passar dos extremos. */
export function stepReadingIndex(index: number, delta: number): number {
  return clampReadingIndex(clampReadingIndex(index) + delta)
}

/** Dá para andar `delta` passos sem bater no extremo? */
export function canStepReading(index: number, delta: number): boolean {
  const target = clampReadingIndex(index) + delta
  return delta !== 0 && target >= 0 && target <= lastIndex
}

export function readingScaleOf(index: number): number {
  return READING_STEPS[clampReadingIndex(index)]
}

/** "115%" */
export function readingPercentLabel(index: number): string {
  return `${percentOf(clampReadingIndex(index))}%`
}

/** Texto que vai para o localStorage: o percentual ("115"). */
export function serializeReadingIndex(index: number): string {
  return String(percentOf(clampReadingIndex(index)))
}

/** Lê o que está gravado; ausente, ilegível ou fora dos passos = 100%. */
export function parseStoredReadingScale(raw: string | null | undefined): number {
  if (raw == null || !/^\d{2,3}$/.test(raw.trim())) return DEFAULT_READING_INDEX
  const percent = Number(raw.trim())
  const found = READING_STEPS.findIndex((_, index) => percentOf(index) === percent)
  return found >= 0 ? found : DEFAULT_READING_INDEX
}

/** Entrelinha do texto: 1.6 até 115%, 1.5 de 130% em diante (linha mais larga pede menos ar). */
export function readingLineHeight(index: number): number {
  return readingScaleOf(index) >= 1.3 ? 1.5 : 1.6
}
