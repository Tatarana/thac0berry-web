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

## Slots de magia do paladino (e do ranger) na ficha

O Forge já grava as esferas do paladino (v0.120.0), mas
`computedSpellSlotAllotments` (`src/rules/rules.ts`) não dá slots ao paladino:
no 9º nível ou acima, a folha de magia dele não tem onde memorizar. Falta a
Tabela 17 do PHB na tabela de slots (`paladinSpellProgression` já existe em
`src/rules/spellbook.ts`; sem bônus de Sabedoria). Mexe numa regra
compartilhada: conferir com o app iPad antes. O ranger tem o mesmo problema
(Tabela 18).

