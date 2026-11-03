// Regras puras das imagens do site (versionadas no bucket site-images; ver
// siteImages.ts): que slot é cada arquivo, em que tamanho ele entra e o recorte
// que encaixa uma imagem enviada nesse tamanho.

export interface Size {
  width: number
  height: number
}

/** O slot de um arquivo do repo: …/images/forge/race-dwarf-male.webp → forge/race-dwarf-male. */
export function slotOfSrc(src: string): string | null {
  const match = /\/images\/(forge)\/([a-z0-9._-]+)\.webp$/.exec(src)
  return match ? `${match[1]}/${match[2]}` : null
}

/** O tamanho final do slot, o de docs/forge-arte.md. */
export function slotSize(slot: string): Size {
  const name = slot.split('/').pop() ?? ''
  if (name.startsWith('weapons-')) return { width: 1680, height: 720 }
  if (name.startsWith('gender-')) return { width: 848, height: 848 }
  return { width: 896, height: 1200 }
}

/** Nome legível do slot: forge/race-half-elf-male → Race half elf male. */
export function slotLabel(slot: string): string {
  const name = (slot.split('/').pop() ?? slot).replace(/-/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Recorte da imagem original que cobre o tamanho final. `zoom` ≥ 1 aproxima;
 * `pan` vai de −1 a 1 em cada eixo (0 é o centro).
 */
export function coverCrop(source: Size, target: Size, zoom: number, pan: { x: number; y: number }) {
  const scale = Math.max(target.width / source.width, target.height / source.height) * zoom
  const width = target.width / scale
  const height = target.height / scale
  return {
    x: ((source.width - width) / 2) * (1 + pan.x),
    y: ((source.height - height) / 2) * (1 + pan.y),
    width,
    height,
  }
}

/** O `pan` depois de arrastar a imagem `dx`/`dy` numa moldura de `shown` pixels. */
export function panAfterDrag(source: Size, target: Size, zoom: number, pan: { x: number; y: number }, drag: { dx: number; dy: number }, shown: Size) {
  const crop = coverCrop(source, target, zoom, pan)
  const axis = (value: number, moved: number, frame: number, cropped: number, full: number) =>
    full - cropped < 0.5 ? 0 : Math.max(-1, Math.min(1, value - (2 * (moved / frame) * cropped) / (full - cropped)))
  return {
    x: axis(pan.x, drag.dx, shown.width, crop.width, source.width),
    y: axis(pan.y, drag.dy, shown.height, crop.height, source.height),
  }
}
