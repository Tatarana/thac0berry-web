import { Link } from 'react-router'
import { ModeSwitch } from './ModeChooser'

// Cabeçalho das telas internas (igual ao Settings do iPad): botão de voltar,
// linha em versalete e o título em letra de mão.
export function PageHeader({ title, backTo = '/' }: { title: string; backTo?: string }) {
  return (
    <>
      <div className="page-top">
        <Link to={backTo} className="back-button" aria-label="Back">
          ‹
        </Link>
        <ModeSwitch />
      </div>
      <div>
        <div className="smallcaps">Advanced Dungeons &amp; Dragons · 2nd Edition</div>
        <h1 className="title-hand">{title}</h1>
      </div>
      <hr className="divider" />
    </>
  )
}
