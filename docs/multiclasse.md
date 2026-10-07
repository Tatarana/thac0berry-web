# Multiclasse: plano e log

Pedido do usuário (2026-10-07): suportar multiclasse **sem quebrar a experiência
atual**, antes do módulo do mestre. Este arquivo é o log do trabalho: decisões,
entregas e pendências. Atualizar a cada entrega.

## Regras (PHB cap. 3, "Multi-Class and Dual-Class Characters")

- Só semi-humanos. Combinações por raça (classes, não grupos):
  - Anão: Fighter/Thief, Fighter/Cleric.
  - Elfo: Fighter/Mage, Fighter/Thief, Mage/Thief, Fighter/Mage/Thief.
  - Gnomo: Fighter/Cleric, Fighter/Illusionist, Fighter/Thief, Cleric/Illusionist,
    Cleric/Thief, Illusionist/Thief (Illusionist = Mage com escola Illusion/Phantasm).
  - Halfling: Fighter/Thief.
  - Meio-elfo: Fighter/Cleric, Fighter/Thief, Fighter/Mage, Cleric/Ranger,
    Cleric/Mage, Thief/Mage, Fighter/Mage/Cleric (Druid pode ocupar o lugar de Cleric).
- XP dividido igualmente entre as classes; cada classe tem nível próprio, com o
  limite racial dela.
- Combate: melhor THAC0 e melhor save de cada categoria.
- HP: média dos dados de vida das classes; bônus de CON dividido (o de guerreiro
  vale se uma das classes for Fighter).
- Proficiências: maior número inicial; ritmo mais rápido.
- Restrições: sacerdote segue as armas do culto; mago não conjura de armadura
  (exceto elfo com elven chain); ladrão em armadura só Open Locks e Detect Noise.
- Kits (Complete Handbooks): um kit no total (CPrH); kits de guerreiro e de ladrão
  só para classe única (CFH, CTH).

## Decisões do usuário (2026-10-07)

1. Só multiclasse agora (MC1 a MC3). Classe dupla (MC4) fica para depois.
2. HP: o jogador calcula; o app só mostra a regra.
3. Combinação fora da tabela: permitida, com aviso (como os limites raciais).
4. Variantes dos suplementos (bardos do CBH, sacerdotes do CPrH): MC5.

## Decisões do usuário (2026-10-07, plano da MC3)

5. Psionicist entra no seletor e fica na MC3 (antes estava na MC5). Combinações
   do CPsiH (cap. 1): anão e halfling, Fighter/Psionicist e Thief/Psionicist;
   gnomo, elfo e meio-elfo não podem.
6. Bônus de requisito primário no XP do relatório vai pelo tipo de XP: magia de
   Cleric e Turn Undead usam WIS; magia de Mage usa INT.
7. Página 4 de multiclasse: as tabelas de cada classe, uma após a outra.
8. MC3 em três entregas: MC3a (magia), MC3b (Turn Undead, ladrão, página 4),
   MC3c (XP do relatório e restrições).

## Princípio de compatibilidade

- `characterClass` e `level` continuam sendo a **classe principal**. As outras
  classes ficam num campo **opcional** `multiClasses` (classe e nível). Ficha sem
  o campo é classe única, igual a hoje.
- O campo entra no schema como extensão feita primeiro na web
  (`WEB_FIRST_PROPERTIES` em `thac0berry-ipad/Scripts/gen_library_schema.py`). O
  iPad atual lê a ficha como classe única (a principal) e perde o campo se salvar.
- As regras passam a trabalhar com a lista de classes do personagem; para classe
  única a lista tem um item e o resultado é idêntico (garantido pelos testes e
  pelos valores de referência do iPad).
- Quem não usa multiclasse não vê mudança de tela.

## Entregas

| # | Entrega | Estado |
|---|---|---|
| MC1 | Formato (`multiClasses`) e regras combinadas, sem tela | feita (web v0.31.0) |
| MC2 | Ficha: seletor de multiclasse, cabeçalho "Fighter/Mage 5/4", XP por classe, consequências | feita (web v0.32.0) |
| MC3a | Magia por classe (slots, abas, folha de magia, grimório) e Psionicist no seletor (combinações do CPsiH, aba Psionics pelo nível dele) | feita (web v0.33.0) |
| MC3b | Turn Undead pelo nível de Cleric, perícias de ladrão e backstab pelo nível de Thief, página 4 com as tabelas de cada classe | feita (web v0.34.0) |
| MC3c | XP do relatório por tipo (bônus de WIS/INT pela decisão 6, XP psiônico) e avisos de restrição (armadura do mago, armas do sacerdote) | a fazer |
| MC4 | Classe dupla (humanos) | adiada (decisão 1) |
| MC5 | Kits (um no total; guerreiro/ladrão só classe única), bardos do CBH, sacerdotes do CPrH, dreno de nível | adiada (decisão 4) |

## Pendências (2026-10-07, para quem continuar)

Em aberto, em ordem:

