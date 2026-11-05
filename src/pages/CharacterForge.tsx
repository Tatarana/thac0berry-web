import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/context'
import { useNavigate } from 'react-router'
import { ForgeAbilitiesStep } from '../components/ForgeAbilitiesStep'
import { ForgeAlignmentStep } from '../components/ForgeAlignmentStep'
import { ForgeClassStep } from '../components/ForgeClassStep'
import { ForgeDescriptionStep } from '../components/ForgeDescriptionStep'
import { ForgeEquipmentStep } from '../components/ForgeEquipmentStep'
import { ForgeGate } from '../components/ForgeGate'
import { ForgeIdentityStep } from '../components/ForgeIdentityStep'
import { ForgePsionicStep } from '../components/ForgePsionicStep'
import { ForgeRaceStep } from '../components/ForgeRaceStep'
import { ForgeReveal } from '../components/ForgeReveal'
import { ForgeSkillStep } from '../components/ForgeSkillStep'
import { ForgeSpellStep } from '../components/ForgeSpellStep'
import { ForgeStartStep } from '../components/ForgeStartStep'
import { ForgeThievingStep } from '../components/ForgeThievingStep'
import { ForgeWeaponStep } from '../components/ForgeWeaponStep'
import { PageHeader } from '../components/PageHeader'
import { artAttachment, portraitJPEG, uploadAttachment } from '../lib/attachments'
import { blobToDataURL, clearForgeDraft, dataURLToFile, keepForgeDraft, readForgeDraft } from '../lib/forgeDraft'
import { genderOf, heroImages } from '../lib/forgeImages'
import { currentSiteImages } from '../lib/siteImages'
import { blankCharacter, createCharacter } from '../lib/roster'
import { applyAutomatic, applyClassTables, markConsequencesReviewed, pendingConsequences } from '../rules/consequences'
import type { Lean } from '../rules/alignment'
import { emptyMarket, type MarketState } from '../rules/market'
import { hasClass, rogueClass } from '../rules/multiclass'
import { matchRace } from '../rules/raceKit'
import { canonicalClass } from '../rules/rules'
import { spellCasting, type BookState } from '../rules/spellbook'
import type { Training } from '../rules/thievingPoints'
import type { PlayerCharacter } from '../types/library'

