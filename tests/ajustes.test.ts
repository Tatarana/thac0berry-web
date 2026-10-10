// Ajustes de 2026-10-10 (docs/ajustes-2026-10.md): troca de classe tira o kit;
// PV temporários visíveis.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as C from '../src/rules/consequences.ts'
import * as E from '../src/rules/effects.ts'
import * as R from '../src/rules/rules.ts'
import * as S from '../src/rules/sheetEdits.ts'
import * as K from '../src/rules/combat.ts'
import * as M from '../src/rules/multiclass.ts'
import type { PlayerCharacter } from '../src/types/library.ts'

function cleric(): PlayerCharacter {
  return {
    characterClass: 'Cleric',
    level: 3,
    experience: 3500,
    race: 'Human',
    kit: 'Academician',
    abilities: { strength: 17, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 16, charisma: 11 },
    thac0: 20,
    saves: { ...R.savingThrowsForLevel('Cleric', 3)! },
    details: {},
    combat: null,
    levelChanges: null,
    wizardSpellbook: [],
    xpNeededNextLevel: null,
    hitPointsCurrent: 38,
    hitPointsMax: 38,
    activeEffects: [],
    armorClass: 5,
  } as unknown as PlayerCharacter
}

test('troca livre de classe tira o kit; a classe dupla mantém (CFH/CTH/CPrH)', () => {
  const c = cleric()
  C.changeClass(c, 'Fighter', null)
  assert.equal(c.characterClass, 'Fighter')
  assert.equal(c.kit, null)
  const d = cleric()
  C.dualClassSwitch(d, 'Fighter', null)
  assert.equal(d.kit, 'Academician')
})

test('PV temporários: somados aos atuais (passam do máximo) e contados à parte', () => {
  const c = cleric()
  const effect = E.newEffect()
  effect.components = [{ ...E.newComponent(), kind: 'tempHP', tempHPGranted: 10 }]
  E.addEffect(c, effect)
  assert.equal(c.hitPointsCurrent, 48)
  assert.equal(E.temporaryHitPoints(c), 10)
  E.endEffect(c, effect.id)
  assert.equal(c.hitPointsCurrent, 38)
  assert.equal(E.temporaryHitPoints(c), 0)
})

test('regeneração: aparece quando dispara (dano ou manual) e some quando acaba', () => {
  const c = cleric()
  c.hitPointsCurrent = 30
  const effect = E.newEffect()
  effect.name = 'Regenerate'
  effect.components = [{ ...E.newComponent(), kind: 'bankedHeal', maxUses: 2 }]
  E.addEffect(c, effect)
  assert.equal(E.activeRegenerations(c).length, 0, 'guardada: ainda não dispara')
  S.applyDamage(c, 3)
  const [r] = E.activeRegenerations(c)
  assert.equal(r.name, 'Regenerate')
  assert.equal(r.max, 2)
  E.logBankedHeal(c, r.effectID, r.componentID, 1)
  E.logBankedHeal(c, r.effectID, r.componentID, 1)
  assert.equal(c.hitPointsCurrent, 29)
  assert.equal(E.activeRegenerations(c).length, 0, 'curou tudo: a janela some')
})

test('CA final = armadura + ajuste defensivo da DEX (linha da ficha, ou a tabela)', () => {
  const base = { armorClass: 5, abilities: { strength: 10, dexterity: 16, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 } }
  assert.equal(R.dexDefenseAdjustment(base), -2)
  assert.equal(R.finalArmorClass(base), 3)
  // A linha da DEX na ficha manda (acompanha efeitos como poções).
  assert.equal(R.finalArmorClass({ ...base, details: { dexterityDefense: '-4' } }), 1)
  // DEX baixa piora a CA.
  assert.equal(R.finalArmorClass({ ...base, abilities: { ...base.abilities, dexterity: 5 } }), 7)
  // Sem DEX conhecida: só a armadura.
  assert.equal(R.finalArmorClass({ armorClass: 10 }), 10)
})

test('Combat Tracker usa a CA final do personagem', () => {
  const pc = { name: 'Kel', armorClass: 5, hitPointsMax: 38, hitPointsCurrent: 38, thac0: 14, details: { dexterityDefense: '-2' } }
  assert.equal(K.characterCombatant('x', pc).ac, 3)
})

test('conjuração por kit: grimório e folhas sem ser mago/sacerdote, slots à mão', () => {
  const ninja = { characterClass: 'Thief' as const, level: 4, abilities: { strength: 10, dexterity: 17, constitution: 10, intelligence: 15, wisdom: 9, charisma: 10 } }
  assert.equal(M.hasSpellSheetAny(ninja), false)
  const shinobi = { ...ninja, kitSpellcasting: { arcane: [] } }
  assert.equal(M.hasSpellSheetAny(shinobi), true, 'ligado mesmo sem slots ainda')
  assert.equal(M.isArcaneCasterAny(shinobi), true)
  assert.equal(M.isDivineCasterAny(shinobi), false)
  assert.equal(M.spellSheetAbility(shinobi), 15, 'só arcana: a folha guarda a INT')
  const slots = R.computedSpellSlotAllotments({ ...ninja, kitSpellcasting: { arcane: [2, 1], divine: [1] } })
  assert.deepEqual(
    slots.map((s) => `${s.caster}${s.level}x${s.count}`).sort(),
    ['arcane1x2', 'arcane2x1', 'divine1x1'],
  )
})
