import type { EncumbranceRow, LevelChangeRow, LevelChangesTable, MovementRates, PlayerCharacter, QuantifiedItem } from '../types/library'
import { dash } from '../lib/format'
import { defaultEncumbranceTable, levelChanges, xpNeededForNextLevel, xpNote } from '../rules/rules'
import { classProgress, isMultiClass } from '../rules/multiclass'
import { useEffect, useEffectEvent, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/context'
import {
  createCustomItem,
  deleteCustomItem,
  fetchCustomItems,
  fetchCustomItemsByID,
  updateCustomItem,
  type CustomItemRow,
  type CustomItemVisibility,
} from '../lib/customItems'
import { normalize } from '../lib/search'
import { currentPiece, lineACBonus, parsedRating, setArmorPieces, suggestedACBonus } from '../rules/armorClass'
import { customSnapshot, emptyCustomItem, refreshCustomItems, sameID } from '../rules/customItems'
import type { CustomMagicItemData } from '../types/library'
import { CustomItemDetail } from './CustomItemDetail'
import { CustomItemEditor } from './CustomItemEditor'
import { MagicItemDetail } from './MagicItemDetail'
import { loadData } from '../data/load'
import type { ArmorPiece, MundaneItem } from '../data/gear'
import { loadMagicIndex, type MagicItemIndexEntry } from '../data/magicItems'
import { leastFilledColumn } from '../rules/sheetEdits'
import { CompendiumPicker } from './CompendiumPicker'
import type { Edit } from './RecordSheet'
import { Cell, InkInput, InkNumber, NumberCell, SectionTitle, SheetBlock, TallyBoard, TallyMarks } from './SheetBits'

// Página 2 da ficha oficial (RecordSheetPageTwo do iPad): armadura,
// equipamento em duas colunas, movimento, carga, experiência, mudanças por
// nível, itens mágicos, tesouro, idiomas, aliados e talento selvagem.
//
// Com `edit` (W2.5a), os campos simples viram editáveis; W2.5d1 inclui e
// remove linhas (equipamento e itens mágicos pelo compêndio). Ficam só
// leitura: armadura e escudo (no iPad, trocar recalcula a CA), "XPs Needed"
// enquanto é calculado pelo nível, e as marcas de uso.

const newID = () => crypto.randomUUID().toUpperCase()
const loadMundane = () => loadData<MundaneItem[]>('mundane_items.json')

/** "×" de remover linha (RemoveRowButton do iPad). */
function RowRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="remove-btn" aria-label={label} title={label} onClick={onClick}>
      ×
    </button>
  )
}

function AddLine({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="paper-link add-line" onClick={onClick}>
      + {label}
    </button>
  )
}

const shieldRating = (piece: ArmorPiece) => piece.baseAC ?? -1

/**
 * Armadura e escudo comuns (2026-10-24, como o ArmorPickerSheet do iPad): o
 * seletor grava o número (AC base; escudo −1), os nomes em Type Worn e
 * recalcula a caixa ARMOR da página 1 (src/rules/armorClass.ts).
 */
function ArmorPieceSelect({
  label,
  options,
  current,
  ratingOf,
  onChange,
}: {
  label: string
  options: ArmorPiece[]
  current: ArmorPiece | null
  ratingOf: (piece: ArmorPiece) => number
  onChange: (piece: ArmorPiece | null) => void
}) {
  return (
    <label className="rec-cell armor-pick">
      <span className="rec-cell-label">{label}</span>
      <select
        className="ink-input armor-pick-select"
        aria-label={label}
        value={current?.id ?? ''}
        onChange={(e) => onChange(options.find((p) => p.id === e.target.value) ?? null)}
      >
        <option value="">— none —</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({ratingOf(p) > 0 ? `AC ${ratingOf(p)}` : `${ratingOf(p)}`.replace('-', '−')})
          </option>
        ))}
      </select>
    </label>
  )
}

