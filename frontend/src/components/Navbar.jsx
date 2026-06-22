import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconoChat } from './Chatbot'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

function comprobarApertura(fecha = new Date()) {
  const tiempoActual = fecha.getHours() + fecha.getMinutes() / 60
  const abiertoAlmuerzo = tiempoActual >= 12.0 && tiempoActual <= 16.0
  const abiertoCena = tiempoActual >= 19.5 && tiempoActual <= 23.0
  return abiertoAlmuerzo || abiertoCena
}

const COLOR_ABIERTO = '#22c55e'
const COLOR_CERRADO = '#525252'

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
  const { t } = useTranslation()
  const textoAbierto = t('common.open')
  const textoCerrado = t('common.closed')

  return (
    <div
      className={
        estaAbierto
          ? 'sidebar-status-widget sidebar-status-widget--open'
          : 'sidebar-status-widget sidebar-status-widget--closed'
      }
      role="status"
      aria-live="polite"
      aria-label={estaAbierto ? textoAbierto : textoCerrado}
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
        {estaAbierto ? textoAbierto : textoCerrado}
      </span>
    </div>
  )
}

export default function Navbar({ paginaActual, setPaginaActual, chatAbierto, onToggleChat }) {
  const { t } = useTranslation()
  const [estaAbierto, setEstaAbierto] = useState(() => comprobarApertura())
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('inicio')

  const enlacesNav = useMemo(
    () => [
      { id: 'inicio', label: t('nav.home'), tipo: 'inicio' },
      { id: 'carta', label: t('nav.menu'), tipo: 'seccion', seccion: 'carta-digital' },
      { id: 'ubicacion', label: t('nav.location'), tipo: 'seccion', seccion: 'ubicacion' },
      { id: 'reservas', label: t('nav.bookTable'), tipo: 'pagina', pagina: 'reservas' },
      { id: 'chat', label: t('nav.assistant'), tipo: 'chat' },
    ],
    [t],
  )

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
        const destino = document.getElementById(seccionId)
        if (destino) {
          destino.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }

      if (paginaActual !== 'home') {
        setPaginaActual('home')
        window.setTimeout(scrollASeccion, 400)
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
        aria-label={t('nav.main')}
      >
        <div className="navbar-float__inner">
          <div className="navbar-float__start">
            <button
              type="button"
              className="navbar-hamburger"
              aria-expanded={menuAbierto}
              aria-controls="sidebar-drawer"
              aria-label={t('nav.openMenu')}
              onClick={abrirMenu}
            >
              <span className="navbar-hamburger__line" />
              <span className="navbar-hamburger__line" />
              <span className="navbar-hamburger__line" />
            </button>

            <button type="button" className="navbar-brand" onClick={irInicio}>
              <span className="navbar-brand__line">EL REALEJO</span>
              <span className="navbar-brand__line navbar-brand__line--sub">
                <span className="navbar-brand__dot">•</span> TASCAS
              </span>
            </button>
          </div>

          <div className="navbar-float__end">
            <div className="navbar-float__lang">
              <LanguageSwitcher compact />
            </div>

            <button
              type="button"
              className={
                chatAbierto ? 'navbar-chat-btn navbar-chat-btn--active' : 'navbar-chat-btn'
              }
              aria-label={chatAbierto ? t('nav.closeChat') : t('nav.openChat')}
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
              {t('nav.bookTable')}
            </button>
          </div>
        </div>
      </nav>

      {menuAbierto && (
        <button
          type="button"
          className="sidebar-drawer__overlay sidebar-drawer__overlay--visible"
          style={ESTILO_OVERLAY_ABIERTO}
          aria-label={t('nav.closeMenu')}
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
        aria-label={t('nav.menuTitle')}
      >
        <div className="sidebar-drawer__header">
          <p className="sidebar-drawer__title">{t('nav.menuTitle')}</p>
          <button
            type="button"
            className="sidebar-drawer__close"
            aria-label={t('nav.closeMenu')}
            onClick={cerrarMenu}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-drawer__lang">
          <LanguageSwitcher />
        </div>

        <nav className="sidebar-drawer__nav" aria-label={t('nav.sections')}>
          {enlacesNav.map((enlace) => (
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
          <button
            type="button"
            className="sidebar-admin-link"
            onClick={() => irPagina('admin')}
          >
            {t('nav.admin')}
          </button>
          <WidgetEstadoPremium estaAbierto={estaAbierto} />
        </div>
      </aside>
    </>
  )
}
