import type { ReactNode } from 'react'

// Ícones das seis disciplinas psiônicas (CPsiH), em traço, na cor do texto
// (tinta na ficha, também na impressão). Sempre com o nome ao lado: o ícone
// ajuda a ler, não substitui a legenda.

const shapes: Record<string, ReactNode> = {
  // Olho com raios: perceber à distância.
  Clairsentience: (
    <>
      <path d="M2.5 13s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5-9.5-5.5-9.5-5.5Z" />
      <circle cx="12" cy="13" r="2.6" />
      <path d="M12 2.5v2.5M5.2 4.6l1.4 1.9M18.8 4.6l-1.4 1.9" />
    </>
  ),
  // Objeto em movimento: mover coisas com a mente.
  Psychokinesis: (
    <>
      <circle cx="16" cy="12" r="4.5" />
      <path d="M2.5 8.5h6M2 12h7.5M2.5 15.5h6" />
    </>
  ),
  // Coração com pulso: o próprio corpo.
  Psychometabolism: (
    <>
      <path d="M12 20.5s-7.5-4.6-7.5-10.4A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4Z" />
      <path d="M6.5 12.5h3l1.4-2.8 2 5 1.4-2.2h3.2" />
    </>
  ),
  // Portal com uma seta atravessando: ir de um lugar a outro.
  Psychoportation: (
    <>
      <ellipse cx="8" cy="12" rx="3.6" ry="8" />
      <path d="M8 12h13M17.5 8.5 21 12l-3.5 3.5" />
    </>
  ),
  // Duas cabeças ligadas por ondas: mente com mente.
  Telepathy: (
    <>
      <circle cx="4.8" cy="12" r="2.8" />
      <circle cx="19.2" cy="12" r="2.8" />
      <path d="M9.5 9.2q1.6 2.8 0 5.6M12 7.8q2.2 4.2 0 8.4M14.5 9.2q-1.6 2.8 0 5.6" />
    </>
  ),
  // Espiral: o poder sobre os outros poderes.
  Metapsionics: <path d="M11.5 12a1 1 0 0 1 2 0 2 2 0 0 1-4 0 3 3 0 0 1 6 0 4 4 0 0 1-8 0 5 5 0 0 1 10 0 6 6 0 0 1-12 0" />,
}

export function DisciplineIcon({ discipline, size = 16 }: { discipline: string; size?: number }) {
  const shape = shapes[discipline]
  if (!shape) return null
  return (
    <svg
      className="discipline-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shape}
    </svg>
  )
}
