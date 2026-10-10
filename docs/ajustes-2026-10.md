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
| U2 | Settings | 1, 2 (migração no backend) | planejada |
| U3 | Janela da regeneração | 4 | planejada |
| U4 | CA com DEX | 7 | planejada |
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
