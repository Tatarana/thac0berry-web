# The Forge — ilustrações

Arte do construtor de personagem (`docs/criacao-de-personagem.md`). Cada
arquivo vai em `public/images/forge/` com o nome exato abaixo (`.webp`); o card
mostra a silhueta "Art coming" até o arquivo existir e troca sozinho depois.

Desde a v0.130.0, o admin também troca as imagens navegando pelo app: o lápis nos
cards e nas faixas de armas abre o painel de versões (`src/components/SiteImageEdit.tsx`).
A imagem enviada é convertida para WebP e recortada no tamanho do slot. Vale a versão
atual; sem versão, o arquivo do repo. As versões ficam no Supabase (tabela
`site_image_version`); desde a v0.131.0 os arquivos ficam num bucket S3 atrás do
CloudFront (`SITE_IMAGES_BASE_URL` em `src/config.ts`), não mais no bucket `site-images`
do Supabase, que continua intacto como backup. O envio passa pela Edge Function
`site-image-upload` do backend (URL assinada, PUT direto ao S3). Desenho e passo a passo:
`thac0berry-backend/docs/imagens-fora-do-supabase.md` e `infra/site-images/README.md`.

Estilo de todas: ilustração de livro de histórias, traço a nanquim com estilo
fortemente realista, cara de RPG (revisto pelo usuário em 2026-11-03, a partir
do prompt do anão); personagem vivo no seu mundo (como
`public/images/mode_player.jpg`). Nunca medalhão, moeda ou relevo.

Formato das raças e classes: **vertical 3:4, 896×1200** (o card é 3:4). Mande
cada imagem como mensagem normal na conversa (não enquanto o Claude estiver
trabalhando) para ela ser salva em disco.

**Uma imagem por gênero, com cenas diferentes.** A raça aparece no gênero
escolhido na etapa 2: `race-<raça>-male.webp` e `race-<raça>-female.webp`. Cada
gênero tem o seu prompt, com outro lugar, arma e atitude: o elfo atira com o arco
na floresta, a elfa espreita com adagas mágicas atrás de uma coluna. Estilo,
enquadramento e traços da raça são os mesmos. Enquanto só existir uma, o app usa
`race-<raça>.webp` (sem gênero) se houver; senão mostra a silhueta. O modron não
tem sexo: um arquivo só. As classes seguem a mesma regra
(`class-<classe>-male.webp` / `-female.webp`, ou `class-<classe>.webp` para os dois).

O retrato do herói é mais específico: cada combinação de raça, classe e gênero tem imagem
própria (`combo-<raça>-<classe>-<gênero>`). A lista está na seção de combinações.

## Feitas

- [x] `gender-male.webp`
- [x] `gender-female.webp`
- [x] `race-human-male.webp`

## Raças (etapa 3)

- [ ] **race-human-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human adventurer with a sword at her hip and a rolled map in one hand, leaping from a rowboat onto a wooden pier, bold and laughing, her dark red cloak flying, in a busy harbor at sunrise with tall ships and gulls overhead. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm wooden planks with no important details. No text, no signature, no watermark, no frame, no border.
  ```

- [ ] **race-dwarf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf with a braided red beard, laughing while hammering a glowing blade on an anvil, in an underground forge hall lit by rivers of lava. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-dwarf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf with thick copper braids and a battered rune-carved shield, swinging a heavy war axe with a fierce grin, holding a narrow torchlit mine tunnel with timber supports and veins of silver in the rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-elf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf with long pointed ears drawing a longbow, calm and focused, in an ancient moonlit forest with softly glowing leaves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-elf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf with long pointed ears, gripping two glowing enchanted daggers, peering out from behind a weathered stone column, tense and ready to strike, in an overgrown elven ruin at twilight with silver mist between the broken arches. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-gnome-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small male gnome with a big nose and a mischievous grin, conjuring a sparkling illusion between his hands, in a cluttered tinker's workshop full of gadgets, gears and books. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-gnome-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small female gnome with a big nose, windblown curly hair and brass goggles pushed up on her forehead, crossing a rope bridge between giant mushrooms with a clever little crossbow in her hands and a tame badger at her heels, in a deep sunlit forest gully. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mossy ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-elf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf with subtly pointed ears, mixing elven grace and human weathered warmth, leading a saddled horse by the reins and raising a hand in greeting, on an old stone bridge over a river between a walled town and a dark forest in the morning. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm cobblestone with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-elf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf with subtly pointed ears, mixing elven grace and human warmth, playing a lute while sitting on a rock at a crossroads where a forest meets farmland at sunset. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-halfling-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling with curly hair and bare feet, sneaking away with a stolen apple and a wink, in an orchard beside cozy round-door homes in green hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-halfling-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling with curly hair and bare feet, hurling a sling stone from the prow of a small river barge, laughing, her skirts tied up for action, on a wide slow river at golden hour with reeds and willows on the banks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm wooden deck with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-aasimar-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar with a soft radiant glow around his head and luminous eyes, raising a shining sword of light and shielding a fallen traveler, on a storm-swept mountain pass with dark clouds breaking apart above him. Alive, resolute and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rocky ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-aasimar-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar with a soft radiant glow around her head and luminous eyes, healing light shining from one open hand, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or clouds with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-bariaur-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur from Planescape: the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, galloping joyfully across a wide grassy plain of the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Character centered from head to hooves; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-bariaur-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur from Planescape: the upper body of a woman joined to the four-legged body of a ram, with no horns, long braided hair, reading a glowing spell scroll while walking through a ring of ancient standing stones on a misty hilltop of the Outer Planes at twilight. Alive and in motion, expressive face. Character centered from head to hooves; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-air-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male air genasi with pale blue skin and white hair that floats as if underwater, levitating lightly above a cliff top while wind swirls around, clouds racing past. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rock or cloud with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-air-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female air genasi with pale blue skin and white hair that floats as if underwater, standing at the bow of a flying skyship and pulling a gust of wind into its sails with both hands, high above a sea of golden sunset clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm wooden deck with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-earth-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy male earth genasi with gray stone-textured skin and small crystals growing in the hair, resting a hand on a cavern wall that responds to the touch, in a cave full of glowing gems. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-earth-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy female earth genasi with gray stone-textured skin and small crystals growing in her hair, raising a wall of jagged rock from the ground with a sweep of both arms, in a dry canyon of red cliffs under a harsh midday sun. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm cracked ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-fire-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male fire genasi with ember-red skin and hair that flickers like living flame, playfully juggling small balls of fire, in a volcanic landscape with glowing lava under a smoky orange sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dark rock with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-fire-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female fire genasi with ember-red skin and hair that flickers like living flame, whirling a chain wrapped in fire in a blazing arc, in the ruined courtyard of a burned-out desert fortress at night under a sky full of sparks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm scorched flagstone with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-water-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi with blue-green skin and long hair that drips and flows like water, rising from the sea at the edge of a rocky shore with a wave curling behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm water with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-water-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi with blue-green skin and long hair that drips and flows like water, walking calmly through the rain with a trident of living water in one hand, on a flooded street of a sunken coastal city with half-drowned towers and hanging lanterns. Alive, poised and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm shallow water with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-githzerai-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean male githzerai monk with yellowish skin, pointed ears and a topknot, meditating in mid-air on a floating rock while the chaotic colors of Limbo swirl around. Alive, calm and powerful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm floating rock with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-githzerai-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean female githzerai warrior with yellowish skin, pointed ears and a long braid, leaping forward with a silver blade in a flying strike, on a shifting bridge of raw chaos stuff that forms under her feet inside a fortress of Limbo, unstable towers bending in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-modron.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rogue modron from Planescape: a small, round clockwork-like being with a single large eye, little wings and thin arms and legs, curiously stepping off a giant rotating gear into the world for the first time, in the vast clockwork plane of Mechanus. Alive and full of curiosity. Character centered; the bottom fifth of the image is a calm gear surface with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-tiefling-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male tiefling with curved horns, a pointed tail and a confident smirk, flipping a coin, in a lantern-lit fantasy city of strange arches, portals and planar travelers. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-tiefling-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female tiefling with curved horns, a pointed tail and piercing eyes, slipping out of a glowing portal with a stolen book under one arm and a thin rapier in the other hand, in a shadowy planar library of endless spiral shelves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm tiled floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-vistani-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani traveler with a colorful headscarf and coin jewelry, reading tarot cards by a campfire, in a caravan camp of painted wagons in a misty dark forest. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-vistani-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani traveler with a colorful headscarf and coin jewelry, driving a painted wagon at full speed along a misty mountain road, reins in one hand and a lantern held high in the other, a gothic castle on the cliff behind her. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dirt road or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```

