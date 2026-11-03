import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ForgeAbilitiesStep } from '../components/ForgeAbilitiesStep'
import { ForgeAlignmentStep } from '../components/ForgeAlignmentStep'
import { ForgeClassStep } from '../components/ForgeClassStep'
import { ForgeEquipmentStep } from '../components/ForgeEquipmentStep'
import { ForgeIdentityStep } from '../components/ForgeIdentityStep'
import { ForgePsionicStep } from '../components/ForgePsionicStep'
import { ForgeRaceStep } from '../components/ForgeRaceStep'
import { ForgeSkillStep } from '../components/ForgeSkillStep'
import { ForgeSpellStep } from '../components/ForgeSpellStep'
import { ForgeStartStep } from '../components/ForgeStartStep'
import { ForgeThievingStep } from '../components/ForgeThievingStep'
import { ForgeWeaponStep } from '../components/ForgeWeaponStep'
import { PageHeader } from '../components/PageHeader'
import { blankCharacter, createCharacter } from '../lib/roster'
import { applyAutomatic, markConsequencesReviewed, pendingConsequences } from '../rules/consequences'
import type { Lean } from '../rules/alignment'
import { emptyMarket, type MarketState } from '../rules/market'
import { hasClass, rogueClass } from '../rules/multiclass'
import { spellCasting, type BookState } from '../rules/spellbook'
import type { Training } from '../rules/thievingPoints'
import type { PlayerCharacter } from '../types/library'

// The Forge (docs/criacao-de-personagem.md): construtor guiado em etapas —
// Ability Scores, Name & Gender, Race, Class/Kit, Starting point,
// proficiências e, para psionicistas e conjuradores, os poderes psiônicos e as magias —, separado da ficha. O rascunho fica só em memória; nada grava no Supabase
// até o fim, quando vira um personagem de verdade (createCharacter) e o
// jogador cai na CharacterSheet normal, exatamente como "+ New character"
// faz hoje — só que chegando lá com nome, gênero, raça, classe/kit,
// nível/XP, HP, THAC0 e saves já certos.

const baseSteps = ['Ability Scores', 'Name & Gender', 'Race', 'Alignment', 'Class & Kit', 'Starting point', 'Weapon Proficiencies', 'Nonweapon Proficiencies', 'Equipment']

// Trilha de contas com o nome de cada etapa (como no protótipo); as já
// feitas são botões para voltar.
function ForgeTrail({ stepTitles, current, onSelect }: { stepTitles: string[]; current: number; onSelect: (step: number) => void }) {
  return (
    <nav className="forge-trail" aria-label="Builder progress">
      {stepTitles.map((title, index) => {
        const step = index + 1
        const state = step < current ? 'done' : step === current ? 'active' : 'upcoming'
        const content = (
          <>
            <span className="trail-dot" />
            <span className="trail-label">{title}</span>
          </>
        )
        return step < current ? (
          <button key={title} type="button" className={`trail-bead trail-${state}`} onClick={() => onSelect(step)} aria-label={`Back to ${title}`}>
            {content}
          </button>
        ) : (
          <div key={title} className={`trail-bead trail-${state}`} aria-current={step === current ? 'step' : undefined}>
            {content}
          </div>
        )
      })}
    </nav>
  )
}

