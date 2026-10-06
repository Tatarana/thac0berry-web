import { useCallback, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PaperModal } from '../components/DetailBits'

// Confirmação dentro da página, no lugar do window.confirm: navegadores
// embutidos (como o painel do app Claude) bloqueiam a caixa nativa e ela
// devolve "não" sem aparecer, o que fazia "End", a lixeira dos ferimentos e
// outros botões não fazerem nada.
//
// Uso: const { confirm, dialog } = useConfirm()
//      if (!(await confirm('Delete?', 'Delete'))) return
//      … e renderizar {dialog} em algum lugar do componente.

export function useConfirm() {
  const [pending, setPending] = useState<{ message: ReactNode; action: string } | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((message: ReactNode, action = 'Confirm') => {
    setPending({ message, action })
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const finish = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setPending(null)
  }

  const dialog = pending
    ? createPortal(
        <PaperModal title="Are you sure?" onClose={() => finish(false)}>
          <div className="confirm-body">{pending.message}</div>
          <div className="slot-actions">
            <button className="paper-link" onClick={() => finish(false)}>
              cancel
            </button>
            <button className="consequence-apply" autoFocus onClick={() => finish(true)}>
              {pending.action}
            </button>
          </div>
        </PaperModal>,
        document.body,
      )
    : null

  return { confirm, dialog }
}
