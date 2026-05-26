import { useEffect, useState } from 'react'
import {
  IMAGEN_CARTA_FALLBACK,
  IMAGEN_HERO_BODEGA,
  menuData,
} from '../data/db'
import './Home.css'

/* ── Tokens visuales ─────────────────────────────────────────────────────── */

const COLOR_VINO = '#9B111E'
const COLOR_FONDO_CARD = '#161616'
const COLOR_TEXTO_MUTED = '#A3A3A3'
const COLOR_ALERGENO = '#737373'
const RADIUS_TOP = 16

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(
  'Los Realejos, Tenerife, España',
)}`

const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'entrantes', label: 'Entrantes' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'postres', label: 'Postres' },
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

const estiloHeroImagen = {
  width: '100%',
  height: '100%',
  minHeight: '480px',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
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

  const platosFiltrados =
    categoria === 'todos'
      ? menuData
      : menuData.filter((plato) => plato.categoria === categoria)

  const irCarta = () => {
    document.getElementById('carta-digital')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero" aria-labelledby="home-hero-title">
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

        {/* Columna visual: visible en desktop, oculta en móvil */}
        <div className="home-hero__visual-col" id="galeria-lagar">
          <div className="home-hero__bodega-wrap" role="img" aria-label="Bodega con barricas">
            <img
              src={IMAGEN_HERO_BODEGA}
              alt=""
              fetchPriority="high"
              decoding="async"
              style={estiloHeroImagen}
            />
            <div className="home-hero__bodega-gradient" aria-hidden="true" />
            <div className="home-hero__bodega-caption">
              <p className="home-hero__bodega-label">Nuestro espacio</p>
              <p className="home-hero__bodega-title">El lagar de El Realejo</p>
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
          <p className="bento-card__text">Los Realejos, Tenerife, España</p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-premium bento-card__btn"
          >
            Ver en Google Maps
          </a>
        </article>
        <article className="bento-card bento-card--accent">
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

        <div className="home-carta-grid">
          {platosFiltrados.map((plato) => (
            <TarjetaPlato key={plato.id} plato={plato} />
          ))}
        </div>

        {platosFiltrados.length === 0 && (
          <p className="carta-digital__empty text-muted">
            No hay platos en esta categoría.
          </p>
        )}
      </section>
    </div>
  )
}
