import { hasSpellSheetAny, spellSheetAbility } from '../rules/multiclass'
import { computedSpellSlotAllotments } from '../rules/rules'
import { startSpellSheet } from '../rules/spellSheets'
import type { PlayerCharacter } from '../types/library'
import { loadValidators } from './libraryImport'
import { activeSessionID } from './sessions'
import { supabase } from './supabase'
import type { ServerCharacter } from './useCharacterDoc'

// Elenco das campanhas (CharacterLibrary do iPad): personagem novo, trazer
// do Sandbox e apagar campanha. Mesmo contrato de sempre: INSERT do que é
// novo, UPDATE com o `version` conhecido, nada se apaga de verdade.

const newID = () => crypto.randomUUID().toUpperCase()

/** PlayerCharacter() do iPad: os valores padrão de Models/Character.swift. */
export function blankCharacter(campaignID: string | null): ServerCharacter {
  const blankDetails = Object.fromEntries(
    [
      'strengthHit', 'strengthDamage', 'strengthWeight', 'strengthMaxPress', 'strengthDoors', 'strengthBars',
      'dexterityReaction', 'dexterityMissile', 'dexterityDefense',
      'constitutionHP', 'constitutionShock', 'constitutionResurrection', 'constitutionPoison',
      'intelligenceLanguages', 'intelligenceMaxLevel', 'intelligenceLearn', 'intelligenceMaxPerLevel',
      'wisdomDefense', 'wisdomFailure', 'wisdomBonusSpells',
      'charismaHenchmen', 'charismaLoyalty', 'charismaReaction',
    ].map((key) => [key, '']),
  ) as unknown as PlayerCharacter['details']
  return {
    id: newID(),
    name: '',
    playerName: '',
    race: '',
    characterClass: 'Fighter',
    level: 1,
    alignment: '',
    deity: '',
    sex: '',
    age: '',
    height: '',
    weight: '',
    hair: '',
    eyes: '',
    movement: 12,
    equipment: [],
    weapons: [],
    languages: [],
    magicItems: [],
    allies: [],
    treasure: { platinum: 0, gold: 0, electrum: 0, silver: 0, copper: 0 },
    details: blankDetails,
    abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    saves: { paralyzationPoisonDeath: 16, rodStaffWand: 18, petrificationPolymorph: 17, breathWeapon: 20, spell: 19 },
    hitPointsMax: 6,
    hitPointsCurrent: 6,
    armorClass: 10,
    thac0: 20,
    experience: 0,
    armorRating: '',
    shieldRating: '',
    spellSlotAllotments: [],
    campaignID,
    status: 'alive',
    favoriteSpellIDs: [],
    wizardSpellbook: [],
  }
}

async function checkCharacter(data: ServerCharacter) {
  const { character } = await loadValidators()
  const problem = character({ ...data, spellSheets: [] })
  if (problem) throw new Error(`the sheet would not open on the iPad (${problem})`)
}

/** Slots de hoje (de todas as classes) e o atributo congelado na folha (spellSheetAbility). */
export function spellSheetBasis(c: ServerCharacter) {
  return {
    allotments: computedSpellSlotAllotments(c as PlayerCharacter),
    abilityScoreAtCreation: spellSheetAbility(c),
  }
}

/**
 * seedFirstSpellSheetIfNeeded do iPad: personagem com ficha de magia, sem
 * nenhuma folha e numa campanha ganha a "First day" na sessão ativa.
 */
async function seedFirstSpellSheet(characterID: string, c: ServerCharacter, campaignID: string) {
  if (!hasSpellSheetAny(c)) return
  const existing = await supabase.from('spell_sheet').select('id').eq('character_id', characterID).is('deleted_at', null).limit(1)
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data.length > 0) return
  const sessionID = await activeSessionID(campaignID)
  const sheet = startSpellSheet(spellSheetBasis(c), [], { sessionID, title: 'First day' })
  const { spellSheet } = await loadValidators()
  const problem = spellSheet(sheet)
  if (problem) throw new Error(`the first spell sheet would not open on the iPad (${problem})`)
  const { error } = await supabase.from('spell_sheet').insert({ id: sheet.id, character_id: characterID, session_id: sessionID, data: sheet })
  if (error) throw new Error(error.message)
}

/** addCharacter(campaignID:) do iPad: personagem em branco (Fighter 1), já na campanha. */
export async function createCharacter(campaignID: string | null): Promise<string> {
  const data = blankCharacter(campaignID)
  await checkCharacter(data)
  const { error } = await supabase.from('character').insert({ id: data.id, campaign_id: campaignID, data })
  if (error) throw new Error(error.message)
  return data.id
}

/** assign(_:toCampaignID:) do iPad: muda a campanha do personagem (e semeia a primeira folha de magia). */
export async function assignToCampaign(characterID: string, campaignID: string | null) {
  const { data: row, error } = await supabase.from('character').select('data, version').eq('id', characterID).single()
  if (error) throw new Error(error.message)
  const { data, version } = row as { data: ServerCharacter; version: number }
  const next = { ...data, campaignID }
  await checkCharacter(next)
  const saved = await supabase.from('character').update({ campaign_id: campaignID, data: next, version }).eq('id', characterID)
  if (saved.error) throw new Error(saved.error.message)
  if (campaignID) await seedFirstSpellSheet(characterID, next, campaignID)
}

