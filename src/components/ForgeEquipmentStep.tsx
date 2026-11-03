import { useEffect, useMemo, useState } from 'react'
import { loadAllKits, type Kit } from '../data/kits'
import { loadData } from '../data/load'
import type { ArmorPiece, MundaneItem, Weapon } from '../data/gear'
import { classImages, genderOf, raceImages } from '../lib/forgeImages'
import { setArmorPieces } from '../rules/armorClass'
import {
  armorClassOf,
  bundles,
  buy,
  cartCost,
  cartWeight,
  coins,
  equipmentRows,
  formatMoney,
  marketWares,
  rolledCopper,
  startingFunds,
  type MarketState,
  type Stall,
  type Ware,
} from '../rules/market'
import { allClasses } from '../rules/multiclass'
import { kitWeaponHints } from '../rules/proficiencyCost'
import { matchRace } from '../rules/raceKit'
import { canonicalClass, classGroup, dexDefenseAdjustment, strengthRow, weaponProficiencyKey } from '../rules/rules'
import { leastFilledColumn } from '../rules/sheetEdits'
import type { Page2EquipmentEntry, PlayerCharacter } from '../types/library'
import { ForgeDice, type DieKind } from './ForgeDice'
import { ForgeEmbers, ForgeFooter, ForgeHelpButton, ForgeHelpNote, ForgeImage } from './ForgeParts'

// Etapa "Fill Your Pack" do The Forge (protótipo "Step 9 · Equipment" no
// canvas): rola a bolsa (PHB Tabela 43, ou o kit) com os dados na mesa, e o
// jogador compra nas três barracas — ferreiro, armeiro e armazém. Ao lado, o
// herói vestido: CA, peso contra a Força e a mochila. Regras em
// src/rules/market.ts. Grava a armadura e o escudo na caixa de armadura, o
// resto na tabela de equipamento da página 2 e o troco no tesouro. A bolsa e a
// sacola vivem no CharacterForge, para voltar à etapa sem perder as compras.

