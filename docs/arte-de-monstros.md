# Ilustrações de monstros

Uma imagem em paisagem (1536×1024) por monstro, gerada pelo ChatGPT no Chrome e mostrada na
ficha, com tela cheia para o mestre exibir à mesa. Situação em 2026-11-25: 1.423 monstros
publicados de 2.386; todos os do Monstrous Manual, do Forgotten Realms, do Dragonlance, do Dark Sun, de Mystara, do Greyhawk, do Ravenloft, do Spelljammer e do Planescape com descrição têm imagem, e também os de Other Campaigns & Magazines que são do Forgotten Realms (Faerûn, Al-Qadim, Maztica e Kara-Tur). Critério de "com descrição": o texto antes de `## Combat` em `fullText` tem pelo menos 300 caracteres.

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
- O livro "Illustrations" do Compendium usa o medalhão da paleta
  (`public/images/icon_illustrations.png`, arte do usuário, v0.139.1): o JPG veio com fundo
  branco, removido por preenchimento a partir das bordas (os brilhos brancos de dentro ficam) e
  reduzido a 256×256 com transparência, como os outros medalhões.

## Situação dos blocos

| Lote | Imagens | Situação |
|---|---|---|
| Piloto | 30 | Publicado; 4 imagens com contagem errada, abaixo |
| Bloco 1 | 50 | Publicado; validação do usuário pendente |
| Bloco 2 | 50 | Publicado; validação do usuário pendente |
| Bloco 3 | 50 | Publicado; validação do usuário pendente |
| Bloco 4 | 50 | Publicado; validação do usuário pendente |
| Bloco 5 | 20 | Publicado; validação do usuário pendente |
| Bloco 6 | 50 | Forgotten Realms, de Air Dragon a Gaund; publicado, validação do usuário pendente |
| Bloco 7 | 50 | Forgotten Realms, de Zombie Dragon a Noble Dao; publicado, validação do usuário pendente |
| Bloco 8 | 50 | Forgotten Realms, de Noble Efreeti a Yuki-on-na; publicado, validação do usuário pendente |
| Bloco 9 | 50 | Zaratan e Zin (fim do Forgotten Realms) e Dark Sun, de Aarakocra (Athas) a Greater Air Elemental; publicado, validação do usuário pendente |
| Bloco 10 | 50 | Dark Sun, de Greater Fire Elemental (Athas) a Slig; publicado, validação do usuário pendente |
| Bloco 11 | 25 | Dark Sun, de Sloth (Athas) a Zik-trin'ak (fim do Dark Sun com descrição); publicado, validação do usuário pendente |
| Bloco 12 | 37 | Greyhawk inteiro, de Aspis a Wraith; publicado, validação do usuário pendente |
| Bloco 13 | 50 | Dragonlance, de Amphi Dragon a Swamp Giant; publicado e validado pelo usuário (3 para corrigir) |
| Bloco 14 | 50 | Os 9 últimos do Dragonlance (Tayling a Zhakar Lizards) e Ravenloft de Aggie a Hound, Phantom; publicado e validado pelo usuário (3 para corrigir) |
| Bloco 15 | 50 | Ravenloft, de Jack Frost a Zombie Wolf (faltam Will O'Deep, Will O'Sea, Zombie Fog, Zombie Lord e Desert Zombie); publicado, validação do usuário pendente |
| Bloco 16 | 5 | Fim do Ravenloft: Will O'Deep, Will O'Sea, Zombie Fog, Zombie Lord, Desert Zombie; publicado, validação do usuário pendente |
| Bloco 17 | 50 | Mystara e Savage Coast, de Actaeon a Herathian Voat (32 Mystara, 18 Savage Coast); publicado, validação do usuário pendente |
| Bloco 18 | 50 | Mystara e Savage Coast, de Herex a Spectral Death (27 Mystara, 23 Savage Coast); publicado, validação do usuário pendente |
| Bloco 19 | 32 | Fim do Forgotten Realms & Continents (Faerûn, Al-Qadim, Kara-Tur e Realmspace), de Architect Builder a Tempest; publicado, validação do usuário pendente |
| Bloco 20 | 19 | Fim do Dragonlance, de Daemonlord a Wichtlin; publicado, validação do usuário pendente |
| Bloco 21 | 32 | Fim do Dark Sun com descrição, de Brambleweed a Thinking Zombie (Dwarf e Elf de Athas ficam fora, nome igual ao de outras coleções); publicado, validação do usuário pendente |
| Bloco 22 | 43 | Fim de Mystara/Savage Coast (34) e do Greyhawk (9) com descrição, de Gargantua a Sea Zombie; publicado, validação do usuário pendente |
| Bloco 23 | 33 | Ravenloft com descrição, de Akikage a Hearth Fiend; publicado, validação do usuário pendente |
| Bloco 24 | 32 | Fim do Ravenloft com descrição, de Abber Nomads a Vampire Illithid; publicado, validação do usuário pendente |
| Blocos 25 a 27 | 111 | Spelljammer com descrição, 37 por bloco; gerados em dois dias por causa do limite diário do ChatGPT |
| Blocos 28 a 33 | 229 | Planescape com descrição; publicado, validação do usuário pendente |
| Blocos 34 e 35 | 76 | Other Campaigns & Magazines do Forgotten Realms: 52 de Faerûn (34) e 24 de Al-Qadim, Maztica e Kara-Tur (35); publicado, validação do usuário pendente |

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
| Director | `director` | 4 tendrils em vez de 3 (os 6 olhos estão certos) |
| Osquip | `osquip` | 4 patas visíveis em vez de 6 |
| Overseer | `overseer` | Bem mais de 13 membros, e 2 bocas no topo em vez de 3 |
| Chitine | `chitine` | 2 braços em vez de 4 |
| Gaund | `gaund` | 2 olhos visíveis em vez de 3 |
| Hu Hsien | `hu_hsien` | O rapaz da cena tem 3 braços (apontado pelo usuário) |
| Men-shen | `men_shen` | Duas mãos direitas (apontado pelo usuário) |
| Hannya (japonesa) | `hannya_japanese` | O rapaz da cena está sem o polegar (apontado pelo usuário) |
| Solifugid | `solifugid` | O guarda da caravana tem 3 mãos (confirmado pelo usuário) |
| Thylacine | `thylacine` | O caçador tem 3 mãos (confirmado pelo usuário) |
| Tasked Slayer Genie | `tasked_slayer_genie` | 3 braços visíveis em vez de 4 (falta uma pata de leão) |
| Aspis | `aspis` | O anão tem um braço torcido atrás das costas (apontado pelo usuário); refeita em `aspis-nova-1.png`, com membros certos, para trocar pelo lápis |
| Necrophidius and Scarecrow Golem | `necrophidius_and_scarecrow_golem` | Braços do ladrão distorcidos (apontado pelo usuário) |
| Camprat | `rat_greyhawk` | Uma das pessoas dormindo tem o braço totalmente errado (apontado pelo usuário) |
| Daergar | `daergar` | A mulher da direita tem a mão sem polegar (apontado pelo usuário) |
| Dimernesti | `elf_sea_dimernesti` | O remo do rapaz de vermelho fica dentro do barco e não chega à água; parece mais uma vara solta que um remo (apontado pelo usuário) |
| Sivak Draconian | `sivak_draconian` | A lança da mulher flutua: ela não a segura (apontado pelo usuário) |
| Corpse Candle | `corpse_candle` | O morto termina na cintura: o pano cai liso sobre o esquife, sem pernas (apontado pelo usuário) |
| Drow Vampire | `drow_vampire` | A adaga da mão direita tem lâmina ondulada, mole como borracha (apontado pelo usuário) |
| Geist | `geist` | A irmã que dorme fica tão colada à que senta que parece sair de dentro dela (apontado pelo usuário) |

