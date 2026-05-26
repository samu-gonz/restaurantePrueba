import { useCallback, useEffect, useState } from 'react'
import {
  CONFIG_RESTAURANTE,
  cargarAforoDesdeStorage,
  contarMesasOcupadas,
  generarLocalizador,
  hayDisponibilidadEnStorage,
  mesasLibresEnTurno,
  registrarMesaEnStorage,
} from '../data/db'

const MSG_DIA_CERRADO =
  '🍷 ¡Los lunes y martes cerramos para atender las viñas y descansar el personal! Por favor, selecciona otro día.'

const MSG_AFORO_COMPLETO =
  '🔴 Lo sentimos, no quedan mesas libres para este turno. El aforo máximo de 30 mesas está completo.'

function parsearFechaLocal(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fechaMinimaHoy() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}

function formatearFechaLegible(fechaStr) {
  return parsearFechaLocal(fechaStr).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Reservas con persistencia en localStorage.
 *
 * 1. Al montar → cargarAforoDesdeStorage() (o semilla de db.js)
 * 2. Al cambiar fecha/turno → consultar estado vivo en memoria (sincronizado con storage)
 * 3. Al confirmar → validar, +1 mesa, localStorage.setItem, éxito inmutable
 */
export default function Reservas({ setPaginaActual }) {
  const [aforoDB, setAforoDB] = useState(null)
  const [storageListo, setStorageListo] = useState(false)

  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('almuerzo')
  const [nombre, setNombre] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [mesasLibres, setMesasLibres] = useState(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)

  /** Snapshot inmutable tras confirmar (no cambia si el aforo se actualiza después). */
  const [reservaGuardada, setReservaGuardada] = useState(null)

  // ── Hidratar desde localStorage al montar el componente ─────────────────
  useEffect(() => {
    const datos = cargarAforoDesdeStorage()
    setAforoDB(datos)
    setStorageListo(true)
  }, [])

  const verificarDisponibilidad = useCallback(
    (selectedDate, selectedTurn, aforo) => {
      setErrorMsg('')

      if (!selectedDate || !aforo) {
        setMesasLibres(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)
        return { valido: false }
      }

      const diaSemana = parsearFechaLocal(selectedDate).getDay()
      if (diaSemana === 1 || diaSemana === 2) {
        setErrorMsg(MSG_DIA_CERRADO)
        setMesasLibres(0)
        return { valido: false }
      }

      const libres = mesasLibresEnTurno(aforo, selectedDate, selectedTurn)
      setMesasLibres(libres)

      if (libres <= 0) {
        setErrorMsg(MSG_AFORO_COMPLETO)
        return { valido: false }
      }

      return { valido: true, libres }
    },
    [],
  )

  useEffect(() => {
    if (!storageListo || !aforoDB || !fecha) return
    verificarDisponibilidad(fecha, turno, aforoDB)
  }, [fecha, turno, aforoDB, storageListo, verificarDisponibilidad])

  const handleFechaChange = (e) => {
    setFecha(e.target.value)
    setReservaGuardada(null)
  }

  const handleTurnoChange = (e) => {
    setTurno(e.target.value)
    setReservaGuardada(null)
  }

  const ejecutarReserva = (e) => {
    e.preventDefault()
    if (!aforoDB || !fecha || !nombre.trim()) return

    const diaSemana = parsearFechaLocal(fecha).getDay()
    if (diaSemana === 1 || diaSemana === 2) {
      setErrorMsg(MSG_DIA_CERRADO)
      return
    }

    if (!hayDisponibilidadEnStorage(aforoDB, fecha, turno, 1)) {
      setErrorMsg(MSG_AFORO_COMPLETO)
      setMesasLibres(0)
      return
    }

    const ocupadasAntes = contarMesasOcupadas(aforoDB, fecha, turno)
    const codigo = generarLocalizador()

    // INSERT: +1 mesa y persistir en localStorage
    const aforoActualizado = registrarMesaEnStorage(aforoDB, fecha, turno)
    setAforoDB(aforoActualizado)

    const confirmacion = {
      localizador: codigo,
      nombre: nombre.trim(),
      fecha,
      fechaLegible: formatearFechaLegible(fecha),
      turno,
      turnoLabel: turno === 'almuerzo' ? 'Almuerzo (12:00 - 16:00)' : 'Cena (19:30 - 23:00)',
      mesasOcupadasTrasReserva: ocupadasAntes + 1,
      mesasLibresTrasReserva: CONFIG_RESTAURANTE.TOTAL_MESAS_MAX - (ocupadasAntes + 1),
      confirmadoEn: new Date().toISOString(),
    }

    console.log('[localStorage] Reserva persistida:', confirmacion)

    setReservaGuardada(confirmacion)
    setMesasLibres(confirmacion.mesasLibresTrasReserva)
  }

  const reiniciar = () => {
    setReservaGuardada(null)
    setFecha('')
    setTurno('almuerzo')
    setNombre('')
    setErrorMsg('')
    if (aforoDB) {
      setMesasLibres(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)
    }
  }

  if (!storageListo) {
    return (
      <div className="reservas-page">
        <div className="reservas-card reservas-card--loading">
          <p className="text-muted">Cargando disponibilidad…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <h2 className="reservas-card__title">Reserva tu Mesa</h2>
        <p className="reservas-card__subtitle">
          Aforo limitado a {CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas por turno.
          Tus reservas se guardan en este dispositivo.
        </p>

        {reservaGuardada ? (
          <div className="reservas-exito">
            <h3 className="reservas-exito__titulo">¡Reserva Confirmada!</h3>
            <p className="reservas-exito__texto">
              Todo listo, {reservaGuardada.nombre}. Tu mesa está guardada para el
              turno de {reservaGuardada.turnoLabel}.
            </p>
            <div className="reservas-exito__locator">
              LOCALIZADOR: {reservaGuardada.localizador}
            </div>

            <div className="reservas-exito__summary">
              <dl>
                <div>
                  <dt>Fecha</dt>
                  <dd>{reservaGuardada.fechaLegible}</dd>
                </div>
                <div>
                  <dt>Turno</dt>
                  <dd>{reservaGuardada.turnoLabel}</dd>
                </div>
                <div>
                  <dt>Aforo tras tu reserva</dt>
                  <dd>
                    {reservaGuardada.mesasOcupadasTrasReserva} /{' '}
                    {CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas ocupadas
                  </dd>
                </div>
              </dl>
            </div>

            <div className="reservas-exito__actions">
              <button type="button" className="btn-premium btn--block" onClick={reiniciar}>
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
          <form className="reservas-form" onSubmit={ejecutarReserva} noValidate>
            <div className="reservas-field">
              <label htmlFor="reserva-nombre">Nombre Titular</label>
              <input
                id="reserva-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Samuel Perera"
              />
            </div>

            <div className="reservas-row">
              <div className="reservas-field">
                <label htmlFor="reserva-fecha">Fecha</label>
                <input
                  id="reserva-fecha"
                  type="date"
                  required
                  min={fechaMinimaHoy()}
                  value={fecha}
                  onChange={handleFechaChange}
                  aria-invalid={Boolean(errorMsg)}
                />
              </div>
              <div className="reservas-field">
                <label htmlFor="reserva-turno">Turno</label>
                <select id="reserva-turno" value={turno} onChange={handleTurnoChange}>
                  <option value="almuerzo">Almuerzo (12:00 - 16:00)</option>
                  <option value="cena">Cena (19:30 - 23:00)</option>
                </select>
              </div>
            </div>

            {fecha && !errorMsg && (
              <div className="reservas-aforo-panel" role="status" aria-live="polite">
                Mesas disponibles para este turno:{' '}
                <strong>
                  {mesasLibres} de {CONFIG_RESTAURANTE.TOTAL_MESAS_MAX}
                </strong>
                <span className="reservas-aforo-panel__hint">
                  {' '}
                  (datos en tiempo real desde localStorage)
                </span>
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
              disabled={Boolean(errorMsg) || !fecha}
            >
              Confirmar Reserva de Mesa
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
