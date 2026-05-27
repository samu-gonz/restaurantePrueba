import express from 'express'
import cors from 'cors'

// Reutilizamos los datos reales del frontend (Pexels) para no duplicar.
// Nota: es un backend local; en producción esto iría en DB o en un paquete compartido.
import { CONFIG_RESTAURANTE, menuData } from '../frontend/src/data/dbSimulada.js'

const PORT = 5000
const FRONTEND_ORIGIN = 'http://localhost:5173'

const app = express()

app.use(express.json())
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  }),
)

// “Persistencia” en memoria (se pierde al reiniciar el servidor)
// clave: `${fecha}-${turno}` => mesasOcupadas (número)
const aforoPorTurno = new Map()

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

function generarLocalizador() {
  const year = new Date().getFullYear()
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `#RE-${year}${sufijo}`
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// GET /api/menu -> devuelve toda la carta
app.get('/api/menu', (_req, res) => {
  res.json(menuData)
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

  const turnoNormalizado = String(turno).toLowerCase()
  if (turnoNormalizado !== 'almuerzo' && turnoNormalizado !== 'cena') {
    return res.status(400).json({
      ok: false,
      error: 'Turno inválido. Usa: almuerzo o cena.',
    })
  }

  const clave = claveAforo(fecha, turnoNormalizado)
  const ocupadasActuales = aforoPorTurno.get(clave) ?? 0
  const limite = CONFIG_RESTAURANTE.TOTAL_MESAS_MAX ?? 30

  if (ocupadasActuales >= limite) {
    return res.status(400).json({
      ok: false,
      error: '🔴 Aforo completo: las 30 mesas de este turno ya están reservadas.',
    })
  }

  const nuevasOcupadas = ocupadasActuales + 1
  aforoPorTurno.set(clave, nuevasOcupadas)

  return res.status(201).json({
    ok: true,
    localizador: generarLocalizador(),
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
  console.log(`CORS permitido para ${FRONTEND_ORIGIN}`)
})

