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
4. Variantes dos suplementos (Psionicist do CPsiH, bardos do CBH, sacerdotes do
   CPrH): MC5.

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
| MC3 | Recursos por classe: magia (arcana e divina), Turn Undead, perícias de ladrão, psiônicos, XP do relatório | a fazer |
| MC4 | Classe dupla (humanos) | adiada (decisão 1) |
| MC5 | Kits (um no total; guerreiro/ladrão só classe única), bardos do CBH, Psionicist do CPsiH, sacerdotes do CPrH, dreno de nível | adiada (decisão 4) |

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
