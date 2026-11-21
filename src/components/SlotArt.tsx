import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useIsAdmin } from '../lib/siteImages'
import { slotSize } from '../lib/siteImageRules'
import { SiteImageEdit } from './SiteImageEdit'

// Ilustração de um slot do site (monster/<id>, deity/<id>) na ficha: figura na
// largura da ficha, tela cheia para o mestre mostrar à mesa e lápis do admin.
// As classes .monster-art* vêm da primeira ficha que usou isto (monstros).

/**
 * A imagem sozinha, para o mestre mostrar à mesa: sem nome nem texto, que estragariam a
 * surpresa. Onde o navegador não dá tela cheia (iPhone), cobre a janela do mesmo jeito.
 */
function SlotArtFull({ url, onClose }: { url: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = box.current
    let entered = false
    void element?.requestFullscreen?.().then(() => {
      entered = true
    }, () => undefined)
    // Esc fecha só a imagem: a ficha continua aberta por baixo.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    const onChange = () => {
      if (!document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('fullscreenchange', onChange)
      if (entered && document.fullscreenElement === element) void document.exitFullscreen()
    }
  }, [onClose])

  return createPortal(
    <div
      ref={box}
      className="monster-art-full"
      role="dialog"
      aria-modal="true"
      aria-label="Illustration, click to close"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
    >
      <img src={url} alt="" />
    </div>,
    document.body,
  )
}

/**
 * A ilustração, na largura da ficha. Sem imagem, só o admin vê o lápis para enviar a
 * primeira; os demais não veem moldura vazia.
 */
export function SlotArt({ slot, name, url }: { slot: string; name: string; url: string | null }) {
  const isAdmin = useIsAdmin()
  const [full, setFull] = useState(false)
  const close = useCallback(() => setFull(false), [])
  const { width, height } = slotSize(slot)
  if (!url) return isAdmin ? <SiteImageEdit slot={slot} shown={null} inline /> : null
  return (
    <figure className="monster-art">
      <button className="monster-art-open" onClick={() => setFull(true)} title="Show full screen to the players">
        <img src={url} alt={`Illustration of ${name}. Show full screen`} width={width} height={height} />
      </button>
      {isAdmin && <SiteImageEdit slot={slot} shown={url} />}
      {full && <SlotArtFull url={url} onClose={close} />}
    </figure>
  )
}
