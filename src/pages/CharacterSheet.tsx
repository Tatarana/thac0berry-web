import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { RecordPageFour } from '../components/RecordPageFour'
import { RecordPageThree } from '../components/RecordPageThree'
import { RecordPageTwo } from '../components/RecordPageTwo'
import { RecordSheet } from '../components/RecordSheet'
import { PageBeads } from '../components/SheetBits'
import { SpellSheetPage } from '../components/SpellSheetPage'
import { supabase } from '../lib/supabase'
import { useCharacterDoc, type SaveState } from '../lib/useCharacterDoc'
import { recordSheetPageCount } from '../rules/rules'
import type { PlayerCharacter, SpellSheet } from '../types/library'

// Ficha de um personagem. Aba "Sheet": as páginas da ficha oficial do iPad
// (3, ou 4 com as tabelas de referência da classe, conforme
// recordSheetPageCount); os campos simples são editáveis e gravam sozinhos
// (useCharacterDoc). Aba "Spell Sheets": uma folha de magia por dia, ainda só
// leitura. No servidor, `character.data` é o PlayerCharacter do iPad sem
// `spellSheets`, `portraitImageData`, `lastChangedField` e
// `recentAutoChanges`; o retrato fica no Storage (`portrait_attachment`).
/** spell_sheet.data: o SpellSheet do iPad sem `inkNotes` (vira anexo). */
type ServerSheet = Omit<SpellSheet, 'inkNotes'>

function SaveStatus({ save, onRetry }: { save: SaveState; onRetry: () => void }) {
  switch (save.kind) {
    case 'pending':
    case 'saving':
      return <span className="paper-soft">Saving…</span>
    case 'error':
      return (
        <span className="paper-soft save-error">
          Not saved: {save.message}{' '}
          <button className="paper-link" onClick={onRetry}>Retry</button>
        </span>
      )
    default:
      return <span className="paper-soft">{save.at ? `Saved ${new Date(save.at).toLocaleString()}` : ''}</span>
  }
}

// Bolinhas numeradas, como no iPad (lá não há rótulo, só o número).
const allPages = [
  { id: '1', label: 'Record' },
  { id: '2', label: 'Equipment, Movement and Experience' },
  { id: '3', label: 'Character Description' },
  { id: '4', label: 'Reference Tables' },
]

/** Link temporário (1 h) do retrato; o bucket é privado. */
async function portraitURL(attachmentID: string): Promise<string | null> {
  const { data } = await supabase.from('attachment').select('storage_path').eq('id', attachmentID).maybeSingle()
  const path = (data as { storage_path: string } | null)?.storage_path
  if (!path) return null
  const signed = await supabase.storage.from('attachments').createSignedUrl(path, 3600)
  return signed.data?.signedUrl ?? null
}

