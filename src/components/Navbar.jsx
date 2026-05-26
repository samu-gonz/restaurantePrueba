import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ENLACES = [
  { to: '/#carta', label: 'Carta' },
  { to: '/#ubicacion', label: 'Ubicación' },
]

function estaAbierto(fecha = new Date()) {
  const totalMinutos = fecha.getHours() * 60 + fecha.getMinutes()
  const almuerzo = totalMinutos >= 12 * 60 && totalMinutos <= 16 * 60
  const cena = totalMinutos >= 19 * 60 + 30 && totalMinutos <= 23 * 60
  return almuerzo || cena
}

export default function Navbar() {
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(() => estaAbierto())
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])

  useEffect(() => {
    const tick = () => setAbierto(estaAbierto(new Date()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    cerrarMenu()
  }, [pathname, cerrarMenu])

  useEffect(() => {
    if (!menuAbierto) return

    const onKey = (e) => {
      if (e.key === 'Escape') cerrarMenu()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuAbierto, cerrarMenu])

  const irInicioHash = (hash) => {
    cerrarMenu()
    if (pathname !== '/') {
      window.location.href = `/${hash}`
    }
  }

  return (
    <header className="navbar">
      <div className="navbar__shell glass">
        <Link to="/" className="navbar__logo" onClick={cerrarMenu}>
          Guachinche <span>El Realejo</span>
        </Link>

        <div className="navbar__right">
          <div
            className={`navbar__status ${abierto ? 'navbar__status--open' : ''}`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`navbar__dot ${abierto ? 'navbar__dot--open' : 'navbar__dot--closed'}`}
              aria-hidden="true"
            />
            <span>{abierto ? 'Abierto' : 'Abrimos a las 12:00 / 19:30'}</span>
          </div>

          <Link
            to="/reservar"
            className="btn btn--fill navbar__cta"
            onClick={cerrarMenu}
          >
            Reservar Mesa
          </Link>

          <button
            type="button"
            className="navbar__toggle"
            aria-expanded={menuAbierto}
            aria-controls="navbar-menu"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span className="navbar__toggle-line" />
            <span className="navbar__toggle-line" />
            <span className="navbar__toggle-line" />
          </button>

          <nav
            id="navbar-menu"
            className={`navbar__nav ${menuAbierto ? 'navbar__nav--open' : ''}`}
            aria-label="Navegación principal"
          >
            <ul className="navbar__links" role="list">
              {ENLACES.map(({ to, label }) => (
                <li key={to}>
                  {to.includes('#') ? (
                    <a
                      href={to}
                      className="navbar__link"
                      onClick={(e) => {
                        if (pathname === '/') return cerrarMenu()
                        e.preventDefault()
                        irInicioHash(to.replace('/', ''))
                      }}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className="navbar__link" onClick={cerrarMenu}>
                      {label}
                    </Link>
                  )}
                </li>
              ))}
              <li className="navbar__link-cta-mobile">
                <Link to="/reservar" className="btn btn--fill btn--block" onClick={cerrarMenu}>
                  Reservar Mesa
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {menuAbierto && (
        <button
          type="button"
          className="navbar__overlay"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}
    </header>
  )
}
