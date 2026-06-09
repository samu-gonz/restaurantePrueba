/** URL base del backend Express (reservas y admin). La carta va embebida en el frontend. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export function apiConfiguradaEnProduccion() {
  return !import.meta.env.PROD || Boolean(import.meta.env.VITE_API_URL)
}
