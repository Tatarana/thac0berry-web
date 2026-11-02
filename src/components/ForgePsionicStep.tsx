import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { loadData } from '../data/load'
import { classImages, genderOf, raceImages } from '../lib/forgeImages'
import { powerMap } from '../lib/psionicMap'
import { levelOf } from '../rules/multiclass'
import {
  disciplineAction,
  disciplines,
  emptyPsionics,
  knownPowerKeys,
  learnVerdict,
  powerChoice,
  powerCounts,
  powerKey,
  progression,
  psionicBook,
  toggleDiscipline,
  togglePower,
  type PowerChoice,
  type PsionicBook,
} from '../rules/psionics'
import { matchRace } from '../rules/raceKit'
import type { PlayerCharacter, Psionics } from '../types/library'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage, ForgeSlotSockets } from './ForgeParts'
import { PowerDetail, type PsionicPower } from './PowerDetail'

// Etapa 8 do The Forge, só para psionicistas: a escolha de poderes como mapa
// mental (protótipo "Step 8 · Psionic Powers" no canvas do Forge). No centro,
// a mente do personagem com as seis disciplinas e os modos de defesa em
// volta; ao abrir uma, os poderes se abrem em árvore radial (src/lib/
// psionicMap.ts). Regras em src/rules/psionics.ts (learnVerdict); grava no
// mesmo bloco `psionics` que a aba Psionics da ficha usa.

type Branch = (typeof disciplines)[number] | 'Defense'
const branches: Branch[] = [...disciplines, 'Defense']
const branchName = (b: string) => (b === 'Defense' ? 'Defense Modes' : b)

/** Ícones em traço (os do DisciplineIcon da ficha, cada um num só path), mais o escudo dos modos de defesa. */
const icons: Record<string, string> = {
  Clairsentience: 'M2.5 13s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5-9.5-5.5-9.5-5.5Z M9.4 13a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0 M12 2.5v2.5M5.2 4.6l1.4 1.9M18.8 4.6l-1.4 1.9',
  Psychokinesis: 'M11.5 12a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0 M2.5 8.5h6M2 12h7.5M2.5 15.5h6',
  Psychometabolism: 'M12 20.5s-7.5-4.6-7.5-10.4A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4Z M6.5 12.5h3l1.4-2.8 2 5 1.4-2.2h3.2',
  Psychoportation: 'M4.4 12a3.6 8 0 1 0 7.2 0a3.6 8 0 1 0 -7.2 0 M8 12h13M17.5 8.5 21 12l-3.5 3.5',
  Telepathy: 'M2 12a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0 -5.6 0 M16.4 12a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0 -5.6 0 M9.5 9.2q1.6 2.8 0 5.6M12 7.8q2.2 4.2 0 8.4M14.5 9.2q-1.6 2.8 0 5.6',
  Metapsionics: 'M11.5 12a1 1 0 0 1 2 0 2 2 0 0 1-4 0 3 3 0 0 1 6 0 4 4 0 0 1-8 0 5 5 0 0 1 10 0 6 6 0 0 1-12 0',
  Defense: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.9-4.3-1.9-7.5-5.3-7.5-9.9V6Z M9 12l2.2 2.2L15.5 10',
  Mind: 'M12 3a6.5 6.5 0 0 0-6.5 6.5c0 2.4 1.2 3.9 2.5 5.2V18h8v-3.3c1.3-1.3 2.5-2.8 2.5-5.2A6.5 6.5 0 0 0 12 3Z M9.5 21h5',
}

const blurbs: Record<string, string> = {
  Clairsentience: 'Perceive what lies beyond the senses',
  Psychokinesis: 'Move matter with the mind',
  Psychometabolism: 'Master your own body',
  Psychoportation: 'Travel without crossing the space between',
  Telepathy: 'Touch other minds',
  Metapsionics: 'Bend the other powers',
  Defense: 'Guard your mind in psionic combat',
}

const bookNames: Record<PsionicBook, string> = { CPH: 'Complete Psionics Handbook', WatW: 'The Will and the Way', Dragon: 'Dragon Magazine' }

function Glyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** Linha de um ponto a outro (um div girado, como no protótipo). */
function edgeStyle(x1: number, y1: number, x2: number, y2: number): CSSProperties {
  return { left: x1, top: y1, width: Math.hypot(x2 - x1, y2 - y1), transform: `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg)` }
}

const ringStyle = (center: number, r: number): CSSProperties => ({ left: center - r, top: center - r, width: 2 * r, height: 2 * r })

const newID = () => crypto.randomUUID().toUpperCase()

export function ForgePsionicStep({
  draft,
  mutate,
  onBack,
  onFinish,
  creating,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  onBack: () => void
  onFinish: () => void
  creating: boolean
}) {
  const [help, setHelp] = useState(false)
  const [compendium, setCompendium] = useState<PsionicPower[] | null>(null)
  const [focus, setFocus] = useState<Branch | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [reading, setReading] = useState<PsionicPower | null>(null)
  const [books, setBooks] = useState<Record<PsionicBook, boolean>>({ CPH: true, WatW: true, Dragon: false })
  const [zoom, setZoom] = useState<number | null>(null)
  const [box, setBox] = useState({ w: 900, h: 760 })
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void loadData<PsionicPower[]>('psionic-powers.json').then(setCompendium)
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Multiclasse: os limites são do nível de Psionicist.
  const level = levelOf(draft, 'Psionicist') ?? draft.level
  const prog = progression(level)
  const psi = draft.psionics ?? emptyPsionics()
  const known = knownPowerKeys(psi)
  const counts = powerCounts(psi.powers ?? [])

  // Todos os poderes dos livros do Forge (para os pré-requisitos) e os que os filtros mostram.
  const entries = useMemo(
    () =>
      (compendium ?? []).flatMap((p) => {
        const book = psionicBook(p.sources)
        return book && (p.powerTier === 'Science' || p.powerTier === 'Devotion') ? [{ data: p, book, choice: powerChoice(p) }] : []
      }),
    [compendium],
  )
  const all = useMemo(() => entries.map((e) => e.choice), [entries])
  const shown = entries.filter((e) => books[e.book])
  const byID = new Map(entries.map((e) => [e.choice.id, e]))

  const change = (fn: (x: Psionics) => void) =>
    mutate((c) => {
      const next = { ...emptyPsionics(), ...(c.psionics ?? {}) }
      fn(next)
      c.psionics = next
    })

  const learnOrForget = (p: PowerChoice) => {
    const entry = byID.get(p.id)
    change((x) => togglePower(x, p, entry?.data.powerTier ?? (p.science ? 'Science' : 'Devotion'), newID))
  }

  const toggleBook = (book: PsionicBook) => {
    const on = !books[book]
    setBooks({ ...books, [book]: on })
    setSelected(null)
    // Tirar um livro esquece o que veio dele.
    if (!on)
      change((x) => {
        const gone = new Set(entries.filter((e) => e.book === book).map((e) => e.choice.key))
        x.powers = (x.powers ?? []).filter((k) => !gone.has(powerKey(k.name)))
        x.defenseModes = (x.defenseModes ?? []).filter((m) => !gone.has(powerKey(m)))
      })
  }

  const open = (b: Branch | null) => {
    setFocus(b)
    setSelected(null)
    setZoom(null)
  }

  // --- Geometria do palco ---
  let size: number
  let rings: CSSProperties[] = []
  const edges: { style: CSSProperties; lit: boolean; hub?: boolean }[] = []
  const map = focus ? powerMap(shown.filter((e) => e.choice.discipline === focus).map((e) => e.choice)) : null
  if (!map) {
    size = 820
    rings = [ringStyle(size / 2, 285)]
  } else {
    const outer = map.firstRing + map.depth * map.ringStep
    size = Math.ceil(2 * (outer + 240))
    rings = Array.from({ length: map.depth + 1 }, (_, k) => ringStyle(size / 2, map.firstRing + k * map.ringStep))
  }
  const center = size / 2
  const fit = Math.min(1, (box.w - 24) / size, (box.h - 24) / size)
  const scale = zoom ?? (focus ? Math.max(fit, 0.72) : Math.min(1, Math.max(fit, 0.6)))
  const stepZoom = (delta: number) => setZoom(Math.max(0.3, Math.min(1.6, Math.round((scale + delta) * 100) / 100)))

  // Centraliza o palco ao abrir uma disciplina, mudar o zoom ou a janela.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2)
  }, [focus, scale, size, box.w, box.h])

  // Visão geral: a mente no centro, os sete ramos em volta.
  const satellites = branches.map((b, i) => {
    const a = rad(-90 + (i * 360) / branches.length)
    const x = center + 285 * Math.cos(a)
    const y = center + 285 * Math.sin(a)
    const taken = b === 'Defense' ? (psi.defenseModes ?? []).length > 0 : (psi.disciplines ?? []).includes(b)
    const mine = shown.filter((e) => e.choice.discipline === b)
    const lit = mine.filter((e) => known.has(e.choice.key)).length
    return { b, x, y, taken, primary: psi.primaryDiscipline === b, mine, lit }
  })
  if (!map) for (const s of satellites) edges.push({ style: edgeStyle(center, center, s.x, s.y), lit: s.taken, hub: true })

  // Foco: a árvore radial da disciplina.
  const nodes = (map?.nodes ?? []).map((n) => {
    const p = n.power
    const x = center + n.radius * Math.cos(rad(n.angle))
    const y = center + n.radius * Math.sin(rad(n.angle))
    return { n, p, x, y }
  })
  const position = new Map(nodes.map((k) => [k.p.id, k]))
  for (const k of nodes) {
    const from = k.n.parent ? position.get(k.n.parent.id) : undefined
    const learned = known.has(k.p.key)
    const parentLit = !k.n.parent || known.has(k.n.parent.key)
    edges.push({ style: edgeStyle(from?.x ?? center, from?.y ?? center, k.x, k.y), lit: learned && parentLit })
  }

  const action = focus && focus !== 'Defense' ? disciplineAction(focus, level, psi) : null
  const coreTaken = focus === 'Defense' ? (psi.defenseModes ?? []).length > 0 : !!focus && (psi.disciplines ?? []).includes(focus)

  const pick = (p: PowerChoice) => {
    const verdict = learnVerdict(p, level, psi, all)
    if (selected === p.id && verdict.ok) learnOrForget(p)
    else setSelected(p.id)
  }

  const chosen = selected ? byID.get(selected) : undefined
  const verdict = chosen ? learnVerdict(chosen.choice, level, psi, all) : null
  const nav = { onBack, onNext: onFinish, nextLabel: creating ? 'Creating…' : 'Create character', ready: !creating }
  const gender = genderOf(draft.sex)
  const race = matchRace(draft.race)
  const portrait = [...classImages('Psionicist', gender), ...(race ? raceImages(race, gender) : [])]

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step 8</p>
      <h2 className="forge-title mm-title">
        Awaken Your Mind
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Your mind is a map. Choose your primary discipline, then the sciences and devotions you have mastered — each new power grows out of the ones before it.</p>
      {help && (
        <ForgeHelpNote ruleID="cpsih_ch01_advancement">
          Your level gives how many disciplines, sciences, devotions and defense modes you hold (CPH Table 4). Your first discipline is your primary:
          no other may ever hold as many sciences — or devotions — as it does. In every discipline you need twice as many devotions as sciences. Some
          powers need another power (or a level) first.
        </ForgeHelpNote>
      )}

      <div className="mm-layout">
        <div className="mm-col">
          <nav className="mm-chips" aria-label="Disciplines">
            <button type="button" className={focus ? 'mm-chip' : 'mm-chip mm-chip-on'} aria-pressed={!focus} onClick={() => open(null)}>
              <Glyph name="Mind" />
              Your mind
            </button>
            {branches.map((b) => {
              const taken = b !== 'Defense' && (psi.disciplines ?? []).includes(b)
              return (
                <button key={b} type="button" className={focus === b ? 'mm-chip mm-chip-on' : taken ? 'mm-chip mm-chip-taken' : 'mm-chip'} aria-pressed={focus === b} onClick={() => open(b)}>
                  <Glyph name={b} />
                  {branchName(b)}
                </button>
              )
            })}
          </nav>

          <div className="mm-bar">
            <div className="mm-chips" aria-label="Sources">
              {(Object.keys(bookNames) as PsionicBook[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  className={books[b] ? `mm-chip mm-chip-on${b === 'CPH' ? ' mm-chip-fixed' : ''}` : 'mm-chip'}
                  aria-pressed={books[b]}
                  disabled={b === 'CPH'}
                  onClick={() => toggleBook(b)}
                >
                  {bookNames[b]}
                </button>
              ))}
            </div>
            <div className="mm-zoom">
              <button type="button" className="mm-zoom-btn" aria-label="Zoom out" onClick={() => stepZoom(-0.1)}>
                −
              </button>
              <span>{Math.round(scale * 100)}%</span>
              <button type="button" className="mm-zoom-btn" aria-label="Zoom in" onClick={() => stepZoom(0.1)}>
                +
              </button>
              <button type="button" className="mm-zoom-btn mm-zoom-fit" onClick={() => setZoom(fit)}>
                Fit
              </button>
            </div>
          </div>

          <div className="mm-scroller" ref={scroller}>
            <div className="mm-sizer" style={{ width: size * scale, height: size * scale }}>
              <div className="mm-stage" style={{ width: size, height: size, transform: `scale(${scale})` }}>
                {rings.map((style, i) => (
                  <div key={i} className="mm-ring" style={style} />
                ))}
                {edges.map((e, i) => (
                  <div key={i} className={e.lit ? 'mm-edge mm-edge-lit' : e.hub ? 'mm-edge mm-edge-hub' : 'mm-edge'} style={e.style} />
                ))}

                {compendium === null && <p className="mm-loading">Opening the mind…</p>}

                {!focus && (
                  <>
                    {satellites.flatMap((s) =>
                      s.mine.map((e, j) => {
                        const b = rad(-90 + (j * 360) / s.mine.length)
                        const lit = known.has(e.choice.key)
                        return (
                          <span
                            key={`${s.b}-${e.choice.id}`}
                            className={lit ? 'mm-star mm-star-lit' : e.choice.science ? 'mm-star mm-star-sci' : 'mm-star'}
                            style={{ left: s.x + 74 * Math.cos(b) - 2, top: s.y + 74 * Math.sin(b) - 2 }}
                          />
                        )
                      }),
                    )}
                    <div className="mm-mind" style={{ left: center - 84, top: center - 84 }}>
                      <ForgeImage images={portrait} alt="Your psionicist" compact />
                    </div>
                    <div className="mm-mind-label" style={{ left: center - 110, top: center + 94 }}>
                      Your Mind<span>Psionicist · level {level}</span>
                    </div>
                    {satellites.map((s) => (
                      <div key={s.b}>
                        <button
                          type="button"
                          className={['mm-sat', s.b === 'Defense' ? 'mm-sat-defense' : '', s.taken ? 'mm-sat-taken' : '', s.primary ? 'mm-sat-primary' : ''].join(' ')}
                          style={{ left: s.x - 56, top: s.y - 56 }}
                          aria-label={`${branchName(s.b)}: ${blurbs[s.b]}`}
                          onClick={() => open(s.b)}
                        >
                          <Glyph name={s.b} />
                          {s.primary && <span className="mm-crown">Primary</span>}
                        </button>
                        <div className="mm-sat-label" style={{ left: s.x - 85, top: s.y + 82 }}>
                          {branchName(s.b)}
                          <span>{s.lit > 0 ? `${s.lit} of ${s.mine.length} learned` : `${s.mine.length} powers`}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {focus && (
                  <>
                    <button type="button" className="mm-back" onClick={() => open(null)}>
                      ← Your mind
                    </button>
                    <div
                      className={['mm-core', focus === 'Defense' ? 'mm-core-defense' : '', coreTaken ? 'mm-core-taken' : '', psi.primaryDiscipline === focus ? 'mm-core-primary' : ''].join(' ')}
                      style={{ left: center - 75, top: center - 75 }}
                    >
                      <Glyph name={focus} />
                      <span>{branchName(focus)}</span>
                    </div>
                    {action && (
                      <button
                        type="button"
                        className={action.kind === 'take' ? 'mm-core-act' : action.kind === 'release' ? 'mm-core-act mm-core-act-ghost' : 'mm-core-act mm-core-act-badge'}
                        style={{ left: center - 115, top: center + 88 }}
                        disabled={action.kind === 'locked'}
                        onClick={() => change((x) => toggleDiscipline(x, focus))}
                      >
                        {action.kind === 'take' ? (action.primary ? 'Make it my primary discipline' : `Take up ${focus}`) : action.kind === 'release' ? `Release ${focus}` : action.label}
                      </button>
                    )}
                    {nodes.map(({ n, p, x, y }, i) => {
                      const learned = known.has(p.key)
                      const ok = learnVerdict(p, level, psi, all).ok
                      const right = Math.cos(rad(n.angle)) >= 0
                      // As folhas leem para fora; um poder com ramos lê para dentro, deixando espaço para eles.
                      const outward = n.leaf ? right : !right
                      const width = n.leaf ? 210 : 132
                      const anchor = 11
                      const style: CSSProperties = {
                        left: outward ? x - anchor : x - (width - anchor),
                        top: y - 15,
                        width,
                        transformOrigin: `${outward ? anchor : width - anchor}px 50%`,
                        transform: `rotate(${right ? n.angle : n.angle - 180}deg)`,
                      }
                      const cls = [
                        'mm-node',
                        outward ? 'mm-node-r' : 'mm-node-l',
                        p.science ? 'mm-node-sci' : 'mm-node-dev',
                        n.leaf ? '' : 'mm-node-hub',
                        learned ? 'is-learned' : ok ? 'is-open' : 'is-locked',
                        selected === p.id ? 'is-sel' : '',
                      ].join(' ')
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={cls}
                          style={style}
                          aria-label={`${p.title}, ${p.science ? 'science' : 'devotion'}${learned ? ', learned' : ok ? '' : ', locked'}`}
                          aria-pressed={learned}
                          onClick={() => pick(p)}
                        >
                          <span className="mm-node-in" style={{ animationDelay: `${Math.min(i * 14, 700)}ms` }}>
                            <span className="mm-dot" />
                            <span className="mm-label">{p.title.replace(' (Psionic)', '')}</span>
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mm-legend">
            <span>
              <i className="mm-lg-sci" />
              Science
            </span>
            <span>
              <i className="mm-lg-dev" />
              Devotion
            </span>
            <span>
              <i className="mm-lg-lit" />
              Learned
            </span>
            <span>Dim = not yet within reach — tap it to see why</span>
          </div>
        </div>

        <aside className="mm-panel" aria-label="Your psionic powers">
          <div className="mm-card">
            <div className="mm-who">
              <span className="mm-who-portrait">
                <ForgeImage images={portrait} alt="" compact />
              </span>
              <div>
                <b>Psionicist, level {level}</b>
                <span>What this level lets you hold (CPH Table 4)</span>
              </div>
            </div>
            <div className="slot-pools mm-pools">
              <ForgeSlotSockets label="Disciplines" used={(psi.disciplines ?? []).length} total={prog.disciplines} />
              <ForgeSlotSockets label="Sciences" used={counts.sciences} total={prog.sciences} />
              <ForgeSlotSockets label="Devotions" used={counts.devotions} total={prog.devotions} />
              <ForgeSlotSockets label="Defense modes" used={(psi.defenseModes ?? []).length} total={prog.defenseModes} />
            </div>
            <div className="mm-disc-list">
              {(psi.disciplines ?? []).map((d) => {
                const mine = (psi.powers ?? []).filter((k) => k.discipline === d)
                const sci = mine.filter((k) => k.tier === 'Science').length
                return (
                  <button key={d} type="button" className="mm-disc-row" onClick={() => open(d as Branch)}>
                    <Glyph name={d} />
                    {d}
                    {psi.primaryDiscipline === d ? (
                      <em>Primary</em>
                    ) : (
                      <i>
                        {sci} sci · {mine.length - sci} dev
                      </i>
                    )}
                  </button>
                )
              })}
              {(psi.disciplines ?? []).length === 0 && <p className="mm-empty">No discipline yet — open one on the map and make it your primary.</p>}
            </div>
          </div>

          {chosen && verdict ? (
            <div className="mm-card mm-detail">
              <p className="mm-card-label">{branchName(chosen.choice.discipline)}</p>
              <h3>{chosen.data.title.replace(' (Psionic)', '')}</h3>
              <div className="mm-tier-row">
                <span className={chosen.choice.discipline === 'Defense' ? 'mm-tier mm-tier-def' : chosen.choice.science ? 'mm-tier mm-tier-sci' : 'mm-tier'}>
                  {chosen.choice.discipline === 'Defense' ? 'Defense mode' : chosen.data.powerTier}
                </span>
                <span className="mm-tier">{bookNames[chosen.book]}</span>
              </div>
              <dl className="mm-facts">
                <div>
                  <dt>Power score</dt>
                  <dd>{chosen.data.powerScore.raw || '—'}</dd>
                </div>
                <div>
                  <dt>PSP cost</dt>
                  <dd>{[chosen.data.pspCost.initial, chosen.data.pspCost.maintenance].filter((s) => s && s !== 'na').join(' + ') || '—'}</dd>
                </div>
                <div>
                  <dt>Range</dt>
                  <dd>{chosen.data.parameters.range || '—'}</dd>
                </div>
                <div>
                  <dt>Preparation</dt>
                  <dd>{chosen.data.parameters.preparationTime || '—'}</dd>
                </div>
                <div>
                  <dt>Area of effect</dt>
                  <dd>{chosen.data.parameters.areaOfEffect || '—'}</dd>
                </div>
              </dl>
              {chosen.choice.prerequisites.length > 0 && (
                <div className="mm-pre">
                  {chosen.choice.prerequisites.map((r, i) => {
                    if (r.kind === 'level')
                      return (
                        <span key={i} className={level >= r.level ? 'mm-pre-ok' : 'mm-pre-miss'}>
                          Level {r.level}
                        </span>
                      )
                    const q = all.find((x) => x.key === r.key)
                    return (
                      <span key={i} className={q ? (known.has(q.key) ? 'mm-pre-ok' : 'mm-pre-miss') : ''}>
                        {q ? q.title.replace(' (Psionic)', '') : r.text}
                      </span>
                    )
                  })}
                </div>
              )}
              <p className="mm-summary">{chosen.data.description.briefSummary}</p>
              <button type="button" className="mm-read" onClick={() => setReading(chosen.data)}>
                Read the whole power
              </button>
              <button
                type="button"
                className={verdict.action === 'forget' ? 'mm-act mm-act-forget' : 'mm-act'}
                disabled={!verdict.ok}
                onClick={() => learnOrForget(chosen.choice)}
              >
                {verdict.action === 'forget' ? 'Forget this power' : 'Learn this power'}
              </button>
              {!verdict.ok && <p className="mm-why">{verdict.reason}</p>}
            </div>
          ) : (
            <div className="mm-card">
              <p className="mm-card-label">{focus ? branchName(focus) : 'Where to begin'}</p>
              <p className="mm-hint">
                {focus
                  ? `${blurbs[focus]}. Tap a power to read it; tap it again — or use the button — to learn it. Dim powers are out of reach: tap one to see why.`
                  : `Every psionicist starts with one discipline — the primary. Open one on the map to see its powers bloom around it, then claim it. At level ${level} you hold ${prog.sciences} science${prog.sciences > 1 ? 's' : ''} and ${prog.devotions} devotions.`}
              </p>
            </div>
          )}

          <div className="mm-card">
            <p className="mm-card-label">Laws of the mind</p>
            <ul className="mm-rules">
              <li>Your first discipline is your primary. No other discipline may ever hold as many sciences — or devotions — as it does.</li>
              <li>In every discipline, you need twice as many devotions as sciences.</li>
              <li>Some powers grow out of others: learn the root before the branch.</li>
              <li>Defense modes are free of these limits; your level says how many.</li>
            </ul>
          </div>
        </aside>
      </div>

      {reading && <PowerDetail power={reading} onClose={() => setReading(null)} />}

      <ForgeFooter {...nav} />
    </section>
  )
}
