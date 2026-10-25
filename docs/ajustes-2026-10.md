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
- 2026-10-23, tabelas da DMG estragadas na extração (web v0.102.2, achado no
  uso: "Racial Level Restrictions" quebrada): corrigidas no `thac0berry-data`
  (`scripts/fix_dmg_table_columns.py`): Tabelas 1–7 tinham perdido a última
  coluna (canto do cabeçalho vazio) e 34, 46 e 57 os subtítulos do meio, que
  viraram a 1ª coluna ("Group"/"Situation"). O Combat Tracker lê a 46
  (salvamento de monstro) e a 57 (surpresa): `warriorSaveRows` passa a usar
  as linhas "Warriors" quando há a coluna de grupo, `saveCategories` pega as
  5 últimas colunas e a surpresa lê as 2 últimas (condição e modificador).
  Funciona com os dados antigos e os novos (testes rodados com os dois).
- 2026-10-23, ícones das disciplinas psiônicas (web v0.103.0, pedido do
  usuário): `DisciplineIcon` (SVG em traço, na cor do texto) — olho com
  raios (Clairsentience), objeto em movimento (Psychokinesis), coração com
  pulso (Psychometabolism), portal com seta (Psychoportation), duas cabeças
  ligadas por ondas (Telepathy), espiral (Metapsionics). Na aba Psionics:
  nos chips de Disciplines, no título de cada grupo de Powers e ao lado de
  cada poder, sempre com o nome escrito (legenda). Vale também no modo só
  leitura e na impressão. Fora: o compêndio de poderes e a página 4.
- 2026-10-23, ícone no "Add a power" (web v0.103.1, pedido do usuário): na
  lista do seletor de poderes, o nome da disciplina virou o ícone (o nome
  fica no tooltip e no `aria-label`, para leitor de tela).
- 2026-10-23, Add a power em abas (web v0.103.2, achado no uso: "não
  encontrei como incluir devoções"): a lista única (132 itens, ciências antes
  das devoções em cada disciplina) escondia as devoções. Agora há as abas
  "Sciences (n)" e "Devotions (n)" — abre na que ainda tem vaga; com vaga nas
  duas, em Devotions —, a linha "X of Y left at this level (Table 4)" e a
  lista agrupada por disciplina (ícone + nome, título fixo ao rolar). A busca
  vale dentro da aba.
- 2026-10-23, descrição dos poderes ao escolher (web v0.103.3, apontado pelo
  usuário: o "Add a power" fugia do padrão dos outros seletores). O
  `PowerDetail` saiu do compêndio para `src/components/PowerDetail.tsx`
  (compartilhado; o compêndio não mudou). No "Add a power", cada linha tem o
  ⓘ do seletor de kits: abre a descrição por cima da lista, com "Add <poder>"
  embaixo; fechar (ou Esc) volta à mesma aba e busca. Na ficha, o nome de um
  poder da lista de Powers é link para a descrição (como a magia memorizada
  na Spell Sheet; poder digitado sem `powerID` fica só texto).
- 2026-10-23, Powers em seções (web v0.103.4, pedido do usuário): na ficha,
  "Sciences" e "Devotions" viraram seções separadas, cada uma com "N of M"
  da Tabela 4 (vermelho se passou) e os poderes agrupados por disciplina. O
  tipo deixou de aparecer em cada linha (a seção já diz); só um tipo que não
  é ciência nem devoção (ex.: Psionic Enhancement, contado como devoção)
  continua escrito.
- 2026-10-23, Powers sem subgrupos (web v0.103.5, pedido do usuário): dentro
  de Sciences e Devotions, a lista é uma só (na ordem das disciplinas do
  personagem); a disciplina fica só no ícone ao lado do poder (nome no
  tooltip e no `aria-label`).
- 2026-10-23, tabelas na descrição dos poderes (web v0.103.6, achado no uso:
  "Animate Object" com duas tabelas quebradas): os dados estão certos
  (tabelas em markdown); a ficha do poder mostrava o efeito como texto puro.
  O corpo das regras virou `ContentBlocks` (em `RuleDetail.tsx`) e o
  `PowerDetail` usa ele no efeito: títulos por livro, listas, tabelas com e
  sem cabeçalho. Nos 257 poderes: 52 tabelas desenhadas (37 poderes com
  tabela em markdown e 4 sem a linha de cabeçalho), nenhum "|" sobrando no
  texto. Vale no compêndio, no "Add a power" e na ficha.
