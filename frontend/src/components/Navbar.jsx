import { useCallback, useEffect, useState } from 'react'
import { IconoChat } from './Chatbot'
import './Navbar.css'

/* ── Horario de apertura ─────────────────────────────────────────────────── */

function comprobarApertura(fecha = new Date()) {
  const tiempoActual = fecha.getHours() + fecha.getMinutes() / 60
  const abiertoAlmuerzo = tiempoActual >= 12.0 && tiempoActual <= 16.0
  const abiertoCena = tiempoActual >= 19.5 && tiempoActual <= 23.0
  return abiertoAlmuerzo || abiertoCena
}

const COLOR_ABIERTO = '#22c55e'
const COLOR_CERRADO = '#525252'
const TEXTO_ABIERTO = 'Abierto Ahora'
const TEXTO_CERRADO = 'Cerrado (Abre 12:00 / 19:30)'

const ENLACES_NAV = [
  { id: 'inicio', label: 'Inicio', tipo: 'inicio' },
  { id: 'carta', label: 'Carta', tipo: 'seccion', seccion: 'carta-digital' },
  { id: 'reservas', label: 'Reservar Mesa', tipo: 'pagina', pagina: 'reservas' },
  { id: 'admin', label: 'Panel Admin', tipo: 'pagina', pagina: 'admin' },
  { id: 'contacto', label: 'Contacto', tipo: 'seccion', seccion: 'contacto' },
  { id: 'chat', label: 'Asistente virtual', tipo: 'chat' },
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
  height: '100dvh',
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

export default function Navbar({ paginaActual, setPaginaActual, chatAbierto, onToggleChat }) {
  const [estaAbierto, setEstaAbierto] = useState(() => comprobarApertura())
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('inicio')

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

  const irInicio = useCallback(() => {
    setPaginaActual('home')
    setSeccionActiva('inicio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    cerrarMenu()
  }, [setPaginaActual, cerrarMenu])

  const irPagina = useCallback(
    (pagina) => {
      setPaginaActual(pagina)
      setSeccionActiva(pagina === 'reservas' ? 'reservas' : 'admin')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      cerrarMenu()
    },
    [setPaginaActual, cerrarMenu],
  )

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

  const abrirChat = useCallback(() => {
    if (!chatAbierto) onToggleChat()
    cerrarMenu()
  }, [chatAbierto, onToggleChat, cerrarMenu])

  const manejarEnlace = useCallback(
    (enlace) => {
      if (enlace.tipo === 'inicio') {
        irInicio()
        return
      }
      if (enlace.tipo === 'pagina') {
        irPagina(enlace.pagina)
        return
      }
      if (enlace.tipo === 'seccion') {
        irSeccion(enlace.id, enlace.seccion)
        return
      }
      if (enlace.tipo === 'chat') {
        abrirChat()
      }
    },
    [irInicio, irPagina, irSeccion, abrirChat],
  )

  const enlaceActivo = (enlace) => {
    if (enlace.tipo === 'pagina') return paginaActual === enlace.pagina
    if (enlace.tipo === 'chat') return chatAbierto
    if (enlace.tipo === 'inicio') return paginaActual === 'home' && seccionActiva === 'inicio'
    if (enlace.tipo === 'seccion') return paginaActual === 'home' && seccionActiva === enlace.id
    return false
  }

  return (
    <>
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
              aria-label="Abrir menú"
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

          <div className="navbar-float__end">
            <button
              type="button"
              className={
                chatAbierto ? 'navbar-chat-btn navbar-chat-btn--active' : 'navbar-chat-btn'
              }
              aria-label={chatAbierto ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
              aria-expanded={chatAbierto}
              aria-controls="chatbot-panel"
              onClick={onToggleChat}
            >
              <IconoChat />
            </button>

            <button
              type="button"
              className={`btn-premium navbar-float__cta ${paginaActual === 'reservas' ? 'navbar-cta--active' : ''}`}
              onClick={() => irPagina('reservas')}
            >
              Reservar Mesa
            </button>
          </div>
        </div>
      </nav>

      {menuAbierto && (
        <button
          type="button"
          className="sidebar-drawer__overlay sidebar-drawer__overlay--visible"
          style={ESTILO_OVERLAY_ABIERTO}
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}

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
          <p className="sidebar-drawer__title">Menú</p>
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
          {ENLACES_NAV.map((enlace) => (
            <button
              key={enlace.id}
              type="button"
              className={
                enlaceActivo(enlace)
                  ? 'sidebar-drawer__link sidebar-drawer__link--active'
                  : 'sidebar-drawer__link'
              }
              onClick={() => manejarEnlace(enlace)}
            >
              {enlace.label}
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
