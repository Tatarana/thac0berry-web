# Criação de personagem guiada ("The Forge")

Plano e log de uma tela nova — um construtor de personagem passo a passo, separado da
ficha — para dar ao jogador uma experiência rica e visualmente bonita ao criar um
personagem novo, em vez de cair direto numa ficha em branco. Converse com o usuário em
português; texto de interface em inglês.

## Origem (2026-10-31)

Hoje "+ New character" (`src/pages/Characters.tsx`) cria um personagem em branco e abre
a ficha direto — tudo preenchido manualmente, aba por aba. O pedido foi uma experiência
guiada e "visualmente rica e prazerosa" para montar um personagem, aproveitando a
identidade visual que o app já tem (`index.css`: Ember — obsidiana/latão/Baskerville/
Caveat) de forma mais cinematográfica do que a ficha permite.

## Decisão

Um fluxo linear, tela cheia, por etapas — não mais uma aba da ficha — guardando um
`PlayerCharacter` rascunho em memória (nada grava no Supabase até o fim) e terminando na
ficha normal (`CharacterSheet`) para o que ainda não tem etapa própria. Reaproveita os
motores de regra já existentes (`src/rules/`) em vez de duplicar lógica; a ficha final
tem que ser indistinguível de uma criada e preenchida à mão.

### Etapas, na ordem

1. **Abilities** — rolar (3d6 em ordem; 4d6, descarta o menor, organiza como quiser) ou
   digitar os seis atributos. Motor: `rules/dice.ts`.
2. **Name & Gender** — nome e gênero (masculino ou feminino, gravado em `sex`) logo
   aqui, porque alguns kits são exclusivos de um gênero e isso precisa valer no filtro
   da etapa 4.
3. **Race** — galeria de cards (PHB/Planescape/Ravenloft agrupados), com o aviso
   "doesn't fit this campaign, choose anyway" já existente (`settingFit.ts`) em vez de
   esconder opção. Escolher ajusta os atributos na hora (`raceKit.ts`).
4. **Class / Kit** — galeria igual, com humano de classe dupla e semi-humano
   multiclasse como ramo natural (`multiclass.ts`). Filtra/avisa por gênero quando o kit
   exigir (ver gap abaixo) do mesmo jeito não-bloqueante do aviso de cenário.
5. **Starting point** — nível OU XP inicial (um deriva o outro via `xpRequired`/
   `xpNeededForNextLevel` de `rules.ts`); padrão nível 1 / 0 XP, idêntico ao
   comportamento de hoje. Acima do nível 1: rolar ou usar média de HP por nível
   (`hitDieType`), depois UMA passada pelo motor de consequências
   (`consequences.ts`/`raiseExperienceToLevel`) para acertar THAC0, saves e slots de
   perícia — nunca um caminho de nível paralelo ao que a ficha já calcula.
6. **Proficiencies** — gasto de slots (perícia de arma/não-arma) contra o compêndio real,
   slots conforme o nível da etapa 5.
7. **Equipment** — ouro inicial (ver gap abaixo) gasto contra arma/armadura/equipamento
   do compêndio.
8. **Spells / Psionics / Thieving skills** — só para a classe escolhida, reaproveitando
   `WizardSpellbook`, `PsionicsPanel`, etc.
9. **Description** — alinhamento, divindade (reaproveita a galeria do Deity Compendium),
   detalhes físicos, retrato.
10. **Reveal** — as páginas da ficha se montam em sequência; o personagem é criado de
    verdade e o jogador cai na `CharacterSheet` normal.

### Transversais

- **Ajuda sempre à mão**: o botão "?" que a ficha já usa (`RuleLink`) em cada etapa —
  regra de verdade quando existe, texto explicativo nos passos de sabor (gênero,
  divindade: "sem efeito mecânico — é só quem ele é").
- **Retrato**: um quadro vazio com moldura de latão aparece no painel de prévia (a ficha
  se montando ao lado, atualizada a cada etapa) desde a etapa 1, não só quando a
  Description chega nele. Upload é o mesmo da ficha hoje; de onde mais a imagem pode vir
  (banco de retratos, geração) fica para depois, de propósito.
- **Progresso**: trilha de contas de latão (como `PageBeads`), uma por etapa.

### Regras de design (obrigatórias — o usuário reprovou telas que as quebravam)