export function CharacterForge() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  // blankCharacter devolve o personagem em branco sem `spellSheets` (campo
  // só do Supabase); aqui, em memória, completa com um array vazio, igual ao
  // que um personagem novo também tem antes da primeira folha de magia.
  const [draft, setDraft] = useState<PlayerCharacter>(() => ({ ...blankCharacter(null), spellSheets: [] }))
  // A ficha em branco nasce como Fighter: a etapa 4 só mostra uma classe
  // escolhida depois que o jogador escolher uma de fato.
  const [classChosen, setClassChosen] = useState(false)
  // Cenários da mesa escolhidos na etapa de raça; valem também para classes e kits.
  const [settings, setSettings] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = (fn: (c: PlayerCharacter) => void) =>
    setDraft((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })

  // O grimório em construção (método, dados, falhas), por classe arcana: voltar à
  // etapa não rola de novo; trocar de mago para bardo recomeça.
  const [spellBook, setSpellBook] = useState<{ cls: string; state: BookState } | null>(null)
  // Para que classe as esferas gravadas foram feitas (ver ForgeSpellStep).
  // A bolsa (rolagem, ouro do mestre) e a sacola da etapa de equipamento.
  const [market, setMarket] = useState<MarketState>(emptyMarket)
  // Os pontos de treino das perícias de ladrão, por perícia; trocar a classe ladina recomeça.
  const [thiefTraining, setThiefTraining] = useState<{ cls: string; training: Training } | null>(null)
  // As respostas dos dilemas do alinhamento (null = pulou as perguntas).
  const [alignmentAnswers, setAlignmentAnswers] = useState<Lean[] | null>([])
  const [sphereFor, setSphereFor] = useState<string | null>(null)

  // Etapas extras depois das proficiências: poderes psiônicos (psionicista,
  // também multiclasse) e magias (mago, bardo, clérigo, druida).
  const psionic = hasClass(draft, 'Psionicist')
  const casting = spellCasting(draft)
  const caster = !!(casting.arcane || casting.divine)
  // Perícias de ladrão (ladrão, bardo, ninja, gypsy; também multiclasse) vêm primeiro.
  const rogue = !!rogueClass(draft)
  const extras = [
    ...(rogue ? (['Thieving Skills'] as const) : []),
    ...(psionic ? (['Psionic Powers'] as const) : []),
    ...(caster ? (['Spells'] as const) : []),
  ]
  const stepTitles = [...baseSteps, ...extras]
  const extra = step > baseSteps.length ? extras[step - baseSteps.length - 1] : undefined
  const nextAfter = (s: number) => (s < stepTitles.length ? () => setStep(s + 1) : () => void finish())
  const labelAfter = (s: number) => (s < stepTitles.length ? `Next: ${stepTitles[s]} →` : undefined)

  const finish = async () => {
    setCreating(true)
    setError(null)
    try {
      const final = structuredClone(draft)
      // Escolheu poderes ou magias e depois trocou de classe: não leva junto.
      if (!psionic) final.psionics = null
      if (!casting.arcane) {
        final.wizardSpellbook = []
        final.wizardSchool = null
      }
      if (!casting.divine) final.sphereAccess = null
      if (!rogue) final.thievingSkills = null
      applyAutomatic(pendingConsequences(final), final)
      markConsequencesReviewed(final)
      const id = await createCharacter(null, final)
      navigate(`/characters/${id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setCreating(false)
    }
  }

  return (
    <div className={extra || step === 9 ? 'page page-wide' : 'page'}>
      <PageHeader title="The Forge" backTo="/characters" />
      <ForgeTrail stepTitles={stepTitles} current={step} onSelect={setStep} />
      {error && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>Could not create the character: {error}</span>
        </div>
      )}
      {step === 1 && <ForgeAbilitiesStep draft={draft} mutate={mutate} onNext={() => setStep(2)} />}
      {step === 2 && <ForgeIdentityStep draft={draft} mutate={mutate} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && (
        <ForgeRaceStep draft={draft} mutate={mutate} settings={settings} onSettings={setSettings} onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <ForgeAlignmentStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          answers={alignmentAnswers}
          onAnswers={setAlignmentAnswers}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <ForgeClassStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          onSettings={setSettings}
          chosen={classChosen}
          onChoose={() => setClassChosen(true)}
          onNext={() => setStep(6)}
          onBack={() => setStep(4)}
        />
      )}
      {step === 6 && <ForgeStartStep draft={draft} mutate={mutate} onBack={() => setStep(5)} onNext={() => setStep(7)} />}
      {step === 7 && <ForgeWeaponStep draft={draft} mutate={mutate} onBack={() => setStep(6)} onNext={() => setStep(8)} />}
      {step === 8 && (
        <ForgeSkillStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          onBack={() => setStep(7)}
          onFinish={nextAfter(8)}
          creating={creating}
          finishLabel={labelAfter(8)}
        />
      )}
      {step === 9 && (
        <ForgeEquipmentStep
          draft={draft}
          mutate={mutate}
          market={market}
          onMarket={setMarket}
          stepNumber={9}
          nextLabel={labelAfter(9) ?? 'Create character'}
          onBack={() => setStep(8)}
          onNext={nextAfter(9)}
        />
      )}
      {extra === 'Thieving Skills' && (
        <ForgeThievingStep
          draft={draft}
          mutate={mutate}
          training={thiefTraining && thiefTraining.cls === rogueClass(draft)?.characterClass ? thiefTraining.training : {}}
          onTraining={(training) => setThiefTraining({ cls: rogueClass(draft)?.characterClass ?? '', training })}
          stepNumber={step}
          nextLabel={labelAfter(step) ?? 'Create character'}
          onBack={() => setStep(step - 1)}
          onNext={nextAfter(step)}
        />
      )}
      {extra === 'Psionic Powers' && (
        <ForgePsionicStep
          draft={draft}
          mutate={mutate}
          stepNumber={step}
          onBack={() => setStep(step - 1)}
          onFinish={nextAfter(step)}
          creating={creating}
          finishLabel={labelAfter(step)}
        />
      )}
      {extra === 'Spells' && (
        <ForgeSpellStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          stepNumber={step}
          book={spellBook && spellBook.cls === casting.arcane ? spellBook.state : null}
          onBook={(state) => setSpellBook({ cls: casting.arcane ?? '', state })}
          sphereFor={sphereFor}
          onSphereFor={setSphereFor}
          onBack={() => setStep(step - 1)}
          onFinish={() => void finish()}
          creating={creating}
        />
      )}
    </div>
  )
}