// Ícones das abas (PaperTabIcon do iPad: "person.text.rectangle" e um livro).
function SheetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="10.5" r="2" fill="currentColor" />
      <path d="M5.5 15.5c.6-1.6 1.7-2.3 3-2.3s2.4.7 3 2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 10h4.5M14 13.5h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SpellsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 6.5v13" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function CharacterSheet() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'spells' ? 'spells' : 'record'
  const [sheets, setSheets] = useState<ServerSheet[] | null>(null)
  const { session, loading, signInWithGoogle } = useAuth()
  const [campaignName, setCampaignName] = useState<string | null>(null)
  const [portrait, setPortrait] = useState<string | null>(null)
  const userID = session?.user.id ?? null
  const { doc, loadError, save, conflict, dismissConflict, update, retry } = useCharacterDoc(id, userID)
  const campaignID = doc?.campaignID ?? null

  // Folhas de magia (cada uma é um dia de jogo), em ordem de data.
  useEffect(() => {
    if (!userID || !id) return
    let cancelled = false
    void supabase
      .from('spell_sheet')
      .select('data')
      .eq('character_id', id)
      .is('deleted_at', null)
      .then(({ data, error }) => {
        if (cancelled || error) return
        setSheets((data as { data: ServerSheet }[]).map((r) => r.data).sort((a, b) => a.date.localeCompare(b.date)))
      })
    return () => {
      cancelled = true
    }
  }, [userID, id])

  useEffect(() => {
    if (!campaignID) return
    let cancelled = false
    void supabase
      .from('campaign')
      .select('name')
      .eq('id', campaignID)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCampaignName((data as { name: string } | null)?.name ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [campaignID])

  const character = doc?.character as PlayerCharacter | undefined
  const loaded = doc
  const error = loadError
  const edit = update as (mutate: (c: PlayerCharacter) => void) => void
  const pages = allPages.slice(0, character ? recordSheetPageCount(character.characterClass) : 3)
  const page = pages.some((p) => p.id === params.get('page')) ? params.get('page')! : '1'

  // O retrato só é buscado quando a página 3 abre.
  const attachment = doc?.portraitAttachment ?? null
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


  return (
    <div className="paper-page">
      <div className="paper-sheet">
        <div className="paper-top">
          <Link to="/characters" className="paper-link">‹ Characters</Link>
          {loaded && <SaveStatus save={save} onRetry={() => void retry()} />}
        </div>
        {conflict && (
          <div className="conflict-note" role="status">
            This sheet was also changed somewhere else. Your version was saved; the other one is kept in the history.{' '}
            <button className="paper-link" onClick={dismissConflict}>OK</button>
          </div>
        )}
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
            <nav className="paper-tabs" aria-label="Sheet sections">
              <button
                className={view === 'record' ? 'paper-tab paper-tab-on' : 'paper-tab'}
                title="Sheet"
                aria-label="Sheet"
                aria-current={view === 'record' ? 'page' : undefined}
                onClick={() => setParams({}, { replace: true })}
              >
                <SheetIcon />
              </button>
              {sheets && sheets.length > 0 && (
                <button
                  className={view === 'spells' ? 'paper-tab paper-tab-on' : 'paper-tab'}
                  title="Spell Sheets"
                  aria-label="Spell Sheets"
                  aria-current={view === 'spells' ? 'page' : undefined}
                  onClick={() => setParams({ view: 'spells' }, { replace: true })}
                >
                  <SpellsIcon />
                </button>
              )}
            </nav>
            {view === 'record' && (
              <>
                <PageBeads
                  titles={pages.map((p) => p.label)}
                  current={Number(page)}
                  onSelect={(next) => setParams(next === 1 ? {} : { page: String(next) }, { replace: true })}
                />
                {page === '1' && <RecordSheet character={character} campaignName={campaignName} edit={edit} />}
                {page === '2' && <RecordPageTwo character={character} edit={edit} />}
                {page === '3' && <RecordPageThree character={character} portraitURL={portrait} edit={edit} />}
                {page === '4' && <RecordPageFour character={character} />}
              </>
            )}
            {view === 'spells' && sheets && sheets.length > 0 && (() => {
              // Uma bolinha por dia, como as da Priest Spell Sheet do iPad;
              // sem escolha na URL, abre o dia mais recente.
              const asked = Number(params.get('day'))
              const day = asked >= 1 && asked <= sheets.length ? asked : sheets.length
              const sheet = sheets[day - 1]
              return (
                <>
                  <PageBeads
                    titles={sheets.map((s) => s.title || new Date(s.date).toLocaleDateString('en-US', { dateStyle: 'medium' }))}
                    current={day}
                    noun="Day"
                    onSelect={(next) => setParams({ view: 'spells', day: String(next) }, { replace: true })}
                  />
                  <SpellSheetPage
                    key={sheet.id}
                    sheet={sheet}
                    characterName={character.name}
                    characterClass={character.characterClass}
                    level={character.level}
                  />
                </>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
