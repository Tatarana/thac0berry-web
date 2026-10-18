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
