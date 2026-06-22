import 'dotenv/config'
import crypto from 'crypto'
import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'

import {
  AforoCompletoError,
  contarMesasOcupadas,
  crearReserva,
  initReservasStore,
  listarReservasConAgrupacion,
  modoReservas,
} from './reservasStore.js'

const PORT = Number(process.env.PORT) || 5000
const MESAS_MAX = 30
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://restaurante-prueba-chi.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)
const CORS_LOCAL_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/
const CORS_VERCEL_REGEX = /^https:\/\/[a-z0-9-]+\.vercel\.app$/
const CORREO_DUENO = 'samuelgonz2006@gmail.com'
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'El Realejo Tascas <onboarding@resend.dev>'
const ADMIN_USER = process.env.ADMIN_USER ?? 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_TOKEN_SECRET =
  process.env.ADMIN_TOKEN_SECRET ?? ADMIN_PASSWORD ?? 'cambiar-secreto-admin'
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000

// 14 platos ampliados
const menuData = [
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

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        CORS_ORIGINS.includes(origin) ||
        CORS_LOCAL_REGEX.test(origin) ||
        CORS_VERCEL_REGEX.test(origin)
      ) {
        callback(null, true)
        return
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
)
app.use(express.json())

function crearTokenAdmin() {
  const payload = {
    rol: 'admin',
    exp: Date.now() + ADMIN_TOKEN_TTL_MS,
  }
  const datos = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const firma = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(datos).digest('base64url')
  return `${datos}.${firma}`
}

function verificarTokenAdmin(token) {
  if (!token || typeof token !== 'string') return false

  const [datos, firma] = token.split('.')
  if (!datos || !firma) return false

  const firmaEsperada = crypto
    .createHmac('sha256', ADMIN_TOKEN_SECRET)
    .update(datos)
    .digest('base64url')

  if (firma !== firmaEsperada) return false

  try {
    const payload = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'))
    return payload.rol === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}

function credencialesAdminValidas(usuario, contrasena) {
  const usuarioNormalizado = normalizarTexto(String(usuario ?? ''))
  const contrasenaEnviada = String(contrasena ?? '')

  return (
    usuarioNormalizado === normalizarTexto(ADMIN_USER) && contrasenaEnviada === 'admin'
  )
}

function middlewareAdmin(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      ok: false,
      error: 'Panel de administración no configurado en el servidor.',
    })
  }

  const encabezado = req.headers.authorization ?? ''
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : ''

  if (!verificarTokenAdmin(token)) {
    return res.status(401).json({
      ok: false,
      error: 'Acceso no autorizado. Inicia sesión de nuevo.',
    })
  }

  next()
}


const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, '')
const transporter =
  emailUser && emailPass
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 12_000,
        greetingTimeout: 12_000,
        socketTimeout: 15_000,
      })
    : null
const emailFromAddress = emailUser
  ? `"El Realejo Tascas" <${emailUser}>`
  : null

async function enviarConResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const detalle = await response.text()
    throw new Error(`Resend ${response.status}: ${detalle}`)
  }

  return response.json()
}

async function enviarConGmail({ to, subject, html }) {
  if (!transporter) {
    throw new Error('Gmail no configurado (EMAIL_USER / EMAIL_PASS)')
  }

  return transporter.sendMail({
    from: emailFromAddress,
    to,
    subject,
    html,
  })
}

async function enviarCorreosReserva({
  nombre,
  email,
  fecha,
  turno,
  localizador,
}) {
  const htmlCliente = plantillaBaseReserva({
    titulo: 'El Realejo Tascas',
    subtitulo: 'Tu reserva está confirmada. ¡Gracias por elegirnos!',
    nombre,
    email,
    fecha,
    turno,
    localizador,
  })

  const htmlDueno = plantillaBaseReserva({
    titulo: 'Nueva reserva registrada',
    subtitulo: 'Aviso interno para equipo de gestión del restaurante.',
    nombre,
    email,
    fecha,
    turno,
    localizador,
  })

  const subjectCliente = `¡Reserva Confirmada! 🍷 El Realejo Tascas - Localizador ${localizador}`
  const subjectDueno = `🚨 NUEVA RESERVA RECIBIDA - ${localizador}`

  const enviar = RESEND_API_KEY ? enviarConResend : enviarConGmail

  const [infoCliente, infoDueno] = await Promise.all([
    enviar({ to: email, subject: subjectCliente, html: htmlCliente }),
    enviar({ to: CORREO_DUENO, subject: subjectDueno, html: htmlDueno }),
  ])

  console.log('📬 Correo de cliente enviado:', infoCliente?.id ?? infoCliente?.response)
  console.log('🏪 Correo de dueño enviado:', infoDueno?.id ?? infoDueno?.response)
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim()
}

