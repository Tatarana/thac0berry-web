# Combat Tracker: plano e log

Ferramenta do DM (hub DM Tools, só no modo DM, `/dm/combat`) para conduzir o
combate na mesa: combatentes, iniciativa, moral e tabelas à mão. Log do
trabalho: decisões, entregas e pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-09)

1. **Onde guardar**: no aparelho (localStorage) agora. No Supabase (todos os
   aparelhos, parte da sessão da campanha) vai para o backlog. Feito em
   2026-10-12 (web v0.64.0; ver o log).
2. **Iniciativa**: o DM escolhe o padrão (por lado, a regra base do DMG, ou
   individual, a opcional) nas configurações.
3. **Ideias do CT5**: decidir quando chegar a vez delas.
4. **Nome na tela**: "Combat Tracker".
5. **PV dos monstros**: o DM escolhe (rolar pelos DV ou usar a média).
6. **PCs**: os personagens da campanha cadastrados no App **e** os de quem
   joga sem o App (o DM inclui à mão).

## Regras (DMG, conferidas no `rules.json`)

- Iniciativa (cap. 9, Tabelas 40 e 41): 1d10 por lado, o menor age primeiro;
  as opcionais quebram por indivíduo, somando velocidade da arma ou tempo de
  conjuração.
- Moral (cap. 9, Tabelas 49 e 50): 2d10, igual ou abaixo da moral mantém o
  combate; nunca para PCs; não testar toda rodada.
- Monstros: CA, DV, THAC0, ataques, dano, moral ("Elite (13-14)") e XP vêm do
  catálogo (`thac0berry-data/data/monsters`).

## Limite do backend (Fase 1)

Hoje cada conta só lê os próprios personagens. O CT1 lista os PCs **pela
campanha**: aparecem os que a conta do DM consegue ler. Quando a Fase 2 do
backend (`campaign_member` e o DM lendo as fichas da campanha,
`thac0berry-backend/docs/modelo-de-dados-e-sync.md` §3–§4) existir, os
personagens dos jogadores aparecem na mesma lista **sem mudar a web**.

## Entregas

| # | Entrega | Estado |
|---|---|---|
| CT1 | Encontros e combatentes: PCs (da campanha ou à mão), NPCs, monstros do catálogo (com quantidade e PV rolados ou na média), PV com dano/cura, estados (caído, morto), condições com rodadas, configurações do DM; guardado no aparelho | feita (web v0.43.0) |
| CT2 | Iniciativa e rodadas: por lado ou individual (padrão do DM), modificadores da Tabela 40, rolar ou digitar, ordem e "Next" | feita (web v0.44.0) |
| CT3 | Moral: 2d10 contra a moral, Tabela 50 em chips (PV perdido calculado), resultado e quando testar | feita (web v0.45.0) |
| CT4 | Tabelas rápidas: faixa com as tabelas de combate (35, 36, 39, 40/41, 43, 44, 46, 47, 48, 49/50, 51, 57, 58, 59), janela do Table Grimoire (com Roll) e lista do DM | feita (web v0.49.0) |
| CT5a | Surpresa, salvamentos de monstro, XP no fim (decisão do usuário: a sugestão) | feita (web v0.51.0) |
| CT5b | "Acerta?" (ataque contra a CA, Tabela 35, dano) e log do combate | feita (web v0.52.0) |
| CT6 | Distância (Tabela 58) e reação (Tabela 59, com o Carisma de quem fala) antes da rodada 1 | feita (web v0.82.0) |
| CT7 | Efeitos em vários combatentes de uma vez ("+ Effect": rodadas ou turnos, alvos por lado, tirar de todos) | feita (web v0.83.0) |
| CT8 | Salvamento por alvo no "+ Effect" (ficha, Tabela 46 ou digitado; "negates" ou "half") | feita (web v0.84.0) |
| CT9 | XP do encontro nas fichas (com o +10% do atributo principal), no fim ou depois | feita (web v0.85.0) |
| L1 | Ao vivo: `encounter_view` no backend (vista filtrada; membros leem, só o mestre publica) | feita (backend `20261014210000`) |
| L2 | Ao vivo: o mestre publica ("Show to players", "hide" por combatente) | feita (web v0.86.0) |
| L3 | Ao vivo: a tela dos jogadores (cartão na campanha, só leitura) | feita (web v0.87.0) |
| I1 | Interativo: backend `combat_message` (mensagens com aceite nos dois sentidos) | feita (backend `20261015120000` e `20261015150000`) |
| I2 | Interativo: o mestre manda dano/cura; o jogador aceita (Settings) ou responde na ficha | feita (web v0.88.0) |
| I3 | Interativo: o jogador manda iniciativa e d20 de salvamento; o mestre aceita | a fazer |

## Backlog

- I3: o jogador manda a própria iniciativa e o d20 de um salvamento pedido pelo mestre; o mestre aceita para o número entrar no Combat Tracker.
- Fase 2 do backend: o DM lê as fichas dos jogadores da campanha.

## Log

