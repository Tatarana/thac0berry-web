import type { EncumbranceRow, LevelChangeRow, Page2EquipmentEntry, PlayerCharacter, QuantifiedItem } from '../types/library'
import { dash } from '../lib/format'
import { Cell, SectionTitle } from './SheetBits'

// Página 2 da ficha oficial (RecordSheetPageTwo do iPad): armadura,
// equipamento em duas colunas, movimento, carga, experiência, mudanças por
// nível, itens mágicos, tesouro, idiomas, aliados e talento selvagem.
// Só leitura: mostra o que está gravado.

function Armor({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section">
      <SectionTitle>Armor</SectionTitle>
      <div className="rec-lines rec-lines-4">
        <Cell label="Armor" value={dash(c.armorRating)} />
        <Cell label="Shield" value={dash(c.shieldRating)} />
        <Cell label="Dexterity" value={dash(c.details.dexterityDefense)} />
        <Cell label="Movement" value={c.movement} />
      </div>
      <p className="rec-soft">Base AC 10.</p>
    </section>
  )
}

function EquipmentColumn({ items }: { items: Page2EquipmentEntry[] }) {
  return (
    <table className="rec-table">
      <thead>
        <tr>
          <th className="rec-row-label">Item</th>
          <th>Location</th>
          <th>Wt</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td className="rec-soft" colSpan={3}>—</td>
          </tr>
        )}
        {items.map((item) => (
          <tr key={item.id}>
            <td className="rec-value rec-left">{item.item}</td>
            <td className="rec-value">{dash(item.location)}</td>
            <td className="rec-value">{dash(item.weight)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Equipment({ c }: { c: PlayerCharacter }) {
  // Coluna sem valor gravado: alterna pela posição, como o iPad faz ao migrar.
  const all = (c.page2Equipment ?? []).map((item, index) => ({ item, column: item.column ?? index % 2 }))
  const filled = all.filter(({ item }) => item.item.trim() !== '' || item.location.trim() !== '' || item.weight.trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>Equipment</SectionTitle>
      <div className="rec-columns-2">
        <EquipmentColumn items={filled.filter((e) => e.column === 0).map((e) => e.item)} />
        <EquipmentColumn items={filled.filter((e) => e.column !== 0).map((e) => e.item)} />
      </div>
      <div className="rec-lines rec-lines-3">
        <Cell label="Total Weight" value={dash(c.page2TotalWeight)} />
        <Cell label="Encumbrance" value={dash(c.page2EquipmentEncumbrance)} />
        <Cell label="Movement Rate" value={dash(c.page2MovementRate)} />
      </div>
    </section>
  )
}

function Movement({ c }: { c: PlayerCharacter }) {
  const m = c.page2Movement
  return (
    <section className="rec-section">
      <SectionTitle>Movement</SectionTitle>
      <div className="rec-lines rec-lines-3">
        <Cell label="Base" value={dash(m?.base)} />
        <Cell label="Jog (x2)" value={dash(m?.jog)} />
        <Cell label="Run (x3)" value={dash(m?.runX3)} />
        <Cell label="Run (x4)" value={dash(m?.runX4)} />
        <Cell label="Run (x5)" value={dash(m?.runX5)} />
        <Cell label="Day" value={dash(m?.day)} />
      </div>
    </section>
  )
}

function Encumbrance({ c }: { c: PlayerCharacter }) {
  const t = c.page2EncumbranceTable
  const rows: [string, EncumbranceRow | undefined][] = [
    ['Light', t?.light],
    ['Moderate', t?.moderate],
    ['Heavy', t?.heavy],
    ['Severe', t?.severe],
  ]
  return (
    <section className="rec-section">
      <SectionTitle>Encumbrance</SectionTitle>
      <table className="rec-table">
        <thead>
          <tr>
            <th />
            <th>Wt</th>
            <th>Move</th>
            <th>Atk</th>
            <th>AC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, row]) => (
            <tr key={label}>
              <td className="rec-row-label">{label}</td>
              <td className="rec-value">{dash(row?.weightCarried)}</td>
              <td className="rec-value">{dash(row?.moveRate)}</td>
              <td className="rec-value">{dash(row?.attackPenalty)}</td>
              <td className="rec-value">{dash(row?.acPenalty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Experience({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section">
      <SectionTitle>Experience</SectionTitle>
      <div className="rec-lines rec-lines-2">
        <Cell label="Total XPs" value={c.experience.toLocaleString('en-US')} />
        <Cell label="XPs Needed for Next Level" value={dash(c.xpNeededNextLevel)} />
        <Cell label="Kit Modifier" value={dash(c.xpKitModifier)} />
        <Cell label="Ability Bonus" value={dash(c.xpAbilityBonus)} />
        <Cell label="Subrace Modifier" value={dash(c.xpSubraceModifier)} />
        <Cell label="Level Limit" value={dash(c.xpLevelLimit)} />
      </div>
    </section>
  )
}

function LevelChanges({ c }: { c: PlayerCharacter }) {
  const t = c.levelChanges
  const rows: [string, LevelChangeRow | undefined][] = [
    ['THAC0', t?.thac0],
    ['Saving Throws', t?.savingThrows],
    ['Weapon Proficiencies', t?.weaponProficiencies],
    ['Non-weapon Proficiencies', t?.nonWeaponProficiencies],
  ]
  return (
    <section className="rec-section">
      <SectionTitle>Level Changes</SectionTitle>
      <table className="rec-table">
        <thead>
          <tr>
            <th />
            <th>By</th>
            <th>At Levels</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, row]) => (
            <tr key={label}>
              <td className="rec-row-label">{label}</td>
              <td className="rec-value">{dash(row?.by)}</td>
              <td className="rec-value">{dash(row?.atLevels)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function QuantityList({ title, items }: { title: string; items: QuantifiedItem[] | null | undefined }) {
  const filled = (items ?? []).filter((item) => item.name.trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>{title}</SectionTitle>
      {filled.length === 0 ? (
        <p className="rec-soft">—</p>
      ) : (
        <ul className="rec-plain-list">
          {filled.map((item) => {
            const used = item.usedCount ?? 0
            const exhausted = item.quantity > 0 && used >= item.quantity
            return (
              <li key={item.id} className={exhausted ? 'rec-exhausted' : undefined}>
                <span className="rec-value">{item.name}</span>
                <span className="rec-soft">
                  {' '}
                  · {used} of {item.quantity} used
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function TextList({ title, items }: { title: string; items: string[] }) {
  const filled = items.filter((item) => item.trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>{title}</SectionTitle>
      {filled.length === 0 ? (
        <p className="rec-soft">—</p>
      ) : (
        <ul className="rec-plain-list">
          {filled.map((item, index) => (
            <li key={index} className="rec-value">{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Treasure({ c }: { c: PlayerCharacter }) {
  const t = c.treasure
  return (
    <section className="rec-section">
      <SectionTitle>Treasure</SectionTitle>
      <div className="rec-lines rec-lines-5">
        <Cell label="PP" value={t.platinum} />
        <Cell label="GP" value={t.gold} />
        <Cell label="EP" value={t.electrum} />
        <Cell label="SP" value={t.silver} />
        <Cell label="CP" value={t.copper} />
      </div>
    </section>
  )
}

function WildTalent({ c }: { c: PlayerCharacter }) {
  const talent = c.wildTalent
  const powers = (talent?.powers ?? []).filter((p) => p.trim() !== '')
  if (!talent || (powers.length === 0 && talent.psionicStrengthPoints === 0)) return null
  return (
    <section className="rec-section">
      <SectionTitle>Wild Talent</SectionTitle>
      <p className="rec-soft">PSPs: {talent.psionicStrengthPoints}</p>
      <ul className="rec-plain-list">
        {powers.map((power, index) => (
          <li key={index} className="rec-value">{power}</li>
        ))}
      </ul>
    </section>
  )
}

export function RecordPageTwo({ character: c }: { character: PlayerCharacter }) {
  return (
    <div className="rec-sheet">
      <Armor c={c} />
      <Equipment c={c} />
      <div className="rec-two">
        <div className="rec-stack">
          <Movement c={c} />
          <Encumbrance c={c} />
        </div>
        <div className="rec-stack">
          <Experience c={c} />
          <LevelChanges c={c} />
        </div>
      </div>
      <QuantityList title="Magic Items" items={c.page2MagicItems} />
      <QuantityList title="Treasure / Other Possessions" items={c.page2TreasureItems} />
      <div className="rec-three">
        <Treasure c={c} />
        <TextList title="Languages" items={c.languages} />
        <TextList title="Allies & Henchmen" items={c.allies} />
      </div>
      <WildTalent c={c} />
    </div>
  )
}
