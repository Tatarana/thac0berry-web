// Mapa mental dos poderes psiônicos do The Forge (protótipo "Step 8 ·
// Psionic Powers"): árvore radial em volta da disciplina. Cada poder fica um
// anel além do poder de que depende (o pré-requisito mais fundo, se houver
// vários); os sem pré-requisito na disciplina ficam no primeiro anel. Só
// geometria, sem React.

import type { PowerChoice } from '../rules/psionics.ts'

export interface MapNode {
  power: PowerChoice
  /** Graus; 0 = leste, crescendo no sentido horário (eixo y da tela para baixo). */
  angle: number
  radius: number
  depth: number
  parent: PowerChoice | null
  /** Sem poderes que dependam dele (o nome lê para fora; os outros, para dentro). */
  leaf: boolean
}

export interface PowerMap {
  nodes: MapNode[]
  /** Raio do primeiro anel e distância entre anéis. */
  firstRing: number
  ringStep: number
  depth: number
}

/** Nenhum ramo passa de 160°: uma família grande abre em leque em vez de abraçar o núcleo. */
const maxSpan = 160
/** Espaço mínimo, em px, entre dois poderes no primeiro anel. */
const minGap = 24

const order = (a: PowerChoice, b: PowerChoice) => Number(b.science) - Number(a.science) || a.title.localeCompare(b.title)

export function powerMap(powers: PowerChoice[]): PowerMap {
  const byKey = new Map(powers.map((p) => [p.key, p]))
  const parent = new Map<string, PowerChoice | null>()
  const depth = new Map<string, number>()

  const walk = (p: PowerChoice, seen: string[]): number => {
    const known = depth.get(p.id)
    if (known !== undefined) return known
    let best: PowerChoice | null = null
    let bestDepth = -1
    for (const r of p.prerequisites) {
      if (r.kind !== 'power') continue
      const q = byKey.get(r.key)
      if (!q || q === p || seen.includes(q.id)) continue
      const d = walk(q, [...seen, p.id])
      if (d > bestDepth) {
        bestDepth = d
        best = q
      }
    }
    parent.set(p.id, best)
    depth.set(p.id, best ? bestDepth + 1 : 0)
    return depth.get(p.id) ?? 0
  }
  for (const p of powers) walk(p, [])

  const kids = new Map<string, PowerChoice[]>()
  for (const p of powers) {
    const q = parent.get(p.id)
    if (q) kids.set(q.id, [...(kids.get(q.id) ?? []), p])
  }
  for (const list of kids.values()) list.sort(order)
  const weight = (p: PowerChoice): number => (kids.get(p.id) ?? []).reduce((n, q) => n + weight(q), 0) || 1

  const roots = powers.filter((p) => !parent.get(p.id)).sort(order)
  const total = roots.reduce((n, p) => n + weight(p), 0) || 1

  // Fatia de cada raiz proporcional às folhas, com o teto de 160°.
  const spans = new Map<string, number>()
  const capped = new Set<string>()
  for (let round = 0; round < 4; round++) {
    const free = roots.filter((p) => !capped.has(p.id))
    const left = 360 - capped.size * maxSpan
    const freeWeight = free.reduce((n, p) => n + weight(p), 0) || 1
    let changed = false
    for (const p of free) {
      const span = (left * weight(p)) / freeWeight
      spans.set(p.id, span)
      if (span > maxSpan && roots.length > 1) {
        capped.add(p.id)
        changed = true
      }
    }
    for (const id of capped) spans.set(id, maxSpan)
    if (!changed) break
  }

  const firstRing = Math.max(200, (minGap * total) / (2 * Math.PI))
  const ringStep = 128
  const nodes: MapNode[] = []
  const place = (p: PowerChoice, start: number, span: number) => {
    const d = depth.get(p.id) ?? 0
    const children = kids.get(p.id) ?? []
    nodes.push({ power: p, angle: start + span / 2, radius: firstRing + d * ringStep, depth: d, parent: parent.get(p.id) ?? null, leaf: children.length === 0 })
    const w = weight(p)
    let at = start
    for (const q of children) {
      const s = (span * weight(q)) / w
      place(q, at, s)
      at += s
    }
  }
  let at = -90
  for (const p of roots) {
    const span = spans.get(p.id) ?? 0
    place(p, at, span)
    at += span
  }
  return { nodes, firstRing, ringStep, depth: Math.max(0, ...nodes.map((n) => n.depth)) }
}
