# Tarefa GT4: tabelas que faltam no Table Grimoire

Tarefa para um agente executar sozinho. Contexto completo em
`docs/grimorio-de-tabelas.md` (plano, decisões do usuário e log das GT1–GT3).
Converse com o usuário em **português**; texto de interface em inglês.

## Objetivo

Completar os dados do Table Grimoire (ferramenta do DM na web, `/dm/tables`):

1. **Tabelas do DMG que faltam**, sobretudo as **89–110** (subtabelas de itens
   mágicos: a Tabela 88 aponta para elas) e a **117** (Special Purpose, citada
   pela 116 e por `dmg_ch10_intelligent_weapons`/`dmg_ch10_magical_item_descriptions`).
   Faltam também 54–56, 61–63, 66–70, 75 e 78. Confira a lista no passo 1.
2. **Tabelas de cenários de campanha** (Ravenloft e os outros que o
   data-mining tiver), separadas por cenário (decisão 4 do usuário).
3. **Correções** nos dados que já existem (lista em "Correções").

Pronto = as tabelas estão no `thac0berry-data` (validadas), a web as mostra e
rola, e **88 → 89** encadeia de verdade no navegador.

## Onde está cada coisa

| Repo | Papel | Onde |
|---|---|---|
| `thac0berry-data-mining` | Fonte: páginas da wiki e dumps de onde saíram todas as regras e tabelas | **Só no PC do usuário**, ao lado do `thac0berry-data` (não está no GitHub). Os scripts do data repo já o leem em `../thac0berry-data-mining/data/...` (ver `scripts/build_monsters.py` e `scripts/add_psionicist_kits.py`). |
| `Tatarana/thac0berry-data` | Dados e schemas compartilhados (iPad, backend, web) | `data/rules.json` (regras com `tables`), `schemas/rule-entry.schema.json` |
| `Tatarana/thac0berry-web` | Esta web | índice em `src/rules/tableIndex.ts`; rolagem em `src/rules/tableRoll.ts` e `src/rules/dice.ts`; tela em `src/pages/TableGrimoire.tsx` e `src/components/TableDetail.tsx` |
| `Tatarana/thac0berry-ipad` | App iPad | `Scripts/sync_data.py` copia o `data/` para o app |

Se a sessão não alcança o `thac0berry-data-mining` (por exemplo, numa sessão na
nuvem), **pare no passo 1** e diga ao usuário: ou ele sobe o repo para o
GitHub (pode ser privado), ou a tarefa roda no PC dele.

## Regras que valem

- **thac0berry-data** (`CLAUDE.md` de lá): proponha e espere o **"ok"** antes de
  mudar dado ou schema; **ids são contrato** (não renomear nem apagar);
  schema espelha o decode do Swift (campo obrigatório = o Swift falha sem ele;
  campo novo, opcional); toda mudança passa por `python scripts/validate_schemas.py`
  e pelo CI; `kits.json`/`rules.json` grandes: **edite com script**, UTF-8 sem
  BOM, LF; depois de mudar `data/`, `python Scripts/sync_data.py` no iPad.
- **thac0berry-web** (`CLAUDE.md` daqui): proponha e espere o "ok"; uma entrega
  por vez; CI verde (`npm ci`, lint, `types --check`, build, test); regra de
  jogo em funções puras com teste. **Não copie nem edite JSON de dados à mão
  na web.**
- Correções na extração seguem o padrão dos scripts existentes: listas
  explícitas e comentadas (como `MANUAL`/`TYPOS` em `scripts/build_monsters.py`),
  script idempotente (rodar de novo não muda nada, como
  `scripts/fix_kit_bonus_proficiencies.py`).

## Formato que a web já entende (não precisa mudar a web para o DMG)

A web junta tabelas de duas origens do `rules.json` (`src/rules/tableIndex.ts`):

- **Estruturadas**: `tables` de uma regra, cada uma
  `{ "tableNumber": "Table 89", "title": "Table 89: Potions and Oils", "headers": [...], "rows": [[...]] }`
  (`schemas/rule-entry.schema.json`, `RuleTable`). No `content` da regra, a
  tabela aparece onde estiver `[TABLE_REF: Table 89: Potions and Oils]`
  (assim o iPad e o Rules Compendium a mostram no lugar certo).
- **Markdown** no `content`: título numa linha `**Table 89: …**` logo acima
  da tabela `| … |`.

Para o motor de rolagem funcionar sem ajuste:

