/**
 * Capa de persistencia — sincroniza el aforo con localStorage del navegador.
 *
 * React lee/escribe aquí en lugar de mutar objetos en memoria solamente,
 * de modo que las reservas sobreviven a recargas de página.
 */

import {
  CONFIG_RESTAURANTE,
  claveReserva,
  reservasOcupadasIniciales,
} from '../data/dbSimulada'

export const STORAGE_KEY_AFORO = 'reservas_guachinche'

/**
 * Carga el mapa de mesas ocupadas.
 * Si localStorage está vacío → copia los datos semilla de db.js.
 */
export function cargarAforoDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AFORO)

    if (!raw) {
      const inicial = { ...reservasOcupadasIniciales }
      guardarAforoEnStorage(inicial)
      return inicial
    }

    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Formato inválido')
    }

    return parsed
  } catch (error) {
    console.warn('[Storage] Error al leer aforo, usando datos semilla:', error)
    const inicial = { ...reservasOcupadasIniciales }
    guardarAforoEnStorage(inicial)
    return inicial
  }
}

/** Persiste el objeto completo de aforo en localStorage. */
export function guardarAforoEnStorage(aforo) {
  localStorage.setItem(STORAGE_KEY_AFORO, JSON.stringify(aforo))
}

export function contarMesasOcupadas(aforo, fecha, turno) {
  if (!fecha || !turno) return 0
  return aforo[claveReserva(fecha, turno)] ?? 0
}

export function mesasLibresEnTurno(aforo, fecha, turno) {
  return CONFIG_RESTAURANTE.TOTAL_MESAS_MAX - contarMesasOcupadas(aforo, fecha, turno)
}

export function hayDisponibilidadEnStorage(aforo, fecha, turno, mesas = 1) {
  return mesasLibresEnTurno(aforo, fecha, turno) >= mesas
}

/**
 * Registra +1 mesa, guarda en localStorage y devuelve el nuevo estado.
 */
export function registrarMesaEnStorage(aforoActual, fecha, turno) {
  const clave = claveReserva(fecha, turno)
  const siguiente = {
    ...aforoActual,
    [clave]: (aforoActual[clave] ?? 0) + 1,
  }
  guardarAforoEnStorage(siguiente)
  return siguiente
}
