import { useEffect, useMemo, useState } from 'react'
import { damageText, findSpellEntry, loadSpell, shortCastingTime, type Spell, type SpellIndexEntry } from '../data/spells'
import type { ServerSheet } from '../lib/useSpellSheets'
import { casterLevel, classLabel, formerLabel, levelLabel } from '../rules/multiclass'
import { bonusSpellTotals, canonicalClass, hasSpellSheet, isArcaneCaster } from '../rules/rules'
import { assignSlot, clearSlot, logCast, spellMatches, toggleSpent } from '../rules/spellSheets'
import type { CharacterClass, ClassLevel, PlayerCharacter, SpellSlot } from '../types/library'
import { InkInput, InkNumber, SheetBlock, TallyBoard, TallyMarks } from './SheetBits'
import { SlotEditor } from './SlotEditor'
import { useSpellChoices, type Caster } from '../lib/spellChoices'
import { SpellNameField, SpellSuggestions } from './SpellAutocomplete'
import { SpellDetail } from './SpellDetail'

// Uma folha de magias (um dia de jogo): SpellSheetView do iPad. Cabeçalho,
// um bloco por círculo (bolinhas dos slots + tabela de memorizadas com Cast
// e Dmg/Heal), Turn Undead (sacerdote), magias de itens mágicos e magias
// adicionais. Clicar numa magia abre o detalhe do compêndio. As anotações à
// caneta (inkNotes, PencilKit) não aparecem.
//
// Com `edit` (W2.5c1): título do dia; bolinha do slot abre o seletor de magia
// (SlotEditor); riscar a magia gasta (no iPad, um traço de caneta sobre a
// linha; aqui, o botão ✕ da linha); contadores de riscos (TallyBoard: a caixa
// soma, o risco tira; no iPad, riscos de caneta). W2.5c2: dia novo, registrar conjuração nas magias adicionais (com
// sugestões), e incluir/remover magias adicionais, itens e magias de item.

/** Aplica uma mudança nesta folha (a página grava sozinha). */
export type SheetEdit = (mutate: (s: ServerSheet) => void) => void

/** Contador de riscos padrão (TallyBoard): a caixa soma um, um risco tira um; `min` é o piso. */
function Counter({ count, exhausted, min = 0, label, onChange }: { count: number; exhausted: boolean; min?: number; label: string; onChange?: (n: number) => void }) {
  if (!onChange) return <TallyMarks count={count} exhausted={exhausted} />
  return <TallyBoard count={count} exhausted={exhausted} label={label} onChange={(n) => onChange(Math.max(min, n))} />
}

interface Resolved {
  entry: SpellIndexEntry
  spell: Spell | undefined
}

/** Carrega (do compêndio) as magias que a folha cita pelo id. */
function useSpells(ids: string[]) {
  const [spells, setSpells] = useState<Map<string, Resolved>>(new Map())
  const key = ids.join('|')
  useEffect(() => {
    let cancelled = false
    void Promise.all(
      key
        .split('|')
        .filter(Boolean)
        .map(async (id) => {
          const entry = await findSpellEntry(id)
          return entry ? ([id, { entry, spell: await loadSpell(entry) }] as const) : null
        }),
    ).then((pairs) => {
      if (!cancelled) setSpells(new Map(pairs.filter((p): p is NonNullable<typeof p> => p !== null)))
    })
    return () => {
      cancelled = true
    }
  }, [key])
  return spells
}

const casterOrder = ['arcane', 'divine'] as const

const newID = () => crypto.randomUUID().toUpperCase()

/** Botão "×" de remover linha (RemoveRowButton do iPad). */
function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="remove-btn" aria-label={label} title={label} onClick={onClick}>
      ×
    </button>
  )
}