- 2026-10-09: plano aprovado (decisões 1 a 6). Início do CT1.
- 2026-10-09, CT1 feita (web v0.43.0):
  - `src/rules/combat.ts` (pura, com testes): modelo do encontro
    (combatentes, lados Party/Enemies/Others, condições), DV em PV (d8 por DV,
    "½" 1d4, "¼" 1d2, "1 hp", "1-4 hp", PV entre parênteses como "9 (40 hp)"
    valem fixos; rolados pelo motor de dados ou na média; 90,5% dos DV do
    catálogo viram PV sozinhos, o resto — "Varies", "8, 12, or 16" — o DM
    digita), moral ("Steady (11-12)"), nomes numerados ("Orc 1–3"),
    estados (caído em 0, morto em −10 ou em 0, à escolha do DM), dano e cura
    (a cura não passa do máximo), condições com rodadas (`tickConditions`,
    para o CT2);
  - `src/lib/combatStore.ts`: encontros e configurações no `localStorage`
    (`thac0berry.combat`, com `version` para o Supabase do backlog); erro de
    gravação aparece na tela;
  - tela `/dm/combat` (só modo DM) e cartão "Combat Tracker" no hub: vários
    encontros; **+ PC** (personagens da campanha que a conta lê — hoje os da
    própria conta, com a Fase 2 os dos jogadores, sem mudar a web — e quem joga
    sem o App, à mão), **+ Monster** (busca no catálogo, variante, quantidade,
    lado, PV rolados ou na média), **+ NPC** (à mão, com moral); cada
    combatente com CA, THAC0, PV atual/máximo, dano/cura, estado, condições,
    notas, lado e a ficha do monstro; contagem de quem está de pé por lado;
  - configurações do DM (no aparelho): iniciativa padrão (por lado ou
    individual, usada no CT2), PV de monstro (rolar ou média), morte em −10
    ou 0;
  - conferido no navegador (3 orcs na média, PC sem o App, NPC, dano até
    caído e morto, condição, recarregar mantém tudo, ficha do monstro;
    celular sem rolagem horizontal); testes: 132 (10 novos).
- 2026-10-09, CT2 feita (web v0.44.0):
  - `src/rules/combat.ts`: modificadores lidos das Tabelas 40/41 do
    Table Grimoire (só as linhas com número; velocidade da arma e tempo de
    conjuração são digitados), total modificado (d10 + modificadores +
    valor digitado), quem rola (lados com alguém de pé, ou cada combatente de
    pé), ordem com o menor primeiro e **empate simultâneo** (DMG cap. 9),
    `startRound` fecha a ordem (quem cai no meio da rodada não muda a ordem),
    `actingNow`, `endRound` (+1 rodada, condições perdem uma rodada, nova
    iniciativa no mesmo método — o DMG rola a cada rodada);
  - painel de iniciativa no encontro (`src/components/CombatInitiative.tsx`):
    "Before the fight" / "Round N", método por lado ou individual (padrão das
    configurações, trocável antes de começar), d10 rolado ou digitado por
    lado/combatente, modificadores em chips, "Roll all", prévia da ordem,
    "Start round", "Next ›", "End round"; quem age fica com "Acting" na lista;
  - conferido no navegador (por lado com Hasted: Party 4, Enemies 5; Next;
    End round leva à rodada 2 e tira o Bless de 1 rodada; individual com
    empate simultâneo; celular sem rolagem horizontal); testes: 138 (6 novos).
  - **tela em tabela, estilo planilha** (pedido do usuário, ainda na v0.44.0:
    "condense os dados estilo tabela, cabendo horizontalmente"): uma linha
    por combatente, lados como faixas ("Enemies · 3 of 5 standing"); colunas
    Name (tipo, DV, XP, estado e ⓘ da ficha embaixo), AC, THAC0, HP
    atual/máx, ± com − (dano, Enter) e + (cura), Mor., Atk · Dmg, Conditions
    (chips com rodadas e + para acrescentar ali mesmo), Notes, Side, ×; linha
    em destaque para quem age (▶), avermelhada para caído, apagada e riscada
    para morto; a folha do Combat Tracker é mais larga que a padrão (1320 px)
    e a tabela cabe sem rolar em 1024 e 1280 px; no celular, rola de lado
    dentro do quadro; topo enxuto (nome do encontro e + PC/Monster/NPC na
    mesma linha; ordem da iniciativa numa linha).
- 2026-10-09, CT3 feita (web v0.45.0):
  - `src/rules/combat.ts`: moral das Tabelas 49 e 50 lidas do Table Grimoire;
    modificadores calculados sozinhos (`autoMoraleModifiers`): PV perdidos
    25%/50% do combatente **ou do grupo** (nota * da tabela; vale o maior, não
    somam), DV (`hitDiceValue`: "½", "1-1", "4+1", "1-4 hp") e −1 por teste já
    feito na rodada (nota **); moral ajustada (`moraleTarget`), registro do
    teste no combatente (`lastMorale`, com a contagem da rodada) e moral da
    Tabela 49 para quem não tem a do livro (`moraleFromTable`);
  - janela de moral (`src/components/CombatMorale.tsx`), aberta pela célula
    Mor. (nunca em PCs): valor dentro da faixa do livro ("Steady (11-12)" →
    11 ou 12), ou escolha na Tabela 49; 2d10 rolado ou digitado; resultado
    (mantém / falha, com a margem e o que o DMG manda fazer: recuar ou
    debandar, render-se se não houver saída) e "Mark Fleeing/Surrendered"
    (vira condição); Tabela 50 em chips, os automáticos ligados com o porquê
    (o DM desliga se quiser); "When to check morale" com a lista do DMG;
  - na tabela, a célula Mor. mostra ✓/✗ do último teste; a coluna de
    condições agora quebra linha (o `nowrap` das células vencia) e a de
    ataques quebra só em texto longo: continua cabendo em 1024 e 1280 px;
  - conferido no navegador (orc com 40% do lado caído: −2 automático; 2º
    teste na rodada: −1 automático; NPC; PC sem botão; celular); testes: 142
    (4 novos).
