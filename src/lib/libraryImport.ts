import Ajv2020 from 'ajv/dist/2020'
import { loadData } from '../data/load'
import type { Campaign, Library, NotebookEntry, PlayerCharacter, SpellSheet } from '../types/library'
import { supabase } from './supabase'

// Import do backup do iPad (Settings → Backup, ou o próprio library.json)
// para o Supabase. Contrato do backend (thac0berry-backend,
// docs/modelo-de-dados-e-sync.md §4.1, §5 e §6.1):
// - registro novo: INSERT; registro que o servidor já tem: UPDATE levando o
//   `version` conhecido. Nunca upsert.
// - ordem: campaign → session → character → spell_sheet → notebook_entry.
// - `spellSheets` vira linhas de spell_sheet; retrato, desenho do caderno e
//   tinta da folha viram arquivos (bucket "attachments", <user>/<sha256>).
// - `lastChangedField` e `recentAutoChanges` não sincronizam.
// Personagem ou campanha que não bate com library.schema.json não é
// importado (decisão do usuário: backups antigos podem ser descartados).

/** CharacterLibrary.currentSchemaVersion do iPad. Backup mais novo é recusado. */
export const SUPPORTED_SCHEMA_VERSION = 1

export interface ImportItem<T> {
  value: T
  /** Motivo de não poder importar (falha no schema); null = válido. */
  problem: string | null
  /** O servidor já tem esse id (o import atualiza). */
  onServer: boolean
}

export interface ImportPlan {
  campaigns: ImportItem<Campaign>[]
  characters: ImportItem<PlayerCharacter>[]
  favoriteSpellIDs: string[] | null
  defaultNotebookPaperStyle: string | null
}

export interface ImportSelection {
  campaignIDs: Set<string>
  characterIDs: Set<string>
  preferences: boolean
}

// ---------------------------------------------------------------------------
// Leitura e validação
// ---------------------------------------------------------------------------

type Validator = (value: unknown) => string | null

let validators: Promise<{ campaign: Validator; character: Validator }> | null = null

function loadValidators() {
  validators ??= loadData<{ $id: string }>('library.schema.json').then((schema) => {
    const ajv = new Ajv2020({ allErrors: false, strict: false })
    ajv.addSchema(schema)
    const make = (def: string): Validator => {
      const validate = ajv.getSchema(`${schema.$id}#/$defs/${def}`)
      if (!validate) throw new Error(`schema sem $defs/${def}`)
      return (value) => {
        if (validate(value)) return null
        const error = validate.errors?.[0]
        if (!error) return 'invalid'
        const where = error.instancePath ? `${error.instancePath} ` : ''
        return `${where}${error.message ?? 'is invalid'}`
      }
    }
    return { campaign: make('Campaign'), character: make('PlayerCharacter') }
  })
  return validators
}

export class ImportError extends Error {}