1. ~~**Merge dos PRs**~~ — feito em 2026-10-07 (ver o log). Era:
   - Tatarana/thac0berry-web#1, branch `claude/dreamy-thompson-fqoc3x`: MC3a,
     v0.33.1 e MC3b (v0.34.0). CI local verde (lint, `types --check`, build,
     72 testes).
   - Tatarana/thac0berry-data#1, mesmo nome de branch: proficiências bônus de
     4 kits (o "CRH)").
2. **Depois do merge dos dados:** `python Scripts/sync_data.py` no repo do iPad.
3. **Teste na tela pelo usuário** (personagem "Teste MC" no Sandbox e o
   Fighter/Mage em campanha): MC3a, v0.33.1 e MC3b só foram conferidas por
   testes e pela renderização da página 4, não no navegador logado. Conferir:
   "?" do HP, abas Spells/Spellbook, "First day" criado ao abrir a ficha,
   folha com círculos "Wizard"/"Priest", página 4 com as duas seções.
4. **Ficha do usuário:** apagar à mão a proficiência "CRH)" já gravada no
   Fighter/Mage (a correção dos dados não mexe em fichas salvas).
5. **MC3c** (próxima entrega, plano aprovado):
   - XP do relatório por tipo (decisão 6): `suggestedXP` em
     `src/rules/sessionReport.ts` recebe uma classe só (`SessionReport.tsx`
     passa a principal). Separar slots arcanos (tabela do Mage, bônus de INT)
     e divinos + Turn Undead (tabela do Cleric, bônus de WIS); total
     dividido entre as classes, como em `classProgress`.
   - XP psiônico (`PsionicReport` em `src/components/PsionicsPanel.tsx`):
     também dividido entre as classes num multiclasse.
   - Avisos de restrição (só texto, como os outros): mago não conjura de
     armadura, exceto elfo com elven chain; sacerdote só armas do culto
     (Cleric multiclasse: só armas de concussão). Texto exato no PHB,
     `phb_ch03_multi_class_and_dual_class_characters`.
6. **Dados, listas `recommended`:** o mesmo corte nas vírgulas em 13 kits
   (adviser, nobleman_priest, outlaw_druid, barbarian_jungle_dwarf,
   barbarian_lythari, barbarian_wild_elf, forester,
   gladiator_fugitive_hillsfar, mariner_of_evermeet, merchant_sea_elf,
   exile_gray_dwarf, scout_faer_n, e um BOM no meio de "mountaineering" no
   scout_faer_n). Só texto, não entra na ficha. Precisa de proposta e "ok"
   (regra 1 do thac0berry-data); alguns pedaços não se juntam sozinhos
   ("(Warrior" sem fechar no nobleman_priest).
7. **MC4** (classe dupla) e **MC5** (kits, bardos do CBH, sacerdotes do CPrH,
   dreno de nível): adiadas (decisões 1 e 4).

Ambiente: build e testes da web pedem o thac0berry-data ao lado
(`../thac0berry-data`) ou `DATA_DIR=<clone>/data`; o `types --check` pede
`SCHEMA_DIR=<clone>/schemas`.

## Log

- 2026-10-07: plano aprovado com as decisões acima. Início da MC1.
- 2026-10-07, MC1 feita (web v0.31.0):
  - schema: `multiClasses` e `lastAppliedMultiClasses` (lista de `ClassLevel`)
    como extensões feitas primeiro na web (gerador do iPad, branch `n3`);
  - `src/rules/multiclass.ts`: lista de classes, rótulos "Fighter/Mage" e "5/4",
    XP dividido e próximo nível por classe, proficiências (maior inicial, ritmo
    mais rápido), penalidade, texto da regra de HP, combinações por raça e avisos
    (humano, fora da tabela, especialista, limite racial por classe);
  - `resolveRule` (rules.ts): THAC0 e saves = o melhor entre as classes; magia
    de cada classe pelo nível dela. Motor de consequências guarda o retrato das
    outras classes só quando há multiclasse;
  - testes: os 59 de antes passam iguais (classe única não mudou) e 8 novos.
- 2026-10-07, MC2 feita (web v0.32.0):
  - ficha (página 1): "+" tracejado ao lado da classe abre a janela de
    multiclasse (`src/components/MultiClass.tsx`): acrescentar/tirar classes,
    combinações padrão da raça (um toque adota), avisos e regra de HP. Cabeçalho
    mostra "Fighter /Mage /Thief" e os níveis "1 / 2 / 1", cada um editável;
  - consequências: `setMultiClasses`/`setMultiClassLevel` passam pelo motor
    (THAC0, saves e slots ficam pendentes até revisar); o retrato de antes do
    primeiro multiclasse é guardado para o diff funcionar;
  - dado de vida padrão vira "d10/d4/d6"; a regra de HP aparece no quadro de HP;
  - slots de proficiência de arma: maior inicial + ritmo mais rápido + INT;
  - página 2: "Each Class (XP divided equally)" com o próximo nível de cada
    classe (✓ quando já dá para subir); página 3 e título das consequências com
    "Fighter/Mage/Thief";
  - aviso vermelho sob o cabeçalho quando a combinação está fora da tabela,
    o personagem é humano, é especialista ou passa do limite racial;
  - classe única: só aparece o "+" ao lado da classe; o resto igual.
  - Teste com o personagem "Teste MC" (elfo Fighter/Mage/Thief, criado no
    Sandbox da conta do usuário para os testes da multiclasse).
