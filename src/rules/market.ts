// Etapa "Fill Your Pack" do The Forge (protótipo "Step 9 · Equipment" no
// canvas): dinheiro inicial e compras. Só funções puras.
//
// - Dinheiro (PHB Tabela 43): guerreiro 5d4×10 po, sacerdote 3d6×10, ladino
//   2d6×10, mago (1d4+1)×10; psionicista 3d4×10 (CPsiH). Multiclasse: a faixa
//   mais vantajosa. O kit que traz `startingCash` ("3d6x10 gp", "1d4") troca
//   a da classe. Acima do 1º nível, o mestre decide (PHB): o jogador soma o
//   ouro extra à mão (decisão do usuário, 2026-11-02).
// - Sacerdote: o PHB manda devolver ao templo tudo menos 2 ou 3 po depois das
//   compras; o Forge só avisa (decisão do usuário: o jogador alinha com o mestre).
// - Preços e pesos: armor.json, mundane_items.json e weapons.json (PHB Table 44,
//   com a munição à parte). Tudo em peças de cobre (1 po = 100 pc).
// - Na ficha: armadura e escudo vão para a caixa de armadura (setArmorPieces);
//   o resto — armas, munição, elmo, equipamento — para a tabela de equipamento
//   da página 2, com local e peso. A lista de armas da ficha é a de
//   proficiências (etapa 7), e comprar uma arma não gasta slot.

import { classGroup } from './rules.ts'

export interface Price {
  /** Preço em peças de cobre. */
  cp: number
  /** Quantas unidades vêm por esse preço (12 flechas por 3 pp). */
  per: number
}

/** "15 gp", "3 sp/12", "1 cp.", "4,000-10,000 gp" (vale o menor), "—" (de graça); null se não dá para ler. */
export function parsePrice(text: string | null | undefined): Price | null {
  const t = (text ?? '').replace(/,/g, '').trim()
  if (t === '—' || t === '-') return { cp: 0, per: 1 }
  const m = /^(\d+)(?:\s*-\s*\d+)?\s*(gp|sp|cp)\.?(?:\s*\/\s*(\d+))?/i.exec(t)
  if (!m) return null
  return { cp: Number(m[1]) * ({ gp: 100, sp: 10, cp: 1 } as Record<string, number>)[m[2].toLowerCase()], per: Number(m[3] ?? 1) }
}

/** "35 lbs." → 35; "1/2 lbs." → 0.5; "*" ou vazio → 0. */
export function parseWeight(text: string | null | undefined): number {
  const t = (text ?? '').trim()
  const frac = /^(\d+)\s*\/\s*(\d+)/.exec(t)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = /^([\d.]+)/.exec(t)
  return n ? Number(n[1]) : 0
}

/** "18 gp 5 sp", "7 sp", "0 gp". */
export function formatMoney(cp: number): string {
  const gp = Math.floor(cp / 100)
  const sp = Math.floor((cp % 100) / 10)
  const c = cp % 10
  const parts = [gp ? `${gp} gp` : '', sp ? `${sp} sp` : '', c ? `${c} cp` : ''].filter(Boolean)
  return parts.length ? parts.join(' ') : '0 gp'
}

/** As moedas do que sobrou, para o tesouro da ficha. */
export const coins = (cp: number) => ({ gold: Math.floor(cp / 100), silver: Math.floor((cp % 100) / 10), copper: cp % 10 })

// --- Dinheiro inicial -------------------------------------------------------------------

export interface FundsRoll {
  count: number
  sides: number
  plus: number
  times: number
  /** "5d4 × 10 gp". */
  label: string
  /** De onde veio: a tabela da classe ou o kit. */
  source: string
}

const byGroup: Record<string, Omit<FundsRoll, 'source'>> = {
  Warrior: { count: 5, sides: 4, plus: 0, times: 10, label: '5d4 × 10 gp' },
  Priest: { count: 3, sides: 6, plus: 0, times: 10, label: '3d6 × 10 gp' },
  Rogue: { count: 2, sides: 6, plus: 0, times: 10, label: '2d6 × 10 gp' },
  Wizard: { count: 1, sides: 4, plus: 1, times: 10, label: '(1d4+1) × 10 gp' },
  Psionicist: { count: 3, sides: 4, plus: 0, times: 10, label: '3d4 × 10 gp' },
}

/** Média em po, para escolher a faixa mais vantajosa. */
export const averageGold = (f: Pick<FundsRoll, 'count' | 'sides' | 'plus' | 'times'>) => (f.count * (f.sides + 1) / 2 + f.plus) * f.times