## Raças de Dark Sun (etapa 3)

As 10 raças jogáveis de Athas, com cena e gênero próprios. As cinco sub-raças (Athasian
Human, Elf, Dwarf, Half-Elf, Halfling) deixam de usar a imagem da raça-base do Livro do Jogador.

Geradas em 2026-11-27 pelo ChatGPT (originais 1086×1448 em `forge-art/race-<raça>-<gênero>.png`, com
backup no bucket privado em `forge/`). Publicar com `scripts/add-forge-image.mjs <nome> <arquivo>`
(credenciais de `~/.thac0berry/monster-art-upload.env` no ambiente; o usuário IAM
`thac0berry-monster-art` grava em `monster/*`, `deity/*` e `forge/*` desde 2026-11-27). As 20 estão
publicadas (versão 1) e aparecem nos cards do Forge. Detalhes aceitos: os
halflings saíram com orelhas pontudas (o livro só diz que têm proporções humanas e rosto de criança);
o estilo é mais aquarelado que o das 17 raças antigas, puxado pela paleta de Athas.

- [ ] **race-athasian-human-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian human, sun-bronzed and weathered, with a short dark beard, a bone-plated shoulder guard over leather wraps, swinging a wooden sword edged with black obsidian shards to defend a wagon caravan on a cracked white salt flat. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm cracked salt ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-human-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian human, sun-bronzed, in a hooded sand-colored cloak over leather wraps, leaping between the flat mudbrick rooftops of a walled city-state with a stolen water skin over her shoulder and a bone dagger in her hand, a stepped ziggurat in the distance. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mudbrick rooftop with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-elf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian elf, very tall and lean (7 feet), long-limbed and wiry with hard muscles, a sun-baked, wind-carved chiseled face and pointed ears, wearing dark protective desert clothing painted in dune camouflage, running at full speed across the sand dunes with a long obsidian-tipped spear, other elves of his tribe running behind him. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rippled sand with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-elf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian elf, very tall and lean (7 feet), long-limbed and wiry, with a sun-baked, wind-carved chiseled face, pointed ears and long braided hair, wearing dark protective desert clothing painted in rock camouflage, drawing a long bow from a rocky ridge above a distant caravan at dusk. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm flat rock with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-dwarf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian dwarf, 4 and a half feet tall, completely bald and hairless with no beard, massively over-muscled with huge hands and feet, deep copper-tanned calloused skin and deep-set watchful eyes, grimly heaving a great carved stone block onto a half-rebuilt temple wall, sweat on his brow. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dusty ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-dwarf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian dwarf, 4 and a half feet tall, completely bald and hairless, massively muscled with huge hands, deep copper-tanned calloused skin and deep-set eyes, swinging a heavy stone-headed war maul as she guards a stone well in a narrow desert ravine. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stony ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-half-elf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian half-elf, tall and lean, a lone wanderer with a human face, slightly pointed ears and a short beard, wrapped in a patched desert cloak, a desert hawk landing on his leather-wrapped forearm on a windswept mesa, his bone knife at his belt. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm windswept rock with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-half-elf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian half-elf, tall and lean, with a human face, slightly pointed ears and dark tied-back hair, in leather wraps and a scarf over her mouth, climbing a red canyon wall with a rope and bone climbing hooks, looking back over her shoulder. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm canyon floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-halfling-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian halfling, 3 and a half feet tall, wiry and muscular, proportioned like a human with a face like a human child, wild hair, tribal paint and bone ornaments, leaping between giant mossy branches with a blowgun to his lips, in the lush steaming jungle of the Forest Ridge. Athas, the Dark Sun setting: the rare green jungle of the Forest Ridge, mist and vines in filtered red light. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mossy ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-halfling-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian halfling, 3 and a half feet tall, wiry and muscular, proportioned like a human with a face like a human child, feathers braided into her hair and tribal paint, crouched on a mossy boulder by a jungle waterfall, whirling a sling. Athas, the Dark Sun setting: the rare green jungle of the Forest Ridge, mist and vines in filtered red light. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mossy ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-aarakocra-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male Athasian aarakocra, a 7-foot birdlike humanoid that looks like a huge vulture, black plumage with a white collar, a large hooked beak covering most of the head, black eyes set in front, taloned bird legs and a 20-foot wingspan; each wing has a small hand at its midpoint with three fingers and a thumb, gripping a javelin as he dives from the sky over red mesas. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly two wings with one small hand each and two taloned legs, no separate arms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rocky ground far below with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-athasian-aarakocra-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female Athasian aarakocra, a 7-foot birdlike humanoid that looks like a huge vulture, brown and black plumage, a large hooked beak covering most of the head, black eyes set in front, taloned bird legs, landing with wings half spread on a nest of branches atop a tall rock spire at dawn; each wing has a small hand at its midpoint with three fingers and a thumb, holding a bundle of javelins. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly two wings with one small hand each and two taloned legs, no separate arms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rock with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-half-giant-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-giant of Athas, 11 feet tall and enormously broad, a simple heavy human face with a wide jaw, shaved head, crude leather harness and bone armlets, striding through a howling dust storm with a huge bone club on his shoulder, a tiny human caravan guard beside his knee for scale. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sand with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-half-giant-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-giant of Athas, 11 feet tall and enormously strong, a broad human face with braided hair, crude leather wraps and bone jewelry, lifting a sand-stuck wooden wagon by one wheel while a small human trader cheers beside her for scale. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sand with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-mul-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male mul of Athas, half-dwarf half-human, 6 and a half feet tall, lean and extremely muscular, completely bald and hairless, fair coppery skin, a human face with heavier brow ridges and pointed ears swept back against the head, slave tattoos on his arms, a leather loincloth and arm wraps, fighting as a gladiator in a sand arena with an obsidian blade and a bone shield before a roaring crowd. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm arena sand with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-mul-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female mul of Athas, half-dwarf half-human, 6 and a half feet tall, lean and extremely muscular, completely bald and hairless, fair coppery skin, a human face with heavier brow ridges and pointed ears swept back against the head, slave tattoos, breaking a heavy chain apart with her bare hands as she escapes through an arena gate into the open desert. Athas, the harsh dying desert world of the Dark Sun setting, at night: the sun is NOT in the sky, only stars and Athas' two moons. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sand with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-pterran-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male pterran of Athas, a 6-foot humanoid pteranodon with light brown scaly skin, a long toothy snout and large almost bulbous eyes, two arms with clawed hands, two legs, a short tail-like appendage and two rounded stubs on his back where wings would be, wearing bone ornaments, hunting with a stone-tipped spear through the rocky scrubland of the Hinterlands. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly two arms, two clawed hands, two legs, no wings. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm scrubby rock with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-pterran-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female pterran of Athas, a 6-foot humanoid pteranodon with light brown scaly skin, a long toothy snout and large almost bulbous eyes, two arms with clawed hands, two legs, a short tail-like appendage and two rounded stubs on her back where wings would be, wearing woven reed garments and bone ornaments, raising a saw-toothed wooden sword as she leaps from a rock in a forest at the edge of the mountains. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly two arms, two clawed hands, two legs, no wings. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm forest ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-thri-kreen-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male thri-kreen of Athas, a mantis warrior 7 feet tall and 11 feet long, with a tough sandy-yellow chitin exoskeleton, a mantis-like head with large compound eyes, mandibles and two antennae, standing on two legs, with exactly four arms ending in clawed hands; he leaps across a dry savanna while hurling a crystal throwing wedge (chatkcha) with one upper hand. Athas, the harsh dying desert world of the Dark Sun setting, under a bloated crimson sun in a hazy yellow-green sky. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly six limbs: two legs and four arms; no extra legs. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dry grass with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-thri-kreen-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female thri-kreen of Athas, a mantis warrior 7 feet tall and 11 feet long, with a tough sandy-yellow chitin exoskeleton, a mantis-like head with large compound eyes, mandibles and two antennae, standing on two legs, with exactly four arms ending in clawed hands; her two upper hands grip a long polearm with a crescent blade at each end (gythka) as she stalks prey across a dry steppe. Athas, the harsh dying desert world of the Dark Sun setting, at night: the sun is NOT in the sky, only stars and Athas' two moons. Clothing of leather, cloth wraps and bone ornaments; weapons of obsidian, bone, stone and wood, almost no metal. Exactly six limbs: two legs and four arms; no extra legs. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dry ground with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```

## Raças do Ethereal Plane, do Sea of Fallen Stars e Half-Greyhawk Dragon (etapa 3)

As 8 raças jogáveis que ainda caíam na raça-base ou em "Art coming": Nathri e Nethling
(A Guide to the Ethereal Plane), as 5 do Sea of Fallen Stars e o Half-Greyhawk Dragon (Dragon #206).

- [ ] **race-nathri-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male nathri, a small, wiry humanoid native of the Ethereal Plane, only 4 feet tall, slender and quick, with smooth mottled grey-violet skin, a narrow face with large dark almond eyes and small pointed ears, a short curved venomous barb growing from the back of the right hand, wearing close-fitting grey leather and a hooded cloak that fades into mist, darting between drifting ethereal curtains with a short sword in his left hand, the barb on his right fist raised to strike. The Ethereal Plane of the Planescape setting: an endless misty silver-blue void of swirling ether, drifting curtains of colored fog (ethereal curtains) and faint ghostly shapes of the material world. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm silver mist with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-nathri-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female nathri, a small, wiry humanoid native of the Ethereal Plane, only 4 feet tall, slender and quick, with smooth mottled grey-violet skin, a narrow face with large dark almond eyes and small pointed ears, a short curved venomous barb growing from the back of the right hand, wearing close-fitting grey leather and a hooded cloak that fades into mist, crouched on a floating fragment of rock, peering through a thinning curtain of mist toward a faint material-world city, a dagger in her left hand. The Ethereal Plane of the Planescape setting: an endless misty silver-blue void of swirling ether, drifting curtains of colored fog (ethereal curtains) and faint ghostly shapes of the material world. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm silver mist with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-nethling-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male nethling, a child of Neth the living demiplane that has taken a humanoid form: a tall humanoid with smooth, slightly glossy pearl-grey skin like living wax, subtle ripples running across the surface, a calm, almost-perfect but slightly unfinished human face with pale silver eyes, simple grey traveler's clothes; he stretches out his right hand and its palm glistens with a faint acid sheen, the fingertips of that hand subtly melting, as he steps forward through the mist. The Ethereal Plane of the Planescape setting: an endless misty silver-blue void of swirling ether, drifting curtains of colored fog (ethereal curtains) and faint ghostly shapes of the material world. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm silver mist with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-nethling-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female nethling, a child of Neth the living demiplane that has taken a humanoid form: a tall humanoid with smooth, slightly glossy pearl-grey skin like living wax, subtle ripples running across the surface, a calm, almost-perfect but slightly unfinished human face with pale silver eyes, simple grey traveler's clothes; her form is still settling, a faint ripple passing across her cheek and arm, as she studies an open spellbook with curiosity while floating through the mist. The Ethereal Plane of the Planescape setting: an endless misty silver-blue void of swirling ether, drifting curtains of colored fog (ethereal curtains) and faint ghostly shapes of the material world. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; anyone else in the scene too. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm silver mist with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-aquatic-elf-sea-of-fallen-stars-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male aquatic elf (sea elf) of Serôs, slender, with pale blue-green skin, fine gill slits on the sides of his neck, webbed fingers, long pointed ears and long dark green hair floating in the water like kelp, wearing a coral-studded harness and silverweave armor, swimming fast with a trident through a kelp forest. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sandy sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-aquatic-elf-sea-of-fallen-stars-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female aquatic elf (sea elf) of Serôs, slender, with pale blue-green skin, fine gill slits on the sides of her neck, webbed fingers, long pointed ears and long silver-green hair floating in the water, wearing a shell and pearl circlet and silverweave armor, gliding past a glowing coral city with a long spear. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sandy sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-aquatic-half-elf-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male aquatic half-elf of Serôs, a human face with slightly pointed ears, faint gill slits on his neck and lightly webbed fingers, sun-tanned skin with a slight green tint, dark hair, a dagger at his belt and a net over his shoulder, swimming up from the depths toward the shimmering surface where a ship hull floats above. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm deep blue water with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-aquatic-half-elf-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female aquatic half-elf of Serôs, a human face with slightly pointed ears, faint gill slits on her neck and lightly webbed fingers, light skin with a slight green tint, long auburn hair floating in the water, blowing a carved conch shell like a horn as a school of silver fish swirls around her among sunken ship ruins. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sandy sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-noble-malenti-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male noble malenti of Serôs: born to the sahuagin but looking almost exactly like a sea elf, slender with blue-green skin, pointed ears, gill slits and webbed hands, but with subtle sahuagin traits: a faint pattern of tiny scales along his jaw and forearms, small sharp teeth and cold dark eyes; wearing a harness of black coral and sharkskin, gripping a trident in a dark trench lit by glowing jellyfish. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dark rocky sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-noble-malenti-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female noble malenti of Serôs: born to the sahuagin but looking almost exactly like a sea elf, slender with blue-green skin, pointed ears, gill slits and webbed hands, but with subtle sahuagin traits: a faint pattern of tiny scales along her neck and shoulders, small sharp teeth and dark eyes; wearing pearl armor, she turns away from a sahuagin war band in the gloom behind her and swims toward the light, a spear in hand. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rocky sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-shalarin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male shalarin of Serôs, a humanoid sea dweller with smooth iridescent turquoise and gold skin like a tropical fish, large round dark eyes, gill slits on the neck, a tall fan-like dorsal fin running down his back and a finned crest on his head instead of hair, webbed hands and finned forearms, wearing pearl armor that leaves the dorsal fin free, swimming with a trident above a bright coral reef. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm coral sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-shalarin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female shalarin of Serôs, a humanoid sea dweller with smooth iridescent violet and rose skin like a tropical fish, large round dark eyes, gill slits on the neck, a tall fan-like dorsal fin running down her back and a delicate finned crest on her head instead of hair, webbed hands and finned forearms, wearing silverweave armor, holding a glowing pearl and leading dolphins through a lagoon of coral towers. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Normal anatomy: exactly two arms, two webbed hands with five fingers each (thumb included), two legs; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm coral sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-triton-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male triton of Serôs, a powerful humanoid with silvery-blue skin and deep blue hair, a noble face, gills, legs ending in broad flipper-like feet, wearing shimmering silverweave armor (no scale armor), commanding with a long trident and a coiled conch horn at his belt, riding the current before a great domed undersea citadel. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Exactly two arms, two webbed hands with five fingers each (thumb included), two legs ending in flipper feet; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sandy sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-triton-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female triton of Serôs, a strong humanoid with silvery-blue skin and long deep blue hair, gills, legs ending in broad flipper-like feet, wearing silverweave armor, casting a weighted net with one hand and holding a tapal (a short curved hooked blade) in the other, swimming among the pillars of a sunken temple. Deep under the Sea of Fallen Stars (Serôs) in the Forgotten Realms: blue-green water, shafts of light from far above, coral, kelp forests and drifting bubbles; everything is underwater. Exactly two arms, two webbed hands with five fingers each (thumb included), two legs ending in flipper feet; no fish tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sandy sea floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-half-greyhawk-dragon-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young male half-Greyhawk dragon, son of a Greyhawk dragon and a human mother: human-shaped and 6 feet tall, with patches of fine pewter-silver dragon scales along his cheekbones, neck and forearms, golden slit-pupiled reptilian eyes, two small swept-back silver horns, talon-like nails, a scholar-warrior in a long traveling coat with a longsword, studying an old map spread on a rock on a windy hilltop above the Free City of Greyhawk. The World of Greyhawk setting: a grey-walled medieval city on a river far below, cloudy daylight, wild hills. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; no wings, no tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm grassy hilltop with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```
- [ ] **race-half-greyhawk-dragon-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female half-Greyhawk dragon, daughter of a Greyhawk dragon and an elf mother: slender, 5 and a half feet tall, slightly pointed ears, patches of fine pewter-silver dragon scales on her temples, collarbones and the backs of her hands, golden slit-pupiled reptilian eyes, two small silver horns, talon-like nails, a faint silver mist curling from her lips, wearing a mage robe for travel and holding a staff in an ancient ruined library. The World of Greyhawk setting: dusty shafts of light through broken stone arches, shelves of old books. Normal anatomy: exactly two arms, two hands with five fingers each (thumb included), two legs; no wings, no tail. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No grey-bearded wizard. No text, absolutely no signature, initials or writing anywhere, including the corners, no watermark, no frame, no border.
  ```

## Classes (etapa 4)

- [ ] **class-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A battle-ready male fighter in chainmail with a round shield and a raised sword, charging forward with a war cry across a misty battlefield with banners in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A battle-ready female fighter in scale armor with a long two-handed sword, standing alone at a narrow mountain pass and bracing against a charge, the wind whipping her cloak, snow peaks behind her. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rocky ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-paladin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A noble male paladin in shining plate armor and a white tabard, holding up a sword that glows with holy light, standing protectively before frightened villagers at the gate of a small chapel. Alive, determined and kind, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-paladin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A noble female paladin in shining plate armor and a blue tabard, kneeling in prayer with both hands on a sword planted in the ground, rays of dawn light breaking through the broken roof of a ruined cathedral around her. Alive, devout and determined, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A hooded male ranger with a longbow, kneeling to read animal tracks beside a loyal wolf companion, in a deep wild forest at dawn. Alive, alert and focused, expressive face. Character centered from head to knees; the bottom fifth of the image is calm forest floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female ranger with a short bow slung on her back and a hunting spear in hand, leaping across a rushing mountain river from stone to stone, a hawk diving alongside her, in a wild pine valley at sunset. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm river stone with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male wizard in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in a tall tower study full of books, candles and arcane instruments. Alive and in motion, expressive face full of wonder. Character centered from head to knees; the bottom fifth of the image is calm floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female wizard in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air inside a vast summoning circle, in a torchlit underground vault of ancient statues. Alive and in motion, expressive face full of concentration. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male cleric in armor and vestments raising a glowing holy symbol, a mace at the hip, driving back shadowy undead at the entrance of an old crypt. Alive, brave and faithful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female cleric in vestments and a light mail shirt, a mace at the hip, kneeling to heal a wounded soldier with glowing hands, in a smoky field hospital tent at the edge of a battle, lanterns swaying. Alive, compassionate and faithful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm trodden ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-druid-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male druid with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture in a sacred grove of ancient standing stones. Alive and serene, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mossy ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-druid-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female druid in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, on a windswept moor with lightning on the horizon. Alive and powerful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm heather with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A nimble male thief in a dark hooded cloak, crouched on a city rooftop at night, twirling a picked lock and grinning, a sack of loot over the shoulder. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rooftop tiles with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A nimble female thief in fitted dark leathers, hanging by one hand from a rope inside a treasure vault, reaching for a jeweled idol above a floor of pressure plates, a thin candle-lit smile on her face. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dark stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A charismatic male bard in a feathered hat, playing a lute and singing on a table, in a crowded, lively tavern where the patrons cheer and raise their mugs. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is a calm tabletop with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A charismatic female bard in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand, on a marble stage in a torchlit noble hall before spellbound lords and ladies. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is a calm stage floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ninja-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male ninja in dark clothing with a short sword on the back, leaping silently between the curved rooftops of a pagoda town in Kara-Tur under a full moon, cherry blossoms drifting. Alive and in motion. Character centered from head to knees; the bottom fifth of the image is calm rooftop with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ninja-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female ninja disguised as a court attendant in a pale silk robe, drawing a hidden blade from her sleeve behind a paper screen, in a Kara-Tur palace at night, lantern light and the shadow of a guard on the screen. Alive, tense and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm polished wooden floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male psionicist with a calm, focused face and a softly glowing aura around the head, making stones and books float in the air with the power of the mind, in a quiet mountain monastery courtyard. Alive and intense, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female psionicist with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a crumbling desert ruin under a pale sun. Alive and intense, expressive face. Character centered from head to knees; the bottom fifth of the image is calm sand with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-anchorite-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male anchorite, a devoted hermit priest of Ravenloft in a simple hooded robe, holding up a lantern and a holy symbol to keep the mist at bay, in a gothic graveyard with a ruined chapel. Alive, steadfast and watchful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-anchorite-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female anchorite, a devoted hermit priestess of Ravenloft in a simple gray hooded robe, kneeling inside a small circle of candles and salt and reading aloud from a worn prayer book while pale ghostly hands reach in from the dark, in a cold stone cell of a remote abbey. Alive, steadfast and unafraid, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-gypsy-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male traveling fortune-teller and performer of Ravenloft in colorful layered clothes, dancing with a tambourine around a campfire while painted wagons wait in the misty forest behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-gypsy-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female traveling fortune-teller of Ravenloft in colorful layered clothes and a coin-trimmed shawl, gazing into a glowing crystal ball with one hand raised in warning, inside a candlelit painted wagon hung with herbs and charms. Alive, mysterious and intense, expressive face. Character centered from head to knees; the bottom fifth of the image is a calm woven rug with no important details. No text, no signature, no watermark, no frame, no border.
  ```