function parseFechaLocal(fechaISO) {
  const [y, m, d] = String(fechaISO).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function esDiaCerrado(fechaISO) {
  const fecha = parseFechaLocal(fechaISO)
  if (!fecha || Number.isNaN(fecha.getTime())) return null
  const day = fecha.getDay()
  return day === 1 || day === 2
}

function claveAforo(fecha, turno) {
  return `${fecha}-${turno}`
}

function normalizarTurno(turno) {
  const t = String(turno ?? '').toLowerCase()
  if (t !== 'almuerzo' && t !== 'cena') return null
  return t
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

function valorOrdenCategoria(categoria) {
  const orden = { entrantes: 0, carnes: 1, pescados: 2, postres: 3 }
  return orden[categoria] ?? 99
}

function turnoHumanReadable(turno) {
  return turno === 'almuerzo' ? 'Almuerzo (12:00 – 16:00)' : 'Cena (19:30 – 23:00)'
}

function plantillaBaseReserva({ titulo, subtitulo, nombre, email, fecha, turno, localizador }) {
  return `
  <div style="margin:0;padding:24px;background:#0D0D0D;color:#F5F5F5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#161616;border:1px solid #262626;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 20px;border-bottom:1px solid #262626;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">${titulo}</h1>
        <p style="margin:8px 0 0;color:#A3A3A3;">${subtitulo}</p>
      </div>
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#A3A3A3;">Nombre</td><td style="padding:8px 0;text-align:right;color:#F5F5F5;">${nombre}</td></tr>
          <tr><td style="padding:8px 0;color:#A3A3A3;">Email</td><td style="padding:8px 0;text-align:right;color:#F5F5F5;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#A3A3A3;">Fecha</td><td style="padding:8px 0;text-align:right;color:#F5F5F5;">${fecha}</td></tr>
          <tr><td style="padding:8px 0;color:#A3A3A3;">Turno</td><td style="padding:8px 0;text-align:right;color:#F5F5F5;">${turnoHumanReadable(turno)}</td></tr>
        </table>
        <div style="margin-top:18px;padding:14px;border:1px dashed #9B111E;border-radius:10px;background:#111;">
          <p style="margin:0 0 8px;color:#A3A3A3;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Localizador</p>
          <p style="margin:0;font-size:26px;font-weight:800;color:#9B111E;">${localizador}</p>
        </div>
      </div>
    </div>
  </div>
  `
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    admin: {
      configurado: Boolean(ADMIN_PASSWORD),
      longitudClave: ADMIN_PASSWORD ? ADMIN_PASSWORD.length : 0,
    },
  })
})

app.get('/api/menu', (_req, res) => {
  const menuOrdenado = menuData.slice().sort((a, b) => {
    const categoriaA = valorOrdenCategoria(a.categoria)
    const categoriaB = valorOrdenCategoria(b.categoria)
    if (categoriaA !== categoriaB) return categoriaA - categoriaB
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  })
  res.json(menuOrdenado)
})

app.get('/api/disponibilidad', async (req, res) => {
  const fecha = String(req.query.fecha ?? '')
  const turno = normalizarTurno(req.query.turno)

  if (!fecha || !turno) {
    return res.status(400).json({
      ok: false,
      error: 'Parámetros inválidos. Usa fecha (YYYY-MM-DD) y turno (almuerzo|cena).',
    })
  }

  const cerrado = esDiaCerrado(fecha)
  if (cerrado === null) {
    return res.status(400).json({
      ok: false,
      error: 'Fecha inválida. Usa el formato YYYY-MM-DD.',
    })
  }

  try {
    const ocupadas = await contarMesasOcupadas(fecha, turno)
    const libres = Math.max(0, MESAS_MAX - ocupadas)

    return res.json({
      mesasOcupadas: ocupadas,
      mesasLibres: libres,
      estado: calcularEstadoAforo(libres),
    })
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error)
    return res.status(500).json({
      ok: false,
      error: 'No se pudo consultar la disponibilidad.',
    })
  }
})

app.post('/api/admin/login', (req, res) => {
  const { usuario, contrasena } = req.body ?? {}

  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      ok: false,
      error: 'Panel de administración no configurado. Define ADMIN_PASSWORD en el servidor.',
    })
  }

  const usuarioNormalizado = normalizarTexto(String(usuario ?? ''))
  const contrasenaEnviada = String(contrasena ?? '')

  if (!credencialesAdminValidas(usuarioNormalizado, contrasenaEnviada)) {
    return res.status(401).json({
      ok: false,
      error: 'Usuario o contraseña incorrectos.',
    })
  }

  return res.json({
    ok: true,
    token: crearTokenAdmin(),
    expiraEnHoras: ADMIN_TOKEN_TTL_MS / (60 * 60 * 1000),
  })
})

