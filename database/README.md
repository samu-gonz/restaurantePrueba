# Base de datos — Guachinche El Realejo

Las reservas se guardan en **MySQL** cuando defines `DB_HOST`, `DB_USER` y `DB_NAME` en `backend/.env`.  
Si MySQL no está configurado o no responde, el backend usa un archivo JSON en `backend/data/reservas.json`.

## Crear la base de datos (MySQL local)

1. Instala MySQL (o XAMPP/WAMP con MySQL).
2. Ejecuta el esquema:

```bash
mysql -u root -p < database/schema.sql
```

3. En `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=el_realejo
```

4. Reinicia el backend (`npm run dev`).

## Producción (Render u otro hosting)

Añade un servicio MySQL (Railway, PlanetScale alternativas, Aiven, etc.) y configura las mismas variables en el panel de Render.

Sin MySQL en producción, las reservas se guardan en `backend/data/reservas.json`. En Render el disco es **efímero** (se pierde al reiniciar), por lo que se recomienda MySQL para producción.

## Tabla `reservas`

| Campo        | Tipo        | Descripción                    |
|-------------|-------------|--------------------------------|
| id          | INT         | Identificador interno          |
| nombre      | VARCHAR     | Titular de la reserva          |
| email       | VARCHAR     | Correo del cliente             |
| fecha       | DATE        | Día de la reserva (YYYY-MM-DD) |
| turno       | ENUM        | `almuerzo` o `cena`            |
| localizador | VARCHAR     | Código único (#RE-…)           |
| created_at  | TIMESTAMP   | Fecha de registro              |

El aforo (30 mesas por turno) se calcula contando reservas por `fecha` + `turno`.