## Combinações de raça, classe e gênero (retrato do herói)

São 173 imagens, uma por combinação de uma classe permitida na regra.
Formato igual ao das classes: **vertical 3:4, 896×1200**. Não vão para o repo: envie
pelo lápis do card de classe, com a raça e o gênero já escolhidos no Forge. Sem a
imagem, o app mostra a da classe e, depois, a da raça, então dá para gerar aos poucos.

Regras: multiclasse usa a imagem da classe principal. Quem só entra por kit (Bard
Dwarf, Elf, Gnome e Halfling) fica fora da lista e sem imagem, porque a genérica mostra
um humano. O modron não
tem sexo, e a Bariaur já tem o sexo na raça, então não repetem o gênero no nome.

Ordem sugerida: Human, Elf e Dwarf nas classes principais; depois as demais raças do
Livro do Jogador; por fim as de Planescape e Ravenloft.

### Human

- [ ] **combo-human-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human fighter with a short dark beard and a weathered face, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a busy harbor at sunrise with tall ships and gulls overhead. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human fighter with sharp eyes and windblown auburn hair, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, on the walls of a stone castle at dawn with banners snapping. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-paladin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human paladin with a short dark beard and a weathered face, in shining plate armor and a white tabard, holding up a sword that glows with holy light and standing protectively before frightened villagers, on the walls of a stone castle at dawn with banners snapping. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-paladin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human paladin with sharp eyes and windblown auburn hair, in shining plate armor and a blue tabard, kneeling in prayer with both hands on a sword planted in the ground as rays of light fall around her, in a crowded market square of a walled town at midday. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human ranger with a short dark beard and a weathered face, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, on a heather moor under a heavy sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human ranger with sharp eyes and windblown auburn hair, with a short bow slung on her back and a hunting spear in hand, leaping from stone to stone as a hawk dives alongside her, in a deep wild forest at dawn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human wizard with a short dark beard and a weathered face, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in the torchlit hall of an old keep. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human wizard with sharp eyes and windblown auburn hair, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, at the gate of a small chapel on the edge of a village. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human cleric with a short dark beard and a weathered face, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, at the entrance of an old crypt under a stone chapel. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human cleric with sharp eyes and windblown auburn hair, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a smoky field hospital tent at the edge of a battle, lanterns swaying. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-druid-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human druid with a short dark beard and a weathered face, with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture, on a heather moor under a heavy sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-druid-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human druid with sharp eyes and windblown auburn hair, in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, in a deep wild forest at dawn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human thief with a short dark beard and a weathered face, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a busy harbor at sunrise with tall ships and gulls overhead. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human thief with sharp eyes and windblown auburn hair, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, on the walls of a stone castle at dawn with banners snapping. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human bard with a short dark beard and a weathered face, in a feathered hat, playing a lute and singing with one boot up on a barrel while a small crowd cheers, on the walls of a stone castle at dawn with banners snapping. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human bard with sharp eyes and windblown auburn hair, in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand before a spellbound audience, in a crowded market square of a walled town at midday. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-ninja-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human ninja with a short dark beard and a weathered face, in dark clothing with a short sword on his back, leaping silently from the shadows, in a crowded market square of a walled town at midday. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-ninja-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human ninja with sharp eyes and windblown auburn hair, disguised as an attendant in a pale silk robe, drawing a hidden blade from her sleeve, in the torchlit hall of an old keep. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human psionicist with a short dark beard and a weathered face, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, in the torchlit hall of an old keep. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human psionicist with sharp eyes and windblown auburn hair, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, at the gate of a small chapel on the edge of a village. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-anchorite-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human anchorite with a short dark beard and a weathered face, in a simple hooded robe, a devoted hermit priest holding up a lantern and a holy symbol to keep the mist at bay, in a gothic graveyard with a ruined chapel. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-anchorite-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human anchorite with sharp eyes and windblown auburn hair, in a simple gray hooded robe, a devoted hermit priestess kneeling inside a small circle of candles and salt, reading aloud from a worn prayer book while pale ghostly hands reach in from the dark, in a cold stone cell of a remote abbey. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-gypsy-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rugged male human fortune-teller with a short dark beard and a weathered face, in colorful layered clothes, a traveling performer dancing with a tambourine around a campfire, in a caravan camp in a misty dark forest with painted wagons waiting behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-human-gypsy-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human fortune-teller with sharp eyes and windblown auburn hair, in colorful layered clothes and a coin-trimmed shawl, gazing into a glowing crystal ball with one hand raised in warning, inside a candlelit painted wagon hung with herbs and charms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Dwarf

