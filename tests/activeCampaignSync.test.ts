// Campanha ativa na conta (src/rules/activeCampaignSync.ts; backlog item 4, S3).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as A from '../src/rules/activeCampaignSync.ts'

test('o que a conta guarda e as colunas a gravar', () => {
  assert.deepEqual(A.accountChoice({ dm_active_campaign_id: 'c1', dm_active_one_shot: false }), { kind: 'campaign', id: 'c1' })
  assert.deepEqual(A.accountChoice({ dm_active_campaign_id: null, dm_active_one_shot: true }), { kind: 'one-shot' })
  assert.deepEqual(A.accountChoice({}), { kind: 'none' })
  assert.deepEqual(A.choiceColumns({ id: 'c1' }), { dm_active_campaign_id: 'c1', dm_active_one_shot: false })
  assert.deepEqual(A.choiceColumns({ id: null }), { dm_active_campaign_id: null, dm_active_one_shot: true })
  assert.deepEqual(A.choiceColumns(null), { dm_active_campaign_id: null, dm_active_one_shot: false })
})

test('quem vale: pendência sobe; primeira vez, a conta se tiver; depois, a conta', () => {
  const campaign: A.AccountChoice = { kind: 'campaign', id: 'c1' }
  const none: A.AccountChoice = { kind: 'none' }
  assert.equal(A.resolveActiveCampaign({ account: campaign, hasLocal: true, firstTime: false, pending: true }), 'upload')
  assert.equal(A.resolveActiveCampaign({ account: campaign, hasLocal: true, firstTime: true, pending: false }), 'download')
  assert.equal(A.resolveActiveCampaign({ account: none, hasLocal: true, firstTime: true, pending: false }), 'upload')
  assert.equal(A.resolveActiveCampaign({ account: none, hasLocal: false, firstTime: true, pending: false }), 'none')
  // Apagada em outro aparelho: a conta ficou sem escolha e vale.
  assert.equal(A.resolveActiveCampaign({ account: none, hasLocal: true, firstTime: false, pending: false }), 'download')
})
