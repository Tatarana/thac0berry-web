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

### Kits da Dragon Magazine (v0.140.0)

119 kits (`scripts/add_dragon_magazine_kits.py` no `thac0berry-data`), incluindo o Spellarcher (Demihuman/Half-Elf,
Fighter/Mage). Os 12 do artigo "The Complete Half-Elf" vão para Demihuman/Half-Elf; os 6 anões e 2 avariel também.
Classe lida da página, não do `classGroup` minerado. 19 kits de fora (Masque of the Red Death, dragões, 9 ambíguos;
ver o README do `thac0berry-data`). `mechanics` quase vazio (requisitos e proficiências só no texto). Teste:
`tests/elfKits.test.ts` (inclui "todo kit aparece no compêndio"). Pendências: decidir os 9 ambíguos; nome duplicado
"Forester" (CFH).

Pendências:
- Ícone do tile "Demihuman Kits" do Compêndio (aparece ✦ até o usuário mandar a arte).
- ~~**Raças em dados**~~ **Feito (2026-11-20, v0.147.0)**, ver "Raças em dados" abaixo.
- iPad: rodar `python Scripts/sync_data.py` no `thac0berry-ipad` (o CI de lá acusa a divergência); o iPad
  ainda usa `bookOrder` fixo, então CWH/CBN/TOM/CBE não aparecem lá até isso mudar.
- ~~Os outros kits minerados fora do app~~ **Feito (2026-11-20, v0.148.0)**, ver "Kits que faltavam" abaixo.

## Raças em dados (2026-11-20, web v0.147.0)

Feito: `races.json` no `thac0berry-data` (schema `race.schema.json`; gerado por `scripts/build_races.py` a partir da
mineração + `scripts/race_curation.json`) substitui as tabelas fixas de `raceKit.ts`. Relatório das divergências e das
raças escondidas: `thac0berry-data/docs/racas-divergencias-2026-11.md`.

- **As 17 raças de antes** (6 PHB, 10 planares, Half-Vistani; o texto da ficha não mudou) têm os valores do app como
  verdade; o teste de não-regressão (`tests/raceKitSnapshot.test.ts` + fixture gerado com o código antigo) compara
  ~50 funções públicas de raça/multiclasse/combos para elas.
- **83 jogáveis** (17 de antes + 10 Dark Sun + 17 subraças Core dos Complete Books + Nathri e Nethling em Planescape +
  5 do Sea of Fallen Stars em Forgotten Realms + Half-Greyhawk Dragon + 22 dragões do Council of Wyrms + 9 do Spelljammer).
  Council of Wyrms e Spelljammer só não aparecem porque o cenário está em construção (`raceSelectable` o garante).
  Escondidas (`playable: false`): 30 humanoides, 18 de cenários fora do Forge (Dragonlance, Kara-Tur, Savage Coast, Celts,
  Vikings), 2 duplicatas e 26 "para decisão do usuário".
- **Carregamento:** `main.tsx` carrega `races.json` antes do primeiro render (`loadRaces()` em `src/data/races.ts`) e o
  entrega a `setRaceData` (registro em `raceKit.ts`); as funções seguem síncronas e com as mesmas assinaturas
  (`allRaces`, `singleClassBonus` e `demiBardKits` são objetos preenchidos no lugar). Nos testes, `tests/setup-races.ts`
  (`--import` no script `test`). O texto longo do livro vai para `races-content.json`, lido só no detalhe (`RaceDetail`).
- **Subraças (`baseRace`)** valem para kits (um kit "Elf" aceita Drow, Grey Elf, Athasian Elf; "Any except elf" as
  exclui), imagem do Forge (cai na da raça-base), "é humano?" (classe dupla do Athasian Human), Gypsy/Anchorite e a tabela
  de altura/peso/idade. Regras (bônus de CON nos testes, sono/charme do elfo, bônus de combate, Endurance, demi-bardo) só
  vêm da raça-base quando o texto da subraça traz "Standard <Raça> Abilities" (o script copia; Drow fica sem a resistência
  do elfo). Limites de nível, requisitos, ajustes e combinações são sempre os da própria raça.
- **Classes que o app não tem** (Gladiator, Defiler, Preserver, Shaman…) ficam no JSON e são ignoradas em limites e
  combinações; uma raça nova só combina com as 12 classes do app.
- **Seletores:** o Forge e a troca de raça da ficha mostram só raças jogáveis do Core e dos cenários da campanha (a raça
  atual fica sempre), agrupadas por origem (Player's Handbook, Subraces, cada cenário). Isto muda a decisão de 2026-10-17
  para a ficha: antes a lista mostrava tudo e só avisava; agora a raça de cenário fora da campanha só aparece se a campanha
  não restringir cenários. Aviso de cenário (`raceSettingWarning`, `settingFit`) continua para fichas já existentes. Cada raça
  tem ⓘ/"About" com os dados e o texto do livro. Raça nova sem arte usa a imagem da raça-base ou o "Art coming".
- `forgeArtRaces` (forgeCombos.ts): só as 17 de antes têm arte de combinação (e entram no banner da Home); a raça nova
  entra ali quando a arte vier.
- Pendências: o usuário decidir as "para decisão" (lista no relatório); `sync_data.py` do iPad passa a copiar `races.json`
  (o app não o lê); regras especiais das raças novas ficam só em texto (drow, thri-kreen, mul…); Stout/Tallfellow
  Halfling têm "+1 DEX or CON/WIS" no livro, o app aplica só o +1 DEX; arte das raças novas.


## Kits que faltavam (2026-11-20, web v0.148.0)

Feito: 234 kits novos no `thac0berry-data` (`scripts/add_missing_kits_2026_11.py`; relatório em
`thac0berry-data/docs/kits-faltantes-2026-11.md`): 100 jogáveis (Skills & Powers, Complete Books de anões e de
gnomos/halflings, Sages & Specialists, Necromancers...), 58 de cenário em construção, 76 escondidos. Web:
- `kit.playable === false` (campo novo, `hiddenReason`, `note`) e os kits de cenário em construção saem do Forge e do
  seletor da ficha (`kitSelectable` em `src/rules/raceKit.ts`, como `raceSelectable`); o kit já escolhido continua à vista.
  Isto também esconde o `Dragon Psionicist` (Council of Wyrms), que aparecia em "todos os mundos".
- Compêndio mostra todos, com o cenário ao lado do livro e o aviso dos escondidos (`kitAvailabilityNote`);
  subclasses novas: Gnome, Halfling (Demihuman), Gladiator (Warrior), Tradesman (Rogue), Mystic (Priest).
- Testes: `tests/missingKits.test.ts`; `tests/elfKits.test.ts` ajustado (a regra "todo kit aparece no compêndio" vale
  também para os escondidos).

Pendências (decisão do usuário):
- Os 11 kits `undecided` (Rogues of the Moonsea, Dragon PC/Sage/Ward, Taltos, Mystery Man, Tribal Scout, Zande Witch
  Woman, Manikin) e a prateleira dos Skills & Powers (todas as classes; o grupo é só o arquétipo).
- Tirar do escondido, quando o usuário quiser: humanoides (precisa das raças jogáveis), Red Steel/Glory of Rome
  (precisam do cenário no Forge), Gladiator de Dark Sun (precisa da classe).
- `Forester` duplicado (CFH) segue pendente; Courier (avariel) escondido por raça enquanto Skywarden e Talon seguem visíveis.
- iPad: `python Scripts/sync_data.py`.
