# Ravenloft (GT4b): dados do Domains of Dread e classes jogáveis

Plano e log do primeiro cenário novo da GT4b (`docs/grimorio-de-tabelas.md`).
Converse com o usuário em português; texto de interface em inglês.

## Fonte

Só o dump da wiki AD&D 2e (`thac0berry-data-mining/dumps/adnd2e_pages_current.xml`).
Ele tem, do *Domains of Dread* (1997): as classes Anchorite, Arcanist, Avenger
e Gypsy, a raça Half-Vistani, a seção de perícias de ladrão do Gypsy (Tabelas
94–102) e duas transcrições feitas por fãs dos Fear/Horror/Madness Checks por
grupo de classe. **Não tem** as regras centrais do cenário (powers checks,
maldições, as Brumas, os domínios) nem tabelas roláveis além da Vistani Ancestry.

## Decisões do usuário (2026-10-10)

1. Ravenloft primeiro, um cenário por entrega (Planescape depois).
2. Livro novo `DoD` ("Domains of Dread"), cenário "Ravenloft".
3. **Anchorite e Gypsy jogáveis** em campanhas Ravenloft.
4. Esferas do Anchorite: a fonte cita a "Table 92" (esferas por alinhamento),
   que não está no dump → por enquanto, as esferas do Cleric, com aviso.
5. Pontos de perícia de ladrão do Gypsy por nível: a fonte não diz → por
   enquanto, os do Thief (60 no 1º nível + 30 por nível), com aviso.

6. A classe só aparece no seletor quando a campanha do personagem tem
   Ravenloft ligado (sem campanha ou sem cenário ligado: não aparece); se a
   campanha desligar Ravenloft depois, a classe fica, com aviso na ficha.
8. Magias do Gypsy (2026-10-12): lista de magias conhecidas (o grimório
   reaproveitado, com o título "Known Spells"), só da escola Divination; a
   folha de magia mostra as conhecidas no slot.
7. iPad: como o Psionicist, a classe é só da web por enquanto. O iPad lê
   classe desconhecida como Fighter (`CharacterClass.init(from:)`): o
   personagem abre lá como Fighter, e salvar no iPad gravaria Fighter.

## Entregas

| # | Entrega | Estado |
|---|---|---|
| R1 | Dados: 7 regras do DoD (4 classes, Half-Vistani, perícias do Gypsy, Fear/Horror/Madness Checks), 24 tabelas, livro e cenário em `books.json` | feita (thac0berry-data `gt4b/ravenloft-dod`) |
| R2 | Anchorite jogável: schema (gerador do iPad → thac0berry-data), XP, dados de vida, THAC0, saves, slots de magia, requisitos, raça, testes de medo na ficha | feita (web v0.59.0) |
| R3 | Gypsy jogável: o mesmo, mais perícias de ladrão, magias de adivinhação por dia (sem grimório, Tabela 104), Gypsy Lore (5%/nível), especialização em faca | feita (web v0.61.0) |

## O que a fonte dá para cada classe jogável

| | Anchorite (priest) | Gypsy (rogue) |
|---|---|---|
| Requisitos | WIS 12, CHA 15; só humano | CON/INT/WIS 13, CHA 15; humano, meio-elfo, Half-Vistani |
| Bônus de XP | WIS 16+ | DEX e CHA 16+ |
| XP, DV, THAC0 | tabela própria (d8; 9+2 depois do 9º) | tabela própria (d6; 10+2 depois do 10º), com slots de proficiência por nível |
| Saves | tabela própria (iguais às do priest) | iguais às do rogue (Tabela 94) |
| Magias | slots próprios, círculos 1–7 (6º com WIS 17, 7º com WIS 18) | Tabela 104: magias arcanas só de adivinhação, sem grimório, conjuração de 3 turnos |
| Outros | só armadura de metal (ou nenhuma); armas conforme o alinhamento (LG/LN: sem lâmina; N: lâmina com escudo) | sem armadura de metal nem escudo; só armas corpo a corpo de uma mão; Gypsy Lore; reação pior com não-ciganos; especialização em faca (+1/+2, sem ataque extra) |
| Medo/horror/loucura | tabela do priest | Tabela 95 |

## Pendências para o futuro

- **Tabela 92 do DoD** (esferas do Anchorite por alinhamento): não está no
  dump. Se aparecer (livro do usuário), trocar as esferas do Cleric pelas dela.
- **Pontos de perícia de ladrão do Gypsy por nível**: a fonte só dá as bases e
  os ajustes (Tabelas 97–100). Se aparecer a regra, trocar a do Thief.
