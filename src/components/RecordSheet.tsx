import type { ReactNode } from 'react'
import type { EquipmentItem, PlayerCharacter, SavingThrows } from '../types/library'

// Página 1 da ficha oficial (OfficialRecordSheet do iPad, a partir do PDF
// MI_ADDCharSheet46): cabeçalho, atributos, jogadas de proteção, combate,
// tabela "Target's AC", modificadores, armas, proficiências e perícias de
// ladrão. Só leitura (W2.2): mostra o que está gravado na ficha, sem
// recalcular regra nenhuma. As exceções são contas de exibição que o iPad
// também faz na tela, sem gravar: total do save (base − mod) e a tabela
// "Target's AC" (THAC0 − CA, ou o valor ajustado à mão).

const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value)

function Cell({ label, value, wide }: { label?: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'rec-cell rec-cell-wide' : 'rec-cell'}>
      {label && <span className="rec-cell-label">{label}</span>}
      <span className="rec-value">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="rec-title">{children}</h2>
}

function HeaderLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rec-header-line">
      <span className="rec-value rec-header-value">{children}</span>
      <span className="rec-cell-label">{label}</span>
    </div>
  )
}

// --- Cabeçalho -------------------------------------------------------------

function RecordHeader({ c, campaignName }: { c: PlayerCharacter; campaignName: string | null }) {
  const spheres = Object.entries(c.sphereAccess ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sphere, level]) => `${sphere}${level === 'minor' ? ' (minor)' : ''}`)
  return (
    <header className="rec-header">
      <div className="rec-header-fields">
        <HeaderLine label="Character">
          <span className="rec-name">{c.name || 'Unnamed Character'}</span>
        </HeaderLine>
        <div className="rec-header-row">
          <HeaderLine label="Class / Kit">
            {c.characterClass}
            {c.kit ? ` / ${c.kit}` : ''}
          </HeaderLine>
          <HeaderLine label="Level">{c.level}</HeaderLine>
        </div>
        {spheres.length > 0 && <HeaderLine label="Spheres">{spheres.join(', ')}</HeaderLine>}
        <div className="rec-header-row">
          <HeaderLine label="Race">{dash(c.race)}</HeaderLine>
          <HeaderLine label="Alignment">{dash(c.alignment)}</HeaderLine>
        </div>
        <div className="rec-header-row">
          <HeaderLine label="Patron Deity / Religion">{dash(c.deity)}</HeaderLine>
          <HeaderLine label="Place of Origin">{dash(c.placeOfOrigin)}</HeaderLine>
        </div>
      </div>
      <div className="rec-header-brand">
        <span>Advanced Dungeons &amp; Dragons</span>
        <span>2nd Edition</span>
        <span className="rec-brand-big">Player Character Record</span>
        <span className="rec-brand-meta">
          {c.playerName ? `Player: ${c.playerName}` : ''}
          {campaignName ? `${c.playerName ? ' · ' : ''}${campaignName}` : ''}
        </span>
        {c.status !== 'alive' && <span className="rec-status">{c.status === 'dead' ? 'Dead' : 'Archived'}</span>}
      </div>
    </header>
  )
}

// --- Atributos -------------------------------------------------------------