- 2026-10-23, Powers como tabela (web v0.104.0, pedido do usuário: a lista
  só tinha o nome, como não é nas magias): Sciences e Devotions viraram
  tabelas no estilo das magias memorizadas — Power (ícone + nome, que abre a
  descrição), Score (o power score do personagem, `powerScoreFor` em
  `src/rules/psionics.ts`: atributo + modificador; tooltip "Wis −3"), PSP
  (inicial/manutenção) e Range (curto; o completo no tooltip; some abaixo de
  560 px). Na edição, ⚡ preenche o "Use a Power" com o poder e o custo e
  rola até ele, e ✕ remove. O modificador vem do texto do power score quando
  ele tem um ("Cha –2" estava gravado como 0 nos dados). Colunas de largura
  fixa, para as duas tabelas ficarem alinhadas. Poder digitado à mão: "—".
- 2026-10-24, reset dos PV (web v0.104.1, pedido do usuário): na ficha, ao
  lado de "atual / máximo", um ↺ discreto (tinta clara) que só aparece com
  PV abaixo do máximo; sem confirmação. `resetHitPoints`
  (`src/rules/sheetEdits.ts`) põe os PV atuais no máximo mais os PV
  temporários dos efeitos em curso (que já contam nos atuais); a lista de
  Wounds fica (tem a lixeira própria). iPad: não tem; feito primeiro na web.
- 2026-10-24, modificadores da raça na ficha (web v0.105.0, pedido do
  usuário): "To Hit Modifiers" e "AC Modifiers" ganham, no topo, linhas
  automáticas da raça (PHB cap. 2, conferido no rules.json): anão +1 corpo a
  corpo contra orcs, half-orcs, goblins e hobgoblins; gnomo +1 corpo a corpo
  contra kobolds e goblins; elfo +1 com arcos (não bestas) e espadas curta e
  longa; halfling +1 com armas de arremesso e funda. Em AC, a penalidade de
  −4 de quem ataca anão (ogres, trolls, ogre magi, giants, titans) e gnomo
  (os mesmos, mais gnolls e bugbears). `racialCombatModifiers`
  (`src/rules/raceKit.ts`); não são gravadas (saem da raça e mudam com ela),
  ficam em texto impresso mais claro com a marca "race", sem editar nem
  remover. Raças planares e Half-Vistani: a conferir depois. iPad: não tem.
- 2026-10-24, ↺ dos PV no título (web v0.105.1, achado no uso: ao lado dos
  números, o botão quebrava o layout do quadro de Hit Points): agora fica ao
  lado do título "Hit Points" (junto do "?" da multiclasse). Conferido com
  "17 / 122" no navegador e no celular (375 px): os números numa linha só.
- 2026-10-24, proficiências bônus com a origem (web v0.106.0, pedido do
  usuário). `ProficiencyEntry.grantedBy` (`{ kind: kit | race | tribe, name }`,
  opcional; schema no `thac0berry-data`, gerador no branch do iPad). Ao
  escolher kit, raça ou tribo, as bônus entram marcadas, com 0 slots e a
  etiqueta da origem na linha; o que o personagem já tem não se repete (a
  comprada fica como está). Raça: Endurance automática para anão (Complete
  Book of Dwarves, "0 Slots - Dwarf"; decisão do usuário). Ao trocar kit,
  raça ou tribo (e na troca de classe, que tira o kit), saem as bônus da
  origem antiga; as já usadas (Chk preenchido) são perguntadas antes: Remove
  tira, Keep mantém como comprada (sem marca, com os slots do compêndio).
  Fichas antigas não migram (decisão do usuário). `useConfirm` ganhou o
  rótulo do "não" ("Keep"). Regras em `src/rules/raceKit.ts`
  (`grantProficiencies`, `revokeProficiencies`, `usedGrantedProficiencies`,
  `raceBonusProficiencies`). iPad: pendência no `TODO.md` de lá (o iPad perde
  o campo ao salvar). Nota: `src/types/library.ts` é gerado do schema
  (`npm run types`); editado à mão, quebrou o `--check` do CI — regerado
  depois que o schema entrou na `main` do `thac0berry-data`.
- 2026-10-24, slots de nonweapon (web v0.106.1, pedido do usuário): embaixo
  de Proficiencies, "Nonweapon Proficiency Slots: 3/5 used (2 left)" (vermelha
  se passou, "N over"), como a linha dos slots de arma. Total pela Tabela 34
  (`nonweaponProficiencySlots` em `src/rules/multiclass.ts`: classe única,
  multiclasse pelo maior inicial e ritmo mais rápido, classe dupla somando
  as classes); gasto = soma dos slots das linhas (`nonweaponSlotsUsed`; as
  bônus de kit/raça têm 0). O bônus de Inteligência continua só nos slots de
  arma, como já era (o PHB o põe em nonweapon; a decidir com o usuário).
- 2026-10-24, descrição dos itens mágicos da ficha (web v0.106.2, pedido do
  usuário): na página 2, em Magic Items, o item que existe no compêndio abre
  a descrição (`MagicItemDetail`): ⓘ ao lado do campo na edição; o nome vira
  link na leitura e na impressão. Casa pelo id gravado pelo seletor
  (`matchedItemID`) ou, se foi digitado, pelo nome exato (sem diferença de
  maiúsculas); item inventado fica só texto. O índice de itens só carrega
  quando a lista tem itens.
