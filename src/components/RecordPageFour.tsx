import type { ReactNode } from 'react'
import { canonicalClass, classGroup, proficiencyTableGroup, rulesData, thievingBaseScore, thievingSkillsFor } from '../rules/rules'
import type { PlayerCharacter } from '../types/library'

// Página 4 da ficha: tabelas de referência da classe (ClericReferencePage,
// WizardReferencePage, WarriorReferencePage e RogueReferencePage do iPad).
// Só consulta; a linha do personagem (nível, atributo ou grupo) fica em
// vermelho. As tabelas vêm do código Swift (rules-data, ver src/rules).

const T = rulesData.tables

function RefTable({ title, children, footnotes }: { title: string; children: ReactNode; footnotes?: string[] }) {
  return (
    <section className="ref-block">
      <h3 className="ref-title">{title}</h3>
      <div className="rec-scroll">
        <table className="ref-table">{children}</table>
      </div>
      {footnotes && footnotes.length > 0 && (
        <div className="ref-notes">
          {footnotes.map((line) => (
            <p key={line} className="rec-soft">{line}</p>
          ))}
        </div>
      )}
    </section>
  )
}

const hl = (on: boolean, left = false) => [on ? 'ref-hl' : '', left ? 'ref-left' : ''].filter(Boolean).join(' ') || undefined
const cell = (v: number | null) => (v === null ? '—' : String(v))

