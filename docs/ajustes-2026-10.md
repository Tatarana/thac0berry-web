# Ajustes de 2026-10-10

Oito ajustes pedidos pelo usuário, priorizados antes da GT4 (decisão 4).
Log do trabalho: decisões, entregas e pendências. Atualizar a cada entrega.

## Pedidos

1. Settings: papel padrão do caderno (o campo já existe em `user_preferences`).
2. Settings: nome/apelido padrão do jogador, gravado nos personagens novos.
3. Contador de riscos igual em todo o app: sem botões − e + (TallyBoard).
4. Regeneração (Banked Heal): janela flutuante na ficha quando dispara (dano ou
   "Activate now").
5. Trocar a classe tira o kit.
6. Grimório e folhas de magia para quem não é mago/sacerdote (kits como o
   Shinobi Mage).
7. A CA não considera o ajuste de DEX.
8. PV temporários refletidos na ficha (38/38 + 10 temporários = 48/38).

## Decisões do usuário (2026-10-10)

1. CA: a caixa ARMOR passa a ser a CA da armadura (armadura, escudo, mágicos);
   o escudo mostra a CA final com o ajuste de DEX ("Armor 5 · DEX −2"). Fichas
   com a DEX já somada: o app avisa uma vez para o jogador ajustar.
2. Conjuração por kit: os slots ficam à mão (o jogador marca por círculo).
3. Nome do jogador: só nos personagens novos.
4. Estes oito antes da GT4.
5. (Do plano) A troca de classe dupla mantém o kit (CFH, CTH, CPrH); só a troca
   livre pelo seletor do cabeçalho tira.

## Entregas

| # | Entrega | Itens | Estado |
|---|---|---|---|
| U1 | Correções rápidas | 5, 8, 3 | feita (web v0.55.1; teste na tela com o usuário) |
| U2 | Settings | 1, 2 (migração no backend) | feita (web v0.55.2; falta o `db push` e o teste na tela) |
| U3 | Janela da regeneração | 4 | feita (web v0.55.3; teste na tela com o usuário) |
| U4 | CA com DEX | 7 | feita (web v0.55.4; teste na tela com o usuário) |
| U5 | Conjuração por kit | 6 (extensão "web primeiro" no schema) | planejada |

## Log

- 2026-10-10: plano aprovado. Início da U1.
  - item 5: `changeClass` (seletor do cabeçalho) = `setClass` + tira o kit;
    `dualClassSwitch` continua usando `setClass` (mantém o kit);
  - item 8: a regra já somava os PV temporários aos atuais ao criar o efeito
    (teste: 38/38 + 10 = 48/38); não reproduzido por código — falta ver o caso
    do usuário na tela. A ficha agora mostra "+10 temp" ao lado dos PV;
  - item 3: os contadores com − e + (efeitos: Stone Skin e regeneração, e a
    lista de ataques negados; folha de magia: Turn Undead, cargas de item,
    conjurações das magias adicionais) passam a usar o TallyBoard (a caixa
    soma, o risco tira), que ganhou `max`;
  - de passagem: `npm run data` quebrava no Node 22.16 deste PC (o
    `build-data.mjs` importa `src/rules/books.ts`); o script passa
    `--experimental-strip-types`, como os testes (o CI usa um Node 22 mais novo).
- 2026-10-10, U2 feita (web v0.55.2; backend `ce175e9`):
  - backend: coluna `user_preferences.default_player_name` (migração
    `20261010120000_nome_do_jogador.sql`, teste pgTAP `04_preferencias`, CI
    verde); **o usuário precisa rodar `npx supabase db push`** na pasta do
    backend;
  - web: Settings → card "Preferences" (só logado): nome do jogador (grava ao
    sair do campo) e papel padrão do caderno (Plain/Lined/Grid, grava ao
    tocar); `src/lib/preferences.ts` lê com `*` (não quebra antes do db push) e
    grava pelo contrato (INSERT ou UPDATE com `version`);
  - personagem novo (`createCharacter`) recebe o nome padrão no campo Player;
    clonar e importar não mudam.
- 2026-10-10, U3 feita (web v0.55.3):
  - `activeRegenerations` (effects.ts): Banked Heal já disparado e com cura
    sobrando;
  - `RegenerationFloat`: janela no canto inferior direito, em qualquer página da
    ficha; aparece sozinha quando a regeneração dispara (dano registrado ou
    "Activate now" nos efeitos); contador de riscos (+1 PV por rodada, até o
    total), "minimize" vira uma pílula "✚ 3/10 HP", e uma regeneração nova
    reabre; some quando a cura acaba;
  - teste: dispara com o dano, cura e some (175 testes).
- 2026-10-10, U4 feita (web v0.55.4):
  - `dexDefenseAdjustment` e `finalArmorClass` (rules.ts): ajuste da linha da
    DEX na ficha (acompanha efeitos), ou da Tabela 2 pelo valor da DEX;
  - ficha: o escudo mostra a CA final; embaixo, "Armor [5] · DEX −2" (a caixa
    editável é a da armadura; os efeitos de CA continuam mexendo nela);
  - aviso uma vez por personagem (por aparelho, `thac0berry.acDexReviewed.<id>`
    no localStorage), só quando o ajuste não é 0: "It already included
    Dexterity — set Armor to N" (tira a DEX da caixa) ou "It was armor only";
  - Combat Tracker: o PC entra com a CA final (e a lista de PCs mostra ela);
  - testes: 177;
  - **pendente no iPad**: lá a caixa ainda é a CA final; quando o iPad voltar, a
    ficha dele precisa somar a DEX do mesmo jeito (mesmo campo `armorClass`).