1. **Nada com cara de formulário.** Sem caixas de texto rotuladas em coluna,
   grades de cartões simples ou painéis laterais de campos. Cada etapa é uma
   tela de criação de personagem de jogo: composição central, objetos
   grandes e táteis (gemas-dado, medalhões, faixas, pergaminhos), movimento.
2. **Imagens, não ícones de linha — e personagens vivos.** Gênero, raça,
   classe e retrato são ilustrações de personagens vivos no seu mundo, no
   estilo de `public/images/mode_player.jpg` (traço a nanquim, aquarela, luz
   quente, expressivo). Nunca medalhões de latão, moedas ou relevos — esses
   são só os ícones das seções do app. Faltou arte: pedir ao usuário (ele
   produz) com o prompt exato, em vez de improvisar glifos.
3. **Dados simbólicos > texto explicativo** (gemas, estrelas, dados, selos).
4. **Padrões idênticos entre etapas.** Rodapé Back/Next, trilha de etapas,
   título e divisor são um componente só, usado igual em todas (no
   protótipo, `<dc-import>`; no app, um componente React). Mesmos estados
   de desabilitado/pronto em todas.
5. **Fidelidade ao protótipo aprovado.** Antes de dar por pronto, comparar
   app e protótipo lado a lado no navegador, item por item.
6. **Regras de AD&D 2e:** gênero é masculino ou feminino (duas opções, nunca
   texto livre); os seis números são "Ability Scores".

### Gaps no `thac0berry-data` (bloqueiam partes das etapas 4 e 7)

- Nenhum kit tem campo de restrição de gênero hoje (`kits.ts`/`raceKit.ts` conferidos,
  2026-10-31) — sem ele, a etapa 4 não tem o que avisar.
- Não existe tabela de dinheiro inicial por classe (nem o multiplicador por nível
  inicial, DMG) — sem ela, a etapa 7 não tem quanto ouro oferecer.

Essas duas entram como trabalho de dados antes das etapas que dependem delas (4 parcial,
7 completa); o resto de cada etapa não depende delas.

## Faseamento (uma entrega por vez)

- **B1** — Abilities + Name & Gender + Race + Class/Kit + Starting point. Ao final,
  cria o personagem (nível/XP/HP/THAC0/saves já corretos) e abre a `CharacterSheet`
  normal para o resto (perícias, equipamento, magias, descrição) — exatamente como hoje,
  só que chegando lá com mais coisa pronta.
- **B2** — Proficiencies + Equipment (inclui a tabela de ouro inicial por nível/classe).
- **B3** — Spellcasting/Psionics/Thieving skills.
- **B4** — Description completa (divindade, retrato) + passe de animação/polimento.

Entrada: um botão novo "Build a character" ao lado do "+ New character" existente em
`Characters.tsx` — aditivo, não substitui a criação em branco.

## Decisões assumidas (sem confirmação explícita do usuário ainda — revisar se ele redirecionar)

- O construtor **coexiste** com "+ New character" em vez de substituí-lo.
- Duas rotas de geração de atributos no v1 (3d6 em ordem; 4d6 descarta-o-menor,
  organiza livre), não uma lista maior.
- Multiclasse/classe dupla entram já no B1 (a etapa de Class/Kit já teria que suportar o
  ramo de qualquer forma).

## Pendências para o futuro

- Campo de restrição de gênero em kit (`thac0berry-data`).
- Tabela de dinheiro inicial por classe/nível (`thac0berry-data`).
- Como obter o retrato além de upload manual (banco de imagens? geração?) — decisão de
  produto, não só de dados.

## Log

- 2026-10-31: plano definido nesta conversa; B1 encomendado ao subagent
  `thac0berry-coder` (Sonnet, só este repo, nunca `thac0berry-ipad`).
- 2026-11-01: etapas 1 e 2 refeitas no visual do protótipo e publicadas
  (v0.116.0).
- 2026-11-01: etapas 3 a 6 no visual novo (ainda sem publicar, esperando a
  arte de raças e classes — `docs/forge-arte.md`). Raça: só as do sexo
  escolhido, imagem por gênero, troca sem acumular ajustes (`replaceRace`).
  Raça e classe: filtro pelos Campaign Settings (também nos kits e
  proficiências). Multiclasse com as ilustrações das classes. Nível/XP com
  multiclasse (XP dividido, PV somados e divididos). Etapa 6, Proficiencies:
  custo pela Tabela 37 (fora dos grupos da classe, +1 slot), bônus de raça e
  kit de graça e sincronizados com a escolha (`proficiencyCost.ts`), slots de
  arma e nonweapon como na ficha, especialização do Fighter. O personagem é
  criado ao fim da etapa 6. Próximas: magias (conjuradores) e equipamento.
