# DM Shield: plano e log

Evolução do hub DM Tools num "shield" do mestre — o que ele mais precisa,
visualmente fácil de achar. Três propostas discutidas em 2026-10-17:

- **A — Pin to Shield**: fixar tabelas, monstros e fichas na campanha ativa,
  para achar rápido em DM Tools.
- **B — Live dashboard**: tela nova com faixa de PV do grupo, encontro ativo,
  anotações e atalhos — protótipo visual feito (Claude Artifact); o usuário
  vai pedir ajustes antes de implementar.
- **C — Caderno rápido do mestre**: não detalhado ainda.

Decisão do usuário (2026-10-17): seguir com a A agora; B fica para depois dos
ajustes; C em aberto.

## Decisões da opção B (2026-10-17–18)

- Protótipo visual (Claude Artifact) da dinâmica aprovado: **4 telas que o
  mestre troca com ‹ › (ou as bolinhas), como um shield físico** — cabeçalho
  fixo, conteúdo deslizando.
- As 4 telas: **Group & Encounter** (PV do grupo + encontro ativo), **Pinned**
  (tabelas e monstros fixados juntos — a tela de Elenco já cobre os
  personagens fixados), **Session Notes** (o resumo de uma sessão da mesa,
  não o campo `notes` geral da campanha — ver PS3) e **Cast & NPCs** (o elenco
  da campanha; não há entidade de NPC separada no app, então é a mesma lista
  de personagens).
- Entrada: novo card "Shield" em DM Tools, desabilitado sem campanha ativa de
  verdade (`/dm/shield`; precisa de `campaign.pinned_items`, sessões e elenco,
  que não existem no One-shot).

## Decisões da PS3 (2026-10-18, ajustes depois de usar a PS2)

1. **Voltar pra tela certa**: as telas abertas a partir do Shield (Combat
   Tracker, ficha, tabela, monstro) devem voltar pro Shield na mesma tela, não
   pro destino de sempre (DM Tools/Characters) — só nessas telas, sem mudar o
   "voltar" do resto do app.
2. **Personagens clicáveis**: no grupo e no encontro ativo, clicar num
   personagem abre a ficha dele (quando existe no app).
3. **Fixar sem sair do Shield**: a tela Pinned ganha um jeito de fixar tabela
   ou monstro ali mesmo (busca + fixar), sem ir ao Table Grimoire/Monsters.
4 e 5. **Session Notes por sessão**: cada sessão da mesa já tem seu próprio
   resumo (`session.summary`, a mesma tela "Sessions" da campanha) — a tela do
   Shield edita isso, não o campo Notes geral. Decisão: **fixar sessões
   específicas** (reaproveita o mecanismo da opção A, `kind: 'session'`); sem
   nenhuma fixada, mostra a mais recente; com mais de uma fixada, pagina entre
   elas.
6. **Cards de resumo, não links**: a tela Pinned ganha cards reais — tabela
   com prévia das primeiras linhas e um "Roll" que rola ali mesmo; monstro com
   HD/XP/frequência/resumo (do índice, sem buscar a ficha inteira). "Open"
   continua existindo pra quem quer a página cheia.

## Decisões da opção A

- Mostra em **DM Tools** (seção "Pinned", no topo, acima dos cartões do hub);
  quando a Shield (proposta B) existir, essa seção migra para lá.
- O que fixa nesta entrega: **tabelas, monstros e fichas de PC/NPC**.
- Guardado **por campanha**, no Supabase (`campaign.pinned_items`); não existe
  no One-shot (sem linha de campanha).

## Entregas

| # | Entrega | Estado |
|---|---|---|
| PS1 | Fixar tabelas, monstros e fichas na campanha ativa; seção "Pinned" em DM Tools | feita (web v0.92.0; backend `20261017120000_fixar_no_shield.sql`) |
| PS2 | Tela "Shield" (opção B): carrossel de 4 telas | feita (web v0.93.0) |
| PS3 | Voltar pro Shield, personagens clicáveis, fixar sem sair, notas por sessão, cards de resumo | feita (web v0.94.0) |
| PS4 | Tabela completa (componentizada), widgets reordenáveis e paginação dentro de Pinned | feita (web v0.95.0) |

## Log

