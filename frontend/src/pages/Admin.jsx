import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { API_BASE_URL, backendConfigurado } from '../config/api'
import { localeFecha } from '../i18n'
import {
  cabecerasAdminAutenticado,
  cerrarSesionAdmin,
  iniciarSesionAdmin,
  sesionAdminActiva,
} from '../utils/adminAuth'
import { cargarReservasDesdeStorage, sincronizarReservasEnCacheLocal } from '../utils/reservasStorage'

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
  return fecha.toLocaleDateString(localeFecha(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatearTurno(turno, t) {
  return turno === 'almuerzo' ? t('common.lunch') : t('common.dinner')
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
  const { t } = useTranslation()
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
      setErrorLogin(error.message || t('admin.loginFailed'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="admin-page admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <h1 id="admin-login-title" className="admin-page__title">
          {t('admin.loginTitle')}
        </h1>
        <p className="admin-page__subtitle">{t('admin.loginSubtitle')}</p>

        <form className="admin-login__form" onSubmit={manejarSubmit} noValidate>
          <div className="reservas-field">
            <label htmlFor="admin-usuario">{t('admin.user')}</label>
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
            <label htmlFor="admin-contrasena">{t('admin.password')}</label>
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
            {enviando ? t('admin.verifying') : t('admin.enter')}
          </button>
        </form>
      </div>
    </section>
  )
}

function TablaReservasDia({ reservas }) {
  const { t } = useTranslation()

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{t('common.holder')}</th>
          <th>{t('common.email')}</th>
          <th>{t('common.shift')}</th>
          <th>{t('common.locator')}</th>
        </tr>
      </thead>
      <tbody>
        {reservas.map((reserva) => (
          <tr key={reserva.localizador ?? reserva.id}>
            <td>{reserva.nombre}</td>
            <td>{reserva.email ?? '—'}</td>
            <td>{formatearTurno(reserva.turno, t)}</td>
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
  const { t } = useTranslation()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [fuente, setFuente] = useState('')
  const [almacenamiento, setAlmacenamiento] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  const cargarReservas = useCallback(async () => {
    setError('')
    setAviso('')

    const cache = ordenarReservas(cargarReservasDesdeStorage())
    if (cache.length > 0) {
      setReservas(cache)
      setFuente('local')
    }

    if (!backendConfigurado()) {
      setLoading(false)
      return
    }

    setLoading(true)

    const url = new URL(`${API_BASE_URL}/api/admin/reservas`)
    if (filtroFecha) url.searchParams.set('fecha', filtroFecha)

    const intentarCarga = async (intento) => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 60_000)

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

        const lista = ordenarReservas(Array.isArray(data?.reservas) ? data.reservas : [])
        sincronizarReservasEnCacheLocal(lista)
        setReservas(lista)
        setFuente('servidor')
        setAlmacenamiento(data?.almacenamiento ?? '')
      } catch (err) {
        if (err.name === 'AbortError' && intento === 0) {
          setAviso(t('admin.waking'))
          await intentarCarga(1)
          return
        }

        if (err.message?.includes('401') || err.message?.includes('autorizado')) {
          cerrarSesionAdmin()
          onCerrarSesion()
          return
        }

        if (cache.length > 0) {
          setFuente('local')
          setAviso(
            err.name === 'AbortError' ? t('admin.timeoutCache') : t('admin.offlineCache'),
          )
        } else {
          setFuente('')
          setError(err.name === 'AbortError' ? t('admin.timeoutError') : err.message || t('admin.connectionError'))
        }
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    await intentarCarga(0)
    setLoading(false)
  }, [filtroFecha, onCerrarSesion, t])

  useEffect(() => {
    cargarReservas()
  }, [cargarReservas])

  const reservasPorDia = useMemo(() => agruparReservasPorDia(reservas), [reservas])
  const totalReservas = reservas.length
  const totalDias = reservasPorDia.length

  const subtitulo =
    fuente === 'servidor'
      ? almacenamiento === 'mysql'
        ? t('admin.subtitleMysql')
        : t('admin.subtitleServer')
      : fuente === 'local'
        ? t('admin.subtitleLocal')
        : t('admin.subtitleDefault')

  return (
    <section className="admin-page" aria-labelledby="admin-title">
      <div className="admin-page__header">
        <div>
          <h1 id="admin-title" className="admin-page__title">
            {t('admin.title')}
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
            {loading ? t('admin.updating') : t('admin.refresh')}
          </button>
          <button
            type="button"
            className="btn-premium btn-premium--outline admin-refresh-btn"
            onClick={onCerrarSesion}
          >
            {t('admin.logout')}
          </button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <p className="admin-summary-card__label">{t('admin.totalReservations')}</p>
          <p className="admin-summary-card__value">{totalReservas}</p>
        </div>
        <div className="admin-summary-card">
          <p className="admin-summary-card__label">{t('admin.daysWithReservations')}</p>
          <p className="admin-summary-card__value">{totalDias}</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="reservas-field admin-filters__field">
          <label htmlFor="admin-filtro-fecha">{t('admin.filterDay')}</label>
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
            {t('admin.clearFilter')}
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
          <p className="text-muted">{t('admin.loading')}</p>
        </div>
      ) : error ? (
        <div className="reservas-alert" role="alert">
          {error}
        </div>
      ) : reservasPorDia.length === 0 ? (
        <div className="admin-loading-card">
          <p className="text-muted">{t('admin.empty')}</p>
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
                  {t('admin.dayCount', { count: reservasDelDia.length })}
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