- 2026-10-09, ajustes pedidos pelo usuário depois do CT3 (web v0.46.0):
  1. **Iniciativa dos PCs**: os jogadores rolam e o DM só anota. Por lado, a
     linha Party fica só com o campo; no individual, cada PC. "Roll the rest"
     rola só NPCs e monstros; "Start round" espera as rolagens dos jogadores
     ("Waiting for the players' roll").
  2. **Nome do monstro abre a ficha** (o ⓘ saiu); ✎ renomeia e muda o lado
     (todos os combatentes).
  3. **CA, THAC0 e PV dos monstros** (cerca de 13% vinham em branco porque o
     valor numérico da ficha é vazio quando o texto é ambíguo):
     `armorClassValue` ("0 (5)" → 0, "3/7" → 3), `thac0Value` (tabela por DV
     como "4 HD: 17 / 5-6 HD: 15", ou o primeiro número: "7 or 5" → 7),
     `hitDiceChoices` (faixa "4-7", "2 to 8", lista "8, 12, or 16" — o DM
     escolhe, começa no menor); **bug corrigido**: DV em faixa ("16-20") virava
     16d8−20; gigantes ("14 + 1-4 hit points") agora têm PV (14d8 + 1d4). Na
     janela + Monster, CA, DV e THAC0 aparecem preenchidos e editáveis, com o
     texto do livro ao lado; o THAC0 acompanha o DV escolhido; sem PV pelos
     DV ("Varies"), campo "HP each". No catálogo: CA 96,6%, THAC0 93,1%, PV
     92,8% sozinhos (o resto é "Varies", "As in life", "See below").
  4. **Coluna Side removida** (o lado muda pelo ✎).
  5. **Explicação das colunas**: tooltip em cada título (computador) e "?" no
     cabeçalho com a legenda de todas as colunas (iPad).
  - Conferido no navegador (Hell Hound com DV 6 → THAC0 15; Frost Giant CA 0,
    THAC0 7, PV 53; ficha pelo nome; ✎ mudando de lado; legenda; tabela cabe
    em 1024 e 1280 px); testes: 147 (5 novos).
- 2026-10-09, iniciativa compacta e PV rolados na tabela (web v0.47.0, pedido
  do usuário: "o bloco Before the fight tá enorme"):
  - a iniciativa virou **uma linha** ("Before the fight · Roll initiative";
    na rodada, "Round N · Acting: Enemies (7) · Next › · End round ·
    Initiative") e uma **janela** com as rolagens (método, d10, modificadores,
    "Roll the rest", "Start round" fecha a janela; com a rodada começada, a
    janela mostra a ordem);
  - **coluna Init** na tabela: o total de cada combatente (o do lado, na
    iniciativa por lado), com "Acts 2nd" no tooltip; "—" antes das rolagens,
    vazio para caídos e mortos (`initiativeByCombatant`);
  - **🎲 nos PV dos monstros**: rola os DV de novo mantendo o dano sofrido
    (`rerollHp`; 4/6 que rola 8 vira 6/8), tooltip com o dado
    (`hitPointDice`: "4d8+1", "14d8 + d4");
  - modificadores de iniciativa num hook próprio (`src/lib/initiativeTables.ts`),
    usado pela página e pela janela;
  - conferido no navegador (rolagens na janela, Init na tabela, Next, End
    round limpa o Init, 🎲 com dano mantido, PC sem 🎲; cabe em 1024 e 1280
    px); testes: 149 (2 novos).
