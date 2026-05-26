import { useCallback, useEffect, useState } from 'react'
import { CONFIG_RESTAURANTE } from '../data/db'

/* ── Constantes de negocio y persistencia ─────────────────────────────────── */

const STORAGE_KEY = 'reservas_guachinche'
const MESAS_MAX = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX

/** Estado por defecto si localStorage está vacío */
const RESERVAS_POR_DEFECTO = {
  '2026-05-30-almuerzo': 28,
  '2026-05-30-cena': 30,
  '2026-05-31-almuerzo': 12,
}

const MSG_CIERRE =
  '🍷 Cerramos los lunes y martes por mantenimiento de viñedos y descanso del personal. Elige otro día.'

const MSG_AFORO_COMPLETO =
  '🔴 Aforo completo: las 30 mesas de este turno ya están reservadas. Prueba otra fecha u horario.'

/* ── Utilidades ───────────────────────────────────────────────────────────── */

function claveTurno(fecha, turno) {
  return `${fecha}-${turno}`
}

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

function generarLocalizador() {
  const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `#RE-2026-${sufijo}`
}

function leerReservasStorage() {
  const guardado = localStorage.getItem(STORAGE_KEY)
  if (!guardado) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(RESERVAS_POR_DEFECTO))
    return { ...RESERVAS_POR_DEFECTO }
  }
  try {
    return JSON.parse(guardado)
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(RESERVAS_POR_DEFECTO))
    return { ...RESERVAS_POR_DEFECTO }
  }
}

function guardarReservasStorage(datos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datos))
}

function mesasOcupadasEn(datos, fecha, turno) {
  return datos[claveTurno(fecha, turno)] ?? 0
}

/**
 * Reservas 100% operativas con localStorage.
 * Clave: reservas_guachinche → { "fecha-turno": mesasOcupadas }
 */
export default function Reservas({ setPaginaActual }) {
  const [reservasDB, setReservasDB] = useState(null)
  const [listo, setListo] = useState(false)

  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [turno, setTurno] = useState('almuerzo')
  const [errorMsg, setErrorMsg] = useState('')
  const [mesasLibres, setMesasLibres] = useState(MESAS_MAX)
  const [exito, setExito] = useState(null)

  /** Inicializar localStorage al montar */
  useEffect(() => {
    const datos = leerReservasStorage()
    setReservasDB(datos)
    setListo(true)
  }, [])

  /** Validar cierre semanal + aforo contra localStorage */
  const validarDisponibilidad = useCallback(
    (fechaSel, turnoSel, db) => {
      setErrorMsg('')

      if (!fechaSel || !db) {
        setMesasLibres(MESAS_MAX)
        return false
      }

      if (esDiaCerrado(fechaSel)) {
        setErrorMsg(MSG_CIERRE)
        setMesasLibres(0)
        return false
      }

      const ocupadas = mesasOcupadasEn(db, fechaSel, turnoSel)
      const libres = MESAS_MAX - ocupadas
      setMesasLibres(libres)

      if (ocupadas >= MESAS_MAX) {
        setErrorMsg(MSG_AFORO_COMPLETO)
        return false
      }

      return true
    },
    [],
  )

  useEffect(() => {
    if (!listo || !reservasDB || !fecha) return
    validarDisponibilidad(fecha, turno, reservasDB)
  }, [fecha, turno, reservasDB, listo, validarDisponibilidad])

  const onFechaChange = (e) => {
    setFecha(e.target.value)
    setExito(null)
    if (reservasDB) validarDisponibilidad(e.target.value, turno, reservasDB)
  }

  const onTurnoChange = (e) => {
    setTurno(e.target.value)
    setExito(null)
    if (reservasDB) validarDisponibilidad(fecha, e.target.value, reservasDB)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reservasDB || !nombre.trim() || !fecha) return

    if (!validarDisponibilidad(fecha, turno, reservasDB)) return

    const key = claveTurno(fecha, turno)
    const actualizado = { ...reservasDB }
    actualizado[key] = (actualizado[key] ?? 0) + 1

    guardarReservasStorage(actualizado)
    setReservasDB(actualizado)

    const localizador = generarLocalizador()
    const turnoTexto =
      turno === 'almuerzo' ? 'Almuerzo (12:00 – 16:00)' : 'Cena (19:30 – 23:00)'

    setExito({
      nombre: nombre.trim(),
      localizador,
      fecha,
      turno: turnoTexto,
      mesasRestantes: MESAS_MAX - actualizado[key],
    })

    console.log('[localStorage] Reserva guardada:', { key, ocupadas: actualizado[key], localizador })
  }

  const nuevaReserva = () => {
    setExito(null)
    setNombre('')
    setFecha('')
    setTurno('almuerzo')
    setErrorMsg('')
    setMesasLibres(MESAS_MAX)
  }

  if (!listo) {
    return (
      <div className="reservas-page">
        <div className="reservas-card reservas-card--loading">
          <p className="text-muted">Cargando disponibilidad…</p>
        </div>
      </div>
    )
  }

  const formularioBloqueado = Boolean(errorMsg)

  return (
    <div className="reservas-page">
      <div className="reservas-card">
        <h2 className="reservas-card__title">Reserva tu Mesa</h2>
        <p className="reservas-card__subtitle">
          Máximo {MESAS_MAX} mesas por turno. Datos guardados en tu navegador.
        </p>

        {exito ? (
          <div className="reservas-exito">
            <h3 className="reservas-exito__titulo">¡Reserva Confirmada!</h3>
            <p className="reservas-exito__texto">
              Gracias, <strong>{exito.nombre}</strong>. Tu mesa queda registrada para el
              turno de {exito.turno}.
            </p>
            <div className="reservas-exito__locator">LOCALIZADOR: {exito.localizador}</div>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Mesas libres restantes en ese turno: {exito.mesasRestantes}
            </p>
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
                disabled={formularioBloqueado && esDiaCerrado(fecha)}
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
                />
              </div>
              <div className="reservas-field">
                <label htmlFor="turno-visita">Turno</label>
                <select id="turno-visita" value={turno} onChange={onTurnoChange}>
                  <option value="almuerzo">Almuerzo (12:00 – 16:00)</option>
                  <option value="cena">Cena (19:30 – 23:00)</option>
                </select>
              </div>
            </div>

            {fecha && !errorMsg && (
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
              disabled={formularioBloqueado || !fecha || !nombre.trim()}
            >
              Confirmar reserva
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
