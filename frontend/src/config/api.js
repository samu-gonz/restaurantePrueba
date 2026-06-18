/** URL del backend en Render (producción). */
const API_RENDER = 'https://restauranteprueba-1.onrender.com'

/** URL base del backend Express (reservas y admin). La carta va embebida en el frontend. */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? API_RENDER : 'http://localhost:5000')

/** true si hay un backend público configurado (no localhost en producción). */
export function backendConfigurado() {
  const url = API_BASE_URL
  if (import.meta.env.PROD) {
    return url.length > 0 && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)
  }
  return true
}