- 2026-10-09, rodadas sem travar, re-rolar e voltar no tempo (web v0.48.0):
  - **bug da v0.47.0**: quem rolava a iniciativa e fechava a janela ficava
    só com "Roll initiative" na linha, sem Start nem End round (print do
    usuário no round 2). Agora a linha nunca fica sem saída: "Start round N"
    aparece nela assim que todos rolaram, e "End round" existe desde a
    rodada 1, mesmo sem iniciativa (o DM pode pular);
  - **rolar de novo na mesma rodada**: com a rodada em andamento, a janela
    mostra as rolagens editáveis, "Re-roll the foes" (mantém os d10 dos
    PCs) e "Restart round N" (nova ordem, volta ao primeiro); também Next e
    End round; o método pode trocar a qualquer momento;
  - **voltar a qualquer rodada** (magias que voltam no tempo): cada rodada
    guarda uma foto do começo dela (`withSnapshot`: no "Start round" da 1 e
    no "End round" das seguintes; re-rolar só troca a iniciativa da foto,
    o dano já feito não entra); botão "Rounds" lista as rodadas com quem
    estava de pé; `goBackToRound` restaura PV, THAC0, condições e moral e a
    iniciativa daquela rodada pronta (decisão do usuário), e esquece as
    rodadas seguintes (com confirmação); nomes, notas e lados ficam como
    estão; até 50 fotos (`historyLimit`), no aparelho;
  - **Beholder** e PV em faixa sem dado padrão ("45-75 hp"): média no meio
    da faixa, rolagem sorteia nela; THAC0 por PV ("45-49 hp: 11…",
    `thac0ByHitPoints`) calculado para cada um e acompanhando o 🎲;
  - conferido no navegador (o caso do print; re-rolar com dano feito;
    pular a rodada 2; voltar da 3 à 1 com PV restaurados; recarregar mantém;
    Beholder CA 0, 60 PV, THAC0 7 → 🎲 75 PV, THAC0 5); testes: 152 (3 novos).
- 2026-10-09, janela + Monster (web v0.48.1): botão "Add <monstro>" em
  destaque (largo, vinho) e fechar a janela (close, Esc ou fora dela) com um
  monstro escolhido e não adicionado pede confirmação; sem monstro escolhido,
  fecha direto.
- 2026-10-09, CT4 feita (web v0.49.0; decisão do usuário: a tabela abre em
  janela por cima, como no Grimoire):
  - `src/rules/quickTables.ts` (com testes): lista padrão (DMG 35, 36, 39,
    40, 41, 43, 44, 46, 47, 48, 49, 50, 51, 57, 58, 59 — 39, 43 e 48 entraram
    a mais que o plano), lista do DM nas configurações (ausente = padrão;
    `toggleQuickTable` volta a null quando fica igual à padrão), ids que não
    existem nos dados ficam de fora, rótulos curtos nas padrão ("46 Saves"; a
    faixa cabe em duas ou três linhas) e o título dos dados nas outras;
  - faixa "Tables" no Combat Tracker (`src/components/CombatTables.tsx`),
    abaixo da linha da iniciativa: cada chip abre a janela do Table Grimoire
    (`TableDetail`: Roll quando a tabela tem dado, histórico da visita,
    tabelas citadas); "edit list" mostra × nos chips, "+ Table" (busca em
    todas as tabelas, de qualquer livro e cenário) e "Reset";
  - "☆ Combat Tracker" / "★ In the Combat Tracker" na janela da tabela, no
    Grimoire e no Combat Tracker, fixa ou tira a tabela da faixa;
  - conferido no navegador (abrir, tirar pelo ★, editar, pôr uma tabela do
    CTH, Reset, fixar uma tabela do PHB pelo Grimoire e vê-la no tracker;
    1024 px e celular sem rolagem de página); testes: 155 (3 novos).
- 2026-10-09, encerrar o encontro e o grupo que vem junto (web v0.50.0;
  decisões do usuário: NPCs aliados do lado Party vêm junto; PV dos sem App
  como terminaram):
  - **End encounter**: marca o encontro como encerrado (`endEncounter`, data
    e rodada), grava e volta para DM Tools. Encerrados saem da fila e ficam em
    "past encounters (N)"; abertos, mostram "Ended on …" e **Reopen**;
  - **+ New encounter** abre uma janela com nome e **campanha** e mostra quem
    vem junto (`partyForNewEncounter`, com testes):
    - primeiro encontro da campanha: os personagens dela que a conta lê
      (Fase 1 do backend: os da própria conta; com a Fase 2, os dos jogadores);
    - nos seguintes: o lado Party do último encontro da campanha
      (`lastEncounterOf`; sem campanha, o último sem campanha) — PCs e NPCs
      aliados, inclusive caídos e mortos; personagens do App recarregados da
      ficha (PV atuais, CA, THAC0), os sem App com os PV de como terminaram;
      personagem novo na campanha entra também; condições, moral e
      iniciativa limpas; ids novos;
  - campanhas e personagens da conta num lugar só
    (`src/lib/campaignCharacters.ts`), usado pelo + PC e pela janela nova;
  - conferido no navegador (encontro 1 com PCs sem App e henchman; End leva a
    DM Tools; encontro 2 traz Rufus 14/24, Zé −15/30 e o henchman, sem o orc;
    past encounters e Reopen); testes: 157 (2 novos).
