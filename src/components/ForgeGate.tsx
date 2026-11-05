import { ForgeImage } from './ForgeParts'

// Antes de selar: todo herói tem dono. O rascunho espera neste aparelho (lib/forgeDraft).
export function ForgeGate({ images, name, onSignIn, onBack }: { images: string[]; name: string; onSignIn: () => void; onBack: () => void }) {
  return (
    <div className="fg-gate" role="dialog" aria-modal="true" aria-labelledby="fg-gate-title">
      <div className="fg-portrait">
        <ForgeImage images={images} alt="" />
      </div>
      <div className="fg-words">
        <h2 id="fg-gate-title">{name ? `${name} needs a master` : 'Your hero needs a master'}</h2>
        <p>A hero forged here must belong to someone. Sign in to seal them into your roster. Nothing you made is lost: you come straight back.</p>
        <button type="button" className="btn fg-go" onClick={onSignIn}>
          Sign in with Google
        </button>
        <button type="button" className="al-link fg-back" onClick={onBack}>
          Not yet, back to the Forge
        </button>
      </div>
    </div>
  )
}
