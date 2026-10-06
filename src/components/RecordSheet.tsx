import type { EquipmentItem, PlayerCharacter, SavingThrows } from '../types/library'
import { dash } from '../lib/format'
import { backstabMultiplier, canonicalClass, hasThievingSkills, hitDieType, thievingSkillsShown, totalWeaponSlots, weaponSlotCost } from '../rules/rules'
import { Cell, HeaderLine, InkInput, InkNumber, SectionTitle } from './SheetBits'

/** Aplica uma mudança na ficha (a página grava sozinha). Ausente = só leitura. */
export type Edit = (mutate: (c: PlayerCharacter) => void) => void

// Página 1 da ficha oficial (OfficialRecordSheet do iPad, a partir do PDF
// MI_ADDCharSheet46): cabeçalho, atributos, jogadas de proteção, combate,
// tabela "Target's AC", modificadores, armas, proficiências e perícias de
// ladrão. Mostra o que está gravado na ficha; as contas de exibição são as
// mesmas do iPad: total do save (base − mod) e a tabela "Target's AC"
// (THAC0 − CA, ou o valor ajustado à mão).
//
// Com `edit` (W2.5a), os campos que não disparam regra viram editáveis.
// Ficam só leitura até as próximas etapas: classe, kit, nível, raça,
// atributos, THAC0 e saves base (motor de consequências, W2.5b), ferimentos
// e especialização de arma (mexem em PV e slots), e incluir/remover linhas.

// --- Cabeçalho -------------------------------------------------------------

// As 9 opções do PHB, com a sigla clássica (AlignmentOption do iPad). O campo
// não é texto livre: só uma dessas. Ficha antiga com texto diferente continua
// mostrando o que tem até alguém escolher outra opção.
const alignmentOptions: [string, string][] = [
  ['LG', 'Lawful Good'],
  ['NG', 'Neutral Good'],
  ['CG', 'Chaotic Good'],
  ['LN', 'Lawful Neutral'],
  ['TN', 'True Neutral'],
  ['CN', 'Chaotic Neutral'],
  ['LE', 'Lawful Evil'],
  ['NE', 'Neutral Evil'],
  ['CE', 'Chaotic Evil'],
]

function AlignmentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = alignmentOptions.some(([, name]) => name === value)
  return (
    <select className="ink-input ink-select" value={value} aria-label="Alignment" onChange={(event) => onChange(event.target.value)}>
      {!known && <option value={value}>{value || '—'}</option>}
      {alignmentOptions.map(([abbreviation, name]) => (
        <option key={name} value={name}>
          {name} ({abbreviation})
        </option>
      ))}
    </select>
  )
}

function RecordHeader({ c, campaignName, edit }: { c: PlayerCharacter; campaignName: string | null; edit?: Edit }) {
  const spheres = Object.entries(c.sphereAccess ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sphere, level]) => `${sphere}${level === 'minor' ? ' (minor)' : ''}`)
  return (
    <header className="rec-header">
      <div className="rec-header-fields">
        <HeaderLine
          label="Character"
          edit={edit && { value: c.name, onChange: (v) => edit((x) => void (x.name = v)), className: 'rec-name' }}
        >
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
          {edit ? (
            <div className="rec-header-line">
              <AlignmentSelect value={c.alignment} onChange={(v) => edit((x) => void (x.alignment = v))} />
              <span className="rec-cell-label">Alignment</span>
            </div>
          ) : (
            <HeaderLine label="Alignment">{dash(c.alignment)}</HeaderLine>
          )}
        </div>
        <div className="rec-header-row">
          <HeaderLine label="Patron Deity / Religion" edit={edit && { value: c.deity, onChange: (v) => edit((x) => void (x.deity = v)) }}>
            {dash(c.deity)}
          </HeaderLine>
          <HeaderLine
            label="Place of Origin"
            edit={edit && { value: c.placeOfOrigin, onChange: (v) => edit((x) => void (x.placeOfOrigin = v === '' ? null : v)) }}
          >
            {dash(c.placeOfOrigin)}
          </HeaderLine>
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
        {/* O dragão do canto (record_badge do iPad). Lá ele dá lugar ao sinal de
            consequência pendente, que só existe com edição (W2.5). */}
        <img className="rec-badge" src={`${import.meta.env.BASE_URL}images/record_badge.png`} alt="" />
      </div>
    </header>
  )
}

