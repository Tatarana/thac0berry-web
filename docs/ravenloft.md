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

Em aberto (perguntar antes da R2):

- quando a classe aparece no seletor: proposta = só se a campanha do
  personagem tem Ravenloft ligado (sem campanha ou sem cenário ligado: não
  aparece; campanha que desliga Ravenloft depois: a classe fica, com aviso);
- iPad: como o Psionicist, a classe é só da web por enquanto (um personagem
  Anchorite/Gypsy não abre no iPad até o iPad aprender a classe).

## Entregas

| # | Entrega | Estado |
|---|---|---|
| R1 | Dados: 7 regras do DoD (4 classes, Half-Vistani, perícias do Gypsy, Fear/Horror/Madness Checks), 24 tabelas, livro e cenário em `books.json` | feita (thac0berry-data `gt4b/ravenloft-dod`) |
| R2 | Anchorite jogável: schema (gerador do iPad → thac0berry-data), XP, dados de vida, THAC0, saves, slots de magia, requisitos, raça, testes de medo na ficha | a fazer |
| R3 | Gypsy jogável: o mesmo, mais perícias de ladrão, magias de adivinhação por dia (sem grimório, Tabela 104), Gypsy Lore (5%/nível), especialização em faca | a fazer |

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
