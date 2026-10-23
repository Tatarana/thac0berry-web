import type { ReactNode } from 'react'
import { allClasses, isDualClass, isMultiClass, multiClassThiefArmorRule, referenceSections, type ReferenceSection } from '../rules/multiclass'
import { armorPenaltyRows, attackVsDefenseRows, baseByWisdom, classAwardRows, defenseModeColumns, progressionRows, recoveryRows } from '../rules/psionics'
import {
  constitutionSaveBonusApplies,
  constitutionSaveBonusRows,
  isPlanarRace,
  matchRace,
  raceAbilityRows,
  raceLevelLimits,
  raceRuleID,
  singleClassBonus,
} from '../rules/raceKit'
import { canonicalClass, proficiencyTableGroup, rulesData, thievingBaseScore, thievingSkillsFor, type CanonicalClass } from '../rules/rules'
import { RuleLink } from './RuleLink'
import type { PlayerCharacter } from '../types/library'

// Página 4 da ficha: tabelas de referência da classe (ClericReferencePage,
// WizardReferencePage, WarriorReferencePage e RogueReferencePage do iPad).
// Só consulta; a linha do personagem (nível, atributo ou grupo) fica em
// vermelho. As tabelas vêm do código Swift (rules-data, ver src/rules).
// Multiclasse (MC3b): as tabelas de cada classe, uma após a outra, cada uma
// destacando o nível da sua classe.

const T = rulesData.tables

function RefTitle({ title, ruleID }: { title: string; ruleID?: string }) {
  return (
    <h3 className="ref-title">
      {title}
      {ruleID && <RuleLink ruleID={ruleID} />}
    </h3>
  )
}