- 2026-10-09, CT5a feita (web v0.51.0):
  - **surpresa** (`src/rules/surprise.ts`; PHB cap. 11, DMG Tabela 57): botão
    "Surprise" antes da rodada 1; 1d10 por lado (o da Party os jogadores
    rolam), modificadores da Tabela 57 em chips ("The other side is:"), "+1 a
    cada 10 membros" do outro lado calculado, "can't be surprised"; 1–3
    modificado é surpreso. O lado surpreso fica fora da iniciativa da rodada 1
    (`surprisedNow`; "S" na coluna Init, aviso na linha da iniciativa) e o
    primeiro teste de moral dele ganha o −2 de "was surprised";
  - **salvamentos de monstro** (DMG Tabela 46; Monstrous Manual: guerreiro do
    nível = DV): `warriorSaveRows` acha o bloco do guerreiro na tabela (vem sem
    o nome dos grupos; é o único que começa no nível 0), nível pelos DV
    (`saveLevel`: ½ DV → 0; "4+1" → 4), "save" na linha de monstros e NPCs abre
    as 5 categorias com Roll (d20 + modificador ≥ valor), "+ condition" na falha;
  - **XP no fim** (DMG cap. 8): "End encounter" abre o resumo: inimigos
    vencidos já marcados (caídos, mortos, Fleeing ou Surrendered — fuga e
    rendição contam como vitória), quem divide (lado Party menos os mortos),
    total e parte de cada um, "Copy summary"; o XP fica guardado no encontro
    encerrado ("Ended on … · 315 XP, 157 each");
  - conferido no navegador (inimigos surpresos no escuro: fora da rodada 1, −2
    na moral; salvamento do ogro HD 4+1 = nível 4; XP de 3 orcs e um ogro para
    o único PC vivo; resumo copiado); testes: 161 (4 novos).
- 2026-10-09, CT5b feita (web v0.52.0; o usuário pediu para fazer direto,
  sem proposta à parte):
  - **"Acerta?"** (`src/rules/attack.ts`; DMG cap. 9): "atk" na linha de quem
    está de pé abre a janela: alvo (os do outro lado), THAC0 do atacante e CA
    do alvo (editáveis), modificadores da Tabela 35 em chips (o "Automatic"
    do alvo dormindo fica de fora: o DM decide) e um valor livre; precisa de
    THAC0 − CA no d20 (rolado ou digitado; 20 natural sempre acerta, 1
    sempre erra). Acertou: o dano de cada ataque do monstro vira um botão
    (`attackDamages`: um por "/", "1-8", "1d8+2", "1"; "By weapon" sem dado,
    o DM digita) e "Apply N damage to <alvo>" tira os PV;
  - **log do combate** (`src/rules/combatLog.ts`): toda mudança no encontro
    passa por `describeChanges` (antes × depois): começo de rodada com a
    ordem, fim de rodada e as condições que acabaram, volta no tempo,
    surpresa, quem entrou e saiu, PV (as mudanças digitadas em sequência, em
    até 4 s, viram uma linha só), caído, morto ou de pé de novo, condições,
    testes de moral, fim do encontro com o XP; ataques e salvamentos entram
    como nota. Botão "Log (N)" na linha da iniciativa: por rodada, a mais
    recente em cima, e "Copy log" em texto. Até 500 linhas, no encontro;
  - conferido no navegador (ogro ataca Rufus com ataque pelas costas +2 e
    acerta, dano aplicado; salvamento; PV digitados juntos numa linha;
    condição que expira no fim da rodada; log copiado); testes: 166 (5 novos).
- 2026-10-09, "roll" dos PV dos monstros (web v0.52.1; o usuário achou o 🎲
  estranho): rolar os DV de novo podia matar ou levantar um monstro no meio
  da luta (o dano era mantido) e funcionava o combate todo, a cada toque. Agora
  só aparece **antes da rodada 1** e em monstro **sem dano** (`canRerollHp`):
  é "rolar em vez da média". O emoji virou o texto "roll", discreto, com o
  dado no tooltip; testes: 167 (1 novo).
- 2026-10-09, campanha ativa (docs/campanha-ativa.md, CA2, web v0.54.0): o
  Combat Tracker passou a mostrar só os encontros da campanha ativa do modo
  DM; a campanha não é mais escolhida no encontro novo nem no + PC. O log
  registra o "roll" dos PV como "hit points 4/4 → 8/8" (não mais dano/cura).
- 2026-10-09: ícone do Combat Tracker no DM Tools (arte do usuário, recortada
  do fundo branco: `public/images/icon_combat_tracker.png`, 256 px, como os
  outros ícones do hub).
- 2026-10-12, encontros e configurações na conta (backlog item 4, S2, web
  v0.64.0; backend: tabela `encounter` e `user_preferences.combat_settings`,
  migração `20261012120000`). Decisões do usuário: as configurações do DM vão
  junto; sem login continua só no aparelho; conflito avisa, como na ficha.
  - com login, o aparelho é o cache e a conta manda. Na primeira vez numa
    conta, os encontros do aparelho que ela não tem sobem (fica a cópia
    `thac0berry.combat.backup`), e as configurações também, se forem diferentes
    das padrão e a conta não tiver;
  - cada mudança grava só o encontro alterado, 1 s depois da última, com a
    `version` conhecida (INSERT/UPDATE, nunca upsert); remover vira
    `deleted_at`; erro tenta de novo em 5 s; grava também no `pagehide`;
  - o que a conta ainda não recebeu fica marcado no aparelho (`unsynced`) e
    sobe na próxima abertura (antes, recarregar logo depois de mudar perdia a
    mudança); aba visível de novo, sem pendências, busca a conta;
  - avisos na tela: erro de sincronização e conflito (outro aparelho gravou
    antes: a última vence, a outra fica no histórico);
  - "delete encounter" com a confirmação da página (`useConfirm`): o
    `window.confirm` não aparece no navegador embutido; textos "on this
    device" × "your account" pelo login;
  - funções puras em `src/rules/combatSync.ts`; conferido no navegador
    (criar, apagar o cache e voltar da conta, subida dos encontros locais,
    pendências, configurações, delete com `deleted_at`); testes: 194 (4 novos).
