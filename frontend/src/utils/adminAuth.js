import { API_BASE_URL, backendConfigurado } from '../config/api'

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

export async function iniciarSesionAdmin(usuario, contrasena) {
  const usuarioNormalizado = usuario.trim()
  const contrasenaEnviada = contrasena

  if (backendConfigurado()) {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: usuarioNormalizado,
        contrasena: contrasenaEnviada,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo iniciar sesión.')
    }

    guardarTokenAdmin(data.token)
    return
  }

  if (!CONTRASENA_ADMIN_LOCAL) {
    throw new Error(
      'Credenciales de admin no configuradas. Define VITE_ADMIN_PASSWORD en frontend/.env',
    )
  }

  if (
    usuarioNormalizado !== USUARIO_ADMIN_LOCAL ||
    contrasenaEnviada !== CONTRASENA_ADMIN_LOCAL
  ) {
    throw new Error('Usuario o contraseña incorrectos.')
  }

  guardarTokenAdmin(TOKEN_SESION_LOCAL)
}
