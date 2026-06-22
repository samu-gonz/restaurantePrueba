import { API_BASE_URL, backendConfigurado } from '../config/api'
import i18n from '../i18n'

import {
  esDiaCerrado,
  parsearFechaDesdeTexto,
  parsearHoraDesdeTexto,
  turnoDesdeHora,
} from './disponibilidadConsulta'
import { agregarReservaAlCacheLocal, crearReservaLocal } from './reservasStorage'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function extraerEmail(texto) {
  const coincidencia = texto.match(/[\w.+-]+@[\w.-]+\.\w{2,}/i)
  return coincidencia ? coincidencia[0].toLowerCase() : null
}

function extraerNombre(texto) {
  const patrones = [
    /a\s+nombre\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ][\w\s.'-]{0,38})\s*(?:y\s+(?:correo|email)|,|\s+correo|\s+email)/i,
    /nombre\s*(?:de\s*)?:?\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ][^\n,;@]{1,40}?)(?:\s+y\s+|\s+correo|\s+email|,|@|$)/i,
    /\bsoy\s+([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ][a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]{1,30})\b/i,
    /(?:me llamo|mi nombre es)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ][a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]{1,30})\b/i,
    /(?:book(?:ing)?|reserve)\s+(?:for|under)\s+([a-zA-Z][\w\s.'-]{1,30})/i,
    /(?:name|nom)\s*:?\s*([a-zA-Z][\w\s.'-]{1,30})(?:\s*,|\s+email|\s+e-mail|@)/i,
    /(?:my name is|i am|i'm)\s+([a-zA-Z][\w\s.'-]{1,30})\b/i,
    /(?:reserv(?:e|er|ierung))\s+(?:für|pour|for)\s+([a-zA-ZäöüÄÖÜ][\w\s.'-]{1,30})/i,
    /(?:nom|name)\s+(?:de\s+|du\s+)?([a-zA-Zàâçéèêëîïôùûü][\w\s.'-]{1,30})/i,
  ]

  for (const patron of patrones) {
    const coincidencia = texto.match(patron)
    if (coincidencia?.[1]) {
      return coincidencia[1].trim()
    }
  }

  return null
}

export function esSolicitudCrearReserva(texto) {
  const normalizado = normalizarTexto(texto)
  const verbosReserva = [
    'reservar',
    'reservame',
    'reserva para',
    'reserva a nombre',
    'realiza una reserva',
    'realizar una reserva',
    'haz una reserva',
    'hazme una reserva',
    'quiero reservar',
    'quiero una reserva',
    'apartar mesa',
    'apartame',
    'hacer una reserva',
    'confirmar reserva',
    'book',
    'booking',
    'reserve',
    'reservation',
    'reserver',
    'reservation',
    'reservierung',
    'tisch reservieren',
    'table reserver',
  ]

  const esAccion = verbosReserva.some((verbo) => normalizado.includes(verbo))
  const tieneEmail = EMAIL_REGEX.test(texto)
  const mencionaNombre =
    /a nombre|nombre:|nombre de|soy [a-z]|me llamo|mi nombre es|book for|reserve for|my name|nom:|name:|reservierung für|reserver pour/i.test(
      texto,
    )

  return esAccion && (tieneEmail || mencionaNombre)
}

export function interpretarSolicitudReserva(texto) {
  if (!esSolicitudCrearReserva(texto)) return null

  const email = extraerEmail(texto)
  const nombre = extraerNombre(texto)
  const fecha = parsearFechaDesdeTexto(texto)
  const hora = parsearHoraDesdeTexto(texto)
  const normalizado = normalizarTexto(texto)

  let turno = null
  if (
    normalizado.includes('almuerzo') ||
    normalizado.includes('comida') ||
    normalizado.includes('lunch') ||
    normalizado.includes('dejeuner') ||
    normalizado.includes('mittagessen')
  ) {
    turno = 'almuerzo'
  } else if (
    normalizado.includes('cena') ||
    normalizado.includes('dinner') ||
    normalizado.includes('diner') ||
    normalizado.includes('abendessen')
  ) {
    turno = 'cena'
  } else if (hora) {
    turno = turnoDesdeHora(hora.horas, hora.minutos).turno
  } else {
    turno = 'cena'
  }

  if (fecha && esDiaCerrado(fecha)) {
    return { error: 'cerrado', fecha, turno }
  }

  const faltan = []
  if (!nombre) faltan.push(i18n.t('chatbot.fieldName'))
  if (!email) faltan.push(i18n.t('chatbot.fieldEmail'))
  if (!fecha) faltan.push(i18n.t('chatbot.fieldDate'))

  return {
    nombre,
    email,
    fecha,
    turno,
    hora,
    faltan,
    completo: faltan.length === 0 && Boolean(email && EMAIL_REGEX.test(email)),
  }
}

export async function ejecutarReservaDesdeChat({ nombre, email, fecha, turno }) {
  const payload = {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    fecha,
    turno,
  }

  if (!backendConfigurado()) {
    return crearReservaLocal(payload)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(`${API_BASE_URL}/api/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || i18n.t('reservas.bookingFailed'))
    }

    if (data?.localizador) {
      agregarReservaAlCacheLocal({
        ...data.reserva,
        localizador: data.localizador,
      })
    }

    return data
  } finally {
    window.clearTimeout(timeoutId)
  }
}