- [ ] **combo-dwarf-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf fighter with a braided red beard, in chainmail with a round shield and a raised sword, charging forward with a war cry, in an underground forge hall lit by rivers of lava. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf fighter with thick copper braids, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a narrow torchlit mine tunnel with timber supports and veins of silver in the rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf cleric with a braided red beard, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a dark tomb of ancestor kings carved deep under the mountain. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf cleric with thick copper braids, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a torchlit dwarven shrine. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf thief with a braided red beard, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a vast carved dwarven hall of stone pillars and ancestor statues. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf thief with thick copper braids, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, at the great rune-carved gate of a mountain stronghold. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-ninja-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf ninja with a braided red beard, in dark clothing with a short sword on his back, leaping silently from the shadows, in an underground forge hall lit by rivers of lava. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-ninja-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf ninja with thick copper braids, disguised as an attendant in a pale silk robe, drawing a hidden blade from her sleeve, in a narrow torchlit mine tunnel with timber supports and veins of silver in the rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky male dwarf psionicist with a braided red beard, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, in a narrow torchlit mine tunnel with timber supports and veins of silver in the rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-dwarf-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky female dwarf psionicist with thick copper braids, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a vast carved dwarven hall of stone pillars and ancestor statues. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Elf

- [ ] **combo-elf-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf fighter with long pointed ears and ageless features, in chainmail with a round shield and a raised sword, charging forward with a war cry, in an overgrown elven ruin at twilight with silver mist between the broken arches. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf fighter with long pointed ears and silver-pale hair, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, on a graceful bridge of living wood high among giant trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf ranger with long pointed ears and ageless features, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, in an ancient moonlit forest with softly glowing leaves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf ranger with long pointed ears and silver-pale hair, with a short bow slung on her back and a hunting spear in hand, leaping from stone to stone as a hawk dives alongside her, beside a misty forest waterfall at dawn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf wizard with long pointed ears and ageless features, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in a hall of woven branches lit by soft glowing leaves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf wizard with long pointed ears and silver-pale hair, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in an overgrown elven ruin at twilight with silver mist between the broken arches. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf cleric with long pointed ears and ageless features, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, at a moss-covered elven barrow beneath ancient trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf cleric with long pointed ears and silver-pale hair, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a quiet moonlit shrine of white stone among the trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf thief with long pointed ears and ageless features, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a moonlit elven garden of white stone and still pools. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf thief with long pointed ears and silver-pale hair, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, in a hall of woven branches lit by soft glowing leaves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender male elf psionicist with long pointed ears and ageless features, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, on a graceful bridge of living wood high among giant trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-elf-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender female elf psionicist with long pointed ears and silver-pale hair, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a moonlit elven garden of white stone and still pools. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Gnome

