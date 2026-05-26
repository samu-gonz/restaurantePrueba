import { useState } from 'react'
import { menuData } from '../data/db'

const IMAGEN_HERO =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(
  'Los Realejos, Tenerife, España',
)}`

const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'entrantes', label: 'Entrantes' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'postres', label: 'Postres' },
]

/**
 * Vista principal: Hero asimétrico + Bento Grid + Carta digital filtrable.
 * @param {function} setPaginaActual - Navegación a reservas ('reservas' | 'home')
 */
export default function Home({ setPaginaActual }) {
  const [categoria, setCategoria] = useState('todos')

  const platosFiltrados =
    categoria === 'todos'
      ? menuData
      : menuData.filter((p) => p.categoria === categoria)

  const scrollCarta = () => {
    document.getElementById('carta-digital')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home">
      {/* Hero asimétrico */}
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__content">
          <h1 id="home-hero-title" className="home-hero__title">
            Sabor de la tierra.
            <br />
            <span className="home-hero__accent">Tradición moderna.</span>
          </h1>
          <p className="home-hero__desc">
            Disfruta del auténtico vino de nuestra propia cosecha cosechado en el
            norte de Tenerife y de platos tradicionales canarios cocinados con una
            perspectiva contemporánea.
          </p>
          <div className="home-hero__actions">
            <button type="button" className="btn-premium" onClick={scrollCarta}>
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

        <figure className="home-hero__visual">
          <img src={IMAGEN_HERO} alt="Mesa gourmet en el lagar de El Realejo" />
          <div className="home-hero__visual-caption">
            <p className="home-hero__visual-label">Nuestro espacio</p>
            <p className="home-hero__visual-title">El lagar de El Realejo</p>
          </div>
        </figure>
      </section>

      {/* Bento Grid informativo */}
      <section className="bento-grid home-bento" aria-label="Información del local">
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
            Listán Negro y Blanco Afrutado directamente extraído de nuestras
            barricas esta temporada.
          </p>
        </article>
      </section>

      {/* Carta digital interactiva — sin PDF */}
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

        <div className="carta-grid">
          {platosFiltrados.map((plato) => (
            <article key={plato.id} className="carta-plato">
              <div className="carta-plato__body">
                <header className="carta-plato__header">
                  <h3>{plato.nombre}</h3>
                  <span className="carta-plato__precio">
                    {plato.precio.toFixed(2)}€
                  </span>
                </header>
                <p className="carta-plato__desc">{plato.descripcion}</p>
              </div>
              {plato.alergenos.length > 0 && (
                <p className="carta-plato__alergenos">
                  Contiene: {plato.alergenos.join(', ')}
                </p>
              )}
            </article>
          ))}
        </div>

        {platosFiltrados.length === 0 && (
          <p className="carta-digital__empty text-muted">
            No hay platos en esta categoría por ahora.
          </p>
        )}
      </section>
    </div>
  )
}