### Desvio importante

| Monstro | Slot | Problema | Sugestão |
|---|---|---|---|
| Hippogriff | `hippogriff` | Pescoço de penas e sem orelhas de cavalo; parece um grifo | Refazer |
| Lamia | `lamia` | Manto no peito, contra o "wear no clothing" da ficha, depois de bloqueio por nudez | Tentar à mão sem o manto |
| Vampire | `vampire` | Dançarino de capa vermelha no espelho pode parecer o reflexo dele | Refazer |
| Dark Naga | `dark_naga` | Tronco e braços humanos; a ficha pede só rosto humano num corpo de serpente | Refazer |
| Doc cu'o'c | `doc_cu_o_c` | Homem inteiro, em vez de meio homem com uma perna e um braço | Refazer |
| Guardian Tasked Genie | `guardian_tasked_genie` | Dois rostos lado a lado, como duas cabeças; a ficha pede um para a frente e outro para trás | Refazer |
| Vurgens | `vurgens` | Mergulhador moderno, com cilindro e nadadeiras | Refazer com mergulhador de época ou sem pessoa |
| Tako | `tako` | Dois olhos em vez de um só, no centro da cabeça | Refazer |
| Pan Lung | `pan_lung` | Braços em lugares estranhos e só 2 patas visíveis (apontado pelo usuário) | Refazer pedindo quatro patas com garras |
| Sha'az | `sha_az` | A lança parece duplicada (apontado pelo usuário) | Refazer |
| Otyugh | `otyugh` | Pele mais rosada que o marrom-acinzentado da ficha; imagem gerada à mão pelo usuário | Decisão do usuário |

