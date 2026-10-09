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
| CT3 | Moral: 2d10 contra a moral, Tabela 50 em chips (PV perdido calculado), resultado e quando testar | a fazer |
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