- 2026-10-24, itens mágicos criados pelo mestre ou pelo jogador (web v0.107.0,
  proposta aprovada: a) o mestre vê os privados dos jogadores da campanha;
  b) o jogador pode compartilhar com a campanha; c) a edição atualiza as
  fichas sozinha; d) entregas 1 e 2 juntas). Backend `custom_magic_item`
  (`20261024120000_itens_magicos_customizados.sql`; **precisa do `npx supabase
  db push`** no `thac0berry-backend`). Ficha: `QuantifiedItem.customItem`
  (id, versão e cópia dos dados; schema no `thac0berry-data`). Web:
  `src/lib/customItems.ts` (banco), `src/rules/customItems.ts` (item vazio,
  cópia de um item do livro, cópia da linha, atualização das cópias),
  `CustomItemEditor` e `CustomItemDetail`. Em Magic Items: o seletor mostra
  primeiro os itens criados (da campanha da ficha que a pessoa vê, e os
  pessoais), com a categoria "Homebrew · …"; "+ new item" abre o editor (pode
  começar de um item do livro; "Share with the campaign" quando a ficha está
  numa campanha; apagar mantém a cópia nas fichas); ⓘ/nome abre a descrição
  com "Edit" para o dono; a linha tem a etiqueta "homebrew". Ao abrir a ficha
  com permissão de editar, as cópias de versão mais velha se atualizam. "Dar
  ao personagem": o mestre abre a ficha do jogador e adiciona pelo seletor.
  iPad: pendência no `TODO.md` de lá (perde o campo ao salvar).
- 2026-10-24, bônus de Inteligência nos slots nonweapon (web v0.108.0, pedido
  do usuário): a Tabela 4 ("# of Languages") passa a somar nos slots de
  proficiência nonweapon, como diz o PHB (cap. 5), e sai dos slots de arma,
  onde estava desde a cópia do iPad. `nonweaponProficiencySlots` recebe a
  Inteligência; `totalWeaponSlots` continua aceitando o bônus para o teste de
  paridade com o iPad, mas a ficha não passa mais. Divergência com o iPad
  registrada no `TODO.md` de lá. No mesmo dia, no `thac0berry-data`: as
  tabelas de progressão de Militant Psionicist, Feralan, Ghosthunter,
  Justifier, Mountain Man, Seeker e Votary viraram tabelas markdown (como a
  do Mind Monk) e a ficha do kit as desenha como tabela.
- 2026-10-24, favoritar magias no grimório (web v0.109.0, pedido do usuário:
  "não consigo favoritar magias"). A web nunca teve o botão, só lia as
  favoritas importadas do iPad para o topo do seletor da folha de magia.
  Agora, como no `SpellbookView` do iPad: estrela ☆/★ em cada magia do
  grimório (priest e mago) e na ficha da magia, e o filtro "★ Favorites
  only". Grava em `user_preferences.favorite_spell_ids` (`useFavoriteSpells`
  em `src/lib/favoriteSpells.ts`, gravações em fila com a lista inteira; se
  falhar, volta e avisa). Sem sessão, a estrela não aparece. Sem migração (a
  coluna e a permissão do dono já existiam).
- 2026-10-24, favoritar magias na folha de magia (web v0.110.0, pedido do
  usuário: "o mais útil é na spell sheet"). Estrela ☆/★ em cada magia do
  seletor do slot (`SlotEditor`) e na ficha da magia aberta pela folha. A
  ordem da lista fica a de quando a janela abriu (a linha não pula ao marcar);
  na próxima abertura, as favoritas sobem. A ficha usa o mesmo
  `useFavoriteSpells` do grimório (antes só lia a lista).
- 2026-10-24, itens que lançam magias entram sozinhos na spell sheet (web
  v0.111.0, pedido do usuário; dados primeiro, por decisão dele). No
  `thac0berry-data`: campo novo `power.uses` (nome da função, magia
  equivalente, cargas por uso, limite por dia, efeito), escrito à mão a partir
  do texto (`scripts/add_magic_item_uses.py`), lote 1 com os 43
  Rods/Staves/Wands do DMG (33 com funções; armas e itens sem função ficam
  sem). Na web: ao criar uma folha (dia novo, "First day", sessão nova da
  campanha), cada item de Magic Items da ficha com funções no catálogo (ou com
  o `power.spell` antigo) entra na folha com uma linha por função: a magia
  ligada (abre a descrição), o limite (por dia, senão as cargas do item,
  senão 20) e o dano/cura do item. Item já na folha (herdado do dia anterior,
  pelo id do catálogo ou pelo nome) não se repete; item homebrew não entra.
  `src/rules/itemSpells.ts` (puro, com testes) e `src/lib/itemSpells.ts`
  (carrega o catálogo; se falhar, a folha nasce sem os itens). Próximos lotes
  de dados, se o usuário quiser: anéis e itens diversos do DMG.
