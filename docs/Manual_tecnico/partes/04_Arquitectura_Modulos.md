# 4. ARQUITECTURA DE MÓDULOS Y API REST

## 4.1. Punto de Entrada del Backend

El servidor se inicializa en el archivo `backend/src/index.js`. La secuencia de arranque es la siguiente:

1. Carga de variables de entorno desde `.env` mediante `dotenv`.
2. Validación de variables obligatorias (`NODE_ENV`, `PORT`, `JWT_SECRET`, `DATABASE_URL`).
3. Instanciación de la aplicación Express con todos los middlewares de seguridad.
4. Registro de los 12 routers de módulo bajo el prefijo `/api/`.
5. Inicio del servidor en el puerto `3001`, escuchando en `0.0.0.0` (acepta conexiones de red local).
6. Activación del programador automático de backups (`backupScheduler`).

**Variables de entorno requeridas (`.env`):**

| Variable | Valor por Defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `3001` | Puerto del servidor API |
| `JWT_SECRET` | *(clave larga)* | Secreto criptográfico para firmar tokens JWT |
| `DATABASE_URL` | `postgresql://...@localhost:5432/handler_track_samples` | Cadena de conexión PostgreSQL |
| `JWT_EXPIRES_IN` | `8h` | Tiempo de expiración de las sesiones |
| `BCRYPT_ROUNDS` | `12` | Rondas de hashing para contraseñas |
| `RATE_LIMIT_WINDOW` | `15` | Ventana de tiempo para rate limiting (minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | `5000` | Máximo de peticiones por IP en la ventana |
| `COA_BASE_DIR` | `C:/Handler/CoA` | Directorio local donde se almacenan los PDFs de CoA |
| `MAX_FILE_SIZE` | `10485760` | Tamaño máximo de archivos subidos (10 MB) |

## 4.2. Middlewares de Seguridad

La capa de seguridad se aplica globalmente a todas las rutas antes de llegar a los controladores:

```
Petición HTTP
    ↓
[helmet]          → Cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS, etc.)
    ↓
[cors]            → Filtro de orígenes permitidos (localhost + 192.168.x.x / 10.x.x.x)
    ↓
[express-rate-limit] → Limitador: máx. 5000 req / 15 min por IP
    ↓
[express.json]    → Parser de body JSON (límite: 10 MB)
    ↓
[cookie-parser]   → Parser de cookies
    ↓
[logger]          → Registro Winston de todas las peticiones
    ↓
[auth middleware] → Verificación JWT (en rutas protegidas)
    ↓
[Controlador]     → Lógica de negocio + consultas SQL
```

## 4.3. Módulo de Autenticación (`/api/auth`)

Gestiona el ciclo de vida de la sesión de usuario.

**Endpoints:**
- `POST /api/auth/login` → Valida `username` + `password` contra hash BCrypt en la tabla `users`. Si es correcto, emite un JWT firmado con expiración de 8 horas. Registra el evento en `movements`.
- `POST /api/auth/logout` → Invalida la sesión del lado del cliente.
- `POST /api/auth/recover` → Recuperación de contraseña usando la `secret_password_hash` como segundo factor de autenticación.
- `GET /api/auth/profile` → Retorna el perfil y los permisos JSONB del usuario autenticado.

## 4.4. Módulo de Muestras (`/api/samples`)

CRUD completo para las materias primas bulk.

**Endpoints clave:**
- `GET /api/samples` → Lista todas las muestras globales con información del proveedor, línea de mercado y estado de vencimiento.
- `POST /api/samples` → Registra una nueva muestra. Valida: fecha de fabricación ≤ fecha de expiración, unidades > 0, peso > 0, clase GHS válida.
- `PUT /api/samples/:id` → Actualiza campos editables. Registra el cambio en `movements` con `action_type: 'updated'`.
- `DELETE /api/samples/:id` → Elimina la muestra si no tiene submuestras activas. Registra en `movements`.
- `POST /api/samples/:id/upload-coa` → Recibe el PDF del Certificado de Análisis vía `multer` y almacena la ruta en `coa_file_path`.

## 4.5. Módulo de Almacén (`/api/warehouse`)

Gestiona la topología física del almacén: anaqueles, posicionamiento 3D y validación de compatibilidad SGA.

**Endpoints clave:**
- `GET /api/warehouse/shelves` → Lista de anaqueles con su ocupación volumétrica calculada en tiempo real.
- `POST /api/warehouse/shelves` → Crea un nuevo anaquel con dimensiones 3D configurables.
- `PUT /api/warehouse/shelves/:id` → Modifica dimensiones (sólo Admin).
- `DELETE /api/warehouse/shelves/:id` → Elimina si está vacío.
- `POST /api/warehouse/place` → **Posiciona una muestra** en una celda específica de un anaquel. Verifica:
  1. Que la celda esté libre (sin colisiones de posición 3D).
  2. Que el proveedor de la muestra esté autorizado para ese anaquel.
  3. Que no existan incompatibilidades GHS entre la muestra nueva y las existentes en el mismo anaquel.
- `POST /api/warehouse/move` → Reposiciona una muestra a otra celda con las mismas validaciones.
- `DELETE /api/warehouse/remove/:id` → Libera la celda (saca la muestra del anaquel sin despacharla).

## 4.6. Módulo de Dispensación (`/api/dispensing`)

Ejecuta el fraccionamiento de muestras bulk en submuestras individuales con QR.

**Lógica de negocio del endpoint `POST /api/dispensing/dispense`:**
1. Recibe: `global_sample_id`, cantidad de frascos hijos (`count`), peso por frasco (`weight_grams`), anaquel de destino.
2. Verifica que `count × weight_grams ≤ available_units × total_weight_grams`.
3. Ejecuta una **transacción SQL atómica** (`BEGIN → INSERT × N → UPDATE → COMMIT`):
   - Inserta `N` registros en `dispensed_samples` con UUID único y `qr_code` generado.
   - Decrementa `available_units` en `global_samples`.
4. Genera los datos JSON del QR: `{id, lot, name, subsample_number, weight_grams}`.
5. Registra el evento en `movements` con `action_type: 'dispensed'`.

## 4.7. Módulo de Despachos (`/api/dispatch`)

Implementa el algoritmo **FEFO** (First-Expired-First-Out) para la salida de inventario.

- `GET /api/dispatch/suggest/:name` → Busca todas las submuestras almacenadas del producto indicado y devuelve la lista ordenada por `expiration_date ASC`, destacando la de mayor urgencia.
- `POST /api/dispatch/execute` → Marca la submuestra como `dispatched`, registra la `dispatched_at` y crea el evento en `movements`.

## 4.8. Módulo de Backups (`/api/backup`)

Gestiona la copia de seguridad de la base de datos. Los backups se almacenan directamente **dentro de la propia base de datos** en la tabla `backups` (en formato JSONB), garantizando que el respaldo sea completamente local y no dependa de sistemas de archivos externos.

**Lógica del sistema de backup:**
- `POST /api/backup/create` → Exporta el contenido íntegro de las 8 tablas en un objeto JSON. Lo inserta en la tabla `backups` con el tamaño en bytes y el nombre de archivo con timestamp (zona horaria Bogotá).
- **Rotación automática:** El sistema mantiene un máximo de **3 backups** simultáneos. Al crear uno nuevo que supere ese límite, elimina el más antiguo.
- `POST /api/backup/restore` → Restaura la base de datos a un punto anterior. Requiere la contraseña del administrador como segundo factor de seguridad. Ejecuta `TRUNCATE + INSERT` dentro de una transacción con `ROLLBACK` en caso de error.
- `GET /api/backup/status` → Retorna el estado del sistema de backups: último backup, días transcurridos, próximo backup programado.
- **Programador Automático:** El `backupScheduler.js` verifica cada hora si han transcurrido el intervalo configurado (por defecto 20 días) y ejecuta un backup automático a las 12:00 PM hora Bogotá (UTC-5).
