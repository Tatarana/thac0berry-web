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
| CT4 | Tabelas rápidas: painel com as tabelas de combate (35, 36, 40/41, 44, 46, 47, 49/50, 51, 57, 58, 59), com Roll e favoritas | a fazer |
| CT5 | Ideias (decidir na vez): surpresa, distância e reação, "acerta?", salvamentos de monstro, efeitos com duração, XP no fim, log | a decidir |

## Backlog

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
