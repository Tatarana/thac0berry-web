import { useEffect, useMemo, useState } from 'react'
import { loadSpellIndex, type SpellIndexEntry } from '../data/spells'
import { normalize, similarity } from '../lib/search'
import { canonicalClass, computedSpellSlotAllotments } from '../rules/rules'
import { isOpposedBySchool, wizardSchools } from '../rules/spellSheets'
import type { PlayerCharacter } from '../types/library'
import type { Edit } from './RecordSheet'
import { InkPicker, SectionTitle } from './SheetBits'

// "My Spellbook" do mago e do bardo (WizardSpellbookEditorSheet do iPad):
// as magias que o personagem conhece, por círculo. Só elas podem ser
// memorizadas na folha de magia. Busca no compêndio arcano para incluir
// (até o maior círculo que a tabela de slots permite, e fora das escolas
// opostas); o que não está no compêndio entra como "free entry" com o
// círculo escolhido. O mago escolhe a especialização: as escolas opostas
// ficam bloqueadas e as magias delas saem do grimório (A5).

const circleLabel = (level: number) => (level === 0 ? 'Cantrip' : `Circle ${level}`)

export function WizardSpellbook({ c, edit }: { c: PlayerCharacter; edit?: Edit }) {
  const [index, setIndex] = useState<SpellIndexEntry[] | null>(null)
  const [query, setQuery] = useState('')
  const [freeLevel, setFreeLevel] = useState(1)

  useEffect(() => {
    void loadSpellIndex().then((all) => setIndex(all.arcane))
  }, [])

  const byID = useMemo(() => new Map((index ?? []).map((e) => [e.id, e])), [index])
  // wizardMaxKnowableCircle: o maior círculo arcano da tabela de slots de hoje.
  const maxCircle = Math.max(0, ...computedSpellSlotAllotments(c).filter((a) => a.caster === 'arcane').map((a) => a.level))
  const school = c.wizardSchool ?? null
  const known = new Set(c.wizardSpellbook.flatMap((e) => (e.matchedSpellID ? [e.matchedSpellID] : [])))
  const typed = query.trim()

  // Busca do iPad: trecho do nome; sem nenhum, as parecidas (≥ 0,5, até 30).
  const allMatches = useMemo(() => {
    const target = normalize(typed)
    if (!index || target === '') return []
    const substring = index.filter((s) => normalize(s.name).includes(target))
    const base = substring.length > 0 ? substring : index.filter((s) => similarity(target, normalize(s.name)) >= 0.5).slice(0, 30)
    return [...base].sort((a, b) => (a.level === b.level ? (a.name < b.name ? -1 : 1) : a.level - b.level))
  }, [index, typed])
  const results = allMatches.filter((s) => s.level <= maxCircle && !isOpposedBySchool(school, s.schools))
  const beyond = allMatches.filter((s) => s.level > maxCircle).length
  const opposed = allMatches.filter((s) => s.level <= maxCircle && isOpposedBySchool(school, s.schools)).length

  const groups = useMemo(() => {
    const levelOf = (e: PlayerCharacter['wizardSpellbook'][number]) => (e.matchedSpellID ? byID.get(e.matchedSpellID)?.level : undefined) ?? e.level ?? 0
    const nameOf = (e: PlayerCharacter['wizardSpellbook'][number]) => (e.matchedSpellID ? byID.get(e.matchedSpellID)?.name : undefined) ?? e.name
    const map = new Map<number, { id: string; name: string; free: boolean }[]>()
    for (const e of c.wizardSpellbook) {
      const list = map.get(levelOf(e)) ?? []
      list.push({ id: e.id, name: nameOf(e), free: !e.matchedSpellID })
      map.set(levelOf(e), list)
    }
    return [...map.entries()].sort(([a], [b]) => a - b).map(([level, entries]) => ({ level, entries: entries.sort((x, y) => (x.name < y.name ? -1 : 1)) }))
  }, [c.wizardSpellbook, byID])

  const toggle = (spell: SpellIndexEntry) =>
    edit?.((x) => {
      if (x.wizardSpellbook.some((e) => e.matchedSpellID === spell.id)) {
        x.wizardSpellbook = x.wizardSpellbook.filter((e) => e.matchedSpellID !== spell.id)
      } else {
        x.wizardSpellbook = [...x.wizardSpellbook, { id: crypto.randomUUID().toUpperCase(), name: spell.name, matchedSpellID: spell.id, level: null }]
      }
    })

  const setSchool = (name: string) =>
    edit?.((x) => {
      const next = name === '' ? null : name
      x.wizardSchool = next as PlayerCharacter['wizardSchool']
      // A5: as magias das escolas opostas saem do grimório.
      x.wizardSpellbook = x.wizardSpellbook.filter((e) => {
        const spell = e.matchedSpellID ? byID.get(e.matchedSpellID) : undefined
        return !spell || !isOpposedBySchool(next, spell.schools)
      })
    })

  const isMage = canonicalClass(c.characterClass) === 'Mage'
  const currentSchool = wizardSchools.find((s) => s.name === school)

  return (
    <div className="rec-sheet spellbook">
      <SectionTitle>My Spellbook</SectionTitle>
      <p className="rec-soft">
        {c.wizardSpellbook.length} spell(s) known — can cast up to circle {maxCircle}
      </p>

      {isMage && (
        <div className="spellbook-school">
          <span className="rec-cell-label rec-left-label">Specialization</span>
          {edit ? (
            <InkPicker
              value={school ?? ''}
              label="Specialization"
              options={[{ value: '', label: 'Generalist (no school)' }, ...wizardSchools.map((s) => ({ value: s.name, label: s.name, hint: s.specialist }))]}
              onChange={(name) => {
                if (name === (school ?? '')) return
                const losing = name === '' ? 0 : c.wizardSpellbook.filter((e) => {
                  const spell = e.matchedSpellID ? byID.get(e.matchedSpellID) : undefined
                  return spell && isOpposedBySchool(name, spell.schools)
                }).length
                if (losing > 0 && !window.confirm(`${losing} spell(s) from opposition schools will leave your spellbook. Continue?`)) return
                setSchool(name)
              }}
            />
          ) : (
            <span className="rec-value">{school ?? 'Generalist'}</span>
          )}
          <p className="rec-soft">
            {currentSchool
              ? `+1 slot per circle you already have, best filled with a ${currentSchool.name} spell. Opposition schools (blocked): ${currentSchool.opposition.join(', ')}.`
              : 'Generalist — no bonus, no restriction. Specializing is optional.'}
          </p>
        </div>
      )}

      {edit && (
        <div className="spellbook-search">
          <input className="ink-input" value={query} placeholder="search the Grimoire to add a spell" aria-label="Search the Grimoire" onChange={(e) => setQuery(e.target.value)} />
          {typed !== '' && (
            <ul className="slot-choices">
              {results.length === 0 && (beyond > 0 || opposed > 0) && (
                <li className="paper-soft">
                  No usable match — {[beyond > 0 && `${beyond} beyond circle ${maxCircle}`, opposed > 0 && `${opposed} from an opposition school`].filter(Boolean).join(', ')} found, but blocked.
                </li>
              )}
              {results.map((spell) => (
                <li key={spell.id}>
                  <button className="slot-choice" onClick={() => toggle(spell)}>
                    <span className="rec-value">{spell.name}</span>
                    <span className="rec-soft">{circleLabel(spell.level)}</span>
                    <span className="spellbook-action">{known.has(spell.id) ? 'in book ✓' : 'add'}</span>
                  </button>
                </li>
              ))}
              {results.length === 0 && beyond === 0 && opposed === 0 && (
                <li className="spellbook-free">
                  <span className="paper-soft">Not in the Grimoire — add as a free entry (homebrew, or found in play):</span>
                  <span className="spellbook-free-row">
                    <span className="rec-cell-label">Circle</span>
                    <InkPicker
                      value={String(Math.min(freeLevel, Math.max(maxCircle, 1)))}
                      label="Circle"
                      options={Array.from({ length: Math.max(maxCircle, 1) }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                      onChange={(v) => setFreeLevel(Number(v))}
                    />
                    <button
                      className="paper-link"
                      onClick={() => {
                        edit((x) => void (x.wizardSpellbook = [...x.wizardSpellbook, { id: crypto.randomUUID().toUpperCase(), name: typed, matchedSpellID: null, level: Math.min(freeLevel, Math.max(maxCircle, 1)) }]))
                        setQuery('')
                      }}
                    >
                      add “{typed}”
                    </button>
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.level} className="spellbook-circle">
          <span className="rec-cell-label rec-left-label">{circleLabel(group.level)}</span>
          <table className="sheet-rows">
            <tbody>
              {group.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="rec-value sheet-rows-name">
                    {entry.name}
                    {entry.free && <span className="rec-soft"> (free entry)</span>}
                  </td>
                  {edit && (
                    <td className="remove-cell">
                      <button className="paper-link" onClick={() => edit((x) => void (x.wizardSpellbook = x.wizardSpellbook.filter((e) => e.id !== entry.id)))}>
                        remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {c.wizardSpellbook.length === 0 && <p className="rec-soft">Your spellbook is empty — search above to add spells from the Grimoire.</p>}
      <p className="rec-soft">
        Only spells in your spellbook can be memorized on the Spell Sheet — unlike a priest's spheres, you have to actually learn a spell first.
      </p>
    </div>
  )
}
