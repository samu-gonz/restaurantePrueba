/**
 * Punto de entrada de datos — Guachinche El Realejo
 *
 * - menuData: carta con imágenes Unsplash
 * - reservasOcupadasIniciales: semilla si localStorage está vacío
 * - reservasStorage: lectura/escritura persistente del aforo
 */

export {
  CONFIG_RESTAURANTE,
  LIMITE_MESAS_POR_TURNO,
  TURNOS,
  menuData,
  CATEGORIAS_MENU,
  reservasOcupadasIniciales,
  IMAGEN_CARTA_FALLBACK,
  IMAGEN_HERO_BODEGA,
  claveReserva,
  generarLocalizador,
  formatearPrecio,
} from './dbSimulada'

export {
  STORAGE_KEY_AFORO,
  cargarAforoDesdeStorage,
  guardarAforoEnStorage,
  contarMesasOcupadas,
  mesasLibresEnTurno,
  hayDisponibilidadEnStorage,
  registrarMesaEnStorage,
} from '../utils/reservasStorage'
