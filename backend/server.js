import express from 'express'
import cors from 'cors'

const PORT = 5000
const FRONTEND_ORIGINS = ['http://localhost:5173', 'http://localhost:5174']
const MESAS_MAX = 30

/**
 * Carta canaria ampliada (fuente backend).
 * Imágenes Pexels con parámetros estables para localhost.
 */
const menuData = [
  // Entrantes
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

  // Carnes
  {
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
    nombre: 'Cherne encebollado',
    categoria: 'pescados',
    precio: 13.9,
    imagen:
      'https://images.pexels.com/photos/3296275/pexels-photo-3296275.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Lomos de cherne guisados con cebolla pochada, vino blanco y laurel en salsa suave de la casa.',
    alergenos: ['Pescado'],
  },

  // Pescados
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
    nombre: 'Churros de pescado',
    categoria: 'pescados',
    precio: 10.6,
    imagen:
      'https://images.pexels.com/photos/6141040/pexels-photo-6141040.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Tiras crujientes de pescado fresco en fritura ligera, ideales para compartir con mojo y limón.',
    alergenos: ['Pescado', 'Gluten'],
  },

  // Postres
  {
    id: 12,
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
    id: 13,
    nombre: 'Quesillo canario',
    categoria: 'postres',
    precio: 4.5,
    imagen:
      'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Flan canario con leche condensada, caramelo casero y ralladura de limón, textura cremosa y suave.',
    alergenos: ['Lácteos', 'Huevo'],
  },
  {
    id: 14,
    nombre: 'Frangollo tradicional',
    categoria: 'postres',
    precio: 4.2,
    imagen:
      'https://images.pexels.com/photos/6546013/pexels-photo-6546013.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop',
    descripcion:
      'Postre típico elaborado con millo, leche, pasas, almendra y canela, cocinado al estilo de antes.',
    alergenos: ['Lácteos', 'Frutos secos'],
  },
]

const app = express()

