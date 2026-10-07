// GERADO por scripts/gen-types.mjs a partir de thac0berry-data/schemas/library.schema.json.
// Não edite à mão: mude o modelo Swift no iPad, gere o schema lá e rode `npm run types`.
//
// Convenções do formato (ver schemas/README.md no thac0berry-data):
// - Datas: ISO-8601 sem fração de segundo ("2026-10-05T12:00:00Z"); `toISOString()`
//   grava ".000Z", que o iPad recusa.
// - UUID em texto; binários (desenhos, retrato) em base64.
// - Campo opcional (`?`) ausente = nil no Swift. Campo obrigatório precisa ir sempre,
//   mesmo com o valor padrão, ou o iPad descarta o personagem inteiro.

/** GERADO por thac0berry-ipad/Scripts/gen_library_schema.py a partir de Models/Character.swift, ActiveEffect.swift, SpellSheet.swift e Store/CharacterLibrary.swift (LibraryData). Não edite à mão. Itens de campaigns/characters que não batem com o schema são descartados pelo iPad (LossyArray), um por um. */
export interface Library {
  /** CharacterLibrary.currentSchemaVersion; ausente = 0. Maior que o do app: abre só para leitura. */
  schemaVersion?: number
  campaigns?: Campaign[]
  characters?: PlayerCharacter[]
  favoriteSpellIDs?: string[] | null
  defaultNotebookPaperStyle?: NotebookPaperStyle | null
}

export interface AbilityDetails {
  strengthHit: string
  strengthDamage: string
  strengthWeight: string
  strengthMaxPress: string
  strengthDoors: string
  strengthBars: string
  dexterityReaction: string
  dexterityMissile: string
  dexterityDefense: string
  constitutionHP: string
  constitutionShock: string
  constitutionResurrection: string
  constitutionPoison: string
  intelligenceLanguages: string
  intelligenceMaxLevel: string
  intelligenceLearn: string
  intelligenceMaxPerLevel: string
  wisdomDefense: string
  wisdomFailure: string
  /** Bônus de magia por círculo, como está escrito na tabela do livro: "+2 / +2 / +1" — círculo 1 ganha +2 slot(s), círculo 2 +2, círculo 3 +1. */
  wisdomBonusSpells: string
  charismaHenchmen: string
  charismaLoyalty: string
  charismaReaction: string
  intelligenceSpellImmunity?: string | null
  wisdomSpellImmunity?: string | null
  constitutionRegen?: string | null
}