- 2026-10-12, confirmações na página (web v0.65.1): os três `window.confirm`
  que sobravam no combate (trocar de campanha com encontro em andamento,
  voltar a uma rodada, fechar "Add monsters" sem adicionar) viraram
  `useConfirm`; no navegador embutido eles não apareciam e devolviam "não".
  Não sobrou nenhum `window.confirm`/`alert`/`prompt` na web. Conferido no
  navegador (cancelar e confirmar em cada um).
- 2026-10-14, tabelas do mestre na faixa (G5c, docs/grimorio-de-tabelas.md;
  web v0.81.0). No Table Grimoire, a tabela do mestre
  também tem "☆ Combat Tracker" (o id `dm-<uuid>` entra em
  `settings.quickTables`, como os de livro); o Combat Tracker carrega as
  tabelas do mestre da campanha ativa e as junta às de livro, para a faixa, a
  busca "+ Table" e a janela da tabela. Fixada em outra campanha, a tabela não
  aparece (o id fica guardado e volta com a campanha dela). Chip "DM <título>".
  Teste em `tests/quickTables.test.ts`. Conferido no navegador (One-shot): criar
  um d6, fixar, ver o chip na faixa de um encontro, abrir e rolar
  ("2 → 2"), desafixar; encontro e tabela de teste apagados.
- 2026-10-14, CT6 feita (web v0.82.0; decisões do usuário: botões separados,
  como o Surprise; o resultado da reação aparece na linha até a rodada 1
  começar, e fica no log):
  - **dados primeiro** (thac0berry-data `scripts/fix_dmg_table_59.py`): a
    Tabela 59 do DMG tinha perdido a coluna dos PCs hostis (os "Flight"): na
    wiki o cabeçalho tem duas linhas e a importação cortou as linhas na largura
    da segunda. Cabeçalho novo: "Modified Die Roll (2d10)", "Friendly PCs" …
    "Hostile PCs" (conferido no dump);
  - `src/rules/tableRoll.ts`: faixas "2 or less" e "20 or more" (a 59 passa a
    rolar no Grimoire também);
  - `src/rules/encounterStart.ts` (com testes nos dados reais): linhas da
    Tabela 58 com dado e multiplicador ("2d6 x 10"; "Limit of sight" sem dado),
    a linha que a surpresa já decidiu (os dois lados surpresos 3d6, um 4d6),
    atitudes dos PCs pelas colunas da 59, total = 2d10 + modificador − ajuste
    de reação do Carisma (na tabela, número baixo é amistoso), resultado com
    as pontas valendo para abaixo de 2 e acima de 20;
    `charismaReactionAdjustment` em `src/rules/rules.ts` (o da ficha primeiro,
    como o ajuste da DEX);
  - janelas **Distance** e **Reaction** (`src/components/CombatStart.tsx`) ao
    lado do Surprise: terreno em chips com o dado, Roll ou valor digitado;
    atitude dos PCs, quem fala pelo grupo (o lado Party; o Carisma vem da
    ficha dos personagens do App, editável), outro modificador (descrição da
    criatura ou Tabela 50), 2d10 rolado ou digitado; o encontro guarda
    `distance` e `reaction` (campos opcionais) e o log registra os dois;
  - conferido no navegador (One-shot, PC sem App): floresta clara 2d6 × 10 →
    40 ft; PCs hostis, Rufus com Carisma +2, 2d10 = 5 → 3 → Flight; a linha
    mostra os dois e o log ganhou as duas linhas; encontro de teste apagado.
    O Carisma lido da ficha está coberto pelo teste (o One-shot não tem
    personagens do App).
- 2026-10-14, CT7 feita (web v0.83.0; decisões do usuário: o botão fica no
  topo, com + PC/Monster/NPC; turnos guardados em rodadas, 1 turno = 10
  rodadas):
  - `src/rules/groupEffects.ts` (com testes): prazo em rodadas, turnos ou sem
    prazo (`effectRounds`), alvos pelos atalhos (um lado ou todos de pé),
    `applyGroupEffect` (cada combatente com a sua cópia da condição, todas com
    o mesmo `groupID`, campo opcional novo em `Condition`), `removeGroupEffect`,
    `activeGroupEffects` e as sugestões de nome (condições já usadas);
  - log (`src/rules/combatLog.ts`): uma linha por efeito de grupo ("Bless (10
    rounds) on Rufus, Ana", "Bless removed from …", "Bless ends on …" no fim
    da rodada); as condições individuais seguem como antes;
  - janela **+ Effect** (`src/components/CombatEffects.tsx`): nome com
    sugestões, duração (rounds / turns ×10 / no limit, com "= N rounds"),
    alvos com caixas e atalhos (Party, Enemies, Others, Everyone standing,
    Clear), "Apply to N" e os efeitos ativos com "remove from all"; o × de um
    combatente tira só dele;
  - conferido no navegador (One-shot, dois PCs sem App): Bless 1 turno no
    grupo → "Bless 10" nos dois e uma linha no log; "remove from all" tirou
    dos dois; encontro de teste apagado. A contagem e o fim juntos estão nos
    testes; testes: 221 (3 novos).
