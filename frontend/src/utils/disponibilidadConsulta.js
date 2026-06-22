import { API_BASE_URL, backendConfigurado } from '../config/api'
import { CONFIG_RESTAURANTE } from '../data/db'
import i18n, { localeFecha } from '../i18n'
import { consultarDisponibilidadLocal } from './reservasStorage'

const DIAS_SEMANA = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
}

const PALABRAS_HOY = ['hoy', 'today', "aujourd'hui", 'aujourdhui', 'heute']
const PALABRAS_MANANA = ['manana', 'mañana', 'tomorrow', 'demain', 'morgen']
const PALABRAS_PASADO_MANANA = ['pasado manana', 'day after tomorrow', 'apres demain', 'übermorgen', 'ubermorgen']

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function formatearFechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function contienePalabra(texto, palabras) {
  return palabras.some((p) => {
    const n = normalizarTexto(p)
    return new RegExp(`\\b${n}\\b`).test(texto)
  })
}

function parsearDiaSemanaDesdeTexto(textoNormalizado) {
  const diaEncontrado = Object.entries(DIAS_SEMANA).find(([nombre]) => {
    const patronDia = new RegExp(`\\b${nombre}\\b`)
    return patronDia.test(textoNormalizado)
  })

  if (!diaEncontrado) return null

  const diaObjetivo = diaEncontrado[1]
  const hoy = new Date()
  const diaActual = hoy.getDay()
  let diasHasta = (diaObjetivo - diaActual + 7) % 7

  if (/\b(proxim[oa]|next|prochain|nächste|nachste)\b/.test(textoNormalizado) && diasHasta === 0) {
    diasHasta = 7
  }

  const fechaResultado = new Date(hoy)
  fechaResultado.setDate(hoy.getDate() + diasHasta)
  return formatearFechaISO(fechaResultado)
}

function textoMencionaFecha(textoNormalizado) {
  return (
    contienePalabra(textoNormalizado, PALABRAS_HOY) ||
    contienePalabra(textoNormalizado, PALABRAS_MANANA) ||
    contienePalabra(textoNormalizado, PALABRAS_PASADO_MANANA) ||
    /\b(\d{1,2})[\/\-](\d{1,2})/.test(textoNormalizado) ||
    Object.keys(DIAS_SEMANA).some((nombre) => new RegExp(`\\b${nombre}\\b`).test(textoNormalizado))
  )
}

