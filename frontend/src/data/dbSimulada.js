/**
 * Datos del Guachinche El Realejo (carta embebida — visible siempre, sin backend).
 */

export const CONFIG_RESTAURANTE = {
  TOTAL_MESAS_MAX: 30,
}

export const LIMITE_MESAS_POR_TURNO = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX

export const TURNOS = {
  ALMUERZO: 'almuerzo',
  CENA: 'cena',
}

export const IMAGEN_CARTA_FALLBACK =
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'

export const IMAGEN_HERO_BODEGA =
  'https://images.pexels.com/photos/340592/pexels-photo-340592.jpeg?auto=compress&cs=tinysrgb&w=1400&h=1000&fit=crop'

export const menuData = [
  {
    id: 1,
    nombre: 'Queso asado con mojos',
    categoria: 'entrantes',
    precio: 7.2,
    imagen:
      'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Queso palmero a la plancha, dorado al momento y servido con mojo rojo picón y mojo verde de cilantro.',
    alergenos: ['Lácteos'],
  },
  {
    id: 2,
    nombre: 'Garbanzas compuestas',
    categoria: 'entrantes',
    precio: 6.9,
    imagen:
      'https://images.pexels.com/photos/5949914/pexels-photo-5949914.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Garbanzas guisadas a fuego lento con sofrito casero, verdura de temporada y toque ahumado tradicional.',
    alergenos: [],
  },
  {
    id: 3,
    nombre: 'Croquetas caseras del día',
    categoria: 'entrantes',
    precio: 6.5,
    imagen:
      'https://images.pexels.com/photos/4198023/pexels-photo-4198023.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Croquetas cremosas con rebozado crujiente, elaboradas cada mañana según receta de la casa.',
    alergenos: ['Gluten', 'Lácteos', 'Huevo'],
  },
  {
    id: 4,
    nombre: 'Escaldón de gofio',
    categoria: 'entrantes',
    precio: 5.8,
    imagen:
      'https://images.pexels.com/photos/691114/pexels-photo-691114.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Gofio amasado con caldo sabroso, cebolla roja y queso curado rallado al estilo de las tascas canarias.',
    alergenos: ['Gluten', 'Lácteos'],
  },
  {
    id: 5,
    nombre: 'Vino de la Casa 1L',
    categoria: 'entrantes',
    precio: 8.5,
    imagen:
      'https://images.pexels.com/photos/2903126/pexels-photo-2903126.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Vino de la casa servido en jarra de 1 litro, con carácter volcánico y notas afrutadas.',
    alergenos: ['Sulfitos'],
  },
  {
    id: 6,
    nombre: 'Costillas con papas y piña',
    categoria: 'carnes',
    precio: 14.0,
    imagen:
      'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Costillas saladas cocidas a fuego lento, papas arrugadas y piña de millo con mojo verde.',
    alergenos: [],
  },
  {
    id: 7,
    nombre: 'Carne de fiesta',
    categoria: 'carnes',
    precio: 11.2,
    imagen:
      'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Tacos de cerdo adobados durante 24 horas con ajo, orégano y pimentón, servidos con papas fritas.',
    alergenos: [],
  },
  {
    id: 8,
    nombre: 'Secreto ibérico a la brasa',
    categoria: 'carnes',
    precio: 15.5,
    imagen:
      'https://images.pexels.com/photos/1833330/pexels-photo-1833330.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Corte jugoso de cerdo ibérico marcado a la brasa, acompañado de verduras asadas y papas de la tierra.',
    alergenos: [],
  },
  {
    id: 9,
    nombre: 'Pollo al salmorejo',
    categoria: 'carnes',
    precio: 10.8,
    imagen:
      'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Pollo de corral macerado en salmorejo canario, dorado en sartén y terminado con su salsa especiada.',
    alergenos: [],
  },
  {
    id: 10,
    nombre: 'Bacalao encebollado',
    categoria: 'pescados',
    precio: 12.8,
    imagen:
      'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Bacalao confitado con cebolla caramelizada y toque de vino blanco, receta marinera de tradición.',
    alergenos: ['Pescado'],
  },
  {
    id: 11,
    nombre: 'Cherne encebollado',
    categoria: 'pescados',
    precio: 13.9,
    imagen:
      'https://images.pexels.com/photos/3296275/pexels-photo-3296275.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Lomos de cherne guisados con cebolla pochada, vino blanco y laurel en salsa suave de la casa.',
    alergenos: ['Pescado'],
  },
  {
    id: 12,
    nombre: 'Churros de pescado',
    categoria: 'pescados',
    precio: 10.6,
    imagen:
      'https://images.pexels.com/photos/6141040/pexels-photo-6141040.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Tiras crujientes de pescado fresco en fritura ligera, ideales para compartir con mojo y limón.',
    alergenos: ['Pescado', 'Gluten'],
  },
  {
    id: 13,
    nombre: 'Polvito uruguayo',
    categoria: 'postres',
    precio: 4.9,
    imagen:
      'https://images.pexels.com/photos/45201/pexels-photo-45201.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Postre artesanal de galleta, dulce de leche, nata montada y merengue, servido bien fresquito.',
    alergenos: ['Gluten', 'Lácteos'],
  },
  {
    id: 14,
    nombre: 'Quesillo canario',
    categoria: 'postres',
    precio: 4.5,
    imagen:
      'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Flan canario con leche condensada, caramelo casero y ralladura de limón, textura cremosa y suave.',
    alergenos: ['Lácteos', 'Huevo'],
  },
]

export const CATEGORIAS_MENU = {
  entrantes: 'Entrantes',
  carnes: 'Carnes',
  pescados: 'Pescados',
  postres: 'Postres',
}

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
