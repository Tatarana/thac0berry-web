import { sphereList } from '../rules/spellbook'
import type { SphereAccessLevel } from '../types/library'

// As esferas da ficha viram ícones à tinta. O nome aparece ao passar o mouse e
// ao tocar (foco), e fica escrito no papel impresso, onde não há mouse.

const circle = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`

const flame = 'M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3.5 2-4.5c0 2 1 3 2 3c0-3-.5-6 2-9.5'
const sunRays = 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1'

const paths: Record<string, string> = {
  All: 'M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7',
  Animal: `M12 12.5c-3 0-5.5 2.8-5.5 5.2c0 2.8 3.5 2.3 5.5 1.3c2 1 5.5 1.5 5.5-1.3c0-2.4-2.5-5.2-5.5-5.2${circle(5, 10.5, 1.7)}${circle(9.3, 6.3, 1.8)}${circle(14.7, 6.3, 1.8)}${circle(19, 10.5, 1.7)}`,
  Astral: `${circle(12, 12, 9)}M12 6l1.7 4.3L18 12l-4.3 1.7L12 18l-1.7-4.3L6 12l4.3-1.7z`,
  Charm: 'M12 20.5C6 16 3 12.8 3 9a4.8 4.8 0 0 1 9-2.3A4.8 4.8 0 0 1 21 9c0 3.8-3 7-9 11.5z',
  Chaos: 'M12 12V2.5M9.5 5L12 2.5L14.5 5M12 12v9.5M9.5 19l2.5 2.5l2.5-2.5M12 12H2.5M5 9.5L2.5 12L5 14.5M12 12h9.5M19 9.5l2.5 2.5l-2.5 2.5M12 12L5.5 5.5M5.5 8.5v-3h3M12 12l6.5 6.5M18.5 15.5v3h-3M12 12l6.5-6.5M15.5 5.5h3v3M12 12l-6.5 6.5M8.5 18.5h-3v-3',
  Combat: 'M4 3.5l1 4l10 10l2-2L7 5.5zM20 3.5l-1 4L9 17.5l-2-2L17 5.5zM4 16l4 4M20 16l-4 4M5.5 20.5l1.5-1.5M18.5 20.5L17 19',
  Cosmos: `${circle(12, 12, 5)}M7.6 14.4C4.5 16 2.6 17.5 3 18.3c.7 1.4 5.5-.1 10.7-3.3c5.2-3.2 8.1-6.8 7.3-8.2c-.4-.8-2.7-.4-5.7.8`,
  Creation: 'M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8zM18.5 3.5v4M16.5 5.5h4M5.5 16.5v4M3.5 18.5h4',
  Divination: `M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12z${circle(12, 12, 3)}`,
  Elemental: 'M12 2.5L21.5 12L12 21.5L2.5 12zM12 2.5v19M2.5 12h19',
  'Elemental Air': 'M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7',
  'Elemental Earth': 'M2.5 19.5L9 7l3.5 6l2.5-3.5l6.5 10zM7 12.5l2 1.5l2-1.5',
  'Elemental Fire': flame,
  'Elemental Magma': 'M3 20.5L9 9h6l6 11.5zM9 9l-1.5-3M15 9l1.5-3M12 9V4M10.5 13l1.5 2.5l1.5-2.5',
  'Elemental Sun': `${circle(12, 12, 3.5)}${sunRays}M12 12v.01`,
  'Elemental Water': 'M12 3c3 4.5 6.5 7.8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.8 9 7.5 12 3z',
  Guardian: 'M5 21V7l2.3 1.5L9.5 7L12 8.5L14.5 7l2.2 1.5L19 7v14zM9.5 21v-5a2.5 2.5 0 0 1 5 0v5',
  Healing: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  Law: 'M12 3v18M7.5 21h9M4 6.5h16M6.5 6.5L3 14a3.6 3.6 0 0 0 7 0zM17.5 6.5L14 14a3.6 3.6 0 0 0 7 0z',
  Necromantic: `M12 3a7.5 7.5 0 0 0-7.5 7.5c0 3 1.5 4.7 3 6V20h9v-3.5c1.5-1.3 3-3 3-6A7.5 7.5 0 0 0 12 3z${circle(9, 11, 1.6)}${circle(15, 11, 1.6)}M10.5 20v-2.5M13.5 20v-2.5`,
  Numbers: 'M9.5 3.5L7.5 20.5M16.5 3.5l-2 17M4 9h16.5M3.5 15H20',
  Plant: 'M5 20C4 11 9 4.5 20 4c.5 11-6 16-13 14M5 20c2-5 5-8.5 9-10.5',
  Protection: 'M12 2.5l8 3v6c0 5-3.5 8.5-8 10c-4.5-1.5-8-5-8-10v-6z',
  Silt: 'M3 8c3-2.5 6 2.5 9 0s6 2.5 9 0M3 13c3-2.5 6 2.5 9 0s6 2.5 9 0M6 18h.01M12 18h.01M18 18h.01M9 21h.01M15 21h.01',
  Summoning: `${circle(12, 12, 9.5)}M12 2.5l5.6 17.2L3 9.1h18L6.4 19.7z`,
  Sun: `${circle(12, 12, 4)}${sunRays}`,
  Thought: `M7.5 15.5a4.2 4.2 0 0 1-.5-8.4a5.3 5.3 0 0 1 10-.4a4.3 4.3 0 0 1 .5 8.8z${circle(9, 18.5, 1.1)}${circle(6, 21, .6)}`,
  Time: 'M6 2.5h12M6 21.5h12M7.5 2.5c0 5 1.5 7 4.5 9.5c3-2.5 4.5-4.5 4.5-9.5M7.5 21.5c0-5 1.5-7 4.5-9.5c3 2.5 4.5 4.5 4.5 9.5M9.5 19.5h5',
  Travelers: `${circle(12, 12, 9.5)}M15.8 8.2l-2.3 5.3l-5.3 2.3l2.3-5.3z`,
  War: 'M6 21.5V2.5M6 4h13l-3.5 4.5L19 13H6',
  Wards: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11M12 15v2.5',
  Weather: 'M7 15.5a4 4 0 0 1-.5-8a5.5 5.5 0 0 1 10.5-.5a4.3 4.3 0 0 1 .5 8.5M13 12l-2.5 4.5h3L11 21.5',
}

/** Esfera sem desenho (rótulo fora do catálogo): cai no círculo vazio, nunca some da ficha. */
function SphereIcon({ sphere }: { sphere: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[sphere] ?? circle(12, 12, 6)} />
    </svg>
  )
}

/** Fileira que quebra de linha: acesso maior é o selo cheio; menor, vazado. */
export function SphereRow({ access }: { access: Record<string, SphereAccessLevel> }) {
  return (
    <span className="sphere-row">
      {sphereList(access).map(([sphere, level]) => {
        const name = level === 'minor' ? `${sphere} (minor)` : sphere
        return (
          <button key={sphere} type="button" className={`sphere-seal sphere-${level}`} aria-label={name}>
            <SphereIcon sphere={sphere} />
            <span className="sphere-name">{name}</span>
          </button>
        )
      })}
    </span>
  )
}
