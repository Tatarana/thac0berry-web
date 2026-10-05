# thac0berry-web

Versão web do THAC0berry, ficha de personagem de AD&D 2ª edição. É irmã do app iPad e
compartilha com ele contas, campanhas e fichas pelo backend.

**Stack:** Vite + React + TypeScript, com lint pelo oxlint. Backend: Supabase (cliente
oficial `@supabase/supabase-js`, a ser adicionado na Fase 1).

| Repo | Papel |
|---|---|
| [`thac0berry-ipad`](https://github.com/Tatarana/thac0berry-ipad) | App iPad (SwiftUI, Swift Playgrounds) |
| [`thac0berry-backend`](https://github.com/Tatarana/thac0berry-backend) | Banco, permissões, sincronização; o desenho está em `docs/modelo-de-dados-e-sync.md` |
| [`thac0berry-data`](https://github.com/Tatarana/thac0berry-data) | Dados de referência (JSON) e schemas |
| **este** | App web |

## Estado

Só a estrutura gerada pelo Vite (`npm create vite`, template `react-ts`), com CI. As
funcionalidades entram por fases, na mesma ordem do backend.

## Rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run lint      # oxlint
npm run build     # checagem de tipos + build de produção em dist/
```

## Decisões que valem aqui

- A web **não precisa funcionar offline** no início.
- Regras de jogo (THAC0, saves, slots…) serão reimplementadas em TypeScript e
  conferidas contra casos de teste compartilhados com o iPad (planejado no
  `thac0berry-data`), para os dois apps calcularem igual.
- Login com Google e "Entrar com Apple", via Supabase Auth.
