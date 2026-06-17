import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_BASE_URL, backendConfigurado } from '../config/api'
import { cargarReservasDesdeStorage } from '../utils/reservasStorage'

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = String(fechaISO).split('-')
  if (!y || !m || !d) return fechaISO
  return `${d}/${m}/${y}`
}

function formatearTurno(turno) {
  return turno === 'almuerzo' ? 'Almuerzo' : 'Cena'
}

function ordenarReservas(lista) {
  return lista.slice().sort((a, b) => {
    if (a.fecha === b.fecha) return a.turno.localeCompare(b.turno)
    return a.fecha.localeCompare(b.fecha)
  })
}

export default function Admin() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [fuente, setFuente] = useState('')

  const cargarReservas = useCallback(async () => {
    setLoading(true)
    setError('')
    setAviso('')

    if (!backendConfigurado()) {
      setReservas(ordenarReservas(cargarReservasDesdeStorage()))
      setFuente('local')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000)

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reservas`, {
        signal: controller.signal,
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo cargar el panel de administración.')
      }

      setReservas(ordenarReservas(Array.isArray(data?.reservas) ? data.reservas : []))
      setFuente('servidor')
    } catch (err) {
      const locales = ordenarReservas(cargarReservasDesdeStorage())
      setReservas(locales)

      if (locales.length > 0) {
        setFuente('local')
        setAviso(
          err.name === 'AbortError'
            ? 'El servidor tardó demasiado. Mostrando reservas guardadas en este dispositivo.'
            : 'Sin conexión con el servidor. Mostrando reservas de este navegador.',
        )
      } else {
        setFuente('')
        setError(
          err.name === 'AbortError'
            ? 'El servidor tardó demasiado. Intenta de nuevo en unos segundos.'
            : err.message || 'Error de conexión con el servidor.',
        )
      }
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarReservas()
  }, [cargarReservas])

  const totalReservas = useMemo(() => reservas.length, [reservas])

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-page__header">
        <div>
          <h1 id="admin-title" className="admin-page__title">
            Panel de Administración
          </h1>
          <p className="admin-page__subtitle">
            {fuente === 'servidor'
              ? 'Reservas en tiempo real desde el servidor.'
              : fuente === 'local'
                ? 'Reservas guardadas en este navegador.'
                : 'Listado de reservas del restaurante.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-premium btn-premium--outline admin-refresh-btn"
          onClick={cargarReservas}
          disabled={loading}
        >
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="admin-summary-card">
        <p className="admin-summary-card__label">Total de reservas</p>
        <p className="admin-summary-card__value">{totalReservas}</p>
      </div>

      {aviso && (
        <div className="admin-notice" role="status">
          {aviso}
        </div>
      )}

      {loading ? (
        <div className="admin-loading-card">
          <p className="text-muted">Cargando reservas…</p>
        </div>
      ) : error ? (
        <div className="reservas-alert" role="alert">
          {error}
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titular</th>
                <th>Email</th>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Localizador</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    Aún no hay reservas. Haz una prueba desde «Reservar Mesa».
                  </td>
                </tr>
              ) : (
                reservas.map((reserva) => (
                  <tr key={reserva.localizador ?? reserva.id}>
                    <td>{reserva.nombre}</td>
                    <td>{reserva.email ?? '—'}</td>
                    <td>{formatearFecha(reserva.fecha)}</td>
                    <td>{formatearTurno(reserva.turno)}</td>
                    <td>
                      <span className="admin-table__locator">{reserva.localizador}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
