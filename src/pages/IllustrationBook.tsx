import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { loadMonsterIndex } from '../data/monsters'
import { fetchMonsterImages } from '../lib/siteImages'
import { useMode } from '../lib/mode'
import { bookSummary, buildChapters, dotWindow, plateNav, type BookChapter } from '../rules/illustrationBook'

// Illustrations: o livro de ilustrações dos monstros, aberto a todos.
// Endereços (HashRouter):
//   /compendium/illustrations                       sumário
//   /compendium/illustrations/<coleção>?plate=<id>  prancha (sem ?plate=, a primeira)
// Cada prancha é uma entrada do histórico: voltar/avançar do navegador funcionam.

interface Book {
  chapters: BookChapter[]
  urls: Map<string, string>
}

// Guardado entre o sumário e as pranchas: o livro é buscado uma vez por sessão.
let cached: Book | null = null

async function loadBook(): Promise<Book> {
  const [index, urls] = await Promise.all([loadMonsterIndex(), fetchMonsterImages()])
  return { chapters: buildChapters(index, new Set(urls.keys())), urls }
}

type BookState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; book: Book }

function useBook(): { state: BookState; retry: () => void } {
  const [state, setState] = useState<BookState>(cached ? { status: 'ready', book: cached } : { status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (cached && attempt === 0) return
    let alive = true
    loadBook().then(
      (book) => {
        cached = book
        if (alive) setState({ status: 'ready', book })
      },
      () => {
        if (alive) setState({ status: 'error' })
      },
    )
    return () => {
      alive = false
    }
  }, [attempt])
  return { state, retry: () => {
      setState({ status: 'loading' })
      setAttempt((n) => n + 1)
    },
  }
}

const chapterPath = (chapter: BookChapter) => `/compendium/illustrations/${chapter.slug}`

function Message({ children }: { children: ReactNode }) {
  return <div className="plate-book plate-book-center">{children}</div>
}

function BookGate({ children }: { children: (book: Book) => ReactNode }) {
  const { state, retry } = useBook()
  if (state.status === 'loading') return <Message><p className="plate-book-soft">Opening the book…</p></Message>
  if (state.status === 'error') {
    return (
      <Message>
        <p className="plate-book-soft">The plates could not be loaded.</p>
        <button className="plate-book-retry" onClick={retry}>Retry</button>
        <Link to="/compendium" className="plate-book-back">‹ Compendium</Link>
      </Message>
    )
  }
  return <>{children(state.book)}</>
}

// ---- Sumário -------------------------------------------------------------

