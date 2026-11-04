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
