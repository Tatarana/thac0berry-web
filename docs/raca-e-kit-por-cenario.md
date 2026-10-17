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

(nenhuma no momento)

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
- 2026-10-17, tribos de Vistani feitas (web v0.91.0; schema
  `thac0berry-data` — `vistaniTribe`, feito primeiro na web):
  - `src/rules/vistani.ts` (com testes): as 7 tribos da Tabela 68 (Kamii,
    Equaar, Vatraska, Naiat, Corvara, Canjar, Zarovan), a faixa de cada uma
    no 1d100 ("00" vale 100, como em qualquer d100 do app), as perícias de
    graça (nomes do compêndio) e o resto da regra (bônus de reação do Naiat,
    antídotos do Vatraska, as vagas de magia do Canjar, a iniciativa do
    Zarovan) em texto — nenhuma raça do app tem mecânica automática além de
    atributo e proficiência, e aqui segue igual; restrição de classe por
    tribo (Kamii nunca conjurador; Corvara só ladino/guerreiro/mago; Canjar e
    Zarovan só mago) é só aviso, nunca bloqueia;
  - campo novo `PlayerCharacter.vistaniTribe` (id da tribo; só faz sentido
    com a raça Half-Vistani);
  - na ficha, um seletor "Tribe" ao lado da Raça (só aparece com Half-Vistani
    escolhida), com "Roll 1d100" e as 7 tribos com o aviso de classe inline;
    escolher grava a tribo, soma as perícias de graça (como kit) e acrescenta
    o texto da tribo às habilidades raciais (sem apagar o texto da raça, como
    trocar de raça já não desfaz a anterior);
  - conferido no navegador: personagem de teste Gypsy, Half-Vistani; o
    seletor mostrou as 7 tribos com os avisos certos (Kamii, Corvara, Canjar
    e Zarovan, que não batem com Gypsy); escolhi Equaar (sem aviso) — a
    ficha gravou `vistaniTribe: "equaar"`, ganhou Animal Lore e Riding,
    Land-Based casadas com o compêndio, e o texto da tribo se somou ao da
    raça; a ficha mostrou "Half-Vistani / Equaar". Personagem de teste
    apagado depois; testes: 237 (2 novos).
