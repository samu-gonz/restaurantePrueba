import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://localhost:5000'

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = String(fechaISO).split('-')
  if (!y || !m || !d) return fechaISO
  return `${d}/${m}/${y}`
}

function formatearTurno(turno) {
  return turno === 'almuerzo' ? 'Almuerzo' : 'Cena'
}

export default function Admin() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function cargarReservas() {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`${API_BASE_URL}/api/admin/reservas`, {
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo cargar el panel de administración.')
        }

        setReservas(Array.isArray(data?.reservas) ? data.reservas : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error de conexión con el servidor.')
          setReservas([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    cargarReservas()
    return () => controller.abort()
  }, [])

  const totalReservas = useMemo(() => reservas.length, [reservas])

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-page__header">
        <h1 id="admin-title" className="admin-page__title">
          Panel de Administración
        </h1>
        <p className="admin-page__subtitle">
          Control consolidado de reservas activas en tiempo real.
        </p>
      </div>

      <div className="admin-summary-card">
        <p className="admin-summary-card__label">Total de reservas gestionadas</p>
        <p className="admin-summary-card__value">{totalReservas}</p>
      </div>

      {loading ? (
        <div className="admin-loading-card">
          <p className="text-muted">Cargando reservas del servidor...</p>
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
                <th>Fecha</th>
                <th>Turno</th>
                <th>Localizador</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table__empty">
                    Aún no hay reservas registradas.
                  </td>
                </tr>
              ) : (
                reservas.map((reserva) => (
                  <tr key={reserva.localizador}>
                    <td>{reserva.nombre}</td>
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