- 2026-10-17, PS1 feita (web v0.92.0; backend `pin-to-shield`):
  - **backend:** `campaign.pinned_items jsonb` (array de `{kind, ref_id, label}`;
    `kind` é `table`, `monster` ou `character`), mesma RLS e contrato de
    version/trigger da `campaign`;
  - **web:** `src/rules/pins.ts` (puro: `togglePin`, `isPinned`), com testes;
    `src/lib/campaignPins.ts` (lê e grava `pinned_items`, version conhecido);
  - "☆ Pin to Shield" na ficha de uma tabela do Table Grimoire (`TableDetail`,
    ao lado do pin do Combat Tracker, que é outra lista) e na ficha de um
    monstro (`MonsterDetail`); "Pin to Shield"/"Unpin from Shield" no menu "⋯"
    de um personagem (`CharacterActions`, só com campanha);
  - DM Tools: seção "Pinned" (`PinnedSection`) com um chip por item (ícone por
    tipo, "✕" para desafixar), escondida quando não há nada fixado ou a
    campanha é o One-shot; o chip abre a tabela/monstro direto
    (`/dm/tables?open=<id>`, `/dm/monsters?open=<id>`) ou a ficha do personagem;
  - pendente: testar o fluxo completo depende do usuário aplicar a migração
    (`supabase db push` no `thac0berry-backend`, branch `pin-to-shield`).
- 2026-10-18, PS2 feita (web v0.93.0):
  - `src/pages/DmShield.tsx` (`/dm/shield`, só modo DM, só com campanha ativa
    de verdade): carrossel de 4 telas, `index` em `useState`, setas e bolinhas
    trocam com `setIndex` funcional (evita o bug de clique duplo com
    closure velha), `transform: translateX()` na faixa (CSS `.shield-track`);
  - Group & Encounter: PV do grupo (`useCampaignCharacters`, só vivos, cor por
    faixa de PV) e o encontro em andamento (`encounterInProgress` do
    `combatStore`), com "Resume Encounter" para `/dm/combat`;
  - Pinned: `fetchCampaignPins` filtrando fora `kind: 'character'`, mesmos
    links/desafixar da seção de DM Tools;
  - Session Notes: `useCampaignDoc` (o mesmo hook da tela da campanha),
    `readOnly` se a conta não é o mestre dela;
  - Cast & NPCs: a lista de personagens da campanha (sem entidade de NPC
    separada), link para a ficha;
  - card "Shield" em DM Tools (`toolsFor`, baseado no padrão `hub-row-disabled`
    do Compendium), desabilitado sem campanha ativa;
  - achado na checagem: `.shield-viewport{overflow:hidden}` é também
    contêiner de rolagem — o navegador empurrava o `scrollLeft` dele sozinho
    ao focar um botão depois que o conteúdo assíncrono (pins, notas) mudava de
    altura, desalinhando as telas; `overflow: clip` em vez de `hidden` resolve
    (não vira contêiner de rolagem);
  - achado também: dois cliques rápidos em "›" perdiam um (closure velha de
    `index` no handler) — trocado para `setIndex(i => …)`;
  - conferido no navegador: as 4 telas, ida e volta, voltar ao fim (4→1) e ao
    início (1→4), pin/unpin de tabela refletindo na tela Pinned, card
    desabilitado no One-shot; testes: 238 (sem novos — só UI).