/**
 * Linha de escrever das magias adicionais (AdditionalSpellsBlock do iPad):
 * escreve a magia, escolhe entre as parecidas ou registra o texto como magia
 * livre ("custom"); Enter aceita a melhor quando ela é forte (≥ 0,72).
 * Só as magias do tipo de conjurador da folha (pedido do usuário: na folha
 * de sacerdote, só magias de sacerdote).
 */
function CastLogger({ casters, onLog }: { casters: Caster[]; onLog: (name: string, spell: { id: string; level: number } | null, rawText: string) => void }) {
  const [text, setText] = useState('')
  const choices = useSpellChoices(casters)
  const log = (name: string, spell: { id: string; level: number } | null) => {
    onLog(name, spell, text)
    setText('')
  }
  return (
    <div className="cast-logger">
      <input
        className="ink-input"
        value={text}
        placeholder="cast…"
        aria-label="Log a cast spell"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || text.trim() === '') return
          const best = spellMatches(text, choices, 1)[0]
          if (best && best.score >= 0.72) log(best.spell.name, best.spell)
        }}
      />
      <SpellSuggestions
        text={text}
        choices={choices}
        showCaster={casters.length > 1}
        customLabel={(typed) => `log "${typed}" (custom spell)`}
        onPick={(name, spell) => log(name, spell)}
      />
    </div>
  )
}

/** Muda uma magia de item (usos, máximo, dano). */
function setItemSpell(
  s: ServerSheet,
  itemID: string,
  useID: string,
  patch: { usedCount?: number; maxUses?: number; damageNote?: string; spellName?: string; matchedSpellID?: string | null },
) {
  s.magicItems = s.magicItems.map((item) =>
    item.id === itemID ? { ...item, spells: item.spells.map((u) => (u.id === useID ? { ...u, ...patch } : u)) } : item,
  )
}

function casterTitle(characterClass: CharacterClass): string {
  const cls = canonicalClass(characterClass)
  if (cls === 'Mage') return 'Wizard'
  if (cls === 'Bard') return 'Bard'
  return 'Priest'
}

function SlotDots({ slots, onPick }: { slots: SpellSlot[]; onPick?: (slot: SpellSlot) => void }) {
  return (
    <span className="slot-dots">
      {slots.map((slot) =>
        onPick ? (
          <button
            key={slot.id}
            className={slot.isSpent ? 'slot-dot slot-dot-spent' : 'slot-dot'}
            aria-label={`Change the spell in this slot${slot.isSpent ? ' (used)' : ''}`}
            onClick={() => onPick(slot)}
          >
            {slot.isSpent ? '✕' : ''}
          </button>
        ) : (
          <span key={slot.id} className={slot.isSpent ? 'slot-dot slot-dot-spent' : 'slot-dot'}>
            {slot.isSpent ? '✕' : ''}
          </span>
        ),
      )}
    </span>
  )
}

