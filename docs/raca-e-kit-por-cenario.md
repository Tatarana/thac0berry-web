# Raça, classe e kit de cenário: aviso, não bloqueio

Plano e log de como o app trata raça, classe e kit que pertencem a um cenário
específico (Planescape, Ravenloft) quando a campanha do personagem não tem
esse cenário ligado. Converse com o usuário em português; texto de interface
em inglês.

## Origem (2026-10-17)

Testando a raça Half-Vistani (Domains of Dread), o usuário achou que ela
não aparecia no seletor. Investigando: a raça nunca tinha sido implementada
(só citada em comentário), e o motivo mais amplo era que **o app escondia**
raças planares (Planescape) e as classes de Ravenloft (Anchorite, Gypsy) do
seletor sempre que a campanha do personagem não tinha o cenário ligado —
inclusive fora de qualquer campanha (Sandbox).

**Decisão do usuário:** isso estava errado. Os seletores devem **sempre**
mostrar tudo, porque o mestre pode montar uma campanha que mistura mundos.
A campanha nunca trava a escolha — só avisa. E foi pedido um motor **geral**
(não só para raça) que roda ao mudar um personagem de campanha, avisando sem
bloquear.

## O que mudou

- **Half-Vistani** (Domains of Dread) virou uma raça do app: INT +1, WIS +1,
  CHA −2 (sem faixa mínima/máxima — o livro só dá o ajuste fixo), sem limite
  de nível em nenhuma classe ("Although human in body…"), movimento 12",
  habilidades especiais da raça em texto (identificar plantas/água como
  druida, acender fogo, ler *tralaks*, a fragilidade da lua cheia). As
  "tribos" de Vistani (Tabela 68: Kamii, Equaar, Vatraska, Naiat, Corvara,
  Canjar, Zarovan — perícias de graça, restrição de classe por tribo, a
  iniciativa especial do Zarovan) ficaram de fora: é do tamanho de um sistema
  de kit por raça, backlog à parte.
- **Os seletores de raça, classe e kit sempre mostram tudo** (`allRaces` em
  vez de `racesForCampaign`; `classOptions` já inclui `ravenloftClasses`;
  `kitsAllowedFor` sem o filtro de cenário). O que muda não é mais escondido:
  `raceWarnings`, `ravenloftWarnings` e `kitWarnings` ganham a nota (3º
  argumento `campaignSettings`, opcional) e a mostram como as fichas já
  mostravam avisos de atributo fora da faixa — a raça entra pela mesma tela
  "doesn't fit… choose anyway" que já existia.
- **O motor novo** (`src/rules/settingFit.ts`, `settingFitNotes`): junta as
  três checagens (raça, classe, kit) numa nota curta por descompasso, usada
  ao mudar um personagem de campanha — "Move to…" (`CharacterActions.tsx`) e
  "Add from Sandbox" (`CampaignDetail.tsx`) — listando, ao lado de cada
  campanha candidata, o que não bateria por padrão. Só texto, sem tela de
  confirmação extra: o clique continua movendo na hora.

## Pendências para o futuro

- Tribos de Vistani (Tabela 68 do Domains of Dread): perícias de graça,
  restrição de classe por tribo, a iniciativa especial do Zarovan.

## Log

- 2026-10-17, feita (web v0.90.0; backend sem mudança): Half-Vistani como
  raça; `allRaces` sempre no seletor (Planescape e Ravenloft); classes e
  kits de cenário sempre no seletor; `settingFit.ts` e a nota ao mudar de
  campanha. Testes: `tests/raceKit.test.ts`, `tests/ravenloft.test.ts`,
  `tests/settingFit.test.ts`. Conferido no navegador: personagem de teste no
  Sandbox com classe Gypsy — a raça Half-Vistani aparece sempre, com o grupo
  "Ravenloft · Domains of Dread"; escolhida sem Ravenloft na campanha, mostra
  a tela "doesn't fit… choose anyway" com o aviso certo, e aplica INT/WIS/CHA
  certos ao confirmar; "Move to…" mostrou a nota em toda campanha sem
  Ravenloft ligado ("Dráculino", que tem, ficou sem nota). Personagem de
  teste apagado depois.
