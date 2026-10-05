import { Link } from 'react-router'
import type { CSSProperties } from 'react'

interface HomeTileProps {
  to: string
  image: string
  title: string
  subtitle: string
  accent: string
}

// Tile da Home (HomeIconTile do iPad): arte ilustrada, título à mão, subtítulo.
export function HomeTile({ to, image, title, subtitle, accent }: HomeTileProps) {
  const style = { '--accent': accent } as CSSProperties
  return (
    <Link to={to} className="ember-card tile" style={style}>
      <img src={`${import.meta.env.BASE_URL}images/${image}.png`} alt="" />
      <div className="tile-title">{title}</div>
      <p className="soft">{subtitle}</p>
    </Link>
  )
}
