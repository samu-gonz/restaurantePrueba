import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LIMITE_MESAS_POR_TURNO,
  TURNOS,
  contarMesasOcupadas,
  generarLocalizador,
  hayDisponibilidad,
  insertarReserva,
  mesasDisponibles,
} from '../data/dbSimulada'

const MENSAJE_DIA_CERRADO =
  'Los lunes y martes las puertas permanecen cerradas: estamos en los viñedos y el equipo descansa. Elige otro día para visitarnos.'

const MENSAJE_SIN_AFORO =
  '🔴 Lo sentimos, no quedan mesas disponibles para este turno. Por favor, selecciona otra hora o fecha.'

const ESTADO_INICIAL = {
  nombre: '',
  telefono: '',
  fecha: '',
  turno: '',
  mesas: '1',
  personas: '2',
  notas: '',
}

function parsearFechaLocal(valor) {
  const [y, m, d] = valor.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function esDiaCerrado(fecha) {
  const dia = fecha.getDay()
  return dia === 1 || dia === 2
}

function validarFecha(valor) {
  if (!valor) return { valido: false, mensaje: 'Selecciona una fecha para tu visita.' }
  const fecha = parsearFechaLocal(valor)
  if (esDiaCerrado(fecha)) return { valido: false, mensaje: MENSAJE_DIA_CERRADO }
  return { valido: true, mensaje: '' }
}

function fechaMinimaHoy() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}

