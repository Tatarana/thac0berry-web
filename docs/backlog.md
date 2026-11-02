# Backlog

Ideias e pendências aprovadas para depois. Cada item vira uma entrega própria
quando o usuário pedir.

## Itens que lançam magias (power.uses), demais livros

Feito (2026-10-24): `power.uses` nos itens do DMG (Rods/Staves/Wands, anéis e
itens diversos; `scripts/add_magic_item_uses.py` no `thac0berry-data`). Falta:
os itens dos outros livros (Encyclopedia Magica, revistas, cenários; mais de 5
mil), por lotes. Item sem `power.uses` ainda entra na spell sheet se tiver o
`power.spell` antigo.

## Bônus de AC dos itens mágicos, segunda etapa

Bracers of Defense (trocam a AC base em vez de dar bônus). O `acBonus` fixo do
catálogo já é lido (v0.112.1).

## Slots de magia do paladino na ficha

O Forge já grava as esferas do paladino (v0.120.0), mas
`computedSpellSlotAllotments` (`src/rules/rules.ts`) não dá slots ao paladino:
no 9º nível ou acima, a folha de magia dele não tem onde memorizar. Falta o
mesmo que o ranger ganhou em 2026-11-02 (Tabela 17 em `warriorCasters`, sem
bônus de Sabedoria, folha só do 9º nível em diante, conjura como nível − 8).
Web primeiro: o iPad também não dá folha de magias a paladino nem ranger
(`hasSpellSheet` lá é só Cleric, Mage e Bard); a divergência fica em
`webAhead` no `tests/rules.test.ts`.

## Druida sem folha de magias na ficha

Achado em 2026-11-02: o druida não está em `hasSpellSheet` nem em
`computedSpellSlotAllotments` (web e iPad). Ele usa a mesma progressão do
clérigo (PHB Tabela 24, com bônus de Sabedoria), então a folha de magias dele
não abre. O Forge já grava as esferas (Animal, Elemental, Healing, Plant,
Weather; Divination minor).
