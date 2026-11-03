# The Forge — ilustrações

Arte do construtor de personagem (`docs/criacao-de-personagem.md`). Cada
arquivo vai em `public/images/forge/` com o nome exato abaixo (`.webp`); o card
mostra a silhueta "Art coming" até o arquivo existir e troca sozinho depois.

Desde a v0.130.0, o admin também troca as imagens navegando pelo app: o lápis nos
cards e nas faixas de armas abre o painel de versões (`src/components/SiteImageEdit.tsx`;
versões no Supabase, bucket `site-images`). A imagem enviada é convertida para WebP e
recortada no tamanho do slot. Vale a versão atual; sem versão, o arquivo do repo.

Estilo de todas: ilustração de livro de histórias, traço a nanquim com estilo
fortemente realista, cara de RPG (revisto pelo usuário em 2026-11-03, a partir
do prompt do anão); personagem vivo no seu mundo (como
`public/images/mode_player.jpg`). Nunca medalhão, moeda ou relevo.

Formato das raças e classes: **vertical 3:4, 896×1200** (o card é 3:4). Mande
cada imagem como mensagem normal na conversa (não enquanto o Claude estiver
trabalhando) para ela ser salva em disco.

**Uma imagem por gênero.** A raça aparece no gênero escolhido na etapa 2:
`race-<raça>-male.webp` e `race-<raça>-female.webp`. Use o mesmo prompt nas
duas, trocando a figura para homem ou mulher ("a male dwarf…" / "a female
dwarf…"). Enquanto só existir uma, o app usa `race-<raça>.webp` (sem gênero)
se houver; senão mostra a silhueta. Bariaur já tem um arquivo por sexo e o
modron não tem sexo: um arquivo só. As classes seguem a mesma regra
(`class-<classe>-male.webp` / `-female.webp`, ou `class-<classe>.webp` para os dois).

## Feitas

- [x] `gender-male.webp`
- [x] `gender-female.webp`
- [x] `race-human-male.webp`

## Raças (etapa 3)

- [ ] **race-human-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A young female human adventurer raising a lantern, curious and bold, a green cloak and leather armor, in a bustling medieval market street at dusk with colorful banners overhead. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```

- [ ] **race-dwarf-male.webp** e **race-dwarf-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A stocky dwarf with a braided red beard, laughing while hammering a glowing blade on an anvil, in an underground forge hall lit by rivers of lava. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-elf-male.webp** e **race-elf-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A slender elf with long pointed ears drawing a longbow, calm and focused, in an ancient moonlit forest with softly glowing leaves. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-gnome-male.webp** e **race-gnome-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A small gnome with a big nose and a mischievous grin, conjuring a sparkling illusion between his hands, in a cluttered tinker's workshop full of gadgets, gears and books. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-elf-male.webp** e **race-half-elf-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A half-elf woman with subtly pointed ears, mixing elven grace and human warmth, playing a lute while sitting on a rock at a crossroads where a forest meets farmland at sunset. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-halfling-male.webp** e **race-halfling-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cheerful halfling with curly hair and bare feet, sneaking away with a stolen apple and a wink, in an orchard beside cozy round-door homes in green hills. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-aasimar-male.webp** e **race-aasimar-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A serene aasimar woman with a soft radiant glow around her head and luminous eyes, healing light shining from one open hand, in a sunlit mountain temple above the clouds. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or clouds with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-bariaur-male.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A male bariaur from Planescape: the upper body of a bearded man joined to the four-legged body of a ram, with large curled ram horns, galloping joyfully across a wide grassy plain of the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Character centered from head to hooves; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-bariaur-female.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A female bariaur from Planescape: the upper body of a woman joined to the four-legged body of a ram, with no horns, long braided hair, reading a glowing spell scroll while trotting across a wide grassy plain of the Outer Planes under a strange colorful sky. Alive and in motion, expressive face. Character centered from head to hooves; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-air-male.webp** e **race-genasi-air-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. An air genasi with pale blue skin and white hair that floats as if underwater, levitating lightly above a cliff top while wind swirls around, clouds racing past. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rock or cloud with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-earth-male.webp** e **race-genasi-earth-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A sturdy earth genasi with gray stone-textured skin and small crystals growing in the hair, resting a hand on a cavern wall that responds to the touch, in a cave full of glowing gems. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-fire-male.webp** e **race-genasi-fire-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A fire genasi with ember-red skin and hair that flickers like living flame, playfully juggling small balls of fire, in a volcanic landscape with glowing lava under a smoky orange sky. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm dark rock with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-genasi-water-male.webp** e **race-genasi-water-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A water genasi with blue-green skin and long hair that drips and flows like water, rising from the sea at the edge of a rocky shore with a wave curling behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm water with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-githzerai-male.webp** e **race-githzerai-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A lean githzerai monk with yellowish skin, pointed ears and a topknot, meditating in mid-air on a floating rock while the chaotic colors of Limbo swirl around. Alive, calm and powerful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm floating rock with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-modron.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A rogue modron from Planescape: a small, round clockwork-like being with a single large eye, little wings and thin arms and legs, curiously stepping off a giant rotating gear into the world for the first time, in the vast clockwork plane of Mechanus. Alive and full of curiosity. Character centered; the bottom fifth of the image is a calm gear surface with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-tiefling-male.webp** e **race-tiefling-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A tiefling with curved horns, a pointed tail and a confident smirk, flipping a coin, in a lantern-lit fantasy city of strange arches, portals and planar travelers. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **race-half-vistani-male.webp** e **race-half-vistani-female.webp** (mesmo prompt, figura masculina e feminina)
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A half-Vistani traveler with a colorful headscarf and coin jewelry, reading tarot cards by a campfire, in a caravan camp of painted wagons in a misty dark forest. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```

## Classes (etapa 4)

- [ ] **class-fighter.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A battle-ready fighter in chainmail with a round shield and a raised sword, charging forward with a war cry across a misty battlefield with banners in the distance. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-paladin.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A noble paladin in shining plate armor and a white tabard, holding up a sword that glows with holy light, standing protectively before frightened villagers at the gate of a small chapel. Alive, determined and kind, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ranger.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A hooded ranger with a longbow, kneeling to read animal tracks beside a loyal wolf companion, in a deep wild forest at dawn. Alive, alert and focused, expressive face. Character centered from head to knees; the bottom fifth of the image is calm forest floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-mage.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A wizard in flowing robes with an open spellbook floating beside them, casting a crackling spell from one hand, in a tall tower study full of books, candles and arcane instruments. Alive and in motion, expressive face full of wonder. Character centered from head to knees; the bottom fifth of the image is calm floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-cleric.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A cleric in armor and vestments raising a glowing holy symbol, a mace at the hip, driving back shadowy undead at the entrance of an old crypt. Alive, brave and faithful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone floor with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-druid.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A druid with a gnarled wooden staff and a cloak of leaves, a fox and birds gathered around, making flowers bloom with a gentle gesture in a sacred grove of ancient standing stones. Alive and serene, expressive face. Character centered from head to knees; the bottom fifth of the image is calm mossy ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-thief.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A nimble thief in a dark hooded cloak, crouched on a city rooftop at night, twirling a picked lock and grinning, a sack of loot over the shoulder. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm rooftop tiles with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-bard.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A charismatic bard in a feathered hat, playing a lute and singing on a table, in a crowded, lively tavern where the patrons cheer and raise their mugs. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is a calm tabletop with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-ninja.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A ninja in dark clothing with a short sword on the back, leaping silently between the curved rooftops of a pagoda town in Kara-Tur under a full moon, cherry blossoms drifting. Alive and in motion. Character centered from head to knees; the bottom fifth of the image is calm rooftop with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-psionicist.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A psionicist with a calm, focused face and a softly glowing aura around the head, making stones and books float in the air with the power of the mind, in a quiet mountain monastery courtyard. Alive and intense, expressive face. Character centered from head to knees; the bottom fifth of the image is calm stone ground with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-anchorite.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. An anchorite, a devoted hermit priest of Ravenloft in a simple hooded robe, holding up a lantern and a holy symbol to keep the mist at bay, in a gothic graveyard with a ruined chapel. Alive, steadfast and watchful, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
  ```
- [ ] **class-gypsy.webp**
  ```
  Vertical image, 3:4 aspect ratio, 896x1200 pixels. Fantasy storybook illustration, hand-drawn ink linework with a strong realistic style, RPG-like. A traveling fortune-teller and performer of Ravenloft in colorful layered clothes, dancing with a tambourine around a campfire while painted wagons wait in the misty forest behind. Alive and in motion, expressive face. Character centered from head to knees; the bottom fifth of the image is calm ground or mist with no important details. No text, no signature, no watermark, no frame, no border.
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
