import { Field, PaperModal } from '../components/DetailBits'
import { TableCompendium, type Column } from '../components/TableCompendium'
import {
  armorKindLabel,
  formattedRange,
  mundaneCategoryOrder,
  weaponTypeLabel,
  type ArmorPiece,
  type MundaneItem,
  type Weapon,
} from '../data/gear'

const dash = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? '—' : String(value))

// ---- Armas ----

const weaponColumns: Column<Weapon>[] = [
  { header: 'Size', value: (w) => dash(w.size) },
  { header: 'Type', value: (w) => dash(w.type) },
  { header: 'Speed', value: (w) => String(w.speedFactor) },
  { header: '#AT', value: (w) => w.attacksPerRound },
  { header: 'Dmg S/M', value: (w) => dash(w.damageSmall) },
  { header: 'Dmg L', value: (w) => dash(w.damageLarge) },
  { header: 'Range', value: (w) => dash(formattedRange(w)) },
]

const weaponGroupOf = (w: Weapon) => weaponTypeLabel(w.type)

// Piercing, Slashing, Bludgeoning; depois os combinados (P/S…) em ordem
// alfabética; "Unclassified" por último (iPad: WeaponCompendiumView).
function weaponGroupOrder(present: string[]): string[] {
  const known = ['Piercing', 'Slashing', 'Bludgeoning']
  const others = present.filter((g) => !known.includes(g) && g !== 'Unclassified').sort()
  return [...known, ...others, 'Unclassified']
}

function WeaponDetail({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  return (
    <PaperModal title={weapon.name} subtitle={weapon.source ?? undefined} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Size" value={weapon.size} />
        <Field label="Type" value={weapon.type} />
        <Field label="Speed Factor" value={String(weapon.speedFactor)} />
        <Field label="#AT" value={weapon.attacksPerRound} />
        <Field label="Dmg vs. S/M" value={weapon.damageSmall} />
        <Field label="Dmg vs. L" value={weapon.damageLarge} />
        <Field label="Range (S/M/L)" value={formattedRange(weapon)} />
      </div>
    </PaperModal>
  )
}

export function WeaponCompendium() {
  return (
    <TableCompendium<Weapon>
      title="Weapons"
      file="weapons.json"
      noun="weapons"
      searchPlaceholder="weapon name"
      groupOf={weaponGroupOf}
      groupOrder={weaponGroupOrder}
      columns={weaponColumns}
      renderDetail={(weapon, onClose) => <WeaponDetail weapon={weapon} onClose={onClose} />}
    />
  )
}

// ---- Armaduras ----

const armorColumns: Column<ArmorPiece>[] = [
  { header: 'AC', value: (a) => dash(a.baseAC) },
  { header: 'Cost', value: (a) => dash(a.cost) },
  { header: 'Weight', value: (a) => dash(a.weight) },
]

const armorGroupOf = (a: ArmorPiece) => armorKindLabel[a.kind]
const armorGroupOrder = () => ['Armor', 'Helmets', 'Shields']

function ArmorDetail({ piece, onClose }: { piece: ArmorPiece; onClose: () => void }) {
  return (
    <PaperModal title={piece.name} subtitle={armorKindLabel[piece.kind]} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Base AC" value={piece.baseAC != null ? String(piece.baseAC) : null} />
        <Field label="Cost" value={piece.cost} />
        <Field label="Weight" value={piece.weight} />
      </div>
      {piece.baseAC == null && <p className="paper-soft">This item has no separate AC value in the PHB price table.</p>}
    </PaperModal>
  )
}

export function ArmorCompendium() {
  return (
    <TableCompendium<ArmorPiece>
      title="Armor"
      file="armor.json"
      noun="items"
      searchPlaceholder="armor, helmet or shield"
      groupOf={armorGroupOf}
      groupOrder={armorGroupOrder}
      columns={armorColumns}
      renderDetail={(piece, onClose) => <ArmorDetail piece={piece} onClose={onClose} />}
    />
  )
}

// ---- Equipamento ----

const itemColumns: Column<MundaneItem>[] = [
  { header: 'Cost', value: (i) => dash(i.cost) },
  { header: 'Weight', value: (i) => dash(i.weight) },
]

const itemGroupOf = (i: MundaneItem) => i.category
const itemGroupOrder = (present: string[]) => [
  ...mundaneCategoryOrder,
  ...present.filter((c) => !mundaneCategoryOrder.includes(c)).sort(),
]

function ItemDetail({ item, onClose }: { item: MundaneItem; onClose: () => void }) {
  return (
    <PaperModal title={item.name} subtitle={item.category} onClose={onClose}>
      <div className="detail-grid">
        <Field label="Cost" value={item.cost} />
        <Field label="Weight" value={item.weight} />
      </div>
    </PaperModal>
  )
}

export function EquipmentCompendium() {
  return (
    <TableCompendium<MundaneItem>
      title="Equipment"
      file="mundane_items.json"
      noun="items"
      searchPlaceholder="item name"
      groupOf={itemGroupOf}
      groupOrder={itemGroupOrder}
      columns={itemColumns}
      renderDetail={(item, onClose) => <ItemDetail item={item} onClose={onClose} />}
    />
  )
}
