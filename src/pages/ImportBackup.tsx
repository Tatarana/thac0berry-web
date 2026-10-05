import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { PageHeader } from '../components/PageHeader'
import {
  ImportError,
  planImport,
  runImport,
  type ImportItem,
  type ImportPlan,
  type ImportResult,
} from '../lib/libraryImport'
import type { Campaign, PlayerCharacter } from '../types/library'

// Import do backup do iPad: escolher o arquivo, ver a prévia, marcar o que
// entra (pedido do usuário: escolher campanhas e personagens) e enviar.

function Tag({ item }: { item: ImportItem<unknown> }) {
  if (item.problem) return <span className="import-tag import-tag-bad">can't import</span>
  return <span className="import-tag">{item.onServer ? 'update' : 'new'}</span>
}

function characterLine(c: PlayerCharacter) {
  return `${c.characterClass} ${c.level} · ${c.race || 'no race'}${c.status !== 'alive' ? ` · ${c.status}` : ''}`
}

export function ImportBackup() {
  const { session, loading, signInWithGoogle } = useAuth()
  const [fileName, setFileName] = useState<string | null>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [campaignIDs, setCampaignIDs] = useState<Set<string>>(new Set())
  const [characterIDs, setCharacterIDs] = useState<Set<string>>(new Set())
  const [preferences, setPreferences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFileName(file.name)
    setPlan(null)
    setResult(null)
    setError(null)
    setBusy('Reading the backup…')
    try {
      const next = await planImport(await file.text())
      setPlan(next)
      // Começa com tudo o que é válido marcado.
      setCampaignIDs(new Set(next.campaigns.filter((i) => !i.problem).map((i) => i.value.id)))
      setCharacterIDs(new Set(next.characters.filter((i) => !i.problem).map((i) => i.value.id)))
      setPreferences(next.favoriteSpellIDs !== null || next.defaultNotebookPaperStyle !== null)
    } catch (reason) {
      setError(reason instanceof ImportError ? reason.message : `Could not read the backup: ${String(reason)}`)
    } finally {
      setBusy(null)
    }
  }

  const validCampaign = (id: string | null | undefined) =>
    plan?.campaigns.find((i) => i.value.id === id && !i.problem) ?? null

  function toggleCampaign(campaign: ImportItem<Campaign>) {
    const id = campaign.value.id
    const next = new Set(campaignIDs)
    if (next.has(id)) {
      next.delete(id)
      // Sem a campanha (e sem ela no servidor), os personagens dela não têm onde entrar.
      if (!campaign.onServer) {
        const chars = new Set(characterIDs)
        for (const c of plan?.characters ?? []) if (c.value.campaignID === id) chars.delete(c.value.id)
        setCharacterIDs(chars)
      }
    } else {
      next.add(id)
    }
    setCampaignIDs(next)
  }

  function toggleCharacter(character: ImportItem<PlayerCharacter>) {
    const id = character.value.id
    const next = new Set(characterIDs)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
      // O personagem leva a campanha junto, se ela estiver no backup.
      const campaign = validCampaign(character.value.campaignID)
      if (campaign && !campaign.onServer) setCampaignIDs(new Set(campaignIDs).add(campaign.value.id))
    }
    setCharacterIDs(next)
  }

  async function startImport() {
    if (!plan) return
    setError(null)
    try {
      const done = await runImport(plan, { campaignIDs, characterIDs, preferences }, ({ step }) =>
        setBusy(`Sending: ${step}…`),
      )
      setResult(done)
      setPlan(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(null)
    }
  }

  const characterRow = (item: ImportItem<PlayerCharacter>) => (
    <li key={item.value.id} className={item.problem ? 'import-row import-row-bad' : 'import-row'}>
      <label>
        <input
          type="checkbox"
          disabled={!!item.problem || !!busy}
          checked={characterIDs.has(item.value.id)}
          onChange={() => toggleCharacter(item)}
        />
        <span className="import-name">{item.value.name || 'Unnamed character'}</span>
        <Tag item={item} />
      </label>
      <div className="soft import-detail">
        {item.problem ? `Saved by an older app version (${item.problem}).` : characterLine(item.value)}
      </div>
    </li>
  )

  const campaignsInFile = plan?.campaigns ?? []
  const looseCharacters = (plan?.characters ?? []).filter((c) => !campaignsInFile.some((k) => k.value.id === c.value.campaignID))
  const selectedCount = campaignIDs.size + characterIDs.size + (preferences ? 1 : 0)

  return (
    <div className="page">
      <PageHeader title="Import Backup" backTo="/characters" />

      <section className="ember-card">
        <p className="soft">
          On the iPad, export your library in Settings → Backup, then choose the file here. You pick which campaigns
          and characters to bring; importing the same backup again updates them instead of creating copies.
        </p>
        {loading && <p className="soft">Checking your session…</p>}
        {!loading && !session && (
          <div className="btn-row">
            <button className="btn" onClick={() => void signInWithGoogle()}>Sign in with Google to import</button>
          </div>
        )}
        {session && (
          <div className="btn-row">
            <label className={busy ? 'btn btn-disabled' : 'btn'}>
              Choose backup file
              <input type="file" accept=".json,application/json" hidden disabled={!!busy} onChange={(e) => void chooseFile(e)} />
            </label>
            {fileName && <span className="soft">{fileName}</span>}
          </div>
        )}
        {busy && <p className="soft">{busy}</p>}
        {error && (
          <div className="result-line">
            <span className="result-fail">✖</span>
            <span>{error}</span>
          </div>
        )}
      </section>

      {result && (
        <section className="ember-card">
          <h2 className="card-title">Imported</h2>
          <p className="soft">
            {result.characters} character(s), {result.spellSheets} spell sheet(s), {result.campaigns} campaign(s),{' '}
            {result.sessions} session(s), {result.notebookEntries} notebook page(s).
          </p>
          <div className="btn-row">
            <Link className="btn" to="/characters">See characters</Link>
          </div>
        </section>
      )}

      {plan && (
        <>
          {campaignsInFile.map((campaign) => {
            const characters = plan.characters.filter((c) => c.value.campaignID === campaign.value.id)
            return (
              <section key={campaign.value.id} className="ember-card">
                <label className="import-campaign">
                  <input
                    type="checkbox"
                    disabled={!!campaign.problem || !!busy}
                    checked={campaignIDs.has(campaign.value.id)}
                    onChange={() => toggleCampaign(campaign)}
                  />
                  <span className="card-title">{campaign.value.name || 'Unnamed campaign'}</span>
                  <Tag item={campaign} />
                </label>
                <p className="soft import-detail">
                  {campaign.problem
                    ? `Saved by an older app version (${campaign.problem}).`
                    : `Campaign · ${campaign.value.sessions.length} session(s), ${campaign.value.notebookEntries.length} notebook page(s)`}
                </p>
                {characters.length > 0 && <ul className="import-list">{characters.map(characterRow)}</ul>}
              </section>
            )
          })}

          {looseCharacters.length > 0 && (
            <section className="ember-card">
              <h2 className="card-title">No campaign</h2>
              <ul className="import-list">{looseCharacters.map(characterRow)}</ul>
            </section>
          )}

          {(plan.favoriteSpellIDs !== null || plan.defaultNotebookPaperStyle !== null) && (
            <section className="ember-card">
              <label className="import-campaign">
                <input
                  type="checkbox"
                  disabled={!!busy}
                  checked={preferences}
                  onChange={() => setPreferences(!preferences)}
                />
                <span className="card-title">Preferences</span>
              </label>
              <p className="soft import-detail">
                {plan.favoriteSpellIDs?.length ?? 0} favorite spell(s)
                {plan.defaultNotebookPaperStyle ? ` · notebook paper: ${plan.defaultNotebookPaperStyle}` : ''}. Replaces
                the ones on your account.
              </p>
            </section>
          )}

          <section className="ember-card">
            <div className="btn-row">
              <button className="btn" disabled={!!busy || selectedCount === 0} onClick={() => void startImport()}>
                Import selected
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
