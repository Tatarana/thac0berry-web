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
  personagens fixados), **Session Notes** (edita o campo `notes` da própria
  campanha, não um campo novo) e **Cast & NPCs** (o elenco da campanha; não há
  entidade de NPC separada no app, então é a mesma lista de personagens).
- Entrada: novo card "Shield" em DM Tools, desabilitado sem campanha ativa de
  verdade (`/dm/shield`; precisa de `campaign.pinned_items`, `notes` e elenco,
  que não existem no One-shot).

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
