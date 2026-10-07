import { Link, useLocation, useNavigate } from 'react-router'
import { ModeChooser } from '../components/ModeChooser'

// Tela de troca de modo, aberta pelo botão do topo. Depois da escolha (ou no
// "voltar"), retorna para a tela de onde o jogador veio.
export function ModePage() {
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  return (
    <div className="page">
      <div className="page-top">
        <Link to={from} className="back-button" aria-label="Back">
          ‹
        </Link>
      </div>
      <ModeChooser onChosen={() => navigate(from, { replace: true })} />
    </div>
  )
}
