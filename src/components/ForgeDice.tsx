import { useEffect, useRef } from 'react'

// Dados rolando na mesa do The Forge (etapa de magias: 3d4 do grimório, 1d4
// do bardo, d100 para aprender uma magia). Cada dado é arremessado da
// esquerda, quica três ou quatro vezes (cada quique mais baixo e mais curto),
// gira e tomba em 3D enquanto a face troca, achata ao bater na mesa e assenta
// com um brilho; a sombra cresce e escurece conforme ele desce. A física é
// uma trajetória fechada (não uma simulação), então o dado sempre para onde
// deve, e o valor final já vem decidido de fora. Anima direto no DOM
// (requestAnimationFrame), sem re-render por quadro.

export type DieKind = 'd4' | 'd6' | 'd10' | 'd10x10'

export interface DieSpec {
  kind: DieKind
  /** d4: 1–4; d6: 1–6; d10: 0–9; d10x10 (as dezenas do d100): 0–9, mostrado como "00"–"90". */
  value: number
}

const faceText = (kind: DieKind, v: number) => (kind === 'd10x10' ? `${v}0` : String(v))
const randomFace = (kind: DieKind) => (kind === 'd4' ? 1 + Math.floor(Math.random() * 4) : kind === 'd6' ? 1 + Math.floor(Math.random() * 6) : Math.floor(Math.random() * 10))

