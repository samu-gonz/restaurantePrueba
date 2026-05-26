import { useCallback, useEffect, useState } from 'react'
import './Navbar.css'

/* ── Horario de apertura ─────────────────────────────────────────────────── */

/**
 * Almuerzo: 12:00–16:00 · Cena: 19:30–23:00
 */
function comprobarApertura(fecha = new Date()) {
  const tiempoActual = fecha.getHours() + fecha.getMinutes() / 60
  const abiertoAlmuerzo = tiempoActual >= 12.0 && tiempoActual <= 16.0
  const abiertoCena = tiempoActual >= 19.5 && tiempoActual <= 23.0
  return abiertoAlmuerzo || abiertoCena
}

/* ── Semáforo premium (verde activo · gris apagado — sin rojo) ────────────── */

const COLOR_ABIERTO = '#22c55e'
const COLOR_CERRADO = '#525252'
const TEXTO_ABIERTO = 'Abierto Ahora'
const TEXTO_CERRADO = 'Cerrado (Abre 12:00 / 19:30)'

const ENLACES_NAV = [
  { id: 'inicio-carta', label: 'Inicio / Carta', seccion: 'carta-digital' },
  { id: 'galeria', label: 'Galería del Lagar', seccion: 'galeria-lagar' },
  { id: 'contacto', label: 'Contacto', seccion: 'contacto' },
]

const ESTILO_NAVBAR_GLASS = {
  background: 'rgba(13, 13, 13, 0.78)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderBottom: '1px solid #262626',
}

const ESTILO_OVERLAY_ABIERTO = {
  background: 'rgba(0, 0, 0, 0.5)',
}

const ESTILO_SIDEBAR = {
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  width: '300px',
  maxWidth: '88vw',
  background: '#161616',
  borderRight: '1px solid #262626',
}

function WidgetEstadoPremium({ estaAbierto }) {
  return (
    <div
      className={
        estaAbierto
          ? 'sidebar-status-widget sidebar-status-widget--open'
          : 'sidebar-status-widget sidebar-status-widget--closed'
      }
      role="status"
      aria-live="polite"
      aria-label={estaAbierto ? TEXTO_ABIERTO : TEXTO_CERRADO}
    >
      <span
        className={
          estaAbierto
            ? 'sidebar-status-widget__dot pulse-green'
            : 'sidebar-status-widget__dot sidebar-status-widget__dot--closed'
        }
        style={{
          backgroundColor: estaAbierto ? COLOR_ABIERTO : COLOR_CERRADO,
        }}
        aria-hidden="true"
      />
      <span
        className={
          estaAbierto
            ? 'sidebar-status-widget__text'
            : 'sidebar-status-widget__text sidebar-status-widget__text--closed'
        }
      >
        {estaAbierto ? TEXTO_ABIERTO : TEXTO_CERRADO}
      </span>
    </div>
  )
}

/**
 * Navbar fijo con glassmorphism + sidebar drawer izquierdo.
 */
export default function Navbar({ paginaActual, setPaginaActual }) {
  const [estaAbierto, setEstaAbierto] = useState(() => comprobarApertura())
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('inicio-carta')

  const cerrarMenu = useCallback(() => setMenuAbierto(false), [])
  const abrirMenu = useCallback(() => setMenuAbierto(true), [])

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
    if (!menuAbierto) return undefined

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

  const irSeccion = useCallback(
    (enlaceId, seccionId) => {
      setSeccionActiva(enlaceId)

      const scrollASeccion = () => {
        document.getElementById(seccionId)?.scrollIntoView({ behavior: 'smooth' })
      }

      if (paginaActual !== 'home') {
        setPaginaActual('home')
        window.setTimeout(scrollASeccion, 180)
      } else {
        scrollASeccion()
      }

      cerrarMenu()
    },
    [paginaActual, setPaginaActual, cerrarMenu],
  )

  const irInicio = () => {
    setPaginaActual('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    cerrarMenu()
  }

  const irReservas = () => {
    setPaginaActual('reservas')
    cerrarMenu()
  }

  return (
    <>
      {/* ── Barra superior fija ─────────────────────────────────────────── */}
      <nav
        className="navbar-float"
        style={ESTILO_NAVBAR_GLASS}
        aria-label="Navegación principal"
      >
        <div className="navbar-float__inner">
          <div className="navbar-float__start">
            <button
              type="button"
              className="navbar-hamburger"
              aria-expanded={menuAbierto}
              aria-controls="sidebar-drawer"
              aria-label="Abrir menú lateral"
              onClick={abrirMenu}
            >
              <span className="navbar-hamburger__line" />
              <span className="navbar-hamburger__line" />
              <span className="navbar-hamburger__line" />
            </button>

            <button type="button" className="navbar-brand" onClick={irInicio}>
              EL REALEJO <span className="navbar-brand__dot">•</span> TASCAS
            </button>
          </div>

          <button
            type="button"
            className={`btn-premium navbar-float__cta ${paginaActual === 'reservas' ? 'navbar-cta--active' : ''}`}
            onClick={irReservas}
          >
            Reservar Mesa
          </button>
        </div>
      </nav>

      {/* ── Overlay (solo visible con menú abierto) ───────────────────── */}
      {menuAbierto && (
        <button
          type="button"
          className="sidebar-drawer__overlay sidebar-drawer__overlay--visible"
          style={ESTILO_OVERLAY_ABIERTO}
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}

      {/* ── Sidebar drawer ────────────────────────────────────────────── */}
      <aside
        id="sidebar-drawer"
        className={menuAbierto ? 'sidebar-drawer sidebar-drawer--open' : 'sidebar-drawer'}
        style={{
          ...ESTILO_SIDEBAR,
          transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)',
        }}
        aria-hidden={!menuAbierto}
        aria-label="Menú de navegación"
      >
        <div className="sidebar-drawer__header">
          <button
            type="button"
            className="sidebar-drawer__close"
            aria-label="Cerrar menú"
            onClick={cerrarMenu}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-drawer__nav" aria-label="Secciones del sitio">
          {ENLACES_NAV.map(({ id, label, seccion }) => (
            <button
              key={id}
              type="button"
              className={
                paginaActual === 'home' && seccionActiva === id
                  ? 'sidebar-drawer__link sidebar-drawer__link--active'
                  : 'sidebar-drawer__link'
              }
              onClick={() => irSeccion(id, seccion)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-drawer__footer">
          <WidgetEstadoPremium estaAbierto={estaAbierto} />
        </div>
      </aside>
    </>
  )
}
