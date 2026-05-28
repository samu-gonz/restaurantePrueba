import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'

const PORT = 5000
const MESAS_MAX = 30
const ORIGENES_LOCALES_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const CORREO_DUENO = 'samuelgonz2006@gmail.com'

let transporter = null
let emailFromAddress = null

const menuData = [
  { id: 1, nombre: 'Queso asado con mojos', categoria: 'entrantes', precio: 7.2, imagen: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Queso palmero a la plancha, dorado al momento y servido con mojo rojo picón y mojo verde de cilantro.', alergenos: ['Lácteos'] },
  { id: 2, nombre: 'Garbanzas compuestas', categoria: 'entrantes', precio: 6.9, imagen: 'https://images.pexels.com/photos/5949914/pexels-photo-5949914.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Garbanzas guisadas a fuego lento con sofrito casero, verdura de temporada y toque ahumado tradicional.', alergenos: [] },
  { id: 3, nombre: 'Croquetas caseras del día', categoria: 'entrantes', precio: 6.5, imagen: 'https://images.pexels.com/photos/4198023/pexels-photo-4198023.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Croquetas cremosas con rebozado crujiente, elaboradas cada mañana según receta de la casa.', alergenos: ['Gluten', 'Lácteos', 'Huevo'] },
  { id: 4, nombre: 'Escaldón de gofio', categoria: 'entrantes', precio: 5.8, imagen: 'https://images.pexels.com/photos/691114/pexels-photo-691114.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Gofio amasado con caldo sabroso, cebolla roja y queso curado rallado al estilo de las tascas canarias.', alergenos: ['Gluten', 'Lácteos'] },
  { id: 5, nombre: 'Costillas con papas y piña', categoria: 'carnes', precio: 14.0, imagen: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Costillas saladas cocidas a fuego lento, papas arrugadas y piña de millo con mojo verde.', alergenos: [] },
  { id: 6, nombre: 'Carne de fiesta', categoria: 'carnes', precio: 11.2, imagen: 'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Tacos de cerdo adobados durante 24 horas con ajo, orégano y pimentón, servidos con papas fritas.', alergenos: [] },
  { id: 7, nombre: 'Secreto ibérico a la brasa', categoria: 'carnes', precio: 15.5, imagen: 'https://images.pexels.com/photos/1833330/pexels-photo-1833330.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Corte jugoso de cerdo ibérico marcado a la brasa, acompañado de verduras asadas y papas de la tierra.', alergenos: [] },
  { id: 8, nombre: 'Pollo al salmorejo', categoria: 'carnes', precio: 10.8, imagen: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Pollo de corral macerado en salmorejo canario, dorado en sartén y terminado con su salsa especiada.', alergenos: [] },
  { id: 15, nombre: 'Vino de la Casa 1L', categoria: 'entrantes', precio: 8.5, imagen: 'https://images.pexels.com/photos/2903126/pexels-photo-2903126.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Vino de la casa servido en jarra de 1 litro, con carácter volcánico y notas afrutadas.', alergenos: ['Sulfitos'] },
  { id: 9, nombre: 'Bacalao encebollado', categoria: 'pescados', precio: 12.8, imagen: 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Bacalao confitado con cebolla caramelizada y toque de vino blanco, receta marinera de tradición.', alergenos: ['Pescado'] },
  { id: 10, nombre: 'Cherne encebollado', categoria: 'pescados', precio: 13.9, imagen: 'https://images.pexels.com/photos/3296275/pexels-photo-3296275.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Lomos de cherne guisados con cebolla pochada, vino blanco y laurel en salsa suave de la casa.', alergenos: ['Pescado'] },
  { id: 11, nombre: 'Churros de pescado', categoria: 'pescados', precio: 10.6, imagen: 'https://images.pexels.com/photos/6141040/pexels-photo-6141040.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Tiras crujientes de pescado fresco en fritura ligera, ideales para compartir con mojo y limón.', alergenos: ['Pescado', 'Gluten'] },
  { id: 12, nombre: 'Polvito uruguayo', categoria: 'postres', precio: 4.9, imagen: 'https://images.pexels.com/photos/45201/pexels-photo-45201.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Postre artesanal de galleta, dulce de leche, nata montada y merengue, servido bien fresquito.', alergenos: ['Gluten', 'Lácteos'] },
  { id: 13, nombre: 'Quesillo canario', categoria: 'postres', precio: 4.5, imagen: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Flan canario con leche condensada, caramelo casero y ralladura de limón, textura cremosa y suave.', alergenos: ['Lácteos', 'Huevo'] },
  { id: 14, nombre: 'Frangollo tradicional', categoria: 'postres', precio: 4.2, imagen: 'https://images.pexels.com/photos/6546013/pexels-photo-6546013.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop', descripcion: 'Postre típico elaborado con millo, leche, pasas, almendra y canela, cocinado al estilo de antes.', alergenos: ['Lácteos', 'Frutos secos'] },
]

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ORIGENES_LOCALES_REGEX.test(origin)) {
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

const aforoPorTurno = new Map()
const reservasRegistradas = []

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

function valorOrdenTurno(turno) {
  return turno === 'almuerzo' ? 0 : 1
}

function valorOrdenCategoria(categoria) {
  const orden = { entrantes: 0, carnes: 1, pescados: 2, postres: 3 }
  return orden[categoria] ?? 99
}

function turnoHumanReadable(turno) {
  return turno === 'almuerzo' ? 'Almuerzo (12:00 – 16:00)' : 'Cena (19:30 – 23:00)'
}

function plantillaHtmlConfirmacion({ nombre, fecha, turno, localizador }) {
  return `
  <div style="margin:0;padding:24px;background:#0D0D0D;color:#F5F5F5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#161616;border:1px solid #262626;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 20px;border-bottom:1px solid #262626;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">El Realejo Tascas</h1>
        <p style="margin:8px 0 0;color:#A3A3A3;">¡Reserva confirmada! Gracias por elegirnos 🍷</p>
      </div>
      <div style="padding:20px;">
        <p style="margin:0 0 14px;color:#D4D4D4;">Hola <strong>${nombre}</strong>, te esperamos para disfrutar de la auténtica comida canaria.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#A3A3A3;">Nombre</td>
            <td style="padding:8px 0;text-align:right;color:#F5F5F5;">${nombre}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#A3A3A3;">Fecha</td>
            <td style="padding:8px 0;text-align:right;color:#F5F5F5;">${fecha}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#A3A3A3;">Turno</td>
            <td style="padding:8px 0;text-align:right;color:#F5F5F5;">${turnoHumanReadable(turno)}</td>
          </tr>
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

async function inicializarEmail() {
  const account = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  })
  emailFromAddress = `"El Realejo Tascas" <${account.user}>`
  console.log('[email] Ethereal inicializado correctamente')
  console.log(`[email] Cuenta de pruebas: ${account.user}`)
}

async function enviarCorreosReserva({ nombre, email, fecha, turno, localizador }) {
  if (!transporter || !emailFromAddress) {
    throw new Error(
      'Sistema de correo no inicializado. Se esperaba transporter global de Ethereal.',
    )
  }

  const subjectCliente = `¡Reserva Confirmada! 🍷 El Realejo Tascas - Localizador ${localizador}`
  const htmlCliente = plantillaHtmlConfirmacion({ nombre, fecha, turno, localizador })
  const htmlDueno = `
  <div style="margin:0;padding:24px;background:#0D0D0D;color:#F5F5F5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#161616;border:1px solid #262626;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 20px;border-bottom:1px solid #262626;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">Nueva reserva registrada</h1>
        <p style="margin:8px 0 0;color:#A3A3A3;">Aviso interno para equipo de gestión del restaurante.</p>
      </div>
      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#A3A3A3;">Cliente</td><td style="padding:8px 0;text-align:right;color:#F5F5F5;">${nombre}</td></tr>
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

  const [infoCliente, infoDueno] = await Promise.all([
    transporter.sendMail({
      from: emailFromAddress,
      to: email,
      subject: subjectCliente,
      html: htmlCliente,
    }),
    transporter.sendMail({
      from: emailFromAddress,
      to: CORREO_DUENO,
      subject: `🚨 NUEVA RESERVA RECIBIDA - ${localizador}`,
      html: htmlDueno,
    }),
  ])

  console.log(
    '📬 URL de prueba para el correo del Cliente: ',
    nodemailer.getTestMessageUrl(infoCliente),
  )
  console.log(
    '🏪 URL de prueba para el correo del Dueño: ',
    nodemailer.getTestMessageUrl(infoDueno),
  )
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/menu', (_req, res) => {
  console.log('Petición GET /api/menu recibida con éxito')
  const menuOrdenado = menuData.slice().sort((a, b) => {
    const categoriaA = valorOrdenCategoria(a.categoria)
    const categoriaB = valorOrdenCategoria(b.categoria)
    if (categoriaA !== categoriaB) return categoriaA - categoriaB
    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  })
  res.json(menuOrdenado)
})

app.get('/api/disponibilidad', (req, res) => {
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

  const ocupadas = aforoPorTurno.get(claveAforo(fecha, turno)) ?? 0
  const libres = Math.max(0, MESAS_MAX - ocupadas)

  return res.json({
    mesasOcupadas: ocupadas,
    mesasLibres: libres,
    estado: calcularEstadoAforo(libres),
  })
})

app.get('/api/admin/reservas', (_req, res) => {
  const reservasOrdenadas = reservasRegistradas
    .slice()
    .sort((a, b) => (a.fecha === b.fecha ? valorOrdenTurno(a.turno) - valorOrdenTurno(b.turno) : a.fecha.localeCompare(b.fecha)))

  return res.json({
    total: reservasOrdenadas.length,
    reservas: reservasOrdenadas,
  })
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
  const ocupadasActuales = aforoPorTurno.get(clave) ?? 0
  if (ocupadasActuales >= MESAS_MAX) {
    return res.status(400).json({
      ok: false,
      error: '⚫ Aforo completo de 30 mesas. Por favor, selecciona otra fecha o turno.',
    })
  }

  const nuevasOcupadas = ocupadasActuales + 1
  aforoPorTurno.set(clave, nuevasOcupadas)
  const localizador = generarLocalizador()

  reservasRegistradas.push({
    id: reservasRegistradas.length + 1,
    nombre: nombreNormalizado,
    email: emailNormalizado,
    fecha: fechaNormalizada,
    turno: turnoNormalizado,
    localizador,
    createdAt: new Date().toISOString(),
  })

  // Envío rápido usando transporter global ya inicializado al arranque.
  try {
    await enviarCorreosReserva({
      nombre: nombreNormalizado,
      email: emailNormalizado,
      fecha: fechaNormalizada,
      turno: turnoNormalizado,
      localizador,
    })
  } catch (error) {
    console.error('Fallo al enviar correos (Ethereal):', error)
  }

  return res.status(201).json({
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
})

async function arrancarServidor() {
  try {
    await inicializarEmail()
  } catch (error) {
    console.error('[email] No se pudo inicializar Ethereal al arranque:', error)
    console.warn('[email] El backend seguirá activo, pero sin envío de correos.')
  }

  app.listen(PORT, () => {
    console.log(`Backend Guachinche El Realejo listo en http://localhost:${PORT}`)
    console.log('CORS activo para localhost/127.0.0.1 en cualquier puerto local')
  })
}

arrancarServidor()

