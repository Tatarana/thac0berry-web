import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { abilityEffect, abilityStats } from '../rules/effects'
import { canonicalClass } from '../rules/rules'
import { barFraction, itemCharges, spellBars, suggestedXP, suggestedXPDual, suggestedXPMulti } from '../rules/sessionReport'
import { classLevels, dualClassRestriction, isDualClass, isMultiClass } from '../rules/multiclass'
import type { PlayerCharacter, SpellSheet } from '../types/library'
import { PaperModal } from './DetailBits'

// Relatório da sessão (SessionReportView do iPad), só leitura e de UM
// personagem, aberto da folha de magia dele: magias por círculo e Turn Undead
// em barras, cargas de itens mágicos e o XP sugerido (DMG Tabela 34 + PHB),
// somados nos dias da sessão. O relatório da mesa inteira fica para o módulo
// do mestre (decisão do usuário, 2026-10-06).

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const abilityShort: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
}

type Who = Pick<PlayerCharacter, 'name' | 'characterClass' | 'level' | 'abilities' | 'activeEffects' | 'multiClasses' | 'formerClasses'>

function Experience({ character, sheets }: { character: Who; sheets: SpellSheet[] }) {
  // Atributos sem efeitos temporários (uma poção não conta para o bônus).
  const base = Object.fromEntries(abilityStats.map((a) => [a, abilityEffect(character, a)?.normal ?? character.abilities[a]])) as Record<
    (typeof abilityStats)[number],
    number
  >
  const cls = canonicalClass(character.characterClass)
  if (isMultiClass(character)) return <MultiExperience character={character} base={base} sheets={sheets} />
  if (isDualClass(character)) return <DualExperience character={character} base={base} sheets={sheets} />
  const xp = suggestedXP(cls, base, sheets)
  return (
    <>
      <div className="rec-cell-label">Experience (suggested)</div>
      {xp.lines.length === 0 ? (
        <p className="paper-soft">No spell or Turn Undead awards for a {cls} in this session (DMG Table 34).</p>
      ) : (
        <ul className="report-charges report-xp">
          {xp.lines.map((line) => (
            <li key={line.label}>
              <span>
                {line.label} <span className="paper-soft">({line.detail})</span>
              </span>
              <span className="report-charge-count">{line.xp.toLocaleString('en-US')} XP</span>
            </li>
          ))}
          {xp.primeBonus && (
            <li>
              <span>
                Prime requisite bonus{' '}
                <span className="paper-soft">
                  ({xp.primeBonus.abilities.map((a) => `${abilityShort[a]} ${base[a]}`).join(', ')}; +10% needs 16+
                  {xp.primeBonus.applies ? '' : ', not met'})
                </span>
              </span>
              <span className="report-charge-count">{xp.primeBonus.xp.toLocaleString('en-US')} XP</span>
            </li>
          )}
          <li className="report-xp-total">
            <span>Total</span>
            <span className="report-charge-count">{xp.total.toLocaleString('en-US')} XP</span>
          </li>
        </ul>
      )}
      <p className="paper-soft report-xp-note">
        Individual awards are optional and up to the DM: only significant uses count (spells cast to further the deity&apos;s ethos or to
        overcome foes or problems).
        {xp.countsAttempts ? ' Turn Undead counts every attempt; by the rule only successful ones earn XP.' : ''} Add the XP to the sheet yourself.
      </p>
    </>
  )
}

/**
 * Classe dupla (MC4b): só a classe atual ganha XP. Na restrição, a magia das
 * classes anteriores fica fora da soma, com o aviso da penalidade (decisão 15).
 */
