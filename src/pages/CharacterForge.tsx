import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ForgeAbilitiesStep } from '../components/ForgeAbilitiesStep'
import { ForgeClassStep } from '../components/ForgeClassStep'
import { ForgeIdentityStep } from '../components/ForgeIdentityStep'
import { ForgePsionicStep } from '../components/ForgePsionicStep'
import { ForgeRaceStep } from '../components/ForgeRaceStep'
import { ForgeSkillStep } from '../components/ForgeSkillStep'
import { ForgeStartStep } from '../components/ForgeStartStep'
import { ForgeWeaponStep } from '../components/ForgeWeaponStep'
import { PageHeader } from '../components/PageHeader'
import { blankCharacter, createCharacter } from '../lib/roster'
import { applyAutomatic, markConsequencesReviewed, pendingConsequences } from '../rules/consequences'
import { hasClass } from '../rules/multiclass'
import type { PlayerCharacter } from '../types/library'

// The Forge (docs/criacao-de-personagem.md): construtor guiado em etapas —
// Ability Scores, Name & Gender, Race, Class/Kit, Starting point,
// proficiências e, para psionicistas, os poderes psiônicos —, separado da ficha. O rascunho fica só em memória; nada grava no Supabase
// até o fim, quando vira um personagem de verdade (createCharacter) e o
// jogador cai na CharacterSheet normal, exatamente como "+ New character"
// faz hoje — só que chegando lá com nome, gênero, raça, classe/kit,
// nível/XP, HP, THAC0 e saves já certos.

const baseSteps = ['Ability Scores', 'Name & Gender', 'Race', 'Class & Kit', 'Starting point', 'Weapon Proficiencies', 'Nonweapon Proficiencies']

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

  // Psionicista (também multiclasse) ganha a etapa 8, dos poderes.
  const psionic = hasClass(draft, 'Psionicist')
  const stepTitles = psionic ? [...baseSteps, 'Psionic Powers'] : baseSteps

  const finish = async () => {
    setCreating(true)
    setError(null)
    try {
      const final = structuredClone(draft)
      // Escolheu poderes e depois trocou de classe: não leva o bloco junto.
      if (!psionic) final.psionics = null
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
    <div className={step === 8 ? 'page page-wide' : 'page'}>
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
        <ForgeClassStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          onSettings={setSettings}
          chosen={classChosen}
          onChoose={() => setClassChosen(true)}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && <ForgeStartStep draft={draft} mutate={mutate} onBack={() => setStep(4)} onNext={() => setStep(6)} />}
      {step === 6 && <ForgeWeaponStep draft={draft} mutate={mutate} onBack={() => setStep(5)} onNext={() => setStep(7)} />}
      {step === 7 && (
        <ForgeSkillStep
          draft={draft}
          mutate={mutate}
          settings={settings}
          onBack={() => setStep(6)}
          onFinish={psionic ? () => setStep(8) : () => void finish()}
          creating={creating}
          finishLabel={psionic ? 'Next: Psionic Powers →' : undefined}
        />
      )}
      {step === 8 && psionic && <ForgePsionicStep draft={draft} mutate={mutate} onBack={() => setStep(7)} onFinish={() => void finish()} creating={creating} />}
    </div>
  )
}
