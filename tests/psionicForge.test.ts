// Escolha de poderes no The Forge (src/rules/psionics.ts) e o mapa radial
// (src/lib/psionicMap.ts). CPsiH cap. 1: Tabela 4 e as duas regras.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { powerMap } from '../src/lib/psionicMap.ts'
import * as P from '../src/rules/psionics.ts'

const power = (title: string, discipline: string, tier: 'Science' | 'Devotion', prerequisites: string[] = []) =>
  P.powerChoice({ id: P.powerKey(title).replace(/ /g, '_'), title, discipline, powerTier: tier, parameters: { prerequisites } })

const all = [
  power('Contact', 'Telepathy', 'Devotion'),
  power('Mindlink', 'Telepathy', 'Science', ['Contact\n(None - Revised)']),
  power('Attraction', 'Telepathy', 'Devotion', ['Mindlink', 'Contact']),
  power('Aversion', 'Telepathy', 'Devotion', ['Mindlink', 'Contact']),
  power('ESP', 'Telepathy', 'Devotion'),
  power('Telekinesis', 'Psychokinesis', 'Science'),
  power('Animate Object', 'Psychokinesis', 'Devotion', ['Telekinesis']),
  power('Control Light', 'Psychokinesis', 'Devotion'),
  power('Soften', 'Psychokinesis', 'Devotion'),
  power('Aura Alteration', 'Psychometabolism', 'Devotion', ['Psychic Surgery', '5th level']),
  power('Mind Blank', 'Telepathy', 'Devotion'),
  power('Thought Shield', 'Telepathy', 'Devotion'),
]
const find = (title: string) => all.find((p) => p.title === title)!
let n = 0
const id = () => `ID${++n}`
const learn = (psi: ReturnType<typeof P.emptyPsionics>, title: string) => {
  const p = find(title)
  P.togglePower(psi, p, p.science ? 'Science' : 'Devotion', id)
}

test('pré-requisitos limpos do compêndio', () => {
  assert.deepEqual(P.powerPrerequisites(['Contact\n(None - Revised)']), [{ kind: 'power', key: 'contact', text: 'Contact' }])
  assert.deepEqual(P.powerPrerequisites(['Clairvoyance, detection, 10th level', 'None']), [
    { kind: 'power', key: 'clairvoyance', text: 'Clairvoyance' },
    { kind: 'power', key: 'detection', text: 'detection' },
    { kind: 'level', level: 10 },
  ])
  assert.equal(P.powerKey('Teleport (Psionic)'), 'teleport')
  assert.equal(find('Mind Blank').discipline, 'Defense')
})

test('livro do poder: Dragon Kings fica de fora', () => {
  assert.equal(P.psionicBook([{ book: 'The Complete Psionics Handbook & Dark Sun Campaign Setting (Revised)' }]), 'CPH')
  assert.equal(P.psionicBook([{ book: 'The Will and the Way' }]), 'WatW')
  assert.equal(P.psionicBook([{ book: 'Dragon Magazine #255' }]), 'Dragon')
  assert.equal(P.psionicBook([{ book: 'Dragon Kings' }]), null)
})

test('1º nível: disciplina primeiro, devoções antes da ciência, pré-requisitos', () => {
  const psi = P.emptyPsionics()
  assert.match(P.learnVerdict(find('Contact'), 1, psi, all).reason ?? '', /Take up Telepathy/)
  assert.deepEqual(P.disciplineAction('Telepathy', 1, psi), { kind: 'take', primary: true })
  P.toggleDiscipline(psi, 'Telepathy')
  assert.equal(psi.primaryDiscipline, 'Telepathy')
  assert.deepEqual(P.disciplineAction('Psychokinesis', 1, psi), { kind: 'locked', label: 'No discipline left at level 1' })

  assert.equal(P.learnVerdict(find('Contact'), 1, psi, all).ok, true)
  learn(psi, 'Contact')
  // Mindlink é ciência: precisa de 2 devoções na disciplina.
  assert.match(P.learnVerdict(find('Mindlink'), 1, psi, all).reason ?? '', /Needs 2 devotions in Telepathy/)
  assert.match(P.learnVerdict(find('Attraction'), 1, psi, all).reason ?? '', /Learn Mindlink first/)
  learn(psi, 'ESP')
  assert.equal(P.learnVerdict(find('Mindlink'), 1, psi, all).ok, true)
  learn(psi, 'Mindlink')
  // Com 2 devoções e 1 ciência, esquecer uma devoção quebraria o dobro.
  assert.match(P.learnVerdict(find('ESP'), 1, psi, all).reason ?? '', /fewer than twice as many devotions/)
  learn(psi, 'Attraction')
  // Tabela 4 no 1º nível: 1 ciência, 3 devoções.
  assert.match(P.learnVerdict(find('Aversion'), 1, psi, all).reason ?? '', /No devotion left at level 1/)
  // Esquecer o que outro aprendido exige: não.
  assert.match(P.learnVerdict(find('Contact'), 1, psi, all).reason ?? '', /Needed by Mindlink, Attraction/)
  assert.equal(P.learnVerdict(find('ESP'), 1, psi, all).ok, true)
  assert.equal(P.learnVerdict(find('Attraction'), 1, psi, all).ok, true)
  assert.deepEqual(P.disciplineAction('Telepathy', 1, psi), { kind: 'locked', label: 'Primary discipline' })
})

test('nenhuma outra disciplina iguala a primária; modos de defesa à parte', () => {
  const psi = P.emptyPsionics()
  P.toggleDiscipline(psi, 'Telepathy')
  P.toggleDiscipline(psi, 'Psychokinesis')
  learn(psi, 'Contact')
  learn(psi, 'ESP')
  learn(psi, 'Control Light')
  // Primária com 2 devoções: a segunda devoção de Psicocinese a igualaria.
  assert.match(P.learnVerdict(find('Soften'), 3, psi, all).reason ?? '', /may match your primary, Telepathy \(2 devotions\)/)
  assert.match(P.learnVerdict(find('Aura Alteration'), 3, psi, all).reason ?? '', /Take up Psychometabolism/)

  assert.equal(P.learnVerdict(find('Mind Blank'), 1, psi, all).ok, true)
  learn(psi, 'Mind Blank')
  assert.deepEqual(psi.defenseModes, ['Mind Blank'])
  assert.match(P.learnVerdict(find('Thought Shield'), 1, psi, all).reason ?? '', /defense mode slot is used/)
  learn(psi, 'Mind Blank')
  assert.deepEqual(psi.defenseModes, [])
})

test('mapa radial: cada poder um anel além do que ele exige', () => {
  const telepathy = all.filter((p) => p.discipline === 'Telepathy')
  const map = powerMap(telepathy)
  const at = (title: string) => map.nodes.find((x) => x.power.title === title)!
  assert.equal(map.nodes.length, telepathy.length)
  assert.equal(at('Contact').depth, 0)
  assert.equal(at('Mindlink').depth, 1)
  assert.equal(at('Attraction').depth, 2)
  assert.equal(at('Attraction').parent?.title, 'Mindlink')
  assert.equal(at('Contact').leaf, false)
  assert.equal(at('Attraction').leaf, true)
  assert.equal(at('Attraction').radius, map.firstRing + 2 * map.ringStep)
  assert.equal(map.depth, 2)
  // O ramo do Contact (3 folhas de 6) passaria de 160°: fica no teto.
  const spread = Math.abs(at('Attraction').angle - at('Aversion').angle)
  assert.ok(spread <= 160)
})
