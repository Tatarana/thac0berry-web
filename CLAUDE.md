# thac0berry-web: guia para agentes

App web do THAC0berry (Vite + React + TypeScript). Converse com o usuário em
**português**; comentários em português; **texto da interface em inglês**, como no iPad.

## Regras

1. **Proponha e espere o "ok" antes de codar.** Uma entrega por vez.
2. **CI verde antes de entregar** (`.github/workflows/ci.yml`): `npm ci`, lint e build
   (que inclui a checagem de tipos).
3. **Dados e regras são compartilhados:**
   - Os dados de referência vêm do repo `thac0berry-data`. Não copie nem edite JSON à
     mão aqui.
   - O formato das fichas e a sincronização seguem
     `thac0berry-backend/docs/modelo-de-dados-e-sync.md`.
   - A ficha é o mesmo JSON do `Codable` do app iPad. Respeite `schemaVersion`:
     registro de versão maior que a conhecida = **só leitura**.
4. **Regra de jogo fora dos componentes:** funções puras em TypeScript (ex.:
   `src/rules/`), testáveis e conferidas contra os mesmos casos do iPad. Componente
   React só exibe e chama essas funções.
5. **Segredos nunca no repo:** só variáveis públicas do Vite (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) em `.env.local`, que não é versionado. A chave
   `service_role` do Supabase **nunca** vai para o front-end.
6. Fim de linha: LF (`.gitattributes`). Neste PC o git usa `core.autocrlf=true`.