function formatearFecha(valor) {
  return parsearFechaLocal(valor).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function etiquetaTurno(turno) {
  return turno === TURNOS.ALMUERZO ? 'Almuerzo (12:00 – 16:00)' : 'Cena (19:30 – 23:00)'
}

/**
 * Página exclusiva de reservas con verificación de aforo (30 mesas/turno).
 *
 * Flujo de disponibilidad:
 * 1. Usuario elige fecha + turno (+ mesas solicitadas).
 * 2. contarMesasOcupadas() consulta reservasDB filtrando por fecha y turno.
 * 3. Si ocupadas + mesasSolicitadas > 30 → bloqueo y alerta.
 * 4. Si hay hueco → INSERT simulado con insertarReserva() y pantalla de éxito.
 */
export default function Reservas() {
  const idBase = useId()
  const [datos, setDatos] = useState(ESTADO_INICIAL)
  const [errorFecha, setErrorFecha] = useState('')
  const [errorAforo, setErrorAforo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  /** Fuerza re-render tras INSERT para refrescar contadores. */
  const [versionBD, setVersionBD] = useState(0)

  const mesasSolicitadas = Number(datos.mesas) || 1

  /** Consulta aforo en BD simulada (depende de versionBD tras cada INSERT). */
  const aforo = useMemo(() => {
    void versionBD
    if (!datos.fecha || !datos.turno) {
      return { ocupadas: 0, libres: LIMITE_MESAS_POR_TURNO, completo: false }
    }
    const ocupadas = contarMesasOcupadas(datos.fecha, datos.turno)
    const libres = mesasDisponibles(datos.fecha, datos.turno)
    const completo = !hayDisponibilidad(datos.fecha, datos.turno, mesasSolicitadas)
    return { ocupadas, libres, completo }
  }, [datos.fecha, datos.turno, mesasSolicitadas, versionBD])

  const fechaInvalida = Boolean(errorFecha)
  const sinDisponibilidad = Boolean(
    datos.fecha && datos.turno && !fechaInvalida && aforo.completo,
  )

  const validarYSetearFecha = (valor) => {
    const { valido, mensaje } = validarFecha(valor)
    setErrorFecha(valido ? '' : mensaje)
    return valido
  }

  const revisarAforo = (fecha, turno, mesas) => {
    if (!fecha || !turno) {
      setErrorAforo('')
      return true
    }
    const disponible = hayDisponibilidad(fecha, turno, Number(mesas) || 1)
    setErrorAforo(disponible ? '' : MENSAJE_SIN_AFORO)
    return disponible
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const siguiente = { ...datos, [name]: value }
    setDatos(siguiente)
    setConfirmacion(null)

    if (name === 'fecha') {
      validarYSetearFecha(value)
      revisarAforo(value, siguiente.turno, siguiente.mesas)
    } else if (name === 'turno' || name === 'mesas') {
      revisarAforo(siguiente.fecha, siguiente.turno, siguiente.mesas)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validarYSetearFecha(datos.fecha)) return
    if (!datos.turno) return
    if (!revisarAforo(datos.fecha, datos.turno, datos.mesas)) return
    if (!datos.nombre.trim() || !datos.telefono.trim()) return

    setEnviando(true)

    window.setTimeout(() => {
      const localizador = generarLocalizador()

      insertarReserva({
        fecha: datos.fecha,
        turno: datos.turno,
        mesas: mesasSolicitadas,
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        personas: Number(datos.personas),
        notas: datos.notas.trim(),
        localizador,
      })

      setConfirmacion({
        localizador,
        ...datos,
      })
      setDatos(ESTADO_INICIAL)
      setErrorFecha('')
      setErrorAforo('')
      setVersionBD((v) => v + 1)
      setEnviando(false)
    }, 700)
  }

  const nuevaReserva = () => {
    setConfirmacion(null)
    setDatos(ESTADO_INICIAL)
    setErrorFecha('')
    setErrorAforo('')
  }

  if (confirmacion) {
    return (
      <div className="reservas-page container">
        <header className="booking-section__header">
          <span className="badge">Confirmado</span>
          <h1 className="section-title">Reserva registrada</h1>
        </header>

        <div className="booking-card card booking-success">
          <div className="booking-success__icon" aria-hidden="true">
            ✓
          </div>
          <p className="booking-success__locator">{confirmacion.localizador}</p>
          <h3>¡Tu mesa está solicitada!</h3>
          <p className="text-muted">
            Guarda tu localizador. Te llamaremos para confirmar los últimos detalles.
          </p>

          <div className="booking-success__summary">
            <dl>
              <div>
                <dt>Localizador</dt>
                <dd>{confirmacion.localizador}</dd>
              </div>
              <div>
                <dt>Nombre</dt>
                <dd>{confirmacion.nombre}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatearFecha(confirmacion.fecha)}</dd>
              </div>
              <div>
                <dt>Turno</dt>
                <dd>{etiquetaTurno(confirmacion.turno)}</dd>
              </div>
              <div>
                <dt>Mesas</dt>
                <dd>{confirmacion.mesas}</dd>
              </div>
              <div>
                <dt>Comensales</dt>
                <dd>{confirmacion.personas}</dd>
              </div>
            </dl>
          </div>

          <button type="button" className="btn btn--outline btn--block" onClick={nuevaReserva}>
            Hacer otra reserva
          </button>
          <Link to="/" className="btn btn--fill btn--block">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="reservas-page container">
      <header className="booking-section__header">
        <span className="badge">Reservas</span>
        <h1 className="section-title">Gestión de mesas</h1>
        <p className="text-muted">
          Aforo máximo: {LIMITE_MESAS_POR_TURNO} mesas por turno (Almuerzo o Cena).
        </p>
      </header>

      {/* Indicador de aforo en tiempo real */}
      {datos.fecha && datos.turno && !fechaInvalida && (
        <div
          className={`aforo-meter card ${sinDisponibilidad ? 'aforo-meter--full' : ''}`}
          role="status"
          aria-live="polite"
        >
          <div className="aforo-meter__header">
            <span className="text-muted">Disponibilidad</span>
            <span className="aforo-meter__count">
              {aforo.ocupadas} / {LIMITE_MESAS_POR_TURNO} mesas ocupadas
            </span>
          </div>
          <div className="aforo-meter__bar">
            <div
              className="aforo-meter__fill"
              style={{ width: `${(aforo.ocupadas / LIMITE_MESAS_POR_TURNO) * 100}%` }}
            />
          </div>
          <p className="aforo-meter__hint">
            {sinDisponibilidad
              ? 'Turno completo para la selección actual'
              : `${aforo.libres} mesa${aforo.libres === 1 ? '' : 's'} libre${aforo.libres === 1 ? '' : 's'}`}
          </p>
        </div>
      )}

      <div className="booking-card card">
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <div className="booking-field">
            <label htmlFor={`${idBase}-fecha`}>Fecha de visita</label>
            <input
              id={`${idBase}-fecha`}
              name="fecha"
              type="date"
              required
              min={fechaMinimaHoy()}
              value={datos.fecha}
              onChange={handleChange}
              disabled={enviando}
              aria-invalid={fechaInvalida}
              className={fechaInvalida ? 'booking-field__input--error' : ''}
            />
            {fechaInvalida && (
              <p className="booking-field__error" role="alert">
                {errorFecha}
              </p>
            )}
          </div>

          <div className="booking-field">
            <label htmlFor={`${idBase}-turno`}>Turno</label>
            <select
              id={`${idBase}-turno`}
              name="turno"
              required
              value={datos.turno}
              onChange={handleChange}
              disabled={enviando || fechaInvalida}
            >
              <option value="">Selecciona un turno</option>
              <option value={TURNOS.ALMUERZO}>Almuerzo (12:00 – 16:00)</option>
              <option value={TURNOS.CENA}>Cena (19:30 – 23:00)</option>
            </select>
          </div>

          <div className="booking-field">
            <label htmlFor={`${idBase}-mesas`}>Mesas a reservar</label>
            <select
              id={`${idBase}-mesas`}
              name="mesas"
              value={datos.mesas}
              onChange={handleChange}
              disabled={enviando}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? 'mesa' : 'mesas'}
                </option>
              ))}
            </select>
          </div>

          {sinDisponibilidad && (
            <p className="booking-field__error booking-field__error--aforo" role="alert">
              {errorAforo}
            </p>
          )}

          <div className="booking-field">
            <label htmlFor={`${idBase}-nombre`}>Nombre completo</label>
            <input
              id={`${idBase}-nombre`}
              name="nombre"
              type="text"
              required
              autoComplete="name"
              value={datos.nombre}
              onChange={handleChange}
              disabled={enviando}
            />
          </div>

          <div className="booking-field">
            <label htmlFor={`${idBase}-telefono`}>Teléfono</label>
            <input
              id={`${idBase}-telefono`}
              name="telefono"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+34 600 000 000"
              value={datos.telefono}
              onChange={handleChange}
              disabled={enviando}
            />
          </div>

          <div className="booking-field">
            <label htmlFor={`${idBase}-personas`}>Comensales</label>
            <select
              id={`${idBase}-personas`}
              name="personas"
              value={datos.personas}
              onChange={handleChange}
              disabled={enviando}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-field">
            <label htmlFor={`${idBase}-notas`}>
              Notas <span className="text-muted">(opcional)</span>
            </label>
            <textarea
              id={`${idBase}-notas`}
              name="notas"
              rows={3}
              placeholder="Alergias, celebración..."
              value={datos.notas}
              onChange={handleChange}
              disabled={enviando}
            />
          </div>

          <button
            type="submit"
            className="btn btn--fill btn--block"
            disabled={enviando || fechaInvalida || sinDisponibilidad || !datos.turno}
          >
            {enviando ? 'Procesando…' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </div>
  )
}