function Contents({ book }: { book: Book }) {
  const { chapters, urls } = book
  return (
    <div className="plate-book">
      <div className="plate-book-top">
        <Link to="/compendium" className="plate-book-back">‹ Compendium</Link>
        <span className="plate-book-count">{bookSummary(chapters)}</span>
      </div>
      <header className="plate-book-head">
        <div className="plate-book-kicker">The Book of Plates</div>
        <h1 className="plate-book-title">Illustrations</h1>
        <div className="plate-book-rule" aria-hidden="true">
          <span />
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 1 14.6 9.4 23 12 14.6 14.6 12 23 9.4 14.6 1 12 9.4 9.4Z" fill="var(--brass)" /></svg>
          <span />
        </div>
      </header>
      <nav className="plate-book-mosaic" aria-label="Chapters">
        {chapters.map((chapter) => (
          <Link key={chapter.slug} to={chapterPath(chapter)} className="plate-book-chapter">
            <img src={urls.get(chapter.plates[0].id)} alt="" loading="lazy" />
            <span className="plate-book-chapter-text">
              <span className="plate-book-chapter-no">Chapter {chapter.roman}</span>
              <span className="plate-book-chapter-name">{chapter.collection}</span>
              <span className="plate-book-chapter-n">{chapter.plates.length} {chapter.plates.length === 1 ? 'plate' : 'plates'}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

// ---- Prancha -------------------------------------------------------------

const HIDE_AFTER_MS = 3000
const SWIPE_PX = 60

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 4 7 12l8 8' : 'M9 4l8 8-8 8'} />
    </svg>
  )
}

function Plate({ book, chapter, plateId }: { book: Book; chapter: BookChapter; plateId: string }) {
  const navigate = useNavigate()
  const mode = useMode()
  const nav = plateNav(chapter, plateId)
  const box = useRef<HTMLDivElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const [nativeFull, setNativeFull] = useState(false)
  // Onde não há Fullscreen API (iPhone), o contêiner já cobre a janela: o botão só esconde os controles.
  const [softFull, setSoftFull] = useState(false)
  const [controls, setControls] = useState(true)
  const full = nativeFull || softFull

  const goTo = useCallback(
    (id: string | null) => {
      if (id) navigate(`${chapterPath(chapter)}?plate=${encodeURIComponent(id)}`)
    },
    [navigate, chapter],
  )
  const previousId = nav?.previousId ?? null
  const nextId = nav?.nextId ?? null

  // Setas do teclado.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goTo(previousId)
      else if (event.key === 'ArrowRight') goTo(nextId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, previousId, nextId])

  // Pré-carrega a anterior e a próxima; só a atual e as vizinhas são baixadas.
  useEffect(() => {
    for (const id of [previousId, nextId]) {
      const url = id ? book.urls.get(id) : undefined
      if (url) new Image().src = url
    }
  }, [book, previousId, nextId])

  // Acompanha a tela cheia do navegador (inclusive a saída por Esc).
  useEffect(() => {
    const element = box.current
    const onChange = () => {
      setNativeFull(document.fullscreenElement === element)
      setControls(true)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      if (document.fullscreenElement === element) void document.exitFullscreen()
    }
  }, [])

  // Em tela cheia, os controles somem depois de ~3 s parado e voltam com movimento ou toque.
  const [tick, setTick] = useState(0)
  const lastWake = useRef(0)
  const wake = useCallback(() => {
    const now = Date.now()
    if (now - lastWake.current < 250) return
    lastWake.current = now
    setControls(true)
    setTick((n) => n + 1)
  }, [])
  useEffect(() => {
    if (!full || !controls) return
    const timer = window.setTimeout(() => setControls(false), HIDE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [full, controls, tick])

  const toggleFull = () => {
    const element = box.current
    setControls(true)
    if (softFull) setSoftFull(false)
    else if (document.fullscreenElement) void document.exitFullscreen()
    else if (element?.requestFullscreen) void element.requestFullscreen().catch(() => setSoftFull(true))
    else setSoftFull(true)
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    swipe.current = { x: event.clientX, y: event.clientY }
    if (full) wake()
  }
  const onPointerUp = (event: ReactPointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
    goTo(dx < 0 ? nextId : previousId)
  }

  if (!nav) return null
  const url = book.urls.get(plateId)
  const plate = chapter.plates[nav.position - 1]
  const dots = dotWindow(nav.total, nav.position - 1)

  return (
    <div
      ref={box}
      className={`plate-view${full && !controls ? ' plate-view-idle' : ''}`}
      onPointerMove={full ? wake : undefined}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      {url && (
        <>
          <img className="plate-backdrop" src={url} alt="" aria-hidden="true" />
          <img className="plate-image" src={url} alt={`Illustration of ${plate.name}`} />
        </>
      )}

      <div className="plate-top">
        <Link to="/compendium/illustrations" className="plate-back">‹ Contents</Link>
        <div className="plate-heading">
          <span className="plate-heading-no">Chapter {chapter.roman}</span>
          <span className="plate-heading-name">{chapter.collection}</span>
        </div>
        <button className="plate-round" aria-label="Full screen" onClick={toggleFull}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>

      {previousId && (
        <button className="plate-arrow plate-arrow-prev" aria-label="Previous plate" onClick={() => goTo(previousId)}>
          <Chevron dir="left" />
        </button>
      )}
      {nextId && (
        <button className="plate-arrow plate-arrow-next" aria-label="Next plate" onClick={() => goTo(nextId)}>
          <Chevron dir="right" />
        </button>
      )}

      <div className="plate-bottom">
        <div className="plate-bottom-row">
          <span className="plate-position">{nav.label}</span>
          <span className="plate-name">{plate.name}</span>
          {mode === 'dm' ? (
            <Link to={`/dm/monsters?open=${encodeURIComponent(plateId)}`} className="plate-open">Open entry ›</Link>
          ) : (
            <span />
          )}
        </div>
        <div className="plate-dots" aria-hidden="true">
          {Array.from({ length: dots.count }, (_, i) => (
            <span key={dots.start + i} className={i === dots.active ? 'plate-dot plate-dot-on' : 'plate-dot'} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <Message>
      <p className="plate-book-soft">Not found.</p>
      <Link to="/compendium/illustrations" className="plate-book-back">‹ Contents</Link>
    </Message>
  )
}

export function IllustrationBook() {
  const { chapter: slug } = useParams()
  const [params] = useSearchParams()
  return (
    <BookGate>
      {(book) => {
        if (!slug) return <Contents book={book} />
        const chapter = book.chapters.find((c) => c.slug === slug)
        if (!chapter) return <NotFound />
        const plateId = params.get('plate') ?? chapter.plates[0].id
        if (!chapter.plates.some((p) => p.id === plateId)) return <NotFound />
        return <Plate book={book} chapter={chapter} plateId={plateId} />
      }}
    </BookGate>
  )
}
