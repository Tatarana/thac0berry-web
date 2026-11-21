// Força excepcional (PHB 2e, Tabela 1): guerreiros com Força 18 rolam d100 e
// ganham 18/01 a 18/00 (o 100 se escreve 18/00). Só funções puras.
//
// Guardado em `abilities.exceptionalStrength` (1–100 | null; 100 = 18/00), o
// mesmo campo do JSON da ficha do iPad. Os bônus por faixa vêm de
// `strengthRow` (rules.ts); aqui ficam quem tem direito, a rolagem, a
// escrita "18/xx" e a limpeza quando o direito se perde.
//
// Quem tem direito: Força 18 (já com os ajustes da raça), uma classe de
// guerreiro (Fighter, Paladin, Ranger) entre as classes do personagem — atuais,
// de multiclasse e anteriores (classe dupla) — e uma raça cuja Força máxima
// (Tabela 7) chega a 18 (halfling, máx. 17, nunca).

import type { AbilityScores, PlayerCharacter } from '../types/library.ts'
import { rollDice, type Random } from './dice.ts'
import { allClasses, type ClassChoice } from './multiclass.ts'
import { matchRace, raceStrengthMax } from './raceKit.ts'
import { classGroup } from './rules.ts'

type Subject = ClassChoice & Pick<PlayerCharacter, 'abilities' | 'race'>

/** A classe é de guerreiro (Fighter, Paladin, Ranger). */
export const isWarriorClass = (characterClass: string) => classGroup(characterClass) === 'Warrior'

/** Valor válido do campo: inteiro de 1 a 100. */
export const isExceptionalValue = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100

/** A raça deixa a Força chegar a 18 (sem faixa na Tabela 7 = sem limite). */
export function raceAllowsStrength18(race: string): boolean {
  const max = raceStrengthMax(matchRace(race) ?? race)
  return max === null || max >= 18
}

/** Tem direito à Força excepcional: Força 18, classe de guerreiro e raça que chega a 18. */
export function qualifiesForExceptionalStrength(c: Subject): boolean {
  return c.abilities.strength === 18 && allClasses(c).some((k) => isWarriorClass(k.characterClass)) && raceAllowsStrength18(c.race)
}

/** Tem direito mas ainda não tem o d100 (o Forge pede a rolagem). */
export const needsExceptionalRoll = (c: Subject) => qualifiesForExceptionalStrength(c) && !isExceptionalValue(c.abilities.exceptionalStrength)

/** Rola o d100 (1–100). */
export function rollExceptionalStrength(random: Random = Math.random): number {
  return rollDice({ count: 1, sides: 100, modifier: 0 }, random).total
}

/** "05" para 5, "00" para 100 (os dois dígitos depois da barra). */
export const exceptionalDigits = (value: number) => String(value % 100).padStart(2, '0')

/** Força como se escreve: "17", "18", "18/05", "18/00". Só 18 leva a barra. */
export function formatStrength(abilities: Pick<AbilityScores, 'strength' | 'exceptionalStrength'>): string {
  return abilities.strength === 18 && isExceptionalValue(abilities.exceptionalStrength)
    ? `18/${exceptionalDigits(abilities.exceptionalStrength)}`
    : String(abilities.strength)
}

/**
 * Texto digitado → valor guardado. "00" e "100" valem 100; "1"–"99" valem eles
 * mesmos; vazio ou fora da faixa é null (sem valor).
 */
export function parseExceptionalStrength(text: string): number | null {
  const t = text.trim()
  if (!/^\d{1,3}$/.test(t)) return null
  const n = Number(t)
  if (n === 0) return 100
  return n >= 1 && n <= 100 ? n : null
}

/**
 * Perdeu o direito (Força abaixo de 18, outra classe, outra raça)? Apaga o
 * valor e devolve true; se ainda tem direito, ou não havia valor, não mexe.
 */
export function clearExceptionalIfDisqualified(c: Pick<PlayerCharacter, 'abilities' | 'race' | 'characterClass' | 'level' | 'multiClasses' | 'formerClasses'>): boolean {
  if (c.abilities.exceptionalStrength == null || qualifiesForExceptionalStrength(c)) return false
  c.abilities = { ...c.abilities, exceptionalStrength: null }
  return true
}
