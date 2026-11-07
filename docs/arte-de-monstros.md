# Ilustrações de monstros

Uma imagem em paisagem (1536×1024) por monstro, gerada pelo ChatGPT no Chrome e mostrada na
ficha, com tela cheia para o mestre exibir à mesa. Situação em 2026-11-06: 179 monstros
publicados de 2.386.

## Como funciona

- Slot `monster/<id>`, publicado por `scripts/add-monster-image.mjs`, que nunca substitui uma
  versão existente. Para trocar uma imagem publicada, use o lápis de admin na ficha.
- A fila é `scripts/monster-art-step.mjs`. Cada bloco tem no máximo 50 imagens, e o próximo só
  começa depois do ok do usuário.
- Prompts, originais em PNG, folhas e registros ficam em `../forge-art/monsters`, fora do repo
  e sem Git: `block-NN.json`, `block-NN-log.md` e `folha-bloco-NN-N.jpg`.
- Backup dessa pasta no bucket privado `thac0berry-art-originals-025112051097` (sa-east-1), com
  versionamento e sem CloudFront, então nada dali aparece no app. Ao fechar um bloco, enviar com
  `aws s3 sync . s3://$ART_BACKUP_BUCKET/monsters/`, carregando `~/.thac0berry/art-backup.env`. A
  credencial só lista e envia, nunca apaga.
- As imagens do Forge (`../forge-art`, sem a pasta `monsters`) ficam no mesmo bucket, em `forge/`.
- Todo prompt leva o tamanho da ficha. Sem isso, a Sea Hag de 3 pés saiu gigante no piloto.

## Situação dos blocos

| Lote | Imagens | Situação |
|---|---|---|
| Piloto | 30 | Publicado; 4 imagens com contagem errada, abaixo |
| Bloco 1 | 50 | Publicado; validação do usuário pendente |
| Bloco 2 | 50 | Publicado; validação do usuário pendente |
| Bloco 3 | 50 | Publicado; validação do usuário pendente |

## Imagens que exigem atenção

Todas estão publicadas. Saem desta lista quando o usuário validar ou trocar a imagem.

### Contagem errada

| Monstro | Slot | Problema |
|---|---|---|
| Beholder | `beholder` | 9 pedúnculos em vez de 10; `beholder-edit.png` tem 11 |
| Carrion Crawler | `carrion_crawler` | 7 tentáculos em vez de 8 |
| Grell | `grell` | Cerca de 12 tentáculos em vez de 10, e um olho |
| Neogi | `neogi` | Cerca de 10 membros em vez de 8 |
| Aurumvorax | `aurumvorax` | 6 patas visíveis em vez de 8; olhos amarelos, não prateados |
| Giant Squid | `giant_squid` | Cerca de 13 tentáculos em vez de 10 |

### Desvio importante

| Monstro | Slot | Problema | Sugestão |
|---|---|---|---|
| Hippogriff | `hippogriff` | Pescoço de penas e sem orelhas de cavalo; parece um grifo | Refazer |
| Lamia | `lamia` | Manto no peito, contra o "wear no clothing" da ficha, depois de bloqueio por nudez | Tentar à mão sem o manto |
| Vampire | `vampire` | Dançarino de capa vermelha no espelho pode parecer o reflexo dele | Refazer |
| Otyugh | `otyugh` | Pele mais rosada que o marrom-acinzentado da ficha; imagem gerada à mão pelo usuário | Decisão do usuário |

### Conferir

| Monstro | Slot | Dúvida |
|---|---|---|
| Behir | `behir` | 6 ou 7 patas visíveis de um lado; o outro lado está oculto |
| Kraken | `kraken` | Os 2 braços farpados estão certos; os demais parecem passar de 8, mas se sobrepõem na água |
| Gith | `gith` | Os três dedos sem polegar não aparecem nas mãos que seguram as espadas |
| Rust Monster | `rust_monster` | 5 patas visíveis; a descrição não dá a contagem |
| Dryad | `dryad` | Bem sensual, vestida só de folhas |
| Harpy | `harpy` | Seios à mostra, e corpo mais de águia que de abutre |
| Deepspawn | `deepspawn` | Tentáculos parecem mais de 3; ovos ao fundo não estão na ficha |
| Weretiger | `weretiger` | Pose e corpo sensuais |
| Halfling | `halfling` | Revisão de IP: as portas redondas, pedidas no prompt, lembram os hobbits de Tolkien |

