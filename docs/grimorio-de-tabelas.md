# Table Grimoire: plano e log

Ferramenta do DM (hub DM Tools, só no modo DM): todas as tabelas dos livros
num lugar só, para consultar, pesquisar e rolar. Log do trabalho: decisões,
entregas e pendências. Atualizar a cada entrega.

## Decisões do usuário (2026-10-08)

1. Tabelas criadas pelo mestre (encontros da campanha, DMG cap. 11): entrega
   própria, depois (precisa de tabela no Supabase e muda o documento de sync).
2. Rolagem: o app rola **e** o mestre digita o resultado do dado físico. Um
   **motor único de rolagem**, reutilizável no resto do app.
3. Tabelas que faltam: extrair do `thac0berry-data-mining` (de onde saíram
   todas as regras e tabelas).
4. Todas as tabelas, com filtro, incluindo as de cenários de campanha
   (Ravenloft etc.) separadas.
5. Nome na tela: "Table Grimoire".

## Dados (levantamento de 2026-10-08)

- `rules.json`: 202 tabelas estruturadas (`tables`: PHB 104, DMG 96, CPrH 2)
  e 330 tabelas em markdown no texto das regras dos suplementos e de Dark
  Sun (a primeira contagem, 378, via os cabeçalhos em duas linhas como duas
  tabelas), com o título numa linha em negrito acima.
- Faltam 35 tabelas do DMG, entre elas as 89–110 (subtabelas de itens
  mágicos, que a Tabela 88 cita), 54–56, 61–63, 66–70, 75 e 78.
- Defeitos: Tabela 88 diz "D20 Roll" com faixas 01–100; tabelas 51 e 84
  repetidas (em duas regras); 11 tabelas estruturadas sem número ("Table").
- Cenários: nenhum livro de cenário no `rules.json` (só Dark Sun: DSC, DK,
  WatW). Ravenloft e os outros dependem do data-mining.
- O `thac0berry-data-mining` não está no GitHub (fica no PC do usuário, ao
  lado do `thac0berry-data`); sem ele, a GT4 não anda nesta sessão.

## Entregas

| # | Entrega | Estado |
|---|---|---|
| GT1 | Consulta: índice das tabelas (estruturadas + markdown) no build, tela `/dm/tables` com busca e filtros (livro, cenário, capítulo), ficha com link para a regra | feita (web v0.40.0) |
| GT2 | Motor de rolagem (`src/rules/dice.ts`: notação, faixas, rolar, achar linha) + Roll e resultado digitado na ficha + histórico | a fazer |
| GT3 | Encadear: linha que cita outra tabela vira link e o Roll continua nela | a fazer |
| GT4 | Dados (thac0berry-data, com proposta e "ok" lá): tabelas que faltam do DMG, cenários (Ravenloft etc.), correções (dado da 88, títulos sem número) | bloqueada: data-mining fora do GitHub |
| GT5 | Tabelas do mestre (decisão 1) | adiada |

## Log

- 2026-10-08: plano aprovado (decisões 1 a 5). Início da GT1.
- 2026-10-08, GT1 feita (web v0.40.0):
  - `src/rules/tableIndex.ts` (funções puras, roda no build e nos testes):
    junta as tabelas estruturadas e as em markdown do `rules.json` (título da
    linha em negrito acima; cabeçalho em duas linhas vira "Spell Level: 1");
    repetidas viram `alsoIn`; id estável (`dmg-84`, ou regra + posição sem
    número); cenário por livro (DSC, DK, WatW = Dark Sun);
  - `build-data.mjs` gera `public/data/tables.json`: 512 tabelas (~400 KB), de
    532 encontradas (20 repetidas);
  - tela `/dm/tables` (só modo DM) e cartão "Table Grimoire" no hub: busca por
    número ("88"), título e conteúdo (nessa ordem), chips de cenário, livro e
    capítulo; a ficha mostra a tabela e as regras de onde ela vem (abre a
    regra);
  - o filtro de capítulo substitui os "temas" do plano: sai direto dos dados,
    sem classificação feita à mão;
  - conferido no navegador (computador e celular, sem rolagem horizontal);
    testes: 105 (5 novos);
  - achado: a Tabela 65 do CRH tem cabeçalho de três níveis malformado na
    fonte (fica legível, não perfeita) — entra na GT4.
