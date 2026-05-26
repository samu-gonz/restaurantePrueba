/**
 * Simulación de base de datos — Guachinche El Realejo
 * En producción, estos datos vivirían en un servidor (API + BD real).
 */

/** Límite de aforo: 30 mesas por turno (Almuerzo o Cena). */
export const LIMITE_MESAS_POR_TURNO = 30

export const TURNOS = {
  ALMUERZO: 'almuerzo',
  CENA: 'cena',
}

/** Genera fecha YYYY-MM-DD sumando días a hoy (hora local). */
function fechaRelativa(diasDesdeHoy) {
  const d = new Date()
  d.setDate(d.getDate() + diasDesdeHoy)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/**
 * Reservas precargadas para contrastar disponibilidad.
 * Cada objeto = una fila en la tabla `reservas`.
 */
const reservasIniciales = [
  {
    id: 'RES-001',
    fecha: fechaRelativa(3),
    turno: TURNOS.ALMUERZO,
    mesas: 28,
    nombre: 'Familia Hernández',
    telefono: '922111222',
  },
  {
    id: 'RES-002',
    fecha: fechaRelativa(3),
    turno: TURNOS.CENA,
    mesas: 30,
    nombre: 'Grupo Empresa Norte',
    telefono: '922333444',
  },
  {
    id: 'RES-003',
    fecha: fechaRelativa(5),
    turno: TURNOS.ALMUERZO,
    mesas: 15,
    nombre: 'María y José',
    telefono: '600555666',
  },
  {
    id: 'RES-004',
    fecha: fechaRelativa(5),
    turno: TURNOS.CENA,
    mesas: 22,
    nombre: 'Aniversario López',
    telefono: '600777888',
  },
  {
    id: 'RES-005',
    fecha: fechaRelativa(7),
    turno: TURNOS.CENA,
    mesas: 29,
    nombre: 'Turismo gastronómico',
    telefono: '922999000',
  },
  {
    id: 'RES-006',
    fecha: fechaRelativa(10),
    turno: TURNOS.ALMUERZO,
    mesas: 12,
    nombre: 'Brunch amigos',
    telefono: '611222333',
  },
]

/** Estado mutable que simula la BD en memoria (INSERT = push). */
export let reservasDB = [...reservasIniciales]

/**
 * Cuenta mesas ocupadas para una fecha y turno concretos.
 * Equivale a: SELECT SUM(mesas) FROM reservas WHERE fecha = ? AND turno = ?
 */
export function contarMesasOcupadas(fecha, turno) {
  if (!fecha || !turno) return 0

  return reservasDB
    .filter((r) => r.fecha === fecha && r.turno === turno)
    .reduce((total, r) => total + r.mesas, 0)
}

/**
 * Comprueba si cabe al menos `mesasSolicitadas` mesas más.
 * Regla: ocupadas + solicitadas <= 30
 */
export function hayDisponibilidad(fecha, turno, mesasSolicitadas = 1) {
  const ocupadas = contarMesasOcupadas(fecha, turno)
  return ocupadas + mesasSolicitadas <= LIMITE_MESAS_POR_TURNO
}

/** Mesas libres restantes en un turno. */
export function mesasDisponibles(fecha, turno) {
  return LIMITE_MESAS_POR_TURNO - contarMesasOcupadas(fecha, turno)
}

/**
 * Simula INSERT en la base de datos.
 * @returns {object} La reserva insertada con su id
 */
export function insertarReserva(datos) {
  const nueva = {
    id: `RES-${Date.now()}`,
    ...datos,
  }
  reservasDB = [...reservasDB, nueva]
  console.log('[BD Simulada] INSERT reserva:', nueva)
  console.log(
    `[BD Simulada] Aforo ${datos.fecha} (${datos.turno}):`,
    `${contarMesasOcupadas(datos.fecha, datos.turno)}/${LIMITE_MESAS_POR_TURNO} mesas`,
  )
  return nueva
}

/** Genera localizador único tipo #RE-2026X */
export function generarLocalizador() {
  const year = new Date().getFullYear()
  const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `#RE-${year}${sufijo}`
}