// Quiques: [duração relativa, altura]. O primeiro é a queda (meio arco).
const bounces: [number, number][] = [
  [0.34, 120],
  [0.24, 48],
  [0.16, 20],
  [0.1, 7],
]
const flight = bounces.reduce((n, [d]) => n + d, 0)

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function DieShape({ kind }: { kind: DieKind }) {
  if (kind === 'd4') {
    return (
      <svg viewBox="0 0 64 60" aria-hidden="true">
        <polygon points="32,3 3,56 32,39" fill="#ffd98a" />
        <polygon points="32,3 61,56 32,39" fill="#f0a640" />
        <polygon points="3,56 61,56 32,39" fill="#c8641f" />
        <polygon points="32,3 61,56 3,56" fill="none" stroke="#fff3cf" strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'd6') {
    // Um cubo: a face de cima clara, as laterais em sombra.
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 18 32 8l22 10v28L32 58 10 46Z" fill="#c8641f" />
        <path d="M10 18 32 8l22 10-22 10Z" fill="#ffe2a6" />
        <path d="M32 28 54 18v28L32 58Z" fill="#e0901e" />
        <path d="M10 18 32 8l22 10v28L32 58 10 46Z M10 18l22 10 22-10 M32 28v30" fill="none" stroke="#fff3cf" strokeOpacity=".5" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  const tens = kind === 'd10x10'
  return (
    <svg viewBox="0 0 64 72" aria-hidden="true">
      <polygon points="32,2 54,25 32,40 10,25" fill={tens ? '#ddd0ff' : '#ffe2a6'} />
      <polygon points="2,30 10,25 32,40 32,70" fill={tens ? '#9478f0' : '#f0a640'} />
      <polygon points="62,30 54,25 32,40 32,70" fill={tens ? '#5b40c4' : '#c8641f'} />
      <polygon points="32,2 62,30 32,70 2,30" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function ForgeDice({ dice, rollKey, onSettled }: { dice: DieSpec[]; rollKey: number; onSettled?: () => void }) {
  const tray = useRef<HTMLDivElement>(null)
  const bodies = useRef<(HTMLDivElement | null)[]>([])
  const shadows = useRef<(HTMLDivElement | null)[]>([])
  const faces = useRef<(HTMLSpanElement | null)[]>([])
  const settled = useRef(onSettled)
  useEffect(() => {
    settled.current = onSettled
  })

  useEffect(() => {
    const el = tray.current
    if (!el) return
    const W = el.clientWidth
    const H = el.clientHeight
    const n = dice.length
    const spacing = Math.min(96, (W - 80) / Math.max(1, n))
    const ground = H * 0.66
    const target = (i: number) => W / 2 + (i - (n - 1) / 2) * spacing
    const place = (i: number, x: number, z: number, rot: number, tiltX: number, tiltY: number, sx = 1, sy = 1) => {
      const body = bodies.current[i]
      const shadow = shadows.current[i]
      if (body) body.style.transform = `translate(${x - 32}px, ${ground - 52 - z}px) rotate(${rot}deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${sx}, ${sy})`
      if (shadow) {
        const k = Math.max(0.35, 1 - z / 170)
        shadow.style.transform = `translate(${x - 30}px, ${ground + 4}px) scale(${k})`
        shadow.style.opacity = String(Math.max(0.12, 0.6 - z / 260))
      }
    }

    // Parado: antes de rolar, os dados descansam no centro com "?".
    if (rollKey === 0) {
      dice.forEach((_, i) => {
        place(i, target(i), 0, i % 2 ? 6 : -5, 0, 0)
        const f = faces.current[i]
        if (f) f.textContent = '?'
        bodies.current[i]?.classList.remove('die-settled')
      })
      return
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      dice.forEach((d, i) => {
        place(i, target(i), 0, 0, 0, 0)
        const f = faces.current[i]
        if (f) f.textContent = faceText(d.kind, d.value)
        bodies.current[i]?.classList.add('die-settled')
      })
      const t = window.setTimeout(() => settled.current?.(), 150)
      return () => window.clearTimeout(t)
    }

    // Cada dado com seu arremesso: começo fora da mesa, giro e tombo próprios.
    const plans = dice.map((_, i) => ({
      start: -70 - i * 34 - Math.random() * 30,
      end: target(i) + (Math.random() - 0.5) * 14,
      duration: 1250 + i * 110 + Math.random() * 120,
      delay: i * 70,
      spin: (Math.random() < 0.5 ? -1 : 1) * (540 + Math.random() * 540),
      rest: (Math.random() - 0.5) * 16,
      wobble: 4 + Math.random() * 3,
      tilt: 50 + Math.random() * 30,
      lastFace: -1,
      done: false,
    }))
    dice.forEach((d, i) => {
      bodies.current[i]?.classList.remove('die-settled')
      const f = faces.current[i]
      if (f) f.textContent = faceText(d.kind, randomFace(d.kind))
    })

    let frame = 0
    let finished = false
    const t0 = performance.now()
    // Termina uma vez só: pelo último quadro ou pelo relógio de segurança.
    const finish = () => {
      if (finished) return
      finished = true
      plans.forEach((p, i) => {
        if (p.done) return
        p.done = true
        place(i, p.end, 0, p.rest, 0, 0)
        const f = faces.current[i]
        if (f) f.textContent = faceText(dice[i].kind, dice[i].value)
        bodies.current[i]?.classList.add('die-settled')
      })
      settle = window.setTimeout(() => settled.current?.(), 260)
    }
    let settle = 0
    // Aba em segundo plano pausa o requestAnimationFrame: o resultado não pode ficar preso.
    const guard = window.setTimeout(finish, Math.max(...plans.map((p) => p.delay + p.duration)) + 500)
    const tick = (now: number) => {
      let all = true
      plans.forEach((p, i) => {
        if (p.done) return
        const elapsed = now - t0 - p.delay
        if (elapsed < 0) {
          place(i, p.start, 140, 0, 0, 0)
          all = false
          return
        }
        const t = Math.min(1, elapsed / p.duration)
        const x = p.start + (p.end - p.start) * easeOut(Math.min(1, t / flight))
        // Altura: em que quique estamos.
        let z = 0
        let squash = 0
        let at = 0
        for (let b = 0; b < bounces.length; b++) {
          const [d, h] = bounces[b]
          if (t < at + d) {
            const u = (t - at) / d
            z = b === 0 ? h * Math.cos((u * Math.PI) / 2) : h * Math.sin(u * Math.PI)
            // Achata logo depois de bater (o começo de cada quique, menos a queda).
            if (b > 0 && u < 0.18) squash = (1 - u / 0.18) * (h / 120 + 0.18)
            break
          }
          at += d
        }
        if (t >= flight && t < flight + 0.06) squash = (1 - (t - flight) / 0.06) * 0.12
        const roll = easeOut(Math.min(1, t / (flight + 0.04)))
        const rot = p.rest + p.spin * (1 - roll)
        const decay = Math.pow(1 - Math.min(1, t / flight), 2)
        const tiltX = p.tilt * decay * Math.sin(t * p.wobble * Math.PI * 2)
        const tiltY = p.tilt * 0.7 * decay * Math.cos(t * p.wobble * Math.PI * 1.6)
        place(i, x, z, rot, tiltX, tiltY, 1 + squash * 0.6, 1 - squash)

        // A face troca a cada ~45° de giro; no último quique já é a final.
        const face = faces.current[i]
        if (face) {
          const step = Math.floor(Math.abs(p.spin * (1 - roll)) / 45)
          if (t > flight - bounces[3][0] * 1.4) face.textContent = faceText(dice[i].kind, dice[i].value)
          else if (step !== p.lastFace) {
            p.lastFace = step
            face.textContent = faceText(dice[i].kind, randomFace(dice[i].kind))
          }
        }
        if (t >= 1) {
          p.done = true
          place(i, p.end, 0, p.rest, 0, 0)
          bodies.current[i]?.classList.add('die-settled')
        } else all = false
      })
      if (all) {
        finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(guard)
      window.clearTimeout(settle)
    }
    // Rola de novo só quando rollKey muda (os valores vêm junto).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollKey, dice.length])

  return (
    <div className="dice-tray" ref={tray} aria-hidden="true">
      {dice.map((_, i) => (
        <div key={`s${i}`} className="die-shadow" ref={(e) => void (shadows.current[i] = e)} />
      ))}
      {dice.map((d, i) => (
        <div key={`d${i}`} className={`die die-${d.kind}`} ref={(e) => void (bodies.current[i] = e)}>
          <DieShape kind={d.kind} />
          <span className="die-face" ref={(e) => void (faces.current[i] = e)}>
            ?
          </span>
          <i className="die-glow" />
        </div>
      ))}
    </div>
  )
}
