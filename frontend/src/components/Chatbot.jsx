import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { CONFIG_RESTAURANTE, formatearPrecio, menuData } from '../data/db'
import { MAPS_URL, UBICACION_RESTAURANTE } from '../config/ubicacion'
import i18n from '../i18n'
import { traducirCarta } from '../i18n/menu'
import {
  describirEstadoDisponibilidad,
  esDiaCerrado,
  etiquetaTurno,
  formatearFechaLegible,
  formatearHora,
  interpretarConsultaDisponibilidad,
  obtenerDisponibilidadRemota,
} from '../utils/disponibilidadConsulta'
import {
  ejecutarReservaDesdeChat,
  esSolicitudCrearReserva,
  interpretarSolicitudReserva,
} from '../utils/reservaTareaChatbot'
import { guardarPrefillReserva } from '../utils/reservasStorage'
import './Chatbot.css'

const COLOR_VINO = '#9B111E'
const RETRASO_RESPUESTA_MS = 600

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
  const { t } = useTranslation()
  if (!platos.length) return null

  return (
    <div className="chatbot-carousel" role="list" aria-label={t('chatbot.dishesRecommended')}>
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

function BotonIrReservas({ onClick, consulta = null }) {
  const { t } = useTranslation()
  return (
    <button type="button" className="chatbot-rich-btn" onClick={() => onClick(consulta)}>
      {t('chatbot.goReservations')}
    </button>
  )
}

function BotonAbrirMaps() {
  const { t } = useTranslation()
  return (
    <a
      className="chatbot-rich-btn"
      href={MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('chatbot.openMaps')}
    </a>
  )
}

function TarjetaConfirmacionReserva({ localizador, nombre, fecha, turno }) {
  const { t } = useTranslation()
  return (
    <div className="chatbot-booking-confirm">
      <p className="chatbot-booking-confirm__badge">{t('chatbot.bookingConfirmed')}</p>
      <p className="chatbot-booking-confirm__locator">{localizador}</p>
      <dl className="chatbot-booking-confirm__meta">
        <div>
          <dt>{t('common.holder')}</dt>
          <dd>{nombre}</dd>
        </div>
        <div>
          <dt>{t('common.date')}</dt>
          <dd>{formatearFechaLegible(fecha)}</dd>
        </div>
        <div>
          <dt>{t('common.shift')}</dt>
          <dd>{turno}</dd>
        </div>
      </dl>
    </div>
  )
}

function TarjetaDisponibilidad({ consulta, resultado, onReservar }) {
  const { t } = useTranslation()
  const resumen = describirEstadoDisponibilidad(resultado.estado, resultado.mesasLibres)
  const fechaTexto = formatearFechaLegible(consulta.fecha)
  const turnoTexto = etiquetaTurno(consulta.turno)
  const horaTexto = consulta.hora
    ? t('common.atTime', { time: formatearHora(consulta.hora.horas, consulta.hora.minutos) })
    : ''

  return (
    <div className={`chatbot-availability chatbot-availability--${resumen.tono}`}>
      <p className="chatbot-availability__titulo">{resumen.titulo}</p>
      <p className="chatbot-availability__detalle">{resumen.detalle}</p>
      <dl className="chatbot-availability__meta">
        <div>
          <dt>{t('common.date')}</dt>
          <dd>{fechaTexto}</dd>
        </div>
        <div>
          <dt>{t('common.shift')}</dt>
          <dd>
            {turnoTexto}
            {horaTexto}
          </dd>
        </div>
        <div>
          <dt>{t('common.free')}</dt>
          <dd>{resultado.mesasLibres}</dd>
        </div>
      </dl>
      {resultado.estado !== 'completo' && (
        <button type="button" className="chatbot-rich-btn" onClick={() => onReservar(consulta)}>
          {t('chatbot.bookNow')}
        </button>
      )}
    </div>
  )
}

function TablaHorarios() {
  const { t } = useTranslation()
  const abiertoGlobal = comprobarApertura()
  const almuerzoActivo = turnoActivo('almuerzo')
  const cenaActivo = turnoActivo('cena')

  const filas = [
    {
      id: 'almuerzo',
      emoji: '🍽️',
      nombre: t('common.lunch'),
      horario: t('common.lunchHours'),
      activo: almuerzoActivo,
    },
    {
      id: 'cena',
      emoji: '🌙',
      nombre: t('common.dinner'),
      horario: t('common.dinnerHours'),
      activo: cenaActivo,
    },
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
        <span>{abiertoGlobal ? t('chatbot.scheduleOpen') : t('chatbot.scheduleClosed')}</span>
      </div>

      <table className="chatbot-schedule__table">
        <thead>
          <tr>
            <th scope="col">{t('chatbot.scheduleTitle')}</th>
            <th scope="col">{t('chatbot.scheduleHours')}</th>
            <th scope="col">{t('chatbot.scheduleStatus')}</th>
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
                  {fila.activo ? t('common.inService') : t('common.offHours')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="chatbot-schedule__note">{t('common.closedMonTue')}</p>
    </div>
  )
}

/* ── Motor de respuestas enriquecidas ──────────────────────────────────────── */

async function resolverSolicitudReserva(textoUsuario, { irReservas }) {
  const solicitud = interpretarSolicitudReserva(textoUsuario)
  if (!solicitud) return null

  if (solicitud.error === 'cerrado') {
    return {
      text: i18n.t('chatbot.closedDay', { date: formatearFechaLegible(solicitud.fecha) }),
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }

  if (!solicitud.completo) {
    const faltantes = solicitud.faltan.join(', ')
    return {
      text: i18n.t('chatbot.needFields', { fields: faltantes }),
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }

  try {
    const disponibilidad = await obtenerDisponibilidadRemota(solicitud.fecha, solicitud.turno)

    if (disponibilidad.estado === 'completo') {
      return {
        text: i18n.t('chatbot.shiftFull', {
          shift: etiquetaTurno(solicitud.turno),
          date: formatearFechaLegible(solicitud.fecha),
        }),
        component: (
          <BotonIrReservas
            onClick={irReservas}
            consulta={{ fecha: solicitud.fecha, turno: solicitud.turno }}
          />
        ),
      }
    }

    const resultado = await ejecutarReservaDesdeChat(solicitud)
    const turnoTexto =
      solicitud.turno === 'almuerzo' ? i18n.t('common.lunch') : i18n.t('common.dinner')
    const horaTexto = solicitud.hora
      ? i18n.t('common.atTime', {
          time: formatearHora(solicitud.hora.horas, solicitud.hora.minutos),
        })
      : ''

    return {
      text: i18n.t('chatbot.bookingOk', {
        name: solicitud.nombre,
        date: formatearFechaLegible(solicitud.fecha),
        shift: turnoTexto,
        time: horaTexto,
        email: solicitud.email,
      }),
      component: (
        <TarjetaConfirmacionReserva
          localizador={resultado.localizador}
          nombre={solicitud.nombre}
          fecha={solicitud.fecha}
          turno={turnoTexto}
        />
      ),
    }
  } catch (error) {
    return {
      text:
        error.name === 'AbortError'
          ? i18n.t('chatbot.bookingTimeout')
          : error.message || i18n.t('chatbot.bookingError'),
      component: (
        <BotonIrReservas
          onClick={irReservas}
          consulta={{ fecha: solicitud.fecha, turno: solicitud.turno }}
        />
      ),
    }
  }
}

async function resolverConsultaDisponibilidad(textoUsuario, { irReservas }) {
  const consulta = interpretarConsultaDisponibilidad(textoUsuario)
  if (!consulta) return null

  if (esDiaCerrado(consulta.fecha)) {
    return {
      text: i18n.t('chatbot.availClosed', { date: formatearFechaLegible(consulta.fecha) }),
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }

  const turnosAConsultar = consulta.turno ? [consulta.turno] : ['almuerzo', 'cena']

  try {
    const resultados = await Promise.all(
      turnosAConsultar.map(async (turno) => ({
        turno,
        datos: await obtenerDisponibilidadRemota(consulta.fecha, turno),
      })),
    )

    if (resultados.length === 1) {
      const { turno, datos } = resultados[0]
      const consultaConTurno = { ...consulta, turno }
      const fechaTexto = formatearFechaLegible(consulta.fecha)
      const horaTexto = consulta.hora
        ? i18n.t('common.atTime', {
            time: formatearHora(consulta.hora.horas, consulta.hora.minutos),
          })
        : ''
      const aviso = consulta.avisoHorario ? ` ${consulta.avisoHorario}` : ''
      const resumen = describirEstadoDisponibilidad(datos.estado, datos.mesasLibres)

      return {
        text: i18n.t('chatbot.availSingle', {
          shift: etiquetaTurno(turno),
          date: fechaTexto,
          time: horaTexto,
          detail: resumen.detalle.toLowerCase(),
          warning: aviso,
        }),
        component: (
          <TarjetaDisponibilidad
            consulta={consultaConTurno}
            resultado={datos}
            onReservar={irReservas}
          />
        ),
      }
    }

    const lineas = resultados.map(({ turno, datos }) => {
      const resumen = describirEstadoDisponibilidad(datos.estado, datos.mesasLibres)
      return `• ${etiquetaTurno(turno)}: ${resumen.detalle}`
    })

    const turnoRecomendado =
      resultados.find(({ datos }) => datos.estado !== 'completo')?.turno ?? null

    return {
      text: `${i18n.t('chatbot.availMulti', { date: formatearFechaLegible(consulta.fecha) })}\n${lineas.join('\n')}`,
      component: turnoRecomendado ? (
        <TarjetaDisponibilidad
          consulta={{ ...consulta, turno: turnoRecomendado }}
          resultado={resultados.find((item) => item.turno === turnoRecomendado).datos}
          onReservar={irReservas}
        />
      ) : (
        <BotonIrReservas onClick={irReservas} />
      ),
    }
  } catch (error) {
    return {
      text:
        error.message === 'Failed to fetch'
          ? i18n.t('chatbot.availFetchError')
          : error.message || i18n.t('chatbot.availError'),
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }
}

function resolverRespuesta(textoUsuario, { irReservas }) {
  const texto = normalizarTexto(textoUsuario)
  const incluye = (...palabras) => palabras.some((p) => texto.includes(p))

  if (
    incluye(
      'ubicacion',
      'ubicación',
      'direccion',
      'dirección',
      'donde',
      'mapa',
      'llegar',
      'como llegar',
      'location',
      'address',
      'where',
      'adresse',
      'standort',
      'adresse',
    )
  ) {
    return {
      text: i18n.t('chatbot.location', {
        street: UBICACION_RESTAURANTE.calle,
        city: UBICACION_RESTAURANTE.localidad,
      }),
      component: <BotonAbrirMaps />,
    }
  }

  if (
    incluye('horario', 'abierto', 'cierra', 'abre', 'hours', 'open', 'close', 'horaires', 'offnungszeiten', 'geoffnet') &&
    !incluye('disponibilidad', 'disponible', 'mesa', 'availability', 'table', 'disponibilite', 'verfugbar')
  ) {
    return {
      text: i18n.t('chatbot.hoursIntro'),
      component: <TablaHorarios />,
    }
  }

  if (
    incluye(
      'reserva',
      'reservar',
      'mesa',
      'apartar',
      'turno',
      'booking',
      'book',
      'reserve',
      'reserver',
      'reservierung',
      'tisch',
    ) &&
    !esSolicitudCrearReserva(textoUsuario)
  ) {
    return {
      text: i18n.t('chatbot.reservationsIntro', { max: CONFIG_RESTAURANTE.TOTAL_MESAS_MAX }),
      component: <BotonIrReservas onClick={irReservas} />,
    }
  }

  const cartaTraducida = traducirCarta(menuData)
  const platosCarnes = cartaTraducida.filter((p) => p.categoria === 'carnes')
  const platosEstrella = [...cartaTraducida].sort((a, b) => b.precio - a.precio).slice(0, 3)

  if (incluye('carne', 'costillas', 'fiesta', 'cerdo', 'carnes', 'meat', 'pork', 'viande')) {
    return {
      text: i18n.t('chatbot.meatsIntro'),
      component: <CarruselPlatos platos={platosCarnes} />,
    }
  }

  if (
    incluye(
      'carta',
      'menu',
      'comer',
      'platos',
      'plato',
      'entrante',
      'precio',
      'comida',
      'food',
      'dish',
      'carte',
      'speisekarte',
      'gericht',
    )
  ) {
    return {
      text: i18n.t('chatbot.menuIntro'),
      component: <CarruselPlatos platos={platosEstrella} />,
    }
  }

  if (incluye('postre', 'dulce', 'polvito', 'dessert', 'sweet', 'dessert', 'nachtisch')) {
    const postres = cartaTraducida.filter((p) => p.categoria === 'postres')
    return {
      text: i18n.t('chatbot.dessertIntro'),
      component: <CarruselPlatos platos={postres.length ? postres : cartaTraducida.slice(-1)} />,
    }
  }

  return {
    text: i18n.t('chatbot.fallback'),
    component: null,
  }
}

export function IconoChat() {
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
 * Panel del asistente virtual (el botón de apertura está en el Navbar).
 * @param {{ setPaginaActual?: (pagina: string) => void, abierto: boolean, setAbierto: (v: boolean) => void }} props
 */
export default function Chatbot({ setPaginaActual, abierto, setAbierto }) {
  const { t, i18n: i18nInstance } = useTranslation()
  const [mensajes, setMensajes] = useState(() => [
    {
      id: 'bienvenida',
      sender: 'bot',
      text: i18n.t('chatbot.welcome'),
      component: null,
    },
  ])
  const [entrada, setEntrada] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)

  useEffect(() => {
    setMensajes((prev) => {
      if (prev.length === 1 && prev[0].id === 'bienvenida') {
        return [{ ...prev[0], text: t('chatbot.welcome') }]
      }
      return prev
    })
  }, [i18nInstance.language, t])

  const finRef = useRef(null)

  const scrollAbajo = useCallback(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollAbajo()
  }, [mensajes, escribiendo, scrollAbajo])

  useEffect(() => {
    if (!abierto) return undefined

    const onEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [abierto, setAbierto])

  const irReservas = useCallback((consulta = null) => {
    if (consulta?.fecha) {
      const prefill = {
        fecha: consulta.fecha,
        turno: consulta.turno ?? 'cena',
      }
      guardarPrefillReserva(prefill)
      window.dispatchEvent(new CustomEvent('reserva-prefill', { detail: prefill }))
    }
    setPaginaActual?.('reservas')
    setAbierto(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPaginaActual, setAbierto])

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

      window.setTimeout(async () => {
        const reserva =
          (await resolverSolicitudReserva(texto, { irReservas })) ??
          (await resolverConsultaDisponibilidad(texto, { irReservas }))
        const { text, component } = reserva ?? resolverRespuesta(texto, { irReservas })

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

  if (!abierto) return null

  const widget = (
    <div className="chatbot-root" aria-live="polite">
      <div
        id="chatbot-panel"
        className="chatbot-panel chatbot-panel--open"
        role="dialog"
        aria-label={t('chatbot.title')}
        aria-modal="true"
      >
        <header className="chatbot-panel__header">
          <div>
            <h2 className="chatbot-panel__title">{t('chatbot.title')}</h2>
            <p className="chatbot-panel__subtitle">{t('chatbot.subtitle')}</p>
          </div>
          <button
            type="button"
            className="chatbot-panel__minimize"
            aria-label={t('chatbot.minimize')}
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
              aria-label={t('chatbot.typing')}
            >
              <span>{t('chatbot.typingShort')}</span>
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
            placeholder={t('chatbot.inputPh')}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            disabled={escribiendo}
            autoComplete="off"
            aria-label={t('chatbot.inputLabel')}
          />
          <button
            type="submit"
            className="chatbot-send"
            disabled={!entrada.trim() || escribiendo}
            aria-label={t('chatbot.send')}
          >
            <IconoEnviar />
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(widget, document.body)
}
