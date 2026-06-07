# 4. ARQUITECTURA DE MÓDULOS Y API REST

## 4.1. Punto de Entrada del Backend

El servidor se compila a un ejecutable independiente `backend.exe` mediante **pkg** y se ejecuta como un **servicio de Windows** gestionado por **NSSM** (Non-Sucking Service Manager). En desarrollo, se ejecuta directamente con Node.js. El punto de entrada es el archivo `backend/src/index.js`. La secuencia de arranque es la siguiente:

1. **Carga de variables de entorno:** Intenta cargar `.env` desde `C:\ProgramData\HandlerTrackSamples\.env` (producción); si no existe, carga desde `backend/.env` local (desarrollo).
2. **Validación de variables obligatorias** (`NODE_ENV`, `PORT`, `JWT_SECRET`, `DATABASE_URL`). Si faltan, entra en **SETUP_MODE** (modo de configuración inicial).
3. **Creación de directorios persistentes:** Crea las carpetas `logs/`, `uploads/coa/` y `backups/` en `C:\ProgramData\HandlerTrackSamples\` si no existen.
4. **Instanciación de la aplicación Express** con todos los middlewares de seguridad.
5. **Registro de los 15 routers de módulo** bajo el prefijo `/api/`.
6. **En producción:** Sirve los archivos estáticos del frontend React compilado (`resources/app/`).
7. **En setup mode:** Redirige todo el tráfico a `/setup` (asistente web de configuración inicial).
8. **Inicio del servidor** en el puerto `3001`, escuchando en `0.0.0.0` (acepta conexiones de red local).
9. **Migraciones automáticas:** Ejecuta `runMigrationsSilent()` para aplicar migraciones SQL pendientes.
10. **Activación del programador automático de backups** (`backupScheduler`).

**Variables de entorno requeridas (`.env`):**

| Variable | Valor por Defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución (`production` en el servicio Windows) |
| `PORT` | `3001` | Puerto del servidor API |
| `JWT_SECRET` | *(clave generada aleatoriamente en setup)* | Secreto criptográfico para firmar tokens JWT |
| `DATABASE_URL` | `postgresql://handler_user:...@localhost:5432/handler_track_samples` | Cadena de conexión PostgreSQL |
| `DB_HOST` | `localhost` | Host de PostgreSQL (alternativa a DATABASE_URL) |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `handler_track_samples` | Nombre de la base de datos |
| `DB_USER` | `handler_user` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `handler_password` | Contraseña de PostgreSQL |
| `JWT_EXPIRES_IN` | `8h` | Tiempo de expiración de las sesiones |
| `BCRYPT_ROUNDS` | `12` | Rondas de hashing para contraseñas |
| `RATE_LIMIT_WINDOW` | `15` | Ventana de tiempo para rate limiting (minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | `5000` | Máximo de peticiones por IP en la ventana |
| `COA_BASE_DIR` | `C:/ProgramData/HandlerTrackSamples/uploads/coa` | Directorio local donde se almacenan los PDFs de CoA |
| `MAX_FILE_SIZE` | `10485760` | Tamaño máximo de archivos subidos (10 MB) |
| `HOST` | `0.0.0.0` | Interfaz de red donde escucha el servidor |

## 4.2. Middlewares de Seguridad

La capa de seguridad se aplica globalmente a todas las rutas antes de llegar a los controladores:

```
Petición HTTP
    ↓
[helmet]            → Cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS, etc.)
                      - CSP estricto: solo 'self', sin 'unsafe-eval'
                      - Permissions-Policy: solo camera/microphone
    ↓
[cors]              → Filtro de orígenes permitidos
                      - localhost, 127.0.0.1
                      - IPs privadas: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
                      - Bloquea orígenes de internet público
    ↓
[express-rate-limit] → Limitador: máx. 5000 req / 15 min por IP
    ↓
[express.json]      → Parser de body JSON (límite: 10 MB)
    ↓
[cookie-parser]     → Parser de cookies
    ↓
[logger]            → Registro Winston de todas las peticiones
                      └─ [SANITIZER] → Redacta passwords, tokens, cookies antes de loguear
    ↓
[auth middleware]   → Verificación JWT (en rutas protegidas)
    ↓
[Controlador]       → Lógica de negocio + consultas SQL parametrizadas
```

### 4.2.1. Sanitización de Logs (Defensa contra Fuga de Credenciales)

**Módulo:** `backend/src/utils/sanitizer.js`

Toda información sensible es redactada automáticamente antes de escribirse a los logs del sistema (rotación diaria en `C:\ProgramData\HandlerTrackSamples\logs\combined-YYYY-MM-DD.log` y `error.log`).

**Campos redactados** (matching case-insensitive, soporta camelCase y snake_case):

| Categoría | Ejemplos de claves redactadas |
|-----------|-------------------------------|
| Contraseñas | `password`, `currentPassword`, `new_password`, `oldPassword`, `userPassword`, `secretPassword` |
| Tokens | `token`, `authToken`, `access_token`, `refreshToken`, `bearerToken`, `csrfToken` |
| API Keys | `apiKey`, `api_key`, `x-api-key` |
| Secretos | `secret`, `clientSecret`, `jwt_secret`, `privateKey` |
| Auth | `authorization`, `cookie`, `cookies` |
| Otros | `passphrase`, `signature`, `csrf` |

**Headers HTTP redactados:** `authorization`, `cookie`, `set-cookie`, `x-api-key`, `x-auth-token`, `x-csrf-token`, `x-access-token`, `x-refresh-token`, `x-signature`.

**Modos de redacción disponibles:**

| Modo | Salida para `password: "secret123"` | Uso |
|------|--------------------------------------|-----|
| `redact` (default) | `password: "[REDACTED]"` | Producción — previene totalmente el leak |
| `hash` | `password: "[REDACTED:sha256:7c4a8d09]"` | Forense — permite correlación sin exponer el valor |
| `mask` | `password: "se***"` | Debugging — muestra primeros 2 chars |

**Reglas implementadas:**
1. ✅ Sanitización en request logger: el body se sanitiza ANTES de serializarse.
2. ✅ Sanitización en error handler: 500 + 400 sanitizan body, params, query, headers.
3. ✅ Protección contra ciclos: referencias circulares → `[CIRCULAR]`.
4. ✅ Tipos especiales: `Buffer` → `<Buffer length=N>`, `Error` → solo name/message/code, `Date` → ISO string.
5. ✅ Headers sensibles: `authorization`, `cookie`, etc. → `[REDACTED]`.
6. ✅ NO mutación: el objeto original no se modifica; `sanitize()` retorna una copia.

### 4.2.2. Path Traversal Protection

**Módulo:** `backend/src/utils/pathSecurity.js`

Implementa defensa en profundidad contra ataques de path traversal en la descarga de archivos (CoA PDFs, logos de proveedores). Resuelve rutas de forma segura y verifica que el archivo solicitado no escape del directorio base mediante `resolveSafeFilePath()` y `resolveSafePath()`.

## 4.3. Servicio de Windows (NSSM)

En producción, el backend se ejecuta como un servicio de Windows gestionado por NSSM:

| Propiedad | Valor |
|---|---|
| Nombre del servicio | `HandlerTrackSamples` |
| Ejecutable | `resources\backend\backend.exe` |
| Directorio de trabajo | `resources\backend` |
| Variables de entorno | `NODE_ENV=production`, `PORT=3001` |
| Tipo de inicio | Automático (SERVICE_AUTO_START) |
| Gestión | `nssm start\|stop\|restart\|status HandlerTrackSamples` |

## 4.4. Health Check y Monitoreo

**Endpoint:** `GET /health`

```json
{
  "status": "OK",
  "timestamp": "2026-06-07T12:00:00.000Z",
  "service": "Handler TrackSamples Backend",
  "version": "1.0.0",
  "setupMode": false
}
```

## 4.5. Módulo de Autenticación (`/api/auth`)

Gestiona el ciclo de vida de la sesión de usuario.

**Endpoints:**
- `POST /api/auth/login` → Valida `username` + `password` contra hash BCrypt en la tabla `users`. Si es correcto, emite un JWT firmado con expiración de 8 horas. Registra el evento en `movements`.
- `POST /api/auth/logout` → Invalida la sesión del lado del cliente.
- `POST /api/auth/recover` → Recuperación de contraseña usando la `secret_password_hash` como segundo factor de autenticación.
- `GET /api/auth/profile` → Retorna el perfil y los permisos JSONB del usuario autenticado.

## 4.6. Módulo de Muestras (`/api/samples`)

CRUD completo para las materias primas bulk.

**Endpoints clave:**
- `GET /api/samples` → Lista todas las muestras globales con información del proveedor, línea de mercado y estado de vencimiento.
- `POST /api/samples` → Registra una nueva muestra. Valida: fecha de fabricación ≤ fecha de expiración, unidades > 0, peso > 0, clase GHS válida.
- `PUT /api/samples/:id` → Actualiza campos editables. Registra el cambio en `movements` con `action_type: 'updated'`.
- `DELETE /api/samples/:id` → Elimina la muestra si no tiene submuestras activas. Registra en `movements`.
- `POST /api/samples/:id/upload-coa` → Recibe el PDF del Certificado de Análisis vía `multer` y almacena la ruta en `coa_file_path`.

## 4.7. Módulo de Almacén (`/api/warehouse`)

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

## 4.8. Módulo de Dispensación (`/api/dispensing`)

Ejecuta el fraccionamiento de muestras bulk en submuestras individuales con QR.

**Lógica de negocio del endpoint `POST /api/dispensing/dispense`:**
1. Recibe: `global_sample_id`, cantidad de frascos hijos (`count`), peso por frasco (`weight_grams`), anaquel de destino.
2. Verifica que `count × weight_grams ≤ available_units × total_weight_grams`.
3. Ejecuta una **transacción SQL atómica** (`BEGIN → INSERT × N → UPDATE → COMMIT`):
   - Inserta `N` registros en `dispensed_samples` con UUID único y `qr_code` generado.
   - Decrementa `available_units` en `global_samples`.
4. Genera los datos JSON del QR: `{id, lot, name, subsample_number, weight_grams}`.
5. Registra el evento en `movements` con `action_type: 'dispensed'`.

## 4.9. Módulo de Despachos (`/api/dispatch`)

Implementa el algoritmo **FEFO** (First-Expired-First-Out) para la salida de inventario.

- `GET /api/dispatch/suggest/:name` → Busca todas las submuestras almacenadas del producto indicado y devuelve la lista ordenada por `expiration_date ASC`, destacando la de mayor urgencia.
- `POST /api/dispatch/execute` → Marca la submuestra como `dispatched`, registra la `dispatched_at` y crea el evento en `movements`.

## 4.10. Módulo de Backups (`/api/backup`)

Gestiona la copia de seguridad de la base de datos. Los backups se almacenan directamente **dentro de la propia base de datos** en la tabla `backups` (en formato JSONB), garantizando que el respaldo sea completamente local y no dependa de sistemas de archivos externos.

**Lógica del sistema de backup:**
- `POST /api/backup/create` → Exporta el contenido íntegro de las 8 tablas en un objeto JSON. Lo inserta en la tabla `backups` con el tamaño en bytes y el nombre de archivo con timestamp (zona horaria Bogotá).
- **Rotación automática:** El sistema mantiene un máximo de **3 backups** simultáneos. Al crear uno nuevo que supere ese límite, elimina el más antiguo.
- `POST /api/backup/restore` → Restaura la base de datos a un punto anterior. Requiere la contraseña del administrador como segundo factor de seguridad. Ejecuta `TRUNCATE + INSERT` dentro de una transacción con `ROLLBACK` en caso de error.
- `GET /api/backup/status` → Retorna el estado del sistema de backups: último backup, días transcurridos, próximo backup programado.
- `GET /api/backup/list` → Lista los últimos 10 backups con metadata (tamaño, creador, fecha).
- **Programador Automático:** El `backupScheduler.js` verifica cada hora si han transcurrido el intervalo configurado (por defecto 20 días) y ejecuta un backup automático a las 12:00 PM hora Bogotá (UTC-5).

## 4.11. Módulo de Configuración (`/api/settings`)

Permite gestionar parámetros globales del sistema almacenados en la tabla `settings` (clave-valor JSONB).

**Parámetros configurables:**
- `coa_base_dir`: Directorio base para almacenar PDFs de Certificados de Análisis.
- `backup_config`: Configuración del programador de backups (`interval_days`, `hour`).

## 4.12. Módulo de Administración Interna (`/api/admin`)

Rutas de administración del servicio, accesibles solo desde localhost. Incluye funciones de diagnóstico y gestión del ciclo de vida del servicio Windows.

## 4.13. Módulo de Setup Inicial (`/api/setup`)

Asistente web de configuración inicial que se activa automáticamente en el primer arranque cuando no se encuentra un archivo `.env` configurado. Sirve el archivo `setup_page.html` y expone endpoints para:

1. Probar la conexión a PostgreSQL con los datos ingresados por el usuario.
2. Crear la base de datos si no existe.
3. Generar un `JWT_SECRET` criptográficamente aleatorio.
4. Escribir el archivo `.env` en `C:\ProgramData\HandlerTrackSamples\`.
5. Ejecutar todas las migraciones SQL.
6. Crear el usuario administrador inicial.
7. Crear las tablas auxiliares (`backups`, `settings`).
8. Reiniciar el proceso para que el servidor arranque en modo normal.
