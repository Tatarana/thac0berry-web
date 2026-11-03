// Etapa "Tricks of the Trade" do The Forge (protótipo "Step 9 · Thieving
// Skills" no canvas): os pontos de treino das perícias de ladrão. Só funções
// puras; as tabelas (base, raça, Destreza) são as de rules.ts.
//
// - Ladrão (PHB cap. 3) e ninja (CNH cap. 1): 60 pontos no 1º nível, 30 a cada
//   nível; no máximo 30 numa perícia no 1º nível e 15 por nível depois.
// - Bardo (PHB cap. 3): 20 pontos no 1º nível, 15 a cada nível; sem limite
//   por perícia.
// - Gypsy: o Domains of Dread não dá a regra; o app usa a do ladrão (decisão
//   já registrada em docs/ravenloft.md).
// - Nenhuma perícia passa de 95%, com todos os ajustes (PHB).
// A armadura também ajusta (PHB Tabela 29), mas fica para a ficha, em jogo.

import { canonicalClass, dexterityAdjustment, racialAdjustment, thievingBaseScore, thievingSkillsFor } from './rules.ts'

export const skillCap = 95

/** Pontos de treino no nível (o bardo tem menos). */
export function trainingPool(characterClass: string, level: number): number {
  const lv = Math.max(1, level)
  return canonicalClass(characterClass) === 'Bard' ? 20 + 15 * (lv - 1) : 60 + 30 * (lv - 1)
}

/** Máximo de treino numa perícia no nível (null = sem limite, o bardo). */
export function trainingLimit(characterClass: string, level: number): number | null {
  if (canonicalClass(characterClass) === 'Bard') return null
  return 30 + 15 * (Math.max(1, level) - 1)
}

export interface SkillParts {
  base: number
  race: number
  dexterity: number
}

/** Base da classe, ajuste da raça e da Destreza. */
export function skillParts(skill: string, characterClass: string, race: string, dexterity: number): SkillParts {
  return { base: thievingBaseScore(skill, characterClass), race: racialAdjustment(skill, race), dexterity: dexterityAdjustment(skill, dexterity) }
}

/** O valor final da perícia, de 0 a 95%. */
export function skillTotal(parts: SkillParts, training: number): number {
  return Math.max(0, Math.min(skillCap, parts.base + parts.race + parts.dexterity + training))
}

export type Training = Record<string, number>

export interface TrainingContext {
  characterClass: string
  level: number
  race: string
  dexterity: number
}

export const spentPoints = (training: Training) => Object.values(training).reduce((a, b) => a + b, 0)

/** Quanto ainda cabe nesta perícia: pontos que sobram, limite por perícia e o teto de 95%. */
export function trainingRoom(skill: string, training: Training, ctx: TrainingContext): number {
  const t = training[skill] ?? 0
  const parts = skillParts(skill, ctx.characterClass, ctx.race, ctx.dexterity)
  const limit = trainingLimit(ctx.characterClass, ctx.level)
  const byPool = trainingPool(ctx.characterClass, ctx.level) - spentPoints(training)
  const byLimit = limit === null ? Infinity : limit - t
  const byCap = skillCap - (parts.base + parts.race + parts.dexterity + t)
  return Math.max(0, Math.min(byPool, byLimit, byCap))
}

/** Põe (ou tira, com n negativo) pontos numa perícia, respeitando os limites. */
export function addTraining(skill: string, n: number, training: Training, ctx: TrainingContext): Training {
  const t = training[skill] ?? 0
  const d = n > 0 ? Math.min(n, trainingRoom(skill, training, ctx)) : Math.max(n, -t)
  if (d === 0) return training
  return { ...training, [skill]: t + d }
}

/** Atalhos da tela: as perícias de cada arquétipo, em ordem de prioridade (null = todas). */
export const trainingPaths: { name: string; hint: string; skills: string[] | null }[] = [
  { name: 'Cat Burglar', hint: 'Climb, sneak, hide and open locks', skills: ['Climb Walls', 'Move Silently', 'Hide in Shadows', 'Open Locks'] },
  { name: 'Cutpurse', hint: 'Lift purses in a crowd and vanish', skills: ['Pick Pockets', 'Hide in Shadows', 'Move Silently', 'Detect Noise'] },
  { name: 'Trapsmith', hint: 'Dungeons: traps, locks and listening', skills: ['Find/Remove Traps', 'Open Locks', 'Detect Noise', 'Move Silently'] },
  { name: 'Even Hand', hint: 'A little of everything', skills: null },
]

/** Distribui todos os pontos de 5 em 5, em rodízio pelas perícias do caminho (as que a classe tem). */
export function distributeTraining(path: string[] | null, ctx: TrainingContext): Training {
  const own = thievingSkillsFor(ctx.characterClass)
  const list = (path ?? own).filter((s) => own.includes(s))
  let training: Training = {}
  for (let guard = 0; guard < 400; guard++) {
    let moved = false
    for (const s of list) {
      const next = addTraining(s, 5, training, ctx)
      if (next !== training) {
        training = next
        moved = true
      }
    }
    if (!moved) break
  }
  return training
}

/** As perícias como a ficha guarda (`thievingSkills`: "55%"), na ordem da classe. */
export function trainedSkills(training: Training, ctx: TrainingContext, current: { id: string; skill: string }[], newID: () => string) {
  return thievingSkillsFor(ctx.characterClass).map((skill) => ({
    id: current.find((e) => e.skill === skill)?.id ?? newID(),
    skill,
    value: `${skillTotal(skillParts(skill, ctx.characterClass, ctx.race, ctx.dexterity), training[skill] ?? 0)}%`,
  }))
}