function DualExperience({ character, base, sheets }: { character: Who; base: Record<string, number>; sheets: SpellSheet[] }) {
  const current = canonicalClass(character.characterClass)
  const former = (character.formerClasses ?? []).map((k) => canonicalClass(k.characterClass))
  const restriction = dualClassRestriction(character)
  const xp = suggestedXPDual(current, former, restriction !== null, base as Parameters<typeof suggestedXPDual>[3], sheets)
  const lines = xp.groups.flatMap((g) => g.lines)
  return (
    <>
      <div className="rec-cell-label">Experience (suggested)</div>
      <ul className="report-charges report-xp">
        {lines.length === 0 && (
          <li>
            <span className="paper-soft">No spell or Turn Undead awards for the {current} in this session (DMG Table 34).</span>
          </li>
        )}
        {lines.map((line) => (
          <li key={line.label}>
            <span>
              {line.label} <span className="paper-soft">({line.detail})</span>
            </span>
            <span className="report-charge-count">{line.xp.toLocaleString('en-US')} XP</span>
          </li>
        ))}
        {lines.length > 0 && xp.primeBonus && (
          <li>
            <span>
              Prime requisite bonus ({current}){' '}
              <span className="paper-soft">
                ({xp.primeBonus.abilities.map((a) => `${abilityShort[a]} ${base[a]}`).join(', ')}; +10% needs 16+
                {xp.primeBonus.applies ? '' : ', not met'})
              </span>
            </span>
            <span className="report-charge-count">{xp.primeBonus.xp.toLocaleString('en-US')} XP</span>
          </li>
        )}
        <li className="report-xp-total">
          <span>Total ({current})</span>
          <span className="report-charge-count">{xp.total.toLocaleString('en-US')} XP</span>
        </li>
      </ul>
      {xp.penalized && restriction && (
        <p className="mc-dual-status report-xp-note">
          ⚠ {xp.penalized.classes.join(' and ')} abilities (spells, Turn Undead) were used during the restriction (until {restriction.characterClass}{' '}
          {restriction.untilLevel}): they earn nothing ({xp.penalized.xp.toLocaleString('en-US')} XP by the table), and by the rule the encounter
          where it was used earns no XP and the adventure only half (PHB, Chapter 3).
        </p>
      )}
      {xp.unassigned > 0 && (
        <p className="paper-soft report-xp-note">
          {xp.unassigned} additional spell{xp.unassigned === 1 ? '' : 's'} written by hand could not be matched to divine or arcane magic and
          earned no XP.
        </p>
      )}
      <p className="paper-soft report-xp-note">
        Individual awards are optional and up to the DM. A dual-class character earns experience only in the current class;
        {restriction
          ? ' while the restriction lasts, former class abilities earn nothing.'
          : " spells of a former class count by that class's award, with the current class's prime requisite bonus."}
        {xp.countsAttempts ? ' Turn Undead counts every attempt; by the rule only successful ones earn XP.' : ''} Add the XP to the sheet
        yourself.
      </p>
    </>
  )
}

/**
 * Multiclasse (MC3c, decisão 6): XP pelo tipo — magia divina e Turn Undead pela
 * classe divina (bônus de WIS), magia arcana pela arcana (bônus de INT) — e o
 * total dividido igualmente entre as classes.
 */
