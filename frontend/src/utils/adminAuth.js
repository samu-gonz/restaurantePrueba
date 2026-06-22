import { API_BASE_URL, backendConfigurado } from '../config/api'
import i18n from '../i18n'

const STORAGE_KEY_TOKEN = 'admin_token_guachinche'
const TOKEN_SESION_LOCAL = 'local-admin-session'

const USUARIO_ADMIN_LOCAL = import.meta.env.VITE_ADMIN_USER ?? 'admin'
const CONTRASENA_ADMIN_LOCAL = import.meta.env.VITE_ADMIN_PASSWORD ?? ''

export function sesionAdminActiva() {
  return Boolean(sessionStorage.getItem(STORAGE_KEY_TOKEN))
}

export function obtenerTokenAdmin() {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN)
}

export function guardarTokenAdmin(token) {
  sessionStorage.setItem(STORAGE_KEY_TOKEN, token)
}

export function cerrarSesionAdmin() {
  sessionStorage.removeItem(STORAGE_KEY_TOKEN)
}

export function cabecerasAdminAutenticado() {
  const token = obtenerTokenAdmin()
  if (!token || token === TOKEN_SESION_LOCAL) return {}
  return { Authorization: `Bearer ${token}` }
}

function credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada) {
  if (!CONTRASENA_ADMIN_LOCAL) return false
  return (
    usuarioNormalizado === USUARIO_ADMIN_LOCAL &&
    contrasenaEnviada === CONTRASENA_ADMIN_LOCAL
  )
}

function iniciarSesionLocal(usuarioNormalizado, contrasenaEnviada) {
  if (!credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)) {
    throw new Error(i18n.t('admin.wrongCredentials'))
  }
  guardarTokenAdmin(TOKEN_SESION_LOCAL)
}

export async function iniciarSesionAdmin(usuario, contrasena) {
  const usuarioNormalizado = usuario.trim()
  const contrasenaEnviada = contrasena

  if (!backendConfigurado()) {
    iniciarSesionLocal(usuarioNormalizado, contrasenaEnviada)
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: usuarioNormalizado,
        contrasena: contrasenaEnviada,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      guardarTokenAdmin(data.token)
      return
    }

    if (
      response.status === 503 &&
      credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)
    ) {
      guardarTokenAdmin(TOKEN_SESION_LOCAL)
      return
    }

    throw new Error(data?.error || 'No se pudo iniciar sesión.')
  } catch (error) {
    if (
      error.message === 'Failed to fetch' &&
      credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)
    ) {
      guardarTokenAdmin(TOKEN_SESION_LOCAL)
      return
    }

    if (error.message?.includes('Usuario o contraseña')) {
      throw error
    }

    if (credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)) {
      guardarTokenAdmin(TOKEN_SESION_LOCAL)
      return
    }

    throw error
  }
}