### Ressalvas menores

| Monstro | Slot | Detalhe |
|---|---|---|
| Draconian Kapak | `draconian_kapak` | Sem asas, que os dados não citam; escamas mais verdes que cobre |
| Fire Giant | `fire_giant` | Pele cinza-escura em vez de negra; armadura mais de malha que `banded` |
| Ogre | `ogre` | Olhos sem o roxo com pupila branca; pele mais marrom |
| Gnoll | `gnoll` | Pintas de hiena que a ficha não menciona |
| Death Knight | `death_knight` | Crânio pouco enegrecido; armadura mais enferrujada que queimada |
| Drow | `drow` | Pele cinza-arroxeada em vez de negra |
| Skeleton Warrior | `skeleton_warrior` | Usa coroa enquanto busca o diadema |
| Werebear | `werebear` | Goblins verdes ao fundo; a ficha diz laranja a vermelho |
| Rakshasa | `rakshasa` | Palmas invertidas só sugeridas |
| Gauth | `gauth` | Boca mais de frente que no lado de baixo |
| Dragon Turtle | `dragon_turtle` | Casca mais clara que o verde profundo da ficha |
| Flesh Golem | `lesser_golem` | Mostra só o Flesh Golem; a ficha reúne Flesh e Clay |
| Stone Golem | `greater_golem` | Mostra só o Stone Golem, que a ficha reúne com o Iron; parece bem maior que 9,5 pés |
| Stirge | `stirge` | Tom mais escuro e realista que o restante do conjunto |
| Piercer | `piercer` | Pedúnculos de olhos maiores que os "tiny" da ficha |
| Blink Dog | `blink_dog` | Esguios, com cara de raposa; a ficha pede mais robustos |
| Elf | `elf` | Pele menos pálida que a ficha pede |
| Leprechaun | `leprechaun` | Parece maior que os 2 pés da ficha |
| Leucrotta | `leucrotta` | Galhada que a ficha não cita; cauda mais de cavalo que leonina |
| Wereboar | `wereboar` | Pelo mais marrom que negro |
| Yeti | `yeti` | Parece bem maior que os 8 pés da ficha |
| Giant Beetle | `giant_beetle` | Mostra só o Stag; a ficha reúne 6 besouros |
| Hag | `hag` | Mostra só a Green; a ficha reúne Annis, Green e Sea |

## Pendências de validação

- Validar o bloco 1 inteiro: `../forge-art/monsters/folha-bloco-01-N.jpg`.
- Validar o bloco 2 inteiro: `../forge-art/monsters/folha-bloco-02-N.jpg`.
- Validar o bloco 3 inteiro: `../forge-art/monsters/folha-bloco-03-N.jpg`.
- Depois da primeira passada, criar imagens das variantes que parecem outro monstro (Drider, Ogre
  Mage, Winter Wolf), o que exige a imagem acompanhar a variante no app. Decisão do usuário em
  2026-11-06: uma imagem por ficha agora, variantes importantes depois.
- Confirmar a tela cheia nativa com um clique real.

## Pegadinhas da fila

- Não rodar com jogo aberto: com a CPU em 100%, a página trava, e isso parece limite do ChatGPT.
- Uma aba por imagem, porque o Chrome barra o segundo download automático da aba.
- Baixar só a imagem visível: a página guarda ocultas imagens de outras conversas.
- Enviar em chamada separada da navegação e checar a URL antes de reenviar, porque um envio que
  estoura o tempo pode ter passado.
- Bloqueio de conteúdo: o de violência pode passar no reenvio; no de nudez, editar o prompt e
  anotar a diferença, sem reenviar igual.
- Contagens exatas de 8 ou mais erram com frequência: tentar uma vez e, se errar, ir para a lista
  acima.
- O `--dry-run` de `add-monster-image.mjs` deixa `.preview.webp` na pasta atual; rodar fora do repo.
