import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_BASE_URL, backendConfigurado } from '../config/api'
import {
  cabecerasAdminAutenticado,
  cerrarSesionAdmin,
  iniciarSesionAdmin,
  sesionAdminActiva,
} from '../utils/adminAuth'
import { cargarReservasDesdeStorage } from '../utils/reservasStorage'

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = String(fechaISO).split('-')
  if (!y || !m || !d) return fechaISO
  return `${d}/${m}/${y}`
}

function formatearDiaCabecera(fechaISO) {
  if (!fechaISO) return '—'
  const [y, m, d] = String(fechaISO).split('-').map(Number)
  if (!y || !m || !d) return fechaISO
  const fecha = new Date(y, m - 1, d)
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatearTurno(turno) {
  return turno === 'almuerzo' ? 'Almuerzo' : 'Cena'
}

function valorOrdenTurno(turno) {
  return turno === 'almuerzo' ? 0 : 1
}

function ordenarReservas(lista) {
  return lista.slice().sort((a, b) => {
    if (a.fecha === b.fecha) return valorOrdenTurno(a.turno) - valorOrdenTurno(b.turno)
    return a.fecha.localeCompare(b.fecha)
  })
}

function agruparReservasPorDia(reservas) {
  const mapa = new Map()
  for (const reserva of ordenarReservas(reservas)) {
    if (!mapa.has(reserva.fecha)) mapa.set(reserva.fecha, [])
    mapa.get(reserva.fecha).push(reserva)
  }
  return [...mapa.entries()]
}

function FormularioLoginAdmin({ onAccesoCorrecto }) {
  const [usuario, setUsuario] = useState('admin')
  const [contrasena, setContrasena] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [enviando, setEnviando] = useState(false)

  const manejarSubmit = async (evento) => {
    evento.preventDefault()
    setErrorLogin('')
    setEnviando(true)

    try {
      await iniciarSesionAdmin(usuario, contrasena)
      onAccesoCorrecto()
    } catch (error) {
      setErrorLogin(error.message || 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="admin-page admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <h1 id="admin-login-title" className="admin-page__title">
          Acceso al personal
        </h1>
        <p className="admin-page__subtitle">
          Introduce tus credenciales para consultar las reservas del restaurante.
        </p>

        <form className="admin-login__form" onSubmit={manejarSubmit} noValidate>
          <div className="reservas-field">
            <label htmlFor="admin-usuario">Usuario</label>
            <input
              id="admin-usuario"
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <div className="reservas-field">
            <label htmlFor="admin-contrasena">Contraseña</label>
            <input
              id="admin-contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              disabled={enviando}
              required
            />
          </div>

          {errorLogin && (
            <div className="reservas-alert" role="alert">
              {errorLogin}
            </div>
          )}

          <button type="submit" className="btn-premium btn--block" disabled={enviando}>
            {enviando ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  )
}

function TablaReservasDia({ reservas }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Titular</th>
          <th>Email</th>
          <th>Turno</th>
          <th>Localizador</th>
        </tr>
      </thead>
      <tbody>
        {reservas.map((reserva) => (
          <tr key={reserva.localizador ?? reserva.id}>
            <td>{reserva.nombre}</td>
            <td>{reserva.email ?? '—'}</td>
            <td>{formatearTurno(reserva.turno)}</td>
            <td>
              <span className="admin-table__locator">{reserva.localizador}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PanelReservasAdmin({ onCerrarSesion }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [fuente, setFuente] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

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

    const url = new URL(`${API_BASE_URL}/api/admin/reservas`)
    if (filtroFecha) url.searchParams.set('fecha', filtroFecha)

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: cabecerasAdminAutenticado(),
      })
      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        cerrarSesionAdmin()
        onCerrarSesion()
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo cargar el panel de administración.')
      }

      setReservas(ordenarReservas(Array.isArray(data?.reservas) ? data.reservas : []))
      setFuente('servidor')
    } catch (err) {
      const locales = ordenarReservas(cargarReservasDesdeStorage())

      if (err.message?.includes('401') || err.message?.includes('autorizado')) {
        cerrarSesionAdmin()
        onCerrarSesion()
        return
      }

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
  }, [filtroFecha, onCerrarSesion])

  useEffect(() => {
    cargarReservas()
  }, [cargarReservas])

  const reservasPorDia = useMemo(() => agruparReservasPorDia(reservas), [reservas])
  const totalReservas = reservas.length
  const totalDias = reservasPorDia.length

  const subtitulo =
    fuente === 'servidor'
      ? 'Reservas guardadas en base de datos MySQL.'
      : fuente === 'local'
        ? 'Reservas guardadas en este navegador.'
        : 'Listado de reservas del restaurante.'

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-page__header">
        <div>
          <h1 id="admin-title" className="admin-page__title">
            Gestión de reservas
          </h1>
          <p className="admin-page__subtitle">{subtitulo}</p>
        </div>
        <div className="admin-page__actions">
          <button
            type="button"
            className="btn-premium btn-premium--outline admin-refresh-btn"
            onClick={cargarReservas}
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            type="button"
            className="btn-premium btn-premium--outline admin-refresh-btn"
            onClick={onCerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <p className="admin-summary-card__label">Total de reservas</p>
          <p className="admin-summary-card__value">{totalReservas}</p>
        </div>
        <div className="admin-summary-card">
          <p className="admin-summary-card__label">Días con reservas</p>
          <p className="admin-summary-card__value">{totalDias}</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="reservas-field admin-filters__field">
          <label htmlFor="admin-filtro-fecha">Filtrar por día</label>
          <input
            id="admin-filtro-fecha"
            type="date"
            value={filtroFecha}
            onChange={(evento) => setFiltroFecha(evento.target.value)}
            disabled={loading}
          />
        </div>
        {filtroFecha && (
          <button
            type="button"
            className="btn-premium btn-premium--outline admin-filters__clear"
            onClick={() => setFiltroFecha('')}
            disabled={loading}
          >
            Ver todos los días
          </button>
        )}
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
      ) : reservasPorDia.length === 0 ? (
        <div className="admin-loading-card">
          <p className="text-muted">Aún no hay reservas registradas.</p>
        </div>
      ) : (
        <div className="admin-day-list">
          {reservasPorDia.map(([fecha, reservasDelDia]) => (
            <article key={fecha} className="admin-day-section">
              <header className="admin-day-section__header">
                <div>
                  <h2 className="admin-day-section__title">{formatearDiaCabecera(fecha)}</h2>
                  <p className="admin-day-section__meta">{formatearFecha(fecha)}</p>
                </div>
                <span className="admin-day-section__count">
                  {reservasDelDia.length} reserva{reservasDelDia.length === 1 ? '' : 's'}
                </span>
              </header>
              <div className="admin-table-card admin-day-section__table">
                <TablaReservasDia reservas={reservasDelDia} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(() => sesionAdminActiva())

  const cerrarSesion = () => {
    cerrarSesionAdmin()
    setAutenticado(false)
  }

  if (!autenticado) {
    return <FormularioLoginAdmin onAccesoCorrecto={() => setAutenticado(true)} />
  }

  return <PanelReservasAdmin onCerrarSesion={cerrarSesion} />
}
