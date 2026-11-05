// Armas e armaduras que a regra de cada classe permite, para o The Forge. Nada aqui
// proíbe: o Forge só mostra o que foge da regra do livro (decisão do usuário, 2026-11-05),
// e quem decide é o mestre. Só funções puras.
//
// Fontes: PHB cap. 3 (classes e multiclasse), CPsiH cap. 1, CNH cap. 1, Domains of Dread.
//
// - Clérigo: "only blunt, bludgeoning weapons". Vale só o tipo B puro; P/B e as armas
//   sem tipo ficam de fora (decisão do usuário).
// - Multiclasse: as listas somam, mas a restrição de sacerdote sempre vale (PHB cap. 3).
// - Classe dupla: vale a classe em uso.
// - Specialty Priest: as armas dependem do culto, que os dados não trazem. Sem marca.
// - Gypsy: só armas de uma mão, mas os dados não dizem quantas mãos cada arma usa.
//   Fica em aberto, só com o texto da regra (decisão do usuário). O mesmo vale para o
//   Anchorite neutro. Escudo de madeira do druida e couro batido do Gypsy, idem.
// - Limites de cada kit ainda não entram: o texto do kit aparece na tela.

import { classLevels, isMultiClass, multiClassRestrictions, type ClassChoice } from './multiclass.ts'
import { canonicalClass, weaponProficiencyKey, type CanonicalClass } from './rules.ts'

export interface GearWeapon {
  name: string
  type?: string | null
}

export interface GearArmor {
  name: string
  kind: 'armor' | 'shield' | 'helmet'
  baseAC?: number | null
}

interface ClassRule {
  /** Restrição de sacerdote: em multiclasse, a outra classe não abre a lista. */
  priest?: boolean
  weapon?: (w: GearWeapon) => boolean
  armor?: (a: GearArmor) => boolean
  weaponNote?: string
  armorNote?: string
}

const named = (...names: string[]) => {
  const list = new Set(names)
  return (w: GearWeapon) => list.has(weaponProficiencyKey(w.name))
}
const bodyIn = (...names: string[]) => (a: GearArmor) => a.kind !== 'armor' || names.includes(a.name)
const blunt = (w: GearWeapon) => w.type === 'B'

const plural: Record<CanonicalClass, string> = {
  Fighter: 'Fighters',
  Paladin: 'Paladins',
  Ranger: 'Rangers',
  Mage: 'Mages',
  Cleric: 'Clerics',
  Druid: 'Druids',
  Thief: 'Thieves',
  Bard: 'Bards',
  Ninja: 'Ninja',
  Psionicist: 'Psionicists',
  Anchorite: 'Anchorites',
  Gypsy: 'Gypsies',
}

