import { useState } from 'react'
import {
  CONFIG_RESTAURANTE,
  generarLocalizador,
  reservasOcupadasDB,
} from '../data/db'

const MSG_DIA_CERRADO =
  '🍷 ¡Los lunes y martes cerramos para atender las viñas y descansar el personal! Por favor, selecciona otro día.'

const MSG_AFORO_COMPLETO =
  '🔴 Lo sentimos, no quedan mesas libres para este turno. El aforo máximo de 30 mesas está completo.'

/** Parsea YYYY-MM-DD en hora local (evita que getDay() falle por UTC). */
function parsearFechaLocal(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fechaMinimaHoy() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}

function claveDB(fecha, turno) {
  return `${fecha}-${turno}`
}

/**
 * Página exclusiva de reservas.
 * Intercepta lunes/martes y calcula aforo en tiempo real contra reservasOcupadasDB.
 */
export default function Reservas({ setPaginaActual }) {
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('almuerzo')
  const [nombre, setNombre] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [exito, setExito] = useState(false)
  const [localizador, setLocalizador] = useState('')
  const [mesasLibres, setMesasLibres] = useState(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)

  /**
   * Valida día de descanso y consulta aforo en reservasOcupadasDB.
   * Clave: `${fecha}-${turno}` → mesas ocupadas
   */
  const verificarDisponibilidad = (selectedDate, selectedTurn) => {
    setErrorMsg('')

    if (!selectedDate) {
      setMesasLibres(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)
      return
    }

    // 1. Lunes (1) y martes (2) — cierre por viñedos y descanso
    const diaSemana = parsearFechaLocal(selectedDate).getDay()
    if (diaSemana === 1 || diaSemana === 2) {
      setErrorMsg(MSG_DIA_CERRADO)
      setMesasLibres(0)
      return
    }

    // 2. Aforo real desde la BD simulada
    const keyDB = claveDB(selectedDate, selectedTurn)
    const mesasOcupadas = reservasOcupadasDB[keyDB] || 0
    const libres = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX - mesasOcupadas

    setMesasLibres(libres)

    if (libres <= 0) {
      setErrorMsg(MSG_AFORO_COMPLETO)
    }
  }

  const handleFechaChange = (e) => {
    const valor = e.target.value
    setFecha(valor)
    verificarDisponibilidad(valor, turno)
  }

  const handleTurnoChange = (e) => {
    const valor = e.target.value
    setTurno(valor)
    verificarDisponibilidad(fecha, valor)
  }

  const ejecutarReserva = (e) => {
    e.preventDefault()
    if (!fecha || !nombre.trim()) return

    // Revalidación síncrona antes del INSERT (evita estado React desactualizado)
    const diaSemana = parsearFechaLocal(fecha).getDay()
    if (diaSemana === 1 || diaSemana === 2) {
      setErrorMsg(MSG_DIA_CERRADO)
      return
    }

    const keyDB = claveDB(fecha, turno)
    const ocupadas = reservasOcupadasDB[keyDB] || 0
    const libres = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX - ocupadas

    if (libres <= 0) {
      setErrorMsg(MSG_AFORO_COMPLETO)
      setMesasLibres(0)
      return
    }

    // Simulación INSERT en base de datos (+1 mesa)
    if (reservasOcupadasDB[keyDB]) {
      reservasOcupadasDB[keyDB] += 1
    } else {
      reservasOcupadasDB[keyDB] = 1
    }

    const codigo = generarLocalizador()
    console.log('[BD Simulada] INSERT reserva:', {
      keyDB,
      nombre: nombre.trim(),
      turno,
      mesasOcupadas: reservasOcupadasDB[keyDB],
      localizador: codigo,
    })

    setLocalizador(codigo)
    setExito(true)
  }

  const reiniciar = () => {
    setExito(false)
    setFecha('')
    setTurno('almuerzo')
    setNombre('')
    setErrorMsg('')
    setLocalizador('')
    setMesasLibres(CONFIG_RESTAURANTE.TOTAL_MESAS_MAX)
  }

  const turnoLabel = turno === 'almuerzo' ? 'Almuerzo' : 'Cena'

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <h2 className="reservas-card__title">Reserva tu Mesa</h2>
        <p className="reservas-card__subtitle">
          Aforo limitado a {CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas por turno.
        </p>

        {exito ? (
          <div className="reservas-exito">
            <h3 className="reservas-exito__titulo">¡Reserva Confirmada!</h3>
            <p className="reservas-exito__texto">
              Todo listo, {nombre}. Tu mesa está guardada para el turno de {turnoLabel}.
            </p>
            <div className="reservas-exito__locator">
              LOCALIZADOR: {localizador}
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

            {/* Panel aforo en tiempo real */}
            {fecha && !errorMsg && (
              <div className="reservas-aforo-panel" role="status" aria-live="polite">
                Mesas disponibles para este turno:{' '}
                <strong>
                  {mesasLibres} de {CONFIG_RESTAURANTE.TOTAL_MESAS_MAX}
                </strong>
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