- **Ajustes da etapa 6.** Armas agrupadas por proficiência (um arco é uma só,
  qualquer flecha; `weaponSlotsSpent`, também na ficha), em seções: de disparo,
  depois por tipo de dano (as de arremesso no seu tipo, com o alcance). Slots de
  arma do kit (`weaponProficiencySlots`) e armas exigidas/sugeridas pelo kit,
  lidas do texto. Bônus nonweapon do kit lidas do texto quando
  `proficiencies.bonus` vem vazio (~80 kits; pendência do thac0berry-data).
  Descrição das nonweapon ("about") com o `ProficiencyDetail` do compêndio.
- **Etapas 6 e 7 separadas.** Weapon Proficiencies (6) e Nonweapon
  Proficiencies (7) viraram páginas da jornada, para não sair sem escolher as
  nonweapon; cada uma avisa os slots que sobraram. Armas num carrossel por grupo
  (`ForgeCarousel`, com a ilustração do grupo ao fundo; prompts em
  `docs/forge-arte.md`). `ForgeSlotSockets` passou para o `ForgeParts`.
- **Etapa 8, Psionic Powers (só psionicistas, também multiclasse).** Mapa
  mental, como o protótipo aprovado no canvas: a mente no centro com as seis
  disciplinas e os modos de defesa; ao abrir uma, os poderes em árvore radial
  (cada um um anel além do poder que exige; `src/lib/psionicMap.ts`). Regras
  do CPH, cap. 1, em `src/rules/psionics.ts` (`learnVerdict`): Tabela 4,
  devoções ≥ 2× ciências por disciplina, nenhuma disciplina iguala a primária,
  pré-requisitos de poder e de nível. Fontes: CPH sempre, The Will and the Way
  (ligado) e Dragon Magazine; Dragon Kings fora (Psionic Enhancements, 21º+).
  Grava no mesmo bloco `psionics` da aba Psionics da ficha.
- **Etapa 8, ajustes.** Total de PSPs (CPH Tabela 5) ao lado do retrato;
  filtro All powers / Sciences / Devotions; pré-requisitos com "&" e "and"
  viram vários e "X or Y" fica a critério do jogador. Dados (thac0berry-data):
  disciplina e tipo de 33 poderes corrigidos (Metapsionics de 11 para 31) e os
  pré-requisitos de Static Discharge (Magnetize) e Teleport Lock.
- **Etapa de magias (mago, bardo, clérigo, druida; também multiclasse).** Vem
  depois dos poderes psiônicos, como o protótipo "Step 9 · Spells" do canvas.
  Mago: escola (especialista: +15%/−15% e escolas opostas lacradas; adivinhação
  menor aberta a todos) e um dos três jeitos do DMG cap. 7 de encher o
  grimório, à escolha do jogador (3d4 com Read/Detect Magic e o presente da
  escola; 6 sem rolar; escolha livre rolando). Acima do 1º nível, o jogador
  escolhe: uma magia por nível ou até o máximo da Inteligência por círculo.
  Bardo: 1d4 magias a partir do 2º nível. Cada magia rola a chance de aprender
  (PHB Tabela 4) com d100 na mesa; a que falha fica trancada até o próximo
  nível. Dados animados em `ForgeDice` (arremesso, quiques, tombo em 3D,
  sombra, assentar com brilho; relógio de segurança se a aba pausar a
  animação). Sacerdote: constelação das esferas da classe, ajustável para
  sacerdote especialista (Tome of Magic opcional). Regras em
  `src/rules/spellbook.ts`; grava `wizardSchool`, `wizardSpellbook` e
  `sphereAccess`. Só magias genéricas e dos cenários escolhidos na etapa 3.
- **Paladino na etapa de magias.** Mesma constelação, com as quatro esferas do
  PHB cap. 3 (Combat, Divination, Healing, Protection), fixas. Magias de
  sacerdote só a partir do 9º nível, pela Tabela 17 (até o 4º nível de magia;
  nível de conjuração = nível − 8; sem bônus de Sabedoria). Grava
  `sphereAccess`. A tabela de slots da ficha ainda não dá slots ao paladino.