### Conferir

| Monstro | Slot | Dúvida |
|---|---|---|
| Behir | `behir` | 6 ou 7 patas visíveis de um lado; o outro lado está oculto |
| Kraken | `kraken` | Os 2 braços farpados estão certos; os demais parecem passar de 8, mas se sobrepõem na água |
| Gith | `gith` | Os três dedos sem polegar não aparecem nas mãos que seguram as espadas |
| Rust Monster | `rust_monster` | 5 patas visíveis; a descrição não dá a contagem |
| Harpy | `harpy` | Corpo mais de águia que de abutre |
| Deepspawn | `deepspawn` | Tentáculos parecem mais de 3; ovos ao fundo não estão na ficha |
| Halfling | `halfling` | Revisão de IP: as portas redondas, pedidas no prompt, lembram os hobbits de Tolkien |
| Bird Maidens | `bird_maidens` | Mulher no meio da transformação, com bico e garras; pode lembrar harpia |
| Pech | `earth_kin` | Nus e com cara de Gollum (revisão de IP) |
| Fog Giant | `fog_giant` | Peludo demais, quase um yeti |
| Jermlaine | `jermlaine` | Parecem maiores que 1 pé |
| Death Kiss | `death_kiss` | Cerca de 10 tentáculos, difícil contar; refeita sem o cavalo caído depois de bloqueio por violência |
| Giant Crab | `giant_crustacean` | 7 ou 8 patas, sobrepostas |
| Giant Octopus | `octopus_giant` | 8 tentáculos ou um pouco mais, sobrepostos |
| Osquip (IP) | `osquip` | Halfling com cara de Bilbo |
| Totem Spirit | `totem_spirit` | Xamã com visual estereotipado de indígena norte-americano |
| Werefox | `werefox` | Uma das companhias é mulher (a ficha diz homens encantados); bico de viúva pouco visível |
| Skriaxit | `skriaxit` | Parecem bem maiores que 10 pés |
| Bajang | `bajang` | Lembra um pouco o Gollum (IP) |
| Black Cloud of Vengeance | `black_cloud_of_vengeance` | Cúpula dourada lembra o Domo da Rocha, com uma cruz no topo |
| Camel of the Pearl | `camel_of_the_pearl` | Cabeça mais de lhama e sem corcova visível |
| Spirit Centipede | `centipede_spirit` | Bem maior que os 4 pés da ficha |
| Dracolich | `dracolich` | Mago do grupo lembra Gandalf (IP) |
| Gargantua | `gargantua` | Lembra muito o Godzilla (IP) |
| Harrier | `harrier` | Explorador lembra Indiana Jones (IP) |
| Haundar | `haundar` | Um viajante usa binóculo, anacrônico |
| Krakentua | `krakentua` | Tentáculos parecem 6 ou 7, sobrepostos; a ficha pede 7 |
| Loxo | `loxo` | Só um dos adultos tem claramente as 2 trombas; os outros parecem ter uma |
| Manscorpion | `manscorpion` | Patas parecem 6 ou 7; mãos com vários dedos em vez de 2 dedos grossos e polegar |
| Giant Mason Wasp | `mason_wasp_giant` | Cúpula dourada lembra de novo o Domo da Rocha |
| Mountain Giant | `mountain_giant` | Tem bigode (a ficha diz sem); mago do grupo lembra Gandalf (IP) |
| Shen Lung | `shen_lung` | Nenhuma pata visível |
| T'ien Lung | `t_ien_lung` | Só 2 patas visíveis |
| Rhaumbusun | `rhaumbusun` | Patas difíceis de contar (pedido 8) |
| Vreesar | `vreesar` | Inseto de quatro patas, vermelho e com antenas; o gelugon costuma ser bípede e branco-azulado |
| The White Stag | `the_white_stag` | Elfos lembram os dos filmes do Senhor dos Anéis (IP) |
| Winged Serpent | `winged_serpent` | Palácio de cúpulas douradas ao fundo |
| Aarakocra (Athas) | `aarakocra_athas` | A placa óssea do peito saiu como costelas expostas; parecem meio esqueléticos |
| Anakore | `anakore` | Cena noturna com o sol carmesim no céu |
| B'rohg | `b_rohg` | Quatro braços certos; um gladiador segura o escudo e a lança passa pela cintura sem mão visível |
| Black Silt Horror | `black_silt_horror` | Os 8 tentáculos saíram rígidos, parecendo patas de aranha |
| Desert Antloid | `desert_antloid` | Corpo com mais de 3 segmentos; humanos sem explicação na entrada do formigueiro |
| Feylaar | `feylaar` | A camuflagem deixa os braços de trás pouco legíveis; conferir se são 4 |
| Jalath'gak | `jalath_gak` | Parece ter umas 8 patas em vez de 6 |
| Kank (wild) | `kank_wild` | O kank da frente parece ter 8 patas em vez de 6 |
| Mastyrial | `mastyrial` | Parece ter 8 patas em vez de 6 |
| Obsidian Retriever | `obsidian_retriever` | Estátua ao fundo com coroa de raios, lembra a Estátua da Liberdade |
| Pulp Bee | `pulp_bee` | Algumas parecem ter 6 patas em vez de 4 |
| Greater Fire Elemental (Athas) | `greater_fire_elemental` | Achado do usuário: o conjurador está sem um braço |
| Magma Silt Horror | `magma_silt_horror` | Achado do usuário: um humano tem 3 braços |
| Silt Paraelemental Beast | `silt_paraelemental_beast` | Achado do usuário: o humano capturado tem uma perna só |
| Thrax | `thrax` | O braço esquerdo da vítima não aparece (talvez atrás das costas) |
| Tohr-kreen II | `tohr_kreen_ii` | Os J'hol vermelhos parecem ter só 2 braços em vez de 4; armas parecem lanças, não gythkas |
| Giant Dragonfly | `dragonfly_giant` | O pescador mostra só uma perna (a outra talvez dobrada sob o corpo) |
| Vampire Cactus | `vampire_cactus` | Cerca de 20 folhas em vez de 12 |

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
| Absalom | `absalom` | Templo subterrâneo com céu e sol ao fundo |
| Dray | `dray` | Cidade subterrânea com céu e sol ao fundo |
| Bog Wader | `bog_wader` | Garras de 4 dedos em vez de 3 |
| Dagorran | `dagorran` | Cristal no alto da cabeça em vez de entre os ombros |
| Fael | `fael` | Pálido, com cara de morto-vivo; a ficha diz que parece vivo |
| Fordorran | `fordorran` | Maior que 8 pés; a mudança de cor não aparece |
| Hej-kin | `hej_kin` | O anão tem cabelo e barba; os anões de Athas são carecas |
| Insect Swarm | `insect_swarm` | As formigas da frente parecem bem maiores que 1 polegada |
| Kaisharga | `kaisharga` | Mais cadavérico que a pele cinza esticada da ficha |
| Defiler Lich | `lich_defiler` | Sem as luzes verdes nas órbitas |
| Psionocus | `psionocus` | Tem patas dianteiras, que a ficha diz não ter |
| Pyreen | `pyreen` | Parece baixo para 6,5 pés |
| Rasclinn | `rasclinn` | O caçador usa estilingue moderno com elásticos em vez de funda |
| Roc (Athas) | `roc_athas` | O kank carregado saiu como réptil |
| Ruktoi | `ruktoi` | Patas com 4 a 5 dedos em vez de 3 |
| Scrab | `scrab` | Mais rastejantes que "homens-inseto" |
| So-ut | `so_ut` | Camelo de carga ao fundo; Athas não tem camelos |
| Spider Cactus | `spider_cactus` | Puxa a vítima com braços-tentáculo que a ficha não descreve |
| Spinewyrm | `spinewyrm` | O kank montado saiu como réptil |
| Ssurran | `ssurran` | Rostos de lagarto; a ficha diz rostos humanoides |
| Stalking Horror | `stalking_horror` | Ganchos dos tentáculos pouco visíveis |
| Tayling | `tayling_krynn` | Dado: a ficha se chama Tayling, mas o texto descreve Sligs de Krynn; a imagem segue o texto |
| Tohr-kreen I | `tohr_kreen_i` | Kanks dos mercadores saíram como répteis; viajante ao fundo com chapéu de aba |
| Tohr-kreen III | `tohr_kreen_iii` | O T'keech da direita mostra só 2 ou 3 braços |
| Trin | `trin` | O thri-kreen caçador tem só 2 braços |
| Tul'k | `tul_k` | Topo da cabeça careca, não claramente de osso exposto |
| Wezer | `wezer` | Rainha bem maior que os 7 pés da ficha |
| White Silt Horror | `white` | O silte parece água, com espuma |
| Wild Mul | `wild_mul` | Orelhas para os lados, pouco puxadas para trás |
| Xerichou | `xerichou` | Bico de ave; parecem maiores que 1 pé |
| Zik-trin'ak | `zik_trin_ak` | Arma com lâmina numa ponta só; a gythka tem nas duas |
| Beastman | `beastman` | Orelhas pontudas que a ficha não cita |
| Cloud Dragon | `cloud_dragon` | Cara meio oriental; sombras de asas extras na névoa |
| Mist Wolf | `mist_wolf` | O abraço das crianças tem mãos um pouco confusas |
| Kampfult | `plant_carnivorous` | Talvez mais de 6 tentáculos |
| Camprat | `rat_greyhawk` | Dentes longos demais, quase de sabre; biscoitos com cara moderna |
| Giant Raven | `raven_crow` | A asa esquerda parece ter duas camadas |
| Wood Giant | `wood_giant` | Cabeça menos desproporcional do que a ficha descreve |
| Bosk Giant | `bosk_giant` | Cabelo longo e solto, não em tufos como grama |
| Horax | `horax` | Cerca de 12 patas, difícil contar |
| Kagonesti | `elf_wild_kagonesti` | Visual próximo de indígenas norte-americanos, como a ficha descreve; vale olhar a sensibilidade |
| Minotaur (Krynn) | `minotaur_krynn` | O do salto parece ter cascos nos pés |
| Sea Dragon | `sea_dragon` | A bandeira do navio tem uma forma branca que pode lembrar parte de uma cruz |
| Kani Doll | `kani_doll` | Bonecos talvez um pouco maiores que 6 polegadas |
| Tinker Gnome | `tinker_gnome` | Orelhas pontudas (a ficha diz arredondadas) |
| Theiwar | `theiwar` | Orelhas pontudas |
| Yaggol | `yaggol` | Mãos com 4 dedos (a ficha diz 3) |
| Wyndlass | `wyndlass` | Uns 10 a 11 tentáculos, sem os dois grupos de cinco claros |
| Bakhna Rakhna | `bakhna_rakhna` | O lampião parece de querosene |
| Carrionette | `carrionette` | Ursinho de pelúcia anacrônico; boneco talvez maior que 1,5 pé |
| Ermordenung | `ermordenung` | A mão do homem paira logo acima do punho da espada embainhada |
| Feathered Serpent | `feathered_serpent` | Toucado dourado que a ficha não descreve |
| Gossamer | `gossamer` | As pequenas parecem maiores que 6 polegadas |
| Grim | `grim` | Parece maior que 2 pés na cernelha, quase um lobo |
| Half-Golem | `half_golem` | A cicatriz do rosto é discreta, menos horrível que a ficha descreve |
| Head Hunter | `head_hunter` | Estilo mais de pintura digital escura que aquarela |
| Hebi-No-Onna | `hebi_no_onna` | Crisântemo de 16 pétalas nas lanternas lembra o selo imperial japonês |
| Midnight Slasher | `madman_human` | Lâmina curta como adaga, não longa |
| Master Sea Spawn | `master_sea_spawn` | Mais bicho de quatro apoios que humanoide |
| Moor Man | `moor_man` | Orelhas pontudas |
| Ravenkin | `ravenkin` | Parecem maiores que 5 pés de envergadura |
| Red Widow | `red_widow` | Oito patas de aranha mais uma perna humana visível |
| Scarecrow (Ravenloft) | `scarecrow_ravenloft` | O poste do espantalho tem forma de cruz |
| Skin Thief | `skin_thief` | Não aparece a pele roubada usada como disfarce; mãos com 6 ou 7 dedos (a ficha diz 8) |
| Psionic Spirit | `spirit_psionic` | Traço mais limpo, menos aquarela |
| Thrax (Palik) | `thrax_palik` | A mão esquerda parece ter só 4 dedos |
| Vampire, Kender | `vampire_kender` | Tapeçaria com lua crescente |
| Voodan (Chicken Bone) | `voodan_human` | O cajado parece seguro de forma estranha na mão de cima |
| Werejackal | `werejackal` | Dentes claros, não de ébano |
| Werejaguar | `werejaguar` | O rosto também tem pelo (a ficha diz rosto e palmas sem pelo) |
| Greater Wolfwere | `wolfwere_greater` | O lobo não parece ter 5 a 6 pés na cernelha |
| Zombie Wolf | `zombie_wolf` | Nenhum lobo aparece com três patas (refeito sem feridas depois de bloqueio por violência) |

