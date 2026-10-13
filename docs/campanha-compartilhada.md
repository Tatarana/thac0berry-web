# Campanha compartilhada (Fase 2 do backend): plano e log

Mestre e jogadores na mesma campanha, cada um com a sua conta. O desenho é o do
`thac0berry-backend/docs/modelo-de-dados-e-sync.md` (§3, §4, §8 e §9, aprovado em
2026-10-05); aqui fica o lado da web. Log do trabalho: decisões, entregas e
pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-13)

1. **Três entregas:** F2a (entrar na campanha), F2b (o mestre vê e edita as fichas
   dos jogadores), F2c (grupo e acesso temporário).
2. **Convite:** um código ativo por campanha, sem prazo, válido até o mestre revogar
   ou trocar, usável por vários jogadores. O mestre gera um aleatório (6 caracteres
   sem 0/O e 1/I) **ou escolhe o dele** (uma "senha" comum do grupo: 4 a 24 letras
   sem acento, algarismos e hífen; único entre todas as campanhas; sem diferenciar
   maiúsculas).
3. **Jogador que sai ou é removido, e campanha apagada:** as fichas dos jogadores
   continuam deles e voltam ao Sandbox.
4. **O mestre edita a ficha do jogador** como se fosse o dono; gravações ao mesmo
   tempo seguem o aviso de conflito de sempre (F2b).
5. **Na campanha entram só as fichas que o jogador puser nela**; entrar na campanha
   não leva fichas (F2b).
6. **Sessões:** todos os membros veem e criam; só quem criou, ou o mestre, edita,
   fecha e apaga ("ninguém pode apagar ou fechar o que foi criado por outra pessoa").

## Entregas

| # | Entrega | Estado |
|---|---|---|
| F2a | Membros e convite: gerar, escolher, copiar e revogar o código; entrar com o código; ver o grupo; sair; o mestre remove; a campanha do jogador só para leitura; sessões só de quem criou ou do mestre | feita (web v0.74.0; backend `20261013120000` e `20261013150000`) |
| F2b | O jogador põe a ficha na campanha do mestre; o mestre lê e edita a ficha completa e as folhas de magia; elenco da campanha com o dono de cada ficha | a fazer |
| F2c | Resumo do grupo (nome, classe, nível, PV) para os jogadores; acesso temporário (`character_grant`, 24 h ou até revogar) | a fazer |

## Backlog

- Login: o Google entra direto com a conta já conectada no navegador, sem mostrar a
  lista de contas (para trocar de conta, sair do Google em
  `accounts.google.com/Logout`). Opção: pedir sempre a lista (`prompt:
  select_account` no `signInWithOAuth`), ao custo de um clique a mais em todo login.

## Log

- 2026-10-13: plano aprovado (decisões 1 a 5); a decisão 6 veio no teste da F2a.
- 2026-10-13, F2a feita (web v0.74.0; backend `20261013120000_fase2a_membros_e_convites.sql`
  e `20261013150000_sessao_so_quem_criou.sql`, com 29 verificações pgTAP):
  - **Campaigns:** "Campaigns you play in" (as campanhas de outros mestres em que a
    conta entrou) e "Join a campaign" (o código; o nome que o grupo vê é o "nome
    padrão do jogador" de Settings);
  - **página da campanha, cartão Players:** o mestre vê o código, copia, gera um
    aleatório, escolhe o dele (com a regra na tela), revoga e remove jogadores; o
    jogador vê o grupo e tem "Leave campaign"; para o jogador, nome, data, notas e
    cenários são só leitura, sem Archive, "Run this campaign", elenco nem Delete;
  - **sessões:** de quem não criou (e não é o mestre), título e resumo só leitura e
    sem Close/Delete;
  - **lugares do mestre** (campanha ativa, Combat Tracker, mover ficha, contagem na
    tela inicial, grupos da lista de personagens): só as campanhas que a conta mestra;
  - `src/rules/invites.ts` (código e mensagens dos erros do banco, com testes),
    `src/lib/campaignMembers.ts` (as funções do banco), `src/components/CampaignPlayers.tsx`;
  - conferido no navegador com duas contas: código aleatório e escolhido (o inválido
    avisa e desativa o botão), código errado, entrar em minúsculas, a campanha só
    leitura, fora da escolha de campanha do DM do jogador, sair, entrar de novo, o
    mestre vê e remove o jogador, revogar. Corrigido no teste: "You (you)" → "You".
