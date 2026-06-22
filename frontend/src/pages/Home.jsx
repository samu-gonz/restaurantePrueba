import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAPS_EMBED_URL, MAPS_URL, UBICACION_RESTAURANTE } from '../config/ubicacion'
import { IMAGEN_CARTA_FALLBACK, formatearPrecio, menuData } from '../data/db'
import { localeFecha } from '../i18n'
import { traducirCarta } from '../i18n/menu'
import './Home.css'

/* ── Tokens visuales ─────────────────────────────────────────────────────── */

const COLOR_VINO = '#9B111E'
const COLOR_FONDO_CARD = '#161616'
const COLOR_TEXTO_MUTED = '#A3A3A3'
const COLOR_ALERGENO = '#737373'
const RADIUS_TOP = 16

const CATEGORIA_IDS = ['todos', 'entrantes', 'carnes', 'pescados', 'postres']
const ORDEN_CATEGORIAS = ['entrantes', 'carnes', 'pescados', 'postres']

const HERO_CARRUSEL_INTERVALO_MS = 4000
const imagenesCarruselKeys = ['1', '2', '3', '4']
const imagenesCarruselUrls = [
  {
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&h=600&q=80',
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&h=600&q=80',
  },
  {
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&h=600&q=80',
  },
  {
    url: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=1600&h=600&q=80',
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
  const { t } = useTranslation()
  const imagenesCarrusel = useMemo(
    () =>
      imagenesCarruselUrls.map((item, index) => ({
        ...item,
        alt: t(`home.carousel.${imagenesCarruselKeys[index]}.alt`),
      })),
    [t],
  )
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
      aria-label={t('home.carouselLabel')}
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
          <p className="home-hero-carousel__caption-label">{t('home.carouselCaption')}</p>
          <p className="home-hero-carousel__caption-title">{slideActivo.alt}</p>
        </div>

        <div
          className="home-hero-carousel__dots"
          role="tablist"
          aria-label={t('home.carouselSelect')}
        >
          {imagenesCarrusel.map((item, index) => (
            <button
              key={item.url}
              type="button"
              role="tab"
              aria-selected={index === currentImageIndex}
              aria-label={t('home.carouselView', { n: index + 1, alt: item.alt })}
              className={
                index === currentImageIndex
                  ? 'home-hero-carousel__dot is-active'
                  : 'home-hero-carousel__dot'
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

function agruparPlatosPorCategoria(platos) {
  const mapa = new Map()
  for (const plato of platos) {
    if (!mapa.has(plato.categoria)) mapa.set(plato.categoria, [])
    mapa.get(plato.categoria).push(plato)
  }
  return ORDEN_CATEGORIAS.filter((cat) => mapa.has(cat)).map((cat) => [cat, mapa.get(cat)])
}

function ListaCartaPrecios({ platos, locale }) {
  const { t } = useTranslation()
  const grupos = agruparPlatosPorCategoria(platos)

  return (
    <div className="carta-lista-precios" aria-label={t('home.menuToday')}>
      {grupos.map(([categoria, platosCategoria]) => (
        <div key={categoria} className="carta-lista-precios__grupo">
          <h3 className="carta-lista-precios__categoria">{t(`categories.${categoria}`)}</h3>
          <ul className="carta-lista-precios__lista">
            {platosCategoria.map((plato) => (
              <li key={plato.id} className="carta-lista-precios__item">
                <span className="carta-lista-precios__nombre">{plato.nombre}</span>
                <span className="carta-lista-precios__puntos" aria-hidden="true" />
                <span className="carta-lista-precios__precio">
                  {formatearPrecio(plato.precio, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TarjetaPlato({ plato, locale }) {
  const { t } = useTranslation()
  const precioTexto = formatearPrecio(plato.precio, locale)

  return (
    <article className="home-plato-card" aria-label={`${plato.nombre} — ${precioTexto}`}>
      <div className="home-plato-card__img-wrap" style={estiloContenedorImagen}>
        <ImagenPlato src={plato.imagen} alt={plato.nombre} />
        <span className="home-plato-card__precio-badge">{precioTexto}</span>
      </div>

      <div className="home-plato-card__body" style={estiloCuerpoTexto}>
        <header style={estiloCabeceraPlato}>
          <h3 style={estiloNombrePlato}>{plato.nombre}</h3>
          <span style={estiloPrecioPlato}>{precioTexto}</span>
        </header>

        <p style={estiloDescripcionPlato}>{plato.descripcion}</p>

        <p style={estiloAlergenosPlato}>
          {plato.alergenos.length > 0
            ? t('home.allergens', { list: plato.alergenos.join(', ') })
            : t('home.noAllergens')}
        </p>
      </div>
    </article>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */

export default function Home({ setPaginaActual }) {
  const { t, i18n } = useTranslation()
  const [categoria, setCategoria] = useState('todos')

  const categorias = useMemo(
    () => CATEGORIA_IDS.map((id) => ({ id, label: t(`categories.${id}`) })),
    [t, i18n.language],
  )

  const cartaTraducida = useMemo(() => traducirCarta(menuData), [i18n.language])
  const localeMoneda = localeFecha()

  const platosFiltrados =
    categoria === 'todos'
      ? cartaTraducida
      : cartaTraducida.filter((plato) => plato.categoria === categoria)

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
              {t('home.heroTitle1')}
              <br />
              <span className="home-hero__accent">{t('home.heroTitle2')}</span>
            </h1>
            <p className="home-hero__desc">{t('home.heroSubtitle')}</p>
            <div className="home-hero__actions">
              <button type="button" className="btn-premium" onClick={irCarta}>
                {t('home.exploreMenu')}
              </button>
              <button
                type="button"
                className="btn-premium btn-premium--outline"
                onClick={() => setPaginaActual?.('reservas')}
              >
                {t('home.bookTable')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section
        id="contacto"
        className="bento-grid home-bento"
        aria-label={t('home.locationSection')}
      >
        <article id="ubicacion" className="bento-card">
          <h3 className="bento-card__title">{t('home.ourLocation')}</h3>
          <p className="bento-card__text">
            <a className="bento-card__direccion" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <span style={{ color: '#9B111E', marginRight: '0.35rem' }} aria-hidden="true">
                📍
              </span>
              {UBICACION_RESTAURANTE.calle}
              <br />
              {UBICACION_RESTAURANTE.localidad}
            </a>
          </p>
          <iframe
            className="bento-card__mapa"
            title={t('home.mapOf', { name: UBICACION_RESTAURANTE.nombre })}
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <p className="bento-card__text">{t('home.locationBody')}</p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-premium bento-card__btn"
          >
            {t('home.openMaps')}
          </a>
        </article>
        <article className="bento-card bento-card--accent bento-card--vino">
          <h3 className="bento-card__title">{t('home.wineTitle')}</h3>
          <p className="bento-card__text">{t('home.wineBody')}</p>
        </article>
      </section>

      {/* Carta */}
      <section id="carta-digital" className="carta-digital" aria-labelledby="carta-titulo">
        <h2 id="carta-titulo" className="carta-digital__title">
          {t('home.menuToday')}
        </h2>

        <div className="carta-filters" role="tablist" aria-label={t('home.filterCategory')}>
          {categorias.map(({ id, label }) => (
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

        <ListaCartaPrecios platos={platosFiltrados} locale={localeMoneda} />

        <div className="home-carta-grid">
          {platosFiltrados.map((plato) => (
            <TarjetaPlato key={plato.id} plato={plato} locale={localeMoneda} />
          ))}
        </div>

        {platosFiltrados.length === 0 && (
          <p className="carta-digital__empty text-muted">{t('home.noDishes')}</p>
        )}
      </section>
    </div>
  )
}
