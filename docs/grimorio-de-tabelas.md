# Table Grimoire: plano e log

Ferramenta do DM (hub DM Tools, só no modo DM): todas as tabelas dos livros
num lugar só, para consultar, pesquisar e rolar. Log do trabalho: decisões,
entregas e pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-08)

1. Tabelas criadas pelo mestre (encontros da campanha, DMG cap. 11): entrega
   própria, depois (precisa de tabela no Supabase e muda o documento de sync).
2. Rolagem: o app rola **e** o mestre digita o resultado do dado físico. Um
   **motor único de rolagem**, reutilizável no resto do app.
3. Tabelas que faltam: extrair do `thac0berry-data-mining` (de onde saíram
   todas as regras e tabelas).
4. Todas as tabelas, com filtro, incluindo as de cenários de campanha
   (Ravenloft etc.) separadas.
5. Nome na tela: "Table Grimoire".
6. (2026-10-08) Tabelas de cenário: no `rules.json`, com um código de livro
   por cenário (ex.: `RL` Ravenloft), como regras com texto. E filtro de
   **regras por cenário de campanha** (Rules Compendium), não só de tabelas.

## Dados (levantamento de 2026-10-08)

- `rules.json`: 202 tabelas estruturadas (`tables`: PHB 104, DMG 96, CPrH 2)
  e 330 tabelas em markdown no texto das regras dos suplementos e de Dark
  Sun (a primeira contagem, 378, via os cabeçalhos em duas linhas como duas
  tabelas), com o título numa linha em negrito acima.
- Faltam 35 tabelas do DMG, entre elas as 89–110 (subtabelas de itens
  mágicos, que a Tabela 88 cita), 54–56, 61–63, 66–70, 75 e 78.
- Defeitos: Tabela 88 diz "D20 Roll" com faixas 01–100; tabelas 51 e 84
  repetidas (em duas regras); 11 tabelas estruturadas sem número ("Table");
  "00" que virou "0" na última linha de várias tabelas d100 (o motor lê como
  100 e a tela mostra 00); CRH-21 (Aquatic Species Enemy) sem a linha 8.
- Também falta a Tabela 117 do DMG (citada pela 116, "Special Purpose").
- Cenários: nenhum livro de cenário no `rules.json` (só Dark Sun: DSC, DK,
  WatW). Ravenloft e os outros dependem do data-mining.
- O `thac0berry-data-mining` não está no GitHub (fica no PC do usuário, ao
  lado do `thac0berry-data`); sem ele, a GT4 não anda nesta sessão.

## Entregas

