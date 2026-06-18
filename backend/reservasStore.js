import mysql from 'mysql2/promise'

let pool = null

export class AforoCompletoError extends Error {
  constructor() {
    super('Aforo completo')
    this.name = 'AforoCompletoError'
  }
}

export class ReservasStoreError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ReservasStoreError'
  }
}

export function modoReservas() {
  return 'mysql'
}

function dbConfigurada() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
}

function mapFilaReserva(row) {
  const fecha =
    row.fecha instanceof Date
      ? row.fecha.toISOString().slice(0, 10)
      : String(row.fecha).slice(0, 10)

  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at ?? null

  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    fecha,
    turno: row.turno,
    localizador: row.localizador,
    createdAt,
  }
}

function valorOrdenTurno(turno) {
  return turno === 'almuerzo' ? 0 : 1
}

function ordenarReservas(lista) {
  return lista.slice().sort((a, b) => {
    if (a.fecha === b.fecha) return valorOrdenTurno(a.turno) - valorOrdenTurno(b.turno)
    return a.fecha.localeCompare(b.fecha)
  })
}

function agruparPorDia(reservas) {
  const porDia = {}
  for (const reserva of reservas) {
    if (!porDia[reserva.fecha]) porDia[reserva.fecha] = []
    porDia[reserva.fecha].push(reserva)
  }
  return porDia
}

async function ensureSchemaMysql() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL,
      fecha DATE NOT NULL,
      turno ENUM('almuerzo', 'cena') NOT NULL,
      localizador VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_localizador (localizador),
      KEY idx_fecha (fecha),
      KEY idx_fecha_turno (fecha, turno)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

export async function initReservasStore() {
  if (!dbConfigurada()) {
    throw new ReservasStoreError(
      'MySQL no configurado. Define DB_HOST, DB_USER, DB_NAME y DB_PASSWORD en backend/.env. ' +
        'En local: activa MySQL en XAMPP o ejecuta docker compose up -d',
    )
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  })

  try {
    await pool.query('SELECT 1')
    await ensureSchemaMysql()
    console.log('[reservas] MySQL activo →', process.env.DB_NAME, '@', process.env.DB_HOST)
  } catch (error) {
    await pool.end().catch(() => {})
    pool = null
    throw new ReservasStoreError(
      `No se pudo conectar a MySQL (${error.message}). ` +
        'Comprueba que MySQL esté activo en XAMPP o ejecuta docker compose up -d.',
    )
  }
}

export async function contarMesasOcupadas(fecha, turno) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM reservas WHERE fecha = ? AND turno = ?',
    [fecha, turno],
  )
  return Number(rows[0]?.total ?? 0)
}

export async function listarReservas({ fecha } = {}) {
  let reservas = []

  if (fecha) {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, fecha, turno, localizador, created_at FROM reservas WHERE fecha = ? ORDER BY turno ASC, created_at ASC',
      [fecha],
    )
    reservas = rows.map(mapFilaReserva)
  } else {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, fecha, turno, localizador, created_at FROM reservas ORDER BY fecha ASC, turno ASC, created_at ASC',
    )
    reservas = rows.map(mapFilaReserva)
  }

  return ordenarReservas(reservas)
}

export async function listarReservasConAgrupacion({ fecha } = {}) {
  const reservas = await listarReservas({ fecha })
  return {
    total: reservas.length,
    reservas,
    porDia: agruparPorDia(reservas),
    almacenamiento: 'mysql',
  }
}

export async function crearReserva({ nombre, email, fecha, turno, localizador, mesasMax }) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [conteo] = await connection.query(
      'SELECT COUNT(*) AS total FROM reservas WHERE fecha = ? AND turno = ? FOR UPDATE',
      [fecha, turno],
    )

    if (Number(conteo[0]?.total ?? 0) >= mesasMax) {
      throw new AforoCompletoError()
    }

    const [resultado] = await connection.query(
      'INSERT INTO reservas (nombre, email, fecha, turno, localizador) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, fecha, turno, localizador],
    )

    const [filas] = await connection.query(
      'SELECT id, nombre, email, fecha, turno, localizador, created_at FROM reservas WHERE id = ?',
      [resultado.insertId],
    )

    await connection.commit()
    return mapFilaReserva(filas[0])
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
