import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import { paperStyles, type PaperStyle } from '../lib/notebook'
import { loadPreferences, savePreferences } from '../lib/preferences'

/**
 * Preferências da conta (2026-10-10): papel padrão das folhas novas do caderno
 * e o nome do jogador que entra nos personagens novos. Gravadas no Supabase
 * (`user_preferences`), valem em todos os aparelhos.
 */
function PreferencesCard({ userID }: { userID: string }) {
  const [loaded, setLoaded] = useState(false)
  const [paper, setPaper] = useState<PaperStyle>('plain')
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadPreferences(userID)
      .then((prefs) => {
        if (cancelled) return
        setPaper(prefs.default_notebook_paper_style ?? 'plain')
        setName(prefs.default_player_name ?? '')
        setSavedName(prefs.default_player_name ?? '')
        setLoaded(true)
      })
      .catch((reason: unknown) => setStatus(`Could not load: ${String(reason)}`))
    return () => {
      cancelled = true
    }
  }, [userID])

  async function save(patch: Parameters<typeof savePreferences>[1], done: string) {
    setStatus('Saving…')
    try {
      await savePreferences(userID, patch)
      setStatus(done)
    } catch (reason) {
      setStatus(`Could not save: ${reason instanceof Error ? reason.message : String(reason)}`)
    }
  }

  function choosePaper(style: PaperStyle) {
    setPaper(style)
    void save({ default_notebook_paper_style: style }, 'Notebook paper saved.')
  }

  function commitName() {
    const trimmed = name.trim()
    if (trimmed === savedName) return
    setSavedName(trimmed)
    void save({ default_player_name: trimmed === '' ? null : trimmed }, 'Player name saved.')
  }

  return (
    <section className="ember-card">
      <h2 className="card-title">Preferences</h2>
      {!loaded && !status && <p className="soft">Loading…</p>}
      {loaded && (
        <>
          <label className="settings-field">
            <span className="soft">Player name — filled in on every new character you create</span>
            <input
              className="settings-input"
              value={name}
              placeholder="your name or nickname"
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
            />
          </label>
          <div className="settings-field">
            <span className="soft">Notebook paper — for new pages</span>
            <div className="btn-row">
              {paperStyles.map((option) => (
                <button key={option.value} className={paper === option.value ? 'btn btn-on' : 'btn'} aria-pressed={paper === option.value} onClick={() => choosePaper(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {status && <p className="soft settings-status">{status}</p>}
    </section>
  )
}

export function Settings() {
  const { session, loading, signInWithGoogle, signOut } = useAuth()
  const email = session?.user.email ?? null

  return (
    <div className="page">
      <PageHeader title="Settings" />

      <section className="ember-card">
        <h2 className="card-title">Account</h2>
        {loading && <p className="soft">Checking your session…</p>}
        {!loading && email && (
          <>
            <p className="soft">Signed in as {email}.</p>
            <div className="btn-row">
              <button className="btn" onClick={() => void signOut()}>Sign out</button>
            </div>
          </>
        )}
        {!loading && !email && (
          <>
            <p className="soft">Sign in to keep your characters in sync between devices.</p>
            <div className="btn-row">
              <button className="btn" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
            </div>
          </>
        )}
      </section>

      {session && <PreferencesCard userID={session.user.id} />}

      <section className="ember-card">
        <h2 className="card-title">Backup</h2>
        <p className="soft">Bring campaigns and characters from an iPad backup into your account.</p>
        <div className="btn-row">
          <Link className="btn" to="/import">Import iPad backup</Link>
        </div>
      </section>

      <section className="ember-card">
        <h2 className="card-title">Diagnostics</h2>
        <p className="soft">Tests the connection to the THAC0berry server. Nothing is saved.</p>
        <div className="btn-row">
          <Link className="btn" to="/diagnostics">Open Diagnostics</Link>
        </div>
      </section>

      <section className="ember-card version">
        <span>THAC0berry web</span>
        <span className="soft">v{__APP_VERSION__}</span>
      </section>
    </div>
  )
}
