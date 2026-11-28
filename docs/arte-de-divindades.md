# Ilustrações de divindades e heróis

Uma imagem em paisagem (1536×1024) por registro de `deities.json` (434: divindades e os 48 heróis
mortais), mostrada no topo da ficha do Compêndio, com tela cheia e lápis de admin (mesmo
componente `SlotArt` dos monstros). Sem imagem, só o admin vê o lápis; os demais não veem moldura.

- Slot `deity/<id>` (o mesmo para herói e deus), tamanho em `slotSize`. Fora da lista geral de
  imagens do site (`refreshSiteImages`); `useDeityImage` busca todos os `deity/%` numa consulta
  só, em cache até a próxima troca.
- Publicar: `node scripts/add-site-art.mjs deity <id> <arquivo> [--dry-run] [--new-version]`.
  Valida o id em `thac0berry-data/data/deities.json` (`DATA_DIR` em worktree) e recusa slot que
  já tem versão, salvo `--new-version`, que ACRESCENTA outra (nada é apagado; a antiga fica no
  histórico). Mesmas credenciais de `~/.thac0berry/monster-art-upload.env`; o usuário IAM precisa
  gravar em `deity/*` (senão: "the upload user is not allowed to write deity/*").
- Monstro: `node scripts/add-site-art.mjs monster <id> <arquivo>`; `add-monster-image.mjs <id>
  <arquivo>` continua valendo (atalho). Trocar imagem publicada: `... monster <id> <arquivo> --new-version`.
- Fila dos heróis: `node scripts/hero-art-step.mjs next|ingest|skip|sheet|publish|wait ...` sobre
  `../forge-art/heroes/<bloco>.json` (mesmo formato dos blocos de monstros: id, subject, accuracy,
  scale, setting); ou `monster-art-step.mjs ... --dir <pasta> [--kind monster|deity]`.
- A Edge Function `site-image-upload` (lápis) precisa aceitar slots `deity/*` no backend.
## Divindades de Faerûn (2026-11-27)

As 79 divindades do panteão Faerûnian (Faiths & Avatars e Powers & Pantheons) estão publicadas
(versão 1). O bloco com cena, acurácia, escala e cenário de cada uma está em
`../forge-art/deities/block-fr.json`; os originais, em `../forge-art/deities/<id>.png`, com backup.
Cada cena segue a descrição do avatar no livro. Ressalvas leves aceitas: a roda dentada de Gond
(símbolo do livro, 4 raios) e o punho da espada de Helm lembram cruz; Garagos pode ter 5 ou 6
braços; o rosto de Savras não ficou cristalino.

Próximos blocos, pela ordem combinada: Dragonlance (22), deuses semi-humanos (38), deuses de
monstros (89) e mitologias do mundo real (158, com cuidado com os que ainda são cultuados).
