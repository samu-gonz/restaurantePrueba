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

/** URLs Pexels — compatibles con localhost (sin hotlinking agresivo) */
export const IMAGEN_CARTA_FALLBACK =
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'

export const IMAGEN_HERO_BODEGA =
  'https://images.pexels.com/photos/340592/pexels-photo-340592.jpeg?auto=compress&cs=tinysrgb&w=1400&h=1000&fit=crop'

export const menuData = [
  {
    id: 1,
    nombre: 'Queso Asado con Mojos',
    categoria: 'entrantes',
    precio: 6.8,
    imagen:
      'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
      'https://images.pexels.com/photos/691114/pexels-photo-691114.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
      'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
      'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
      'https://images.pexels.com/photos/45201/pexels-photo-45201.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
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