function AbilityScores({ c }: { c: PlayerCharacter }) {
  const d = c.details
  const strength =
    c.abilities.exceptionalStrength != null && c.abilities.strength === 18
      ? `18/${String(c.abilities.exceptionalStrength).padStart(2, '0')}`
      : String(c.abilities.strength)
  const rows: [string, string | number, [string, string | null | undefined][]][] = [
    ['STR', strength, [
      ['Hit Adj', d.strengthHit],
      ['Dmg Adj', d.strengthDamage],
      ['Weight Allow', d.strengthWeight],
      ['Max Press', d.strengthMaxPress],
      ['Open Doors', d.strengthDoors],
      ['Bend Bars', d.strengthBars],
    ]],
    ['DEX', c.abilities.dexterity, [
      ['Surprise Adjustment', d.dexterityReaction],
      ['Missile Att Adjustment', d.dexterityMissile],
      ['Defensive Adjustment', d.dexterityDefense],
    ]],
    ['CON', c.abilities.constitution, [
      ['HP Adj', d.constitutionHP],
      ['System Shock', d.constitutionShock],
      ['Resurrect Survival', d.constitutionResurrection],
      ['Poison Save', d.constitutionPoison],
      ['Regen', d.constitutionRegen],
    ]],
    ['INT', c.abilities.intelligence, [
      ['Languages', d.intelligenceLanguages],
      ['Spell Level', d.intelligenceMaxLevel],
      ['Learn Spell', d.intelligenceLearn],
      ['Max/ Level', d.intelligenceMaxPerLevel],
      ['Spell Immun', d.intelligenceSpellImmunity],
    ]],
    ['WIS', c.abilities.wisdom, [
      ['Magical Def Adj', d.wisdomDefense],
      ['Bonus Spells', d.wisdomBonusSpells],
      ['Spell Failure', d.wisdomFailure],
      ['Spell Immun', d.wisdomSpellImmunity],
    ]],
    ['CHA', c.abilities.charisma, [
      ['Max # of Henchmen', d.charismaHenchmen],
      ['Loyalty Base', d.charismaLoyalty],
      ['Reaction Adjustment', d.charismaReaction],
    ]],
  ]
  return (
    <section className="rec-section rec-abilities">
      <SectionTitle>Ability Scores</SectionTitle>
      <div className="rec-box">
        {rows.map(([name, score, cells]) => (
          <div key={name} className="rec-ability-row">
            <span className="rec-ability-name">{name}</span>
            <span className="rec-ability-score rec-value">{score}</span>
            <div className="rec-ability-cells">
              {cells.map(([label, value]) => (
                <Cell key={label} label={label} value={dash(value)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// --- Jogadas de proteção ---------------------------------------------------

const saveRows: [string, string, keyof SavingThrows][] = [
  ['ppd', 'Paralyzation / Poison / Death', 'paralyzationPoisonDeath'],
  ['rsw', 'Rod / Staff / Wand', 'rodStaffWand'],
  ['pp', 'Petrification / Polymorph', 'petrificationPolymorph'],
  ['bw', 'Breath Weapon', 'breathWeapon'],
  ['sp', 'Spell', 'spell'],
]

function SavingThrowsBlock({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section rec-saves">
      <SectionTitle>Saving Throws</SectionTitle>
      <table className="rec-table">
        <thead>
          <tr>
            <th />
            <th>Start</th>
            <th>Mod</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {saveRows.map(([id, label, key]) => {
            const base = c.saves[key] as number
            const mod = c.saves.modifiers?.[id] ?? 0
            return (
              <tr key={id}>
                <td className="rec-row-label">{label}</td>
                <td className="rec-value">{base}</td>
                <td className="rec-value">{mod === 0 ? '0' : mod}</td>
                <td className="rec-value rec-strong">{base - mod}</td>
              </tr>
            )
          })}
          <tr>
            <td className="rec-row-label">Spell Resistance</td>
            <td className="rec-value" colSpan={3}>{dash(c.saves.spellResistance)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}

// --- Combate ---------------------------------------------------------------

function Combat({ c }: { c: PlayerCharacter }) {
  const k = c.combat ?? {}
  const wounds = (k.wounds ?? '').split('\n').filter((w) => w.trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>Combat</SectionTitle>
      <div className="rec-combat">
        <div className="rec-shield">
          <span>ARMOR</span>
          <span className="rec-shield-shape">
            <span className="rec-value">{c.armorClass}</span>
          </span>
          <span>CLASS</span>
        </div>
        <div className="rec-lines">
          <Cell label="Surprised AC" value={dash(k.surprisedAC)} />
          <Cell label="Shieldless AC" value={dash(k.shieldlessAC)} />
          <Cell label="Rear AC" value={dash(k.rearAC)} />
          <Cell label="Type Worn" value={dash(k.typeWorn)} />
          <Cell label="Dex Checks" value={dash(k.dexChecks)} />
          <Cell label="Vision Checks" value={dash(k.visionChecks)} />
          <Cell label="Hearing Checks" value={dash(k.hearingChecks)} />
        </div>
        <div className="rec-hp">
          <span className="rec-cell-label">Hit Points</span>
          <span className="rec-hp-numbers">
            <span className="rec-value rec-hp-current">{c.hitPointsCurrent}</span>
            <span className="rec-soft">/</span>
            <span className="rec-value">{c.hitPointsMax}</span>
          </span>
          <span className="rec-cell-label">Hit Dice: {dash(k.hitDiceType)}</span>
        </div>
        <div className="rec-lines">
          <Cell label="Numbed #" value={dash(k.numbedNumber)} />
          <Cell label="Useless #" value={dash(k.uselessNumber)} />
          <Cell label="Max Deaths" value={dash(k.maxDeaths)} />
          <Cell label="Deaths to Date" value={dash(k.deathsToDate)} />
        </div>
        <div className="rec-wounds">
          <span className="rec-cell-label">Wounds</span>
          <div className="rec-wounds-box">
            {wounds.length === 0 ? <span className="rec-soft">—</span> : wounds.map((w, i) => <span key={i} className="rec-value">− {w}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}

const targetACs = Array.from({ length: 21 }, (_, i) => 10 - i)

function Thac0Table({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section">
      <div className="rec-thac0-head">
        <span className="rec-title-inline">THAC0</span>
        <span className="rec-value rec-strong">{c.thac0}</span>
      </div>
      <div className="rec-scroll">
        <table className="rec-table rec-thac0">
          <tbody>
            <tr>
              <th className="rec-row-label">Target's AC</th>
              {targetACs.map((ac) => (
                <th key={ac}>{ac}</th>
              ))}
            </tr>
            <tr>
              <th className="rec-row-label">To Hit #</th>
              {targetACs.map((ac) => {
                const override = c.thac0TargetOverrides?.[String(ac)]
                return (
                  <td key={ac} className={override ? 'rec-value rec-override' : 'rec-value'}>
                    {override || c.thac0 - ac}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ModifierList({ title, items }: { title: string; items: EquipmentItem[] | null | undefined }) {
  const filled = (items ?? []).filter((item) => item.name.trim() !== '' || item.note.trim() !== '')
  return (
    <div className="rec-modifiers">
      <table className="rec-table">
        <thead>
          <tr>
            <th className="rec-row-label">{title}</th>
            <th>+/-</th>
          </tr>
        </thead>
        <tbody>
          {filled.length === 0 && (
            <tr>
              <td className="rec-soft">—</td>
              <td />
            </tr>
          )}
          {filled.map((item) => (
            <tr key={item.id}>
              <td className="rec-value rec-left">{dash(item.name)}</td>
              <td className="rec-value">{dash(item.note)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CombatModifiers({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section">
      <div className="rec-modifier-grid">
        <ModifierList title="To Hit Modifiers" items={c.toHitModifiers} />
        <ModifierList title="Damage Modifiers" items={c.damageModifiers} />
        <ModifierList title="AC Modifiers" items={c.acModifiers} />
      </div>
    </section>
  )
}

// --- Armas -----------------------------------------------------------------

function Weapons({ c }: { c: PlayerCharacter }) {
  return (
    <section className="rec-section">
      <SectionTitle>Weapon Combat</SectionTitle>
      <div className="rec-scroll">
        <table className="rec-table rec-weapons">
          <thead>
            <tr>
              <th className="rec-row-label">Weapon</th>
              <th>#AT</th>
              <th>Size</th>
              <th>Type</th>
              <th>Speed</th>
              <th>Hit/Dmg Adj</th>
              <th>Damage</th>
              <th>Range/Special</th>
            </tr>
          </thead>
          <tbody>
            {c.weapons.length === 0 && (
              <tr>
                <td className="rec-soft" colSpan={8}>No weapons.</td>
              </tr>
            )}
            {c.weapons.map((w) => (
              <tr key={w.id}>
                <td className="rec-value rec-left">
                  {w.name || '…'}
                  {w.isSpecialized && <span className="rec-spec"> ★ spec</span>}
                </td>
                <td className="rec-value">{dash(w.attacks)}</td>
                <td className="rec-value">{dash(w.size)}</td>
                <td className="rec-value">{dash(w.weaponType)}</td>
                <td className="rec-value">{dash(w.speed)}</td>
                <td className="rec-value">
                  {dash(w.thac0)} / {dash(w.dmgAdj)}
                </td>
                <td className="rec-value">
                  {dash(w.damageSmall)} / {dash(w.damageLarge)}
                </td>
                <td className="rec-value">{dash(w.range)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {c.nonProficiencyPenalty && <p className="rec-soft">Non-proficiency penalty: {c.nonProficiencyPenalty}</p>}
    </section>
  )
}

// --- Proficiências e perícias de ladrão -----------------------------------

// Igual ao ProficiencyEntry.init(from:) do iPad: `slots` antigo em texto vale
// só pelos dígitos (sem dígito nenhum, 1).
function proficiencySlots(slots: number | string | undefined): number {
  if (typeof slots === 'number') return slots
  const digits = typeof slots === 'string' ? slots.replace(/\D/g, '') : ''
  return digits === '' ? 1 : Number(digits)
}

function Proficiencies({ c }: { c: PlayerCharacter }) {
  const items = (c.proficiencies ?? []).filter((p) => (p.name ?? '').trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>Nonweapon Proficiencies</SectionTitle>
      {items.length === 0 ? (
        <p className="rec-soft">No proficiencies.</p>
      ) : (
        <div className="rec-prof-grid">
          {items.map((p) => (
            <div key={p.id} className="rec-prof-row">
              <span className="rec-value rec-left">{p.name}</span>
              <span className="rec-prof-num">
                <span className="rec-cell-label">Slots</span>
                <span className="rec-value">{proficiencySlots(p.slots)}</span>
              </span>
              <span className="rec-prof-num">
                <span className="rec-cell-label">Chk</span>
                <span className="rec-value">{dash(p.target)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ThievingSkills({ c }: { c: PlayerCharacter }) {
  const skills = c.thievingSkills ?? []
  if (skills.length === 0) return null
  return (
    <section className="rec-section">
      <SectionTitle>Thieving Skills</SectionTitle>
      <div className="rec-prof-grid">
        {skills.map((s) => (
          <div key={s.id} className="rec-prof-row">
            <span className="rec-row-label">{s.skill}</span>
            <span className="rec-value">{dash(s.value)}%</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// --- Efeitos ativos ----------------------------------------------------------

function ActiveEffects({ c }: { c: PlayerCharacter }) {
  const effects = c.activeEffects ?? []
  if (effects.length === 0) return null
  return (
    <section className="rec-section">
      <SectionTitle>Active Effects</SectionTitle>
      <ul className="rec-effects">
        {effects.map((e) => (
          <li key={e.id}>
            <span className="rec-value">{e.name || 'Unnamed effect'}</span>
            {e.durationLabel && <span className="rec-soft"> · {e.durationLabel}</span>}
            {e.notes && <span className="rec-soft"> · {e.notes}</span>}
          </li>
        ))}
      </ul>
      <p className="rec-soft">Already applied to the numbers above, as saved on the iPad.</p>
    </section>
  )
}

export function RecordSheet({ character, campaignName }: { character: PlayerCharacter; campaignName: string | null }) {
  return (
    <div className="rec-sheet">
      <RecordHeader c={character} campaignName={campaignName} />
      <div className="rec-two">
        <AbilityScores c={character} />
        <SavingThrowsBlock c={character} />
      </div>
      <Combat c={character} />
      <Thac0Table c={character} />
      <CombatModifiers c={character} />
      <Weapons c={character} />
      <Proficiencies c={character} />
      <ThievingSkills c={character} />
      <ActiveEffects c={character} />
    </div>
  )
}
