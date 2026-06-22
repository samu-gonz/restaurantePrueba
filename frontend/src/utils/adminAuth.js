import { API_BASE_URL, backendConfigurado } from '../config/api'

const STORAGE_KEY_TOKEN = 'admin_token_guachinche'
const TOKEN_SESION_LOCAL = 'local-admin-session'
const LOGIN_TIMEOUT_MS = 60_000

const USUARIO_ADMIN_LOCAL = import.meta.env.VITE_ADMIN_USER ?? 'admin'
const CONTRASENA_ADMIN_LOCAL = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin'

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
  const contrasena = String(contrasenaEnviada ?? '').trim()
  if (!contrasena) return false
  return (
    usuarioNormalizado === USUARIO_ADMIN_LOCAL &&
    contrasena === CONTRASENA_ADMIN_LOCAL
  )
}

function iniciarSesionLocal(usuarioNormalizado, contrasenaEnviada) {
  if (!credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)) {
    throw new Error('Usuario o contraseña incorrectos.')
  }
  guardarTokenAdmin(TOKEN_SESION_LOCAL)
}

export async function iniciarSesionAdmin(usuario, contrasena) {
  const usuarioNormalizado = usuario.trim()
  const contrasenaEnviada = String(contrasena ?? '').trim()

  if (!backendConfigurado()) {
    iniciarSesionLocal(usuarioNormalizado, contrasenaEnviada)
    return
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: usuarioNormalizado,
        contrasena: contrasenaEnviada,
      }),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      guardarTokenAdmin(data.token)
      return
    }

    throw new Error(data?.error || 'No se pudo iniciar sesión.')
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'El servidor tardó demasiado en responder. Espera unos segundos y vuelve a intentarlo.',
      )
    }

    if (
      !backendConfigurado() &&
      (error.message === 'Failed to fetch' ||
        error.message?.includes('No se pudo iniciar sesión')) &&
      credencialesLocalesValidas(usuarioNormalizado, contrasenaEnviada)
    ) {
      guardarTokenAdmin(TOKEN_SESION_LOCAL)
      return
    }

    if (error.message?.includes('Usuario o contraseña')) {
      throw error
    }

    if (error.message === 'Failed to fetch') {
      throw new Error(
        'No se pudo conectar con el servidor. Si es la primera vez tras un rato sin uso, espera hasta un minuto y vuelve a intentarlo.',
      )
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