/** Lê o arquivo, valida item por item e marca o que o servidor já tem. */
export async function planImport(text: string): Promise<ImportPlan> {
  let library: Library
  try {
    library = JSON.parse(text) as Library
  } catch {
    throw new ImportError('This file is not valid JSON.')
  }
  if (typeof library !== 'object' || library === null || Array.isArray(library)) {
    throw new ImportError('This file is not a THAC0berry backup.')
  }
  const version = library.schemaVersion ?? 0
  if (version > SUPPORTED_SCHEMA_VERSION) {
    throw new ImportError(
      `This backup was saved by a newer version of the app (format ${version}). Update the web app before importing.`,
    )
  }
  const { campaign, character } = await loadValidators()
  const campaigns = (library.campaigns ?? []) as unknown[]
  const characters = (library.characters ?? []) as unknown[]
  if (campaigns.length === 0 && characters.length === 0) {
    throw new ImportError('This backup has no campaigns or characters.')
  }

  const campaignIDs = campaigns.map((c) => (c as Campaign).id).filter(Boolean)
  const characterIDs = characters.map((c) => (c as PlayerCharacter).id).filter(Boolean)
  const [campaignsOnServer, charactersOnServer] = await Promise.all([
    existing('campaign', campaignIDs),
    existing('character', characterIDs),
  ])

  return {
    campaigns: campaigns.map((value) => ({
      value: value as Campaign,
      problem: campaign(value),
      onServer: campaignsOnServer.has((value as Campaign).id),
    })),
    characters: characters.map((value) => ({
      value: value as PlayerCharacter,
      problem: character(value),
      onServer: charactersOnServer.has((value as PlayerCharacter).id),
    })),
    favoriteSpellIDs: library.favoriteSpellIDs ?? null,
    defaultNotebookPaperStyle: library.defaultNotebookPaperStyle ?? null,
  }
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

type Table = 'campaign' | 'session' | 'character' | 'spell_sheet' | 'notebook_entry'

interface ServerRow {
  version: number
}

/** id → version do que o servidor já tem (inclusive marcado como excluído). */
async function existingVersions(table: Table, ids: string[]): Promise<Map<string, number>> {
  const found = new Map<string, number>()
  // Em lotes, para a URL do filtro `in` não ficar longa demais.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100)
    const { data, error } = await supabase.from(table).select('id, version').in('id', chunk)
    if (error) throw new Error(`${table}: ${error.message}`)
    for (const row of data as (ServerRow & { id: string })[]) found.set(row.id, row.version)
  }
  return found
}

async function existing(table: Table, ids: string[]): Promise<Set<string>> {
  return new Set((await existingVersions(table, ids)).keys())
}

