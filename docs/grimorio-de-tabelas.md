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
| GT4b | Cenários (Ravenloft primeiro, um cenário por entrega), das páginas da wiki no dump do data-mining | a fazer |
| GT5 | Tabelas do mestre (decisão 1) | adiada |

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