- 2026-10-24, descrições em Magic Item Spells (web v0.111.1, pedido do
  usuário: seguir o padrão de Magic Items da ficha). Na folha de magia, o
  item do compêndio (pelo id ou pelo nome exato) e cada magia ligada abrem a
  descrição: ⓘ ao lado do campo na edição; o nome vira link na leitura (a
  magia já virava).
- 2026-10-24, mais itens que lançam magias (web v0.111.2; dados no
  `thac0berry-data`). Lotes 2 e 3 de `power.uses`: os 31 anéis do DMG e os 179
  itens diversos do DMG (43 com funções: elementais, colar de contas de
  oração, colar de mísseis, chifres, gemas, tridentes...). Item com
  `power.spell` de efeito passivo (Ring of Free Action, Ring of Spell
  Turning) recebe `uses: []`, e a web passou a tratar a lista vazia como
  "nenhuma função": esses anéis não entram mais na spell sheet.
- 2026-10-24, bônus de AC dos itens mágicos (web v0.112.0, proposta aprovada,
  com o "?" pedido pelo usuário). Cada linha de Magic Items (página 2) tem um
  bônus de AC (`QuantifiedItem.acBonus`, ou o sugerido: o do item criado, ou o
  "+N" do nome de armadura, escudo ou item de proteção) e a marca "worn"
  (`QuantifiedItem.worn`; schema pelo gerador do iPad, web primeiro). A CA
  final passa a ser Armor + DEX − itens em uso (`finalArmorClass`, que o
  Combat Tracker também usa), com as regras do DMG: Ring of Protection não
  melhora a AC com armadura mágica e anéis não somam; Cloak of Protection não
  funciona com armadura mágica nem com escudo. Os itens aparecem como linhas
  automáticas em AC Modifiers (etiqueta "item"), e o "?" ao lado da conta do
  escudo mostra o racional (armadura, DEX, cada item e o que não conta e por
  quê). Aviso de transição, como o da DEX: se a caixa Armor já contava os
  itens, a ficha oferece corrigir. `src/rules/armorClass.ts` (com testes).
  Backlog novo em `docs/backlog.md`.
- 2026-10-24, bônus de AC do livro nos itens mágicos (web v0.112.1; caso do
  Kelmon the Third: Laeral's Storm Armor e Shield of the Holy não têm "+N" no
  nome e ficavam sem bônus). O índice de itens (`magic-index.json`) passa a
  levar o `defenseBonus.acBonus` (92 itens), e ao abrir a ficha a linha de
  Magic Items sem bônus nem sugestão pelo nome recebe o do livro
  (`fillCatalogACBonuses`, gravado na linha para o Combat Tracker ver). O
  jogador corrige se o dele for outro (Shield of the Holy: +2 com sacerdote da
  mesma divindade).
- 2026-10-24, armadura e escudo comuns (web v0.113.0, proposta aprovada com
  o item 5). Página 2, bloco Armor: Armor e Shield viram seletores (lista do
  PHB, `armor.json`), gravando no formato do iPad (`armorRating` = AC base da
  armadura, `shieldRating` = "-1") e os nomes em Type Worn. A caixa ARMOR da
  página 1 é recalculada (armadura, ou 10 sem armadura, + escudo) quando uma
  peça muda; dá para digitar por cima, e a próxima troca recalcula (como o
  iPad). O "?" da CA mostra armadura, escudo e o que foi digitado por cima.
  Shieldless AC (sem o escudo comum nem os mágicos) e Rear AC (também sem o
  bônus de DEX) passam a ser calculados; o texto digitado vale por cima.
  `src/rules/armorClass.ts` e `rules.ts` (`shieldlessArmorClass`,
  `rearArmorClass`), com testes. iPad: pendência de parar de tirar o bônus
  mágico da caixa ARMOR (a web tira na CA final).
- 2026-10-25, XP mínimo do nível (web v0.114.0, pedido do usuário): ao mudar
  o nível (cabeçalho, setas, nível de uma classe do multiclasse), se o XP da
  ficha está abaixo do necessário para os níveis, ele vira o XP base do nível;
  nunca baixa. Multiclasse divide o XP igualmente (PHB), então o mínimo é
  classes × o maior requisito; classe dupla conta só a classe atual
  (`minimumExperience` e `raiseExperienceToLevel` em `multiclass.ts`, chamados
  por `setLevel` e `setMultiClasses`). Personagem novo nasce no nível 1 com 0
  XP, que já é o mínimo. iPad: pendência no `TODO.md`.