- [ ] **combo-gnome-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small male gnome fighter with a big nose and a mischievous grin, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a cluttered tinker's workshop full of gadgets, gears and books. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small female gnome fighter with a big nose, curly hair and brass goggles pushed up on her forehead, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a snug burrow hall with round doors and hanging lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small male gnome cleric with a big nose and a mischievous grin, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, at the sealed door of a burial burrow under the hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small female gnome cleric with a big nose, curly hair and brass goggles pushed up on her forehead, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a snug hillside shrine crowded with small votive lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small male gnome thief with a big nose and a mischievous grin, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a crystal-lit gem mine below the hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small female gnome thief with a big nose, curly hair and brass goggles pushed up on her forehead, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, at a busy little workshop market carved into a hillside. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small male gnome psionicist with a big nose and a mischievous grin, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, in a snug burrow hall with round doors and hanging lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-gnome-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small female gnome psionicist with a big nose, curly hair and brass goggles pushed up on her forehead, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a crystal-lit gem mine below the hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Half-Elf

- [ ] **combo-half-elf-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf fighter with subtly pointed ears, mixing elven grace and human weathered warmth, in chainmail with a round shield and a raised sword, charging forward with a war cry, on an old stone bridge over a river between a walled town and a dark forest in the morning. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf fighter with subtly pointed ears, mixing elven grace and human warmth, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, at a crossroads inn where a forest meets farmland at sunset. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf ranger with subtly pointed ears, mixing elven grace and human weathered warmth, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, at the edge of a dark forest in the morning mist. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf ranger with subtly pointed ears, mixing elven grace and human warmth, with a short bow slung on her back and a hunting spear in hand, leaping from stone to stone as a hawk dives alongside her, in rolling farmland beside an old forest at golden hour. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf wizard with subtly pointed ears, mixing elven grace and human weathered warmth, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in a lantern-lit riverside market at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf wizard with subtly pointed ears, mixing elven grace and human warmth, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, on an old stone bridge over a river between a walled town and a dark forest in the morning. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf cleric with subtly pointed ears, mixing elven grace and human weathered warmth, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, at a forgotten roadside crypt between town and forest. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf cleric with subtly pointed ears, mixing elven grace and human warmth, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in the small timber chapel of a frontier town. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-druid-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf druid with subtly pointed ears, mixing elven grace and human weathered warmth, with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture, in rolling farmland beside an old forest at golden hour. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-druid-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf druid with subtly pointed ears, mixing elven grace and human warmth, in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, at the edge of a dark forest in the morning mist. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf thief with subtly pointed ears, mixing elven grace and human weathered warmth, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a frontier town of timber houses at the edge of the woods. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf thief with subtly pointed ears, mixing elven grace and human warmth, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, in a lantern-lit riverside market at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf bard with subtly pointed ears, mixing elven grace and human weathered warmth, in a feathered hat, playing a lute and singing with one boot up on a barrel while a small crowd cheers, in a lantern-lit riverside market at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf bard with subtly pointed ears, mixing elven grace and human warmth, in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand before a spellbound audience, on an old stone bridge over a river between a walled town and a dark forest in the morning. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf psionicist with subtly pointed ears, mixing elven grace and human weathered warmth, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, at a crossroads inn where a forest meets farmland at sunset. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf psionicist with subtly pointed ears, mixing elven grace and human warmth, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a frontier town of timber houses at the edge of the woods. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-gypsy-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-elf fortune-teller with subtly pointed ears, mixing elven grace and human weathered warmth, in colorful layered clothes, a traveling performer dancing with a tambourine around a campfire, in a clearing of twisted trees below a gothic castle. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-elf-gypsy-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-elf fortune-teller with subtly pointed ears, mixing elven grace and human warmth, in colorful layered clothes and a coin-trimmed shawl, gazing into a glowing crystal ball with one hand raised in warning, inside a dim fortune-telling tent lit by colored lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Halfling