- 2026-10-14, CT8 feita (web v0.84.0; decisões do usuário: uma coisa de cada
  vez no item do backlog — o XP nas fichas e o Combat Tracker ao vivo depois;
  "save for half" só registra no log quem salvou):
  - `src/rules/groupEffects.ts` (com testes): as 5 categorias na ordem da
    Tabela 46 e da ficha, `sheetSaveTarget` (o valor da ficha menos o
    modificador, como a ficha mostra), `saveSucceeds` (d20 + modificador ≥
    valor), `affectedIDs` ("negates": só quem falhou; "half": todos) e
    `saveNote` (a linha do log com quem salvou e quem falhou, com o d20);
  - janela **+ Effect**: "Saving throw for each target" com a categoria, um
    modificador para todos, "save negates" / "save for half" e a lista dos
    alvos: valor de salvamento da ficha (PC do App), da Tabela 46 pelos DV
    (monstros e NPCs, como a janela "save") ou digitado; d20 digitado (PCs: o
    jogador rola) ou "Roll the rest"; saved/failed em cada linha; "Apply to N
    (who failed)". Em "half", o nome do efeito é opcional ("Log the saves");
  - conferido no navegador (One-shot, 3 orcs de 1 DV): Hold Person 5 rodadas,
    salvamento contra magia 17 (guerreiro de nível 1 na Tabela 46), "Roll the
    rest" → um salvou e dois falharam; só os dois receberam "Hold Person 5"; o
    log ganhou a linha do salvamento e a do efeito; encontro de teste apagado.
    O valor lido da ficha está nos testes (o One-shot não tem personagens do
    App); testes: 222 (1 novo).
- 2026-10-14, CT9 feita (web v0.85.0; decisões do usuário: o +10% do
  atributo principal entra automático, editável; lançar também a partir do
  encontro encerrado):
  - `src/rules/xpToSheets.ts` (com testes): `primeBonus` (16+ em todos os
    atributos principais da classe, pela lista do relatório de sessão; em
    multiclasse não entra automático, a regra é por classe), `xpLines` (a
    parte de cada membro do prêmio; sem ficha no App = dar à mão) e o registro
    `xpApplied` no encontro (campo opcional novo), contra lançar duas vezes;
  - `addExperience` em `src/lib/roster.ts`: lê a ficha com a versão e grava
    o "Total XPs" somado (contrato de sempre; o mestre pode pela Fase 2b);
  - janela **Add XP to the sheets** (`src/components/CombatXp.tsx`): uma
    linha por personagem do App (parte, bônus, valor editável, caixa para
    tirar), os sem App listados para dar à mão; lançado, mostra o que foi e
    quando. No fim do encontro, "End and add XP to the sheets…" (só quando
    alguém do App divide o XP) abre a janela e, ao fechar, segue para DM
    Tools; no encontro encerrado, o botão "Add XP to the sheets" / "XP added
    to the sheets". O log ganha "XP to the sheets: …";
  - conferido no navegador (campanha "Teste W3.1b B"; o Kelmonito, real, foi
    tirado do encontro antes): orc de 15 XP para 4 PCs de teste, 3 cada; a
    linha do Teste MC mostrou "multiclass: no automatic bonus"; lançado só no
    Teste W3.1b: a ficha foi de 0 para 3 XP, o encontro mostrou "XP added to
    the sheets" com o registro; a ficha voltou a 0 à mão, o encontro de teste
    foi apagado e a campanha ativa voltou ao One-shot; testes: 224 (2 novos).
- 2026-10-14, Combat Tracker ao vivo aprovado (decisões do usuário: estado dos
  inimigos em palavras, sem PV — unhurt, wounded até a metade, badly wounded
  abaixo, down, dead; a reação não vai para os jogadores, a distância sim;
  entregas L1, L2 e L3). O encontro tem segredos no JSON e a RLS não filtra
  campos: o app do mestre publica uma vista filtrada em `encounter_view`.
- 2026-10-14, L1 feita (backend `20261014210000_combate_ao_vivo_l1_vista_dos_jogadores.sql`,
  12 verificações pgTAP): `encounter_view`, uma linha por encontro, escrita só
  por `publish_encounter_view` / `unpublish_encounter_view` (o dono do encontro,
  de campanha dele); os membros leem; no Realtime.
