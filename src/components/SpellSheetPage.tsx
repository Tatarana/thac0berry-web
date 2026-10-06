import { useEffect, useMemo, useState } from 'react'
import { damageText, findSpellEntry, loadSpell, shortCastingTime, type Spell, type SpellIndexEntry } from '../data/spells'
import type { ServerSheet } from '../lib/useSpellSheets'
import { bonusSpellTotals } from '../rules/rules'
import { assignSlot, clearSlot, toggleSpent } from '../rules/spellSheets'
import type { CharacterClass, PlayerCharacter, SpellSlot } from '../types/library'
import { InkInput, InkNumber, SheetBlock, TallyMarks } from './SheetBits'
import { SlotEditor } from './SlotEditor'
import { SpellDetail } from './SpellDetail'

// Uma folha de magias (um dia de jogo): SpellSheetView do iPad. Cabeçalho,
// um bloco por círculo (bolinhas dos slots + tabela de memorizadas com Cast
// e Dmg/Heal), Turn Undead (sacerdote), magias de itens mágicos e magias
// adicionais. Clicar numa magia abre o detalhe do compêndio. As anotações à
// caneta (inkNotes, PencilKit) não aparecem.
//
// Com `edit` (W2.5c1): título do dia; bolinha do slot abre o seletor de magia
// (SlotEditor); riscar a magia gasta (no iPad, um traço de caneta sobre a
// linha; aqui, o botão ✕ da linha); contadores com − e + (no iPad, riscos de
// caneta). Dia novo e incluir/remover linhas entram na W2.5c2.

/** Aplica uma mudança nesta folha (a página grava sozinha). */
export type SheetEdit = (mutate: (s: ServerSheet) => void) => void

/** Marcas de contagem com − e +: o equivalente, no navegador, a riscar com a caneta. */
function Counter({ count, exhausted, min = 0, label, onChange }: { count: number; exhausted: boolean; min?: number; label: string; onChange?: (n: number) => void }) {
  if (!onChange) return <TallyMarks count={count} exhausted={exhausted} />
  return (
    <span className="counter">
      <button className="counter-btn" aria-label={`${label}: one less`} disabled={count <= min} onClick={() => onChange(count - 1)}>
        −
      </button>
      <TallyMarks count={count} exhausted={exhausted} />
      <button className="counter-btn" aria-label={`${label}: one more`} onClick={() => onChange(count + 1)}>
        +
      </button>
    </span>
  )
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

/** Muda uma magia de item (usos, máximo, dano). */
function setItemSpell(s: ServerSheet, itemID: string, useID: string, patch: { usedCount?: number; maxUses?: number; damageNote?: string }) {
  s.magicItems = s.magicItems.map((item) =>
    item.id === itemID ? { ...item, spells: item.spells.map((u) => (u.id === useID ? { ...u, ...patch } : u)) } : item,
  )
}

function casterTitle(characterClass: CharacterClass): string {
  if (characterClass === 'Mage' || characterClass === 'Mago') return 'Wizard'
  if (characterClass === 'Bard' || characterClass === 'Bardo') return 'Bard'
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
  bonus,
  slots,
  spells,
  casterLevel,
  onOpen,
  onPick,
  onStrike,
}: {
  level: number
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
  const title =
    bonus > 0
      ? `Level ${level} - ${slots.length} Slots (${Math.max(slots.length - bonus, 0)}+${bonus})`
      : `Level ${level} · ${slots.length} slots`
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
  characterClass,
  level,
  edit,
  character,
  favorites,
  usage,
}: {
  sheet: ServerSheet
  characterName: string
  characterClass: CharacterClass
  level: number
  edit?: SheetEdit
  /** Esferas e grimório (para o seletor de magia). */
  character?: Pick<PlayerCharacter, 'sphereAccess' | 'wizardSpellbook'>
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
      level: lvl,
      // Bônus pela Sabedoria do dia em que a folha foi criada, como no iPad.
      bonus: caster === 'divine' ? (bonusSpellTotals(sheet.wisdomAtCreation)?.[lvl] ?? 0) : 0,
      slots: sheet.slotBoard.slots.filter((s) => s.caster === caster && s.level === lvl),
    }))
  })
  const hasDivine = sheet.slotBoard.slots.some((s) => s.caster === 'divine')
  const isArcane = ['Mage', 'Mago', 'Bard', 'Bardo'].includes(characterClass)
  const dayTitle = sheet.title || new Date(sheet.date).toLocaleDateString('en-US', { dateStyle: 'medium' })

  return (
    <div className="spell-sheet">
      <header className="spell-sheet-header">
        <div className="spell-sheet-title">
          <span className="rec-cell-label rec-left-label">{casterTitle(characterClass)} Spell Sheet — Game Day</span>
          {edit ? (
            <InkInput className="spell-sheet-day" value={sheet.title} placeholder={dayTitle} label="Game day" onChange={(v) => edit((s) => void (s.title = v))} />
          ) : (
            <span className="rec-value spell-sheet-day">{dayTitle}</span>
          )}
        </div>
        <div className="spell-sheet-who">
          <span className="rec-cell-label">Character</span>
          <span className="rec-value">
            {characterName || 'Unnamed Character'} · {characterClass} {level}
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
            bonus={circle.bonus}
            slots={circle.slots}
            spells={spells}
            casterLevel={level}
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
              <span className="rec-value">{item.name || 'item name'}</span>
              {item.itemDescription && <p className="rec-soft">{item.itemDescription}</p>}
            </div>
            <table className="sheet-rows">
              <tbody>
                {item.spells.map((use) => {
                  const resolved = use.matchedSpellID ? spells.get(use.matchedSpellID) : undefined
                  const exhausted = use.usedCount >= use.maxUses
                  return (
                    <tr key={use.id}>
                      <td className="rec-value sheet-rows-name">
                        {resolved ? (
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </SheetBlock>

      <SheetBlock title="Additional Spells" trailing="write the spell with the pencil">
        {sheet.entries.length === 0 ? (
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
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
