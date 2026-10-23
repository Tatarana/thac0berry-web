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
- 2026-10-19, imprimir / PDF da ficha (web v0.100.0, pedido do usuário):
  botão de impressora nas abas da ficha. `PrintSheet` monta as páginas 1–3
  (e a 4, Reference Tables, quando o personagem tem) sem `edit` — sem
  botões, seletores, destaques de pendência —, uma por folha A4 retrato
  (`@page`, margem 10 mm), fundo branco, e chama a impressão do navegador
  ("Salvar como PDF" dá o PDF). A página que não cabe na folha encolhe
  (`fitPages`: busca binária do maior `zoom` que cabe, medindo fora da tela
  na largura útil de 190 mm); a página 1 de um ladrão nível 5 fica em ~0,74,
  e uma ficha com 60 itens de equipamento coube na página 2 em ~0,59. Some
  também o que é orientação de tela: "?" das regras, "No portrait",
  "Saving…", avisos, janelas flutuantes. As notas da página 4 (regra de
  jogo) ficam. `print-color-adjust: exact` para as faixas de título escuras
  não sumirem. Conferido com um harness local (sem login) emulando a mídia
  de impressão em 718 px; o diálogo de impressão em si não dá para abrir no
  navegador embutido. Pendente (entrega separada): Spell Sheets, Psionics e
  Spellbook na impressão.
- 2026-10-19, correção da impressão (web v0.100.1, achado no uso): a
  página 1 passava da folha. O `fitPages` mede na tela, mas os `@media` de
  largura seguem a janela: no monitor o bloco Combat tinha 5 colunas e na
  folha (~718 px, vale o "width < 760px") 2, mais alto. Agora o
  `.print-root` fixa o layout da folha (Combat em 2 colunas, `.rec-sheet`,
  `.rec-lines-4/5`, `.rec-desc-split`, `.rec-sketch` como em 718 px), e a
  medição dá o mesmo zoom em 375 px e em 1280 px (conferido: medido em 1280
  e desenhado em 718, todas as páginas ≤ 271 mm de 277). Folga da altura
  útil de 4 para 6 mm.
- 2026-10-19, impressão de magias, psiônicos e grimório (web v0.101.0,
  pedido do usuário): o botão de impressora abre uma janela de escolha
  (`PrintDialog`): a ficha (marcada), os dias das Spell Sheets (marcado o
  dia aberto, ou o mais recente), Psionics (Psionicist) e My Spellbook /
  Known Spells (mago, bardo, gypsy). Cada parte começa numa folha. As novas
  partes são `.print-flow`: encolhem até 65% e, se ainda não couberem,
  continuam na folha seguinte sem cortar linha (`break-inside: avoid`); a
  ficha continua em uma folha por página. `PsionicsPanel` ganhou modo só
  leitura (`edit` opcional: valores no lugar dos campos, só as disciplinas e
  modos escolhidos, sem "Use a Power", sem botões). O `PrintSheet` espera o
  conteúdo assentar (magias e poderes chegam depois; `MutationObserver`,
  400 ms quieto, até 6 s) antes de medir. Sem `edit`, somem as orientações
  "write the spell with the pencil", "search above to add spells…", "No
  magic items logged…"/"No powers yet." (viram "—"). No papel os botões
  somem, menos o nome da magia memorizada (botão com cara de texto).
  Conferido com harness local: grimório de 70 magias em 65%, 2 folhas.
- 2026-10-22, nova arte do modo Mestre (web v0.101.1, arte do usuário): o
  dragão de óculos escuros e distintivo substitui `public/images/mode_dm.jpg`
  no cartão "Dungeon Master" da tela de escolha de modo. A arte nova é
  horizontal (1200×800, como a do Player); enquadramento `50% 30%`.
  Conferido no navegador e no celular. O ícone do botão do topo
  (`mode_icon_dm.png`, 128×128 com fundo transparente) passou a ser a
  cabeça do dragão recortada da mesma arte, em círculo.
- 2026-10-23, página 4 do Psionicist e seção da raça (web v0.102.0, pedido
  do usuário): o Psionicist passa a ter página 4 (`ReferenceKind`
  'Psionicist'), com as CPsiH Tabelas 4 (progressão, linha do nível), 5
  (potencial inerente, linha da Sabedoria), 6 (recuperação de PSPs), 14
  (ataque × defesa, colunas dos modos de defesa que o personagem conhece), 9
  (armadura) e 3 (prêmios de XP), nessa ordem, cada uma com o "?" da regra.
  Toda ficha com página 4 ganhou a seção "Race — X" no fim: faixa e ajuste
  de cada atributo (PHB 7 e 8, PWH, DoD), limites de nível da raça por
  classe (DMG 7, PWH, CPsiH 1; as classes do personagem em destaque) e, para
  anão, gnomo e halfling, a PHB Tabela 9 (bônus de resistência pela CON, a
  linha da CON em destaque). Escolha do usuário: só essas três (sem altura,
  peso e idade). Regras em `src/rules/raceKit.ts` (`raceAbilityRows`,
  `raceLevelLimits`, `constitutionSaveBonusRows`; a tabela de limites saiu
  de dentro de `levelLimit` para ser lida pelos dois) e
  `src/rules/psionics.ts`. Raça em texto livre que não bate com a lista: sem
  seção. O Druid continua sem página 4 (como no iPad), então sem a seção.
  Impressão: a página 4 virou `.print-flow` (a do Psionicist com a raça tem
  ~620 mm; numa folha ficaria em ~44%): encolhe até 65% e segue na folha
  seguinte, sem cortar uma tabela. iPad: pendência registrada no `TODO.md`
  de lá (2026-10-23).
- 2026-10-23, página 4 do Druid (web v0.102.1, pedido do usuário): era a
  única classe sem página 4 (como no iPad). Agora tem a progressão de magias
  de sacerdote (PHB Tabela 24, "Priest Spell Progression (Druid)"), a tabela
  de Sabedoria e a seção da raça, sem Turn Undead (`ClericTables` recebe a
  classe; Anchorite e Druid não expulsam). `hasReferencePage` diverge do iPad
  de propósito: `tests/rules.test.ts` tem `webAhead` com o Druid. A nota dos
  ajustes de atributo só aparece quando a raça tem ajuste.
