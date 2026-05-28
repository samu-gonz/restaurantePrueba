import { useCallback, useEffect, useState } from 'react'
import { CONFIG_RESTAURANTE } from '../data/db'

/* ── Constantes de negocio ─────────────────────────────────────────────────── */

const MESAS_MAX = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX
const API_BASE_URL = 'http://localhost:5000'
const POLLING_AFORO_MS = 12_000

const MSG_CIERRE =
  '🍷 Cerramos los lunes y martes por mantenimiento de viñedos y descanso del personal. Elige otro día.'

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
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('almuerzo')
  const [errorMsg, setErrorMsg] = useState('')
  const [mesasLibres, setMesasLibres] = useState(null)
  const [statusAforo, setStatusAforo] = useState(null)
  const [exito, setExito] = useState(null)
  const [enviando, setEnviando] = useState(false)

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
        setErrorMsg(MSG_CIERRE)
        setStatusAforo(null)
        return false
      }
      return true
    },
    [],
  )

  const handleCheckAforo = useCallback(
    async (fechaSel, turnoSel) => {
      try {
        const params = new URLSearchParams({ fecha: fechaSel, turno: turnoSel })
        const response = await fetch(`${API_BASE_URL}/api/disponibilidad?${params.toString()}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo consultar el aforo en tiempo real.')
        }

        setStatusAforo(data)
        setMesasLibres(data.mesasLibres)
      } catch (error) {
        setStatusAforo(null)
        setMesasLibres(null)
        setErrorMsg(
          error.message || 'No pudimos consultar disponibilidad en este momento. Revisa tu conexión.',
        )
      }
    },
    [],
  )

  useEffect(() => {
    if (!fecha || !turno) {
      setStatusAforo(null)
      setMesasLibres(null)
      return
    }

    if (!validarDisponibilidad(fecha)) return

    handleCheckAforo(fecha, turno)
    const pollId = window.setInterval(() => {
      handleCheckAforo(fecha, turno)
    }, POLLING_AFORO_MS)

    return () => window.clearInterval(pollId)
  }, [fecha, turno, validarDisponibilidad, handleCheckAforo])

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
    const response = await fetch(`${API_BASE_URL}/api/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: nombre.trim(),
        fecha,
        turno,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data?.error || 'No pudimos completar la reserva. Inténtalo de nuevo.')
    }

    return data
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !fecha) return

    if (!validarDisponibilidad(fecha)) return

    setErrorMsg('')
    setEnviando(true)

    try {
      const data = await ejecutarReserva()
      const turnoTexto =
        turno === 'almuerzo' ? 'Almuerzo (12:00 – 16:00)' : 'Cena (19:30 – 23:00)'

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
        localizador: data?.localizador ?? '—',
        fecha: data?.reserva?.fecha ?? fecha,
        turno: turnoTexto,
        mesasRestantes: restantes,
      })
    } catch (error) {
      setErrorMsg(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const nuevaReserva = () => {
    setExito(null)
    setNombre('')
    setFecha('')
    setTurno('almuerzo')
    setErrorMsg('')
    setMesasLibres(null)
    setStatusAforo(null)
  }

  const aforoCompleto = statusAforo?.estado === 'completo'
  const formularioBloqueado = Boolean(errorMsg) || aforoCompleto

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <h2 className="reservas-card__title">Reserva tu Mesa</h2>
        <p className="reservas-card__subtitle">
          Máximo {MESAS_MAX} mesas por turno. Gestión en tiempo real con el servidor.
        </p>

        {exito ? (
          <div className="reservas-exito">
            <h3 className="reservas-exito__titulo">¡Reserva Confirmada!</h3>
            <p className="reservas-exito__texto">
              Gracias, <strong>{exito.nombre}</strong>. Tu mesa queda registrada para el
              turno de {exito.turno}.
            </p>
            <div className="reservas-exito__locator">LOCALIZADOR: {exito.localizador}</div>
            {typeof exito.mesasRestantes === 'number' && (
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                Mesas libres restantes en ese turno: {exito.mesasRestantes}
              </p>
            )}
            <div className="reservas-exito__actions">
              <button type="button" className="btn-premium btn--block" onClick={nuevaReserva}>
                Nueva reserva
              </button>
              <button
                type="button"
                className="btn-premium btn-premium--outline btn--block"
                onClick={() => setPaginaActual?.('home')}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        ) : (
          <form className="reservas-form" onSubmit={handleSubmit} noValidate>
            <div className="reservas-field">
              <label htmlFor="nombre-titular">Nombre del cliente</label>
              <input
                id="nombre-titular"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                disabled={enviando}
              />
            </div>

            <div className="reservas-row">
              <div className="reservas-field">
                <label htmlFor="fecha-visita">Fecha</label>
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
                <label htmlFor="turno-visita">Turno</label>
                <select id="turno-visita" value={turno} onChange={onTurnoChange} disabled={enviando}>
                  <option value="almuerzo">Almuerzo (12:00 – 16:00)</option>
                  <option value="cena">Cena (19:30 – 23:00)</option>
                </select>
              </div>
            </div>

            {statusAforo && (
              <div
                className={`reservas-aforo-widget reservas-aforo-widget--${statusAforo.estado}`}
                role="status"
              >
                {statusAforo.estado === 'disponible' && (
                  <p className="reservas-aforo-widget__texto">
                    🟢 Excelente elección. Disponibilidad alta ({statusAforo.mesasLibres} mesas
                    libres)
                  </p>
                )}

                {statusAforo.estado === 'ultimas_plazas' && (
                  <p className="reservas-aforo-widget__texto reservas-aforo-widget__texto--blink">
                    🟠 ¡Date prisa! Quedan muy pocas mesas para este turno (
                    {statusAforo.mesasLibres} mesas libres)
                  </p>
                )}

                {statusAforo.estado === 'completo' && (
                  <p className="reservas-aforo-widget__texto">
                    ⚫ Aforo completo de 30 mesas. Por favor, selecciona otra fecha o turno.
                  </p>
                )}
              </div>
            )}

            {fecha && !errorMsg && typeof mesasLibres === 'number' && (
              <div className="reservas-aforo-panel" role="status">
                Mesas disponibles: <strong>{mesasLibres}</strong> de {MESAS_MAX}
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
              disabled={formularioBloqueado || !fecha || !nombre.trim() || enviando}
            >
              {enviando ? 'Confirmando reserva...' : 'Confirmar reserva'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