/** Marca `deleted_at` em linhas de uma tabela, cada uma com seu `version`. */
async function softDelete(table: 'campaign' | 'session' | 'notebook_entry', rows: { id: string; version: number }[]) {
  const now = new Date().toISOString()
  for (const row of rows) {
    const { error } = await supabase.from(table).update({ deleted_at: now, version: row.version }).eq('id', row.id)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

/**
 * deleteCampaign do iPad: os personagens voltam para o Sandbox (com o caderno
 * deles); a campanha some com as sessões e as folhas antigas de caderno da
 * campanha, sem personagem. Aqui tudo vira `deleted_at` (fica no histórico).
 */
export async function deleteCampaign(campaignID: string) {
  const cast = await supabase.from('character').select('id').eq('campaign_id', campaignID).is('deleted_at', null)
  if (cast.error) throw new Error(cast.error.message)
  for (const c of cast.data as { id: string }[]) await assignToCampaign(c.id, null)

  for (const table of ['notebook_entry', 'session'] as const) {
    const query = supabase.from(table).select('id, version').eq('campaign_id', campaignID).is('deleted_at', null)
    const rows = await (table === 'notebook_entry' ? query.is('character_id', null) : query)
    if (rows.error) throw new Error(`${table}: ${rows.error.message}`)
    await softDelete(table, rows.data as { id: string; version: number }[])
  }
  const campaign = await supabase.from('campaign').select('id, version').eq('id', campaignID).single()
  if (campaign.error) throw new Error(campaign.error.message)
  await softDelete('campaign', [campaign.data as { id: string; version: number }])
}

// --- Ações no personagem (menu de contexto do elenco no iPad) ------------------

/** Lê a ficha com a versão, aplica a mudança e grava (UPDATE com o `version` conhecido). */
async function editCharacter(characterID: string, mutate: (c: ServerCharacter) => void) {
  const { data: row, error } = await supabase.from('character').select('data, version').eq('id', characterID).single()
  if (error) throw new Error(error.message)
  const { data, version } = row as { data: ServerCharacter; version: number }
  const next = structuredClone(data)
  mutate(next)
  await checkCharacter(next)
  const saved = await supabase.from('character').update({ data: next, version }).eq('id', characterID)
  if (saved.error) throw new Error(saved.error.message)
}

/** markDead do iPad: morto na data, com uma nota opcional. */
export const markDead = (characterID: string, diedOn: string, note: string) =>
  editCharacter(characterID, (c) => {
    c.status = 'dead'
    c.diedOn = diedOn
    c.deathNote = note.trim() === '' ? null : note.trim()
  })

/** toggleArchived do iPad: arquiva (ou desarquiva) sem apagar nada. */
export const toggleArchived = (characterID: string) =>
  editCharacter(characterID, (c) => {
    c.status = c.status === 'archived' ? 'alive' : 'archived'
  })

/** reviveToAlive do iPad: morto ou arquivado volta ao elenco ativo. */
export const bringBack = (characterID: string) =>
  editCharacter(characterID, (c) => {
    c.status = 'alive'
    c.diedOn = null
    c.deathNote = null
  })

/**
 * cloneCharacter do iPad: nova identidade, viva, sem folhas de magia nem
 * caderno (sem histórico), na campanha pedida. Ganha a primeira folha de magia
 * se for conjurador numa campanha. Devolve o id do clone.
 */
export async function cloneCharacter(characterID: string, campaignID: string | null): Promise<string> {
  const { data: row, error } = await supabase.from('character').select('data, portrait_attachment').eq('id', characterID).single()
  if (error) throw new Error(error.message)
  const { data, portrait_attachment } = row as { data: ServerCharacter; portrait_attachment: string | null }
  const { notebookEntries: _notebook, ...rest } = data
  const clone: ServerCharacter = {
    ...structuredClone(rest),
    id: newID(),
    campaignID,
    status: 'alive',
    diedOn: null,
    deathNote: null,
    clonedFromCharacterID: data.id,
  }
  await checkCharacter(clone)
  const inserted = await supabase.from('character').insert({ id: clone.id, campaign_id: campaignID, portrait_attachment, data: clone })
  if (inserted.error) throw new Error(inserted.error.message)
  if (campaignID) await seedFirstSpellSheet(clone.id, clone, campaignID)
  return clone.id
}

/**
 * deleteCharacter do iPad. Aqui o personagem, as folhas de magia e o caderno
 * dele viram `deleted_at` (ficam no histórico do servidor).
 */
export async function deleteCharacter(characterID: string) {
  const now = new Date().toISOString()
  for (const table of ['spell_sheet', 'notebook_entry'] as const) {
    const rows = await supabase.from(table).select('id, version').eq('character_id', characterID).is('deleted_at', null)
    if (rows.error) throw new Error(`${table}: ${rows.error.message}`)
    for (const r of rows.data as { id: string; version: number }[]) {
      const { error } = await supabase.from(table).update({ deleted_at: now, version: r.version }).eq('id', r.id)
      if (error) throw new Error(`${table}: ${error.message}`)
    }
  }
  const row = await supabase.from('character').select('version').eq('id', characterID).single()
  if (row.error) throw new Error(row.error.message)
  const { error } = await supabase
    .from('character')
    .update({ deleted_at: now, version: (row.data as { version: number }).version })
    .eq('id', characterID)
  if (error) throw new Error(error.message)
}
