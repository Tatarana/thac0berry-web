import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { addSiteImageVersion, setCurrentSiteImage, siteImageURL, siteImageVersions, type SiteImageVersion } from '../lib/siteImages'
import { coverCrop, panAfterDrag, slotLabel, slotSize } from '../lib/siteImageRules'

// O lápis do admin sobre uma imagem do site e o painel que ele abre: a imagem
// atual, as versões (nenhuma se apaga; qualquer uma pode voltar a ser a atual)
// e o envio de uma nova, convertida para WebP no tamanho do slot, com recorte
// na própria moldura. Serve para qualquer slot: The Forge e, depois, o Grimório.

const quality = 0.86
const maxZoom = 3

/** O lápis. Fica dentro de botões (cards), por isso é um span e não deixa o clique passar. */
export function SiteImageEdit({ slot, shown, inline = false }: { slot: string; shown: string | null; inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const openPanel = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation()
    event.preventDefault()
    setOpen(true)
  }
  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={inline ? 'si-edit si-edit-inline' : 'si-edit'}
        aria-label={`Change image: ${slotLabel(slot)}`}
        title="Change this image"
        onClick={openPanel}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') openPanel(event)
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l1-4.5L16.5 4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19 4 20Z" fill="currentColor" />
        </svg>
      </span>
      {open && <SiteImagePanel slot={slot} shown={shown} onClose={() => setOpen(false)} />}
    </>
  )
}

function SiteImagePanel({ slot, shown, onClose }: { slot: string; shown: string | null; onClose: () => void }) {
  const size = slotSize(slot)
  const [versions, setVersions] = useState<SiteImageVersion[] | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const [source, setSource] = useState<ImageBitmap | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropping, setDropping] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const picker = useRef<HTMLInputElement>(null)

  const reload = useCallback(async () => {
    try {
      const list = await siteImageVersions(slot)
      setVersions(list)
      setViewing(list.find((v) => v.is_current)?.version ?? null)
    } catch (e) {
      setVersions([])
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [slot])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  // A moldura de recorte é o próprio resultado: o canvas no tamanho final.
  useEffect(() => {
    const c = canvas.current
    if (!c || !source) return
    const crop = coverCrop(source, size, zoom, pan)
    const context = c.getContext('2d')
    if (!context) return
    context.imageSmoothingQuality = 'high'
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height)
  }, [source, zoom, pan, size.width, size.height])

  const choose = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      setSource(await createImageBitmap(file))
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } catch {
      setError('This file is not an image the browser can read.')
    }
  }

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setBusy(false)
  }

  const save = () =>
    run(async () => {
      const webp = await new Promise<Blob | null>((resolve) => {
        if (canvas.current) canvas.current.toBlob(resolve, 'image/webp', quality)
        else resolve(null)
      })
      // Navegador sem codificador WebP devolve PNG (o toBlob não avisa).
      if (webp?.type !== 'image/webp') throw new Error('This browser cannot create WebP files. Use Chrome, Edge or Firefox.')
      await addSiteImageVersion(slot, webp, size)
      setSource(null)
      await reload()
    })

  const makeCurrent = (version: number) =>
    run(async () => {
      await setCurrentSiteImage(slot, version)
      await reload()
    })

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || !source) return
    const { clientWidth: width, clientHeight: height } = event.currentTarget
    const moved = { dx: event.clientX - drag.current.x, dy: event.clientY - drag.current.y }
    drag.current = { x: event.clientX, y: event.clientY }
    setPan((value) => panAfterDrag(source, size, zoom, value, moved, { width, height }))
  }

  const seen = versions?.find((v) => v.version === viewing) ?? null
  const seenURL = seen ? siteImageURL(seen.storage_path) : shown
  const currentVersion = versions?.find((v) => v.is_current)?.version ?? null
  const nextVersion = (versions?.[0]?.version ?? 0) + 1
  const small = source && (source.width < size.width || source.height < size.height)

  return createPortal(
    // O portal repassa os eventos ao card que tem o lápis: param aqui.
    <div className="si-veil" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <div className="si-panel" role="dialog" aria-modal="true" aria-label={`Change image: ${slotLabel(slot)}`}>
        <header className="si-head">
          <div>
            <p className="forge-kicker">Art of the realm</p>
            <h2>{slotLabel(slot)}</h2>
          </div>
          <button type="button" className="si-close" aria-label="Close" disabled={busy} onClick={onClose}>
            ×
          </button>
        </header>

        <div
          className={dropping ? 'si-stage si-stage-drop' : 'si-stage'}
          onDragOver={(event) => {
            event.preventDefault()
            setDropping(true)
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDropping(false)
            void choose(event.dataTransfer.files[0])
          }}
        >
          <div className="si-frame" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
            {source ? (
              <canvas
                ref={canvas}
                className="si-crop"
                width={size.width}
                height={size.height}
                aria-label="Drag to choose the crop"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (drag.current = null)}
              />
            ) : seenURL ? (
              <img src={seenURL} alt={slotLabel(slot)} />
            ) : (
              <span className="si-empty">No art yet</span>
            )}
          </div>

          {source ? (
            <div className="si-tools">
              <p className="si-hint">Drag the image to frame it.</p>
              <label className="si-zoom">
                <span>Zoom</span>
                <input type="range" min={1} max={maxZoom} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <p className="si-size">
                {source.width}×{source.height} → {size.width}×{size.height} WebP
              </p>
              {small && <p className="si-warn">Smaller than the slot: it will look soft.</p>}
              <button type="button" className="forge-next-button forge-next-ready" disabled={busy} onClick={() => void save()}>
                {busy ? 'Forging…' : `Forge version ${nextVersion}`}
              </button>
              <button type="button" className="forge-ghost-button" disabled={busy} onClick={() => setSource(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="si-tools">
              {seen && (
                <p className="si-size">
                  Version {seen.version} · {new Date(seen.uploaded_at).toLocaleDateString()}
                  {seen.is_current ? ' · on display' : ''}
                </p>
              )}
              {versions?.length === 0 && <p className="si-size">This image has no versions yet.</p>}
              <button type="button" className="forge-next-button forge-next-ready" disabled={busy} onClick={() => picker.current?.click()}>
                Bring new art
              </button>
              <p className="si-hint">Or drop a file here.</p>
              {seen && !seen.is_current && (
                <button type="button" className="forge-ghost-button" disabled={busy} onClick={() => void makeCurrent(seen.version)}>
                  {busy ? 'Changing…' : 'Make current'}
                </button>
              )}
            </div>
          )}
          <input
            ref={picker}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void choose(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>

        {error && <p className="si-error">{error}</p>}

        {!!versions?.length && (
          <div className="si-strip">
            {versions.map((v) => (
              <button
                type="button"
                key={v.version}
                className={['si-thumb', v.version === viewing && !source ? 'si-thumb-on' : '', v.version === currentVersion ? 'si-thumb-current' : ''].filter(Boolean).join(' ')}
                aria-label={`Version ${v.version}`}
                disabled={busy}
                onClick={() => {
                  setSource(null)
                  setViewing(v.version)
                }}
              >
                <img src={siteImageURL(v.storage_path)} alt="" loading="lazy" />
                <span>v{v.version}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