app.use(express.json())
app.use(
  cors({
    origin(origin, callback) {
      // Permite herramientas sin origin (curl/postman) y los puertos de Vite en local.
      if (!origin || FRONTEND_ORIGINS.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
  }),
)

// “Persistencia” en memoria (se pierde al reiniciar el servidor)
// clave: `${fecha}-${turno}` => mesasOcupadas (número)
const aforoPorTurno = new Map()
const reservasRegistradas = []

function parseFechaLocal(fechaISO) {
  // Espera formato YYYY-MM-DD
  const [y, m, d] = String(fechaISO).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function esDiaCerrado(fechaISO) {
  const fecha = parseFechaLocal(fechaISO)
  if (!fecha || Number.isNaN(fecha.getTime())) return null
  const day = fecha.getDay() // 0=domingo, 1=lunes, 2=martes...
  return day === 1 || day === 2
}

function claveAforo(fecha, turno) {
  return `${fecha}-${turno}`
}

function normalizarTurno(turno) {
  const turnoNormalizado = String(turno ?? '').toLowerCase()
  if (turnoNormalizado !== 'almuerzo' && turnoNormalizado !== 'cena') {
    return null
  }
  return turnoNormalizado
}

function calcularEstadoAforo(mesasLibres) {
  if (mesasLibres <= 0) return 'completo'
  if (mesasLibres < 5) return 'ultimas_plazas'
  return 'disponible'
}

function generarLocalizador() {
  const year = new Date().getFullYear()
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `#RE-${year}${sufijo}`
}

function valorOrdenTurno(turno) {
  return turno === 'almuerzo' ? 0 : 1
}

function valorOrdenCategoria(categoria) {
  const orden = {
    entrantes: 0,
    carnes: 1,
    pescados: 2,
    postres: 3,
  }
  return orden[categoria] ?? 99
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// GET /api/menu -> devuelve toda la carta
app.get('/api/menu', (_req, res) => {
  const menuOrdenado = menuData.slice().sort((a, b) => {
    const categoriaA = valorOrdenCategoria(a.categoria)
    const categoriaB = valorOrdenCategoria(b.categoria)

    if (categoriaA !== categoriaB) {
      return categoriaA - categoriaB
    }
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  })

  res.json(menuOrdenado)
})

// GET /api/disponibilidad?fecha=YYYY-MM-DD&turno=almuerzo|cena
app.get('/api/disponibilidad', (req, res) => {
  const fecha = String(req.query.fecha ?? '')
  const turno = normalizarTurno(req.query.turno)

  if (!fecha || !turno) {
    return res.status(400).json({
      ok: false,
      error: 'Parámetros inválidos. Usa fecha (YYYY-MM-DD) y turno (almuerzo|cena).',
    })
  }

  const cerrrado = esDiaCerrado(fecha)
  if (cerrrado === null) {
    return res.status(400).json({
      ok: false,
      error: 'Fecha inválida. Usa el formato YYYY-MM-DD.',
    })
  }

  const limite = MESAS_MAX
  const ocupadas = aforoPorTurno.get(claveAforo(fecha, turno)) ?? 0
  const libres = Math.max(0, limite - ocupadas)

  return res.json({
    mesasOcupadas: ocupadas,
    mesasLibres: libres,
    estado: calcularEstadoAforo(libres),
  })
})

// GET /api/admin/reservas
// Devuelve todas las reservas ordenadas cronológicamente por fecha y turno.
app.get('/api/admin/reservas', (_req, res) => {
  const reservasOrdenadas = reservasRegistradas
    .slice()
    .sort((a, b) => {
      if (a.fecha === b.fecha) {
        return valorOrdenTurno(a.turno) - valorOrdenTurno(b.turno)
      }
      return a.fecha.localeCompare(b.fecha)
    })

  return res.json({
    total: reservasOrdenadas.length,
    reservas: reservasOrdenadas,
  })
})

// POST /api/reservas
// body: { fecha: 'YYYY-MM-DD', turno: 'almuerzo'|'cena', nombre: string }
app.post('/api/reservas', (req, res) => {
  const { fecha, turno, nombre } = req.body ?? {}

  if (!fecha || !turno || !nombre) {
    return res.status(400).json({
      ok: false,
      error: 'Faltan datos. Requiere: fecha, turno, nombre.',
    })
  }

  const cerrado = esDiaCerrado(fecha)
  if (cerrado === null) {
    return res.status(400).json({
      ok: false,
      error: 'Fecha inválida. Usa el formato YYYY-MM-DD.',
    })
  }

  if (cerrado) {
    return res.status(400).json({
      ok: false,
      error: 'El guachinche permanece cerrado los lunes y martes.',
    })
  }

  const turnoNormalizado = normalizarTurno(turno)
  if (!turnoNormalizado) {
    return res.status(400).json({
      ok: false,
      error: 'Turno inválido. Usa: almuerzo o cena.',
    })
  }

  const clave = claveAforo(fecha, turnoNormalizado)
  const ocupadasActuales = aforoPorTurno.get(clave) ?? 0
  const limite = MESAS_MAX

  if (ocupadasActuales >= limite) {
    return res.status(400).json({
      ok: false,
      error: '🔴 Aforo completo: las 30 mesas de este turno ya están reservadas.',
    })
  }

  const nuevasOcupadas = ocupadasActuales + 1
  aforoPorTurno.set(clave, nuevasOcupadas)
  const localizador = generarLocalizador()

  reservasRegistradas.push({
    id: reservasRegistradas.length + 1,
    nombre: String(nombre),
    fecha,
    turno: turnoNormalizado,
    localizador,
    createdAt: new Date().toISOString(),
  })

  return res.status(201).json({
    ok: true,
    localizador,
    reserva: {
      fecha,
      turno: turnoNormalizado,
      nombre: String(nombre),
    },
    aforo: {
      ocupadas: nuevasOcupadas,
      maximo: limite,
      clave,
    },
  })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend Guachinche El Realejo listo en http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`CORS permitido para: ${FRONTEND_ORIGINS.join(', ')}`)
})

