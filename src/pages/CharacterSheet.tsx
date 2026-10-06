import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { RecordPageThree } from '../components/RecordPageThree'
import { RecordPageTwo } from '../components/RecordPageTwo'
import { RecordSheet } from '../components/RecordSheet'
import { PageBeads } from '../components/SheetBits'
import { supabase } from '../lib/supabase'
import type { PlayerCharacter } from '../types/library'

// Ficha de um personagem, só leitura: páginas 1 a 3 da ficha oficial do iPad
// (a 4ª, de tabelas de referência da classe, vem junto com as regras). No
// servidor, `character.data` é o PlayerCharacter do iPad sem `spellSheets`,
// `portraitImageData`, `lastChangedField` e `recentAutoChanges`; o retrato
// fica no Storage (`portrait_attachment`).
type ServerCharacter = Omit<PlayerCharacter, 'spellSheets' | 'portraitImageData'>

interface Loaded {
  character: ServerCharacter
  campaignName: string | null
  portraitAttachment: string | null
  updatedAt: string
}

// Bolinhas 1, 2 e 3, como no iPad (lá não há rótulo, só o número).
const pages = [
  { id: '1', label: 'Record' },
  { id: '2', label: 'Equipment, Movement and Experience' },
  { id: '3', label: 'Character Description' },
]

/** Link temporário (1 h) do retrato; o bucket é privado. */
async function portraitURL(attachmentID: string): Promise<string | null> {
  const { data } = await supabase.from('attachment').select('storage_path').eq('id', attachmentID).maybeSingle()
  const path = (data as { storage_path: string } | null)?.storage_path
  if (!path) return null
  const signed = await supabase.storage.from('attachments').createSignedUrl(path, 3600)
  return signed.data?.signedUrl ?? null
}

export function CharacterSheet() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const page = pages.some((p) => p.id === params.get('page')) ? params.get('page')! : '1'
  const { session, loading, signInWithGoogle } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [portrait, setPortrait] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const userID = session?.user.id ?? null

  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void (async () => {
      const { data, error: readError } = await supabase
        .from('character')
        .select('data, campaign_id, portrait_attachment, updated_at')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
      if (cancelled) return
      if (readError) return setError(readError.message)
      if (!data) return setError('This character is not on your account.')
      const row = data as {
        data: ServerCharacter
        campaign_id: string | null
        portrait_attachment: string | null
        updated_at: string
      }
      let campaignName: string | null = null
      if (row.campaign_id) {
        const campaign = await supabase.from('campaign').select('name').eq('id', row.campaign_id).maybeSingle()
        campaignName = (campaign.data as { name: string } | null)?.name ?? null
      }
      if (!cancelled) {
        setLoaded({
          character: row.data,
          campaignName,
          portraitAttachment: row.portrait_attachment,
          updatedAt: row.updated_at,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userID, id])

  // O retrato só é buscado quando a página 3 abre.
  const attachment = loaded?.portraitAttachment ?? null
  useEffect(() => {
    if (page !== '3' || !attachment || portrait) return
    let cancelled = false
    void portraitURL(attachment).then((url) => {
      if (!cancelled) setPortrait(url)
    })
    return () => {
      cancelled = true
    }
  }, [page, attachment, portrait])

  const character = loaded?.character as PlayerCharacter | undefined

  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/characters" className="paper-link">‹ Characters</Link>
          {loaded && (
            <span className="paper-soft">
              Read only · saved {new Date(loaded.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        {loading && <p className="paper-soft">Checking your session…</p>}
        {!loading && !session && (
          <>
            <p className="paper-soft">Sign in to open your characters.</p>
            <button className="paper-link" onClick={() => void signInWithGoogle()}>Sign in with Google</button>
          </>
        )}
        {error && <p className="paper-soft">Could not open the character: {error}</p>}
        {session && !loaded && !error && <p className="paper-soft">Loading the character…</p>}
        {loaded && character && (
          <>
            <PageBeads
              titles={pages.map((p) => p.label)}
              current={Number(page)}
              onSelect={(next) => setParams(next === 1 ? {} : { page: String(next) }, { replace: true })}
            />
            {page === '1' && <RecordSheet character={character} campaignName={loaded.campaignName} />}
            {page === '2' && <RecordPageTwo character={character} />}
            {page === '3' && <RecordPageThree character={character} portraitURL={portrait} />}
          </>
        )}
      </div>
    </div>
  )
}