const stalls: { id: Stall; name: string; icon: string; filters: [string, string][] }[] = [
  { id: 'smithy', name: 'The Smithy', icon: 'M4 20l7-7 M14 4l6 6-9 9-6-6Z M3 21l3-3', filters: [['all', 'All weapons'], ['trained', 'Your weapons'], ['ammo', 'Ammunition']] },
  { id: 'armorer', name: 'The Armorer', icon: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.9-4.3-1.9-7.5-5.3-7.5-9.9V6Z', filters: [['all', 'Everything'], ['armor', 'Armor'], ['shield', 'Shields & helms']] },
  {
    id: 'store',
    name: 'The General Store',
    icon: 'M3 9l2-5h14l2 5 M3 9h18v11H3Z M9 20v-6h6v6 M3 9c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3c0 2 1.5 3 3 3s3-1 3-3',
    filters: [['all', 'Everything'], ['gear', 'Gear'], ['clothing', 'Clothing']],
  },
]

const newID = () => crypto.randomUUID().toUpperCase()
const dieKind = (sides: number): DieKind => (sides === 4 ? 'd4' : sides === 6 ? 'd6' : 'd10')

export function ForgeEquipmentStep({
  draft,
  mutate,
  market: stored,
  onMarket,
  stepNumber,
  nextLabel,
  onBack,
  onNext,
}: {
  draft: PlayerCharacter
  mutate: (fn: (c: PlayerCharacter) => void) => void
  market: MarketState
  onMarket: (next: MarketState) => void
  stepNumber: number
  nextLabel: string
  onBack: () => void
  onNext: () => void
}) {
  const [help, setHelp] = useState(false)
  const [data, setData] = useState<{ weapons: Weapon[]; armor: ArmorPiece[]; goods: MundaneItem[]; kits: Kit[] } | null>(null)
  const [stall, setStall] = useState<Stall>('smithy')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [rolling, setRolling] = useState<number[] | null>(null)
  const [rollKey, setRollKey] = useState(0)

  useEffect(() => {
    void Promise.all([loadData<Weapon[]>('weapons.json'), loadData<ArmorPiece[]>('armor.json'), loadData<MundaneItem[]>('mundane_items.json'), loadAllKits()]).then(
      ([weapons, armor, goods, kits]) => setData({ weapons, armor, goods, kits }),
    )
  }, [])

  const wares = useMemo(() => (data ? marketWares(data.weapons, data.armor, data.goods) : []), [data])
  const byKey = useMemo(() => new Map(wares.map((w) => [w.key, w])), [wares])
  const kit = data?.kits.find((k) => k.name === draft.kit) ?? null
  const classes = allClasses(draft).map((k) => k.characterClass)
  const funds = startingFunds(classes, kit?.mechanics.startingCash)
  // Trocou de classe ou kit depois de rolar: a bolsa rola de novo e a sacola recomeça (o ouro do mestre fica).
  const stale = !!stored.dice && stored.rolledFor !== funds.label
  const market: MarketState = stale ? { ...stored, dice: null, rolledFor: null, cart: {} } : stored
  useEffect(() => {
    if (stale && data) commit(market)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, data])
  const priest = classes.some((k) => classGroup(k) === 'Priest')
  const budget = market.dice ? rolledCopper(funds, market.dice) + market.extraGold * 100 : 0
  const spent = cartCost(market.cart, byKey)
  const left = budget - spent

  // A ficha: armadura e escudo na caixa de armadura, o resto na página 2, o troco no tesouro.
  const commit = (next: MarketState) => {
    onMarket(next)
    const nextBudget = next.dice ? rolledCopper(funds, next.dice) + next.extraGold * 100 : 0
    const change = coins(Math.max(0, nextBudget - cartCost(next.cart, byKey)))
    mutate((c) => {
      const worn = (kind: Ware['kind']) => Object.keys(next.cart).map((k) => byKey.get(k)).find((w) => w?.kind === kind) ?? null
      const armor = worn('armor')
      const shield = worn('shield')
      setArmorPieces(c, {
        armor: armor ? { name: armor.name, rating: armor.armorClass ?? 10 } : null,
        shield: shield ? { name: shield.name, rating: -1 } : null,
      })
      const rows: Page2EquipmentEntry[] = []
      for (const r of equipmentRows(next.cart, byKey)) rows.push({ id: newID(), ...r, column: leastFilledColumn(rows) })
      c.page2Equipment = rows
      c.treasure = { ...c.treasure, ...change }
    })
  }

  const roll = () => {
    const dice = Array.from({ length: funds.count }, () => 1 + Math.floor(Math.random() * funds.sides))
    setRolling(dice)
    setRollKey((k) => k + 1)
  }
  const settled = () => {
    if (!rolling) return
    commit({ ...market, dice: rolling, rolledFor: funds.label })
    setRolling(null)
  }
  const purchase = (ware: Ware, n: number) => {
    if (!market.dice) return
    commit({ ...market, cart: buy(market.cart, ware, n, budget, byKey) })
  }
  const takeBundle = (items: [string, number][]) => {
    if (!market.dice) return
    let cart = market.cart
    for (const [name, qty] of items) {
      const ware = wares.find((w) => w.stall === 'store' && w.name === name)
      if (ware) cart = buy(cart, ware, qty, budget, byKey)
    }
    commit({ ...market, cart })
  }

  // Selos: arma da lista de proficiências (etapa 7) e as que o kit recomenda.
  const trained = new Set(draft.weapons.map((w) => weaponProficiencyKey(w.name)).filter(Boolean))
  const hints = kitWeaponHints(
    kit?.features.weaponProficiencies,
    wares.filter((w) => w.kind === 'weapon').map((w) => w.proficiency ?? ''),
  )
  const current = stalls.find((s) => s.id === stall)!
  const q = query.trim().toLowerCase()
  const shelf = wares.filter((w) => {
    if (w.stall !== stall) return false
    if (q && !w.name.toLowerCase().includes(q)) return false
    if (filter === 'trained') return w.kind === 'weapon' && trained.has(w.proficiency ?? '')
    if (filter === 'ammo') return w.kind === 'ammo'
    if (filter === 'armor') return w.kind === 'armor'
    if (filter === 'shield') return w.kind === 'shield' || w.kind === 'helmet'
    if (filter === 'gear' || filter === 'clothing') return w.kind === filter
    return true
  })

  const cartWares = Object.entries(market.cart).flatMap(([key, qty]) => (byKey.get(key) ? [{ ware: byKey.get(key)!, qty }] : []))
  const piece = (kind: Ware['kind']) => cartWares.find((x) => x.ware.kind === kind)?.ware ?? null
  const arms = cartWares.filter((x) => x.ware.kind === 'weapon').map((x) => x.ware.name)
  const ac = armorClassOf(market.cart, byKey, dexDefenseAdjustment(draft))
  const weight = cartWeight(market.cart, byKey)
  const allowance = Number(strengthRow(draft.abilities.strength, draft.abilities.exceptionalStrength ?? null)?.weight ?? 0) || 40

  const gender = genderOf(draft.sex)
  const race = matchRace(draft.race)
  const portrait = [...classImages(canonicalClass(draft.characterClass), gender), ...(race ? raceImages(race, gender) : [])]
  const nav = { onBack, onNext, nextLabel, ready: true }
  const shownDice = rolling ?? market.dice ?? Array.from({ length: funds.count }, () => 1)

  return (
    <section className="forge-step forge-hero">
      <ForgeEmbers />
      <ForgeFooter {...nav} top />

      <p className="forge-kicker">The Forge · Step {stepNumber}</p>
      <h2 className="forge-title">
        Fill Your Pack
        <ForgeHelpButton open={help} onToggle={() => setHelp(!help)} />
      </h2>
      <p className="forge-sub">Roll for your purse, then walk the market — the smith, the armorer and the general store. Whatever you carry out of town is yours.</p>
      {help && (
        <ForgeHelpNote ruleID="phb_ch06_starting_money">
          Your purse comes from your class group (PHB Table 43) — or from your kit, when it says otherwise. A multi-class hero rolls the best of their
          classes. Starting above 1st level, your DM may add more gold. Prices are the PHB’s (Tables 44–46).
        </ForgeHelpNote>
      )}

      <div className="eq-layout">
        <div className="eq-col">
          <div className="mm-card">
            <p className="mm-card-label">
              Your purse · {funds.label} ({funds.source})
            </p>
            <div className="eq-purse">
              {(rolling || !market.dice) && (
                <ForgeDice dice={shownDice.map((v) => ({ kind: dieKind(funds.sides), value: v }))} rollKey={rolling ? rollKey : 0} onSettled={settled} />
              )}
              {market.dice && !rolling && (
                <>
                  <div className="eq-dice-row" aria-label={`Rolled ${market.dice.join(', ')}`}>
                    {market.dice.map((v, i) => (
                      <span key={i} className="eq-die">
                        {v}
                      </span>
                    ))}
                  </div>
                  <div className="eq-gold">
                    <b>{formatMoney(left)}</b>
                    <span>left of {formatMoney(budget)}</span>
                  </div>
                  <div className="eq-stack" aria-hidden="true">
                    {Array.from({ length: Math.min(12, Math.ceil(left / 1000)) }, (_, i) => (
                      <i key={i} style={{ height: 14 + ((i * 7) % 30) }} />
                    ))}
                  </div>
                </>
              )}
              {!market.dice && !rolling && (
                <button type="button" className="sp-roll" onClick={roll}>
                  Roll {funds.label}
                </button>
              )}
            </div>
            <div className="eq-extra">
              <span>Gold from your DM</span>
              <button type="button" className="th-btn5" aria-label="10 gp less from your DM" disabled={market.extraGold <= 0} onClick={() => commit({ ...market, extraGold: Math.max(0, market.extraGold - 10) })}>
                −
              </button>
              <b>{market.extraGold} gp</b>
              <button type="button" className="th-btn5" aria-label="10 gp more from your DM" onClick={() => commit({ ...market, extraGold: market.extraGold + 10 })}>
                +
              </button>
              <button type="button" className="th-btn1" onClick={() => commit({ ...market, extraGold: market.extraGold + 100 })}>
                +100
              </button>
            </div>
            <p className="eq-note">
              {priest
                ? 'Priests buy only what they need; when they leave town, all but two or three gold pieces go back to their temple (PHB). Settle the rest with your DM.'
                : 'Starting above 1st level? Your DM may add more gold to your purse (PHB).'}
            </p>
          </div>

          <nav className="eq-stalls" aria-label="Stalls">
            {stalls.map((s) => (
              <button
                key={s.id}
                type="button"
                className={stall === s.id ? 'eq-stall eq-stall-on' : 'eq-stall'}
                aria-pressed={stall === s.id}
                onClick={() => {
                  setStall(s.id)
                  setFilter('all')
                  setQuery('')
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={s.icon} />
                </svg>
                {s.name}
              </button>
            ))}
          </nav>
          <div className="eq-bar">
            {current.filters.map(([id, name]) => (
              <button key={id} type="button" className={filter === id ? 'mm-chip mm-chip-on' : 'mm-chip'} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {name}
              </button>
            ))}
            <input className="sp-search" type="search" placeholder="Search the stall…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>
          {data === null ? (
            <p className="mm-loading sp-loading">Opening the market…</p>
          ) : (
            <div className="eq-wares">
              {shelf.map((w) => {
                const dear = !market.dice || w.price.cp > left
                const owned = market.cart[w.key] ?? 0
                const facts = [
                  w.damage ? `${w.damage}` : '',
                  w.armorClass != null ? `AC ${w.armorClass}` : '',
                  w.kind === 'shield' ? 'AC −1' : '',
                  w.weight ? `${Math.round(w.weight * 10) / 10} lb` : '',
                ].filter(Boolean)
                return (
                  <button key={w.key} type="button" className={dear ? 'eq-ware eq-ware-dear' : 'eq-ware'} aria-label={`Buy ${w.name}, ${formatMoney(w.price.cp)}`} onClick={() => purchase(w, 1)}>
                    <span className="eq-tag">
                      {w.price.cp === 0 ? 'free' : formatMoney(w.price.cp)}
                      {w.price.per > 1 ? ` / ${w.price.per}` : ''}
                    </span>
                    <b>{w.name}</b>
                    <span className="eq-meta">
                      {facts.map((f) => (
                        <span key={f}>{f}</span>
                      ))}
                      {w.kind === 'weapon' && trained.has(w.proficiency ?? '') && <span className="eq-badge">Trained</span>}
                      {w.kind === 'weapon' && (hints.required.has(w.proficiency ?? '') || hints.recommended.has(w.proficiency ?? '')) && (
                        <span className="eq-badge eq-badge-kit">Kit</span>
                      )}
                      {owned > 0 && <span className="eq-badge eq-badge-owned">{owned > 1 ? `×${owned}` : 'Owned'}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <aside className="eq-panel" aria-label="Your hero">
          <div className="mm-card">
            <p className="mm-card-label">Dressed for the road</p>
            <div className="eq-doll">
              <span className="eq-hero">
                <ForgeImage images={portrait} alt="" compact />
              </span>
              <div className="eq-ac" aria-label={`Armor Class ${ac}`}>
                <b>{ac}</b>
                <span>AC</span>
              </div>
              <div className={piece('helmet') ? 'eq-slot eq-slot-head eq-slot-full' : 'eq-slot eq-slot-head'}>
                Head<b>{piece('helmet')?.name ?? '—'}</b>
              </div>
              <div className={piece('armor') ? 'eq-slot eq-slot-body eq-slot-full' : 'eq-slot eq-slot-body'}>
                Body<b>{piece('armor')?.name ?? 'Clothes'}</b>
              </div>
              <div className={piece('shield') ? 'eq-slot eq-slot-shield eq-slot-full' : 'eq-slot eq-slot-shield'}>
                Shield<b>{piece('shield')?.name.replace(/ Shield$/, '') ?? '—'}</b>
              </div>
              <div className={arms.length ? 'eq-slot eq-slot-hands eq-slot-full' : 'eq-slot eq-slot-hands'}>
                In hand<b>{arms.length ? arms.join(', ') : 'Bare hands'}</b>
              </div>
            </div>
            <div className="eq-weight">
              <div className="eq-weight-bar">
                <i style={{ width: `${Math.min(100, (weight / allowance) * 100)}%` }} />
              </div>
              <p>
                {Math.round(weight)} lb carried · {allowance} lb before you slow down (Strength {draft.abilities.strength})
              </p>
            </div>
          </div>

          <div className="mm-card">
            <p className="mm-card-label">Quick bundles</p>
            <div className="eq-bar">
              {bundles.map((b) => {
                const price = b.items.reduce((n, [name, qty]) => n + (wares.find((w) => w.stall === 'store' && w.name === name)?.price.cp ?? 0) * qty, 0)
                return (
                  <button key={b.name} type="button" className="mm-chip" title={b.hint} disabled={!market.dice} onClick={() => takeBundle(b.items)}>
                    {b.name} · {formatMoney(price)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mm-card">
            <p className="mm-card-label">
              Your pack · {cartWares.length} {cartWares.length === 1 ? 'thing' : 'things'}
            </p>
            {cartWares.length > 0 ? (
              <ul className="eq-pack">
                {cartWares.map(({ ware, qty }) => (
                  <li key={ware.key}>
                    <span>{ware.name}</span>
                    <em>{ware.kind === 'ammo' ? `×${qty * ware.price.per}` : qty > 1 ? `×${qty}` : formatMoney(ware.price.cp)}</em>
                    <button type="button" className="eq-x" aria-label={`Give back ${ware.name}`} onClick={() => purchase(ware, -1)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="eq-note">Nothing yet. Tap any ware to buy it; tap × to give it back.</p>
            )}
          </div>

          <div className="mm-card">
            <p className="mm-card-label">Laws of the market</p>
            <ul className="sp-rules">
              <li>Your purse comes from your class group (PHB Table 43) — or from your kit, when it says otherwise.</li>
              <li>Arrows, quarrels and bullets come by the dozen or half-dozen; the price is per bundle.</li>
              <li>One suit of armor, one shield, one helmet. Buying another swaps it.</li>
              <li>Carry more than your Strength allows and you slow down; the sheet keeps the full count.</li>
            </ul>
          </div>
        </aside>
      </div>

      <ForgeFooter {...nav} />
    </section>
  )
}
