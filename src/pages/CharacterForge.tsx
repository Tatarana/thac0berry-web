import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ForgeAbilitiesStep } from '../components/ForgeAbilitiesStep'
import { ForgeClassStep } from '../components/ForgeClassStep'
import { ForgeIdentityStep } from '../components/ForgeIdentityStep'
import { ForgeRaceStep } from '../components/ForgeRaceStep'
import { ForgeStartStep } from '../components/ForgeStartStep'
import { PageHeader } from '../components/PageHeader'
import { blankCharacter, createCharacter } from '../lib/roster'
import { applyAutomatic, markConsequencesReviewed, pendingConsequences } from '../rules/consequences'
import type { PlayerCharacter } from '../types/library'

// The Forge (B1, docs/criacao-de-personagem.md): construtor guiado em 5
// etapas — Abilities, Name & Gender, Race, Class/Kit, Starting point —,
// separado da ficha. O rascunho fica só em memória; nada grava no Supabase
// até o fim, quando vira um personagem de verdade (createCharacter) e o
// jogador cai na CharacterSheet normal, exatamente como "+ New character"
// faz hoje — só que chegando lá com nome, gênero, raça, classe/kit,
// nível/XP, HP, THAC0 e saves já certos.

const stepTitles = ['Ability Scores', 'Name & Gender', 'Race', 'Class & Kit', 'Starting point']

// Trilha de contas com o nome de cada etapa (como no protótipo); as já
// feitas são botões para voltar.
function ForgeTrail({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
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
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = (fn: (c: PlayerCharacter) => void) =>
    setDraft((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })

  const finish = async () => {
    setCreating(true)
    setError(null)
    try {
      const final = structuredClone(draft)
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
    <div className="page">
      <PageHeader title="The Forge" backTo="/characters" />
      <ForgeTrail current={step} onSelect={setStep} />
      {error && (
        <div className="result-line">
          <span className="result-fail">✖</span>
          <span>Could not create the character: {error}</span>
        </div>
      )}
      {step === 1 && <ForgeAbilitiesStep draft={draft} mutate={mutate} onNext={() => setStep(2)} />}
      {step === 2 && <ForgeIdentityStep draft={draft} mutate={mutate} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <ForgeRaceStep draft={draft} mutate={mutate} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <ForgeClassStep draft={draft} mutate={mutate} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <ForgeStartStep draft={draft} mutate={mutate} onBack={() => setStep(4)} onFinish={() => void finish()} creating={creating} />}
    </div>
  )
}