export interface AbilityScores {
  strength: number
  /** Força excepcional (01–00) — só guerreiros com Força 18. */
  exceptionalStrength?: number | null
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface ActiveEffect {
  id: string
  /** Nome livre do item — "Stone Skin", "Regenerate", "Potion of Fire Giant Strength"... o que o jogador quiser digitar. */
  name: string
  /** Duração em texto livre ("3 rounds", "6 hours", "until it lands a hit") — o app não tem relógio de rounds/turnos em lugar nenhum (nem a Priest Spell Sheet tem), então em vez de fingir que controla isso sozinho, só guarda a anotação que o jogador escreveu. */
  durationLabel: string
  notes: string
  /** Um item pode ter mais de um efeito mecânico ao mesmo tempo — ex. Recitation é UM item com DOIS `EffectComponent`s (+3 To Hit, +3 Saves). */
  components: EffectComponent[]
}

export interface Campaign {
  id: string
  name: string
  /** Quando a campanha começou de verdade — não precisa bater com a data da sessão mais antiga (a campanha pode ter sido criada bem antes da primeira mesa marcada, ex.: personagens preparados com um mês de antecedência). */
  startedDate: string
  notes: string
  /** Encerrada (nunca apagada) — sai da lista principal, mas continua consultável, igual a uma sessão arquivada. */
  isArchived: boolean
  /** As sessões de mesa — cada uma agrupa um punhado de folhas de dia de um ou mais personagens. */
  sessions: Session[]
  /** LEGADO: o caderno era da campanha até o formato 2 (2026-10-06). Agora cada personagem tem o seu (`PlayerCharacter.notebookEntries`); `CharacterLibrary.migrateNotebooks` move as folhas daqui para lá ao abrir um arquivo antigo. O campo continua só para ler esses arquivos. */
  notebookEntries: NotebookEntry[]
  /** Cenários de campanha ligados (ver `CampaignSettingCatalog`) — `nil` é o padrão (campanha nova, ou nunca mexeu nisso) e significa "sem filtro, mostra tudo", igual toda outra feature de sinalização deste app (esferas de acesso, etc.): nunca quebra campanha existente, só SOMA um filtro quando o jogador liga pelo menos um cenário. Um conjunto vazio (todos os cenários desligados na mão) tem o mesmo efeito de `nil` — só o conteúdo genérico/core apareceria, o que não faz sentido pra nenhuma mesa de verdade, então é tratado como "sem filtro" também (ver `allowsSetting`). */
  enabledSettings?: string[] | null
}

export type CasterType = "arcane" | "divine"

/** Gravar só os valores em inglês; os em português são de bibliotecas antigas. */
export type CharacterClass = "Fighter" | "Paladin" | "Ranger" | "Mage" | "Cleric" | "Druid" | "Thief" | "Bard" | "Ninja" | "Psionicist" | "Guerreiro" | "Paladino" | "Patrulheiro" | "Mago" | "Clérigo" | "Druida" | "Ladino" | "Bardo"

export type CharacterStatus = "alive" | "dead" | "archived"

export interface CombatDetails {
  surprisedAC?: string | null
  shieldlessAC?: string | null
  rearAC?: string | null
  typeWorn?: string | null
  dexChecks?: string | null
  visionChecks?: string | null
  hearingChecks?: string | null
  hitDiceType?: string | null
  numbedNumber?: string | null
  uselessNumber?: string | null
  maxDeaths?: string | null
  deathsToDate?: string | null
  wounds?: string | null
}

export interface EffectComponent {
  id: string
  kind: EffectComponentKind
  bonusTarget: EffectComponentBonusTarget
  bonusAmount: number
  /** `EquipmentItem.id` da linha inserida em `damageModifiers` (só quando o alvo é `.damage` — os outros três alvos escrevem direto no campo numérico, sem precisar de linha nenhuma) — guardado só pra `revertActiveEffectApplication` saber qual linha remover, sem mexer nas outras que o jogador tenha lançado à mão. */
  appliedDamageRowID?: string | null
  /** Só quando `bonusTarget == .allSaves`: QUAIS jogadas de resistência recebem o bônus — pedido do usuário (2026-09-29): "além da opção de bônus pra TODOS os saves, dar opção de escolher um ou mais dentre eles". `nil` = todos os cinco (era o único comportamento antes desta versão, então fichas salvas com a v1.79 ou antes continuam se comportando exatamente igual). Guarda os `id`s de `SavingThrows.SaveEntry` ("ppd", "rsw", "pp", "bw", "sp"). */
  savingThrowIDs?: string[] | null
  overrideStat: EffectComponentOverrideStat
  overrideValue: number
  /** Valor do campo ANTES da substituição — devolvido ao encerrar o efeito. Só tem sentido depois que o efeito foi mesmo aplicado. */
  previousValue: number
  usedCount: number
  maxUses: number
  /** Só pra `.bankedHeal`: `true` enquanto a cura ainda não foi disparada (esperando o personagem tomar dano). `applyDamage`, em `PlayerCharacter`, vira isso pra `false` sozinho no primeiro dano recebido enquanto o efeito existir. */
  healIsBanked: boolean
  /** Prazo (em HORAS) pra cura ser disparada antes de expirar — texto livre em vez de número (efeitos de longa duração de campanha, tipo "até a próxima lua cheia", podem passar de milhares de horas) — só anotação, o app não conta o tempo sozinho (mesmo motivo de `ActiveEffect.durationLabel`). */
  healWindowLabel: string
  tempHPGranted: number
  tempHPRemaining: number
}

export type EffectComponentBonusTarget = "toHit" | "allSaves" | "armorClass" | "damage"

export type EffectComponentKind = "flatBonus" | "statOverride" | "attackNegation" | "bankedHeal" | "tempHP" | "note"

export type EffectComponentOverrideStat = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma" | "armorClass" | "thac0"

export interface EncumbranceRow {
  weightCarried: string
  moveRate: string
  attackPenalty: string
  acPenalty: string
}

export interface EncumbranceTable {
  light: EncumbranceRow
  moderate: EncumbranceRow
  heavy: EncumbranceRow
  severe: EncumbranceRow
}

export interface EquipmentItem {
  id: string
  name: string
  note: string
}

export interface ItemSpellUse {
  id: string
  spellName: string
  /** Magia da base embutida, quando reconhecida — usada para abrir a descrição completa. */
  matchedSpellID?: string | null
  /** Dano ou cura do item, como texto livre ("1d6+1", "2d4 fire") — o item pode ter um valor diferente do da magia "de livro". */
  damageNote: string
  /** Teto de cargas — impede riscar além do que o item tem. Editável, não é desenhado como marcas prontas: só limita até onde o traço vai. */
  maxUses: number
  /** Quantos traços já foram feitos — cada arrasto na área em branco soma um, como um risco na parede feito à mão, não uma bolinha preenchida. */
  usedCount: number
}

export interface LevelChangeRow {
  by: string
  atLevels: string
}

export interface LevelChangesTable {
  thac0: LevelChangeRow
  savingThrows: LevelChangeRow
  weaponProficiencies: LevelChangeRow
  nonWeaponProficiencies: LevelChangeRow
}

export interface MagicItem {
  id: string
  name: string
  /** Item 1 do pedido do usuário (2026-09-27): "Item" passou a também listar os itens do catálogo (`MagicItemDatabase`, mesma base da aba Equipment/página 2), sem obrigar a escolha de um existente — igual ao padrão já usado em `MagicItemQuantifiedRow`. `nil` quando o nome foi digitado à mão (item caseiro) ou numa ficha salva antes desta versão. */
  matchedItemID?: string | null
  /** Texto livre — o que o item faz, propriedades, aparência. Só relevante quando `matchedItemID` é `nil`: um item ligado ao catálogo mostra a descrição de lá (`MagicItemDetailSheet`), não esta. */
  itemDescription: string
  spells: ItemSpellUse[]
}

export interface MovementRates {
  base: string
  jog: string
  runX3: string
  runX4: string
  runX5: string
  day: string
}

export interface NotebookEntry {
  id: string
  /** ISO-8601 sem fração de segundo (JSONDecoder .iso8601). */
  date: string
  title: string
  text: string
  /** Optional pelo mesmo motivo de sempre: folhas criadas antes desta versão não têm essa chave — ausência é tratada como `.transcribed`, que era o único tipo que existia até então. */
  kind?: NotebookPageKind | null
  /** Traço de tinta serializado (PKDrawing.dataRepresentation()) — só usado quando kind == .freeform. */
  drawingData?: string | null
  /** Optional pelo mesmo motivo de sempre — folha criada antes desta versão não tem essa chave; ausência é tratada como `.plain` na hora de exibir (ver `NotebookPageView.style`), igual a como toda folha já era antes deste pedido existir. Cada folha guarda a PRÓPRIA escolha (pode trocar depois de criada, ver `NotebookBeadRow`'s picker no cabeçalho); só a folha NOVA nasce com o padrão configurado em Settings (`CharacterLibrary.defaultNotebookPaperStyle`, item 3). */
  paperStyle?: NotebookPaperStyle | null
  /** PNG do desenho (folha .freeform), para a versão web mostrar só para leitura. Preenchido apenas no backup exportado (`NotebookDrawingImage`); no arquivo do app fica vazio. */
  drawingImage?: string | null
}

export type NotebookPageKind = "transcribed" | "freeform"

export type NotebookPaperStyle = "plain" | "lined" | "grid"

export interface Page2EquipmentEntry {
  id: string
  item: string
  location: string
  weight: string
  /** Coluna fixa em que a linha nasceu (0 ou 1). Antes as duas colunas eram um rodízio calculado pelo índice na lista — apagar uma linha deslocava o índice de tudo que vinha depois, e metade das linhas "pulava" de coluna. Guardando a coluna na própria linha, apagar uma só mexe nas linhas abaixo dela NA MESMA coluna, como uma lista normal. Optional pelo mesmo motivo de sempre; ausência vira coluna 0. */
  column?: number | null
  /** `MundaneItem.id` quando esta linha veio do `MundaneItemPickerSheet` (Equipment Compendium) — mesmo padrão de `ProficiencyEntry.matchedProficiencyID`/`WeaponEntry.matchedWeaponID`: liga a linha à base pra abrir a descrição completa (custo/peso) num toque. `nil` numa linha digitada à mão (fichas antigas, ou item caseiro fora do catálogo de 183 itens). */
  matchedItemID?: string | null
}

export interface PlayerCharacter {
  id: string
  name: string
  playerName: string
  race: string
  characterClass: CharacterClass
  level: number
  alignment: string
  deity: string
  sex: string
  age: string
  height: string
  weight: string
  hair: string
  eyes: string
  kit?: string | null
  placeOfOrigin?: string | null
  combat?: CombatDetails | null
  proficiencies?: ProficiencyEntry[] | null
  /** Thieving Skills (2026-09-30, grupo Rogue) — ver `ThievingSkillEntry` e `CharacterClass.hasThievingSkills`. `nil`/vazio pra qualquer ficha de classe fora do grupo Rogue, ou salva antes desta versão. */
  thievingSkills?: ThievingSkillEntry[] | null
  toHitModifiers?: EquipmentItem[] | null
  damageModifiers?: EquipmentItem[] | null
  acModifiers?: EquipmentItem[] | null
  nonProficiencyPenalty?: string | null
  /** Ajustes manuais da tabela "Target's AC / To Hit #", indexados pela CA alvo (10 a −10). Uma CA sem entrada aqui usa o valor calculado automaticamente a partir do THAC0 — ver `thac0TargetDisplay`. */
  thac0TargetOverrides?: Record<string, string> | null
  birthDate?: string | null
  birthRank?: string | null
  nationality?: string | null
  racialAbilities?: string | null
  skin?: string | null
  vision?: string | null
  handedness?: string | null
  personality?: string | null
  hitPointsByLevel?: string | null
  backgroundHistory?: string | null
  /** Retrato pro quadrado "Character Sketch" do PDF — enviado pelo jogador (upload de foto/desenho), não gerado pelo app. Guardado já redimensionado e comprimido em JPEG (ver `UIImage.resizedForSketch` em `CharacterDescriptionView.swift`) antes de chegar aqui, pro JSON da biblioteca não inchar com fotos em resolução de câmera. */
  portraitImageData?: string | null
  page2Equipment?: Page2EquipmentEntry[] | null
  page2TotalWeight?: string | null
  page2EquipmentEncumbrance?: string | null
  page2MovementRate?: string | null
  page2Movement?: MovementRates | null
  page2EncumbranceTable?: EncumbranceTable | null
  xpNeededNextLevel?: string | null
  xpKitModifier?: string | null
  xpAbilityBonus?: string | null
  xpSubraceModifier?: string | null
  xpLevelLimit?: string | null
  levelChanges?: LevelChangesTable | null
  /** Substituída por `page2MagicItems`/`page2TreasureItems` (com quantidade) — o campo antigo fica aqui só pra não quebrar a leitura de fichas salvas com ele, mas não é mais editado em lugar nenhum. */
  page2TreasureNotes?: string[] | null
  page2MagicItems?: QuantifiedItem[] | null
  page2TreasureItems?: QuantifiedItem[] | null
  movement: number
  equipment: EquipmentItem[]
  weapons: WeaponEntry[]
  languages: string[]
  magicItems: string[]
  allies: string[]
  treasure: Treasure
  details: AbilityDetails
  abilities: AbilityScores
  saves: SavingThrows
  hitPointsMax: number
  hitPointsCurrent: number
  armorClass: number
  thac0: number
  experience: number
  /** Armadura e escudo separados, porque a ficha oficial mostra a conta. */
  armorRating: string
  shieldRating: string
  /** Uma folha de magias por dia de jogo. Os slots vivem aqui, não no personagem: eles zeram no repouso, e cada dia é uma folha nova. */
  spellSheets: SpellSheet[]
  /** Quantos slots de cada círculo o personagem tem por descanso — a tabela de memorização da classe, preenchida uma vez aqui na ficha. Toda folha de magia nova nasce a partir dela; não é editável dia a dia na própria folha, porque senão duas folhas do mesmo personagem discordariam sobre quantos slots ele tem. */
  spellSlotAllotments: SpellSlotAllotment[]
  /** A campanha a que este personagem pertence — `nil` quer dizer que ele está no Sandbox: já existe (atributos, equipamento, o que for), mas ainda não foi associado a nenhuma campanha de verdade. É a campanha, não mais o personagem, que possui as sessões de mesa e o caderno — ver `Campaign`. */
  campaignID?: string | null
  /** Vivo, morto (mas consultável) ou aposentado sem ter morrido. */
  status: CharacterStatus
  /** Quando morreu, se for o caso — a data real da mesa, não uma data da história. */
  diedOn?: string | null
  /** Nota livre sobre a morte (ex.: "caiu pra um dragão vermelho perto de Elturel"). */
  deathNote?: string | null
  /** Se este personagem nasceu de "Clonar personagem", o id de quem foi clonado — só pra rastrear a linhagem; nada no app depende disso pra funcionar. */
  clonedFromCharacterID?: string | null
  /** Caderno do personagem (formato 2, 2026-10-06): anotações do jogador sobre a história, NPCs e o próprio personagem. Cada personagem tem o seu; antes o caderno era da campanha (ver `Campaign.notebookEntries`). Optional pelo mesmo motivo de sempre: fichas antigas não têm a chave. */
  notebookEntries?: NotebookEntry[] | null
  lastAppliedLevel?: number | null
  lastAppliedAbilities?: AbilityScores | null
  /** Classe no último snapshot de consequências — sem ela, trocar de classe nunca aparecia como mudança (o "antes" usava a classe atual). */
  lastAppliedClass?: CharacterClass | null
  /** Qual campo foi editado por último, entre os que o motor de consequências acompanha ("level", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma") — decide ONDE mostrar o sinal (ver `effectiveChangedField`). Setado pelas views (`RecordHeaderForm`/`AbilityScoresForm`, via `.onChange`) a cada edição de verdade, e zerado em `markConsequencesReviewed()`. */
  lastChangedField?: string | null
  /** Não existe pra tudo que muda (edição manual do jogador não entra aqui) — só pra mudanças que o APP fez sozinho, feitas fora da visão do jogador naquele instante (ex.: escolher raça mexe em Força/Constituição na aba Sheet enquanto ele está na aba Description). Optional pelo mesmo motivo de sempre. */
  recentAutoChanges?: string[] | null
  activeEffects?: ActiveEffect[] | null
  /** LEGADO (2026-09-19): favoritar deixou de ser por personagem e virou preferência global do jogador — ver `CharacterLibrary.favoriteSpellIDs`. Este campo continua aqui só pra migrar fichas salvas ANTES da troca (`CharacterLibrary.load()` junta os favoritos de todo personagem num conjunto só, uma vez); nada escreve nele de novo, e nenhuma tela lê dele — todo mundo passou a consultar a biblioteca. */
  favoriteSpellIDs: string[]
  /** Esferas de acesso (TODO.md item 16) — `nil`/vazio até o jogador preencher pela primeira vez (nenhuma ficha antiga tem essa chave). Guardado como dicionário esfera→nível em vez de dois `Set`s separados porque uma esfera só pode ter UM nível por personagem — o dicionário já impede o estado inválido "maior E menor ao mesmo tempo" que dois conjuntos permitiriam sem checagem extra. */
  sphereAccess?: Record<string, SphereAccessLevel> | null
  /** Wild Talent (CPsiH, "fundação primeiro" dos Psiônicos, 2026-10-01) — `nil` até o jogador registrar um (toda ficha de antes desta versão não tem essa chave). Disponível pra QUALQUER classe, ao contrário de `sphereAccess`/`kit` — ver `WildTalent`. */
  wildTalent?: WildTalent | null
  /** `wizardSpellbook` fica no `PlayerCharacter` (não na Folha de Magias) pelo mesmo motivo de `sphereAccess`: é um traço PERMANENTE do personagem, não algo que só existe enquanto o dia de jogo dura. */
  wizardSpellbook: WizardSpellbookEntry[]
  /** Especialização de escola (2026-09-30, Table 22) — `nil` é generalista (comportamento de sempre: nenhum bônus, nenhuma restrição). Fica opcional/`nil` de propósito pra fichas antigas (Mago criado antes desta versão) continuarem decodificando sem ficar preso a uma escola que nunca escolheu. */
  wizardSchool?: WizardSchool | null
  /** Bloco psiônico do Psionicist (feito primeiro na web, 2026-10-06; o iPad ainda não tem). */
  psionics?: Psionics | null
}

export interface ProficiencyEntry {
  id?: string
  name?: string
  slots?: number | string
  checked?: boolean
  target?: string | null
  matchedProficiencyID?: string | null
}

export interface PsionicPowerEntry {
  id: string
  /** id em psionic_powers.json; null = poder escrito à mão. */
  powerID?: string | null
  name: string
  discipline?: string | null
  /** Science ou Devotion. */
  tier?: string | null
}

export interface PsionicUse {
  id: string
  /** ISO-8601 sem fração de segundo. */
  date: string
  sessionID?: string | null
  power?: string
  psp: number
}

export interface Psionics {
  /** PSPs máximos escritos à mão; null = calculado pela Tabela 5. */
  pspMaxOverride?: number | null
  /** PSPs atuais; null = cheio (igual ao máximo). */
  pspCurrent?: number | null
  primaryDiscipline?: string | null
  /** Disciplinas com acesso (inclui a principal). */
  disciplines?: string[]
  powers?: PsionicPowerEntry[]
  defenseModes?: string[]
  /** Registro de usos (PSPs gastos), para o XP sugerido do relatório da sessão. */
  uses?: PsionicUse[]
}

export interface QuantifiedItem {
  id: string
  name: string
  quantity: number
  /** Quantos já foram usados/gastos — marcado a mão com o mesmo contador de traço ("pauzinhos") da Priest Spell Sheet. Optional pelo mesmo motivo de sempre: linhas criadas antes desta versão não têm essa chave. */
  usedCount?: number | null
  /** Liga esta linha a um item de `MagicItemDatabase` (mesmo padrão de `Page2EquipmentEntry.matchedItemID`/`MundaneItemDatabase`) — só usado pela lista "Magic Items" (não por "Treasure / Other Possessions", que continua puramente texto livre). `nil` = linha digitada à mão pelo jogador (item caseiro/criado por ele) ou ficha salva antes desta versão existir; nesse caso cai pro fallback de nome exato, igual ao equipamento mundano. */
  matchedItemID?: string | null
}

export interface SavingThrows {
  paralyzationPoisonDeath: number
  rodStaffWand: number
  petrificationPolymorph: number
  breathWeapon: number
  spell: number
  /** Resistência mágica — linha extra do PDF oficial, texto livre (ex.: "10%"). Optional pelo mesmo motivo de sempre: fichas antigas não têm essa chave no JSON salvo. */
  spellResistance?: string | null
  /** Coluna "Mod" do PDF — ajuste numérico por jogada (positivo = bônus, facilita; negativo = penalidade), guardado por `SaveEntry.id` porque cada jogada não tinha campo próprio antes. Optional pelo mesmo motivo de sempre: fichas antigas não têm essa chave no JSON salvo. */
  modifiers?: Record<string, number> | null
}

export interface Session {
  id: string
  /** A data real da mesa — o dia em que vocês jogaram, não um dia dentro da história. */
  date: string
  title: string
  summary: string
  /** Sessões encerradas somem da faixa de abas e da lista principal do índice, mas os dados continuam intactos — arquivar nunca apaga. */
  isArchived: boolean
}

export interface SpellLogEntry {
  id: string
  /** Texto vindo da escrita com a Apple Pencil, antes de qualquer correção. */
  rawText: string
  /** Magia da base embutida, quando o casamento foi confirmado. */
  matchedSpellID?: string | null
  /** Nome final exibido — vem da magia casada ou do texto corrigido. */
  displayName: string
  spellLevel?: number | null
  /** Quantas vezes essa mesma magia foi conjurada nessa linha — um traço por conjuração, igual à contagem de Turn Undead, em vez de uma linha nova pra cada lançamento repetido do mesmo feitiço. */
  castCount: number
}

export interface SpellSheet {
  id: string
  /** ISO-8601 sem fração de segundo (JSONDecoder .iso8601). */
  date: string
  /** A sessão de mesa (data real) a que esse dia pertence. `nil` só em folhas de uma versão anterior a Sessão — `migrateLegacySheetsIfNeeded` resolve isso na primeira leitura. */
  sessionID?: string | null
  /** Como você chama esse dia na mesa ("3º dia em Elturel"). */
  title: string
  /** Os slots e o que foi memorizado neles neste dia. */
  slotBoard: SpellSlotBoard
  /** O que foi efetivamente conjurado ao longo do dia. */
  entries: SpellLogEntry[]
  /** Itens mágicos (anéis, cajados, bastões, armaduras...) — cada um pode ter mais de uma magia atrelada, com cargas do próprio item, não os slots de memorização do personagem, então vivem à parte da grade de círculos. */
  magicItems: MagicItem[]
  /** Anotações livres do dia, escritas à mão. */
  inkNotes?: string | null
  /** A Sabedoria do personagem no momento em que esta folha foi criada. Fica congelada aqui de propósito: se o personagem ganhar Sabedoria depois (item, ajuste), uma folha de uma data passada não deve mudar retroativamente — ela mostra a Sabedoria que valia naquele dia. */
  wisdomAtCreation: number
  /** Quantas vezes o clérigo já tentou expulsar mortos-vivos hoje. Sem teto — em 2e a tentativa de Turn Undead não é limitada por dia, só o resultado da rolagem é que decide se funciona. */
  turnUndeadUsed: number
}

export interface SpellSlot {
  id: string
  level: number
  caster: CasterType
  /** Magia preparada neste slot (id da base de magias), se houver. */
  preparedSpellID?: string | null
  /** Nome livre, para magias que não estão na base embutida. */
  preparedSpellName?: string | null
  isSpent: boolean
  /** Posição do slot dentro do próprio círculo — só existe pra dar ao `sortSlots()` um critério de desempate que NÃO seja o `id`. Optional pelo motivo de sempre: folha salva antes desta versão não tem essa chave; ausência vira `0` pra todo mundo, o que é inofensivo (ver comentário em `sortSlots`). Corrige o bug relatado pelo usuário (2026-09-28): "ao criar uma nova priest spell sheet, as magias aparecem em ordem totalmente aleatória" — `SpellSheet.nextDay()` dá um `id` NOVO e aleatório pra cada slot de propósito (dois dias não podem ter slots com a mesma identidade), mas o desempate do sort usava justamente esse `id`, então a ordem visual do círculo virava loteria a cada dia novo. `orderKey` nunca é regenerado por `nextDay()` — só o `id` muda — então a ordem sobrevive à criação da folha nova. */
  orderKey: number
}

export interface SpellSlotAllotment {
  id: string
  caster: CasterType
  level: number
  count: number
}

export interface SpellSlotBoard {
  slots: SpellSlot[]
}

export type SphereAccessLevel = "major" | "minor"

export interface ThievingSkillEntry {
  id: string
  skill: string
  value: string
}

export interface Treasure {
  platinum: number
  gold: number
  electrum: number
  silver: number
  copper: number
}

export interface WeaponEntry {
  id: string
  name: string
  attacks: string
  thac0: string
  damageSmall: string
  damageLarge: string
  range: string
  size?: string | null
  weaponType?: string | null
  speed?: string | null
  hitAdj?: string | null
  dmgAdj?: string | null
  rangeSpecial?: string | null
  /** `Weapon.id` quando esta linha veio do `WeaponPickerSheet` (Weapon Compendium) — mesmo padrão de `ProficiencyEntry.matchedProficiencyID`: liga a linha à base pra abrir a descrição completa num toque, sem depender do nome bater exatamente. `nil` numa linha digitada à mão (fichas antigas, ou arma caseira fora da base de 69 armas do PHB). */
  matchedWeaponID?: string | null
  /** Weapon Specialization (2026-09-30, regra do PHB conferida contra o resumo do Complete Fighter's Handbook cap. 4 — "Single-Weapon Proficiency, Weapon Specialization"): só Fighter (nunca Paladin ou Ranger) pode especializar. `Bool?` pela mesma razão de `hitAdj` acima — ficha antiga não tem essa chave. A UI (`WeaponFormRow`) semeia `thac0`("+1")/`dmgAdj`("+2") na primeira vez que liga isto, sem nunca sobrescrever o que o jogador já tiver escrito — o jogador continua livre pra editar os campos à mão depois. */
  isSpecialized?: boolean | null
}

export interface WildTalent {
  /** Nome(s) do(s) poder(es) conhecido(s) — texto livre (pode bater com `PsionicPower.title` da base, ou vir escrito à mão); mais de um poder é raro mas possível ("a lucky few" no texto da regra), por isso lista em vez de campo único. */
  powers: string[]
  /** PSP do wild talent — bem menor que um Psionicist de verdade (CPsiH: "the minimum number of PSPs necessary to use the power once" + 4x o custo de manutenção se o poder puder ser mantido; +4 PSP a cada nível novo depois). */
  psionicStrengthPoints: number
}

export type WizardSchool = "Abjuration" | "Alteration" | "Conjuration/Summoning" | "Divination" | "Enchantment/Charm" | "Illusion/Phantasm" | "Invocation/Evocation" | "Necromancy"

export interface WizardSpellbookEntry {
  id: string
  name: string
  /** Id da base embutida, quando reconhecida — usado pra achar círculo/ escola/descrição de verdade. */
  matchedSpellID?: string | null
  /** Círculo — só precisa vir preenchido quando `matchedSpellID == nil` (sem entrada na base pra ler o círculo de lá); `nil` quando bate com a base, o círculo real é sempre `Spell.level`, nunca este campo. */
  level?: number | null
}