- [ ] **combo-halfling-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling fighter with curly hair and bare feet, in chainmail with a round shield and a raised sword, charging forward with a war cry, in an orchard beside cozy round-door homes in green hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling fighter with curly hair and bare feet, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, on a small river barge at golden hour with reeds and willows on the banks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling cleric with curly hair and bare feet, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, at a mossy burial mound on the edge of the village. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling cleric with curly hair and bare feet, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in the cozy round-door shrine of a hillside village. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling thief with curly hair and bare feet, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in the lantern-lit cellar of a cozy village inn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling thief with curly hair and bare feet, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, on the market green of a hillside village. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-ninja-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling ninja with curly hair and bare feet, in dark clothing with a short sword on his back, leaping silently from the shadows, in an orchard beside cozy round-door homes in green hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-ninja-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling ninja with curly hair and bare feet, disguised as an attendant in a pale silk robe, drawing a hidden blade from her sleeve, on a small river barge at golden hour with reeds and willows on the banks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful male halfling psionicist with curly hair and bare feet, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, on a small river barge at golden hour with reeds and willows on the banks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-halfling-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful female halfling psionicist with curly hair and bare feet, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in the lantern-lit cellar of a cozy village inn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Aasimar

- [ ] **combo-aasimar-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar fighter with a soft radiant glow around his head and luminous eyes, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar fighter with a soft radiant glow around her head and luminous eyes, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a marble hall of tall columns washed in golden light. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-paladin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar paladin with a soft radiant glow around his head and luminous eyes, in shining plate armor and a white tabard, holding up a sword that glows with holy light and standing protectively before frightened villagers, in a marble hall of tall columns washed in golden light. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-paladin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar paladin with a soft radiant glow around her head and luminous eyes, in shining plate armor and a blue tabard, kneeling in prayer with both hands on a sword planted in the ground as rays of light fall around her, on the steps of a white cathedral at dawn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar ranger with a soft radiant glow around his head and luminous eyes, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, on a storm-swept mountain pass with dark clouds breaking apart above. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar ranger with a soft radiant glow around her head and luminous eyes, with a short bow slung on her back and a hunting spear in hand, leaping from stone to stone as a hawk dives alongside her, in a high alpine meadow bathed in golden light. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar wizard with a soft radiant glow around his head and luminous eyes, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, on the battlements of a shining citadel above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar wizard with a soft radiant glow around her head and luminous eyes, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar cleric with a soft radiant glow around his head and luminous eyes, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in the shadowed crypt beneath a white cathedral. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar cleric with a soft radiant glow around her head and luminous eyes, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-druid-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar druid with a soft radiant glow around his head and luminous eyes, with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture, in a high alpine meadow bathed in golden light. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-druid-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar druid with a soft radiant glow around her head and luminous eyes, in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, on a storm-swept mountain pass with dark clouds breaking apart above. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar thief with a soft radiant glow around his head and luminous eyes, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, on the steps of a white cathedral at dawn. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar thief with a soft radiant glow around her head and luminous eyes, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, on the battlements of a shining citadel above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall male aasimar bard with a soft radiant glow around his head and luminous eyes, in a feathered hat, playing a lute and singing with one boot up on a barrel while a small crowd cheers, on the battlements of a shining citadel above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-aasimar-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene female aasimar bard with a soft radiant glow around her head and luminous eyes, in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand before a spellbound audience, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Bariaur

