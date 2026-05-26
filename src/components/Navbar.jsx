import { useCallback, useEffect, useState } from 'react'

/**
 * Comprueba si el guachinche está abierto (hora del dispositivo).
 * Almuerzo: 12:00–16:00 · Cena: 19:30–23:00
 */
function comprobarApertura(fecha = new Date()) {
  const hora = fecha.getHours()
  const minutos = fecha.getMinutes()
  const tiempoActual = hora + minutos / 60

  const abiertoAlmuerzo = tiempoActual >= 12.0 && tiempoActual <= 16.0
  const abiertoCena = tiempoActual >= 19.5 && tiempoActual <= 23.0

  return abiertoAlmuerzo || abiertoCena
}

/**
 * Navbar flotante — recibe paginaActual y setPaginaActual desde App.jsx.
 */
export default function Navbar({ paginaActual, setPaginaActual }) {
  const [estaAbierto, setEstaAbierto] = useState(() => comprobarApertura())
  const [menuAbierto, setMenuAbierto] = useState(false)

  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])

  useEffect(() => {
    const tick = () => setEstaAbierto(comprobarApertura(new Date()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    cerrarMenu()
  }, [paginaActual, cerrarMenu])

  useEffect(() => {
    if (!menuAbierto) return

    const onEscape = (e) => {
      if (e.key === 'Escape') cerrarMenu()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEscape)
    }
  }, [menuAbierto, cerrarMenu])

  const irInicio = () => {
    setPaginaActual('home')
    cerrarMenu()
  }

  const irReservas = () => {
    setPaginaActual('reservas')
    cerrarMenu()
  }

  const irCarta = () => {
    if (paginaActual !== 'home') {
      setPaginaActual('home')
      window.setTimeout(() => {
        document.getElementById('carta-digital')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById('carta-digital')?.scrollIntoView({ behavior: 'smooth' })
    }
    cerrarMenu()
  }

  return (
    <nav className="navbar-float glass" aria-label="Navegación principal">
      <div className="navbar-float__inner">
        <button type="button" className="navbar-brand" onClick={irInicio}>
          EL REALEJO <span className="navbar-brand__dot">•</span> TASCAS
        </button>

        <div className="navbar-float__actions">
          <div className="navbar-status-widget" role="status" aria-live="polite">
            <span
              className={`navbar-status-widget__dot ${estaAbierto ? 'pulse-green' : ''}`}
              style={{
                backgroundColor: estaAbierto ? '#22c55e' : '#eab308',
              }}
              aria-hidden="true"
            />
            <span className="navbar-status-widget__text">
              {estaAbierto ? 'Abierto Ahora' : 'Cerrado (Abre 12:00 / 19:30)'}
            </span>
          </div>

          <div className="navbar-float__links">
            <button
              type="button"
              className={`navbar-nav-link ${paginaActual === 'home' ? 'navbar-nav-link--active' : ''}`}
              onClick={irCarta}
            >
              Carta
            </button>

            <button
              type="button"
              className={`btn-premium ${paginaActual === 'reservas' ? 'navbar-cta--active' : ''}`}
              onClick={irReservas}
            >
              Reservar Mesa
            </button>
          </div>

          <button
            type="button"
            className="navbar-float__toggle"
            aria-expanded={menuAbierto}
            aria-controls="navbar-mobile-menu"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuAbierto && (
        <>
          <button
            type="button"
            className="navbar-float__overlay"
            aria-label="Cerrar menú"
            onClick={cerrarMenu}
          />
          <div id="navbar-mobile-menu" className="navbar-float__mobile glass">
            <button type="button" className="navbar-nav-link" onClick={irCarta}>
              Carta
            </button>
            <button type="button" className="btn-premium btn--block" onClick={irReservas}>
              Reservar Mesa
            </button>
          </div>
        </>
      )}
    </nav>
  )
}
