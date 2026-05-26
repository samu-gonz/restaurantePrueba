import { useCallback, useEffect, useRef, useState } from 'react'
import { CONFIG_RESTAURANTE, formatearPrecio, menuData } from '../data/db'
import './Chatbot.css'

const COLOR_VINO = '#9B111E'
const MENSAJE_BIENVENIDA =
  '¡Hola! Soy el asistente de Guachinche El Realejo. Pregúntame por la carta, reservas u horarios — te mostraré la información al instante.'
const RETRASO_RESPUESTA_MS = 600

const PLATOS_ESTRELLA = [...menuData].sort((a, b) => b.precio - a.precio).slice(0, 3)
const PLATOS_CARNES = menuData.filter((p) => p.categoria === 'carnes')

function crearId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** Misma lógica que el Navbar — turnos de servicio */
function comprobarApertura(fecha = new Date()) {
  const tiempoActual = fecha.getHours() + fecha.getMinutes() / 60
  const abiertoAlmuerzo = tiempoActual >= 12.0 && tiempoActual <= 16.0
  const abiertoCena = tiempoActual >= 19.5 && tiempoActual <= 23.0
  return abiertoAlmuerzo || abiertoCena
}

function turnoActivo(tipo, fecha = new Date()) {
  const t = fecha.getHours() + fecha.getMinutes() / 60
  if (tipo === 'almuerzo') return t >= 12.0 && t <= 16.0
  if (tipo === 'cena') return t >= 19.5 && t <= 23.0
  return false
}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/* ── Rich Cards ──────────────────────────────────────────────────────────── */