- 2026-10-18, PS3 feita (web v0.94.0; ajustes do usuário depois de usar a PS2):
  - **voltar pro Shield** (`src/lib/shieldBack.ts`): `shieldBackLink(screen)`
    monta `back=/dm/shield?screen=N` pros links que o Shield abre;
    `useBackTo(defaultTo, defaultLabel)` lê esse `back` da URL no botão de
    voltar de `CombatTracker`, `CharacterSheet`, `TableGrimoire` e
    `MonsterCompendium` (rótulo vira "‹ Shield" quando veio de lá); o Shield
    lê `?screen=` ao abrir pra começar na tela certa;
  - **personagens clicáveis**: `PartyStrip` (chip vira `<Link>`) e as linhas
    do encontro ativo com `characterID` (as de monstro continuam sem link);
  - **fixar sem sair do Shield** (`src/components/ShieldPinPickers.tsx`):
    `TablePinPicker` e `MonsterPinPicker` (busca + fixa, reaproveitando
    `PaperModal`), "+ Pin a table"/"+ Pin a monster" na tela Pinned;
  - **Session Notes por sessão**: `useCampaignSessions` (o hook da tela
    Sessions) em vez de `campaign.notes`; `kind: 'session'` novo em
    `PinKind`; `SessionPinPicker` ("Pin sessions…"); sem nenhuma fixada,
    mostra a mais recente ("· most recent"); com mais de uma, pagina entre
    elas (‹ › própria da tela, "título (N/total)");
  - **cards de resumo**: `PinnedTableCard` (prévia de até 3 linhas, "+N more
    rows", "Roll" quando a tabela tem dado — `rollPlan`/`findRow`/`rollDice`
    reaproveitados do motor único — e "Open"); `PinnedMonsterCard` (HD, XP,
    frequência e resumo do índice, "Open full stat block"); `useShieldTables`
    e `useShieldMonsterIndex` carregam os dados uma vez e servem tanto os
    cards quanto os pickers; item fixado que não resolve (raro) cai num card
    simples só com o link;
  - achado no teste: screenshot automatizado pegou um frame de transição e
    pareceu um bug de desalinhamento — refeito sem pressa, o carrossel
    (já com `overflow: clip` da PS2) estava correto; achado real: um clique
    em "‹ Shield" com a ficha de tabela/monstro ainda aberta por cima cai no
    fundo do modal (fecha o modal, não navega) — comportamento já existente
    do app (o modal cobre o cabeçalho), não é regressão desta entrega;
  - conferido no navegador: ida e volta do Combat Tracker, de uma ficha (do
    grupo e do elenco) e de uma tabela/monstro fixado, cada um voltando pra
    tela certa do Shield; fixar tabela e monstro pelo picker, rolar
    "Table 54: 2-20 Encounter Table" inline (9 → 9 · Common**), fixar duas
    sessões e paginar entre elas, voltar ao estado sem nada fixado; testes:
    238 (sem novos — só UI).
- 2026-10-18, PS4 feita (web v0.95.0; ajustes do usuário depois de usar a PS3):
  - **tabela completa, componentizada** (pedido explícito: não duplicar a
    visualização): `src/components/GrimoireTableBody.tsx` extrai o
    `<table>` que `TableDetail` já desenhava (cabeçalho, zebra, "0"→"00",
    linha em destaque) — `TableDetail` passou a usar o componente, e
    `PinnedTableCard` também, mostrando a tabela inteira (antes, 3 linhas);
    `.rule-table-scroll` ganha `max-height` só dentro do card do Shield, pra
    uma tabela de 79 linhas não estourar a tela;
  - **mais "telas" dentro de Pinned**: decisão do usuário (perguntado:
    várias telas no carrossel vs. paginação dentro de Pinned) foi paginação
    dentro da tela, como já existia em Session Notes — `Pinned` virou uma
    lista só de "widgets" (tabela + monstro juntos, não mais duas seções
    separadas), paginada de `WIDGETS_PER_PAGE` (3) em 3, com a mesma barra
    "‹ Page N/total ›";
  - **widgets reordenáveis**: pedido era "arrastável", mas o Shield também
    roda no Safari do iPad, onde o drag-and-drop nativo HTML5 não funciona em
    touch — optei por setas ↑/↓ em cada widget (confiável em qualquer
    aparelho) em vez de um drag que quebraria no uso real; `WidgetControls`
    (componente só, reaproveitado nos 3 tipos de card) com ↑/↓/✕;
    `reorderCampaignPins` (`src/lib/campaignPins.ts`) grava a lista inteira
    na ordem nova; `applyWidgetOrder` recoloca só os widgets (tabela/monstro)
    na ordem pedida, mantendo outros tipos fixados (sessão) nos mesmos
    lugares;
  - conferido no navegador: tabela fixada mostrando todas as linhas com a
    cara do Table Grimoire; mover "Beholder" pra cima, recarregar a página e
    ver a ordem gravada; paginação ("Page 2/3") mostrando as próximas
    tabelas/monstros fixados; testes: 238 (sem novos — só UI).