- [ ] **combo-bariaur-male-fighter.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur fighter from Planescape, the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a ring of ancient standing stones on a misty hilltop of the Outer Planes at twilight. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-male-paladin.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur paladin from Planescape, the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, in shining plate armor and a white tabard, holding up a sword that glows with holy light and standing protectively before frightened villagers, in a nomad camp of hide tents on the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-male-ranger.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur ranger from Planescape, the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, on a wide grassy plain of the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-male-cleric.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur cleric from Planescape, the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, among toppled grave stones on a hill of the Outer Planes at twilight. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-male-druid.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur druid from Planescape, the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture, in a windy highland valley of the Outer Planes at dusk. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-female-fighter.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur fighter from Planescape, the upper body of a woman joined to the four-legged body of a ram, with no horns and long braided hair, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a nomad camp of hide tents on the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-female-mage.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur wizard from Planescape, the upper body of a woman joined to the four-legged body of a ram, with no horns and long braided hair, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in a nomad camp of hide tents on the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-female-cleric.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur cleric from Planescape, the upper body of a woman joined to the four-legged body of a ram, with no horns and long braided hair, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a ring of ancient standing stones on a misty hilltop of the Outer Planes. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-bariaur-female-druid.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur druid from Planescape, the upper body of a woman joined to the four-legged body of a ram, with no horns and long braided hair, in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, on a wide grassy plain of the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Genasi (air)

- [ ] **combo-genasi-air-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male air genasi fighter with pale blue skin and white hair that floats as if underwater, in chainmail with a round shield and a raised sword, charging forward with a war cry, at the bow of a flying skyship high above a sea of golden sunset clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-air-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female air genasi fighter with pale blue skin and white hair that floats as if underwater, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a white tower of open arches on the top of a cloud-wrapped peak. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-air-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male air genasi wizard with pale blue skin and white hair that floats as if underwater, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, at the bow of a flying skyship high above a sea of golden sunset clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-air-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female air genasi wizard with pale blue skin and white hair that floats as if underwater, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in a white tower of open arches on the top of a cloud-wrapped peak. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-air-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male air genasi cleric with pale blue skin and white hair that floats as if underwater, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a wind-scoured tomb on a cloud-wrapped peak. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-air-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female air genasi cleric with pale blue skin and white hair that floats as if underwater, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in an open-air temple on a floating stone platform. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Genasi (earth)

- [ ] **combo-genasi-earth-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy male earth genasi fighter with gray stone-textured skin and small crystals growing in his hair, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a cave full of glowing gems. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy female earth genasi fighter with gray stone-textured skin and small crystals growing in her hair, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a dry canyon of red cliffs under a harsh midday sun. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-paladin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy male earth genasi paladin with gray stone-textured skin and small crystals growing in his hair, in shining plate armor and a white tabard, holding up a sword that glows with holy light and standing protectively before frightened villagers, in a dry canyon of red cliffs under a harsh midday sun. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-paladin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy female earth genasi paladin with gray stone-textured skin and small crystals growing in her hair, in shining plate armor and a blue tabard, kneeling in prayer with both hands on a sword planted in the ground as rays of light fall around her, in a great hall hewn from living rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy male earth genasi wizard with gray stone-textured skin and small crystals growing in his hair, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in the crystal city of the Elemental Plane of Earth. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy female earth genasi wizard with gray stone-textured skin and small crystals growing in her hair, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in a cave full of glowing gems. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy male earth genasi cleric with gray stone-textured skin and small crystals growing in his hair, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a dark ossuary hewn from living rock. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-earth-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy female earth genasi cleric with gray stone-textured skin and small crystals growing in her hair, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a crystal shrine inside a glowing cave. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Genasi (fire)

- [ ] **combo-genasi-fire-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male fire genasi fighter with ember-red skin and hair that flickers like living flame, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a volcanic landscape with glowing lava under a smoky orange sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-fire-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female fire genasi fighter with ember-red skin and hair that flickers like living flame, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in the ruined courtyard of a burned-out desert fortress at night under a sky full of sparks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-fire-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male fire genasi wizard with ember-red skin and hair that flickers like living flame, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in a volcanic landscape with glowing lava under a smoky orange sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-fire-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female fire genasi wizard with ember-red skin and hair that flickers like living flame, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in the ruined courtyard of a burned-out desert fortress at night under a sky full of sparks. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Genasi (water)

- [ ] **combo-genasi-water-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi fighter with blue-green skin and long hair that drips and flows like water, in chainmail with a round shield and a raised sword, charging forward with a war cry, on a flooded street of a sunken coastal city with half-drowned towers and hanging lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi fighter with blue-green skin and long hair that drips and flows like water, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, at the edge of a rocky shore with a great wave curling behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi wizard with blue-green skin and long hair that drips and flows like water, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, in a coral palace of the Elemental Plane of Water. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi wizard with blue-green skin and long hair that drips and flows like water, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, on a flooded street of a sunken coastal city with half-drowned towers and hanging lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi cleric with blue-green skin and long hair that drips and flows like water, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a drowned crypt of a sunken coastal city. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi cleric with blue-green skin and long hair that drips and flows like water, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a coral shrine lit by pale sea lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi thief with blue-green skin and long hair that drips and flows like water, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, on the deck of a storm-tossed ship in the rain. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi thief with blue-green skin and long hair that drips and flows like water, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, in a coral palace of the Elemental Plane of Water. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male water genasi bard with blue-green skin and long hair that drips and flows like water, in a feathered hat, playing a lute and singing with one boot up on a barrel while a small crowd cheers, in a coral palace of the Elemental Plane of Water. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-genasi-water-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female water genasi bard with blue-green skin and long hair that drips and flows like water, in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand before a spellbound audience, on a flooded street of a sunken coastal city with half-drowned towers and hanging lanterns. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Githzerai

- [ ] **combo-githzerai-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean male githzerai fighter with yellowish skin, pointed ears and a topknot, in chainmail with a round shield and a raised sword, charging forward with a war cry, on a shifting bridge of raw chaos stuff inside a fortress of Limbo, unstable towers bending in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-githzerai-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean female githzerai fighter with yellowish skin, pointed ears and a long braid, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, on a floating rock while the chaotic colors of Limbo swirl around. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-githzerai-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean male githzerai wizard with yellowish skin, pointed ears and a topknot, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, on a shifting bridge of raw chaos stuff inside a fortress of Limbo, unstable towers bending in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-githzerai-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean female githzerai wizard with yellowish skin, pointed ears and a long braid, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, on a floating rock while the chaotic colors of Limbo swirl around. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-githzerai-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean male githzerai thief with yellowish skin, pointed ears and a topknot, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, on a shifting bridge of raw chaos stuff inside a fortress of Limbo, unstable towers bending in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-githzerai-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean female githzerai thief with yellowish skin, pointed ears and a long braid, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, on a floating rock while the chaotic colors of Limbo swirl around. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Modron

- [ ] **combo-modron-fighter.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rogue modron fighter from Planescape, a small, round clockwork-like being with a single large eye, little wings and thin arms and legs, gripping a sword and a small round shield in its thin hands, marching forward with fierce determination, in the vast clockwork plane of Mechanus among giant rotating gears. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-modron-mage.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rogue modron wizard from Planescape, a small, round clockwork-like being with a single large eye, little wings and thin arms and legs, with a tiny open spellbook hovering before its single eye, casting a crackling spell from one thin hand, on a great brass walkway of Mechanus with gears turning far below. Alive and in motion, expressive face. Full body in frame, character centered; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Tiefling

