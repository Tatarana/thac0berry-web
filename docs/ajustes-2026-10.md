# Ajustes de 2026-10-10

Oito ajustes pedidos pelo usuário, priorizados antes da GT4 (decisão 4).
Log do trabalho: decisões, entregas e pendências. Atualizar a cada entrega.

## Pedidos

1. Settings: papel padrão do caderno (o campo já existe em `user_preferences`).
2. Settings: nome/apelido padrão do jogador, gravado nos personagens novos.
3. Contador de riscos igual em todo o app: sem botões − e + (TallyBoard).
4. Regeneração (Banked Heal): janela flutuante na ficha quando dispara (dano ou
   "Activate now").
5. Trocar a classe tira o kit.
6. Grimório e folhas de magia para quem não é mago/sacerdote (kits como o
   Shinobi Mage).
7. A CA não considera o ajuste de DEX.
8. PV temporários refletidos na ficha (38/38 + 10 temporários = 48/38).

## Decisões do usuário (2026-10-10)

1. CA: a caixa ARMOR passa a ser a CA da armadura (armadura, escudo, mágicos);
   o escudo mostra a CA final com o ajuste de DEX ("Armor 5 · DEX −2"). Fichas
   com a DEX já somada: o app avisa uma vez para o jogador ajustar.
2. Conjuração por kit: os slots ficam à mão (o jogador marca por círculo).
3. Nome do jogador: só nos personagens novos.
4. Estes oito antes da GT4.
5. (Do plano) A troca de classe dupla mantém o kit (CFH, CTH, CPrH); só a troca
   livre pelo seletor do cabeçalho tira.

## Entregas

| # | Entrega | Itens | Estado |
|---|---|---|---|
| U1 | Correções rápidas | 5, 8, 3 | feita (web v0.55.1; teste na tela com o usuário) |
| U2 | Settings | 1, 2 (migração no backend) | feita (web v0.55.2; falta o `db push` e o teste na tela) |
| U3 | Janela da regeneração | 4 | feita (web v0.55.3; teste na tela com o usuário) |
| U4 | CA com DEX | 7 | feita (web v0.55.4; teste na tela com o usuário) |
| U5 | Conjuração por kit | 6 (extensão "web primeiro" no schema) | feita (web v0.56.0; teste na tela com o usuário) |

## Log

- 2026-10-10: plano aprovado. Início da U1.
  - item 5: `changeClass` (seletor do cabeçalho) = `setClass` + tira o kit;
    `dualClassSwitch` continua usando `setClass` (mantém o kit);
  - item 8: a regra já somava os PV temporários aos atuais ao criar o efeito
    (teste: 38/38 + 10 = 48/38); não reproduzido por código — falta ver o caso
    do usuário na tela. A ficha agora mostra "+10 temp" ao lado dos PV;
  - item 3: os contadores com − e + (efeitos: Stone Skin e regeneração, e a
    lista de ataques negados; folha de magia: Turn Undead, cargas de item,
    conjurações das magias adicionais) passam a usar o TallyBoard (a caixa
    soma, o risco tira), que ganhou `max`;
  - de passagem: `npm run data` quebrava no Node 22.16 deste PC (o
    `build-data.mjs` importa `src/rules/books.ts`); o script passa
    `--experimental-strip-types`, como os testes (o CI usa um Node 22 mais novo).
- 2026-10-10, U2 feita (web v0.55.2; backend `ce175e9`):
  - backend: coluna `user_preferences.default_player_name` (migração
    `20261010120000_nome_do_jogador.sql`, teste pgTAP `04_preferencias`, CI
    verde); **o usuário precisa rodar `npx supabase db push`** na pasta do
    backend;
  - web: Settings → card "Preferences" (só logado): nome do jogador (grava ao
    sair do campo) e papel padrão do caderno (Plain/Lined/Grid, grava ao
    tocar); `src/lib/preferences.ts` lê com `*` (não quebra antes do db push) e
    grava pelo contrato (INSERT ou UPDATE com `version`);
  - personagem novo (`createCharacter`) recebe o nome padrão no campo Player;
    clonar e importar não mudam.
- 2026-10-10, U3 feita (web v0.55.3):
  - `activeRegenerations` (effects.ts): Banked Heal já disparado e com cura
    sobrando;
  - `RegenerationFloat`: janela no canto inferior direito, em qualquer página da
    ficha; aparece sozinha quando a regeneração dispara (dano registrado ou
    "Activate now" nos efeitos); contador de riscos (+1 PV por rodada, até o
    total), "minimize" vira uma pílula "✚ 3/10 HP", e uma regeneração nova
    reabre; some quando a cura acaba;
  - teste: dispara com o dano, cura e some (175 testes).
- 2026-10-10, U4 feita (web v0.55.4):
  - `dexDefenseAdjustment` e `finalArmorClass` (rules.ts): ajuste da linha da
    DEX na ficha (acompanha efeitos), ou da Tabela 2 pelo valor da DEX;
  - ficha: o escudo mostra a CA final; embaixo, "Armor [5] · DEX −2" (a caixa
    editável é a da armadura; os efeitos de CA continuam mexendo nela);
  - aviso uma vez por personagem (por aparelho, `thac0berry.acDexReviewed.<id>`
    no localStorage), só quando o ajuste não é 0: "It already included
    Dexterity — set Armor to N" (tira a DEX da caixa) ou "It was armor only";
  - Combat Tracker: o PC entra com a CA final (e a lista de PCs mostra ela);
  - testes: 177;
  - **pendente no iPad**: lá a caixa ainda é a CA final; quando o iPad voltar, a
    ficha dele precisa somar a DEX do mesmo jeito (mesmo campo `armorClass`).