- **Regras centrais de Ravenloft** (powers checks, maldições, o texto dos
  testes de medo/horror/loucura): não estão no dump.
- **Turn Undead do Anchorite**: a página da wiki é um esboço e não fala de
  expulsar mortos-vivos; a web não dá o poder (sem tabela na página 4 nem
  contador na folha de magia). Conferir no livro.
- **Fora do Ravenloft, achado na R2 (corrigido em dados e web, 2026-10-12):**
  a `PriestTables.spellProgressionRows` do app tinha 9 magias de 3º círculo
  no 19º nível; a Tabela 24 do PHB e o Domains of Dread têm 8. Decisão do
  usuário: corrigir só dados e web. `thac0berry-data/scripts/fix_rules_fixtures.py`
  corrige os fixtures (52 valores, no formato do Swift); a web lê de lá
  (v0.59.1). **Pendente no iPad:** a linha do 19º em `Models/Character.swift`
  continua com 9; até ela ser corrigida, o workflow "Regras (valores de
  referência)" do iPad acusa DIFERE, e o iPad mostra 9 na ficha.
- Arcanist e Avenger: só como regra de consulta (o usuário pediu jogáveis só
  Anchorite e Gypsy).

## Log

- 2026-10-10, R1 feita (thac0berry-data `gt4b/ravenloft-dod`):
  `scripts/add_ravenloft_dod.py` (idempotente) cria 7 regras do livro `DoD`
  (cenário Ravenloft, `scripts/build_books.py`), 24 tabelas. Testes de medo:
  as duas transcrições dos fãs batem em todos os valores, exceto Rogue 19–20
  ("X" numa delas), confirmado pela Tabela 95 do livro; a linha 21+ não tem
  valores e saiu. Correções explícitas: introduções das classes (colunas
  embaralhadas), hifenização, nota solta no Avenger, milhar com ponto no
  Anchorite, sinal da Tabela 102. No Table Grimoire: 562 → 586 tabelas, chip
  Ravenloft com 24. Web sem mudança de código.
- 2026-10-10, R2 feita (web v0.59.0; schema no thac0berry-data e gerador no iPad):
  o Anchorite é, pela tabela do livro, um Cleric com XP próprio (igual ao do
  druida até o 16º): grupo Priest, d8, THAC0, saves e slots de magia do
  sacerdote (com o bônus de Sabedoria); requisitos WIS 12 e CHA 15, só
  humano (avisos na ficha); prime requisite WIS (bônus de 10% com 16);
  esferas como no Cleric (o jogador marca na ficha); sem kits de Cleric e
  sem Turn Undead. Seletor de classe: só com Ravenloft na campanha
  (`src/rules/ravenloft.ts`); caixa "Ravenloft checks" embaixo dos saves
  (Fear/Horror/Madness pelo nível, tabela do grupo Priest); página 4 com
  "Anchorite Spell Progression". Testes: `tests/ravenloft.test.ts` (5, um
  deles confere as tabelas do código com o DoD no rules.json). Conferido no
  navegador com o personagem de teste "Teste Anchorite" (campanha "Teste
  W3.1b B"; Ravenloft ligado só durante o teste e desligado de novo).
- 2026-10-12, slots do sacerdote no 19º nível (web v0.59.1): fixtures
  corrigidos no thac0berry-data por script (ver Pendências); o teste de dados
  reais do Anchorite não precisa mais do ajuste no 19º nível.
- 2026-10-12, R3 feita (web v0.61.0; schema no thac0berry-data e gerador no iPad):
  pelas tabelas do livro, o Gypsy é um Thief em XP (Tabela 96), dados de vida
  (d6; 10+2 depois do 10º), THAC0, saves (Tabela 94), slots de proficiência e
  bases das perícias (Tabelas 97–99); os pontos por nível são os do ladrão
  (o jogador distribui à mão, como no Thief). Magias da Tabela 104 (arcanas,
  círculos 1–4) com a lista "Known Spells" só de Divination; especialização
  só na faca (+1/+2); Gypsy Lore (5% por nível) e Fear/Horror/Madness
  (Tabela 95) na caixa "Ravenloft checks"; requisitos CON/INT/WIS 13 e CHA 15;
  raças humano e meio-elfo (Half-Vistani não é raça do app: fica fora do
  aviso); prime requisites DEX e CHA. Sem kits de ladrão, sem multiclasse.
  Testes: 4 novos em `tests/ravenloft.test.ts` (um confere o código com as
  Tabelas 95, 97, 104 e a progressão no rules.json). Não conferido numa ficha
  no navegador: a sessão do app no navegador do agente expirou.