function Armor({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const [pieces, setPieces] = useState<ArmorPiece[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void loadData<ArmorPiece[]>('armor.json')
      .then((list) => {
        if (!cancelled) setPieces(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  const armors = (pieces ?? []).filter((p) => p.kind === 'armor' && p.baseAC != null)
  const shields = (pieces ?? []).filter((p) => p.kind === 'shield')
  const armor = currentPiece(armors, parsedRating(c.armorRating), c.combat?.typeWorn, (p) => p.baseAC ?? null)
  const shield = currentPiece(shields, parsedRating(c.shieldRating), c.combat?.typeWorn, shieldRating)
  const shown = (piece: ArmorPiece | null, rating: string) => (piece ? `${piece.name} (${rating.replace('-', '−')})` : dash(rating))
  return (
    <SheetBlock title="Armor" trailing="base AC 10">
      <div className="rec-lines rec-lines-4">
        {edit && pieces ? (
          <>
            <ArmorPieceSelect
              label="Armor"
              options={armors}
              current={armor}
              ratingOf={(p) => p.baseAC ?? 10}
              onChange={(p) =>
                edit((x) => setArmorPieces(x, { armor: p ? { name: p.name, rating: p.baseAC ?? 10 } : null, shieldName: shield?.name ?? null }))
              }
            />
            <ArmorPieceSelect
              label="Shield"
              options={shields}
              current={shield}
              ratingOf={shieldRating}
              onChange={(p) =>
                edit((x) => setArmorPieces(x, { shield: p ? { name: p.name, rating: shieldRating(p) } : null, armorName: armor?.name ?? null }))
              }
            />
          </>
        ) : (
          <>
            <Cell label="Armor" value={shown(armor, c.armorRating)} />
            <Cell label="Shield" value={shown(shield, c.shieldRating)} />
          </>
        )}
        <Cell label="Dexterity" value={dash(c.details.dexterityDefense)} />
        {edit ? (
          <NumberCell label="Movement" value={c.movement} min={0} max={30} onChange={(v) => edit((x) => void (x.movement = v))} />
        ) : (
          <Cell label="Movement" value={c.movement} />
        )}
      </div>
    </SheetBlock>
  )
}

type EquipmentRow = { index: number; item: string; location: string; weight: string; id: string }

function EquipmentColumn({ rows, edit }: { rows: EquipmentRow[]; edit?: Edit }) {
  const set = (index: number, key: 'item' | 'location' | 'weight', value: string) =>
    edit?.(
      (x) =>
        void (x.page2Equipment = (x.page2Equipment ?? []).map((e, i) =>
          // Nome trocado à mão deixa de apontar para o item do compêndio (como no iPad).
          i === index ? { ...e, [key]: value, ...(key === 'item' ? { matchedItemID: null } : {}) } : e,
        )),
    )
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
        {rows.length === 0 && (
          <tr>
            <td className="rec-soft" colSpan={3}>—</td>
          </tr>
        )}
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="rec-value rec-left">
              {edit ? (
                <span className="row-with-remove">
                  <InkInput value={row.item} label="Item" placeholder="…" onChange={(v) => set(row.index, 'item', v)} />
                  <RowRemove
                    label={`Remove ${row.item || 'this line'}`}
                    onClick={() => edit((x) => void (x.page2Equipment = (x.page2Equipment ?? []).filter((_, i) => i !== row.index)))}
                  />
                </span>
              ) : (
                row.item
              )}
            </td>
            <td className="rec-value">
              {edit ? <InkInput value={row.location} label={`${row.item} location`} onChange={(v) => set(row.index, 'location', v)} /> : dash(row.location)}
            </td>
            <td className="rec-value">
              {edit ? <InkInput value={row.weight} label={`${row.item} weight`} onChange={(v) => set(row.index, 'weight', v)} /> : dash(row.weight)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Campo opcional de texto do iPad: vazio volta a nil. */
const orNull = (v: string) => (v === '' ? null : v)

function Equipment({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const [picking, setPicking] = useState(false)
  // Item novo vai para a coluna com menos itens (Page2EquipmentForm do iPad).
  const add = (entry: { item: string; weight: string; matchedItemID: string | null }) =>
    edit?.((x) => {
      const list = x.page2Equipment ?? []
      x.page2Equipment = [...list, { id: newID(), location: '', column: leastFilledColumn(list), ...entry }]
    })
  // Coluna sem valor gravado: alterna pela posição, como o iPad faz ao migrar.
  // Editando, mostra também as linhas vazias (o iPad grava 10 para preencher).
  const all = (c.page2Equipment ?? []).map((e, index) => ({ ...e, index, column: e.column ?? index % 2 }))
  const shown = all.filter((e) => edit || e.item.trim() !== '' || e.location.trim() !== '' || e.weight.trim() !== '')
  const footer = (label: string, key: 'page2TotalWeight' | 'page2EquipmentEncumbrance' | 'page2MovementRate') =>
    edit ? (
      <Cell label={label} value={c[key] ?? ''} onChange={(v) => edit((x) => void (x[key] = orNull(v)))} />
    ) : (
      <Cell label={label} value={dash(c[key])} />
    )
  return (
    <section className="rec-section">
      <SectionTitle>Equipment</SectionTitle>
      <div className="rec-columns-2">
        <EquipmentColumn rows={shown.filter((e) => e.column === 0)} edit={edit} />
        <EquipmentColumn rows={shown.filter((e) => e.column !== 0)} edit={edit} />
      </div>
      {edit && <AddLine label="add item" onClick={() => setPicking(true)} />}
      {picking && (
        <CompendiumPicker<MundaneItem>
          title="Add equipment"
          load={loadMundane}
          hint={(i) => [i.category, i.weight && `${i.weight}`].filter(Boolean).join(' · ')}
          onChoose={(i) => {
            add({ item: i.name, weight: i.weight ?? '', matchedItemID: i.id })
            setPicking(false)
          }}
          onTyped={(name) => {
            add({ item: name, weight: '', matchedItemID: null })
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
      <div className="rec-lines rec-lines-3">
        {footer('Total Weight', 'page2TotalWeight')}
        {footer('Encumbrance', 'page2EquipmentEncumbrance')}
        {footer('Movement Rate', 'page2MovementRate')}
      </div>
    </section>
  )
}

const emptyMovement = (): MovementRates => ({ base: '', jog: '', runX3: '', runX4: '', runX5: '', day: '' })

function Movement({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const m = c.page2Movement
  const cell = (label: string, key: keyof MovementRates) =>
    edit ? (
      <Cell label={label} value={m?.[key] ?? ''} onChange={(v) => edit((x) => void (x.page2Movement = { ...(x.page2Movement ?? emptyMovement()), [key]: v }))} />
    ) : (
      <Cell label={label} value={dash(m?.[key])} />
    )
  return (
    <section className="rec-section">
      <SectionTitle>Movement</SectionTitle>
      <div className="rec-lines rec-lines-3">
        {cell('Base', 'base')}
        {cell('Jog (x2)', 'jog')}
        {cell('Run (x3)', 'runX3')}
        {cell('Run (x4)', 'runX4')}
        {cell('Run (x5)', 'runX5')}
        {cell('Day', 'day')}
      </div>
    </section>
  )
}

type EncumbranceKey = 'light' | 'moderate' | 'heavy' | 'severe'

function Encumbrance({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  // Sem tabela gravada, o iPad grava a do livro ao abrir a página.
  const t = c.page2EncumbranceTable ?? defaultEncumbranceTable()
  const rows: [string, EncumbranceKey][] = [
    ['Light', 'light'],
    ['Moderate', 'moderate'],
    ['Heavy', 'heavy'],
    ['Severe', 'severe'],
  ]
  const cell = (row: EncumbranceKey, key: keyof EncumbranceRow, label: string) =>
    edit ? (
      <InkInput
        value={t[row][key]}
        label={`${row} ${label}`}
        onChange={(v) =>
          edit((x) => {
            const table = x.page2EncumbranceTable ?? defaultEncumbranceTable()
            x.page2EncumbranceTable = { ...table, [row]: { ...table[row], [key]: v } }
          })
        }
      />
    ) : (
      dash(t[row][key])
    )
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
            <tr key={row}>
              <td className="rec-row-label">{label}</td>
              <td className="rec-value">{cell(row, 'weightCarried', 'weight')}</td>
              <td className="rec-value">{cell(row, 'moveRate', 'move')}</td>
              <td className="rec-value">{cell(row, 'attackPenalty', 'attack')}</td>
              <td className="rec-value">{cell(row, 'acPenalty', 'AC')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// O iPad recalcula "XPs Needed" ao abrir a página (até o nível 20; depois,
// vale o que o jogador escreveu) e mostra a nota da classe, se houver.
function Experience({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const note = xpNote(c.characterClass, c.level)
  const computedNeeded = xpNeededForNextLevel(c.level, c.characterClass)
  const text = (label: string, key: 'xpKitModifier' | 'xpAbilityBonus' | 'xpSubraceModifier' | 'xpLevelLimit' | 'xpNeededNextLevel') =>
    edit ? <Cell label={label} value={c[key] ?? ''} onChange={(v) => edit((x) => void (x[key] = orNull(v)))} /> : <Cell label={label} value={dash(c[key])} />
  return (
    <section className="rec-section">
      <SectionTitle>Experience</SectionTitle>
      <div className="rec-lines rec-lines-2">
        {edit ? (
          <NumberCell label="Total XPs" value={c.experience} min={0} onChange={(v) => edit((x) => void (x.experience = v))} />
        ) : (
          <Cell label="Total XPs" value={c.experience.toLocaleString('en-US')} />
        )}
        {isMultiClass(c) ? (
          // Multiclasse: XP dividido igualmente; o próximo nível de cada classe.
          <Cell
            label="Each Class (XP divided equally)"
            value={classProgress(c)
              .map((p) => `${p.characterClass} ${p.xp.toLocaleString('en-US')}${p.next !== null ? ` of ${p.next.toLocaleString('en-US')}` : ''}${p.ready ? ' ✓' : ''}`)
              .join(' · ')}
          />
        ) : computedNeeded !== null ? (
          <Cell label="XPs Needed for Next Level" value={computedNeeded} />
        ) : (
          text('XPs Needed for Next Level', 'xpNeededNextLevel')
        )}
        {text('Kit Modifier', 'xpKitModifier')}
        {text('Ability Bonus', 'xpAbilityBonus')}
        {text('Subrace Modifier', 'xpSubraceModifier')}
        {text('Level Limit', 'xpLevelLimit')}
      </div>
      {note && <p className="rec-soft">{note}</p>}
    </section>
  )
}

type LevelChangeKey = keyof LevelChangesTable

function LevelChanges({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  // Linhas de THAC0 e saves vazias: o iPad as preenche ao abrir a ficha.
  const shownTable = (x: PlayerCharacter): LevelChangesTable => {
    const computed = levelChanges(x.characterClass, x.abilities)
    const stored = x.levelChanges
    const filled = (row: LevelChangeRow | undefined) => !!row && (row.by !== '' || row.atLevels !== '')
    return {
      thac0: filled(stored?.thac0) ? stored!.thac0 : computed.thac0,
      savingThrows: filled(stored?.savingThrows) ? stored!.savingThrows : computed.savingThrows,
      weaponProficiencies: stored?.weaponProficiencies ?? { by: '', atLevels: '' },
      nonWeaponProficiencies: stored?.nonWeaponProficiencies ?? { by: '', atLevels: '' },
    }
  }
  const t = shownTable(c)
  const rows: [string, LevelChangeKey][] = [
    ['THAC0', 'thac0'],
    ['Saving Throws', 'savingThrows'],
    ['Weapon Proficiencies', 'weaponProficiencies'],
    ['Non-weapon Proficiencies', 'nonWeaponProficiencies'],
  ]
  const cell = (row: LevelChangeKey, key: keyof LevelChangeRow, label: string) =>
    edit ? (
      <InkInput
        value={t[row][key]}
        label={`${label} ${key === 'by' ? 'by' : 'at levels'}`}
        onChange={(v) =>
          edit((x) => {
            // Grava a tabela como ela aparece (as linhas calculadas incluídas).
            const table = shownTable(x)
            x.levelChanges = { ...table, [row]: { ...table[row], [key]: v } }
          })
        }
      />
    ) : (
      dash(t[row][key])
    )
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
            <tr key={row}>
              <td className="rec-row-label">{label}</td>
              <td className="rec-value">{cell(row, 'by', label)}</td>
              <td className="rec-value">{cell(row, 'atLevels', label)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

type QuantityKey = 'page2MagicItems' | 'page2TreasureItems'

// Tabela de verdade (uma linha por item), como o QuantityListBlock do iPad:
// nome, marcas de uso e "usados de N".
/** Um item no seletor de Magic Items: do livro, ou criado (mestre ou jogador), que vem primeiro. */
type MagicChoice = MagicItemIndexEntry & { custom?: CustomItemRow }

const signedAC = (n: number) => (n > 0 ? `+${n}` : `−${-n}`)

/**
 * Bônus de AC do item mágico (2026-10-24): o digitado ou o sugerido (item
 * criado, "+N" do nome de armadura, escudo ou item de proteção) e se está em
 * uso; o que está em uso entra na CA da página 1 (src/rules/armorClass.ts).
 */
function ItemACCell({ item, set }: { item: QuantifiedItem; set?: (patch: Partial<QuantifiedItem>) => void }) {
  const bonus = lineACBonus(item)
  const suggested = suggestedACBonus(item)
  const worn = item.worn !== false
  // O texto enquanto digita ("-" ou "+" sozinhos ainda não são número).
  const [draft, setDraft] = useState<string | null>(null)
  if (!set) {
    return (
      <td className="item-ac">
        {bonus ? (
          <span className={worn ? 'rec-value' : 'rec-soft'} title={worn ? 'AC bonus (in use)' : 'AC bonus (not worn)'}>
            AC {signedAC(bonus)}
            {!worn && ' · stored'}
          </span>
        ) : null}
      </td>
    )
  }
  return (
    <td className="item-ac">
      <span className="item-ac-edit">
        <span className="rec-soft">AC</span>
        <InkInput
          className="ink-short"
          value={draft ?? (item.acBonus == null ? '' : signedAC(item.acBonus))}
          placeholder={suggested ? signedAC(suggested) : '—'}
          label={`${item.name || 'Item'} AC bonus`}
          onChange={(v) => {
            setDraft(v)
            const t = v.trim().replace('−', '-')
            if (t === '') set({ acBonus: null })
            else if (/^[+-]?\d{1,2}$/.test(t)) set({ acBonus: parseInt(t, 10) })
          }}
        />
        {bonus ? (
          <label className="item-ac-worn" title="Counts in Armor Class while worn">
            <input type="checkbox" checked={worn} onChange={(e) => set({ worn: e.target.checked ? null : false })} /> worn
          </label>
        ) : null}
      </span>
    </td>
  )
}

function QuantityList({
  title,
  items,
  field,
  edit,
  campaignID = null,
}: {
  title: string
  items: QuantifiedItem[] | null | undefined
  field: QuantityKey
  edit?: Edit
  /** Campanha da ficha: os itens criados dela entram no seletor. */
  campaignID?: string | null
}) {
  const rows = items ?? []
  const [picking, setPicking] = useState(false)
  // Itens mágicos: a descrição do compêndio (pelo id do seletor, ou pelo nome exato se foi digitado).
  const isMagic = field === 'page2MagicItems'
  const [index, setIndex] = useState<MagicItemIndexEntry[] | null>(null)
  const [detail, setDetail] = useState<MagicItemIndexEntry | null>(null)
  useEffect(() => {
    if (!isMagic || rows.length === 0 || index) return
    let cancelled = false
    void loadMagicIndex().then((list) => {
      if (!cancelled) setIndex(list)
    })
    return () => {
      cancelled = true
    }
  }, [isMagic, rows.length, index])
  const entryOf = (item: QuantifiedItem) =>
    index?.find((e) => e.id === item.matchedItemID) ?? (item.name.trim() !== '' ? index?.find((e) => normalize(e.name) === normalize(item.name)) : undefined) ?? null

  // Itens criados (2026-10-24): a linha guarda uma cópia; quem pode editar a
  // ficha a atualiza ao abrir, se o item mudou (decisão do usuário).
  const { session } = useAuth()
  const userID = session?.user.id ?? null
  const [customRows, setCustomRows] = useState<CustomItemRow[]>([])
  const [customDetail, setCustomDetail] = useState<QuantifiedItem | null>(null)
  const [editor, setEditor] = useState<{ row: CustomItemRow | null } | null>(null)
  const customIDs = rows.flatMap((r) => (r.customItem ? [r.customItem.id] : [])).join(',')
  const refresh = useEffectEvent((list: CustomItemRow[]) => {
    setCustomRows(list)
    const probe = { page2MagicItems: structuredClone(rows) }
    if (edit && refreshCustomItems(probe, list)) edit((x) => void refreshCustomItems(x, list))
  })
  useEffect(() => {
    if (!isMagic || !userID || customIDs === '') return
    let cancelled = false
    void fetchCustomItemsByID(customIDs.split(','))
      .then((list) => {
        if (!cancelled) refresh(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isMagic, userID, customIDs])
  const rowOf = (item: QuantifiedItem) => customRows.find((r) => sameID(r.id, item.customItem?.id)) ?? null
  const loadChoices = async (): Promise<MagicChoice[]> => {
    const [custom, book] = await Promise.all([userID ? fetchCustomItems(userID, campaignID).catch(() => []) : Promise.resolve([]), loadMagicIndex()])
    const mine = custom.map((r) => ({
      id: `custom:${r.id}`,
      name: r.data.name,
      category: `Homebrew · ${r.data.category ?? 'Miscellaneous'}${r.visibility === 'campaign' ? ' · campaign' : ''}`,
      books: [],
      summary: r.data.summary ?? '',
      file: '',
      custom: r,
    }))
    return [...mine, ...book]
  }
  const addCustom = (row: CustomItemRow) =>
    edit?.((x) => void (x[field] = [...(x[field] ?? []), { id: newID(), name: row.data.name, quantity: 1, matchedItemID: null, customItem: customSnapshot(row) }]))
  async function saveCustom(data: CustomMagicItemData, visibility: CustomItemVisibility) {
    if (!userID || !editor) return
    if (!editor.row) {
      addCustom(await createCustomItem(userID, campaignID, visibility, data))
    } else {
      const saved = await updateCustomItem(editor.row, data, visibility)
      setCustomRows((list) => list.map((r) => (sameID(r.id, saved.id) ? saved : r)))
      edit?.((x) => void refreshCustomItems(x, [saved]))
    }
    setEditor(null)
  }

  const add = (name: string, matchedItemID: string | null) =>
    edit?.((x) => void (x[field] = [...(x[field] ?? []), { id: newID(), name, quantity: 1, matchedItemID }]))
  const set = (id: string, patch: Partial<QuantifiedItem>) =>
    edit?.((x) => void (x[field] = (x[field] ?? []).map((q) => (q.id === id ? { ...q, ...patch } : q))))
  return (
    <SheetBlock title={title} trailing={String(rows.length)}>
      <table className="sheet-rows">
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="rec-soft">—</td>
            </tr>
          )}
          {rows.map((item) => {
            const used = item.usedCount ?? 0
            const exhausted = item.quantity > 0 && used >= item.quantity
            const entry = isMagic && !item.customItem ? entryOf(item) : null
            // Abre a descrição: a do item criado (a cópia da ficha, ou a do banco se já chegou) ou a do livro.
            const open = item.customItem ? () => setCustomDetail(item) : entry ? () => setDetail(entry) : null
            return (
              <tr key={item.id}>
                <td className="rec-value sheet-rows-name">
                  {edit ? (
                    <span className="row-with-remove">
                      <InkInput value={item.name} label={`${title} item`} placeholder="…" onChange={(v) => set(item.id, { name: v, matchedItemID: null })} />
                      {open && (
                        <button className="info-btn" aria-label={`About ${item.name}`} title="Read the item description" onClick={open}>
                          ⓘ
                        </button>
                      )}
                    </span>
                  ) : open ? (
                    <button className="memorized-link" title="Read the item description" onClick={open}>
                      {item.name}
                    </button>
                  ) : (
                    item.name || <span className="rec-soft">…</span>
                  )}
                  {item.customItem && <span className="rec-auto-tag">homebrew</span>}
                </td>
                <td className="sheet-rows-tally">
                  {edit ? (
                    <TallyBoard count={used} exhausted={exhausted} label={item.name || title} onChange={(n) => set(item.id, { usedCount: n })} />
                  ) : (
                    <TallyMarks count={used} exhausted={exhausted} />
                  )}
                </td>
                <td className="sheet-rows-count">
                  <span className={exhausted ? 'rec-value rec-red' : 'rec-value'}>{used}</span>
                  <span className="rec-soft"> of </span>
                  {edit ? (
                    <InkNumber className="ink-short" value={item.quantity} min={0} max={9999} label={`${item.name} quantity`} onChange={(v) => set(item.id, { quantity: v })} />
                  ) : (
                    <span className="rec-value">{item.quantity}</span>
                  )}
                </td>
                {isMagic && <ItemACCell item={item} set={edit ? (patch) => set(item.id, patch) : undefined} />}
                {edit && (
                  <td className="remove-cell">
                    <RowRemove label={`Remove ${item.name || 'this line'}`} onClick={() => edit((x) => void (x[field] = (x[field] ?? []).filter((q) => q.id !== item.id)))} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* Itens mágicos vêm do compêndio (MagicItemPickerSheet); outras posses, linha em branco. */}
      {edit && (
        <span className="add-line-row">
          <AddLine label="add" onClick={() => (field === 'page2MagicItems' ? setPicking(true) : add('', null))} />
          {/* Item criado pelo mestre ou pelo jogador (precisa da conta: fica no servidor). */}
          {isMagic && userID && <AddLine label="new item" onClick={() => setEditor({ row: null })} />}
        </span>
      )}
      {picking && (
        <CompendiumPicker<MagicChoice>
          title="Add a magic item"
          load={loadChoices}
          hint={(i) => i.category}
          onChoose={(i) => {
            if (i.custom) addCustom(i.custom)
            else add(i.name, i.id)
            setPicking(false)
          }}
          onTyped={(name) => {
            add(name, null)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
      {detail && createPortal(<MagicItemDetail entry={detail} onClose={() => setDetail(null)} />, document.body)}
      {customDetail?.customItem && (
        <CustomItemDetail
          data={rowOf(customDetail)?.data ?? customDetail.customItem.data}
          onEdit={
            edit && rowOf(customDetail) && sameID(rowOf(customDetail)!.owner_id, userID)
              ? () => {
                  setEditor({ row: rowOf(customDetail) })
                  setCustomDetail(null)
                }
              : undefined
          }
          onClose={() => setCustomDetail(null)}
        />
      )}
      {editor && (
        <CustomItemEditor
          initial={editor.row?.data ?? emptyCustomItem()}
          initialVisibility={editor.row?.visibility ?? 'private'}
          inCampaign={!!(editor.row?.campaign_id ?? campaignID)}
          isNew={!editor.row}
          onSave={saveCustom}
          onDelete={
            editor.row
              ? async () => {
                  await deleteCustomItem(editor.row!)
                  setEditor(null)
                }
              : undefined
          }
          onClose={() => setEditor(null)}
        />
      )}
    </SheetBlock>
  )
}

// ListBlock do iPad: uma linha por item, em tabela.
function TextList({ title, items, field, edit }: { title: string; items: string[]; field: 'languages' | 'allies'; edit?: Edit }) {
  return (
    <SheetBlock title={title} trailing={String(items.length)}>
      <table className="sheet-rows">
        <tbody>
          {items.length === 0 && (
            <tr>
              <td className="rec-soft">—</td>
            </tr>
          )}
          {items.map((item, index) => (
            <tr key={index}>
              <td className="rec-value sheet-rows-name">
                {edit ? (
                  <InkInput
                    value={item}
                    label={title}
                    placeholder="…"
                    onChange={(v) => edit((x) => void (x[field] = x[field].map((old, i) => (i === index ? v : old))))}
                  />
                ) : (
                  item || <span className="rec-soft">…</span>
                )}
              </td>
              {edit && (
                <td className="remove-cell">
                  <RowRemove label={`Remove ${item || 'this line'}`} onClick={() => edit((x) => void (x[field] = x[field].filter((_, i) => i !== index)))} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <AddLine label="add" onClick={() => edit((x) => void (x[field] = [...x[field], '']))} />}
    </SheetBlock>
  )
}

type CoinKey = 'platinum' | 'gold' | 'electrum' | 'silver' | 'copper'

function Treasure({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const t = c.treasure
  const coin = (label: string, key: CoinKey) =>
    edit ? (
      <NumberCell label={label} value={t[key]} min={0} onChange={(v) => edit((x) => void (x.treasure = { ...x.treasure, [key]: v }))} />
    ) : (
      <Cell label={label} value={t[key]} />
    )
  return (
    <SheetBlock title="Treasure" trailing="coins">
      <div className="rec-lines rec-lines-5">
        {coin('PP', 'platinum')}
        {coin('GP', 'gold')}
        {coin('EP', 'electrum')}
        {coin('SP', 'silver')}
        {coin('CP', 'copper')}
      </div>
    </SheetBlock>
  )
}

function WildTalent({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const talent = c.wildTalent
  if (!talent || (talent.powers.length === 0 && talent.psionicStrengthPoints === 0)) return null
  return (
    <SheetBlock title="Wild Talent" trailing={String(talent.powers.length)}>
      <p className="rec-soft rec-inline-edit">
        PSPs:{' '}
        {edit ? (
          <InkNumber
            className="ink-short"
            value={talent.psionicStrengthPoints}
            min={0}
            max={999}
            label="Psionic strength points"
            onChange={(v) => edit((x) => void (x.wildTalent = { ...(x.wildTalent ?? { powers: [] }), psionicStrengthPoints: v }))}
          />
        ) : (
          talent.psionicStrengthPoints
        )}
      </p>
      <table className="sheet-rows">
        <tbody>
          {talent.powers.map((power, index) => (
            <tr key={index}>
              <td className="rec-value sheet-rows-name">
                {edit ? (
                  <InkInput
                    value={power}
                    label="Wild talent power"
                    placeholder="power name…"
                    onChange={(v) =>
                      edit((x) => {
                        if (x.wildTalent) x.wildTalent = { ...x.wildTalent, powers: x.wildTalent.powers.map((p, i) => (i === index ? v : p)) }
                      })
                    }
                  />
                ) : (
                  power || <span className="rec-soft">…</span>
                )}
              </td>
              {edit && (
                <td className="remove-cell">
                  <RowRemove
                    label={`Remove ${power || 'this power'}`}
                    onClick={() => edit((x) => void (x.wildTalent && (x.wildTalent = { ...x.wildTalent, powers: x.wildTalent.powers.filter((_, i) => i !== index) })))}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <AddLine label="power" onClick={() => edit((x) => void (x.wildTalent = { ...(x.wildTalent ?? { psionicStrengthPoints: 0, powers: [] }), powers: [...(x.wildTalent?.powers ?? []), ''] }))} />}
    </SheetBlock>
  )
}

export function RecordPageTwo({ character: c, edit, campaignID = null }: { character: PlayerCharacter; edit?: Edit; campaignID?: string | null }) {
  return (
    <div className="rec-sheet">
      <Armor c={c} edit={edit} />
      <Equipment c={c} edit={edit} />
      <div className="rec-two">
        <div className="rec-stack">
          <Movement c={c} edit={edit} />
          <Encumbrance c={c} edit={edit} />
        </div>
        <div className="rec-stack">
          <Experience c={c} edit={edit} />
          <LevelChanges c={c} edit={edit} />
        </div>
      </div>
      <QuantityList title="Magic Items" items={c.page2MagicItems} field="page2MagicItems" edit={edit} campaignID={campaignID} />
      <QuantityList title="Treasure / Other Possessions" items={c.page2TreasureItems} field="page2TreasureItems" edit={edit} />
      <div className="rec-three">
        <Treasure c={c} edit={edit} />
        <TextList title="Languages" items={c.languages} field="languages" edit={edit} />
        <TextList title="Allies & Henchmen" items={c.allies} field="allies" edit={edit} />
      </div>
      <WildTalent c={c} edit={edit} />
    </div>
  )
}