- 2026-10-14, L2 feita (web v0.86.0):
  - `src/rules/playerView.ts` (com testes, inclusive um que procura cada
    segredo no JSON — notas, CA, THAC0, moral, XP, reação, log, os escondidos):
    nome, rodada, a ordem da rodada (lados ou nomes; o passo de agora), lados
    surpresos, distância e os combatentes: PV só do grupo, os outros em
    palavras (`woundsOf`), condições com as rodadas, quem age;
  - campos opcionais novos: `Encounter.sharedWithPlayers` e
    `Combatant.hidden`;
  - `src/lib/encounterView.ts`: ao abrir, lê o que a conta já publicou na
    campanha ativa; publica só o que mudou, 1 s depois da última mudança, e
    tira o que deixou de ser compartilhado (desligado, encerrado, apagado);
    erro tenta de novo em 5 s e aparece na tela. Encontros compartilhados de
    outra campanha continuam publicados até o mestre voltar a ela;
  - no topo do encontro de campanha, "Show to players" / "◉ Shown to
    players"; com ele ligado, cada combatente ganha "hide" / "hidden";
  - conferido no navegador (campanha "Teste W3.1b B", o Kelmonito, real,
    tirado do encontro antes; lendo `encounter_view` pelo cliente do app):
    ligar publicou só o grupo; o orc entrou como "unhurt" sem PV; "hide" o
    tirou da vista; desligar e apagar o encontro tiraram a linha; a campanha
    ativa voltou ao One-shot; testes: 228 (4 novos).
- 2026-10-14, L3 feita (web v0.87.0); com ela o Combat Tracker ao vivo fica
  completo (só ver; interagir está no backlog):
  - `useLiveEncounters` em `src/lib/encounterView.ts`: as vistas da campanha,
    relidas a cada aviso do Realtime; o DELETE (o mestre tirou a vista) não
    passa pelo filtro de coluna, então há uma assinatura sem filtro só para
    ele (o aviso traz só o id; a página relê). `subscribeRows` aceita filtro
    vazio;
  - na página da campanha, o cartão **Combat · live** (encontro e rodada)
    enquanto houver vista; "Follow the combat" (jogador) ou "See what the
    players see" (mestre, que também é membro);
  - tela `/campaigns/:id/combat` (`src/pages/LiveCombat.tsx`): rodada, quem
    age e a ordem, surpresa, distância e os lados: PV do grupo, inimigos em
    palavras, condições com as rodadas; vista de formato mais novo pede para
    recarregar;
  - conferido no navegador (campanha "Teste W3.1b B", Kelmonito tirado do
    encontro antes, duas abas): o cartão apareceu, a tela mostrou o grupo com
    PV e o orc "Unhurt"; 50 de dano no tracker → "Orc Dead" na outra aba sem
    recarregar; "Show to players" desligado → a outra aba mostrou "No combat
    is being shown right now"; encontro apagado, nenhuma vista sobrando,
    campanha ativa de volta ao One-shot.
- 2026-10-15, Combat Tracker interativo aprovado (decisões do usuário: nos
  dois sentidos, quem recebe aceita antes de valer; o jogador escolhe nas
  Settings se aceita sozinho o que o mestre manda). Entregas I1 (backend), I2
  (mestre manda, jogador aceita) e I3 (jogador manda, mestre aceita).
- 2026-10-15, I1 feita (backend `20261015120000_combate_interativo_i1_mensagens.sql`,
  16 verificações pgTAP; `20261015150000_aceitar_mudancas_do_mestre.sql`, +1):
  `combat_message` (campanha, encontro, personagem, `direction` to_dm/to_player,
  `kind` + `payload` genéricos, `status` pending/accepted/declined/withdrawn); só
  se escreve pelas funções `send_to_dm` (quem fala pelo personagem — dono ou
  acesso temporário —, só com o encontro mostrado aos jogadores), `send_to_player`
  (o mestre do encontro), `resolve_combat_message` (quem recebe) e
  `withdraw_combat_message` (quem mandou, enquanto pendente); até 20 pendentes por
  personagem; no Realtime. `user_preferences.accept_dm_changes` (padrão falso).
- 2026-10-15, I2 feita (web v0.88.0; só os PV, dano e cura):
  - `src/rules/dmChanges.ts` (com testes): `applyHpDelta` (a cura não passa do
    máximo), `hpChangesToSend` (os PCs do App nos encontros compartilhados cujo
    PV mudou desde o último envio; a primeira leitura só entra na base, sem
    mandar);
  - `src/lib/combatMessages.ts`: `useHpChangeSender` no Combat Tracker (manda
    2 s depois da última edição; falha volta à base, para tentar de no), `sendToPlayer`,
    `resolveMessage`, `acceptDmChange` (grava a ficha e marca a mensagem),
    `fetchDmChanges` (pendentes e aceitas nas últimas 12h), `DmChangesInbox`
    (montado no App: com a preferência ligada, aceita sozinho as pendentes dos
    personagens da conta, inclusive as que chegaram com o app fechado);
  - Settings: "Changes from the DM" — Accept automatically / Ask me each time;
  - na ficha, `src/components/DmChangesNote.tsx`: pendente em vermelho com
    Accept/Decline (só quem fala pelo personagem responde); aceita (sozinha ou
    não) em dourado até o jogador dar OK (guardado no aparelho);
  - conferido no navegador (campanha "Teste W3.1b B", Kelmonito tirado do
    encontro antes), as duas preferências: "Ask me each time" — dano de 4 virou
    pendente, Accept levou ao PV 2; "Accept automatically" — dano de 3 entrou
    sozinho (PV 3), com o destaque na ficha. Encontro de teste apagado, PV e
    preferência devolvidos, campanha ativa de volta ao One-shot; testes: 230 (2 novos).
