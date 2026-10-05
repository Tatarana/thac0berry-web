import { useState } from 'react'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'
import { supabase } from '../lib/supabase'

interface Line {
  ok: boolean
  text: string
}

// Mesmo teste da tela Diagnostics do iPad: serviço de login responde (200),
// API recusa anônimo (401) e, logado, a leitura funciona (lista vazia).
async function probe(path: string, expected: number, label: string): Promise<Line> {
  const start = performance.now()
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } })
    const ms = Math.round(performance.now() - start)
    return { ok: response.status === expected, text: `${label}: HTTP ${response.status} (expected ${expected}) · ${ms} ms` }
  } catch (error) {
    return { ok: false, text: `${label}: ${String(error)}` }
  }
}

export function Diagnostics() {
  const { session, signInWithGoogle } = useAuth()
  const [lines, setLines] = useState<Line[]>([])
  const [busy, setBusy] = useState(false)

  async function testConnection() {
    setBusy(true)
    const auth = await probe('/auth/v1/health', 200, 'Auth service')
    const api = await probe('/rest/v1/campaign?select=id&limit=1', 401, 'Data API refuses anonymous access')
    setLines((current) => [...current, auth, api])
    setBusy(false)
  }

  async function signedInRead() {
    setBusy(true)
    const { data, error } = await supabase.from('campaign').select('id')
    const line: Line = error
      ? { ok: false, text: `Signed-in read: ${error.message}` }
      : { ok: true, text: `Signed-in read: OK · ${data.length} campaign(s) on the server` }
    setLines((current) => [...current, line])
    setBusy(false)
  }

  const email = session?.user.email ?? null

  return (
    <div className="page">
      <PageHeader title="Diagnostics" backTo="/settings" />
      <section className="ember-card">
        <p className="soft">Checks the connection to the THAC0berry server. Nothing is saved.</p>
        <div className="btn-row">
          <button className="btn" disabled={busy} onClick={() => void testConnection()}>Test connection</button>
          {!email && (
            <button className="btn" disabled={busy} onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          )}
          <button className="btn" disabled={busy || !email} onClick={() => void signedInRead()}>Test signed-in read</button>
        </div>
        <p className="soft">{email ? `Signed in as ${email}.` : 'Not signed in.'}</p>
      </section>
      <section>
        {lines.map((line, index) => (
          <div key={index} className="result-line">
            <span className={line.ok ? 'result-ok' : 'result-fail'}>{line.ok ? '✔' : '✖'}</span>
            <span>{line.text}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