// --- Atributos -------------------------------------------------------------

function AbilityScores({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const d = c.details as unknown as Record<string, string | null | undefined>
  const strength =
    c.abilities.exceptionalStrength != null && c.abilities.strength === 18
      ? `18/${String(c.abilities.exceptionalStrength).padStart(2, '0')}`
      : String(c.abilities.strength)
  // Cada célula: rótulo e o campo de PlayerCharacter.details que ela mostra.
  const rows: [string, string | number, [string, string][]][] = [
    ['STR', strength, [
      ['Hit Adj', 'strengthHit'],
      ['Dmg Adj', 'strengthDamage'],
      ['Weight Allow', 'strengthWeight'],
      ['Max Press', 'strengthMaxPress'],
      ['Open Doors', 'strengthDoors'],
      ['Bend Bars', 'strengthBars'],
    ]],
    ['DEX', c.abilities.dexterity, [
      ['Surprise Adjustment', 'dexterityReaction'],
      ['Missile Att Adjustment', 'dexterityMissile'],
      ['Defensive Adjustment', 'dexterityDefense'],
    ]],
    ['CON', c.abilities.constitution, [
      ['HP Adj', 'constitutionHP'],
      ['System Shock', 'constitutionShock'],
      ['Resurrect Survival', 'constitutionResurrection'],
      ['Poison Save', 'constitutionPoison'],
      ['Regen', 'constitutionRegen'],
    ]],
    ['INT', c.abilities.intelligence, [
      ['Languages', 'intelligenceLanguages'],
      ['Spell Level', 'intelligenceMaxLevel'],
      ['Learn Spell', 'intelligenceLearn'],
      ['Max/ Level', 'intelligenceMaxPerLevel'],
      ['Spell Immun', 'intelligenceSpellImmunity'],
    ]],
    ['WIS', c.abilities.wisdom, [
      ['Magical Def Adj', 'wisdomDefense'],
      ['Bonus Spells', 'wisdomBonusSpells'],
      ['Spell Failure', 'wisdomFailure'],
      ['Spell Immun', 'wisdomSpellImmunity'],
    ]],
    ['CHA', c.abilities.charisma, [
      ['Max # of Henchmen', 'charismaHenchmen'],
      ['Loyalty Base', 'charismaLoyalty'],
      ['Reaction Adjustment', 'charismaReaction'],
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
              {cells.map(([label, key]) =>
                edit ? (
                  <Cell
                    key={label}
                    label={label}
                    value={d[key] ?? ''}
                    onChange={(v) => edit((x) => void ((x.details as unknown as Record<string, string>)[key] = v))}
                  />
                ) : (
                  <Cell key={label} label={label} value={dash(d[key])} />
                ),
              )}
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

/** SavingThrows.setModifier do iPad: 0 apaga a entrada; sem entradas, `modifiers` some. */
function setSaveModifier(saves: SavingThrows, id: string, value: number) {
  const next = { ...(saves.modifiers ?? {}) }
  if (value === 0) delete next[id]
  else next[id] = value
  saves.modifiers = Object.keys(next).length === 0 ? null : next
}

function SavingThrowsBlock({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
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
                <td className="rec-value">
                  {edit ? (
                    <InkNumber
                      value={mod}
                      min={-20}
                      max={20}
                      label={`${label} modifier`}
                      onChange={(v) => edit((x) => setSaveModifier(x.saves, id, v))}
                    />
                  ) : mod === 0 ? (
                    '0'
                  ) : (
                    mod
                  )}
                </td>
                <td className="rec-value rec-strong">{base - mod}</td>
              </tr>
            )
          })}
          <tr>
            <td className="rec-row-label">Spell Resistance</td>
            <td className="rec-value" colSpan={3}>
              {edit ? (
                <InkInput
                  value={c.saves.spellResistance}
                  label="Spell Resistance"
                  onChange={(v) => edit((x) => void (x.saves.spellResistance = v === '' ? null : v))}
                />
              ) : (
                dash(c.saves.spellResistance)
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}

// --- Combate ---------------------------------------------------------------

function Combat({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const k = c.combat ?? {}
  type CombatKey = Exclude<keyof NonNullable<PlayerCharacter['combat']>, 'wounds' | 'hitDiceType'>
  // Linha de combate: texto livre; vazio volta a nil, como os opcionais do iPad.
  const line = (label: string, key: CombatKey) =>
    edit ? (
      <Cell label={label} value={k[key] ?? ''} onChange={(v) => edit((x) => void (x.combat = { ...(x.combat ?? {}), [key]: v === '' ? null : v }))} />
    ) : (
      <Cell label={label} value={dash(k[key])} />
    )
  const wounds = (k.wounds ?? '').split('\n').filter((w) => w.trim() !== '')
  return (
    <section className="rec-section">
      <SectionTitle>Combat</SectionTitle>
      <div className="rec-combat">
        <div className="rec-shield">
          <span>ARMOR</span>
          <span className="rec-shield-shape">
            {edit ? (
              <InkNumber value={c.armorClass} min={-10} max={10} label="Armor Class" onChange={(v) => edit((x) => void (x.armorClass = v))} />
            ) : (
              <span className="rec-value">{c.armorClass}</span>
            )}
          </span>
          <span>CLASS</span>
        </div>
        <div className="rec-lines">
          {line('Surprised AC', 'surprisedAC')}
          {line('Shieldless AC', 'shieldlessAC')}
          {line('Rear AC', 'rearAC')}
          {line('Type Worn', 'typeWorn')}
          {line('Dex Checks', 'dexChecks')}
          {line('Vision Checks', 'visionChecks')}
          {line('Hearing Checks', 'hearingChecks')}
        </div>
        <div className="rec-hp">
          <span className="rec-cell-label">Hit Points</span>
          <span className="rec-hp-numbers">
            {edit ? (
              <>
                <InkNumber
                  className="rec-hp-current"
                  value={c.hitPointsCurrent}
                  min={-99}
                  max={999}
                  label="Current hit points"
                  onChange={(v) => edit((x) => void (x.hitPointsCurrent = v))}
                />
                <span className="rec-soft">/</span>
                <InkNumber value={c.hitPointsMax} min={1} max={999} label="Maximum hit points" onChange={(v) => edit((x) => void (x.hitPointsMax = v))} />
              </>
            ) : (
              <>
                <span className="rec-value rec-hp-current">{c.hitPointsCurrent}</span>
                <span className="rec-soft">/</span>
                <span className="rec-value">{c.hitPointsMax}</span>
              </>
            )}
          </span>
          {edit ? (
            <label className="rec-cell-label rec-inline-edit">
              Hit Dice:
              <InkInput
                value={k.hitDiceType || hitDieType(c.characterClass)}
                label="Hit dice"
                onChange={(v) => edit((x) => void (x.combat = { ...(x.combat ?? {}), hitDiceType: v === '' ? null : v }))}
              />
            </label>
          ) : (
            <span className="rec-cell-label">Hit Dice: {k.hitDiceType || hitDieType(c.characterClass)}</span>
          )}
        </div>
        <div className="rec-lines">
          {line('Numbed #', 'numbedNumber')}
          {line('Useless #', 'uselessNumber')}
          {line('Max Deaths', 'maxDeaths')}
          {line('Deaths to Date', 'deathsToDate')}
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

/** PlayerCharacter.setThac0Override: vazio ou igual ao automático apaga o ajuste. */
function setThac0Override(x: PlayerCharacter, ac: number, text: string) {
  const trimmed = text.trim()
  if (trimmed === '' || trimmed === String(x.thac0 - ac)) {
    if (x.thac0TargetOverrides) delete x.thac0TargetOverrides[String(ac)]
  } else {
    x.thac0TargetOverrides = { ...(x.thac0TargetOverrides ?? {}), [String(ac)]: trimmed }
  }
}

function Thac0Table({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
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
                    {edit ? (
                      <InkInput value={override || String(c.thac0 - ac)} label={`To hit AC ${ac}`} onChange={(v) => edit((x) => setThac0Override(x, ac, v))} />
                    ) : (
                      override || c.thac0 - ac
                    )}
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

type ModifierKey = 'toHitModifiers' | 'damageModifiers' | 'acModifiers'

function ModifierList({
  title,
  items,
  field,
  edit,
}: {
  title: string
  items: EquipmentItem[] | null | undefined
  field: ModifierKey
  edit?: Edit
}) {
  // Editando, mostra todas as linhas (o iPad grava 3 vazias); só leitura, só as preenchidas.
  const filled = (items ?? []).filter((item) => edit || item.name.trim() !== '' || item.note.trim() !== '')
  const set = (id: string, patch: Partial<EquipmentItem>) =>
    edit?.((x) => void (x[field] = (x[field] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m))))
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
              <td className="rec-value rec-left">
                {edit ? <InkInput value={item.name} label={`${title}: name`} placeholder="…" onChange={(v) => set(item.id, { name: v })} /> : dash(item.name)}
              </td>
              <td className="rec-value">
                {edit ? <InkInput value={item.note} label={`${title}: value`} onChange={(v) => set(item.id, { note: v })} /> : dash(item.note)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CombatModifiers({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  return (
    <section className="rec-section">
      <div className="rec-modifier-grid">
        <ModifierList title="To Hit Modifiers" items={c.toHitModifiers} field="toHitModifiers" edit={edit} />
        <ModifierList title="Damage Modifiers" items={c.damageModifiers} field="damageModifiers" edit={edit} />
        <ModifierList title="AC Modifiers" items={c.acModifiers} field="acModifiers" edit={edit} />
      </div>
    </section>
  )
}

// --- Armas -----------------------------------------------------------------

// Cada arma listada já é uma proficiência; especializar custa mais (CFH cap. 4).
// O total assume todo o bônus de Inteligência em armas, como no iPad.
function WeaponSlotsLine({ c }: { c: PlayerCharacter }) {
  const spent = c.weapons.reduce((sum, w) => sum + weaponSlotCost(w), 0)
  const total = totalWeaponSlots(c.characterClass, c.level, c.abilities.intelligence)
  return (
    <p className={spent > total ? 'rec-soft rec-red' : 'rec-soft'}>
      Weapon Proficiency Slots: {spent}/{total} used
    </p>
  )
}

type WeaponKey = 'name' | 'attacks' | 'size' | 'weaponType' | 'speed' | 'thac0' | 'dmgAdj' | 'damageSmall' | 'damageLarge' | 'range'
// Opcionais no iPad: vazio volta a nil.
const optionalWeaponKeys = new Set<WeaponKey>(['size', 'weaponType', 'speed', 'dmgAdj'])

function Weapons({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const field = (w: PlayerCharacter['weapons'][number], key: WeaponKey, label: string) =>
    edit ? (
      <InkInput
        value={w[key] ?? ''}
        label={`${w.name || 'Weapon'} ${label}`}
        onChange={(v) =>
          edit((x) => void (x.weapons = x.weapons.map((y) => (y.id === w.id ? { ...y, [key]: optionalWeaponKeys.has(key) && v === '' ? null : v, ...(key === 'name' ? { matchedWeaponID: null } : {}) } : y))))
        }
      />
    ) : (
      dash(w[key])
    )
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
                  {edit ? field(w, 'name', 'name') : w.name || '…'}
                  {w.isSpecialized && <span className="rec-spec"> ★ spec</span>}
                </td>
                <td className="rec-value">{field(w, 'attacks', 'attacks')}</td>
                <td className="rec-value">{field(w, 'size', 'size')}</td>
                <td className="rec-value">{field(w, 'weaponType', 'type')}</td>
                <td className="rec-value">{field(w, 'speed', 'speed')}</td>
                <td className="rec-value rec-pair">
                  {field(w, 'thac0', 'hit adjustment')} / {field(w, 'dmgAdj', 'damage adjustment')}
                </td>
                <td className="rec-value rec-pair">
                  {field(w, 'damageSmall', 'damage S/M')} / {field(w, 'damageLarge', 'damage L')}
                </td>
                <td className="rec-value">{field(w, 'range', 'range')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <WeaponSlotsLine c={c} />
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

function Proficiencies({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  // Pela posição na lista gravada: no schema, o id da proficiência é opcional.
  const set = (index: number, patch: { slots?: number; target?: string | null }) =>
    edit?.((x) => void (x.proficiencies = (x.proficiencies ?? []).map((p, i) => (i === index ? { ...p, ...patch } : p))))
  // Como no iPad: o item i vai para a coluna i % 3 (pela posição na lista gravada).
  const all = (c.proficiencies ?? []).map((p, index) => ({ ...p, index }))
  const columns = [0, 1, 2].map((column) => all.filter((p) => p.index % 3 === column && (p.name ?? '').trim() !== ''))
  return (
    <section className="rec-section">
      <SectionTitle>Proficiencies</SectionTitle>
      <p className="rec-soft">Nonweapon only — Weapon Proficiencies are the weapons listed above, in Weapon Combat.</p>
      <div className="rec-prof-columns">
        {columns.map((items, column) => (
          <table key={column} className="rec-table rec-prof-table">
            <thead>
              <tr>
                <th className="rec-row-label">Proficiency</th>
                <th>Slots</th>
                <th>Chk</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="rec-soft" colSpan={3}>—</td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id ?? p.index}>
                  <td className="rec-value rec-left">{p.name}</td>
                  <td className="rec-value">
                    {edit ? (
                      <InkNumber value={proficiencySlots(p.slots)} min={0} max={9} label={`${p.name} slots`} onChange={(v) => set(p.index, { slots: v })} />
                    ) : (
                      proficiencySlots(p.slots)
                    )}
                  </td>
                  <td className="rec-value">
                    {edit ? (
                      <InkInput value={p.target} label={`${p.name} check`} onChange={(v) => set(p.index, { target: v === '' ? null : v })} />
                    ) : (
                      dash(p.target)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </section>
  )
}

function ThievingSkills({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  if (!hasThievingSkills(c.characterClass)) return null
  // Como o iPad mostra: valor gravado ou, sem ele, o inicial (base + raça + Destreza).
  const skills = thievingSkillsShown(c, c.thievingSkills)
  const cls = canonicalClass(c.characterClass)
  return (
    <section className="rec-section">
      <SectionTitle>Thieving Skills</SectionTitle>
      <div className="rec-prof-grid">
        {skills.map((s) => (
          <div key={s.skill} className="rec-prof-row">
            <span className="rec-row-label">{s.skill}</span>
            {edit ? (
              <InkInput
                value={s.value}
                label={s.skill}
                onChange={(v) =>
                  edit((x) => {
                    // Grava a lista inteira como o iPad a mostra (valores iniciais incluídos).
                    x.thievingSkills = thievingSkillsShown(x, x.thievingSkills).map((entry) => ({
                      id: x.thievingSkills?.find((t) => t.skill === entry.skill)?.id ?? crypto.randomUUID().toUpperCase(),
                      skill: entry.skill,
                      value: entry.skill === s.skill ? v : entry.value,
                    }))
                  })
                }
              />
            ) : (
              <span className="rec-value">{dash(s.value)}</span>
            )}
          </div>
        ))}
      </div>
      {(cls === 'Thief' || cls === 'Ninja') && (
        <p className="rec-soft">
          Backstab at level {c.level}: {backstabMultiplier(c.level)} damage
        </p>
      )}
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

export function RecordSheet({ character, campaignName, edit }: { character: PlayerCharacter; campaignName: string | null; edit?: Edit }) {
  return (
    <div className="rec-sheet">
      <RecordHeader c={character} campaignName={campaignName} edit={edit} />
      <div className="rec-two">
        <AbilityScores c={character} edit={edit} />
        <SavingThrowsBlock c={character} edit={edit} />
      </div>
      <Combat c={character} edit={edit} />
      <Thac0Table c={character} edit={edit} />
      <CombatModifiers c={character} edit={edit} />
      <Weapons c={character} edit={edit} />
      <Proficiencies c={character} edit={edit} />
      <ThievingSkills c={character} edit={edit} />
      <ActiveEffects c={character} />
    </div>
  )
}