function MultiExperience({ character, base, sheets }: { character: Who; base: Record<string, number>; sheets: SpellSheet[] }) {
  const classes = classLevels(character).map((k) => canonicalClass(k.characterClass))
  const xp = suggestedXPMulti(classes, base as Parameters<typeof suggestedXPMulti>[1], sheets)
  return (
    <>
      <div className="rec-cell-label">Experience (suggested)</div>
      <ul className="report-charges report-xp">
        {xp.groups.every((g) => g.lines.length === 0) && (
          <li>
            <span className="paper-soft">No spell or Turn Undead awards for {classes.join('/')} in this session (DMG Table 34).</span>
          </li>
        )}
        {xp.groups.map((g) => (
          <li key={g.kind} className="report-xp-group">
            <ul className="report-charges">
              {g.lines.map((line) => (
                <li key={line.label}>
                  <span>
                    {line.label} <span className="paper-soft">({line.detail})</span>
                  </span>
                  <span className="report-charge-count">{line.xp.toLocaleString('en-US')} XP</span>
                </li>
              ))}
              {g.lines.length > 0 && g.primeBonus && (
                <li>
                  <span>
                    {g.kind === 'divine' ? 'Divine' : 'Arcane'} XP bonus ({g.characterClass}){' '}
                    <span className="paper-soft">
                      ({g.primeBonus.abilities.map((a) => `${abilityShort[a]} ${base[a]}`).join(', ')}; +10% needs 16+
                      {g.primeBonus.applies ? '' : ', not met'})
                    </span>
                  </span>
                  <span className="report-charge-count">{g.primeBonus.xp.toLocaleString('en-US')} XP</span>
                </li>
              )}
            </ul>
          </li>
        ))}
        <li className="report-xp-total">
          <span>Total</span>
          <span className="report-charge-count">{xp.total.toLocaleString('en-US')} XP</span>
        </li>
        <li>
          <span>
            Each class <span className="paper-soft">(divided equally between {xp.classCount}: {classes.join(', ')})</span>
          </span>
          <span className="report-charge-count">{xp.perClass.toLocaleString('en-US')} XP</span>
        </li>
      </ul>
      {xp.unassigned > 0 && (
        <p className="paper-soft report-xp-note">
          {xp.unassigned} additional spell{xp.unassigned === 1 ? '' : 's'} written by hand could not be matched to divine or arcane magic and
          earned no XP.
        </p>
      )}
      <p className="paper-soft report-xp-note">
        Individual awards are optional and up to the DM. Divine spells and Turn Undead use the priest award and bonus; arcane spells use the
        wizard&apos;s.{xp.countsAttempts ? ' Turn Undead counts every attempt; by the rule only successful ones earn XP.' : ''} Add the XP to the
        sheet yourself.
      </p>
    </>
  )
}

export function SessionReport({
  character,
  sheets,
  sessionID,
  onClose,
}: {
  character: Who
  /** Os dias deste personagem nesta sessão. */
  sheets: SpellSheet[]
  sessionID: string | null
  onClose: () => void
}) {
  const [session, setSession] = useState<{ title: string; date: string } | null>(null)
  useEffect(() => {
    if (!sessionID) return
    let cancelled = false
    void supabase
      .from('session')
      .select('title, date')
      .eq('id', sessionID)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSession(data as { title: string; date: string } | null)
      })
    return () => {
      cancelled = true
    }
  }, [sessionID])

  const bars = spellBars(sheets)
  const charges = itemCharges(sheets)
  const max = Math.max(0, ...bars.map((b) => b.count))
  const date = session ? new Date(session.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const name = sessionID ? (session ? (session.title ? `${session.title} · ${date}` : date) : '…') : 'Days without a session'
  const subtitle = `${character.name || 'Unnamed character'} · ${name} — ${plural(sheets.length, 'day', 'days')}`

  return createPortal(
    <PaperModal title="Session Report" subtitle={subtitle} onClose={onClose}>
      <section className="report-character">
        <div className="rec-cell-label">Spells &amp; Turn Undead</div>
        {bars.length === 0 ? (
          <p className="paper-soft">Nothing cast or attempted in this session yet.</p>
        ) : (
          <div className="report-bars">
            {bars.map((bar) => (
              <div key={bar.id} className="report-bar-row">
                <span className="report-bar-label">{bar.label}</span>
                <span className="report-bar-track">
                  <span
                    className={bar.kind === 'turnUndead' ? 'report-bar report-bar-turn' : 'report-bar'}
                    style={{ width: `max(${barFraction(bar.count, max) * 100}%, 3px)` }}
                  />
                </span>
                <span className="report-bar-count">{bar.count}</span>
              </div>
            ))}
          </div>
        )}
        <div className="rec-cell-label">Magic Item Charges</div>
        {charges.length === 0 ? (
          <p className="paper-soft">No magic item charges used in this session.</p>
        ) : (
          <ul className="report-charges">
            {charges.map((c) => (
              <li key={`${c.itemName}|${c.spellName}`}>
                <span>
                  {c.itemName} — {c.spellName}
                </span>
                <span className="report-charge-count">{plural(c.used, 'charge', 'charges')}</span>
              </li>
            ))}
          </ul>
        )}
        <Experience character={character} sheets={sheets} />
      </section>
    </PaperModal>,
    document.body,
  )
}
