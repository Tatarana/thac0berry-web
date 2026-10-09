# Combat Tracker: plano e log

Ferramenta do DM (hub DM Tools, só no modo DM, `/dm/combat`) para conduzir o
combate na mesa: combatentes, iniciativa, moral e tabelas à mão. Log do
trabalho: decisões, entregas e pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-09)

1. **Onde guardar**: no aparelho (localStorage) agora. No Supabase (todos os
   aparelhos, parte da sessão da campanha) vai para o backlog.
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

## Backlog

- CT5 sem prioridade: distância e reação (Tabelas 58/59 já estão na faixa de
  tabelas) e efeitos com duração em vários combatentes de uma vez.
- Lançar o XP do fim do encontro nas fichas do App.

- Guardar os encontros no Supabase (todos os aparelhos; ligado à sessão da
  campanha): tabela nova e mudança no documento de sync do backend.
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
