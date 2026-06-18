-- Guachinche El Realejo — esquema de reservas
-- Ejecutar en MySQL: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS el_realejo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE el_realejo;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