function ruleFor(cls: CanonicalClass, alignment: string, specialtyPriest: boolean): ClassRule {
  switch (cls) {
    case 'Cleric':
      if (specialtyPriest) return { weaponNote: 'Specialty priests use the weapons of their mythos. Settle the list with your DM.' }
      return { priest: true, weapon: blunt, weaponNote: 'Clerics use only blunt, bludgeoning weapons (PHB, Chapter 3).' }
    case 'Druid':
      return {
        priest: true,
        weapon: named('club', 'sickle', 'dart', 'spear', 'dagger or dirk', 'scimitar', 'sling', 'quarterstaff'),
        armor: bodyIn('Padded', 'Hide', 'Leather'),
        weaponNote: 'Druids use only club, sickle, dart, spear, dagger, scimitar, sling and staff (PHB, Chapter 3).',
        armorNote: 'Druids wear only padded, hide or leather armor, and only wooden shields (PHB, Chapter 3).',
      }
    case 'Thief':
      return {
        weapon: named('club', 'dagger or dirk', 'dart', 'hand crossbow', 'knife', 'lasso', 'short bow', 'sling', 'broad sword', 'long sword', 'short sword', 'quarterstaff'),
        armor: bodyIn('Leather', 'Studded leather', 'Padded'),
        weaponNote: 'Thieves use only club, dagger, dart, hand crossbow, knife, lasso, short bow, sling, broad, long and short sword, and staff (PHB, Chapter 3).',
        armorNote: 'Thieves wear only leather, studded leather, padded leather or elven chain (PHB, Chapter 3).',
      }
    case 'Mage':
      return {
        weapon: named('dagger or dirk', 'quarterstaff', 'dart', 'knife', 'sling'),
        armor: (a) => a.kind === 'helmet',
        weaponNote: 'Wizards use only dagger, staff, dart, knife and sling (PHB, Chapter 3).',
        armorNote: 'No armor is allowed to wizards (PHB, Chapter 3).',
      }
    case 'Bard':
      return {
        armor: (a) => a.kind === 'helmet' || (a.kind === 'armor' && (a.baseAC ?? 0) >= 5),
        armorNote: 'Bards wear any armor up to and including chain mail, and use no shield (PHB, Chapter 3).',
      }
    case 'Psionicist':
      return {
        weapon: named('short bow', 'hand or throwing axe', 'hand crossbow', "horseman's mace", 'light crossbow', "horseman's pick", 'dagger or dirk', 'scimitar', 'spear', 'knife', 'short sword', 'club', 'warhammer'),
        armor: (a) => (a.kind === 'shield' ? a.name === 'Small Shield' : a.kind === 'armor' && ['Padded', 'Studded leather', 'Hide'].includes(a.name)),
        weaponNote: 'Psionicists use only the common weapons listed in the Complete Psionics Handbook, Chapter 1.',
        armorNote: 'Psionicists wear only padded, studded leather or hide, carry at most a small shield, and a normal helmet blocks their powers (CPsiH, Chapter 1).',
      }
    case 'Ninja':
      return {
        armor: bodyIn('Leather', 'Padded', 'Studded leather', 'Ring mail', 'Brigandine', 'Scale mail', 'Hide', 'Chain mail'),
        armorNote: 'Ninja wear only leather, padded, studded leather, ring mail, brigandine, scale mail, hide or chain mail (Complete Ninja’s Handbook, Chapter 1).',
      }
    case 'Gypsy':
      return {
        armor: (a) => a.kind === 'helmet' || (a.kind === 'armor' && ['Leather', 'Padded', 'Hide', 'Studded leather'].includes(a.name)),
        weaponNote: 'Gypsies use only one-handed melee weapons, plus any bow or crossbow. This list does not mark them: check each weapon with your DM (Domains of Dread).',
        armorNote: 'Gypsies wear no metal armor and use no shield (Domains of Dread).',
      }
    case 'Anchorite': {
      const armor = (a: GearArmor) => a.kind !== 'armor' || !['Leather', 'Padded', 'Studded leather', 'Hide'].includes(a.name)
      const armorNote = 'Anchorites wear only metal armor, or none at all (Domains of Dread).'
      if (/^lawful/i.test(alignment)) return { priest: true, weapon: blunt, armor, armorNote, weaponNote: 'Lawful anchorites follow the cleric rule: no edged weapons (Domains of Dread).' }
      return { armor, armorNote, weaponNote: 'Neutral anchorites may use edged weapons, but must carry a shield, so one-handed only. This list does not mark them (Domains of Dread).' }
    }
    default:
      return {}
  }
}

export interface ClassGear {
  /** "Clerics", ou "your classes" no multiclasse: para o selo "Not for …". */
  who: string
  weaponNotes: string[]
  armorNotes: string[]
  weaponFits: (w: GearWeapon) => boolean
  armorFits: (a: GearArmor) => boolean
}

export function classGear(
  c: ClassChoice & { alignment?: string | null },
  options: { specialtyPriest?: boolean; kitWeapons?: Set<string> } = {},
): ClassGear {
  const classes = classLevels(c).map((k) => canonicalClass(k.characterClass))
  const rules = classes.map((cls) => ruleFor(cls, c.alignment ?? '', !!options.specialtyPriest))
  const multi = isMultiClass(c)
  const priests = rules.filter((r) => r.priest)
  const weaponRules = priests.length ? priests : rules

  const weaponFits = (w: GearWeapon) => {
    // O que o kit exige ou sugere nunca leva o selo.
    if (options.kitWeapons?.has(weaponProficiencyKey(w.name))) return true
    return priests.length ? priests.every((r) => r.weapon?.(w) ?? true) : rules.some((r) => r.weapon?.(w) ?? true)
  }
  const armorFits = (a: GearArmor) => rules.some((r) => r.armor?.(a) ?? true)

  return {
    who: multi ? 'your classes' : plural[classes[0]],
    weaponNotes: weaponRules.flatMap((r) => (r.weaponNote && (!multi || priests.length || rules.every((k) => k.weapon)) ? [r.weaponNote] : [])),
    armorNotes: multi ? multiClassRestrictions(c).filter((rule) => /armor/i.test(rule)) : rules.flatMap((r) => (r.armorNote ? [r.armorNote] : [])),
    weaponFits,
    armorFits,
  }
}

/** Primeiro o que a regra permite; dentro de cada grupo, a ordem que já estava. */
export function fitsFirst<T>(list: T[], fits: (item: T) => boolean): T[] {
  return [...list.filter(fits), ...list.filter((item) => !fits(item))]
}

/** O aviso de quem escolheu fora da regra. */
export function outsideRuleLine(gear: Pick<ClassGear, 'who'>, names: string[]): string {
  return `! Outside the vanilla rules for ${gear.who}: ${names.join(', ')}. Talk to your DM.`
}
