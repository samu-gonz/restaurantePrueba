import Hero from '../components/Hero'

/**
 * Página de inicio: Hero (con Bento Grid) + Carta.
 */
export default function Home() {
  return (
    <>
      <Hero />

      <section id="carta" className="section container">
        <span className="badge">Carta de autor</span>
        <h2 className="section-title">Selección del día</h2>
        <div className="menu-grid">
          <article className="menu-item card">
            <h3>Papas arrugadas</h3>
            <p className="text-muted">Mojo rojo y verde. Producto local.</p>
            <p className="menu-item__price">4,50 €</p>
          </article>
          <article className="menu-item card">
            <h3>Carne de fiesta</h3>
            <p className="text-muted">Adobo tradicional, guarnición de temporada.</p>
            <p className="menu-item__price">9,00 €</p>
          </article>
          <article className="menu-item card">
            <h3>Vino de la casa</h3>
            <p className="text-muted">Copa o botella. Cosecha propia.</p>
            <p className="menu-item__price">desde 1,50 €</p>
          </article>
        </div>
      </section>
    </>
  )
}
