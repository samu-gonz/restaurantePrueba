# Base de datos — Guachinche El Realejo

Las reservas se guardan **solo en MySQL**. El backend no arranca sin conexión a la base de datos.

## Desarrollo local con XAMPP

1. Inicia **MySQL** en el panel de control de XAMPP.
2. Crea la base de datos (solo la primera vez):

```bash
C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
```

3. En `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=el_realejo
```

4. Inicia el backend: `npm run dev`

## Desarrollo local (Docker)

1. Arranca MySQL:

```bash
docker compose up -d
```

2. En `backend/.env` (ya configurado por defecto con Docker):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=realejo_root
DB_NAME=el_realejo
```

3. Inicia el backend:

```bash
cd backend
npm run dev
```

La tabla `reservas` se crea automáticamente al conectar. También puedes aplicar el esquema manualmente:

```bash
docker exec -i el-realejo-mysql mysql -uroot -prealejo_root < database/schema.sql
```

## Producción (Render)

Necesitas un MySQL en la nube (Railway, Aiven, etc.) y estas variables en Render:

| Variable      | Ejemplo        |
|---------------|----------------|
| `DB_HOST`     | tu-host.mysql… |
| `DB_USER`     | root           |
| `DB_PASSWORD` | ***            |
| `DB_NAME`     | el_realejo     |
| `DB_PORT`     | 3306           |

Ejecuta `database/schema.sql` una vez en tu instancia remota.

## Tabla `reservas`

| Campo        | Tipo      | Descripción                    |
|-------------|-----------|--------------------------------|
| id          | INT       | Identificador interno          |
| nombre      | VARCHAR   | Titular de la reserva          |
| email       | VARCHAR   | Correo del cliente             |
| fecha       | DATE      | Día de la reserva (YYYY-MM-DD) |
| turno       | ENUM      | `almuerzo` o `cena`            |
| localizador | VARCHAR   | Código único (#RE-…)           |
| created_at  | TIMESTAMP | Fecha de registro              |

El aforo (30 mesas por turno) se calcula contando reservas por `fecha` + `turno`.
