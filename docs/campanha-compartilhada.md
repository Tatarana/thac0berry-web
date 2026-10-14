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
| F2b | O jogador põe a ficha na campanha do mestre; o mestre lê e edita a ficha completa e as folhas de magia; elenco da campanha com o dono de cada ficha | feita (web v0.75.0; backend `20261013180000`) |
| F2c | Resumo do grupo (nome, classe, nível, PV) para os jogadores; acesso temporário (`character_grant`, 24 h ou até revogar) | feita (web v0.76.0; backend `20261013210000`) — **Fase 2 concluída** |
| R1 | Fase 3: ficha ao vivo — a ficha aberta e as folhas de magia se atualizam quando outra pessoa ou outro aparelho grava | feita (web v0.77.0; backend `20261014120000`) |
| R2 | Fase 3: página da campanha ao vivo — elenco, grupo (PV), sessões e jogadores, por um "pulso" da campanha | a fazer |

## Backlog

- Fase 3: o Combat Tracker ao vivo (os encontros são só do mestre e já sincronizam
  ao voltar para a aba); o aviso de "atualizado" com o nome de quem gravou.

- Dados de teste da F2b: a ficha "Teste F2b" ficou no Sandbox da segunda conta
  Google do usuário (a jogadora de teste), depois de removida da campanha.
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
- 2026-10-13, F2b feita (web v0.75.0; backend `20261013180000_fase2b_fichas_na_campanha.sql`,
  17 verificações pgTAP):
  - **backend:** o dono põe a ficha numa campanha de que é membro; o mestre lê e
    edita a ficha e as folhas de magia; só o dono apaga ou tira da campanha e
    ninguém troca o dono (`character_guard`); a folha criada pelo mestre fica no
    nome do dono da ficha; retrato e tinta seguem a ficha (também no Storage); o
    caderno continua só do autor;
  - **página da campanha:** o elenco do mestre mostra as fichas dos jogadores com
    "played by <nome>" e sem o "⋯" (apagar, mover, clonar ficam com o dono); o
    jogador tem "Your characters here", com "New character" e "Add from Sandbox";
    remover um jogador recarrega o elenco (a ficha dele sai junto);
  - **Assign to campaign** inclui as campanhas em que a conta joga; a lista de
    personagens e a contagem da tela inicial mostram só as fichas da conta;
  - o "+ PC" do Combat Tracker lista as fichas dos jogadores sem mudar o código
    (é a consulta "fichas da campanha");
  - conferido no navegador com duas contas: a jogadora entra, não vê as fichas do
    mestre, cria "Teste F2b" na campanha; o mestre a vê no elenco ("played by a
    player": a conta de teste não tem nome padrão), abre e edita (Place of Origin;
    versão 3, sem conflito, `updated_by` = mestre, dona inalterada), ela aparece na
    consulta do "+ PC"; o mestre remove a jogadora e a ficha deixa a campanha.
    Corrigido no teste: o elenco não recarregava depois de remover um jogador.
- 2026-10-13, F2c feita (web v0.76.0; backend `20261013210000_fase2c_grupo_e_acesso_temporario.sql`,
  18 verificações pgTAP). Com ela, a **Fase 2 está concluída**:
  - **backend:** `campaign_party(campanha)` (só membros): de cada ficha da campanha,
    quem joga, nome, classe, nível, estado, PV e se a conta pode abrir a ficha;
    `character_grant` com `grant_character_access` (só o mestre, para outro
    jogador da campanha, de 1 a 168 h, padrão 24 h) e `revoke_character_access`
    (o mestre, ou quem recebeu devolvendo); o acesso cai ao expirar, ser revogado
    ou o jogador sair; com ele, lê e edita a ficha e as folhas, sem apagar nem
    tirar da campanha;
  - **web, cartão Party** (`src/components/CampaignParty.tsx`): todos veem as
    fichas da campanha com classe, nível, PV e "played by" (you / o nome / the
    DM); só as que a conta pode abrir têm link; o mestre tem "Lend 24 h to…" nas
    fichas dos jogadores (com mais de um jogador na campanha) e o acesso ativo com
    "Revoke"; quem recebeu vê "You can edit until …" e "Give back";
  - conferido no navegador com duas contas: o mestre vê o grupo; a jogadora vê as
    fichas do mestre só como resumo (sem link, "played by the DM") e a dela com
    link; abrir a ficha do mestre pelo endereço é recusado; ao sair, a ficha
    dela volta ao Sandbox. **O empréstimo não foi testado no navegador** (precisa
    de dois jogadores além do mestre, e o usuário tem duas contas): fica coberto
    pelos testes do banco (dar, editar, não apagar, devolver, expirar, cair ao sair).
- 2026-10-14: Fase 3 (tempo real) aprovada. Decisões do usuário: R1 (ficha) e
  depois R2 (campanha), o Combat Tracker fica para depois; mudança de fora sem
  edição pendente entra na hora com um aviso; com edição pendente, a daqui é
  gravada por cima e o conflito é avisado como sempre; o aviso não diz quem gravou.
- 2026-10-14, R1 feita (web v0.77.0; backend `20261014120000_fase3_r1_ficha_ao_vivo.sql`):
  - **backend:** `character` e `spell_sheet` na publicação `supabase_realtime`
    (o Realtime respeita o RLS: cada um só é avisado das fichas que já pode ler);
  - **web:** `src/lib/realtime.ts` (`subscribeRows`, filtro por uuid em
    minúsculas); `useCharacterDoc` e `useSpellSheets` assinam a ficha e as
    folhas do personagem; o eco da própria gravação (versão já conhecida) é
    ignorado; sem edição pendente, relê a linha e mostra "Updated on another
    device just now" (`.remote-note`); com edição pendente, não mexe;
  - conferido no navegador com a mesma ficha de teste ("Teste MC") em duas abas:
    a edição numa aparece na outra com o aviso, sem conflito, nos dois sentidos;
    a aba que gravou não mostra aviso. O caso "edição pendente quando chega o
    aviso" (janela de 1 s) não foi reproduzido no navegador.
