import { Link } from 'react-router-dom'

const IMAGEN_GASTRONOMICA =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'

const DIRECCION = {
  linea1: 'Calle La Hornera, 12',
  linea2: '38410 El Realejo, Tenerife',
}

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(
  'Calle La Hornera 12, El Realejo, Tenerife',
)}`

const TELEFONO = '+34 922 000 000'
const TEL_HREF = 'tel:+34922000000'

/**
 * Hero asimétrico + Bento Grid de contacto y ubicación.
 */
export default function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero__grid">
        {/* Columna izquierda — copy y CTAs */}
        <div className="hero__content">
          <p className="overline">Alta cocina canaria · Norte de Tenerife</p>

          <h1 id="hero-title" className="hero__title">
            Sabor de <em>viña</em>, alma de guachinche
          </h1>

          <p className="hero__desc">
            Una experiencia íntima donde el vino de nuestra cosecha y la cocina
            de autor se encuentran en un ambiente oscuro, elegante y sin
            pretensiones.
          </p>

          <div className="hero__actions">
            <a href="#carta" className="btn btn--fill">
              Explorar carta
            </a>
            <Link to="/reservar" className="btn btn--outline">
              Reservar mesa
            </Link>
          </div>
        </div>

        {/* Columna derecha — tarjeta visual premium */}
        <figure className="hero__visual card">
          <img
            src={IMAGEN_GASTRONOMICA}
            alt="Mesa gourmet con vino tinto en ambiente íntimo"
            fetchPriority="high"
          />
          <div className="hero__visual-overlay" aria-hidden="true" />
          <figcaption className="hero__visual-caption">
            <p>Vino de autor, producto de proximidad</p>
          </figcaption>
        </figure>
      </div>

      {/* Bento Grid — ubicación, maps, teléfono */}
      <div id="ubicacion" className="bento" aria-label="Información de contacto">
        <article className="bento__card bento__card--wide card">
          <div>
            <p className="bento__label">Dónde estamos</p>
            <p className="bento__value">
              {DIRECCION.linea1}
              <small>{DIRECCION.linea2}</small>
            </p>
          </div>
          <a
            href={MAPS_URL}
            className="bento__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Maps →
          </a>
        </article>

        <article className="bento__card card">
          <div>
            <p className="bento__label">Ruta</p>
            <p className="bento__value">Navegación GPS</p>
          </div>
          <a href={MAPS_URL} className="btn btn--outline btn--block" target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
        </article>

        <article className="bento__card card">
          <div>
            <p className="bento__label">Contacto</p>
            <p className="bento__value">{TELEFONO}</p>
          </div>
          <a href={TEL_HREF} className="btn btn--gold btn--block">
            Llamar ahora
          </a>
        </article>
      </div>
    </section>
  )
}
