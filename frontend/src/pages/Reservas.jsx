import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL, backendConfigurado } from '../config/api'
import { CONFIG_RESTAURANTE } from '../data/db'
import {
  agregarReservaAlCacheLocal,
  consumirPrefillReserva,
  consultarDisponibilidadLocal,
  crearReservaLocal,
} from '../utils/reservasStorage'

/* ── Constantes de negocio ─────────────────────────────────────────────────── */

const MESAS_MAX = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX
const POLLING_AFORO_MS = 12_000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

/* ── Utilidades ───────────────────────────────────────────────────────────── */

/** Fecha local sin desfase UTC al calcular getDay() */
function parsearFechaLocal(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function esDiaCerrado(fechaISO) {
  const dia = parsearFechaLocal(fechaISO).getDay()
  return dia === 1 || dia === 2
}

function fechaMinimaHoy() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

/** Reservas conectadas al backend Express */
export default function Reservas({ setPaginaActual }) {
  const { t } = useTranslation()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('almuerzo')
  const [errorMsg, setErrorMsg] = useState('')
  const [mesasLibres, setMesasLibres] = useState(null)
  const [statusAforo, setStatusAforo] = useState(null)
  const [exito, setExito] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [disponibilidadTurnos, setDisponibilidadTurnos] = useState({
    almuerzo: null,
    cena: null,
  })

  useEffect(() => {
    const aplicarPrefill = ({ fecha: fechaPrefill, turno: turnoPrefill }) => {
      if (!fechaPrefill) return
      setFecha(fechaPrefill)
      setTurno(turnoPrefill === 'almuerzo' ? 'almuerzo' : 'cena')
      setExito(null)
      setErrorMsg('')
    }

    const prefillGuardado = consumirPrefillReserva()
    if (prefillGuardado) aplicarPrefill(prefillGuardado)

    const onPrefillDesdeChat = (evento) => {
      aplicarPrefill(evento.detail ?? {})
    }

    window.addEventListener('reserva-prefill', onPrefillDesdeChat)
    return () => window.removeEventListener('reserva-prefill', onPrefillDesdeChat)
  }, [])

  /** Validación rápida en frontend (el backend vuelve a validar siempre) */
  const validarDisponibilidad = useCallback(
    (fechaSel) => {
      setErrorMsg('')
      if (!fechaSel) {
        setMesasLibres(null)
        setStatusAforo(null)
        return false
      }

      if (esDiaCerrado(fechaSel)) {
        setErrorMsg(t('reservas.closedDay'))
        setStatusAforo(null)
        return false
      }
      return true
    },
    [t],
  )

  const handleCheckAforo = useCallback(
    async (fechaSel, turnoSel) => {
      try {
        let data
        if (!backendConfigurado()) {
          data = consultarDisponibilidadLocal(fechaSel, turnoSel)
        } else {
          const params = new URLSearchParams({ fecha: fechaSel, turno: turnoSel })
          const response = await fetch(`${API_BASE_URL}/api/disponibilidad?${params.toString()}`)
          data = await response.json().catch(() => ({}))
          if (!response.ok) {
            throw new Error(data?.error || t('reservas.noAforo'))
          }
        }

        setStatusAforo(data)
        setMesasLibres(data.mesasLibres)
      } catch (error) {
        setStatusAforo(null)
        setMesasLibres(null)
        setErrorMsg(
          error.message === 'Failed to fetch'
            ? t('reservas.noServer')
            : error.message || t('reservas.noAvailability'),
        )
      }
    },
    [t],
  )

  const actualizarTurnosDisponibles = useCallback(async (fechaSel) => {
    if (!fechaSel) {
      setDisponibilidadTurnos({ almuerzo: null, cena: null })
      return
    }

    try {
      if (!backendConfigurado()) {
        setDisponibilidadTurnos({
          almuerzo: consultarDisponibilidadLocal(fechaSel, 'almuerzo'),
          cena: consultarDisponibilidadLocal(fechaSel, 'cena'),
        })
        return
      }

      const [resAlmuerzo, resCena] = await Promise.all([
        fetch(`${API_BASE_URL}/api/disponibilidad?${new URLSearchParams({ fecha: fechaSel, turno: 'almuerzo' }).toString()}`),
        fetch(`${API_BASE_URL}/api/disponibilidad?${new URLSearchParams({ fecha: fechaSel, turno: 'cena' }).toString()}`),
      ])

      const [dataAlmuerzo, dataCena] = await Promise.all([
        resAlmuerzo.json().catch(() => ({})),
        resCena.json().catch(() => ({})),
      ])

      setDisponibilidadTurnos({
        almuerzo: resAlmuerzo.ok ? dataAlmuerzo : null,
        cena: resCena.ok ? dataCena : null,
      })
    } catch {
      setDisponibilidadTurnos({
        almuerzo: consultarDisponibilidadLocal(fechaSel, 'almuerzo'),
        cena: consultarDisponibilidadLocal(fechaSel, 'cena'),
      })
    }
  }, [])

  useEffect(() => {
    if (!fecha || !turno) {
      setStatusAforo(null)
      setMesasLibres(null)
      return
    }

    if (!validarDisponibilidad(fecha)) return

    handleCheckAforo(fecha, turno)
    actualizarTurnosDisponibles(fecha)
    const pollId = window.setInterval(() => {
      handleCheckAforo(fecha, turno)
      actualizarTurnosDisponibles(fecha)
    }, POLLING_AFORO_MS)

    return () => window.clearInterval(pollId)
  }, [fecha, turno, validarDisponibilidad, handleCheckAforo, actualizarTurnosDisponibles])

  useEffect(() => {
    const almuerzoCompleto = disponibilidadTurnos.almuerzo?.estado === 'completo'
    const cenaCompleto = disponibilidadTurnos.cena?.estado === 'completo'

    if (turno === 'almuerzo' && almuerzoCompleto && !cenaCompleto) {
      setTurno('cena')
    } else if (turno === 'cena' && cenaCompleto && !almuerzoCompleto) {
      setTurno('almuerzo')
    }
  }, [turno, disponibilidadTurnos])

  const onFechaChange = (e) => {
    setFecha(e.target.value)
    setExito(null)
    setMesasLibres(null)
    setStatusAforo(null)
    validarDisponibilidad(e.target.value)
  }

  const onTurnoChange = (e) => {
    setTurno(e.target.value)
    setExito(null)
    setMesasLibres(null)
    setStatusAforo(null)
  }

  const ejecutarReserva = async () => {
    if (!backendConfigurado()) {
      return crearReservaLocal({
        nombre: nombre.trim(),
        email: email.trim(),
        fecha,
        turno,
      })
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          fecha,
          turno,
        }),
        signal: controller.signal,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'No pudimos completar la reserva. Inténtalo de nuevo.')
      }

      return data
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !email.trim() || !fecha) return

    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg(t('reservas.invalidEmail'))
      return
    }

    if (!validarDisponibilidad(fecha)) return

    setErrorMsg('')
    setEnviando(true)

    try {
      const data = await ejecutarReserva()

      if (backendConfigurado() && data?.localizador) {
        agregarReservaAlCacheLocal({
          ...data.reserva,
          localizador: data.localizador,
        })
      }

      const turnoTexto =
        turno === 'almuerzo' ? t('common.lunchFull') : t('common.dinnerFull')

      const maximo = data?.aforo?.maximo ?? MESAS_MAX
      const ocupadas = data?.aforo?.ocupadas ?? null
      const restantes = typeof ocupadas === 'number' ? maximo - ocupadas : null

      setMesasLibres(restantes)
      setStatusAforo({
        mesasOcupadas: ocupadas,
        mesasLibres: restantes,
        estado:
          restantes <= 0 ? 'completo' : restantes < 5 ? 'ultimas_plazas' : 'disponible',
      })
      setExito({
        nombre: data?.reserva?.nombre ?? nombre.trim(),
        email: data?.reserva?.email ?? email.trim(),
        localizador: data?.localizador ?? '—',
        fecha: data?.reserva?.fecha ?? fecha,
        turno: turnoTexto,
        mesasRestantes: restantes,
      })
    } catch (error) {
      const mensaje =
        error.name === 'AbortError'
          ? t('reservas.timeout')
          : error.message === 'Failed to fetch'
            ? t('reservas.connectionFailed')
            : error.message
      setErrorMsg(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  const nuevaReserva = () => {
    setExito(null)
    setNombre('')
    setEmail('')
    setFecha('')
    setTurno('almuerzo')
    setErrorMsg('')
    setMesasLibres(null)
    setStatusAforo(null)
    setDisponibilidadTurnos({ almuerzo: null, cena: null })
  }

  const aforoCompleto = statusAforo?.estado === 'completo'
  const almuerzoCompleto = disponibilidadTurnos.almuerzo?.estado === 'completo'
  const cenaCompleto = disponibilidadTurnos.cena?.estado === 'completo'
  const ambosTurnosCompletos = almuerzoCompleto && cenaCompleto
  const formularioBloqueado = Boolean(errorMsg) || aforoCompleto

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <h2 className="reservas-card__title">{t('reservas.title')}</h2>
        <p className="reservas-card__subtitle">
          {t('reservas.subtitle', { max: MESAS_MAX })}
        </p>

        {exito ? (
          <div className="reservas-exito">
            <h3 className="reservas-exito__titulo">{t('reservas.confirmed')}</h3>
            <p
              className="reservas-exito__texto"
              dangerouslySetInnerHTML={{
                __html: t('reservas.thanks', { name: exito.nombre, shift: exito.turno }),
              }}
            />
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              {backendConfigurado() ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('reservas.emailSent', { email: exito.email }),
                  }}
                />
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('reservas.emailLocal', { email: exito.email }),
                  }}
                />
              )}
            </p>
            <div className="reservas-exito__locator">
              {t('reservas.locatorLabel', { code: exito.localizador })}
            </div>
            {typeof exito.mesasRestantes === 'number' && (
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                {t('reservas.tablesLeft', { count: exito.mesasRestantes })}
              </p>
            )}
            <div className="reservas-exito__actions">
              <button type="button" className="btn-premium btn--block" onClick={nuevaReserva}>
                {t('reservas.newReservation')}
              </button>
              <button
                type="button"
                className="btn-premium btn-premium--outline btn--block"
                onClick={() => setPaginaActual?.('home')}
              >
                {t('reservas.backHome')}
              </button>
            </div>
          </div>
        ) : (
          <form className="reservas-form" onSubmit={handleSubmit} noValidate>
            <div className="reservas-field">
              <label htmlFor="nombre-titular">{t('reservas.clientName')}</label>
              <input
                id="nombre-titular"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={t('reservas.clientNamePh')}
                disabled={enviando}
              />
            </div>

            <div className="reservas-field">
              <label htmlFor="email-titular">{t('reservas.email')}</label>
              <input
                id="email-titular"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('reservas.emailPh')}
                disabled={enviando}
              />
            </div>

            <div className="reservas-row">
              <div className="reservas-field">
                <label htmlFor="fecha-visita">{t('reservas.visitDate')}</label>
                <input
                  id="fecha-visita"
                  type="date"
                  required
                  min={fechaMinimaHoy()}
                  value={fecha}
                  onChange={onFechaChange}
                  disabled={enviando}
                />
              </div>
              <div className="reservas-field">
                <label htmlFor="turno-visita">{t('reservas.visitShift')}</label>
                <select id="turno-visita" value={turno} onChange={onTurnoChange} disabled={enviando}>
                  <option value="almuerzo" disabled={almuerzoCompleto}>
                    {t('common.lunchFull')}
                    {almuerzoCompleto ? t('common.shiftFull') : ''}
                  </option>
                  <option value="cena" disabled={cenaCompleto}>
                    {t('common.dinnerFull')}
                    {cenaCompleto ? t('common.shiftFull') : ''}
                  </option>
                </select>
              </div>
            </div>

            {fecha && ambosTurnosCompletos && !errorMsg && (
              <div className="reservas-alert" role="alert">
                {t('reservas.bothFull')}
              </div>
            )}

            {statusAforo && (
              <div
                className={`reservas-aforo-widget reservas-aforo-widget--${statusAforo.estado}`}
                role="status"
              >
                {statusAforo.estado === 'disponible' && (
                  <p className="reservas-aforo-widget__texto">
                    {t('reservas.statusHigh', { count: statusAforo.mesasLibres })}
                  </p>
                )}

                {statusAforo.estado === 'ultimas_plazas' && (
                  <p className="reservas-aforo-widget__texto reservas-aforo-widget__texto--blink">
                    {t('reservas.statusLow', { count: statusAforo.mesasLibres })}
                  </p>
                )}

                {statusAforo.estado === 'completo' && (
                  <p className="reservas-aforo-widget__texto">{t('reservas.statusFull')}</p>
                )}
              </div>
            )}

            {fecha && !errorMsg && typeof mesasLibres === 'number' && (
              <div className="reservas-aforo-panel" role="status">
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('reservas.tablesAvailable', { free: mesasLibres, max: MESAS_MAX }),
                  }}
                />
              </div>
            )}

            {errorMsg && (
              <div className="reservas-alert" role="alert">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn-premium btn--block"
              disabled={
                formularioBloqueado ||
                ambosTurnosCompletos ||
                !fecha ||
                !nombre.trim() ||
                !email.trim() ||
                enviando
              }
            >
              {enviando ? t('reservas.confirming') : t('reservas.confirm')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