function parsearFechaLocal(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function esDiaCerrado(fechaISO) {
  const dia = parsearFechaLocal(fechaISO).getDay()
  return dia === 1 || dia === 2
}

export function formatearFechaLegible(fechaISO) {
  const fecha = parsearFechaLocal(fechaISO)
  const hoy = formatearFechaISO(new Date())
  const manana = formatearFechaISO(new Date(Date.now() + 86_400_000))

  if (fechaISO === hoy) return i18n.t('common.today')
  if (fechaISO === manana) return i18n.t('common.tomorrow')

  return fecha.toLocaleDateString(localeFecha(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatearHora(horas, minutos) {
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

function convertirHora12a24(horas, minutos, meridiano) {
  if (meridiano === 'pm' && horas < 12) {
    return { horas: horas + 12, minutos }
  }
  if (meridiano === 'am' && horas === 12) {
    return { horas: 0, minutos }
  }
  return { horas, minutos }
}

function parsearHora12DesdeTexto(textoNormalizado) {
  const formatoAmPm = textoNormalizado.match(/(\d{1,2})(?::(\d{2}))?(?:\s*)?(am|pm)\b/)
  if (formatoAmPm) {
    const horas = Number(formatoAmPm[1])
    const minutos = formatoAmPm[2] ? Number(formatoAmPm[2]) : 0
    return convertirHora12a24(horas, minutos, formatoAmPm[3])
  }

  const formatoEspanol = textoNormalizado.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(?:de la (tarde|noche|manana))\b/,
  )
  if (formatoEspanol) {
    let horas = Number(formatoEspanol[1])
    const minutos = formatoEspanol[2] ? Number(formatoEspanol[2]) : 0
    const momento = formatoEspanol[3]

    if ((momento === 'tarde' || momento === 'noche') && horas < 12) {
      horas += 12
    }
    if (momento === 'manana' && horas === 12) {
      horas = 0
    }

    return { horas, minutos }
  }

  return null
}

export function parsearHoraDesdeTexto(texto) {
  const textoNormalizado = normalizarTexto(texto)

  const hora12 = parsearHora12DesdeTexto(textoNormalizado)
  if (hora12) return hora12

  const conMinutos = textoNormalizado.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (conMinutos) {
    return {
      horas: Number(conMinutos[1]),
      minutos: Number(conMinutos[2]),
    }
  }

  const soloHora = textoNormalizado.match(/\b(\d{1,2})\s*h(?:oras?|eure?)?\b/)
  if (soloHora) {
    return { horas: Number(soloHora[1]), minutos: 0 }
  }

  const aLas = textoNormalizado.match(
    /(?:a las|at|a|um|à)\s*(\d{1,2})(?::(\d{2}))?(?:\s*y\s*media)?(?:\s*de la (tarde|noche|manana))?/,
  )
  if (aLas) {
    let horas = Number(aLas[1])
    const minutos = aLas[2]
      ? Number(aLas[2])
      : textoNormalizado.includes('y media') || textoNormalizado.includes(':30')
        ? 30
        : 0

    if (aLas[3] === 'tarde' || aLas[3] === 'noche') {
      if (horas < 12) horas += 12
    } else if (aLas[3] === 'manana' && horas === 12) {
      horas = 0
    }

    return { horas, minutos }
  }

  return null
}

export function parsearFechaDesdeTexto(texto) {
  const textoNormalizado = normalizarTexto(texto)
  const referencia = new Date()

  if (contienePalabra(textoNormalizado, PALABRAS_HOY)) {
    return formatearFechaISO(referencia)
  }

  if (contienePalabra(textoNormalizado, PALABRAS_MANANA)) {
    referencia.setDate(referencia.getDate() + 1)
    return formatearFechaISO(referencia)
  }

  if (contienePalabra(textoNormalizado, PALABRAS_PASADO_MANANA)) {
    referencia.setDate(referencia.getDate() + 2)
    return formatearFechaISO(referencia)
  }

  const fechaNumerica = textoNormalizado.match(
    /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
  )
  if (fechaNumerica) {
    const dia = Number(fechaNumerica[1])
    const mes = Number(fechaNumerica[2])
    let anio = fechaNumerica[3] ? Number(fechaNumerica[3]) : referencia.getFullYear()
    if (anio < 100) anio += 2000
    return formatearFechaISO(new Date(anio, mes - 1, dia))
  }

  const diaSemana = parsearDiaSemanaDesdeTexto(textoNormalizado)
  if (diaSemana) return diaSemana

  if (textoMencionaFecha(textoNormalizado)) return null

  return formatearFechaISO(new Date())
}

export function turnoDesdeHora(horas, minutos) {
  const tiempo = horas + minutos / 60

  if (tiempo >= 12 && tiempo <= 16) {
    return { turno: 'almuerzo', dentroHorario: true }
  }

  if (tiempo >= 19.5 && tiempo <= 23) {
    return { turno: 'cena', dentroHorario: true }
  }

  if (tiempo > 16 && tiempo < 19.5) {
    return {
      turno: 'cena',
      dentroHorario: false,
      aviso: i18n.t('disponibilidad.betweenShifts'),
    }
  }

  if (tiempo < 12) {
    return {
      turno: 'almuerzo',
      dentroHorario: false,
      aviso: i18n.t('disponibilidad.lunchOpens'),
    }
  }

  return {
    turno: 'cena',
    dentroHorario: false,
    aviso: i18n.t('disponibilidad.outsideHours'),
  }
}

export function etiquetaTurno(turno) {
  return turno === 'almuerzo' ? i18n.t('common.lunch') : i18n.t('common.dinner')
}

export function esConsultaDisponibilidad(texto) {
  const textoNormalizado = normalizarTexto(texto)

  const palabrasClave = [
    'disponibilidad',
    'disponible',
    'mesas libres',
    'mesa libre',
    'hay mesa',
    'hay lugar',
    'plazas',
    'aforo',
    'hueco',
    'quedan mesas',
    'sitio para',
    'teneis mesa',
    'teneis sitio',
    'cupo',
    'availability',
    'available',
    'free table',
    'any table',
    'tables left',
    'disponibilite',
    'disponible',
    'table libre',
    'verfugbar',
    'verfügbar',
    'freier tisch',
    'tisch frei',
  ]

  return (
    palabrasClave.some((palabra) => textoNormalizado.includes(normalizarTexto(palabra))) ||
    /\bhay\s+(disponibilidad|lugar|mesa|sitio)/.test(textoNormalizado) ||
    /(?:queda|quedan)\s+(alguna\s+)?mesa/.test(textoNormalizado) ||
    /(?:mesa|sitio)\s+para/.test(textoNormalizado) ||
    /\b(any|free)\s+table/.test(textoNormalizado) ||
    /\b(table|place)\s+(available|free)/.test(textoNormalizado)
  )
}

export function interpretarConsultaDisponibilidad(texto) {
  if (!esConsultaDisponibilidad(texto)) return null

  const textoNormalizado = normalizarTexto(texto)
  const fecha =
    parsearFechaDesdeTexto(texto) ??
    (textoMencionaFecha(textoNormalizado) ? null : formatearFechaISO(new Date()))

  if (!fecha) return null

  const hora = parsearHoraDesdeTexto(texto)

  if (hora) {
    const turnoInfo = turnoDesdeHora(hora.horas, hora.minutos)
    return {
      fecha,
      turno: turnoInfo.turno,
      hora,
      dentroHorario: turnoInfo.dentroHorario,
      avisoHorario: turnoInfo.aviso ?? null,
    }
  }

  if (
    textoNormalizado.includes('almuerzo') ||
    textoNormalizado.includes('comida') ||
    textoNormalizado.includes('lunch') ||
    textoNormalizado.includes('dejeuner') ||
    textoNormalizado.includes('mittagessen')
  ) {
    return { fecha, turno: 'almuerzo', hora: null, dentroHorario: true, avisoHorario: null }
  }

  if (
    textoNormalizado.includes('cena') ||
    textoNormalizado.includes('dinner') ||
    textoNormalizado.includes('diner') ||
    textoNormalizado.includes('abendessen')
  ) {
    return { fecha, turno: 'cena', hora: null, dentroHorario: true, avisoHorario: null }
  }

  return {
    fecha,
    turno: null,
    hora: null,
    dentroHorario: true,
    avisoHorario: null,
  }
}

export async function obtenerDisponibilidadRemota(fecha, turno) {
  if (!backendConfigurado()) {
    return consultarDisponibilidadLocal(fecha, turno)
  }

  const params = new URLSearchParams({ fecha, turno })
  const response = await fetch(`${API_BASE_URL}/api/disponibilidad?${params.toString()}`)

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || i18n.t('reservas.noAforo'))
  }

  return data
}

export function describirEstadoDisponibilidad(estado, mesasLibres) {
  if (estado === 'completo') {
    return {
      titulo: i18n.t('disponibilidad.noTables'),
      detalle: i18n.t('disponibilidad.fullDetail', { max: CONFIG_RESTAURANTE.TOTAL_MESAS_MAX }),
      tono: 'completo',
    }
  }

  if (estado === 'ultimas_plazas') {
    return {
      titulo: i18n.t('disponibilidad.lastSpots'),
      detalle: i18n.t('disponibilidad.lastSpotsDetail', { count: mesasLibres }),
      tono: 'ultimas',
    }
  }

  return {
    titulo: i18n.t('disponibilidad.available'),
    detalle: i18n.t('disponibilidad.availableDetail', {
      count: mesasLibres,
      max: CONFIG_RESTAURANTE.TOTAL_MESAS_MAX,
    }),
    tono: 'disponible',
  }
}
