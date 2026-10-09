# Campanha ativa: plano e log

No modo DM, o App tem sempre **uma campanha ativa**: escolhida uma vez, vale
para tudo o que o DM faz até ele trocar. Log do trabalho: decisões, entregas e
pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-09)

Motivo (pedido do usuário): "não faz sentido o DM ficar o tempo todo escolhendo
a campanha daquele encontro… ele entraria no App, escolheria a campanha, e dali
tudo que fizesse seria para a campanha escolhida".

1. **Só no modo DM**, por enquanto. O modo Jogador continua como está.
2. **One-shot**: o DM pode jogar sem campanha ("One-shot (no campaign)").
3. **Guardada no aparelho** (`localStorage`, como o modo Jogador/Mestre): o iPad
   da mesa pode estar numa campanha e o celular em outra. Guardar na conta vai
   para o backlog (abaixo).

## Experiência

- Login → modo → no modo DM, **"Which campaign are you running?"** (lista das
  campanhas da conta, a atual marcada, as arquivadas recolhidas, mais o
  One-shot). Depois disso o App abre direto na campanha ativa.
- Chip da campanha no topo (Home e telas do DM, ao lado do modo): mostra a
  campanha e troca com um toque.
- Ferramentas do DM trabalham na campanha ativa (CA2, CA3).

## Entregas

| # | Entrega | Estado |
|---|---|---|
| CA1 | Campanha ativa: escolha (com One-shot), chip no topo para trocar, DM Tools com a campanha e atalhos, "Run this campaign" na campanha | feita (web v0.53.0) |
| CA2 | Combat Tracker preso à campanha ativa: só os encontros dela, sem escolher campanha no encontro novo nem no + PC, aviso ao trocar com encontro em andamento, levar os encontros antigos para a campanha | a fazer |
| CA3 | Filtros de cenário (Monsters, Table Grimoire, Rules) começando pelo "Campaign Settings" da campanha ativa | a fazer |

## Backlog

- **Campanha ativa na conta** (Supabase), para valer em todos os aparelhos do
  DM: hoje fica só no aparelho (decisão 3). Precisa de um lugar no backend (ex.:
  preferências do usuário) e entra no documento de sync do backend.
- Guardar os encontros do Combat Tracker no Supabase (já no backlog de
  `controle-de-combate.md`); com isso, a campanha ativa e os encontros dela
  passam a valer em qualquer aparelho.
- Campanha ativa no **modo Jogador** (ex.: abrir direto o personagem daquela
  campanha), se fizer sentido depois (decisão 1).

## Log

- 2026-10-09: proposta aprovada (decisões 1 a 3). Início da CA1.
- 2026-10-09, CA1 feita (web v0.53.0):
  - `src/lib/activeCampaign.ts`: campanha ativa no aparelho
    (`thac0berry.campaign`, `{ id, name }`; `id: null` = One-shot), como o
    modo; `useCheckedActiveCampaign` confere com as campanhas da conta (apagada
    → pede de novo; renomeada → atualiza o nome; sem login, não mexe);
  - `src/components/CampaignChooser.tsx`: "Which campaign are you running?"
    (campanhas da conta, arquivadas recolhidas, One-shot; sem login, só o
    One-shot), na Home e em qualquer tela do DM (`DmOnly`) enquanto não houver
    campanha ativa; chip "⚔ <campanha> ▾" no topo (Home, DM Tools, Monsters,
    Table Grimoire, Combat Tracker — só no modo DM) abre a troca;
  - DM Tools: cartão "Running <campanha>" com "Sessions & cast" e Combat
    Tracker; Home: o cartão DM Tools diz a campanha; página da campanha: "Run
    this campaign" (modo DM) ou "running";
  - conferido no navegador sem login (escolha do One-shot, chip, cartão, modo
    Jogador sem chip, celular sem rolagem). O Combat Tracker ainda escolhe a
    campanha no encontro (muda na CA2).