/** O texto do kit ("3d6x10 gp", "1d4", "3d4x30", "2d4 gp") como rolagem; null se não é uma rolagem. */
export function kitFunds(text: string | null | undefined): FundsRoll | null {
  const m = /^\s*(\d+)d(\d+)\s*(?:[x×]\s*(\d+))?\s*(gp)?\s*$/i.exec(text ?? '')
  if (!m) return null
  const times = Number(m[3] ?? 1)
  return { count: Number(m[1]), sides: Number(m[2]), plus: 0, times, label: `${m[1]}d${m[2]}${times > 1 ? ` × ${times}` : ''} gp`, source: 'your kit' }
}

/** O dinheiro do personagem: o do kit, ou a melhor faixa entre as classes (PHB Tabela 43; CPsiH). */
export function startingFunds(classes: string[], kitCash?: string | null): FundsRoll {
  const kit = kitFunds(kitCash)
  if (kit) return kit
  const groups = classes.map((cls) => (classGroup(cls) in byGroup ? classGroup(cls) : 'Warrior'))
  const best = groups.reduce((a, b) => (averageGold(byGroup[b]) > averageGold(byGroup[a]) ? b : a), groups[0] ?? 'Warrior')
  return { ...byGroup[best], source: best === 'Psionicist' ? 'CPsiH' : 'PHB Table 43' }
}

/** Ouro da rolagem, em peças de cobre. */
export const rolledCopper = (f: Pick<FundsRoll, 'plus' | 'times'>, dice: number[]) => (dice.reduce((a, b) => a + b, 0) + f.plus) * f.times * 100

// --- O mercado --------------------------------------------------------------------------

export type Stall = 'smithy' | 'armorer' | 'store'
export type WareKind = 'weapon' | 'ammo' | 'armor' | 'shield' | 'helmet' | 'gear' | 'clothing'

export interface Ware {
  /** Chave estável na sacola ("weapon:long_sword", "ammo:Flight arrow"…). */
  key: string
  name: string
  kind: WareKind
  stall: Stall
  price: Price
  /** Peso de uma unidade. */
  weight: number
  /** Para o selo "Trained": a chave de proficiência (armas e munição). */
  proficiency?: string
  /** CA base (armadura). */
  armorClass?: number | null
  damage?: string
  /** Tipo de dano (armas), para a regra da classe. */
  weaponType?: string | null
  /** Munição: as armas que a disparam, para a regra da classe. */
  launchers?: { name: string; type?: string | null }[]
}

type WeaponData = {
  id: string
  name: string
  type?: string | null
  damageSmall?: string | null
  cost?: string | null
  weight?: string | null
  ammunition?: { name: string; cost: string; quantity: number; weight?: string | null } | null
}
type ArmorData = { id: string; name: string; kind: 'armor' | 'helmet' | 'shield'; baseAC?: number | null; cost?: string | null; weight?: string | null }
type GoodsData = { id: string; name: string; category: string; cost?: string | null; weight?: string | null }

/** Nome sem a munição: "Long bow (Flight arrow)" → "Long bow". */
const launcher = (name: string) => name.replace(/\s*\((?:flight|sheaf) arrow\)|\s*\((?:hand|heavy|light) quarrel\)|\s*\((?:bullet|stone)\)/i, '').trim()

/** As mercadorias das três barracas. Uma arma com várias munições vira uma só; cada munição, uma mercadoria. */
export function marketWares(weapons: WeaponData[], armor: ArmorData[], goods: GoodsData[]): Ware[] {
  const out: Ware[] = []
  const seen = new Set<string>()
  for (const w of weapons) {
    const price = parsePrice(w.cost)
    if (!price) continue
    const name = launcher(w.name)
    if (!seen.has(name)) {
      seen.add(name)
      out.push({ key: `weapon:${name}`, name, kind: 'weapon', stall: 'smithy', price, weight: parseWeight(w.weight), proficiency: name.toLowerCase(), weaponType: w.type ?? null, damage: w.ammunition ? undefined : (w.damageSmall ?? undefined) })
    }
    const a = w.ammunition
    if (a) out.find((ware) => ware.key === `ammo:${a.name}`)?.launchers?.push({ name, type: w.type })
    if (a && !seen.has(`ammo:${a.name}`)) {
      seen.add(`ammo:${a.name}`)
      const ap = parsePrice(a.cost)
      if (ap) out.push({ key: `ammo:${a.name}`, name: a.name, kind: 'ammo', stall: 'smithy', price: { cp: ap.cp, per: a.quantity }, weight: parseWeight(a.weight), damage: w.damageSmall ?? undefined, launchers: [{ name, type: w.type }] })
    }
  }
  for (const a of armor) {
    const price = parsePrice(a.cost)
    if (price) out.push({ key: `${a.kind}:${a.id}`, name: a.name, kind: a.kind, stall: 'armorer', price, weight: parseWeight(a.weight), armorClass: a.baseAC ?? null })
  }
  for (const g of goods) {
    if (g.category !== 'Miscellaneous Equipment' && g.category !== 'Clothing') continue
    const price = parsePrice(g.cost)
    if (price) out.push({ key: `goods:${g.id}`, name: g.name, kind: g.category === 'Clothing' ? 'clothing' : 'gear', stall: 'store', price, weight: parseWeight(g.weight) })
  }
  return out
}

