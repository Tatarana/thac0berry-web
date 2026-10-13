// Convite para a campanha (src/rules/invites.ts; Fase 2a do backend).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as I from '../src/rules/invites.ts'

test('código do convite: maiúsculas, 4 a 24 letras sem acento, algarismos e hífen', () => {
  assert.equal(I.normalizeInviteCode('  mesa-de-sexta '), 'MESA-DE-SEXTA')
  assert.equal(I.inviteCodeProblem('mesa-de-sexta'), null)
  assert.equal(I.inviteCodeProblem('K7QZ'), null)
  assert.match(I.inviteCodeProblem('abc') ?? '', /4 to 24/)
  assert.match(I.inviteCodeProblem('x'.repeat(25)) ?? '', /4 to 24/)
  assert.match(I.inviteCodeProblem('Dragões') ?? '', /without accents/)
  assert.match(I.inviteCodeProblem('mesa de sexta') ?? '', /without accents/)
})

test('erros das funções do banco viram mensagens; o resto passa como veio', () => {
  assert.match(I.inviteErrorMessage('code_in_use'), /already uses this code/)
  assert.match(I.inviteErrorMessage('invalid_invite'), /No campaign uses this code/)
  assert.equal(I.inviteErrorMessage('network down'), 'network down')
})