/** INSERT do que é novo; UPDATE (com o version conhecido) do que já existe. */
async function write(table: Table, rows: ({ id: string } & Record<string, unknown>)[]) {
  if (rows.length === 0) return
  const versions = await existingVersions(
    table,
    rows.map((row) => row.id),
  )
  const fresh = rows.filter((row) => !versions.has(row.id))
  if (fresh.length > 0) {
    const { error } = await supabase.from(table).insert(fresh)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  for (const row of rows.filter((r) => versions.has(r.id))) {
    const { error } = await supabase
      .from(table)
      .update({ ...row, version: versions.get(row.id), deleted_at: null })
      .eq('id', row.id)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function mimeOf(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
  if (bytes[0] === 0x48 && bytes[1] === 0x45 && bytes[2] === 0x49 && bytes[3] === 0x43) return 'image/heic'
  // Desenhos do PencilKit (PKDrawing.dataRepresentation()).
  return 'application/octet-stream'
}

/** Envia o binário (se ainda não estiver lá) e devolve o id do attachment. */
async function attachment(userID: string, base64: string | null | undefined): Promise<string | null> {
  if (!base64) return null
  const bytes = base64ToBytes(base64)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

  const known = await supabase.from('attachment').select('id').eq('sha256', sha256).maybeSingle()
  if (known.error) throw new Error(`attachment: ${known.error.message}`)
  if (known.data) return (known.data as { id: string }).id

  const mime = mimeOf(bytes)
  const path = `${userID}/${sha256}`
  const upload = await supabase.storage.from('attachments').upload(path, new Blob([bytes], { type: mime }), {
    contentType: mime,
    upsert: false,
  })
  // Arquivo já no bucket (envio anterior interrompido antes do registro): segue.
  if (upload.error && !/exists|duplicate/i.test(upload.error.message)) {
    throw new Error(`file upload: ${upload.error.message}`)
  }
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('attachment')
    .insert({ id, sha256, mime, bytes: bytes.length, storage_path: path })
  if (error) throw new Error(`attachment: ${error.message}`)
  return id
}

export interface ImportProgress {
  step: string
}

export interface ImportResult {
  campaigns: number
  characters: number
  spellSheets: number
  sessions: number
  notebookEntries: number
}

/**
 * Envia o que foi escolhido. Personagem cuja campanha não vai junto nem está
 * no servidor entra sem campanha (Sandbox), mas a ficha guarda o
 * `campaignID` original.
 */
export async function runImport(
  plan: ImportPlan,
  selection: ImportSelection,
  onProgress: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const { data: auth } = await supabase.auth.getUser()
  const userID = auth.user?.id
  if (!userID) throw new ImportError('Sign in before importing.')

  const campaigns = plan.campaigns
    .filter((item) => !item.problem && selection.campaignIDs.has(item.value.id))
    .map((item) => item.value)
  const characters = plan.characters
    .filter((item) => !item.problem && selection.characterIDs.has(item.value.id))
    .map((item) => item.value)

  onProgress({ step: 'Campaigns' })
  await write(
    'campaign',
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      started_date: c.startedDate,
      notes: c.notes,
      is_archived: c.isArchived,
      enabled_settings: c.enabledSettings ?? null,
    })),
  )

  onProgress({ step: 'Sessions' })
  const sessions = campaigns.flatMap((c) =>
    c.sessions.map((s) => ({
      id: s.id,
      campaign_id: c.id,
      date: s.date,
      title: s.title,
      summary: s.summary,
      is_archived: s.isArchived,
    })),
  )
  await write('session', sessions)

  // Campanhas e sessões que o servidor tem depois deste passo (as enviadas
  // agora e as de imports anteriores): definem o que pode ser referenciado.
  const knownCampaigns = await existing(
    'campaign',
    [...new Set(characters.map((c) => c.campaignID).filter((id): id is string => !!id))],
  )
  const sheetSessionIDs = characters.flatMap((c) => c.spellSheets.map((s) => s.sessionID).filter((id): id is string => !!id))
  const knownSessions = await existing('session', [...new Set(sheetSessionIDs)])

  onProgress({ step: 'Characters' })
  const characterRows = []
  for (const c of characters) {
    const { spellSheets: _sheets, portraitImageData, lastChangedField: _field, recentAutoChanges: _changes, ...data } = c
    characterRows.push({
      id: c.id,
      campaign_id: c.campaignID && knownCampaigns.has(c.campaignID) ? c.campaignID : null,
      portrait_attachment: await attachment(userID, portraitImageData),
      data,
    })
  }
  await write('character', characterRows)

  onProgress({ step: 'Spell sheets' })
  const sheetRows = []
  for (const c of characters) {
    for (const sheet of c.spellSheets) {
      const { inkNotes, ...data }: SpellSheet = sheet
      sheetRows.push({
        id: sheet.id,
        character_id: c.id,
        session_id: sheet.sessionID && knownSessions.has(sheet.sessionID) ? sheet.sessionID : null,
        ink_attachment: await attachment(userID, inkNotes),
        data,
      })
    }
  }
  await write('spell_sheet', sheetRows)

  onProgress({ step: 'Notebook' })
  const notebookRows = []
  for (const c of campaigns) {
    for (const entry of c.notebookEntries as NotebookEntry[]) {
      notebookRows.push({
        id: entry.id,
        campaign_id: c.id,
        date: entry.date,
        title: entry.title,
        text: entry.text,
        kind: entry.kind ?? null,
        paper_style: entry.paperStyle ?? null,
        drawing_attachment: await attachment(userID, entry.drawingData),
      })
    }
  }
  await write('notebook_entry', notebookRows)

  if (selection.preferences) {
    onProgress({ step: 'Preferences' })
    const row = {
      favorite_spell_ids: plan.favoriteSpellIDs ?? [],
      default_notebook_paper_style: plan.defaultNotebookPaperStyle,
    }
    const current = await supabase.from('user_preferences').select('version').eq('user_id', userID).maybeSingle()
    if (current.error) throw new Error(`preferences: ${current.error.message}`)
    const { error } = current.data
      ? await supabase
          .from('user_preferences')
          .update({ ...row, version: (current.data as ServerRow).version })
          .eq('user_id', userID)
      : await supabase.from('user_preferences').insert(row)
    if (error) throw new Error(`preferences: ${error.message}`)
  }

  return {
    campaigns: campaigns.length,
    characters: characters.length,
    spellSheets: sheetRows.length,
    sessions: sessions.length,
    notebookEntries: notebookRows.length,
  }
}