function CarruselPlatos({ platos }) {
  if (!platos.length) return null

  return (
    <div className="chatbot-carousel" role="list" aria-label="Platos recomendados">
      {platos.map((plato) => (
        <article key={plato.id} className="chatbot-dish-card" role="listitem">
          <div className="chatbot-dish-card__media">
            <img
              src={plato.imagen}
              alt={plato.nombre}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="chatbot-dish-card__body">
            <h4 className="chatbot-dish-card__nombre">{plato.nombre}</h4>
            <span className="chatbot-dish-card__precio" style={{ color: COLOR_VINO }}>
              {formatearPrecio(plato.precio)}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function BotonIrReservas({ onClick }) {
  return (
    <button type="button" className="chatbot-rich-btn" onClick={onClick}>
      📅 Ir a Reservas
    </button>
  )
}

function TablaHorarios() {
  const abiertoGlobal = comprobarApertura()
  const almuerzoActivo = turnoActivo('almuerzo')
  const cenaActivo = turnoActivo('cena')

  const filas = [
    { id: 'almuerzo', emoji: '🍽️', nombre: 'Almuerzo', horario: '12:00 – 16:00', activo: almuerzoActivo },
    { id: 'cena', emoji: '🌙', nombre: 'Cena', horario: '19:30 – 23:00', activo: cenaActivo },
  ]

  return (
    <div className="chatbot-schedule">
      <div
        className={
          abiertoGlobal
            ? 'chatbot-schedule__estado chatbot-schedule__estado--open'
            : 'chatbot-schedule__estado chatbot-schedule__estado--closed'
        }
      >
        <span
          className="chatbot-schedule__dot"
          style={{
            backgroundColor: abiertoGlobal ? '#22c55e' : '#525252',
          }}
          aria-hidden="true"
        />
        <span>{abiertoGlobal ? 'Abierto ahora' : 'Cerrado en este momento'}</span>
      </div>

      <table className="chatbot-schedule__table">
        <thead>
          <tr>
            <th scope="col">Turno</th>
            <th scope="col">Horario</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              <td>
                {fila.emoji} {fila.nombre}
              </td>
              <td>{fila.horario}</td>
              <td>
                <span
                  className={
                    fila.activo
                      ? 'chatbot-schedule__badge chatbot-schedule__badge--open'
                      : 'chatbot-schedule__badge chatbot-schedule__badge--closed'
                  }
                >
                  <span
                    className="chatbot-schedule__badge-dot"
                    style={{ backgroundColor: fila.activo ? '#22c55e' : '#525252' }}
                    aria-hidden="true"
                  />
                  {fila.activo ? 'En servicio' : 'Fuera de hora'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="chatbot-schedule__note">Cerramos lunes y martes.</p>
    </div>
  )
}

/* ── Motor de respuestas enriquecidas ──────────────────────────────────────── */

function resolverRespuesta(textoUsuario, { irReservas }) {
  const texto = normalizarTexto(textoUsuario)
  const incluye = (...palabras) => palabras.some((p) => texto.includes(p))

  if (incluye('horario', 'abierto', 'cierra', 'abre', 'hora')) {
    return {
      text: 'Estos son nuestros turnos de cocina y servicio en sala:',
      component: <TablaHorarios />,
    }
  }

  if (incluye('reserva', 'reservar', 'mesa', 'apartar', 'turno', 'booking')) {
    return {
      text: `Perfecto. Disponemos de ${CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas por turno. Pulsa el botón para gestionar tu reserva:`,
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }

  if (incluye('carne', 'costillas', 'fiesta', 'cerdo', 'carnes')) {
    return {
      text: 'Nuestras carnes son el corazón del guachinche. Échales un vistazo:',
      component: <CarruselPlatos platos={PLATOS_CARNES} />,
    }
  }

  if (incluye('carta', 'menu', 'comer', 'platos', 'plato', 'entrante', 'precio', 'comida')) {
    return {
      text: 'Te dejo algunos de nuestros platos más solicitados de la carta:',
      component: <CarruselPlatos platos={PLATOS_ESTRELLA} />,
    }
  }

  if (incluye('postre', 'dulce', 'polvito')) {
    const postres = menuData.filter((p) => p.categoria === 'postres')
    return {
      text: 'Para rematar la experiencia, nuestro postre estrella:',
      component: <CarruselPlatos platos={postres.length ? postres : menuData.slice(-1)} />,
    }
  }

  return {
    text: 'Puedo ayudarte con la carta, reservas u horarios. Prueba preguntarme por «carta», «reservar mesa» o «horario».',
    component: null,
  }
}

function IconoChat() {
  return (
    <svg
      className="chatbot-fab__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconoEnviar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function BurbujaMensaje({ mensaje }) {
  const esUsuario = mensaje.sender === 'user'
  const esRich = !esUsuario && mensaje.component

  return (
    <div
      className={[
        'chatbot-bubble',
        esUsuario ? 'chatbot-bubble--user' : 'chatbot-bubble--bot',
        esRich ? 'chatbot-bubble--rich' : '',
        'chatbot-bubble--enter',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {mensaje.text ? <p className="chatbot-bubble__text">{mensaje.text}</p> : null}
      {mensaje.component}
    </div>
  )
}

/**
 * Asistente virtual con Rich Cards — Guachinche El Realejo.
 * @param {{ setPaginaActual?: (pagina: string) => void }} props
 */
export default function Chatbot({ setPaginaActual }) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      sender: 'bot',
      text: MENSAJE_BIENVENIDA,
      component: null,
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)

  const finRef = useRef(null)

  const scrollAbajo = useCallback(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollAbajo()
  }, [mensajes, escribiendo, scrollAbajo])

  const irReservas = useCallback(() => {
    setPaginaActual?.('reservas')
    setAbierto(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPaginaActual])

  const enviarMensaje = useCallback(
    (textoRaw) => {
      const texto = textoRaw.trim()
      if (!texto || escribiendo) return

      setMensajes((prev) => [
        ...prev,
        { id: crearId(), sender: 'user', text: texto, component: null },
      ])
      setEntrada('')
      setEscribiendo(true)

      window.setTimeout(() => {
        const { text, component } = resolverRespuesta(texto, { irReservas })
        setMensajes((prev) => [
          ...prev,
          { id: crearId(), sender: 'bot', text, component },
        ])
        setEscribiendo(false)
      }, RETRASO_RESPUESTA_MS)
    },
    [escribiendo, irReservas],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    enviarMensaje(entrada)
  }

  return (
    <div className="chatbot-root" aria-live="polite">
      <button
        type="button"
        className={abierto ? 'chatbot-fab chatbot-fab--hidden' : 'chatbot-fab'}
        aria-label="Abrir asistente virtual"
        aria-expanded={abierto}
        aria-controls="chatbot-panel"
        onClick={() => setAbierto(true)}
      >
        <IconoChat />
      </button>

      <div
        id="chatbot-panel"
        className={abierto ? 'chatbot-panel chatbot-panel--open' : 'chatbot-panel'}
        role="dialog"
        aria-label="Asistente El Realejo"
        aria-hidden={!abierto}
      >
        <header className="chatbot-panel__header">
          <div>
            <h2 className="chatbot-panel__title">Asistente El Realejo</h2>
            <p className="chatbot-panel__subtitle">Guachinche · Tenerife</p>
          </div>
          <button
            type="button"
            className="chatbot-panel__minimize"
            aria-label="Minimizar chat"
            onClick={() => setAbierto(false)}
          >
            −
          </button>
        </header>

        <div className="chatbot-panel__body">
          {mensajes.map((msg) => (
            <BurbujaMensaje key={msg.id} mensaje={msg} />
          ))}

          {escribiendo && (
            <div
              className="chatbot-typing chatbot-typing--enter"
              aria-label="El asistente está escribiendo"
            >
              <span>Escribiendo</span>
              <span className="chatbot-typing__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={finRef} />
        </div>

        <form className="chatbot-panel__footer" onSubmit={onSubmit}>
          <input
            type="text"
            className="chatbot-input"
            placeholder="Escribe tu consulta..."
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            disabled={escribiendo}
            autoComplete="off"
            aria-label="Mensaje para el asistente"
          />
          <button
            type="submit"
            className="chatbot-send"
            disabled={!entrada.trim() || escribiendo}
            aria-label="Enviar mensaje"
          >
            <IconoEnviar />
          </button>
        </form>
      </div>
    </div>
  )
}