function RefTable({ title, ruleID, children, footnotes }: { title: string; ruleID?: string; children: ReactNode; footnotes?: string[] }) {
  return (
    <section className="ref-block">
      <RefTitle title={title} ruleID={ruleID} />
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

function Progression({ title, ruleID, rows, circles, level, footnotes, headers }: {
  title: string
  ruleID?: string
  rows: (number | null)[][]
  circles: number
  level: number
  footnotes?: string[]
  headers?: string[]
}) {
  return (
    <RefTable title={title} ruleID={ruleID} footnotes={footnotes}>
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

function ClericTables({ c, level, anchorite = false }: { c: PlayerCharacter; level: number; anchorite?: boolean }) {
  const levels = T['PriestTables.turningUndeadLevels']
  return (
    <>
      <Progression
        title={anchorite ? 'Anchorite Spell Progression' : 'Priest Spell Progression'}
        ruleID={anchorite ? 'dod_ch00_anchorite' : 'phb_ch03_priest_tables'}
        rows={T['PriestTables.spellProgressionRows']}
        circles={7}
        level={level}
        headers={['1', '2', '3', '4', '5', '6*', '7**']}
        footnotes={['* Usable only by priests with 17 or greater Wisdom.', '** Usable only by priests with 18 or greater Wisdom.']}
      />
      {/* O Anchorite (Domains of Dread) não expulsa mortos-vivos: o livro não dá o poder. */}
      {!anchorite && (
        <RefTable title="Turning Undead" footnotes={T['PriestTables.turningUndeadFootnotes']}>
          <thead>
            <tr>
              <th className="ref-left">Type / HD</th>
              {levels.map((l) => (
                <th key={l} className={hl(turningColumnMatches(l, level))}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {T['PriestTables.turningUndeadRows'].map((row) => (
              <tr key={row.type}>
                <td className="ref-left">{row.type}</td>
                {row.results.map((value, i) => (
                  <td key={i} className={hl(turningColumnMatches(levels[i], level))}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </RefTable>
      )}
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

function WizardTablesPage({ c, level }: { c: PlayerCharacter; level: number }) {
  const intelligence = c.abilities.intelligence
  const scores = Object.keys(T['IntelligenceTable.byScore']).map(Number).sort((a, b) => a - b)
  const cap = T['IntelligenceTable.byScore'][intelligence]?.maxSpellLevel ?? '—'
  return (
    <>
      <Progression
        title="Wizard Spell Progression"
        ruleID="phb_ch03_wizard_tables"
        rows={T['WizardTables.spellProgressionRows']}
        circles={9}
        level={level}
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

function WarriorTablesPage({ cls, multiClass }: { cls: CanonicalClass; multiClass: boolean }) {
  const group = proficiencyTableGroup(cls)
  const isFighter = cls === 'Fighter'
  const spec: [string, string][] = [
    [
      'Who',
      multiClass
        ? 'Single-class fighters only — a multi-class character cannot specialize (PHB, Chapter 5).'
        : isFighter
          ? 'Your class (Fighter) — eligible.'
          : 'Fighters only — never Paladins or Rangers, even though they share this page.',
    ],
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
        ruleID="phb_ch05_proficiencies"
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
        <RefTitle title="Weapon Specialization" ruleID="cfh_ch04_weapon_proficiency_slots" />
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

function RogueTablesPage({ cls, level, multiClass }: { cls: CanonicalClass; level: number; multiClass: boolean }) {
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
      <RefTable title="Thieving Skills — Base Score" ruleID={isNinja ? 'cnh_ch01_the_ninja_class' : 'phb_ch03_rogue_tables'} footnotes={baseNotes}>
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
        ruleID={isNinja ? 'cnh_ch01_the_ninja_class' : 'phb_ch03_rogue_tables'}
        footnotes={[
          "Not folded into the seeded % on the Sheet page — the app only stores your AC number, not the armor TYPE, so there's no reliable way to pick the right column automatically. Apply it by hand.",
          ...(multiClass ? [multiClassThiefArmorRule] : []),
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
          ruleID="phb_ch03_rogue_tables"
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
              const on = level >= lower && level <= upper
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
          ruleID="phb_ch03_rogue_tables"
          rows={T['BardTables.spellProgressionRows']}
          circles={6}
          level={level}
          footnotes={[
            'Bards learn wizard spells by chance, not free choice, and never gain new ones automatically on level-up — see the Bard description (PHB ch. 3) for how spells are found. Add what your character finds in play to “My Spellbook” (menu ☰) by hand — same manual grimoire as the Mage, no dice roll simulated.',
            'This table already drives your actual spell slots — see the Sheet page and “My Spellbook.”',
          ]}
        />
      )}
    </>
  )
}

// --- Psionicist (Complete Psionics Handbook, caps. 1 e 2) ------------------------------

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

function PsionicistTables({ c, level }: { c: PlayerCharacter; level: number }) {
  const row = Math.max(1, Math.min(level, 20))
  const wisdom = c.abilities.wisdom
  const known = new Set(c.psionics?.defenseModes ?? [])
  return (
    <>
      <RefTable title="Table 4: Psionic Power Progression" ruleID="cpsih_ch01_advancement" footnotes={level > 20 ? ['Above 20th level, the 20th-level line applies.'] : undefined}>
        <thead>
          <tr>
            <th>Lvl</th>
            <th>Disciplines</th>
            <th>Sciences</th>
            <th>Devotions</th>
            <th>Defense Modes</th>
          </tr>
        </thead>
        <tbody>
          {progressionRows.map((values, offset) => (
            <tr key={offset}>
              <td className={hl(offset + 1 === row)}>{offset + 1}</td>
              {values.map((v, i) => (
                <td key={i} className={hl(offset + 1 === row)}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable
        title="Table 5: Inherent Potential"
        ruleID="cpsih_ch01_psionic_strength_points"
        footnotes={['1st level: the base score for Wisdom, plus the modifiers for Intelligence and Constitution.', 'Each new level: 10 + the Wisdom modifier.']}
      >
        <thead>
          <tr>
            <th>Ability Score</th>
            <th>Base Score</th>
            <th>Ability Modifier</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(baseByWisdom).map(([score, base], i) => (
            <tr key={score}>
              <td className={hl(Number(score) === wisdom)}>{score}</td>
              <td className={hl(Number(score) === wisdom)}>{base}</td>
              <td className={hl(Number(score) === wisdom)}>{i === 0 ? '0' : signed(i)}</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable
        title="Table 6: Psionic Strength Recovery"
        ruleID="cpsih_ch01_psionic_strength_points"
        footnotes={[
          '* "Hard exertion" includes fighting, running, digging, walking while encumbered, climbing, exploring a dungeon, swimming, and any other activity the DM wants to include.',
          "** Use of the psionicist's Rejuvenation proficiency.",
        ]}
      >
        <thead>
          <tr>
            <th className="ref-left">Physical Activity</th>
            <th>PSPs Recovered</th>
          </tr>
        </thead>
        <tbody>
          {recoveryRows.map(([activity, rate]) => (
            <tr key={activity}>
              <td className="ref-left">{activity}</td>
              <td>{rate}</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable title="Table 14: Attack vs. Defense Modes" ruleID="cpsih_ch02_telepathic_combat" footnotes={["Modifier to the attacker's power score. Your defense modes are highlighted."]}>
        <thead>
          <tr>
            <th className="ref-left">Attack</th>
            {defenseModeColumns.map((mode) => (
              <th key={mode} className={hl(known.has(mode))}>
                {mode}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attackVsDefenseRows.map(([attack, values]) => (
            <tr key={attack}>
              <td className="ref-left">{attack}</td>
              {values.map((v, i) => (
                <td key={i} className={hl(known.has(defenseModeColumns[i]))}>
                  {signed(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable title="Table 9: Psionicist Armor Penalties" ruleID="cpsih_ch01_restrictions">
        <thead>
          <tr>
            <th className="ref-left">Armor</th>
            <th>Power Score</th>
          </tr>
        </thead>
        <tbody>
          {armorPenaltyRows.map(([armor, penalty]) => (
            <tr key={armor}>
              <td className="ref-left">{armor}</td>
              <td>{penalty === 0 ? '0' : signed(penalty)}</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
      <RefTable title="Table 3: Individual Class Awards" ruleID="cpsih_ch01_advancement">
        <tbody>
          {classAwardRows.map(([award, xp]) => (
            <tr key={award}>
              <td className="ref-left">{award}</td>
              <td>{xp}</td>
            </tr>
          ))}
        </tbody>
      </RefTable>
    </>
  )
}

// --- Raça (PHB cap. 2, DMG Tabela 7, PWH, DoD; CPsiH Tabela 1) -------------------------

/** Tabelas da raça escolhida, em toda ficha com página 4. Raça fora da lista (texto livre): sem seção. */
function RaceTables({ c }: { c: PlayerCharacter }) {
  const race = matchRace(c.race)
  if (!race) return null
  const abilities = raceAbilityRows(race)
  const limits = raceLevelLimits(race)
  const hasAbilityRules = abilities.some((a) => a.range !== null || a.adjustment !== 0)
  const mine = new Set<string>(allClasses(c).map((k) => canonicalClass(k.characterClass)))
  const extra = singleClassBonus[race]
  const conApplies = constitutionSaveBonusApplies(race)
  const con = c.abilities.constitution
  return (
    <div className="ref-section ref-race">
      <h2 className="rec-title ref-section-title">Race — {race}</h2>
      {hasAbilityRules ? (
        <RefTable title="Ability Requirements and Adjustments" ruleID={raceRuleID(race)} footnotes={['The adjustments were added to the scores on the Sheet page when the race was chosen.']}>
          <thead>
            <tr>
              <th className="ref-left">Ability</th>
              <th>Min–Max</th>
              <th>Adjustment</th>
            </tr>
          </thead>
          <tbody>
            {abilities.map((a) => (
              <tr key={a.ability}>
                <td className="ref-left">{a.ability}</td>
                <td>{a.range ?? '—'}</td>
                <td className={hl(a.adjustment !== 0)}>{a.adjustment === 0 ? '—' : signed(a.adjustment)}</td>
              </tr>
            ))}
          </tbody>
        </RefTable>
      ) : (
        <p className="rec-soft">No ability requirements or adjustments for this race.</p>
      )}
      {limits.length > 0 ? (
        <RefTable
          title="Class Level Limits"
          ruleID={isPlanarRace(race) ? 'pwh_ch00_racial_tables' : 'dmg_ch02_racial_level_restrictions'}
          footnotes={[
            'Classes not listed are not open to this race.',
            ...(limits.some((l) => l.characterClass === 'Psionicist') ? ['Psionicist: CPsiH Table 1.'] : []),
            ...(extra ? [`A single-classed ${race} may rise ${extra} levels above the limit.`] : []),
          ]}
        >
          <thead>
            <tr>
              <th className="ref-left">Class</th>
              <th>Max Level</th>
            </tr>
          </thead>
          <tbody>
            {limits.map((l) => (
              <tr key={l.characterClass}>
                <td className={hl(mine.has(l.characterClass), true)}>{l.characterClass}</td>
                <td className={hl(mine.has(l.characterClass))}>{l.limit === 'unlimited' ? 'Unlimited' : l.limit}</td>
              </tr>
            ))}
          </tbody>
        </RefTable>
      ) : (
        <p className="rec-soft">No class level limits for this race.</p>
      )}
      {conApplies && (
        <RefTable title="PHB Table 9: Constitution Saving Throw Bonuses" ruleID="phb_ch02_character_race_tables" footnotes={[conApplies]}>
          <thead>
            <tr>
              <th>Constitution</th>
              <th>Bonus</th>
            </tr>
          </thead>
          <tbody>
            {constitutionSaveBonusRows.map(({ range: [low, high], bonus }) => (
              <tr key={low}>
                <td className={hl(con >= low && con <= high)}>
                  {low}–{high}
                </td>
                <td className={hl(con >= low && con <= high)}>+{bonus}</td>
              </tr>
            ))}
          </tbody>
        </RefTable>
      )}
    </div>
  )
}

function Section({ c, section, multiClass }: { c: PlayerCharacter; section: ReferenceSection; multiClass: boolean }) {
  return (
    <>
      {section.kind === 'Wizard' && <WizardTablesPage c={c} level={section.level} />}
      {section.kind === 'Warrior' && <WarriorTablesPage cls={section.characterClass} multiClass={multiClass} />}
      {section.kind === 'Rogue' && <RogueTablesPage cls={section.characterClass} level={section.level} multiClass={multiClass} />}
      {section.kind === 'Cleric' && <ClericTables c={c} level={section.level} anchorite={section.characterClass === 'Anchorite'} />}
      {section.kind === 'Psionicist' && <PsionicistTables c={c} level={section.level} />}
    </>
  )
}

/**
 * Mesma escolha do iPad: Mago, grupo Guerreiro, grupo Ladino; o resto
 * (Clérigo), as do Clérigo. Multiclasse: uma seção por classe, na ordem delas.
 */
export function RecordPageFour({ character: c }: { character: PlayerCharacter }) {
  const sections = referenceSections(c)
  const multi = isMultiClass(c)
  // Classe dupla (MC4): as tabelas das classes anteriores também (uma seção por tipo).
  if ((!multi && !isDualClass(c)) || sections.length === 1) {
    const section = sections[0]
    if (!section) return null
    return (
      <div className="rec-sheet">
        {/* O Anchorite usa as tabelas do Clérigo, mas o título fala da classe dele. */}
        <h2 className="rec-title">{section.characterClass === 'Anchorite' ? 'Anchorite' : section.kind} Reference Tables</h2>
        <Section c={c} section={section} multiClass={multi} />
        <RaceTables c={c} />
      </div>
    )
  }
  return (
    <div className="rec-sheet">
      <h2 className="rec-title">Reference Tables</h2>
      {sections.map((section) => (
        <div key={section.kind} className="ref-section">
          <h2 className="rec-title ref-section-title">
            {section.kind} — {section.characterClass} level {section.level}
          </h2>
          <Section c={c} section={section} multiClass={multi} />
        </div>
      ))}
      <RaceTables c={c} />
    </div>
  )
}