- [ ] **combo-tiefling-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male tiefling fighter with curved horns, a pointed tail and a confident smirk, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a lantern-lit fantasy city of strange arches, portals and planar travelers. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female tiefling fighter with curved horns, a pointed tail and piercing eyes, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, in a shadowy planar library of endless spiral shelves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male tiefling wizard with curved horns, a pointed tail and a confident smirk, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, beside a glowing portal in a crowded planar bazaar. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female tiefling wizard with curved horns, a pointed tail and piercing eyes, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in a lantern-lit fantasy city of strange arches, portals and planar travelers. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male tiefling cleric with curved horns, a pointed tail and a confident smirk, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a shadowed planar catacomb lit by strange green lamps. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female tiefling cleric with curved horns, a pointed tail and piercing eyes, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, in a hidden shrine behind a crowded planar bazaar. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male tiefling thief with curved horns, a pointed tail and a confident smirk, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, in a narrow alley of the city of doors, under hanging chains and strange signs. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-tiefling-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female tiefling thief with curved horns, a pointed tail and piercing eyes, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, beside a glowing portal in a crowded planar bazaar. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

### Half-Vistani

- [ ] **combo-half-vistani-fighter-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani fighter with a colorful headscarf and coin jewelry, in chainmail with a round shield and a raised sword, charging forward with a war cry, in a caravan camp of painted wagons in a misty dark forest. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-fighter-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani fighter with a colorful headscarf and coin jewelry, in scale armor with a long two-handed sword, bracing against a charge with her cloak whipping in the wind, on a misty mountain road with a gothic castle on the cliff behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-paladin-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani paladin with a colorful headscarf and coin jewelry, in shining plate armor and a white tabard, holding up a sword that glows with holy light and standing protectively before frightened villagers, on a misty mountain road with a gothic castle on the cliff behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-paladin-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani paladin with a colorful headscarf and coin jewelry, in shining plate armor and a blue tabard, kneeling in prayer with both hands on a sword planted in the ground as rays of light fall around her, in a gothic village square at dusk under a hanging fog. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-ranger-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani ranger with a colorful headscarf and coin jewelry, with a longbow, kneeling to read animal tracks beside a loyal wolf companion, in a misty dark forest of twisted trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-ranger-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani ranger with a colorful headscarf and coin jewelry, with a short bow slung on her back and a hunting spear in hand, leaping from stone to stone as a hawk dives alongside her, on a fog-covered moor at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-mage-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani wizard with a colorful headscarf and coin jewelry, in flowing robes with an open spellbook floating beside him, casting a crackling spell from one hand, beside a candlelit painted wagon hung with herbs and charms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-mage-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani wizard with a colorful headscarf and coin jewelry, in dark embroidered robes holding a glowing crystal staff, tracing burning runes in the air, in the ruined chapel of a mist-bound graveyard. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-cleric-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani cleric with a colorful headscarf and coin jewelry, in armor and vestments raising a glowing holy symbol, a mace at his hip, driving back shadowy undead, in a mist-bound graveyard before a ruined chapel. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-cleric-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani cleric with a colorful headscarf and coin jewelry, in vestments and a light mail shirt, a mace at her hip, kneeling to heal a wounded soldier with glowing hands, beside a candlelit painted wagon. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-druid-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani druid with a colorful headscarf and coin jewelry, with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture, on a fog-covered moor at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-druid-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani druid with a colorful headscarf and coin jewelry, in a mantle of bark and feathers, one hand on the neck of a great stag, calling a storm down with the other raised arm, in a misty dark forest of twisted trees. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-thief-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani thief with a colorful headscarf and coin jewelry, in a dark hooded cloak, crouched low and twirling a picked lock with a grin, a sack of loot over his shoulder, on a misty mountain road with a gothic castle on the cliff behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-thief-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani thief with a colorful headscarf and coin jewelry, in fitted dark leathers, slipping a jeweled idol into her belt pouch with a thin smile and a glance over her shoulder, in a gothic village square at dusk under a hanging fog. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-bard-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani bard with a colorful headscarf and coin jewelry, in a feathered hat, playing a lute and singing with one boot up on a barrel while a small crowd cheers, in a gothic village square at dusk under a hanging fog. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-bard-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani bard with a colorful headscarf and coin jewelry, in a richly embroidered gown and short cape, reciting a tale with one arm thrown wide and a silver flute in the other hand before a spellbound audience, beside a candlelit painted wagon hung with herbs and charms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-ninja-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani ninja with a colorful headscarf and coin jewelry, in dark clothing with a short sword on his back, leaping silently from the shadows, beside a candlelit painted wagon hung with herbs and charms. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-ninja-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani ninja with a colorful headscarf and coin jewelry, disguised as an attendant in a pale silk robe, drawing a hidden blade from her sleeve, in the ruined chapel of a mist-bound graveyard. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-psionicist-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani psionicist with a colorful headscarf and coin jewelry, with a calm, focused face and a softly glowing aura around his head, making stones and books float in the air with the power of the mind, in the ruined chapel of a mist-bound graveyard. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-psionicist-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani psionicist with a colorful headscarf and coin jewelry, with intense eyes and a softly glowing aura around her head, one hand at her temple and the other stopping a swarm of flying arrows in mid-air, in a caravan camp of painted wagons in a misty dark forest. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-gypsy-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male half-Vistani fortune-teller with a colorful headscarf and coin jewelry, in colorful layered clothes, a traveling performer dancing with a tambourine around a campfire, on a fog-covered village green at dusk. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **combo-half-vistani-gypsy-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female half-Vistani fortune-teller with a colorful headscarf and coin jewelry, in colorful layered clothes and a coin-trimmed shawl, gazing into a glowing crystal ball with one hand raised in warning, inside a firelit wagon with rain on the shutters. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

## Armas (etapa 6, fundo dos carrosséis)

Uma por grupo, ao fundo da faixa, à direita; o lado esquerdo fica escuro sob os
cartões. Formato: **horizontal panorâmico 21:9, 1680×720** (`.webp`). Enquanto o
arquivo não existir, a faixa fica só com o fundo escuro.

- [ ] **weapons-missile.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A longbow, a crossbow and a sling with a quiver of fletched arrows leaning on a wooden archery-range post, an arrow just striking a straw target in the distance, autumn leaves drifting. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No people's faces, no text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-slashing.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A gleaming long sword and a battle axe crossed on a weapon rack in a blacksmith's shop, sparks from a nearby forge glinting on the steel edges. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-piercing.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tall spear, a dagger and a jousting lance with a fluttering pennant standing in a barracks armory, torchlight on the sharp points. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-bludgeoning.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A spiked morning star, a flanged mace and a heavy warhammer hanging from iron hooks on a stone wall, a dented shield below them. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-piercing-slashing.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A row of tall polearms — a halberd, a glaive-guisarme and a bill-guisarme — standing in a castle gatehouse rack, banners above, the blades catching the evening light. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-piercing-bludgeoning.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lucern hammer and a bec de corbin, long knightly polearms with hammer heads and beak spikes, leaning against a tournament tent with striped canvas. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **weapons-other.webp**
  ```
  Horizontal panoramic image, 21:9 aspect ratio, 1680x720 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A coiled leather whip, a weighted fishing net and a lasso hanging on a gladiator arena's wooden gate, sand and sunlight beyond the bars. All the subject in the right third of the image; the left two thirds fade into deep dark brown shadow with no details. No text, no signature, no watermark, no frame, no border.
  ```
