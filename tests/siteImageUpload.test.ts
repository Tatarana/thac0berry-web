// Envio das imagens do site para o S3 (src/lib/siteImageUploadRules.ts).

import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as U from '../src/lib/siteImageUploadRules.ts'

test('endereço público: base sem barra no fim + caminho relativo', () => {
  assert.equal(U.joinURL('https://d1.cloudfront.net', 'forge/race-dwarf-male/abc.webp'), 'https://d1.cloudfront.net/forge/race-dwarf-male/abc.webp')
  assert.equal(U.joinURL('https://d1.cloudfront.net/', 'forge/x/a.webp'), 'https://d1.cloudfront.net/forge/x/a.webp')
  assert.equal(U.joinURL('https://d1.cloudfront.net', 'forge/a b/c.webp'), 'https://d1.cloudfront.net/forge/a%20b/c.webp')
})

test('endereço do bucket antigo do Supabase', () => {
  assert.equal(
    U.supabasePublicURL('https://x.supabase.co/', 'site-images', 'forge/a/b.webp'),
    'https://x.supabase.co/storage/v1/object/public/site-images/forge/a/b.webp',
  )
})

test('presign: aceita a resposta certa e recusa as tortas', () => {
  const good = { url: 'https://b.s3.sa-east-1.amazonaws.com/forge/x/a.webp?X-Amz-Signature=1', path: 'forge/x/a.webp', headers: { 'Content-Type': 'image/webp', 'If-None-Match': '*' }, expiresIn: 300 }
  const parsed = U.parsePresign(good, 'forge/x')
  assert.equal(parsed.path, 'forge/x/a.webp')
  assert.deepEqual(parsed.headers, { 'Content-Type': 'image/webp', 'If-None-Match': '*' })
  assert.throws(() => U.parsePresign(null, 'forge/x'))
  assert.throws(() => U.parsePresign({ ...good, url: 'http://insegura' }, 'forge/x'))
  assert.throws(() => U.parsePresign({ ...good, path: 'forge/y/a.webp' }, 'forge/x'))
  assert.throws(() => U.parsePresign({ ...good, headers: { A: 1 } }, 'forge/x'))
  assert.throws(() => U.parsePresign({ ...good, headers: null }, 'forge/x'))
})

test('mensagens de erro da função e do PUT', () => {
  assert.match(U.functionErrorMessage(403), /admin/)
  assert.match(U.functionErrorMessage(422, 'o arquivo não chegou ao bucket'), /rejected/)
  assert.match(U.functionErrorMessage(500), /try again/i)
  assert.match(U.functionErrorMessage(418), /HTTP 418/)
  assert.match(U.putErrorMessage(403), /expired/)
  assert.match(U.putErrorMessage(412), /already exists/)
  assert.match(U.putErrorMessage(503), /HTTP 503/)
})
