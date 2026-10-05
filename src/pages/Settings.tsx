import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'

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