app.get('/api/admin/reservas', middlewareAdmin, async (req, res) => {
  const fechaFiltro = normalizarTexto(req.query.fecha) || undefined

  try {
    const resultado = await listarReservasConAgrupacion({ fecha: fechaFiltro })
    return res.json(resultado)
  } catch (error) {
    console.error('Error al listar reservas:', error)
    return res.status(500).json({
      ok: false,
      error: 'No se pudieron cargar las reservas.',
    })
  }
})

app.post('/api/reservas', async (req, res) => {
  const { fecha, turno, nombre, email } = req.body ?? {}
  const fechaNormalizada = normalizarTexto(fecha)
  const nombreNormalizado = normalizarTexto(nombre)
  const emailNormalizado = normalizarTexto(email).toLowerCase()

  if (!fechaNormalizada || !turno || !nombreNormalizado || !emailNormalizado) {
    return res.status(400).json({
      ok: false,
      error: 'Faltan datos. Requiere: nombre, email, fecha y turno.',
    })
  }

  if (nombreNormalizado.length < 2) {
    return res.status(400).json({
      ok: false,
      error: 'Nombre inválido. Indica un nombre real de al menos 2 caracteres.',
    })
  }

  if (!EMAIL_REGEX.test(emailNormalizado)) {
    return res.status(400).json({
      ok: false,
      error: 'Correo electrónico inválido. Revisa el formato e inténtalo de nuevo.',
    })
  }

  const cerrado = esDiaCerrado(fechaNormalizada)
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

  const clave = claveAforo(fechaNormalizada, turnoNormalizado)
  const localizador = generarLocalizador()

  try {
    await crearReserva({
      nombre: nombreNormalizado,
      email: emailNormalizado,
      fecha: fechaNormalizada,
      turno: turnoNormalizado,
      localizador,
      mesasMax: MESAS_MAX,
    })
  } catch (error) {
    if (error instanceof AforoCompletoError) {
      return res.status(400).json({
        ok: false,
        error: '⚫ Aforo completo de 30 mesas. Por favor, selecciona otra fecha o turno.',
      })
    }
    console.error('Error al guardar reserva:', error)
    return res.status(500).json({
      ok: false,
      error: 'No se pudo registrar la reserva. Inténtalo de nuevo.',
    })
  }

  const nuevasOcupadas = await contarMesasOcupadas(fechaNormalizada, turnoNormalizado)

  res.status(201).json({
    ok: true,
    localizador,
    reserva: {
      fecha: fechaNormalizada,
      turno: turnoNormalizado,
      nombre: nombreNormalizado,
      email: emailNormalizado,
    },
    aforo: {
      ocupadas: nuevasOcupadas,
      maximo: MESAS_MAX,
      clave,
    },
  })

  void enviarCorreosReserva({
    nombre: nombreNormalizado,
    email: emailNormalizado,
    fecha: fechaNormalizada,
    turno: turnoNormalizado,
    localizador,
  }).catch((error) => {
    console.error('Fallo al enviar correos:', error)
  })
})

try {
  await initReservasStore()
} catch (error) {
  console.error('[reservas] Error fatal:', error.message)
  process.exit(1)
}

app.listen(PORT, () => {
  console.log(`Backend Guachinche El Realejo listo en http://localhost:${PORT}`)
  console.log('CORS activo para:', CORS_ORIGINS.join(', ') || '(ningún origen configurado)')
  console.log('[reservas] Almacenamiento:', modoReservas() === 'mysql' ? 'MySQL' : 'archivo JSON')
  if (RESEND_API_KEY) {
    console.log('[email] Resend activo →', RESEND_FROM_EMAIL)
  } else if (transporter) {
    console.log('[email] Gmail SMTP activo →', emailUser)
  } else {
    console.warn('[email] Sin proveedor configurado. Añade RESEND_API_KEY o EMAIL_USER/EMAIL_PASS')
  }
  if (ADMIN_PASSWORD) {
    console.log('[admin] Panel protegido activo → usuario:', ADMIN_USER)
  } else {
    console.warn(
      '[admin] Sin ADMIN_PASSWORD en .env — añade ADMIN_PASSWORD y reinicia el servidor.',
    )
  }
})