- 2026-10-10, U5 feita (web v0.56.0; data `f849f47`):
  - schema: `kitSpellcasting` (`{ arcane?: number[], divine?: number[] }`,
    slots por círculo; a presença liga o tipo), extensão "web primeiro"
    (gerador do iPad, branch `n3`);
  - regras: `hasSpellSheetAny`/`isArcaneCasterAny`/`isDivineCasterAny`
    consideram o kit (`kitCasts`); `computedSpellSlotAllotments` soma os slots
    marcados à mão;
  - tela: botão ✦ ao lado do kit no cabeçalho abre "Spellcasting from a kit"
    (Wizard spells: grimório + folha arcana; Priest spells: folha divina; slots
    por círculo, 9 e 7); ao ligar, o app cria o "First day" se o personagem não
    tem folha (como numa troca de classe). As folhas que já existem não mudam;
    os dias novos usam os slots;
  - testes: 178;
  - pendente no iPad: ler `kitSpellcasting` quando ele voltar.
- Com a U5, os oito ajustes estão feitos. Falta o usuário testar na tela (e
  rodar o `db push` da U2). Próximo do backlog: GT4.
- 2026-10-12, achado do usuário no teste (web v0.59.2): o db push da U2 foi
  aplicado (nome padrão salva). Ajuste 3 incompleto: o contador clicável
  (`TallyBoard`, classe `.tally-board`) tinha fundo transparente, e os riscos
  creme sumiam no papel (Efeitos Temporários); só apareciam quando esgotados
  (vermelho, como em Treasure). Agora ele mantém a caixinha de tinta escura
  do contador de leitura (`.tally`, igual ao iPad); só a borda tracejada
  indica que é clicável. Todos os contadores ficam iguais.
- 2026-10-12, botão do modo com rosto (web v0.60.0, pedido do usuário): o
  botão do topo ("● Player ⇄") virou um ícone redondo com o rosto do modo
  atual, num aro de latão (tinta no papel), abrindo a mesma tela de escolha.
  Arte do usuário: foto = Dungeon Master, ilustração = Player
  (`public/images/mode_icon_dm.png`, `mode_icon_player.png`, 128 px). O fundo
  xadrez das imagens foi removido por script: cor exata do xadrez ∩ fecho
  convexo da área principal na foto (o cabelo grisalho tem a cor do fundo).
  O chip da campanha ativa, que reaproveitava `.mode-button`, ganhou a classe
  própria `.top-chip` com o formato de antes.
- 2026-10-12, tela inicial (web v0.62.1, backlog item 6): os cards Campaigns e
  Characters diziam "Coming soon", mas as telas já existem. Agora mostram as
  contagens como o HomeView do iPad ("N running" com todas as campanhas da
  conta, como no iPad; "N total" de personagens, por contagem sem baixar as
  fichas); sem login, "Sign in to start".
- 2026-10-13, resumo das regras sem asteriscos (web v0.70.1, pedido do
  usuário): a lista do Rules Reference mostrava o `summary` como texto puro,
  com `**negrito**` e `*itálico*` crus (83 regras). Agora usa o
  `InlineMarkdown`, como o detalhe da regra; o parser saiu para
  `src/lib/inlineMarkdown.ts` (função pura, com teste, inclusive com os dados
  reais). No `thac0berry-data`, 12 resumos que eram nota de rodapé de tabela
  (": ** This award…", ":* Only if…") ganharam resumo de verdade e dois
  resumos cortados perderam a marca sem par (`scripts/fix_rule_summaries.py`).
  Pendente: no iPad, `RulesCompendiumView` mostra o resumo com
  `Text(String)` (asteriscos crus; backlog do `TODO.md` do iPad). Depois,
  no mesmo dia, 7 resumos que eram as linhas de uma tabela markdown (CFH,
  CBH, WATW) ganharam uma frase no `thac0berry-data`; a web não muda.
- 2026-10-18, colunas do cabeçalho da ficha (web v0.98.0, pedido do usuário):
  as duas colunas de `.rec-header-row` (Class/Kit·Level, Race·Alignment,
  Patron Deity·Place of Origin na página 1) eram 50/50. Agora a esquerda
  (Class/Kit, Race, Patron Deity) fica em 62,5% e a direita (Level,
  Alignment, Place of Origin) em 37,5% — a direita 25% mais estreita que
  antes, a esquerda com a diferença. `calc((100% - 16px) * …)` descontando o
  `gap` da linha, senão as duas colunas juntas passavam de 100% e quebravam
  pra duas linhas. Conferido no navegador (Nic Gay) e no celular (375 px).
- 2026-10-19, tabela de verdade na descrição do kit (web v0.99.0, pedido do
  usuário para o kit Mind Monk): a ficha do kit (`KitDetail`) mostrava o
  `fullText` só como texto. Agora `descriptionParts` (`src/data/kits.ts`)
  separa as tabelas em markdown ("| … |" + linha "---", lidas pelo mesmo
  `markdownTables` do Table Grimoire) e elas saem no `RuleTableView` das
  regras, com a linha em negrito logo acima como título. Só o Mind Monk tem
  a tabela nesse formato no `thac0berry-data` (o resto dos kits continua em
  "- Coluna: valor", inalterado). Pendente: o iPad mostra o `fullText` como
  texto, então lá a tabela apareceria com as barras (o `Resources/` do iPad
  ainda não foi sincronizado).
