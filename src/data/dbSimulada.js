/**
 * Simulación de Base de Datos del Guachinche El Realejo
 * En producción: API + PostgreSQL / Firebase, etc.
 */

// ── Configuración del local ────────────────────────────────────────────────

export const CONFIG_RESTAURANTE = {
  TOTAL_MESAS_MAX: 30,
}

/** Alias para compatibilidad con el módulo de reservas. */
export const LIMITE_MESAS_POR_TURNO = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX

export const TURNOS = {
  ALMUERZO: 'almuerzo',
  CENA: 'cena',
}

// ── Carta completa (platos, precios, alérgenos) ────────────────────────────

export const menuData = [
  {
    id: 1,
    nombre: 'Queso Asado con Mojos',
    categoria: 'entrantes',
    precio: 6.8,
    descripcion:
      'Queso ahumado de la isla a la plancha, acompañado de mojo verde de cilantro y rojo palmero.',
    alergenos: ['Lácteos'],
  },
  {
    id: 2,
    nombre: 'Escaldón de Gofio Premium',
    categoria: 'entrantes',
    precio: 5.5,
    descripcion:
      'Gofio local amasado con caldo de pescado de roca, cebolla roja, queso duro y un toque de mojo.',
    alergenos: ['Gluten', 'Lácteos'],
  },
  {
    id: 3,
    nombre: 'Carne Fiesta al Estilo Tradicional',
    categoria: 'carnes',
    precio: 10.5,
    descripcion:
      'Tacos de cerdo seleccionados, adobados durante 24h con ajo, orégano, pimentón y vino blanco, con papas fritas.',
    alergenos: [],
  },
  {
    id: 4,
    nombre: 'Costillas, Papas y Piña de Millo',
    categoria: 'carnes',
    precio: 13.5,
    descripcion:
      'Costilla de cerdo sazonada al punto de sal, papas de la tierra y piña de millo con mojo de cilantro.',
    alergenos: [],
  },
  {
    id: 5,
    nombre: 'Polvito Uruguayo Casero',
    categoria: 'postres',
    precio: 4.5,
    descripcion:
      'Postre artesanal con base de galleta, dulce de leche premium, nata montada y suspiros de Moya.',
    alergenos: ['Lácteos', 'Gluten'],
  },
]

/** Etiquetas legibles por categoría para la UI. */
export const CATEGORIAS_MENU = {
  entrantes: 'Entrantes',
  carnes: 'Carnes',
  postres: 'Postres',
}

// ── Aforo: mesas ocupadas por fecha y turno ─────────────────────────────────
// Formato clave: 'AAAA-MM-DD-turno' (almuerzo | cena) → número de mesas ocupadas

const reservasOcupadasIniciales = {
  '2026-05-30-almuerzo': 28, // Quedan 2 mesas libres
  '2026-05-30-cena': 30, // LLENO TOTAL
  '2026-05-31-almuerzo': 12, // Disponible
}

/** Estado mutable — los INSERT incrementan el contador de la clave. */
export let reservasOcupadasDB = { ...reservasOcupadasIniciales }

/** Construye la clave de búsqueda en reservasOcupadasDB. */
export function claveReserva(fecha, turno) {
  return `${fecha}-${turno}`
}

/**
 * Mesas ya reservadas para un día y turno.
 * Equivale a: SELECT ocupacion FROM aforo WHERE clave = ?
 */
export function contarMesasOcupadas(fecha, turno) {
  if (!fecha || !turno) return 0
  return reservasOcupadasDB[claveReserva(fecha, turno)] ?? 0
}

/** ¿Caben `mesasSolicitadas` mesas más sin superar el límite? */
export function hayDisponibilidad(fecha, turno, mesasSolicitadas = 1) {
  const ocupadas = contarMesasOcupadas(fecha, turno)
  return ocupadas + mesasSolicitadas <= CONFIG_RESTAURANTE.TOTAL_MESAS_MAX
}

export function mesasDisponibles(fecha, turno) {
  return CONFIG_RESTAURANTE.TOTAL_MESAS_MAX - contarMesasOcupadas(fecha, turno)
}

/**
 * Simula INSERT: suma mesas al registro del turno.
 * También guarda el detalle en reservasDetalleDB (log de reservas individuales).
 */
export let reservasDetalleDB = []

export function insertarReserva(datos) {
  const clave = claveReserva(datos.fecha, datos.turno)
  const mesas = datos.mesas ?? 1

  reservasOcupadasDB = {
    ...reservasOcupadasDB,
    [clave]: (reservasOcupadasDB[clave] ?? 0) + mesas,
  }

  const registro = {
    id: `RES-${Date.now()}`,
    ...datos,
    mesas,
  }
  reservasDetalleDB = [...reservasDetalleDB, registro]

  console.log('[BD Simulada] INSERT reserva:', registro)
  console.log(
    `[BD Simulada] Aforo ${clave}:`,
    `${reservasOcupadasDB[clave]}/${CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas`,
  )

  return registro
}

export function generarLocalizador() {
  const year = new Date().getFullYear()
  const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `#RE-${year}${sufijo}`
}

/** Agrupa menuData por categoría para renderizar la carta. */
export function obtenerMenuPorCategorias() {
  return menuData.reduce((acc, plato) => {
    if (!acc[plato.categoria]) acc[plato.categoria] = []
    acc[plato.categoria].push(plato)
    return acc
  }, {})
}

/** Formatea precio en euros (es-ES). */
export function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(precio)
}
