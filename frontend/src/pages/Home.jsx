import { useEffect, useState } from 'react'
import { IMAGEN_CARTA_FALLBACK } from '../data/db'
import './Home.css'

/* ── Tokens visuales ─────────────────────────────────────────────────────── */

const COLOR_VINO = '#9B111E'
const COLOR_FONDO_CARD = '#161616'
const COLOR_TEXTO_MUTED = '#A3A3A3'
const COLOR_ALERGENO = '#737373'
const RADIUS_TOP = 16

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(
  'Camino El Vinculito 14 Los Realejos Tenerife',
)}`

const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'entrantes', label: 'Entrantes' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'postres', label: 'Postres' },
]

const HERO_CARRUSEL_INTERVALO_MS = 4000
const COLOR_ACENTO_VINO = '#9B111E'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const imagenesCarrusel = [
  {
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&h=600&q=80',
    alt: 'Bodega tradicional de vino',
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&h=600&q=80',
    alt: 'Carnes a la brasa',
  },
  {
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&h=600&q=80',
    alt: 'Viñedos al atardecer',
  },
  {
    url: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=1600&h=600&q=80',
    alt: 'Mesa rústica con vino y pan',
  },
]

/** Contenedor superior de imagen — alto fijo, recorte uniforme */
const estiloContenedorImagen = {
  position: 'relative',
  width: '100%',
  height: '220px',
  minHeight: '220px',
  maxHeight: '220px',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: '#0d0d0d',
  borderTopLeftRadius: RADIUS_TOP,
  borderTopRightRadius: RADIUS_TOP,
}

/** Imagen del plato — obligatorio para evitar deformaciones */
const estiloImagenPlato = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
  border: 'none',
}

/** Bloque inferior de texto */
const estiloCuerpoTexto = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  backgroundColor: COLOR_FONDO_CARD,
}

const estiloCabeceraPlato = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '0.75rem',
}

const estiloNombrePlato = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 600,
  lineHeight: 1.3,
  color: '#F5F5F5',
  flex: 1,
}

const estiloPrecioPlato = {
  margin: 0,
  fontSize: '1.125rem',
  fontWeight: 700,
  color: COLOR_VINO,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const estiloDescripcionPlato = {
  margin: 0,
  fontSize: '0.9375rem',
  lineHeight: 1.55,
  color: COLOR_TEXTO_MUTED,
  flex: 1,
}

const estiloAlergenosPlato = {
  margin: 0,
  marginTop: 'auto',
  paddingTop: '1rem',
  fontSize: '0.75rem',
  lineHeight: 1.4,
  color: COLOR_ALERGENO,
  letterSpacing: '0.02em',
}

/* ── Carrusel panorámico del Hero ────────────────────────────────────────── */

function HeroCarruselPanoramico() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [tickAutoplay, setTickAutoplay] = useState(0)

  const total = imagenesCarrusel.length
  const slideActivo = imagenesCarrusel[currentImageIndex]

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % total)
    }, HERO_CARRUSEL_INTERVALO_MS)

    return () => window.clearInterval(intervalId)
  }, [tickAutoplay, total])

  const irASlide = (index) => {
    setCurrentImageIndex(index)
    setTickAutoplay((prev) => prev + 1)
  }

  return (
    <div
      className="home-hero-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Galería visual del guachinche"
    >
      <div className="home-hero-carousel__viewport">
        {imagenesCarrusel.map((item, index) => (
          <img
            key={item.url}
            src={item.url}
            alt={item.alt}
            className={
              index === currentImageIndex
                ? 'home-hero-carousel__slide is-active'
                : 'home-hero-carousel__slide'
            }
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            draggable={false}
          />
        ))}

        <div className="home-hero-carousel__gradient" aria-hidden="true" />

        <div className="home-hero-carousel__caption">
          <p className="home-hero-carousel__caption-label">Nuestro espacio</p>
          <p className="home-hero-carousel__caption-title">{slideActivo.alt}</p>
        </div>

        <div
          className="home-hero-carousel__dots"
          role="tablist"
          aria-label="Seleccionar imagen del carrusel"
        >
          {imagenesCarrusel.map((item, index) => (
            <button
              key={item.url}
              type="button"
              role="tab"
              aria-selected={index === currentImageIndex}
              aria-label={`Ver imagen ${index + 1}: ${item.alt}`}
              className={
                index === currentImageIndex
                  ? 'home-hero-carousel__dot is-active'
                  : 'home-hero-carousel__dot'
              }
              style={
                index === currentImageIndex
                  ? { backgroundColor: COLOR_ACENTO_VINO }
                  : undefined
              }
              onClick={() => irASlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Imagen con fallback si falla la carga ───────────────────────────────── */

function ImagenPlato({ src, alt }) {
  const [urlActual, setUrlActual] = useState(src)

  useEffect(() => {
    setUrlActual(src)
  }, [src])

  return (
    <img
      src={urlActual}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={estiloImagenPlato}
      onError={() => {
        if (urlActual !== IMAGEN_CARTA_FALLBACK) {
          setUrlActual(IMAGEN_CARTA_FALLBACK)
        }
      }}
    />
  )
}

/* ── Tarjeta de plato (dos bloques: imagen + texto) ──────────────────────── */

function TarjetaPlato({ plato }) {
  return (
    <article className="home-plato-card" aria-label={plato.nombre}>
      <div className="home-plato-card__img-wrap" style={estiloContenedorImagen}>
        <ImagenPlato src={plato.imagen} alt={plato.nombre} />
      </div>

      <div className="home-plato-card__body" style={estiloCuerpoTexto}>
        <header style={estiloCabeceraPlato}>
          <h3 style={estiloNombrePlato}>{plato.nombre}</h3>
          <span style={estiloPrecioPlato}>{plato.precio.toFixed(2)} €</span>
        </header>

        <p style={estiloDescripcionPlato}>{plato.descripcion}</p>

        <p style={estiloAlergenosPlato}>
          {plato.alergenos.length > 0
            ? `Alérgenos: ${plato.alergenos.join(', ')}`
            : 'Sin alérgenos declarados'}
        </p>
      </div>
    </article>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */

export default function Home({ setPaginaActual }) {
  const [categoria, setCategoria] = useState('todos')
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMenu, setErrorMenu] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function cargarMenu() {
      try {
        setLoading(true)
        setErrorMenu('')

        const response = await fetch(`${API_BASE_URL}/api/menu`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar la carta desde el servidor.')
        }

        const data = await response.json()
        setMenu(Array.isArray(data) ? data : [])
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Detalles del fallo de conexión:', error)
          setErrorMenu('No pudimos cargar la carta ahora mismo. Inténtalo de nuevo.')
          setMenu([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    cargarMenu()

    return () => controller.abort()
  }, [])

  const platosFiltrados =
    categoria === 'todos'
      ? menu
      : menu.filter((plato) => plato.categoria === categoria)

  const irCarta = () => {
    document.getElementById('carta-digital')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home">
      {/* Hero — carrusel panorámico + contenido */}
      <section
        id="galeria-lagar"
        className="home-hero home-hero--carousel"
        aria-labelledby="home-hero-title"
      >
        <HeroCarruselPanoramico />

        <div className="home-hero__content-wrap">
          <div className="home-hero__content">
            <h1 id="home-hero-title" className="home-hero__title">
              Sabor de la tierra.
              <br />
              <span className="home-hero__accent">Tradición moderna.</span>
            </h1>
            <p className="home-hero__desc">
              Vino de nuestra cosecha en el norte de Tenerife y cocina canaria con
              mirada contemporánea.
            </p>
            <div className="home-hero__actions">
              <button type="button" className="btn-premium" onClick={irCarta}>
                Explorar Carta
              </button>
              <button
                type="button"
                className="btn-premium btn-premium--outline"
                onClick={() => setPaginaActual?.('reservas')}
              >
                Asegurar Mesa
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section
        id="contacto"
        className="bento-grid home-bento"
        aria-label="Información del local y contacto"
      >
        <article className="bento-card">
          <h3 className="bento-card__title">Nuestra Ubicación</h3>
          <p className="bento-card__text">
            <span style={{ color: '#9B111E', marginRight: '0.35rem' }} aria-hidden="true">
              📍
            </span>
            Camino El Vinculito, Nº 14
            <br />
            La Cruz Santa, 38413, Los Realejos, Santa Cruz de Tenerife
          </p>
          <p className="bento-card__text">
            Nos encontramos en el corazón de La Cruz Santa, rodeados de tradición
            vitivinícola. Ven a visitarnos en Camino El Vinculito, Nº 14, Los Realejos.
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Camino+El+Vinculito+14+Los+Realejos+Tenerife"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-premium bento-card__btn"
          >
            Abrir en Google Maps
          </a>
        </article>
        <article className="bento-card bento-card--accent bento-card--vino">
          <h3 className="bento-card__title">Vino de Cosecha</h3>
          <p className="bento-card__text">
            Listán Negro y Blanco Afrutado de nuestras barricas.
          </p>
        </article>
      </section>

      {/* Carta */}
      <section id="carta-digital" className="carta-digital" aria-labelledby="carta-titulo">
        <h2 id="carta-titulo" className="carta-digital__title">
          La Carta de Hoy
        </h2>

        <div className="carta-filters" role="tablist" aria-label="Filtrar por categoría">
          {CATEGORIAS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={categoria === id}
              className={`carta-filter-btn ${categoria === id ? 'carta-filter-btn--active' : ''}`}
              onClick={() => setCategoria(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="carta-digital__empty text-muted">Cargando carta del servidor…</p>
        ) : errorMenu ? (
          <div className="reservas-alert" role="alert">
            {errorMenu}
          </div>
        ) : (
          <div className="home-carta-grid">
            {platosFiltrados.map((plato) => (
              <TarjetaPlato key={plato.id} plato={plato} />
            ))}
          </div>
        )}

        {!loading && !errorMenu && platosFiltrados.length === 0 && (
          <p className="carta-digital__empty text-muted">
            No hay platos en esta categoría.
          </p>
        )}
      </section>
    </div>
  )
}