/** A sacola: chave da mercadoria → quantas vezes comprou (munição: pacotes). */
export type Cart = Record<string, number>

export function cartCost(cart: Cart, wares: Map<string, Ware>): number {
  return Object.entries(cart).reduce((n, [key, qty]) => n + (wares.get(key)?.price.cp ?? 0) * qty, 0)
}

/** Peso total (a munição pesa por unidade do pacote). */
export function cartWeight(cart: Cart, wares: Map<string, Ware>): number {
  return Object.entries(cart).reduce((n, [key, qty]) => {
    const w = wares.get(key)
    return n + (w ? w.weight * qty * (w.kind === 'ammo' ? w.price.per : 1) : 0)
  }, 0)
}

/** Compra (ou devolve, com n negativo). Armadura, escudo e elmo: só um de cada; comprar outro troca. */
export function buy(cart: Cart, ware: Ware, n: number, budget: number, wares: Map<string, Ware>): Cart {
  const next: Cart = { ...cart }
  if (n > 0 && (ware.kind === 'armor' || ware.kind === 'shield' || ware.kind === 'helmet')) {
    for (const key of Object.keys(next)) if (wares.get(key)?.kind === ware.kind) delete next[key]
    next[ware.key] = 1
  } else {
    next[ware.key] = Math.max(0, (next[ware.key] ?? 0) + n)
    if (next[ware.key] === 0) delete next[ware.key]
  }
  return cartCost(next, wares) > budget ? cart : next
}

/** CA com a armadura, o escudo (−1) e a defesa da Destreza (texto da ficha, "−2"). */
export function armorClassOf(cart: Cart, wares: Map<string, Ware>, dexterityDefense: number): number {
  let base = 10
  let shield = 0
  for (const key of Object.keys(cart)) {
    const w = wares.get(key)
    if (w?.kind === 'armor' && w.armorClass != null) base = w.armorClass
    if (w?.kind === 'shield') shield = 1
  }
  return base - shield + dexterityDefense
}

/** As linhas da tabela de equipamento da ficha (página 2): item, local e peso. */
export function equipmentRows(cart: Cart, wares: Map<string, Ware>): { item: string; location: string; weight: string; matchedItemID: string | null }[] {
  const location: Record<WareKind, string> = { weapon: 'Carried', ammo: 'Quiver', armor: 'Worn', shield: 'Carried', helmet: 'Worn', gear: 'Pack', clothing: 'Worn' }
  return Object.entries(cart).flatMap(([key, qty]) => {
    const w = wares.get(key)
    if (!w) return []
    const count = w.kind === 'ammo' ? qty * w.price.per : qty
    const weight = w.weight * count
    return [
      {
        item: count > 1 ? `${w.name} ×${count}` : w.name,
        location: location[w.kind],
        weight: weight ? `${Math.round(weight * 10) / 10} lbs.` : '',
        matchedItemID: w.stall === 'store' ? key.replace(/^goods:/, '') : null,
      },
    ]
  })
}

/** A bolsa e a sacola da etapa (vivem no CharacterForge). */
export interface MarketState {
  dice: number[] | null
  /** A fórmula com que os dados foram rolados ("5d4 × 10 gp"); trocou de classe ou kit, rola de novo. */
  rolledFor: string | null
  /** Ouro extra que o mestre deu (po), acima da rolagem. */
  extraGold: number
  cart: Cart
}

export const emptyMarket = (): MarketState => ({ dice: null, rolledFor: null, extraGold: 0, cart: {} })

/** Pacotes prontos da tela (nomes de mundane_items.json). */
export const bundles: { name: string; hint: string; items: [string, number][] }[] = [
  {
    name: 'Adventurer',
    hint: 'Backpack, blanket, rope, torches, flint and steel, wineskin, pouch',
    items: [['Backpack', 1], ['Winter blanket', 1], ['Rope (per 50 ft.), Hemp', 1], ['Torch', 6], ['Flint and steel', 1], ['Wineskin', 1], ['Belt pouch, Small', 1]],
  },
  { name: 'Burglar', hint: 'Thieves’ picks, grappling hook, a large sack, small mirror', items: [["Thieves' picks", 1], ['Grappling hook', 1], ['Sack, Large', 1], ['Mirror, small metal', 1]] },
  { name: 'Pilgrim', hint: 'Holy symbol, candles, a bell, chalk', items: [['Holy item (symbol, water, etc.)', 1], ['Candle', 6], ['Bell', 1], ['Chalk', 2]] },
]