| # | Entrega | Estado |
|---|---|---|
| GT1 | Consulta: índice das tabelas (estruturadas + markdown) no build, tela `/dm/tables` com busca e filtros (livro, cenário, capítulo), ficha com link para a regra | feita (web v0.40.0) |
| GT2 | Motor de rolagem (`src/rules/dice.ts`: notação, faixas, rolar, achar linha) + Roll e resultado digitado na ficha + histórico | feita (web v0.41.0) |
| GT3 | Encadear: linha que cita outra tabela vira link e o Roll continua nela | feita (web v0.41.0) |
| GT4a | Lista de livros nos dados (`thac0berry-data/data/books.json`: título, cenário, ordem) + filtro de cenário no Rules Reference e no Table Grimoire | feita (web v0.42.0; data PR #2) |
| GT4 | Dados (thac0berry-data): tabelas que faltam do DMG e correções (dado da 88, títulos sem número, "0" → "00") | feita (web v0.57.0; thac0berry-data `gt4/tabelas-dmg`) |
| GT4b | Cenários (um por entrega), das páginas da wiki no dump do data-mining | Ravenloft feito (web v0.58–0.62, `docs/ravenloft.md`); Planescape feito (web v0.63.0); Forgotten Realms feito (web v0.66.0); Dragonlance feito (web v0.67.0); Council of Wyrms feito (web v0.68.0); Al-Qadim feito (web v0.69.0); Thri-Kreen feito (web v0.70.0, livro TKA no cenário Dark Sun). Birthright fora: o dump não tem o livro de regras. **GT4b concluída** |
| GT5a | Tabelas do mestre: na conta (`dm_table`), só do mestre, da campanha ativa ou do One-shot; editor (título, dado, colunas, linhas, avisos de faixa); "Your tables" no Table Grimoire, rolando com o mesmo motor | feita (web v0.79.0; backend `20261014180000`) |
| GT5b | "Copy to my tables" a partir de uma tabela de livro; "Copy to another campaign…" (cópia independente) | feita (web v0.80.0) — **GT5 concluída** |

## Backlog

- Birthright: sem livro de regras no dump (fora da GT4b).
- iPad: o hub diz "79 deities · Faiths & Avatars, Powers & Pantheons"
  (texto fixo em `CompendiumHubView.swift`); com o `sync_data.py`, passam a
  ser 101 (os deuses de Krynn).
- Geradores de magia do Council of Wyrms com falha na fonte da wiki: o de
  mago do 6º nível não existe; o de sacerdote do 6º tem uma faixa sobrando
  ("16-19 Conjure Fire Elemental"); o de mago do 9º não tem 37-48 nem 54-58.
  Precisa do livro para completar.
- Al-Qadim: quatro preços sem número na fonte da wiki (pão, perdiz, pavão
  e funda nas listas de equipamento do AA); precisa do livro.
- Resumos das regras com o markdown cru na lista ("**vision**", 83 regras):
  tarefa separada aberta em 2026-10-12.

## Log

- 2026-10-08: plano aprovado (decisões 1 a 5). Início da GT1.
- 2026-10-08, GT1 feita (web v0.40.0):
  - `src/rules/tableIndex.ts` (funções puras, roda no build e nos testes):
    junta as tabelas estruturadas e as em markdown do `rules.json` (título da
    linha em negrito acima; cabeçalho em duas linhas vira "Spell Level: 1");
    repetidas viram `alsoIn`; id estável (`dmg-84`, ou regra + posição sem
    número); cenário por livro (DSC, DK, WatW = Dark Sun);
  - `build-data.mjs` gera `public/data/tables.json`: 512 tabelas (~400 KB), de
    532 encontradas (20 repetidas);
  - tela `/dm/tables` (só modo DM) e cartão "Table Grimoire" no hub: busca por
    número ("88"), título e conteúdo (nessa ordem), chips de cenário, livro e
    capítulo; a ficha mostra a tabela e as regras de onde ela vem (abre a
    regra);
  - o filtro de capítulo substitui os "temas" do plano: sai direto dos dados,
    sem classificação feita à mão;
  - conferido no navegador (computador e celular, sem rolagem horizontal);
    testes: 105 (5 novos);
  - achado: a Tabela 65 do CRH tem cabeçalho de três níveis malformado na
    fonte (fica legível, não perfeita) — entra na GT4.
- 2026-10-08, GT2 e GT3 feitas (web v0.41.0):
  - motor único de dados `src/rules/dice.ts` (para o app inteiro): notação
    `NdM±K` (d100, d%, 2d10, 3d6+2), rolar com gerador injetável, texto de
    volta, dado que cobre um intervalo de resultados;
  - `src/rules/tableRoll.ts`: faixas ("01-05", "96-00", "00", "13+"), linhas
    de seção, plano da tabela (consultável: 177; rolável: 88), achar a
    linha, resultado digitado (0/00 = 100 no d100); dado do cabeçalho, ou das
    faixas quando passam do dobro dele (a 88 rola d100; o aviso aparece na
    ficha); faixas um pouco acima do dado (modificadores) mantêm o dado;
  - ficha: botão "Roll d100", campo "or your roll" (ou "Look up" nas tabelas
    por nível/atributo), resultado com a linha em destaque, histórico da
    visita ("This session", até 50, todas as tabelas);
  - lista: "roll d100" ao lado das roláveis e chip "Rollable (88)";
  - GT3: "Table N" nas células vira link quando a tabela existe (mesmo livro,
    ou outro com "in the PHB"); depois de um resultado que cita outra tabela,
    "Roll on Table N ›" abre e rola nela (115 → 116 conferido); tabela que
    falta fica pontilhada com "not in the data yet" (88 → 89–108, 116 → 117:
    dependem da GT4);
  - títulos com número romano (WatW: Table I–VII) passam a ter número;
  - conferido no navegador (88, 00, 115 → 116, histórico; celular sem
    rolagem horizontal); testes: 114 (9 novos);
  - achado no teste: link de tabela dentro do formulário virava botão de
    envio (Enter abria a tabela citada) — corrigido com `type="button"`.
- 2026-10-08: GT4 documentada como tarefa para outro agente (`docs/gt4-tarefa.md`).
- 2026-10-08: decisão 6 (cenários no `rules.json` com código de livro; filtro de regras por cenário). Proposta da GT4a (lista de livros nos dados + filtro de cenário nas regras) enviada ao usuário.
- 2026-10-08, GT4a feita (web v0.42.0, thac0berry-data PR #2):
  - thac0berry-data: `data/books.json` (14 livros: `id` = código do campo
    `book` das regras, `title` do `breadcrumbs`, `setting` "Core" ou o cenário,
    `order` a do iPad), gerado por `scripts/build_books.py` (para se o
    rules.json tiver livro fora da lista); schema `book.schema.json`;
  - web: `src/rules/books.ts` (ordem, cenários com Core primeiro, livros de um
    cenário, cenário de um livro); o build copia `books.json` e para se faltar
    livro; a lista fixa `bookOrder` e o "Dark Sun" fixo saíram do código;
  - Rules Reference: chips **Setting** (All / Core / Dark Sun) e **Book**
    (só os do cenário, com o título completo no toque e embaixo dos chips); a
    lista e a busca respeitam o filtro (busca "psionic combat": 40 em todos,
    31 em Dark Sun); subtítulo com a contagem de livros e cenários;
  - Table Grimoire usa os mesmos livros e cenários (56 tabelas de Dark Sun);
  - **ordem de merge**: o PR do thac0berry-data primeiro (o CI da web baixa o
    `main` de lá); depois, `sync_data.py` no iPad (arquivo novo em `data/`);
  - pendente no iPad: trocar `RulesCompendiumView.bookOrder` pelo `books.json`;
  - testes: 116 (2 novos arquivos de teste: livros e dados reais).
- 2026-10-08, regras dos suplementos legíveis (web v0.42.1, thac0berry-data PR #3):
  - achado do usuário na ficha Psionic Combat (DSC): tabelas como texto com
    "|", "MTHACO" e "MAC"; MTHAC0 (Mental THAC0) e MAC (Mental Armor Class)
    são termos do Dark Sun — o erro era só "MTHACO"/"THACOs" com a letra O
    (5 ocorrências, todas nessa ficha), corrigido no thac0berry-data por
    `scripts/fix_rules_ocr.py` (lista explícita, idempotente);
  - a tela de regras não desenhava tabela em markdown (127 regras, 330
    tabelas dos suplementos) nem lista "- " (177 regras): `parseRuleContent`
    foi para `src/rules/ruleContent.ts` (pura, com testes) e agora desenha
    tabelas em markdown (título do negrito acima), tabelas sem a linha "---"
    (pares rótulo | valor, sem cabeçalho; uma célula vira lista), listas "- "
    (itens separados por linha em branco viram uma lista só; introdução +
    itens = parágrafo + lista) e some com as linhas "|  |";
  - `alignTable` (compartilhado com o Table Grimoire): célula do canto que
    faltava nas tabelas cruzadas (DSC Tabela 3) e célula vazia sobrando no fim
    do cabeçalho (DSC Tabela 2); 0 tabelas desalinhadas depois disso;
  - resultado em todas as regras: 0 parágrafos com "|" ou "- " soltos; 564
    tabelas e 438 listas desenhadas; conferido no navegador (Psionic Combat:
    2 tabelas; Barbarian Fighter: 9 tabelas);
  - pendente no iPad: o `RuleContentParser` de lá tem o mesmo limite (não lê
    tabela em markdown nem "- ");
  - pendente nos dados (opcional, a tela já contorna): 6 regras com "|  |",
    26 tabelas com cabeçalho torto; as tabelas sem "---" (32) ainda não
    entram no Table Grimoire;
  - testes: 122 (6 novos).
- 2026-10-09: ícone do Table Grimoire no hub DM Tools (arte do usuário; web v0.42.2; detalhes em `docs/ferramentas-dm.md`).
- 2026-10-10, GT4 feita (web v0.57.0; thac0berry-data `gt4/tabelas-dmg`):
  - fonte: as páginas "DMG Table N" e de capítulo do DMG no dump da wiki
    (`thac0berry-data-mining/dumps/adnd2e_pages_current.xml`); os JSON de
    `rules_dmg` só citavam essas tabelas;
  - decisões do usuário: tabela em dois passos vira seletor + subtabelas
    (89 = d6 → 89A/89B/89C em d20; idem 90, 91, 96, 104, 108 e 110, esta em
    d10 com A–D); 117 = parte A (Purpose), 117B = parte B (Power); as 89–110
    em `dmg_ch10_magical_item_tables`; cenários ficam para a GT4b;
  - thac0berry-data, `scripts/add_dmg_missing_tables.py` (idempotente):
    54–56, 61–63, 66–70 e 89–110 entram com `[TABLE_REF]` e as notas de
    rodapé; tabelas sem título ganham número (75, 78, 117, 117B) ou título
    descritivo (exemplos do Desert of Shaar e do Targash, continuação da 84,
    tipo de pergaminho); 75 e 117B refeitas pela wiki (sinais "+" perdidos);
    88 `D20 Roll` → `D100 Roll`; "0" → "00" em 9 tabelas d100; CRH-21 (linha
    8 saía "6") e CRH-65 (cabeçalho numa linha só);
  - achado no navegador: o `[TABLE_REF]` só vale sozinho no parágrafo (parser
    do iPad e da web), e as tabelas com notas logo abaixo sumiam da ficha da
    regra; as notas foram para o parágrafo seguinte, como "(*) …" (segundo
    commit no thac0berry-data);
  - a 70 tem dois dados (d20 geral, d100 específico): fica d100 na primeira
    coluna, com o traço geral repetido em cada linha;
  - índice da web: 512 → 562 tabelas; citações entre tabelas 8 → 46, sem
    destino 19 → 0; web sem mudança de código, só o teste de dados reais
    (88 → 89 → 89A, 116 → 117, nenhuma citação 88–119 sem destino);
  - pendente: o motor não rola soma de dados diferentes (2–20 = 1d8 + 1d12,
    Tabela 54 e o exemplo do Desert of Shaar): rola 2d10, que tem outra
    distribuição; a 105 "Special" não cita a 107 (a fonte também não);
    GT4b (cenários: Ravenloft ~28 tabelas, Planescape ~100, Forgotten Realms
    ~100, Dragonlance ~60, Council of Wyrms ~90, Birthright ~22, Al-Qadim ~60,
    Thri-Kreen of Athas ~40); `sync_data.py` no iPad depois do merge.
- 2026-10-10, GT4b Ravenloft R1 (web v0.58.0): livro DoD (cenário Ravenloft), 7 regras, 24 tabelas; plano e pendências em `docs/ravenloft.md`.
- 2026-10-12, GT4b Planescape (web v0.63.0; thac0berry-data `scripts/add_planescape.py`):
  livros PCS (Planescape Campaign Setting), PWH (The Planewalker's Handbook)
  e TIP (The Inner Planes), cenário "Planescape"; 35 regras (só as páginas
  com tabelas, com o texto inteiro, decisão do usuário) e 64 tabelas, várias
  roláveis (tiefling d100, tempestades e correntes d20, maelstroms d10,
  ácido d6, venenos e bolsões d8, itens novos d100). Fora: citação de
  abertura, fichas de NPC de Sigil, magias soltas, legendas dos planos e as
  páginas de plano do TIP (a mini-tabela de escolas está na Tabela 2 do PWH).
  Correções explícitas: cabeçalhos em dois níveis ou ausentes, tabela sem
  fechamento (ácido de Ooze, que escondia a tabela de venenos), OCR de dados
  ("1d1O", "2dl0", "1dl2", "2d 10"), cimitarra de aço verde "11d10" (1d10),
  marcação da wiki; idiomas planares numa coluna só. O script ganhou
  `--refresh` (refaz no lugar as regras já importadas).
  Pedido do usuário junto: **tooltip com o título completo das siglas dos
  livros** (`src/components/BookCode.tsx`, títulos de `data/books.json` via
  `src/lib/bookTitles.ts`) nas listas do Table Grimoire e do Rules Reference,
  no subtítulo da tabela e da regra, no "?" de regra, nas citações "Table N
  (livro)" e nas tabelas do Combat Tracker; os chips de livro já tinham.
  Teste de dados reais: livros, ≥ 60 tabelas e o dado das roláveis.
- 2026-10-12, GT4b: levantamento dos cenários que faltam no dump e decisões
  do usuário: ordem Forgotten Realms → Dragonlance → Council of Wyrms →
  Al-Qadim → Thri-Kreen; Thri-Kreen of Athas (TKA) entra no cenário Dark Sun;
  Birthright sai (não há livro de regras no dump; o "GRCS" é o *Glory of Rome
  Campaign Sourcebook*); os deuses de Dragonlance (TotL, fora de
  deities.json) ficam para decidir na vez dele.
- 2026-10-12, GT4b Forgotten Realms (web v0.66.0; thac0berry-data
  `scripts/add_forgotten_realms.py`): livros SofS (Sea of Fallen Stars), FA
  (Faiths & Avatars) e PP (Powers & Pantheons), cenário "Forgotten Realms";
  28 regras e 56 tabelas. SofS: visão e profundidade, combate, magia e
  equipamento debaixo d'água, Dukars (XP, perícias, magias, caminhos),
  raças de Serôs, dinheiro de pérolas, calendário, dinastias, prédios de Myth
  Nantar (roláveis d4/d6/d8/d10). FA: classes de sacerdote (cleric, crusader,
  druid, monk, mystic, shaman), tabelas estendidas de THAC0 e de magias, e o
  índice de magias. PP: apelidos dos deuses e magias novas. Fora: as páginas
  de cada deus (já em deities.json), a letra "S" da enciclopédia do SofS, a
  legenda do mapa de Myth Nantar, o "Format of Deity Entries" do PP (igual
  ao do FA), o índice de magias com páginas e a lista de locais do PP.
  Correções: linha de tabela com as duas classes numa célula (função dos
  prédios), calendário com parênteses quebrados, BOM e travessão do cp1252,
  OCR do Crusader, linha "… Article" de abertura.
  Junto: os livros importados da wiki (DoD, PCS, PWH, TIP e os novos) tinham
  todas as regras no capítulo 0, e o Rules Reference as juntava num capítulo
  só, com o nome do primeiro; agora cada capítulo tem o seu número
  (`number_chapters`). Teste de dados reais: livros, ≥ 50 tabelas, dado das
  roláveis e nada de marcação da wiki.
- 2026-10-12, GT4b Dragonlance (web v0.67.0; thac0berry-data
  `scripts/add_dragonlance.py`): livro TotL (Tales of the Lance), cenário
  "Dragonlance"; 47 regras e 56 tabelas, em seis capítulos: raças (limites
  de atributos de bárbaros, anões, elfos, gnomos, anões-do-esgoto, kender,
  minotauros e irda; combinações de raça e classe), classes (bárbaro,
  cavalier, marinheiro, cavaleiros de Solamnia, magos da Alta Feitiçaria e
  as luas, Ordens Sagradas das Estrelas, normais), os 21 deuses de Krynn
  (decisão do usuário: como regras; a ficha do avatar vinha em três
  formatos e virou sempre Stat | Value), calendário e câmbio, tesouro e o
  Talis Deck (cada naipe como linha de seção). As tabelas dos "normais"
  repetidas no Commoner e no Tinker ficam só em "Normal Group Classes"; a
  lista de guildas do Tinker virou lista. Junto: o resumo das regras da wiki
  pula o apelido em itálico de abertura (raças do TotL); o `--refresh` não
  acusa mudança só pelo número do capítulo. Teste de dados reais: livro, ≥ 50
  tabelas e as 21 fichas de avatar no mesmo formato.
- 2026-10-12, GT4b Council of Wyrms (web v0.68.0; thac0berry-data
  `scripts/add_council_of_wyrms.py`): livro CWS (Council of Wyrms Setting),
  cenário "Council of Wyrms"; 18 regras e 90 tabelas, em seis capítulos:
  personagens (requisitos e ajustes das raças, limites de classe e nível,
  dados por idade de cada um dos 15 dragões, kindred, meio-dragões, DV,
  filhotes aleatórios d20, XP), perícias de dragão, combate, habilidades e
  magia (psiônica dos dragões de gema, magias por idade, armas e itens
  mágicos d20, poções d100, geradores de magia d100 de sacerdote e mago),
  vida dos dragões (expectativa de vida, tesouro ligado, ninhadas, prefixos
  de nome) e tabelas gerais (THAC0, salvamentos). Fora: a aventura "Not the
  Draca". Os geradores vinham dentro de uma tabela de layout (saiu); as
  tabelas de expectativa de vida vinham deitadas (viraram duas colunas).
  Correções: faixas do gerador de sacerdote do 3º nível, CA "o", "1dl00",
  "lawful gold". Pendente da fonte: ver o backlog. Teste de dados reais:
  livro, ≥ 85 tabelas, 15 geradores e o dado das roláveis.
- 2026-10-12, GT4b Al-Qadim (web v0.69.0; thac0berry-data
  `scripts/add_al_qadim.py`): livros AA (Arabian Adventures) e CShaH (The
  Complete Sha'ir's Handbook), cenário "Al-Qadim"; 14 regras e 30 tabelas:
  posição social por kit (Tabela 1), cruzamento de perícias, resumo dos
  kits, perícias novas, nomes zakharanos, armaduras no calor, as 12 listas
  de equipamento (preço pedido, normal e de barganha), desidratação, chance
  do sha'ir pedir uma magia, tarefas do gênio, magias de mago do AA e do
  CShaH e os mecânicos do clockwork mage. Fora: o guia das ilustrações.
  Correções: moeda com OCR nos preços ("15 pp", "6 pg" → gp; o livro não
  usa platina nessas listas), a tabela recuada do gênio (":{|", o leitor não
  a via), os grupos de kits da Tabela 1 (linhas de cabeçalho que se
  perderiam). Teste de dados reais: livros, ≥ 28 tabelas, 12 listas de
  preço sem resto de OCR.
- 2026-10-12, GT4b Thri-Kreen (web v0.70.0; thac0berry-data
  `scripts/add_thri_kreen.py`): livro TKA (Thri-Kreen of Athas) no cenário
  Dark Sun (decisão do usuário: sem cenário próprio); 8 regras e 10
  tabelas: ajustes de atributos e características físicas, limites de nível
  (Tabela 7.1) e multiclasses, estágios de crescimento (2.1), ataques com
  chatkcha (3.1), armas (3.2), mordida e garra (3.3), nomes e glossário. Quase
  todas as "tabelas" do livro na wiki são caixas de texto (os quadros "Jeral
  vs. To'ksa", "Molting"…): nas páginas que entram viram texto, e as 15
  páginas só com caixas ficam de fora. Na Tabela 2.1 o XP e a habilidade
  vinham na mesma célula ("175 leap"). Web: o índice do Table Grimoire aceita
  número com ponto ("Table 7.1", antes virava "Table 7" com título "1: …") e
  ordena 7.1 depois de 7. Com isso a **GT4b está concluída** (Ravenloft,
  Planescape, Forgotten Realms, Dragonlance, Council of Wyrms, Al-Qadim e
  Thri-Kreen; Birthright sem fonte).
- 2026-10-13, soma de dados diferentes (web v0.71.0; backlog): o motor de
  dados (`src/rules/dice.ts`) lê, rola, mostra e calcula a faixa de somas
  como "1d8+1d12" ou "2d4+1d6+3" (`DiceSpec.extra`, ausente no caso comum;
  só o modificador pode ser negativo). O cabeçalho da tabela manda: "Dice
  Roll (1d8+1d12)". thac0berry-data `scripts/fix_sum_dice_headers.py`: a
  Tabela 54 do DMG e o exemplo 2–20 do Desert of Shaar ganharam esse
  cabeçalho (antes a web deduzia 2d10 pela faixa, outra distribuição).
  Conferido no navegador ("Roll d8+d12" → "8 (7 + 1) → Uncommon*").
- 2026-10-13, deuses de Krynn no compêndio de divindades (web v0.72.0;
  backlog): thac0berry-data `scripts/add_krynn_deities.py` põe o High God e
  os 21 deuses do Tales of the Lance em `deities.json`, no formato do FA
  (rank como no livro, "Greater God"; plano; AL, WAL, AoC e SY das
  estatísticas; outros nomes; avatar com a ficha em texto; o resto da página
  no texto). Aliados, inimigos, superior e domínio ficam vazios (o livro não
  os separa). As 21 regras de deus saem do Rules Reference (decisão do
  usuário); fica "Descriptions of the True Gods", com a lista. Web: os livros
  do filtro vêm dos dados (antes, fixos), "Greater God" agrupa com "Greater
  Power", hub com "101 deities · Forgotten Realms & Dragonlance".
  `src/data/deities.ts` importa `search.ts` com a extensão (para rodar nos
  testes, como o `raceKit.ts`).
- 2026-10-13, raças de Planescape na ficha (web v0.73.0; backlog). Decisões
  do usuário: só em campanhas com o cenário Planescape; Modron entra;
  Bariaur e Genasi como opções separadas (macho/fêmea, ar/terra/fogo/água).
  `src/rules/raceKit.ts`: as 10 raças planares com os números das tabelas
  "Planar Races" do PWH (requisitos e ajustes de atributo, limites de nível;
  classe fora da tabela = não pode), movimento, resistência à magia e o texto
  das habilidades raciais (da página de cada raça). Notas da tabela: só o
  bariaur macho é ranger/paladino e só a fêmea é maga; aasimar e tiefling de
  uma classe só sobem dois níveis além do limite; genasi da terra paladino
  só como stone champion. Multiclasse (`multiclass.ts`): as combinações do
  PWH (o aasimar com bardo não depende de kit, como no CBH); bariaur, genasi
  da terra e modron não podem. Ladrão (`rules.ts`): os ajustes raciais do PWH
  (aasimar, genasi da água, tiefling). O seletor de raça mostra o grupo
  "Planescape · The Planewalker's Handbook" quando a campanha da ficha tem o
  cenário; os avisos citam o PWH no lugar da Tabela 7 do PHB. Fora: altura,
  peso e idade (a web não preenche esses campos para nenhuma raça) e a tabela
  de habilidades aleatórias do tiefling (fica no Table Grimoire).
- 2026-10-14, GT5 aprovada (decisões do usuário): a tabela é **só do mestre**
  (os jogadores não veem); fica **na campanha ativa** (ou no One-shot), com a
  opção de **copiar para outra campanha** (cópia independente); pode **começar
  copiando uma tabela de livro**. Entregas G5a e G5b; a faixa do Combat Tracker
  fica para depois.
- 2026-10-14, G5a feita (web v0.79.0; backend `20261014180000_gt5_tabelas_do_mestre.sql`,
  8 verificações pgTAP):
  - **backend:** `dm_table` (o JSON da tabela em `data`; `name` gerado do título),
    só o dono lê e grava, com campanha dele ou nula (One-shot); contrato de sempre;
  - **web:** `src/rules/dmTables.ts` (a tabela do mestre no formato das tabelas
    dos livros: o dado vai no primeiro cabeçalho, onde o motor o procura; sem dado,
    só consulta — o cabeçalho perde "roll"/"dice" para não virar rolável pelo
    nome; avisos de faixa: inválida, buraco, sobreposição, fora do dado), com
    testes; `src/lib/dmTables.ts`; `src/components/DmTableEditor.tsx` (título,
    dado com sugestões, colunas e linhas, notas, avisos que não impedem gravar,
    "delete table" com confirmação); no Table Grimoire, "Your tables ·
    <campanha>" com "+ New table" (a busca vale para as duas listas) e, na tabela
    aberta, "✎ Edit table";
  - conferido no navegador (One-shot): criar um d6, o aviso "No row for 6" ao
    tirar a última linha, corrigir para 5-6, salvar, rolar ("2 → Wolves", linha
    em destaque, histórico), editar o título (versão 2, sem conflito) e apagar
    (`deleted_at`).
- 2026-10-14, G5b feita (web v0.80.0; só web): `fromBookTable` em
  `src/rules/dmTables.ts` (título, o dado do Roll, o primeiro cabeçalho sem a
  notação de dado, as linhas copiadas e a origem "DMG Table 54: …"), com teste;
  na tabela de livro, "⧉ Copy to my tables" abre o editor com a cópia (só grava
  ao salvar); na tabela do mestre, "⧉ Copy to another campaign…"
  (`src/components/CopyTableWindow.tsx`: as campanhas do mestre e o One-shot,
  menos a atual) cria uma cópia independente e avisa. Conferido no navegador: a
  Tabela 54 do DMG copiada para o One-shot (d8+d12, 19 linhas, sem avisos,
  "Copied from DMG Table 54"), rolando igual, e dela uma cópia para "Teste W3.1b
  B" (as duas no banco, cada uma na sua campanha); as cópias de teste foram
  apagadas depois. Com isso a **GT5 está concluída**.
- 2026-10-14, G5c feita (web v0.81.0; só web): as tabelas do mestre na faixa
  de tabelas rápidas do Combat Tracker. No Table Grimoire, a tabela do mestre
  também tem "☆ Combat Tracker" (o id `dm-<uuid>` entra em
  `settings.quickTables`, como os de livro); o Combat Tracker carrega as
  tabelas do mestre da campanha ativa e as junta às de livro, para a faixa, a
  busca "+ Table" e a janela da tabela. Fixada em outra campanha, a tabela não
  aparece (o id fica guardado e volta com a campanha dela). Chip "DM <título>".
  Teste em `tests/quickTables.test.ts`. Conferido no navegador (One-shot): criar
  um d6, fixar, ver o chip na faixa de um encontro, abrir e rolar
  ("2 → 2"), desafixar; encontro e tabela de teste apagados.
