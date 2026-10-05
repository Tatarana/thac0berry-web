# thac0berry-web

Versão web do THAC0berry, ficha de personagem de AD&D 2ª edição. É irmã do app iPad e
compartilha com ele contas, campanhas e fichas pelo backend.

**Stack:** Vite + React + TypeScript, React Router (rotas com `#`), lint pelo oxlint.
Backend: Supabase (`@supabase/supabase-js`, login PKCE). Fontes: Libre Baskerville e
Caveat (via `@fontsource`, sem depender do Google Fonts).

O login só funciona em endereços liberados em *Redirect URLs* no Supabase
(`http://localhost:5173/**` e `https://tatarana.github.io/thac0berry-web/**`).

| Repo | Papel |
|---|---|
| [`thac0berry-ipad`](https://github.com/Tatarana/thac0berry-ipad) | App iPad (SwiftUI, Swift Playgrounds) |
| [`thac0berry-backend`](https://github.com/Tatarana/thac0berry-backend) | Banco, permissões, sincronização; o desenho está em `docs/modelo-de-dados-e-sync.md` |
| [`thac0berry-data`](https://github.com/Tatarana/thac0berry-data) | Dados de referência (JSON) e schemas |
| **este** | App web |

## Estado

**W0 (base):** site publicado no GitHub Pages, identidade visual do app iPad
(obsidiana, latão, Baskerville e letra de mão), login com Google e a página
Diagnostics (Settings → Open Diagnostics).

**W1a (grimórios):** Compendium → Priest/Mage Grimoire, com busca (ignora acentos; aceita
iniciais, ex. "clw"), filtro por esfera/escola e por cenário, círculos recolhíveis e a
ficha de cada magia.

**W1b (kits e divindades):** kits de sacerdote, mago, guerreiro e ladino (busca por nome,
divindade ou título; grupos por subclasse; ficha com requisitos, perícias e descrição) e
divindades (filtro por livro; grupos por posto; ficha completa). O kit de sacerdote
especialista abre a ficha da divindade dele.

**W1c (proficiências e equipamento):** proficiências (filtro por cenário, grupos, ficha com
atributo, modificador, slots e a regra opcional Skills & Powers), armas, armaduras e
equipamento em tabela (no celular, cada linha vira um cartão).

**W1d (regras):** Rules Reference com 888 regras de 14 livros: filtro por livro, capítulos
recolhíveis, busca aproximada por tópico e palavras-chave (igual à do iPad), e a ficha com
o texto formatado (títulos, listas, negrito/itálico) e as tabelas no lugar das
referências.

**W1e (itens mágicos e psiônicos):** 5.669 itens mágicos (busca; filtro por grupo de fonte e
por livro; categorias; ficha com valores, fontes, encantamento, poder/cargas, magias e
defesa; até 150 linhas por categoria com "Show all") e 257 poderes psiônicos (filtro por
categoria; grupos por disciplina; ficha completa). **Com isso a W1 (compêndio) está
completa.**

**Dados:** `scripts/build-data.mjs` gera `public/data/` (fora do git) a partir do repo
`thac0berry-data`, que precisa estar clonado ao lado (`../thac0berry-data`) ou apontado
por `DATA_DIR`. Roda sozinho antes de `npm run dev` e `npm run build`.

Site: **https://tatarana.github.io/thac0berry-web/**. Publicado a cada push na
`main` (`.github/workflows/pages.yml`).

## Rodar

```bash
npm install
npm run dev       # http://localhost:5173/thac0berry-web/
npm run lint      # oxlint
npm run build     # checagem de tipos + build de produção em dist/
```

## Decisões que valem aqui

- A web **não precisa funcionar offline** no início.
- Regras de jogo (THAC0, saves, slots…) serão reimplementadas em TypeScript e
  conferidas contra casos de teste compartilhados com o iPad (planejado no
  `thac0berry-data`), para os dois apps calcularem igual.
- Login com Google e "Entrar com Apple", via Supabase Auth.
