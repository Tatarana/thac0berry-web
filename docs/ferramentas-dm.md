# Ferramentas do DM

Log das ferramentas do mestre na web (o módulo do DM — papéis, convites, painel
do grupo — é outro trabalho; ver a conversa de 2026-10-07 e a memória).

## Decisões do usuário (2026-10-07)

1. Começar pelas ferramentas do DM, antes do módulo do DM (F2a–F2d).
2. Primeira ferramenta: catálogo de monstros, a partir do
   `thac0berry-data-mining/data/monsters` (validado em 3 rodadas, ver abaixo).
3. Cartas colecionáveis de 1992 ficam de fora.
4. Só o modo DM mostra as ferramentas; o jogador não as vê no app. Os dados
   continuam públicos (estão nos livros); o controle é só de tela (`DmOnly`).
5. Entrada: cartão "DM Tools" na tela inicial (só no modo DM), um hub de
   ferramentas; Monsters é a primeira.
6. Sem imagens por enquanto (ver "Imagens").

## Dados

- `thac0berry-data/data/monsters/`: índice + um arquivo por coleção, gerados
  por `scripts/build_monsters.py` (relê o infobox da wiki; correções explícitas
  em MANUAL/TYPOS/WORD_TYPOS/TEXT_TYPOS, cada uma comentada). Subpasta fora do
  `sync_data.py` do iPad.
- Validação: rodada 1 (XP com vírgula, variantes, infobox deslocado), rodada 2
  (deslocamentos parciais, OCR "FI"/"CI", resumos), rodada 3 (histórico completo
  da wiki, `dumps/adnd2e_pages_full.xml.7z`: 717 páginas com a tabela rotulada
  de antes do infobox; XP recuperado, Neogi THAC0 15, Haunt etc.).
- `scripts/build-data.mjs` da web: `public/data/monsters-index.json` (com os
  apelidos e o resumo encurtado) e `public/data/monsters/*.json`.

## Imagens (pendente)

As páginas da wiki referenciam 785 imagens (776 ainda existem), em ~590 dos
monstros: 152 MB no tamanho original (média 196 KB, mediana 102 KB, maior
3 MB). Falta decidir onde guardar e em que tamanho — e se dá para publicar
(são ilustrações dos livros).

## Entregas

| # | Entrega | Estado |
|---|---|---|
| DM1 | DM Tools (hub) + Monsters (lista e ficha) | feita (web v0.39.0) |

## Log

- 2026-10-07, DM1 feita (web v0.39.0):
  - cartão "DM Tools" na tela inicial (só modo DM); `/dm` (hub) e
    `/dm/monsters`; fora do modo DM, aviso com "Switch to DM mode";
  - lista: busca por nome e apelido, chips de coleção e de frequência
    (Common/Uncommon/Rare/Very rare/Unique/Other), ordem por nome, HD ou XP
    (sem valor vai para o fim), 200 linhas antes do "Show all";
  - ficha: bloco no formato do Monstrous Manual (ecologia, depois combate), uma
    coluna por variante em tela larga e abas por variante no celular; resumo,
    seções Combat/Habitat-Society/Ecology (ou o texto completo em blocos), livros;
  - regras puras em `src/rules/monsters.ts`; testes: 100 (6 novos);
  - achado no teste: ~300 seções com uma linha "=" (sobra de "=== Combat===")
    — corrigido no `build_monsters.py` (thac0berry-data `999086d`).
- 2026-10-07, ícones do usuário (web v0.39.1): mesa do mestre com o d20 no
  cartão "DM Tools" (`icon_dm_tools.png`) e medalhão dos monstros no item
  Monsters do hub (`icon_monsters.png`); fundo branco tirado (só o branco ligado
  às bordas, borda suave), 256 px como os ícones mais novos.
- 2026-10-09, ícone do Table Grimoire (web v0.42.2): medalhão do usuário
  (ábaco e livro de tabelas) no item Table Grimoire do hub
  (`icon_table_grimoire.png`); mesmo processo: só o branco ligado às bordas
  sai, borda suave, 256 px.
