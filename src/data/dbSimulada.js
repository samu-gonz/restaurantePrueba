/**
 * Datos semilla del Guachinche El Realejo.
 * reservasOcupadasIniciales → valor por defecto si localStorage está vacío.
 */

export const CONFIG_RESTAURANTE = {
  TOTAL_MESAS_MAX: 30,
}

export const LIMITE_MESAS_POR_TURNO = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX

export const TURNOS = {
  ALMUERZO: 'almuerzo',
  CENA: 'cena',
}

export const menuData = [
  {
    id: 1,
    nombre: 'Queso Asado con Mojos',
    categoria: 'entrantes',
    precio: 6.8,
    imagen:
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32a?auto=format&fit=crop&w=800&q=80',
    descripcion:
      'Queso ahumado de la isla a la plancha, acompañado de mojo verde de cilantro y rojo palmero.',
    alergenos: ['Lácteos'],
  },
  {
    id: 2,
    nombre: 'Escaldón de Gofio Premium',
    categoria: 'entrantes',
    precio: 5.5,
    imagen:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    descripcion:
      'Gofio local amasado con caldo de pescado de roca, cebolla roja, queso duro y un toque de mojo.',
    alergenos: ['Gluten', 'Lácteos'],
  },
  {
    id: 3,
    nombre: 'Carne Fiesta al Estilo Tradicional',
    categoria: 'carnes',
    precio: 10.5,
    imagen:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    descripcion:
      'Tacos de cerdo seleccionados, adobados durante 24h con ajo, orégano, pimentón y vino blanco, con papas fritas.',
    alergenos: [],
  },
  {
    id: 4,
    nombre: 'Costillas, Papas y Piña de Millo',
    categoria: 'carnes',
    precio: 13.5,
    imagen:
      'https://images.unsplash.com/photo-1529193591184-38314517f8f8?auto=format&fit=crop&w=800&q=80',
    descripcion:
      'Costilla de cerdo sazonada al punto de sal, papas de la tierra y piña de millo con mojo de cilantro.',
    alergenos: [],
  },
  {
    id: 5,
    nombre: 'Polvito Uruguayo Casero',
    categoria: 'postres',
    precio: 4.5,
    imagen:
      'https://images.unsplash.com/photo-1551024506-0bccd28d51b2?auto=format&fit=crop&w=800&q=80',
    descripcion:
      'Postre artesanal con base de galleta, dulce de leche premium, nata montada y suspiros de Moya.',
    alergenos: ['Lácteos', 'Gluten'],
  },
]

export const CATEGORIAS_MENU = {
  entrantes: 'Entrantes',
  carnes: 'Carnes',
  postres: 'Postres',
}

/** Estado inicial de aforo — se usa solo si localStorage está vacío. */
export const reservasOcupadasIniciales = {
  '2026-05-30-almuerzo': 28,
  '2026-05-30-cena': 30,
  '2026-05-31-almuerzo': 12,
}

export function claveReserva(fecha, turno) {
  return `${fecha}-${turno}`
}

export function generarLocalizador() {
  const year = new Date().getFullYear()
  const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `#RE-${year}${sufijo}`
}

export function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(precio)
}
