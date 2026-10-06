import type { PlayerCharacter } from '../types/library'
import { dash } from '../lib/format'
import { Cell, SectionTitle, TextBox } from './SheetBits'

// Página 3 da ficha oficial (CharacterDescriptionPage do iPad), na mesma
// ordem de lá: tabela de dados pessoais na largura toda; embaixo,
// Personality à esquerda e o retrato ("Character Sketch", 220 pt) à direita;
// depois Hit Points by Level e Background. Na última faixa da tabela,
// "Racial Abilities" é uma caixa alta à esquerda (q1+q2 do iPad) e
// Skin/Vision, Handedness/Class e Origin ficam à direita (q3+q4). Só leitura.

export function RecordPageThree({
  character: c,
  portraitURL,
}: {
  character: PlayerCharacter
  /** Link temporário do retrato no Storage; null = sem retrato. */
  portraitURL: string | null
}) {
  return (
    <div className="rec-sheet">
      <SectionTitle>Character Description</SectionTitle>
      <div className="rec-desc-table">
        <div className="rec-lines rec-lines-2">
          <Cell label="Character Name" value={dash(c.name)} />
          <Cell label="Player Name" value={dash(c.playerName)} />
        </div>
        <div className="rec-lines rec-lines-5">
          <Cell label="Birth Date" value={dash(c.birthDate)} />
          <Cell label="Birth Rank" value={dash(c.birthRank)} />
          <Cell label="Age" value={dash(c.age)} />
          <Cell label="Sex" value={dash(c.sex)} />
          <Cell label="Deity" value={dash(c.deity)} />
        </div>
        <div className="rec-lines rec-lines-5">
          <Cell label="Height" value={dash(c.height)} />
          <Cell label="Weight" value={dash(c.weight)} />
          <Cell label="Nationality" value={dash(c.nationality)} />
          <Cell label="Hair" value={dash(c.hair)} />
          <Cell label="Eyes" value={dash(c.eyes)} />
        </div>
        <div className="rec-desc-split">
          <TextBox label="Racial Abilities" text={c.racialAbilities} />
          <div className="rec-lines rec-lines-2">
            <Cell label="Skin" value={dash(c.skin)} />
            <Cell label="Vision" value={dash(c.vision)} />
            <Cell label="Handedness" value={dash(c.handedness)} />
            <Cell label="Class" value={c.characterClass} />
            <div className="rec-span-2">
              <Cell label="Origin" value={dash(c.placeOfOrigin)} />
            </div>
          </div>
        </div>
      </div>
      <div className="rec-desc-middle">
        <div className="rec-personality">
          <TextBox label="Personality" text={c.personality} />
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
        </figure>
      </div>
      <div className="rec-inline-field">
        <span className="rec-cell-label rec-left-label">Hit Points by Level:</span>
        <span className="rec-value">{dash(c.hitPointsByLevel)}</span>
      </div>
      <div className="rec-background">
        <TextBox label="Background / History / Noteworthy Events" text={c.backgroundHistory} />
      </div>
    </div>
  )
}