- a primeira coluna tem as faixas: `01-05`, `96-00`, `00` (= 100), `7`, `13+`;
- o primeiro cabeçalho diz o dado: `D100 Roll`, `d20 Roll`, `2d6 Roll`;
- citações a outras tabelas no texto da célula: `Table 105` (ou
  `Table 31 in the PHB` para outro livro): viram link e "Roll on Table N".

O id na web sai de livro + número (`dmg-89`); a GT3 encadeia por livro +
número, então **o número da tabela precisa bater** com o que a 88 cita.

## Passos

1. **Levantamento** (sem mudar nada). No data-mining, ache as tabelas do DMG
   que faltam e as de cenário. Compare com o `rules.json` atual (o script de
   levantamento da GT1 está descrito em `docs/grimorio-de-tabelas.md`, seção
   "Dados"). Liste: número, título, de qual página/arquivo vem, em qual regra
   do `rules.json` deve entrar (ex.: as 89–110 em `dmg_ch10_magical_item_tables`
   ou na regra de cada categoria; a 117 em `dmg_ch10_intelligent_weapons`), e
   os cenários com quantas tabelas cada um tem.
2. **Proposta ao usuário** (regra 1 do data repo), com o levantamento e estas
   decisões em aberto:
   - **cenários: decidido** (decisão 6 do usuário, 2026-10-08): entram como
     regras novas no `rules.json`, com um **código de livro por cenário**
     (ex.: `RL` Ravenloft), e as regras passam a ter filtro por cenário;
   - **nome e código** de cada livro novo: o nome do cenário usa o mesmo
     vocabulário que magias, itens mágicos e monstros já usam ("Ravenloft",
     "Forgotten Realms", "Greyhawk", "Planescape", "Spelljammer",
     "Dragonlance", "Al-Qadim", "Mystara / Known World", "Oriental Adventures /
     Kara-Tur", "Maztica", "Dark Sun"); se a GT4a já estiver feita, cada livro
     novo entra também na lista de livros dos dados (`data/books.json`) com o
     cenário dele — senão, combine com o usuário.
3. **DMG** (depois do "ok"): script no data repo (ex.:
   `scripts/add_dmg_missing_tables.py`) que lê o data-mining e acrescenta as
   tabelas às regras certas, com `[TABLE_REF: …]` no `content`. Idempotente.
   `validate_schemas.py` OK. Commit e PR no data repo.
4. **Correções** (mesmo PR ou outro, conforme o usuário):
   - Tabela 88: cabeçalho `D20 Roll` → `D100 Roll` (as faixas vão de 01 a 100);
   - `"0"` sozinho na última linha de tabelas d100 → `"00"` (zero perdido na
     extração; ex.: PHB Leader/Ranger's Followers, DMG 85, 116);
   - CRH-21 (Aquatic Species Enemy): falta a linha do resultado 8 — conferir
     na fonte;
   - CRH Tabela 65 (Spell Progression, 1st Edition): cabeçalho de três níveis
     malformado;
   - 11 tabelas estruturadas sem número (`"title": "Table"`): título certo
     da fonte;
   - opcional: as listas `recommended` de 13 kits cortadas nas vírgulas (ver
     `docs/multiclasse.md`, Pendências, item 6).
5. **Cenários**, conforme a decisão do passo 2.
6. **Web** (só se o passo 2 pedir arquivo novo ou cenário novo): `settingOf`
   em `src/rules/tableIndex.ts`, `bookOrder` em `src/data/rules.ts`,
   `build-data.mjs`; testes em `tests/tableIndex.test.ts`. Subir a versão
   (`package.json` e `package-lock.json`) e registrar no log do
   `docs/grimorio-de-tabelas.md`.
7. **Conferir no navegador** (`npm run dev` com `DATA_DIR=../thac0berry-data/data`,
   modo DM em `localStorage['thac0berry.mode'] = 'dm'`, rota `#/dm/tables`):
   - 88 rola d100 **sem** o aviso de cabeçalho e "Roll on Table 89 ›" abre a 89
     e rola nela; idem para as outras subtabelas;
   - 116 → 117 encadeia;
   - chip do cenário novo filtra as tabelas dele;
   - nenhuma citação pontilhada ("not in the data yet") que a GT4 deveria ter
     resolvido.
   Teste com dados reais em `tests/dice.test.ts` (já confere 88 e 115 → 116):
   acrescente 88 → 89 e 116 → 117.
8. **iPad**: `python Scripts/sync_data.py` no repo do iPad depois do merge no
   data repo (o CI do iPad acusa a divergência).

## Ao terminar

Atualize a tabela de entregas e o log em `docs/grimorio-de-tabelas.md` (GT4
feita, versão, números: quantas tabelas entraram, quantas citações passaram
a encadear) e diga ao usuário o que ficou pendente.
