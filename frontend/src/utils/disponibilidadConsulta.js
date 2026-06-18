import { API_BASE_URL, backendConfigurado } from '../config/api'
import { CONFIG_RESTAURANTE } from '../data/db'
import { consultarDisponibilidadLocal } from './reservasStorage'

const MSG_CIERRE =
  'Cerramos los lunes y martes por mantenimiento de viñedos y descanso del personal.'

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function formatearFechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
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

  if (fechaISO === hoy) return 'hoy'
  if (fechaISO === manana) return 'mañana'

  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatearHora(horas, minutos) {
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

export function parsearHoraDesdeTexto(texto) {
  const textoNormalizado = normalizarTexto(texto)

  const conMinutos = textoNormalizado.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (conMinutos) {
    return {
      horas: Number(conMinutos[1]),
      minutos: Number(conMinutos[2]),
    }
  }

  const soloHora = textoNormalizado.match(/\b(\d{1,2})\s*h(?:oras?)?\b/)
  if (soloHora) {
    return { horas: Number(soloHora[1]), minutos: 0 }
  }

  const aLas = textoNormalizado.match(/a las (\d{1,2})(?:\s*y\s*media)?/)
  if (aLas) {
    const horas = Number(aLas[1])
    const minutos =
      textoNormalizado.includes('y media') || textoNormalizado.includes(':30') ? 30 : 0
    return { horas, minutos }
  }

  return null
}

export function parsearFechaDesdeTexto(texto) {
  const textoNormalizado = normalizarTexto(texto)
  const referencia = new Date()

  if (/\bhoy\b/.test(textoNormalizado)) {
    return formatearFechaISO(referencia)
  }

  if (/\bmanana\b/.test(textoNormalizado)) {
    referencia.setDate(referencia.getDate() + 1)
    return formatearFechaISO(referencia)
  }

  if (/\bpasado manana\b/.test(textoNormalizado)) {
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
      aviso: 'Esa hora está entre turnos; la cena abre a las 19:30.',
    }
  }

  if (tiempo < 12) {
    return {
      turno: 'almuerzo',
      dentroHorario: false,
      aviso: 'El almuerzo abre a las 12:00.',
    }
  }

  return {
    turno: 'cena',
    dentroHorario: false,
    aviso: 'Ese horario queda fuera de nuestro servicio (cena hasta las 23:00).',
  }
}

export function etiquetaTurno(turno) {
  return turno === 'almuerzo' ? 'almuerzo' : 'cena'
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
  ]

  return (
    palabrasClave.some((palabra) => textoNormalizado.includes(palabra)) ||
    /\bhay\s+(disponibilidad|lugar|mesa|sitio)/.test(textoNormalizado) ||
    /(?:queda|quedan)\s+(alguna\s+)?mesa/.test(textoNormalizado) ||
    /(?:mesa|sitio)\s+para/.test(textoNormalizado)
  )
}

export function interpretarConsultaDisponibilidad(texto) {
  if (!esConsultaDisponibilidad(texto)) return null

  const fecha = parsearFechaDesdeTexto(texto)
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

  const textoNormalizado = normalizarTexto(texto)
  if (textoNormalizado.includes('almuerzo') || textoNormalizado.includes('comida')) {
    return { fecha, turno: 'almuerzo', hora: null, dentroHorario: true, avisoHorario: null }
  }

  if (textoNormalizado.includes('cena')) {
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
    throw new Error(data?.error || 'No se pudo consultar el aforo en tiempo real.')
  }

  return data
}

export function describirEstadoDisponibilidad(estado, mesasLibres) {
  if (estado === 'completo') {
    return {
      titulo: 'Sin mesas disponibles',
      detalle: `El turno está completo (${CONFIG_RESTAURANTE.TOTAL_MESAS_MAX} mesas reservadas).`,
      tono: 'completo',
    }
  }

  if (estado === 'ultimas_plazas') {
    return {
      titulo: 'Últimas plazas',
      detalle: `Quedan solo ${mesasLibres} mesa${mesasLibres === 1 ? '' : 's'} libres.`,
      tono: 'ultimas',
    }
  }

  return {
    titulo: 'Hay disponibilidad',
    detalle: `Tenemos ${mesasLibres} mesa${mesasLibres === 1 ? '' : 's'} libres de ${CONFIG_RESTAURANTE.TOTAL_MESAS_MAX}.`,
    tono: 'disponible',
  }
}
