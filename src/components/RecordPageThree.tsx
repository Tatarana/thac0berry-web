import { useRef, useState } from 'react'
import type { PlayerCharacter } from '../types/library'
import { dash } from '../lib/format'
import { classLabel, isMultiClass } from '../rules/multiclass'
import type { Edit } from './RecordSheet'
import { Cell, InkInput, SectionTitle, TextBox } from './SheetBits'

// Página 3 da ficha oficial (CharacterDescriptionPage do iPad), na mesma
// ordem de lá: tabela de dados pessoais na largura toda; embaixo,
// Personality à esquerda e o retrato ("Character Sketch", 220 pt) à direita;
// depois Hit Points by Level e Background. Na última faixa da tabela,
// "Racial Abilities" é uma caixa alta à esquerda (q1+q2 do iPad) e
// Skin/Vision, Handedness/Class e Origin ficam à direita (q3+q4).
// Com `edit`, tudo é editável menos a classe (texto livre, sem regra).

type RequiredText = 'name' | 'playerName' | 'age' | 'sex' | 'deity' | 'height' | 'weight' | 'hair' | 'eyes'
type OptionalText =
  | 'birthDate' | 'birthRank' | 'nationality' | 'skin' | 'vision' | 'handedness' | 'placeOfOrigin'
  | 'racialAbilities' | 'personality' | 'hitPointsByLevel' | 'backgroundHistory'

export function RecordPageThree({
  character: c,
  portraitURL,
  edit,
  onPortrait,
}: {
  character: PlayerCharacter
  /** Link temporário do retrato no Storage; null = sem retrato. */
  portraitURL: string | null
  edit?: Edit
  /** Trocar o retrato (arquivo de imagem) ou tirar (null). */
  onPortrait?: (file: File | null) => Promise<void>
}) {
  const picker = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const portrait = async (file: File | null) => {
    if (!onPortrait) return
    setSending(true)
    try {
      await onPortrait(file)
    } finally {
      setSending(false)
    }
  }
  // Campos obrigatórios no iPad guardam "" quando vazios; os opcionais voltam a nil.
  const field = (label: string, key: RequiredText | OptionalText) =>
    edit ? (
      <Cell label={label} value={c[key] ?? ''} onChange={(v) => edit((x) => void ((x as unknown as Record<string, string | null>)[key] = v === '' && isOptional(key) ? null : v))} />
    ) : (
      <Cell label={label} value={dash(c[key])} />
    )
  const long = (key: OptionalText) =>
    edit ? (v: string) => edit((x) => void ((x as unknown as Record<string, string | null>)[key] = v === '' ? null : v)) : undefined
  return (
    <div className="rec-sheet">
      <SectionTitle>Character Description</SectionTitle>
      <div className="rec-desc-table">
        <div className="rec-lines rec-lines-2">
          {field('Character Name', 'name')}
          {field('Player Name', 'playerName')}
        </div>
        <div className="rec-lines rec-lines-5">
          {field('Birth Date', 'birthDate')}
          {field('Birth Rank', 'birthRank')}
          {field('Age', 'age')}
          {field('Sex', 'sex')}
          {field('Deity', 'deity')}
        </div>
        <div className="rec-lines rec-lines-5">
          {field('Height', 'height')}
          {field('Weight', 'weight')}
          {field('Nationality', 'nationality')}
          {field('Hair', 'hair')}
          {field('Eyes', 'eyes')}
        </div>
        <div className="rec-desc-split">
          <TextBox label="Racial Abilities" text={c.racialAbilities} onChange={long('racialAbilities')} />
          <div className="rec-lines rec-lines-2">
            {field('Skin', 'skin')}
            {field('Vision', 'vision')}
            {field('Handedness', 'handedness')}
            <Cell label="Class" value={isMultiClass(c) ? classLabel(c) : c.characterClass} />
            <div className="rec-span-2">
              {field('Origin', 'placeOfOrigin')}
            </div>
          </div>
        </div>
      </div>
      <div className="rec-desc-middle">
        <div className="rec-personality">
          <TextBox label="Personality" text={c.personality} onChange={long('personality')} />
        </div>
        <figure className="rec-sketch">
          <span className="rec-cell-label">Character Sketch</span>
          <div className="rec-sketch-frame">
            {portraitURL ? (
              <img src={portraitURL} alt={`Portrait of ${c.name || 'the character'}`} />
            ) : (
              <span className="rec-soft">No portrait</span>
            )}
          </div>
          {edit && onPortrait && (
            <div className="rec-sketch-actions">
              <input
                ref={picker}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  e.target.value = ''
                  if (file) void portrait(file)
                }}
              />
              {sending ? (
                <span className="paper-soft">Saving the picture…</span>
              ) : (
                <>
                  <button className="paper-link" onClick={() => picker.current?.click()}>
                    {portraitURL ? 'change picture' : 'choose picture'}
                  </button>
                  {portraitURL && (
                    <button className="paper-link" onClick={() => void portrait(null)}>
                      remove
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </figure>
      </div>
      <div className="rec-inline-field">
        <span className="rec-cell-label rec-left-label">Hit Points by Level:</span>
        {edit ? (
          <InkInput value={c.hitPointsByLevel} label="Hit Points by Level" onChange={(v) => edit((x) => void (x.hitPointsByLevel = v === '' ? null : v))} />
        ) : (
          <span className="rec-value">{dash(c.hitPointsByLevel)}</span>
        )}
      </div>
      <div className="rec-background">
        <TextBox label="Background / History / Noteworthy Events" text={c.backgroundHistory} onChange={long('backgroundHistory')} />
      </div>
    </div>
  )
}

const optionalKeys = new Set<string>([
  'birthDate', 'birthRank', 'nationality', 'skin', 'vision', 'handedness', 'placeOfOrigin',
  'racialAbilities', 'personality', 'hitPointsByLevel', 'backgroundHistory',
])
const isOptional = (key: string) => optionalKeys.has(key)