// The Forge (docs/criacao-de-personagem.md): construtor guiado em etapas —
// Ability Scores, Name & Gender, Race, Class/Kit, Starting point,
// proficiências e, para psionicistas e conjuradores, os poderes psiônicos e as magias —, separado da ficha. O rascunho fica só em memória (e neste aparelho durante o login do fim, ver lib/forgeDraft); nada grava no Supabase
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
  // Voltando do login do fim: tudo recomeça de onde estava.
  const [resumed] = useState(readForgeDraft)
  const [step, setStep] = useState(resumed?.step ?? 1)
  // blankCharacter devolve o personagem em branco sem `spellSheets` (campo
  // só do Supabase); aqui, em memória, completa com um array vazio, igual ao
  // que um personagem novo também tem antes da primeira folha de magia.
  const [draft, setDraft] = useState<PlayerCharacter>(() => resumed?.draft ?? { ...blankCharacter(null), spellSheets: [] })
  // A ficha em branco nasce como Fighter: a etapa 4 só mostra uma classe
  // escolhida depois que o jogador escolher uma de fato.
  const [classChosen, setClassChosen] = useState(resumed?.classChosen ?? false)
  // Cenários da mesa escolhidos na etapa de raça; valem também para classes e kits.
  const [settings, setSettings] = useState<string[]>(resumed?.settings ?? [])
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
  const [spellBook, setSpellBook] = useState<{ cls: string; state: BookState } | null>(resumed?.spellBook ?? null)
  // Para que classe as esferas gravadas foram feitas (ver ForgeSpellStep).
  // O retrato escolhido na última etapa: sobe para o Storage só no "Create character".
  const [portrait, setPortrait] = useState<{ file: File; url: string } | null>(() => {
    if (!resumed?.portrait) return null
    const file = dataURLToFile(resumed.portrait)
    return { file, url: URL.createObjectURL(file) }
  })
  const { session, signInWithGoogle } = useAuth()
  const changePortrait = (file: File | null) =>
    setPortrait((old) => {
      if (old) URL.revokeObjectURL(old.url)
      return file ? { file, url: URL.createObjectURL(file) } : null
    })
  // A bolsa (rolagem, ouro do mestre) e a sacola da etapa de equipamento.
  const [market, setMarket] = useState<MarketState>(resumed?.market ?? emptyMarket)
  // Os pontos de treino das perícias de ladrão, por perícia; trocar a classe ladina recomeça.
  const [thiefTraining, setThiefTraining] = useState<{ cls: string; training: Training } | null>(resumed?.thiefTraining ?? null)
  // As respostas dos dilemas do alinhamento (null = pulou as perguntas).
  const [alignmentAnswers, setAlignmentAnswers] = useState<Lean[] | null>(resumed ? resumed.alignmentAnswers : [])
  const [sphereFor, setSphereFor] = useState<string | null>(resumed?.sphereFor ?? null)

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
    'Description' as const,
  ]
  const stepTitles = [...baseSteps, ...extras]
  const extra = step > baseSteps.length ? extras[step - baseSteps.length - 1] : undefined
  const nextAfter = (s: number) => (s < stepTitles.length ? () => setStep(s + 1) : () => void finish())
  const labelAfter = (s: number) => (s < stepTitles.length ? `Next: ${stepTitles[s]} →` : undefined)

  // O fechamento: a cena do herói forjado roda enquanto o personagem é gravado.
  const [reveal, setReveal] = useState<{ character: PlayerCharacter; id: string | null; error: string | null } | null>(null)

  const save = async (final: PlayerCharacter) => {
    setReveal({ character: final, id: null, error: null })
    try {
      const userID = session?.user.id
      if (!userID) throw new Error('sign in to keep this character')
      // O retrato é o que o jogador enviou ou, sem ele, a arte que o Forge mostrou.
      const art = () => currentSiteImages(heroImages(matchRace(final.race), canonicalClass(final.characterClass), genderOf(final.sex)))
      const attachment = portrait ? await uploadAttachment(userID, await portraitJPEG(portrait.file), 'image/jpeg') : await artAttachment(userID, await art())
      const id = await createCharacter(null, final, attachment)
      setReveal({ character: final, id, error: null })
    } catch (reason) {
      setReveal({ character: final, id: null, error: reason instanceof Error ? reason.message : String(reason) })
    }
  }

  // Todo personagem tem dono: sem login, o Forge pede antes de selar.
  const [gate, setGate] = useState(false)
  const signIn = async () => {
    try {
      const jpeg = portrait ? await portraitJPEG(portrait.file) : null
      const kept = keepForgeDraft({
        step,
        draft,
        classChosen,
        settings,
        spellBook,
        market,
        thiefTraining,
        alignmentAnswers,
        sphereFor,
        portrait: jpeg ? await blobToDataURL(new Blob([jpeg as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })) : null,
      })
      if (!kept) throw new Error('this browser would not keep your hero during sign-in')
      await signInWithGoogle()
    } catch (reason) {
      setGate(false)
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const finish = async () => {
    if (!session) {
      setGate(true)
      return
    }
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
      // THAC0 e saves da classe mesmo no 1º nível (não há consequência pendente ali).
      applyClassTables(final)
      markConsequencesReviewed(final)
      setCreating(false)
      await save(final)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setCreating(false)
    }
  }

  // Voltou do login: o rascunho cumpriu o papel, e o herói é selado sem pedir de novo.
  const sealed = useRef(false)
  useEffect(() => {
    clearForgeDraft()
    if (resumed && session && !sealed.current) {
      sealed.current = true
      void finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir a tela
  }, [])

  if (reveal) {
    return (
      <div className="page page-wide">
        <PageHeader title="The Forge" backTo="/characters" />
        <ForgeReveal
          character={reveal.character}
          portraitURL={portrait?.url ?? null}
          savedID={reveal.id}
          error={reveal.error}
          onOpen={(id) => navigate(`/characters/${id}`)}
          onRetry={() => void save(reveal.character)}
          onBack={() => setReveal(null)}
        />
      </div>
    )
  }

  return (
    <div className={extra || step === 9 ? 'page page-wide' : 'page'}>
      <PageHeader title="The Forge" backTo="/characters" />
      <ForgeTrail stepTitles={stepTitles} current={step} onSelect={setStep} />
      {gate && (
        <ForgeGate
          images={portrait ? [portrait.url] : heroImages(matchRace(draft.race), canonicalClass(draft.characterClass), genderOf(draft.sex))}
          name={draft.name}
          onSignIn={() => void signIn()}
          onBack={() => setGate(false)}
        />
      )}
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
          onFinish={nextAfter(step)}
          creating={creating}
          finishLabel={labelAfter(step)}
        />
      )}
      {extra === 'Description' && (
        <ForgeDescriptionStep
          draft={draft}
          mutate={mutate}
          portraitURL={portrait?.url ?? null}
          onPortrait={changePortrait}
          creating={creating}
          onBack={() => setStep(step - 1)}
          onFinish={() => void finish()}
        />
      )}
    </div>
  )
}