- 2026-10-07: plano da MC3 aprovado (decisões 5 a 8).
- 2026-10-07, MC3a feita (web v0.33.0):
  - `computedSpellSlotAllotments` soma os slots de cada classe conjuradora pelo
    nível dela (Fighter/Mage com Fighter principal antes ficava sem slots);
  - `multiclass.ts`: `levelOf`, `hasClass`, `hasSpellSheetAny`,
    `isArcaneCasterAny`, `casterLevel` e `spellSheetAbility` (WIS se há magia
    divina, senão INT); usados na ficha, em `roster.ts` e nas sessões;
  - abas Spells, Spellbook e Psionics aparecem se qualquer classe as tem;
    acrescentar uma conjuradora pela janela cria o "First day" (como trocar
    de classe);
  - folha de magia: título "Wizard/Priest Spell Sheet", cabeçalho com
    "Fighter/Mage 6/5", círculos com "Wizard"/"Priest" quando a folha tem os
    dois tipos, dano pelo nível da classe que conjura;
  - Psionicist: combinações do CPsiH no seletor (chips) e nos avisos; aba
    Psionics (PSPs, disciplinas, Tabela 4) pelo nível de Psionicist;
  - testes: os 67 de antes passam iguais e 3 novos.
- 2026-10-07, correções do teste do usuário (web v0.33.1):
  - a regra de HP do multiclasse quebrava o quadro de HP: agora fica atrás de
    um "?" ao lado de "Hit Points" (`RuleLink`, o `RuleLinkButton` do iPad), que
    abre a explicação e o link para a regra do PHB;
  - multiclasse com classe conjuradora, em campanha e sem folha de magia (ficha
    de antes da MC3a) ganha o "First day" ao abrir a ficha; trava contra dois
    "First day" quando a troca de classe e a abertura acontecem juntas;
  - "CRH)" nas proficiências: defeito em `kits.json` do thac0berry-data (listas
    `bonus` cortadas nas vírgulas de dentro dos parênteses, 4 kits). Correção
    em `scripts/fix_kit_bonus_proficiencies.py` daquele repo
    (Tatarana/thac0berry-data#1); depois do merge, `sync_data.py` no iPad. As listas `recommended` têm o mesmo corte em 13 kits (só texto):
    pendente.
- 2026-10-07, MC3b feita (web v0.34.0):
  - página 4: `referenceSections` dá uma seção por tipo de página (Warrior,
    Wizard, Rogue, Cleric), cada uma com a classe e o nível que destaca;
    multiclasse mostra "Reference Tables" com as seções em sequência; a ficha
    tem página 4 se qualquer classe tem (`recordSheetPages`);
  - Turning Undead e Priest Spell Progression destacam o nível de Cleric;
    Wizard Spell Progression, o de Mage; backstab e Bard Spell Progression, o
    da classe ladina;
  - "?" (`RuleLink`) nos títulos das tabelas, como no iPad (proficiências,
    especialização, perícias de ladrão, armadura, backstab) e também nas
    progressões de magia de mago e sacerdote;
  - página 1: perícias de ladrão aparecem se qualquer classe é ladina, com a
    base e o backstab dela (`rogueClass`), e a regra da armadura do ladrão
    multiclasse (PHB cap. 3);
  - especialização em arma: só guerreiro de classe única (PHB cap. 5), no
    botão da tabela de armas e no texto da página 4;
  - testes: 72 (2 novos).
- 2026-10-07, merge e publicação (sessão principal):
  - Tatarana/thac0berry-data#1 validado (`validate_schemas.py` e CI "Validar
    dados" verdes; os 4 nomes novos existem no compêndio) e incorporado ao `main`;
  - Tatarana/thac0berry-web#1 testado no navegador logado: "Teste MC" (elfo
    Fighter/Mage/Thief 1/2/1, campanha "Teste W3.1b B"): "?" da regra de HP,
    abas Spell Sheets e My Spellbook, folha "Wizard Spell Sheet" com
    Intelligence e "Fighter/Mage/Thief 1/2/1", página 4 com as seções Warrior
    (Fighter 1), Wizard (Mage 2) e Rogue (Thief 1), perícias de ladrão com os
    valores do elfo e as notas de backstab e armadura. Classe única (Kelmonito,
    Cleric 12, só leitura): sem "+" de aviso, página 4 "Cleric Reference
    Tables";
  - observação: a folha "Day 3" (2026-10-06 12:21) do Kelmonito foi gravada com
    slots arcanos (INT 11), provavelmente numa troca de classe temporária; a folha
    agora mostra o título pelo tipo dos slots ("Wizard"). Avisado ao usuário;
  - merge no `main` (web v0.34.0) e publicação no GitHub Pages concluída.
  - Próximo: MC3c (pendência 5).