function Progression({ title, rows, circles, level, footnotes, headers }: {
  title: string
  rows: (number | null)[][]
  circles: number
  level: number
  footnotes?: string[]
  headers?: string[]
}) {
  return (
    <RefTable title={title} footnotes={footnotes}>
      <thead>
        <tr>
          <th>Lvl</th>
          {Array.from({ length: circles }, (_, i) => (
            <th key={i}>{headers?.[i] ?? i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, offset) => (
          <tr key={offset}>
            <td className={hl(offset + 1 === level)}>{offset + 1}</td>
            {Array.from({ length: circles }, (_, i) => (
              <td key={i} className={hl(offset + 1 === level)}>{cell(row[i] ?? null)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </RefTable>
  )
}

// --- Clérigo ---------------------------------------------------------------------

function turningColumnMatches(column: string, level: number): boolean {
  if (/^\d+$/.test(column)) return Number(column) === level
  if (column.endsWith('+')) return level >= Number(column.slice(0, -1))
  const [a, b] = column.split('-').map(Number)
  return Number.isFinite(a) && Number.isFinite(b) && level >= a && level <= b
}

function ClericTables({ c }: { c: PlayerCharacter }) {
  const levels = T['PriestTables.turningUndeadLevels']
  return (
    <>
      <Progression
        title="Priest Spell Progression"
        rows={T['PriestTables.spellProgressionRows']}
        circles={7}
        level={c.level}
        headers={['1', '2', '3', '4', '5', '6*', '7**']}
        footnotes={['* Usable only by priests with 17 or greater Wisdom.', '** Usable only by priests with 18 or greater Wisdom.']}
      />
      <RefTable title="Turning Undead" footnotes={T['PriestTables.turningUndeadFootnotes']}>
        <thead>
          <tr>
            <th className="ref-left">Type / HD</th>
            {levels.map((l) => (
              <th key={l} className={hl(turningColumnMatches(l, c.level))}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {T['PriestTables.turningUndeadRows'].map((row) => (
            <tr key={row.type}>
              <td className="ref-left">{row.type}</td>
              {row.results.map((value, i) => (
                <td key={i} className={hl(turningColumnMatches(levels[i], c.level))}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable title="Wisdom">
        <thead>
          <tr>
            <th>Score</th>
            <th>Mag. Defense</th>
            <th>Bonus Spells</th>
            <th>Spell Failure</th>
            <th className="ref-left">Spell Immunity</th>
          </tr>
        </thead>
        <tbody>
          {T['PriestTables.wisdomRows'].map((row) => {
            const on = row.score === c.abilities.wisdom
            return (
              <tr key={row.score}>
                <td className={hl(on)}>{row.score}</td>
                <td className={hl(on)}>{row.magDef}</td>
                <td className={hl(on)}>{row.bonus}</td>
                <td className={hl(on)}>{row.failure}</td>
                <td className={hl(on, true)}>{row.immunity}</td>
              </tr>
            )
          })}
        </tbody>
      </RefTable>
    </>
  )
}

// --- Mago --------------------------------------------------------------------------

function WizardTablesPage({ c }: { c: PlayerCharacter }) {
  const intelligence = c.abilities.intelligence
  const scores = Object.keys(T['IntelligenceTable.byScore']).map(Number).sort((a, b) => a - b)
  const cap = T['IntelligenceTable.byScore'][intelligence]?.maxSpellLevel ?? '—'
  return (
    <>
      <Progression
        title="Wizard Spell Progression"
        rows={T['WizardTables.spellProgressionRows']}
        circles={9}
        level={c.level}
        footnotes={[
          `A wizard can never learn or cast a spell of a circle higher than Intelligence allows — see the Intelligence table below ("Max Spell Level", currently ${cap} for Intelligence ${intelligence}).`,
        ]}
      />
      <RefTable title="Intelligence" footnotes={['Minimum Intelligence to be a wizard: 9.']}>
        <thead>
          <tr>
            <th>Score</th>
            <th>Languages</th>
            <th>Max Spell Level</th>
            <th>Learn Spell %</th>
            <th>Max Spells per Level</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => {
            const row = T['IntelligenceTable.byScore'][score]
            const on = score === intelligence
            return (
              <tr key={score}>
                <td className={hl(on)}>{score}</td>
                <td className={hl(on)}>{row.languages}</td>
                <td className={hl(on)}>{row.maxSpellLevel}</td>
                <td className={hl(on)}>{row.learnChance}</td>
                <td className={hl(on)}>{row.maxSpellsPerLevel}</td>
              </tr>
            )
          })}
        </tbody>
      </RefTable>
    </>
  )
}

// --- Guerreiro -------------------------------------------------------------------------

function WarriorTablesPage({ c }: { c: PlayerCharacter }) {
  const group = proficiencyTableGroup(c.characterClass)
  const isFighter = canonicalClass(c.characterClass) === 'Fighter'
  const spec: [string, string][] = [
    ['Who', isFighter ? 'Your class (Fighter) — eligible.' : 'Fighters only — never Paladins or Rangers, even though they share this page.'],
    ['Melee', '1 extra proficiency slot → +1 to hit, +2 damage.'],
    [
      'Bow / crossbow',
      '2 extra slots → no damage bonus; instead, a "point-blank" range (crossbow 6–30ft, bow 6–60ft) with +2 to hit inside it, and the weapon can fire before initiative is rolled if it\'s ready and a target is in sight.',
    ],
    ['Limit', 'Only one specialization at character creation — more later, as new slots are gained.'],
  ]
  return (
    <>
      <RefTable
        title="Proficiency Slots (Table 34)"
        footnotes={[
          '"Group" bundles the 8 classes into the 4 archetypes the table uses — Paladin/Ranger read the Fighter row, Druid reads Cleric, Bard reads Thief.',
          "Related weapon (same family, e.g. long sword/broad sword): penalty is halved, rounded up — a Fighter's -2 becomes -1, a Wizard's -5 becomes -3.",
        ]}
      >
        <thead>
          <tr>
            <th className="ref-left">Group</th>
            <th>Initial (Weapon)</th>
            <th>+1 every (levels)</th>
            <th>Non-prof. penalty</th>
            <th>Initial (Nonweapon)</th>
            <th>+1 every (levels)</th>
          </tr>
        </thead>
        <tbody>
          {T['ProficiencySlotsTable.rows'].map((row) => {
            const on = row.group === group
            return (
              <tr key={row.group}>
                <td className={hl(on, true)}>{row.group}</td>
                <td className={hl(on)}>{row.initialWeapon}</td>
                <td className={hl(on)}>{row.levelsWeapon}</td>
                <td className={hl(on)}>{row.penalty}</td>
                <td className={hl(on)}>{row.initialNonweapon}</td>
                <td className={hl(on)}>{row.levelsNonweapon}</td>
              </tr>
            )
          })}
        </tbody>
      </RefTable>
      <section className="ref-block">
        <h3 className="ref-title">Weapon Specialization</h3>
        <dl className="ref-spec">
          {spec.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

// --- Ladino (Thief, Bard, Ninja) ----------------------------------------------------------

const backstabRows: [string, string, number, number][] = [
  ['1-4', 'x2', 1, 4],
  ['5-8', 'x3', 5, 8],
  ['9-12', 'x4', 9, 12],
  ['13+', 'x5', 13, 999],
]

function RogueTablesPage({ c }: { c: PlayerCharacter }) {
  const cls = canonicalClass(c.characterClass)
  const skills = thievingSkillsFor(cls)
  const isNinja = cls === 'Ninja'
  const columns = isNinja ? T['ThievingSkillsTable.ninjaArmorColumns'] : T['ThievingSkillsTable.thiefArmorColumns']
  const armor = isNinja ? T['ThievingSkillsTable.ninjaArmorAdjustments'] : T['ThievingSkillsTable.thiefArmorAdjustments']
  const baseNotes =
    cls === 'Ninja'
      ? [
          "Base scores are the Ninja's own (Table 2, Complete Ninja's Handbook) — different from the Thief's Table 26, not a variant of it.",
          "Race adjustment only for Dwarf/Halfling (the only demihumans allowed as ninja) — same numbers as the Thief's Table 27.",
          "Dexterity adjustment reuses the Thief's Table 28 — the Ninja's own Table 3 explicitly reproduces it.",
        ]
      : cls === 'Bard'
        ? ["Table 33 gives one flat base per ability, not a per-race table — apply the Thief's race/Dexterity adjustments (Table 27/28) on top, per the Bard description."]
        : ['Race adjustment: Table 27. Dexterity adjustment: Table 28. Both already folded into the seeded value on the Sheet page.']
  return (
    <>
      <RefTable title="Thieving Skills — Base Score" footnotes={baseNotes}>
        <thead>
          <tr>
            <th className="ref-left">Skill</th>
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill}>
              <td className="ref-left">{skill}</td>
              <td>{thievingBaseScore(skill, cls)}%</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable
        title="Armor Adjustment"
        footnotes={[
          "Not folded into the seeded % on the Sheet page — the app only stores your AC number, not the armor TYPE, so there's no reliable way to pick the right column automatically. Apply it by hand.",
        ]}
      >
        <thead>
          <tr>
            <th className="ref-left">Skill</th>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill}>
              <td className="ref-left">{skill}</td>
              {(armor[skill] ?? []).map((value, i) => (
                <td key={i}>{value === 0 ? '—' : `${value > 0 ? '+' : ''}${value}%`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </RefTable>
      {(cls === 'Thief' || cls === 'Ninja') && (
        <RefTable
          title="Backstab Damage Multiplier"
          footnotes={['Backstab requires surprise/being unseen — a successful attack from behind gets +4 to hit and this damage multiplier.']}
        >
          <thead>
            <tr>
              <th>Level</th>
              <th>Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {backstabRows.map(([range, multiplier, lower, upper]) => {
              const on = c.level >= lower && c.level <= upper
              return (
                <tr key={range}>
                  <td className={hl(on)}>{range}</td>
                  <td className={hl(on)}>{multiplier}</td>
                </tr>
              )
            })}
          </tbody>
        </RefTable>
      )}
      {cls === 'Bard' && (
        <Progression
          title="Bard Spell Progression"
          rows={T['BardTables.spellProgressionRows']}
          circles={6}
          level={c.level}
          footnotes={[
            'Bards learn wizard spells by chance, not free choice, and never gain new ones automatically on level-up — see the Bard description (PHB ch. 3) for how spells are found. Add what your character finds in play to “My Spellbook” (menu ☰) by hand — same manual grimoire as the Mage, no dice roll simulated.',
            'This table already drives your actual spell slots — see the Sheet page and “My Spellbook.”',
          ]}
        />
      )}
    </>
  )
}

/** Mesma escolha do iPad: Mago, grupo Guerreiro, grupo Ladino; o resto (Clérigo), as do Clérigo. */
export function RecordPageFour({ character: c }: { character: PlayerCharacter }) {
  const cls = canonicalClass(c.characterClass)
  const group = classGroup(cls)
  const kind = cls === 'Mage' ? 'Wizard' : group === 'Warrior' ? 'Warrior' : group === 'Rogue' ? 'Rogue' : 'Cleric'
  return (
    <div className="rec-sheet">
      <h2 className="rec-title">{kind} Reference Tables</h2>
      {kind === 'Wizard' && <WizardTablesPage c={c} />}
      {kind === 'Warrior' && <WarriorTablesPage c={c} />}
      {kind === 'Rogue' && <RogueTablesPage c={c} />}
      {kind === 'Cleric' && <ClericTables c={c} />}
    </div>
  )
}