## Pendências de validação

- Validar o bloco 1 inteiro: `../forge-art/monsters/folha-bloco-01-N.jpg`.
- Validar o bloco 2 inteiro: `../forge-art/monsters/folha-bloco-02-N.jpg`.
- Validar o bloco 3 inteiro: `../forge-art/monsters/folha-bloco-03-N.jpg`.
- Validar o bloco 4 inteiro: `../forge-art/monsters/folha-bloco-04-N.jpg`; ressalvas menores em `block-04-log.md`.
- Validar o bloco 6 inteiro: `../forge-art/monsters/folha-bloco-06-N.jpg`; ressalvas em `block-06-log.md`.
- Validar o bloco 5 inteiro: `../forge-art/monsters/folha-bloco-05-N.jpg`; ressalvas em `block-05-log.md`.
- Validar o bloco 7 inteiro: `../forge-art/monsters/folha-bloco-07-N.jpg`; ressalvas em `block-07-log.md`.
- Validar o bloco 8 inteiro: `../forge-art/monsters/folha-bloco-08-N.jpg`; ressalvas em `block-08-log.md`.
- Validar o bloco 9 inteiro: `../forge-art/monsters/folha-bloco-09-N.jpg`; ressalvas em `block-09-log.md`.
- Validar o bloco 10 inteiro: `../forge-art/monsters/folha-bloco-10-N.jpg`; ressalvas em `block-10-log.md`.
- Validar o bloco 11 inteiro: `../forge-art/monsters/folha-bloco-11-N.jpg`; ressalvas em `block-11-log.md`.
- Validar o bloco 12 inteiro: `../forge-art/monsters/folha-bloco-12-N.jpg`; ressalvas em `block-12-log.md`.
- Validar o bloco 15 inteiro: `../forge-art/monsters/folha-bloco-15-N.jpg`; ressalvas em `block-15-log.md`.
- Validar o bloco 16 (5 imagens): ressalvas em `block-16-log.md`.
- Validar o bloco 17: `../forge-art/monsters/folha-bloco-17-N.jpg`; ressalvas em `block-17-log.md`.
  Atenção ao Fachan: o único braço saiu do ombro, não do meio do peito (candidato ao lápis).
- Validar o bloco 18: `../forge-art/monsters/folha-bloco-18-N.jpg`; ressalvas em `block-18-log.md`.
- Validar os blocos 19 e 20: `../forge-art/monsters/folha-bloco-19-N.jpg` e `folha-bloco-20-N.jpg`; ressalvas em `block-19-log.md` e `block-20-log.md`.
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
- Cena de noite ou interior em Athas: o sufixo do cenário pede o sol carmesim, então troque por
  "night scene, no sun" ou "indoor scene, no sky"; mesmo assim, "subterrâneo" sozinho ainda saiu
  com céu.
- O `--dry-run` de `add-monster-image.mjs` deixa `.preview.webp` na pasta atual; rodar fora do repo.
| Shalarin | `shalarin` | Humanos comuns nadando ao fundo, sem magia aparente para respirar |
| Roc (Zakhara) | `roc_zakharan` | Parece pequeno; a perspectiva não mostra o tamanho colossal |
| Kamatlan | `kamatlan` | Só duas cobras visíveis; a ficha pede duas em cada ombro |
