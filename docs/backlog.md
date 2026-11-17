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

## Regras e kits do Complete Book of Elves e livros "Complete" (2026-11-16, web v0.140.0)

Feito: o `thac0berry-data` ganhou 202 regras (CBE, CWH, CBN, TOM; `scripts/add_mined_rulebooks.py`) e
30 kits (`scripts/add_elf_and_misc_kits.py`): os 11 do CBE no grupo novo **Demihuman** (subclass Elf,
só para elfos), mais kits de Rogues of the Realms, Elves of Athas, Planewalker's Handbook, Chronomancer
Book e Age of Heroes. Decisões do usuário: kit multiclasse aparece a quem tem qualquer classe dele
(`classEligibility.combination` avisa se a ficha não é essa multiclasse; só aviso); a regra "kit de
guerreiro/ladrão só classe única" vale só para kits dos Complete Handbooks. Testes: `tests/elfKits.test.ts`.
Compêndio: página `/compendium/kits/demihuman`; resumos de kit sem os `*` na tela.

Pendências:
- Ícone do tile "Demihuman Kits" do Compêndio (aparece ✦ até o usuário mandar a arte).
- **Raças em dados** (próxima entrega, aprovada): `races.json` no `thac0berry-data` (157 raças já
  extraídas no repo de mineração, `data/player_races/`) para substituir as raças fixas em `raceKit.ts`,
  com validação contra os valores atuais (PHB Tabela 7, planares, Half-Vistani) antes de trocar.
- iPad: rodar `python Scripts/sync_data.py` no `thac0berry-ipad` (o CI de lá acusa a divergência); o iPad
  ainda usa `bookOrder` fixo, então CWH/CBN/TOM/CBE não aparecem lá até isso mudar.
- Os outros kits minerados fora do app (Complete Books de anões, gnomos/halflings e humanoides, Al-Qadim,
  Spacefarer, Skills & Powers…) seguem o mesmo molde do grupo Demihuman.