function CircleBlock({
  level,
  casterName,
  bonus,
  slots,
  spells,
  casterLevel,
  onOpen,
  onPick,
  onStrike,
}: {
  level: number
  /** Multiclasse com magia arcana e divina na mesma folha: "Wizard" ou "Priest" antes do círculo. */
  casterName?: string
  /** Slots de bônus de Sabedoria neste círculo (sacerdote); 0 para arcano. */
  bonus: number
  slots: SpellSlot[]
  spells: Map<string, Resolved>
  casterLevel: number
  onOpen: (entry: SpellIndexEntry) => void
  /** Editando: abre o seletor de magia do slot. */
  onPick?: (slot: SpellSlot) => void
  /** Editando: risca (ou desfaz) a magia gasta. */
  onStrike?: (slot: SpellSlot) => void
}) {
  // Igual ao iPad: com bônus de Sabedoria, separa base e bônus.
  const prefix = casterName ? `${casterName} ` : ''
  const title =
    bonus > 0
      ? `${prefix}Level ${level} - ${slots.length} Slots (${Math.max(slots.length - bonus, 0)}+${bonus})`
      : `${prefix}Level ${level} · ${slots.length} slots`
  return (
    <section className="circle-block">
      <header className={slots.length > 5 ? 'circle-bar circle-bar-wrap' : 'circle-bar'}>
        <span>{title}</span>
        <SlotDots slots={slots} onPick={onPick} />
      </header>
      <table className="memorized">
        <thead>
          <tr>
            {onStrike && <th className="memorized-strike" aria-label="Used" />}
            <th className="memorized-name">Memorized Spell</th>
            <th>Cast</th>
            <th>Dmg/Heal</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const resolved = slot.preparedSpellID ? spells.get(slot.preparedSpellID) : undefined
            const spell = resolved?.spell
            const name = spell?.name ?? (slot.preparedSpellName || null)
            const dmg = spell?.damageDice ? damageText(spell.damageDice, casterLevel) : spell?.damage ? '*' : null
            return (
              <tr key={slot.id} className={slot.isSpent ? 'memorized-spent' : undefined}>
                {onStrike && (
                  <td className="memorized-strike">
                    {name !== null && (
                      <button
                        className={slot.isSpent ? 'strike-btn strike-on' : 'strike-btn'}
                        aria-label={slot.isSpent ? `${name}: not used` : `${name}: used`}
                        title={slot.isSpent ? 'unmark as used' : 'strike (used)'}
                        onClick={() => onStrike(slot)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                )}
                <td className="memorized-name">
                  {name === null ? (
                    onPick ? (
                      <button className="memorized-link memorized-empty" onClick={() => onPick(slot)}>
                        write the spell
                      </button>
                    ) : (
                      <span className="rec-soft">—</span>
                    )
                  ) : resolved ? (
                    <button className="memorized-link" onClick={() => onOpen(resolved.entry)}>{name}</button>
                  ) : (
                    <span>{name}</span>
                  )}
                </td>
                <td>{spell ? shortCastingTime(spell.castingTime) : '—'}</td>
                <td>{dmg ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function TurnUndead({ used, onChange }: { used: number; onChange?: (n: number) => void }) {
  return (
    <section className="circle-block">
      <header className="circle-bar turn-bar">
        <span>
          <span className="turn-cross">✝</span> Turn Undead
        </span>
      </header>
      <div className="turn-body">
        <span className="rec-cell-label">Attempts</span>
        <Counter count={used} exhausted={false} label="Turn Undead attempts" onChange={onChange} />
        <span className="rec-value">{used}</span>
      </div>
    </section>
  )
}

export function SpellSheetPage({
  sheet,
  characterName,
  classes,
  edit,
  character,
  favorites,
  usage,
}: {
  sheet: ServerSheet
  characterName: string
  /** As classes do personagem (a principal primeiro); multiclasse tem mais de uma. */
  classes: ClassLevel[]
  edit?: SheetEdit
  /** Esferas e grimório (para o seletor de magia). */
  character?: Pick<PlayerCharacter, 'sphereAccess' | 'wizardSpellbook' | 'formerClasses'>
  favorites?: Set<string>
  /** Quantas vezes cada magia foi memorizada, em todas as folhas. */
  usage?: Map<string, number>
}) {
  const [open, setOpen] = useState<SpellIndexEntry | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  const pickedSlot = picking ? sheet.slotBoard.slots.find((s) => s.id === picking) ?? null : null
  const ids = useMemo(() => {
    const set = new Set<string>()
    for (const slot of sheet.slotBoard.slots) if (slot.preparedSpellID) set.add(slot.preparedSpellID)
    for (const entry of sheet.entries) if (entry.matchedSpellID) set.add(entry.matchedSpellID)
    for (const item of sheet.magicItems) for (const use of item.spells) if (use.matchedSpellID) set.add(use.matchedSpellID)
    return [...set].sort()
  }, [sheet])
  const spells = useSpells(ids)

  // Círculos na ordem do iPad: conjurador (arcane, divine) e nível; slots na
  // ordem gravada (o iPad já grava ordenado por orderKey).
  const circles = casterOrder.flatMap((caster) => {
    const levels = [...new Set(sheet.slotBoard.slots.filter((s) => s.caster === caster).map((s) => s.level))].sort((a, b) => a - b)
    return levels.map((lvl) => ({
      key: `${caster}-${lvl}`,
      caster,
      level: lvl,
      // Bônus pela Sabedoria do dia em que a folha foi criada, como no iPad.
      bonus: caster === 'divine' ? (bonusSpellTotals(sheet.wisdomAtCreation)?.[lvl] ?? 0) : 0,
      slots: sheet.slotBoard.slots.filter((s) => s.caster === caster && s.level === lvl),
    }))
  })
  const hasDivine = sheet.slotBoard.slots.some((s) => s.caster === 'divine')
  // Classes que conjuram (multiclasse: cada tipo de magia pelo nível da sua classe).
  const who = { characterClass: classes[0].characterClass, level: classes[0].level, multiClasses: classes.slice(1) }
  const casters = classes.filter((k) => hasSpellSheet(k.characterClass))
  const casterOf = (caster: Caster) => casters.find((k) => isArcaneCaster(k.characterClass) === (caster === 'arcane'))
  // Conjuradores da folha (pelos slots; sem slots, pela classe).
  const slotCasters = casterOrder.filter((caster) => sheet.slotBoard.slots.some((s) => s.caster === caster))
  const sheetCasters: Caster[] =
    slotCasters.length > 0 ? [...slotCasters] : casters.length > 0 ? [...new Set(casters.map((k) => (isArcaneCaster(k.characterClass) ? 'arcane' : 'divine') as Caster))] : ['divine']
  const both = sheetCasters.length > 1
  const titleOf = (caster: Caster) => {
    const k = casterOf(caster)
    return k ? casterTitle(k.characterClass) : caster === 'arcane' ? 'Wizard' : 'Priest'
  }
  // O atributo gravado na folha: Sabedoria se há magia divina, senão Inteligência.
  const isArcane = !sheetCasters.includes('divine')
  const dayTitle = sheet.title || new Date(sheet.date).toLocaleDateString('en-US', { dateStyle: 'medium' })

  return (
    <div className="spell-sheet">
      <header className="spell-sheet-header">
        <div className="spell-sheet-title">
          <span className="rec-cell-label rec-left-label">{sheetCasters.map(titleOf).join('/')} Spell Sheet — Game Day</span>
          {edit ? (
            <InkInput className="spell-sheet-day" value={sheet.title} placeholder={dayTitle} label="Game day" onChange={(v) => edit((s) => void (s.title = v))} />
          ) : (
            <span className="rec-value spell-sheet-day">{dayTitle}</span>
          )}
        </div>
        <div className="spell-sheet-who">
          <span className="rec-cell-label">Character</span>
          <span className="rec-value">
            {characterName || 'Unnamed Character'} ·{' '}
            {(character?.formerClasses ?? []).length > 0
              ? // Classe dupla (MC4b): "Mage 1 · ex-Cleric 3", não "Mage/Cleric 1/3".
                `${classes[0].characterClass} ${classes[0].level} · ${formerLabel({ ...classes[0], formerClasses: character?.formerClasses })}`
              : `${classes.length > 1 ? classLabel(who) : classes[0].characterClass} ${levelLabel(who)}`}
          </span>
        </div>
        <div className="spell-sheet-who">
          <span className="rec-cell-label">{isArcane ? 'Intelligence' : 'Wisdom'}</span>
          <span className="rec-value">{sheet.wisdomAtCreation}</span>
        </div>
      </header>

      <div className="circle-grid">
        {circles.map((circle) => (
          <CircleBlock
            key={circle.key}
            level={circle.level}
            casterName={both ? titleOf(circle.caster) : undefined}
            bonus={circle.bonus}
            slots={circle.slots}
            spells={spells}
            casterLevel={casterLevel(who, circle.caster)}
            onOpen={setOpen}
            onPick={edit && ((slot) => setPicking(slot.id))}
            onStrike={edit && ((slot) => edit((s) => toggleSpent(s, slot.id)))}
          />
        ))}
        {hasDivine && <TurnUndead used={sheet.turnUndeadUsed} onChange={edit && ((n) => edit((s) => void (s.turnUndeadUsed = n)))} />}
      </div>
      {circles.length === 0 && <p className="rec-soft">No spell slots on this sheet.</p>}

      <SheetBlock title="Magic Item Spells" trailing="rings, wands, staves, armor">
        {sheet.magicItems.length === 0 && <p className="rec-soft">No magic items logged for today yet.</p>}
        {sheet.magicItems.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-card-head">
              <span className="rec-cell-label rec-left-label">Item</span>
              {edit ? (
                <span className="item-card-line">
                  <InkInput
                    value={item.name}
                    placeholder="item name"
                    label="Magic item name"
                    onChange={(v) => edit((s) => void (s.magicItems = s.magicItems.map((m) => (m.id === item.id ? { ...m, name: v, matchedItemID: null } : m))))}
                  />
                  <RemoveButton label={`Remove ${item.name || 'this item'}`} onClick={() => edit((s) => void (s.magicItems = s.magicItems.filter((m) => m.id !== item.id)))} />
                </span>
              ) : (
                <span className="rec-value">{item.name || 'item name'}</span>
              )}
              {edit ? (
                <textarea
                  className="ink-input ink-area item-description"
                  value={item.itemDescription}
                  placeholder="description"
                  aria-label={`${item.name || 'Item'} description`}
                  onChange={(e) => edit((s) => void (s.magicItems = s.magicItems.map((m) => (m.id === item.id ? { ...m, itemDescription: e.target.value } : m))))}
                />
              ) : (
                item.itemDescription && <p className="rec-soft">{item.itemDescription}</p>
              )}
            </div>
            <table className="sheet-rows">
              <tbody>
                {item.spells.map((use) => {
                  const resolved = use.matchedSpellID ? spells.get(use.matchedSpellID) : undefined
                  const exhausted = use.usedCount >= use.maxUses
                  return (
                    <tr key={use.id}>
                      <td className="rec-value sheet-rows-name">
                        {edit ? (
                          // Um item pode lançar qualquer magia: sacerdote e mago, ou livre.
                          <SpellNameField
                            value={use.spellName}
                            placeholder="spell"
                            label={`${item.name || 'Item'} spell`}
                            casters={['divine', 'arcane']}
                            onChange={(name, spellID) => edit((s) => setItemSpell(s, item.id, use.id, { spellName: name, matchedSpellID: spellID }))}
                          />
                        ) : resolved ? (
                          <button className="memorized-link" onClick={() => setOpen(resolved.entry)}>
                            {use.spellName || resolved.entry.name}
                          </button>
                        ) : (
                          use.spellName || <span className="rec-soft">spell</span>
                        )}
                      </td>
                      <td className="sheet-rows-tally">
                        <Counter
                          count={use.usedCount}
                          exhausted={exhausted}
                          label={`${use.spellName || 'Spell'} uses`}
                          onChange={edit && ((n) => edit((s) => setItemSpell(s, item.id, use.id, { usedCount: n })))}
                        />
                      </td>
                      <td className="sheet-rows-count">
                        <span className={exhausted ? 'rec-value rec-red' : 'rec-value'}>{use.usedCount}</span>
                        <span className="rec-soft"> of </span>
                        {edit ? (
                          <InkNumber
                            className="ink-short"
                            value={use.maxUses}
                            min={1}
                            max={99}
                            label={`${use.spellName || 'Spell'} maximum uses`}
                            onChange={(n) => edit((s) => setItemSpell(s, item.id, use.id, { maxUses: n }))}
                          />
                        ) : (
                          <span className="rec-value">{use.maxUses}</span>
                        )}
                      </td>
                      <td className="rec-value item-dmg">
                        {edit ? (
                          <InkInput
                            value={use.damageNote}
                            placeholder="1d6+1"
                            label={`${use.spellName || 'Spell'} damage`}
                            onChange={(v) => edit((s) => setItemSpell(s, item.id, use.id, { damageNote: v }))}
                          />
                        ) : (
                          use.damageNote || '—'
                        )}
                      </td>
                      {edit && (
                        <td className="remove-cell">
                          <RemoveButton
                            label={`Remove ${use.spellName || 'this spell'}`}
                            onClick={() =>
                              edit((s) => void (s.magicItems = s.magicItems.map((m) => (m.id === item.id ? { ...m, spells: m.spells.filter((u) => u.id !== use.id) } : m))))
                            }
                          />
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {edit && (
              <button
                className="paper-link add-line"
                onClick={() =>
                  edit((s) =>
                    void (s.magicItems = s.magicItems.map((m) =>
                      m.id === item.id ? { ...m, spells: [...m.spells, { id: newID(), spellName: '', damageNote: '', maxUses: 20, usedCount: 0 }] } : m,
                    )),
                  )
                }
              >
                + add spell
              </button>
            )}
          </div>
        ))}
        {edit && (
          <button
            className="paper-link add-line"
            onClick={() => edit((s) => void (s.magicItems = [...s.magicItems, { id: newID(), name: '', itemDescription: '', spells: [] }]))}
          >
            + add magic item
          </button>
        )}
      </SheetBlock>

      <SheetBlock title="Additional Spells" trailing="write the spell with the pencil">
        {sheet.entries.length === 0 && !edit ? (
          <p className="rec-soft">—</p>
        ) : (
          <table className="sheet-rows">
            <tbody>
              {sheet.entries.map((entry) => {
                const resolved = entry.matchedSpellID ? spells.get(entry.matchedSpellID) : undefined
                return (
                  <tr key={entry.id}>
                    <td className="rec-value sheet-rows-name">
                      {resolved ? (
                        <button className="memorized-link" onClick={() => setOpen(resolved.entry)}>
                          {entry.displayName}
                        </button>
                      ) : (
                        entry.displayName
                      )}
                      {entry.spellLevel != null && <span className="rec-soft"> · level {entry.spellLevel}</span>}
                    </td>
                    <td className="sheet-rows-tally">
                      <span className="rec-cell-label">Casts</span>
                    </td>
                    <td className="sheet-rows-tally">
                      <Counter
                        count={entry.castCount}
                        exhausted={false}
                        min={1}
                        label={`${entry.displayName} casts`}
                        onChange={edit && ((n) => edit((s) => void (s.entries = s.entries.map((e) => (e.id === entry.id ? { ...e, castCount: n } : e)))))}
                      />
                    </td>
                    <td className="sheet-rows-count rec-value">{entry.castCount}</td>
                    {edit && (
                      <td className="remove-cell">
                        <RemoveButton label={`Remove ${entry.displayName}`} onClick={() => edit((s) => void (s.entries = s.entries.filter((e) => e.id !== entry.id)))} />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {edit && <CastLogger casters={sheetCasters} onLog={(name, spell, rawText) => edit((s) => logCast(s, name, spell, rawText))} />}
      </SheetBlock>

      {open && <SpellDetail entry={open} onClose={() => setOpen(null)} />}
      {edit && pickedSlot && character && (
        <SlotEditor
          slot={pickedSlot}
          character={character}
          favorites={favorites ?? new Set()}
          usage={usage ?? new Map()}
          onAssign={(choice) => {
            edit((s) => assignSlot(s, pickedSlot.id, choice))
            setPicking(null)
          }}
          onClear={() => {
            edit((s) => clearSlot(s, pickedSlot.id))
            setPicking(null)
          }}
          onToggleSpent={() => {
            edit((s) => toggleSpent(s, pickedSlot.id))
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}
