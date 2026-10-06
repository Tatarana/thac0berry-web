import { computedSpellSlotAllotments, hasSpellSheet, isArcaneCaster } from '../rules/rules'
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

/** Slots de hoje e o atributo congelado na folha (Sabedoria, ou Inteligência para mago e bardo). */
export function spellSheetBasis(c: ServerCharacter) {
  return {
    allotments: computedSpellSlotAllotments(c as PlayerCharacter),
    abilityScoreAtCreation: isArcaneCaster(c.characterClass) ? c.abilities.intelligence : c.abilities.wisdom,
  }
}

/**
 * seedFirstSpellSheetIfNeeded do iPad: personagem com ficha de magia, sem
 * nenhuma folha e numa campanha ganha a "First day" na sessão ativa.
 */
async function seedFirstSpellSheet(characterID: string, c: ServerCharacter, campaignID: string) {
  if (!hasSpellSheet(c.characterClass)) return
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
 * deleteCampaign do iPad: os personagens voltam para o Sandbox; a campanha
 * some com as sessões e o caderno dela. Aqui tudo vira `deleted_at` (fica no
 * histórico do servidor).
 */
export async function deleteCampaign(campaignID: string) {
  const cast = await supabase.from('character').select('id').eq('campaign_id', campaignID).is('deleted_at', null)
  if (cast.error) throw new Error(cast.error.message)
  for (const c of cast.data as { id: string }[]) await assignToCampaign(c.id, null)

  for (const table of ['notebook_entry', 'session'] as const) {
    const rows = await supabase.from(table).select('id, version').eq('campaign_id', campaignID).is('deleted_at', null)
    if (rows.error) throw new Error(`${table}: ${rows.error.message}`)
    await softDelete(table, rows.data as { id: string; version: number }[])
  }
  const campaign = await supabase.from('campaign').select('id, version').eq('id', campaignID).single()
  if (campaign.error) throw new Error(campaign.error.message)
  await softDelete('campaign', [campaign.data as { id: string; version: number }])
}
