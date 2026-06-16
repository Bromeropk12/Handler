# Auditoría de Calidad de Software — Handler TrackSamples

**Fecha:** 2026-06-10
**Alcance:** Backend + Frontend completo
**Total hallazgos:** 346 (30 CRÍTICOS, 91 HIGH, 128 MEDIUM, 97 LOW)

---

## Resumen por Módulo

| Módulo | CRÍTICOS | HIGH | MEDIUM | LOW | Total |
|--------|:--------:|:----:|:------:|:---:|:-----:|
| auth | 0 | 4 | 7 | 4 | 15 |
| admin | 0 | 0 | 1 | 2 | 3 |
| setup | 1 | 3 | 9 | 6 | 19 |
| warehouse | 1 | 8 | 7 | 3 | 19 |
| samples | 2 | 5 | 3 | 3 | 13 |
| backup | 3 | 4 | 8 | 7 | 22 |
| dispatch | 0 | 2 | 4 | 3 | 9 |
| dispensing | 1 | 4 | 6 | 5 | 16 |
| movements | 0 | 2 | 2 | 3 | 7 |
| suppliers | 0 | 2 | 3 | 3 | 8 |
| shelf-suppliers | 2 | 3 | 2 | 1 | 8 |
| market-lines | 0 | 1 | 4 | 2 | 7 |
| analytics | 0 | 0 | 2 | 5 | 7 |
| alerts | 0 | 1 | 3 | 3 | 7 |
| settings | 0 | 0 | 4 | 3 | 7 |
| services | 1 | 4 | 5 | 2 | 12 |
| middleware | 0 | 2 | 5 | 4 | 11 |
| utils | 1 | 2 | 2 | 3 | 8 |
| index.js | 1 | 2 | 1 | 4 | 8 |
| config | 0 | 0 | 5 | 4 | 9 |
| **Backend subtotal** | **17** | **54** | **60** | **41** | **172** |
| Componentes compartidos | 4 | 14 | 31 | 18 | 67 |
| Warehouse frontend | 3 | 8 | 12 | 9 | 32 |
| Páginas/módulos frontend | 2 | 7 | 15 | 21 | 45 |
| Services/Stores/Hooks/Layouts | 4 | 8 | 10 | 8 | 30 |
| **Frontend subtotal** | **13** | **37** | **68** | **56** | **174** |
| Migration scripts SQL | 1 | 0 | 2 | 0 | 3 |
| migrate.js / migrationRunner.js | 1 | 1 | 1 | 0 | 3 |
| create_tables.js | 0 | 2 | 1 | 0 | 3 |
| **DB subtotal** | **2** | **3** | **4** | **0** | **9** |
| **TOTAL GENERAL** | **32** | **94** | **132** | **97** | **355** |

---

## Top 15 Hallazgos Más Críticos

| # | ID | Severidad | Módulo | Archivo:Línea | Problema |
|---|----|-----------|--------|---------------|----------|
| 1 | SAMPLES-01 | 🔴 CRITICAL | samples | `controller.js:339-341` | **SyntaxError**: llaves sin cerrar en `if(req.file)` — el módulo no puede cargarse, la app crashea al arrancar si se importa |
| 2 | SAMPLES-02 | 🔴 CRITICAL | samples | `controller.js:458` | **ReferenceError**: `getCoaBaseDir()` fue eliminada pero se llama en `deleteBulkSample` — causa error 500 no recuperable |
| 3 | SVC-01 | 🔴 CRITICAL | services | `database.js:61` | `process.exit(-1)` en error del pool — mata el proceso sin graceful shutdown, pierde conexiones activas |
| 4 | INDEX-01 | 🔴 CRITICAL | index | `index.js:399-407` | `process.exit(0)` en SIGTERM/SIGINT sin cerrar pool BD ni conexiones SSE — corrupción de datos potencial |
| 5 | UTIL-01 | 🔴 CRITICAL | utils | `defragmentation.js:33-61` | Sin validación de coordenadas negativas — accesos a índices negativos del array, falsos negativos en occupancy |
| 6 | BACKUP-01 | 🔴 CRITICAL | backup | `controller.js:498` | SQL injection vía nombres de columna desde JSON de backup — un backup malicioso ejecuta SQL arbitrario |
| 7 | BACKUP-02 | 🔴 CRITICAL | backup | `controller.js:140` | SQL injection potencial vía interpolación de nombres de tabla en export |
| 8 | BACKUP-03 | 🔴 CRITICAL | backup | `controller.js:483` | SQL injection vía interpolación en TRUNCATE durante restore |
| 9 | SETUP-01 | 🔴 CRITICAL | setup | `routes.js:198` | `secret_password_hash` almacenado sin bcrypt — `resetPassword` no funciona, el sistema de recovery queda inutilizable |
| 10 | WH-01 | 🔴 CRITICAL | warehouse | `validations.js:113` | **Copy-paste bug**: `d: height` en vez de `d: depth` en AABB de getNeighbors — detección de vecinos incorrecta |
| 11 | SHELF-01 | 🔴 CRITICAL | shelf-suppliers | `controller.js:85-89` | `throw` dentro de `catch` sin `asyncErrorHandler` — UnhandledPromiseRejection, crash del proceso en Node >=15 |
| 12 | SHELF-02 | 🔴 CRITICAL | shelf-suppliers | `controller.js:57-76` | Sin transacción en `addShelfSupplier` — UPDATE marca todos is_primary=false pero INSERT puede fallar, datos corruptos |
| 13 | DISPENSING-01 | 🔴 CRITICAL | dispensing | `controller.js:176,183-328` | Colocación en anaquel FUERA de la transacción — COMMIT antes de colocar, muestras huérfanas si falla |
| 14 | X-03 | 🔴 CRITICAL | backup | `controller.js:498` | SQL injection en restore: columnas desde Object.keys(row) sin sanitizar — código duplicado en hallazgo |
| 15 | AUTH-01 | 🔴 CRITICAL | auth | `controller.js:395` | `&& false` desactiva validación de contraseña en `changeUserPassword` — admins pueden asignar contraseñas débiles |

---

# Hallazgos Detallados

## Módulo: AUTH

### AUTH-01 — Validación de contraseña desactivada permanentemente [HIGH]
- **Archivo:** `backend/src/modules/auth/controller.js:395`
- **Descripción:** `if (forceWeakPassword === false && false)` — el `&& false` literal hace que la validación de fortaleza de contraseña NUNCA se ejecute. Admins pueden asignar contraseñas de 1 carácter sin restricción.
- **Fix:** Eliminar `&& false`, restaurar la lógica. Validar mínimo 8 caracteres siempre.

### AUTH-02 — `forceWeakPassword` controlable por usuario [MEDIUM]
- **Archivo:** `backend/src/modules/auth/controller.js:298`
- **Descripción:** `forceWeakPassword` viene de `req.body`. Cualquier admin puede enviar `forceWeakPassword: true` y crear usuarios con contraseñas débiles.
- **Fix:** Restringir a admin maestro verificado por 2FA o token especial.

### AUTH-03 — Catch silencioso en logs de auditoría [HIGH]
- **Archivo:** `backend/src/modules/auth/controller.js:204-209,348-360,424-435,502-507,579-589,660-671,701-711,782-792`
- **Descripción:** Todos los INSERTs en `movements` usan `catch (_) { /* log no crítico */ }`. Eventos críticos como `user_deleted`, `admin_password_change` se pierden sin alerta.
- **Fix:** Mínimo `console.error()` o incluir en la transacción principal.

### AUTH-04 — `sample_id` enviado como NULL sin validar constraint [MEDIUM]
- **Archivo:** `backend/src/modules/auth/controller.js` (8 lugares)
- **Descripción:** Todos los INSERTs en movements pasan `null` como `sample_id`. Si la columna es NOT NULL, fallan silenciosamente.
- **Fix:** Verificar schema de movements o separar auditoría en tabla dedicada.

### AUTH-05 — Credenciales BD hardcodeadas como fallback [HIGH]
- **Archivo:** `backend/src/services/database.js:30-31`
- **Descripción:** `DB_USER = 'handler_user'`, `DB_PASSWORD = 'handler_password'` como defaults. Si no hay `.env`, la app usa credenciales conocidas públicamente.
- **Fix:** Eliminar defaults, fallar si no hay configuración.

### AUTH-06 — Token JWT expuesto en response JSON [LOW]
- **Archivo:** `backend/src/modules/auth/controller.js:134-146,600-610`
- **Descripción:** Token se envía en cookie HTTPOnly y también en `data.token` del JSON. Si frontend lo almacena en localStorage, anula la protección HTTPOnly.
- **Fix:** Eliminar `data.token` de la respuesta si se usa cookie HTTPOnly.

### AUTH-07 — Discrepancia expiración JWT vs cookie [MEDIUM]
- **Archivo:** `backend/src/modules/auth/controller.js:80-81,128-131`
- **Descripción:** Cookie tiene 8h fijas, JWT usa `JWT_EXPIRES_IN` configurable. Si alguien configura 1h, cookie sigue 8h con token expirado.
- **Fix:** Calcular `maxAge` dinámicamente desde `JWT_EXPIRES_IN`.

### AUTH-08 — Sin validación de username en login [LOW]
- **Archivo:** `backend/src/modules/auth/controller.js:90-101`
- **Descripción:** `createUser` sanitiza username, `login` no. Inconsistencia.
- **Fix:** Aplicar `sanitizeUsername()` también en login/resetPassword.

### AUTH-09 — requireAdmin síncrono sin try/catch [LOW]
- **Archivo:** `backend/src/modules/auth/controller.js:262-267`
- **Descripción:** Si en el futuro se agrega operación asíncrona, el error no sería capturado por Express.
- **Fix:** Marcar como async con try/catch.

### AUTH-10 — JSONB merge con NULL produce NULL [HIGH]
- **Archivo:** `backend/src/modules/auth/controller.js:654-657`
- **Descripción:** `permissions || $1::jsonb` — si `permissions` es NULL, `NULL || jsonb` = NULL, sobreescribe permisos con NULL.
- **Fix:** Usar `COALESCE(permissions, '{}'::jsonb) || $1::jsonb`.

### AUTH-11 — DEFAULT_PERMISSIONS sin protección contra roles inesperados [LOW]
- **Archivo:** `backend/src/config/permissions.js:118-126`
- **Descripción:** No hay `default` en switch. Rol no reconocido usa defaultOperator como fallback.
- **Fix:** Agregar set de roles válidos y lanzar error.

### AUTH-12 — Documentación Swagger enum incorrecto [MEDIUM]
- **Archivo:** `backend/src/modules/auth/routes.js:196`
- **Descripción:** Swagger documenta `enum: [admin, user]`, controller acepta `['admin', 'operator']`.
- **Fix:** Corregir a `enum: [admin, operator]`.

### AUTH-13 — `process.exit(-1)` en pool error [MEDIUM]
- **Archivo:** `backend/src/services/database.js:61`
- **Descripción:** Error en el pool mata el proceso sin posibilidad de recuperación.
- **Fix:** Reemplazar por logging + reconexión.

### AUTH-14 — sanitizeUsername subutilizado [LOW]
- **Archivo:** `backend/src/modules/auth/controller.js:60-70,319,538`
- **Descripción:** Solo se usa en createUser y changeUsername, no en login/resetPassword/listUsers.
- **Fix:** Aplicar en todos los endpoints que reciben username.

### AUTH-15 — resetPassword no valida fortaleza de contraseña [MEDIUM]
- **Archivo:** `backend/src/modules/auth/controller.js:169-171`
- **Descripción:** Solo verifica longitud >= 8, no mayúsculas, números ni especiales. Inconsistente con createUser.
- **Fix:** Usar `validatePasswordStrength()`.

---

## Módulo: ADMIN

### ADMIN-01 — localhostOnly no usa next(error) [LOW]
- **Archivo:** `backend/src/modules/admin/routes.js:19-21`
- **Descripción:** Retorna `res.status(403).json(...)` sin pasar por errorHandler centralizado.
- **Fix:** Usar `return next(new AppError('...', 403))`.

### ADMIN-02 — Sin try/catch en handlers POST [MEDIUM]
- **Archivo:** `backend/src/modules/admin/routes.js:26-42`
- **Descripción:** Handlers de `/notify-restart`, `/notify-update`, `/sse-count` no son async ni tienen try/catch.
- **Fix:** Envolver en try/catch con next(error).

### ADMIN-03 — minutes y version sin sanitizar [LOW]
- **Archivo:** `backend/src/modules/admin/routes.js:27,34`
- **Descripción:** `minutes` y `version` vienen del query string sin validación.
- **Fix:** Validar minutos como número positivo, limitar longitud de version.

---

## Módulo: SETUP

### SETUP-01 — secret_password_hash sin bcrypt [CRITICAL]
- **Archivo:** `backend/src/modules/setup/routes.js:198`
- **Descripción:** `secretHash = crypto.randomBytes(32).toString('hex')` se almacena DIRECTO, no con bcrypt. `resetPassword` en auth usa `bcrypt.compare()` que espera hash bcrypt (empieza con `$2b$...`), causando error. El admin nunca recibe esta contraseña secreta.
- **Fix:** Hashear con bcrypt antes de almacenar, devolver el secreto en la respuesta.

### SETUP-02 — Handler sin next como tercer parámetro [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:42`
- **Descripción:** `async (req, res) => {` sin `next`. Errores no pasan por errorHandler, no se loguean, contraseñas podrían aparecer en respuesta 500.
- **Fix:** Agregar `next` y usar `next(new AppError(...))`.

### SETUP-03 — process.exit(0) sin cleanup [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:231`
- **Descripción:** `process.exit(0)` sin cerrar pool BD ni archivos de log. Datos en riesgo si hay consultas en curso.
- **Fix:** Cerrar pool con `database.close()` antes de exit.

### SETUP-04 — console.log en producción [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js` (6 lugares)
- **Descripción:** Todo el módulo usa `console.log` en vez de winston.
- **Fix:** Usar logger estructurado.

### SETUP-05 — Interpolación directa en CREATE DATABASE [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:67`
- **Descripción:** `CREATE DATABASE "${dbName}"` — aunque dbName tiene regex, si se modifica la validación hay SQL injection.
- **Fix:** Escapar con `dbName.replace(/"/g, '""')`.

### SETUP-06 — Ruta de migraciones hardcodeada frágil [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js:144`
- **Descripción:** `path.join(__dirname, '../../../../database/scripts')` depende de estructura exacta. No se verifica existencia.
- **Fix:** Usar `path.resolve()` con variable de entorno.

### SETUP-07 — Migraciones saltadas silenciosamente si directorio no existe [HIGH]
- **Archivo:** `backend/src/modules/setup/routes.js:145-166`
- **Descripción:** Si `database/scripts` no existe, el setup responde `success: true` sin migraciones. Sistema queda operativo sin tablas.
- **Fix:** Fallar con error claro si no hay migraciones.

### SETUP-08 — bcrypt rounds hardcodeados (12) [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js:197`
- **Descripción:** `bcrypt.hash(adminPassword, 12)` ignora `BCRYPT_ROUNDS` env var.
- **Fix:** Usar `getBcryptRounds()` del helper compartido.

### SETUP-09 — URL de conexión sin encodeURIComponent [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:79`
- **Descripción:** `postgresql://${user}:${password}@${host}:${port}/${dbName}` sin escapar caracteres especiales en user/password.
- **Fix:** Usar `encodeURIComponent()`.

### SETUP-10 — No se actualiza role en reinstalación [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:207-212`
- **Descripción:** UPDATE no incluye `role = 'admin'`. Si el admin existente tiene role operator, tras reinstalación no tendrá acceso admin.
- **Fix:** Agregar `, role = 'admin'` al UPDATE.

### SETUP-11 — req.ip falseable con X-Forwarded-For [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js:22`
- **Descripción:** `req.ip` puede ser falseado si trust proxy está mal configurado.
- **Fix:** Usar `req.socket?.remoteAddress` como admin/routes.js.

### SETUP-12 — Sin transacción global para migraciones [MEDIUM]
- **Archivo:** `backend/src/modules/setup/routes.js:152-165`
- **Descripción:** Cada migración en transacción individual. Si la #3 falla, #1 y #2 ya se commitearon. BD queda parcialmente migrada.
- **Fix:** Envolver todo el bloque en una sola transacción.

### SETUP-13 — Log de URL con contraseña en texto plano [HIGH]
- **Archivo:** `backend/src/modules/setup/routes.js:68,113`
- **Descripción:** La URL de conexión contiene la contraseña. Si se loguea, queda expuesta.
- **Fix:** Asegurar que NUNCA se loguee la URL completa.

### SETUP-14 — Puerto no validado (parseInt puede dar NaN) [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js:59,131`
- **Descripción:** `parseInt("abc")` = NaN, que se usa como puerto.
- **Fix:** Validar entero entre 1-65535.

### SETUP-15 — Middleware async sin next en error [LOW]
- **Archivo:** `backend/src/modules/setup/routes.js:18-38`
- **Descripción:** Si `database.testConnection()` lanza error no capturado, Express no lo maneja.
- **Fix:** Envolver en try/catch.

---

## Módulo: WAREHOUSE

### WH-01 — Copy-paste bug: height usado como depth [CRITICAL]
- **Archivo:** `backend/src/modules/warehouse/validations.js:113`
- **Descripción:** `d: height` en vez de `d: depth` al construir el AABB para getNeighbors. Falsos positivos/negativos en detección de vecinos SGA.
- **Evidencia:**
  ```js
  return _getNeighborsByAABB(
    { x, y, z, w: width, h: height, d: height },  // BUG: debería ser d: depth
    adjacentSamples.rows
  );
  ```
- **Fix:** Cambiar `d: height` a `d: depth`.

### WH-02 — Falta transacción en placeSample [HIGH]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:163-183`
- **Descripción:** UPDATE + INSERT en movements sin transacción. Si INSERT falla, muestra posicionada sin trazabilidad.
- **Fix:** Envolver en transacción.

### WH-03 — Falta transacción en moveSample [HIGH]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:244-264`
- **Descripción:** UPDATE posición + INSERT movements sin transacción.
- **Fix:** Envolver en transacción.

### WH-04 — Falta transacción en removeSample [HIGH]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:305-324`
- **Descripción:** UPDATE limpiar shelf_id + INSERT movements sin transacción.
- **Fix:** Envolver en transacción.

### WH-05 — Falta transacción en autoPlaceSamples (bucle) [HIGH]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:359-419`
- **Descripción:** Bucle sin transacción. Si muestra 3/5 falla, muestras 1-2 quedan colocadas sin rollback.
- **Fix:** BEGIN antes del bucle, COMMIT/ROLLBACK al final.

### WH-06 — Falta transacción en updateShelf [HIGH]
- **Archivo:** `backend/src/modules/warehouse/shelf-operations.js:388-452`
- **Descripción:** DELETE + INSERT + UPDATE + INSERT movements sin transacción. Sincronización de proveedores puede quedar corrupta.
- **Fix:** Envolver en transacción.

### WH-07 — Falta transacción en deleteShelf [HIGH]
- **Archivo:** `backend/src/modules/warehouse/shelf-operations.js:506-520`
- **Descripción:** DELETE shelf + INSERT movements sin transacción.
- **Fix:** Envolver en transacción.

### WH-08 — Race condition en movement de createShelf [HIGH]
- **Archivo:** `backend/src/modules/warehouse/shelf-operations.js:100-110`
- **Descripción:** Se inserta movement con sample_id=NULL y luego se actualiza buscando el último con subconsulta. Dos usuarios concurrentes corrompen trazabilidad.
- **Fix:** Incluir INSERT del movement en la misma transacción que crea el shelf.

### WH-09 — parseDimensions silencia errores [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/validations.js:75`
- **Descripción:** Dimensiones inválidas retornan `{width:1,height:1,depth:1}` en lugar de error.
- **Fix:** Lanzar AppError si no hay match.

### WH-10 — Código muerto / condicional vacío en placeSample [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:140-152`
- **Descripción:** `if (String(sampleData.shelf_id) === String(id)) { // comentario } else { throw ... }` — bloque vacío.
- **Fix:** Invertir lógica para eliminar bloque vacío.

### WH-11 — autoPlaceSamples no filtra muestras en otro anaquel [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/map-operations.js:364`
- **Descripción:** La query filtra `ds.shelf_id IS NULL`, pero acepta muestras que ya están en otro anaquel.
- **Fix:** Rechazar con 409 si shelf_id no es NULL.

### WH-12 — Falta transacción en confirmDefragMove [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/defragment-operations.js:250-273`
- **Descripción:** UPDATE + INSERT movements sin transacción.
- **Fix:** Envolver en transacción.

### WH-13 — Variable depth no usada (subsumido por WH-01) [LOW]
- **Archivo:** `backend/src/modules/warehouse/validations.js:99`
- **Descripción:** depth se recibe pero debido a WH-01 nunca se usa.
- **Fix:** Corregir WH-01.

### WH-14 — TOCTOU en commitGroupMove [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/group-operations.js:511-531,541-777`
- **Descripción:** Validaciones fuera de transacción, UPDATEs dentro. Ventana de tiempo para cambios de datos.
- **Fix:** Mover validaciones dentro de la transacción.

### WH-15 — Columnas vs columns en documentación [LOW]
- **Archivo:** `backend/src/modules/warehouse/routes.js`
- **Descripción:** Documentación OpenAPI usa `columns`, código 3D usa `grid_width`.
- **Fix:** Actualizar documentación.

---

## Módulo: SAMPLES

### SAMPLES-01 — SyntaxError por llaves sin cerrar [CRITICAL]
- **Archivo:** `backend/src/modules/samples/controller.js:339-341`
- **Descripción:** El bloque `if (req.file)` abierto en línea 339 nunca se cierra. Las líneas 339-341 son:
  ```js
  if (req.file) {
    if (req.file.mimetype !== 'application/pdf') {
      throw new AppError('El archivo CoA debe ser un PDF', 400);
  ```
  Faltan `}}` para cerrar ambos bloques. Código posterior queda sintácticamente dentro del `if`, causando SyntaxError.
- **Fix:** Agregar llaves de cierre faltantes:
  ```js
  if (req.file) {
    if (req.file.mimetype !== 'application/pdf') {
      throw new AppError('El archivo CoA debe ser un PDF', 400);
    }
  }
  ```

### SAMPLES-02 — ReferenceError: getCoaBaseDir no definida [CRITICAL]
- **Archivo:** `backend/src/modules/samples/controller.js:458`
- **Descripción:** `getCoaBaseDir()` fue eliminada (comentario línea 12: "Removed getCoaBaseDir since we no longer copy files internally") pero se llama en `deleteBulkSample`. Causa ReferenceError.
- **Fix:** Reemplazar con `sample.coa_file_path` directo y try/catch.

### SAMPLES-03 — Ruta /:id/coa sin autenticación [HIGH]
- **Archivo:** `backend/src/modules/samples/routes.js:125`
- **Descripción:** `router.get('/:id/coa', downloadCoA)` — sin verifyToken ni requirePermission. Cualquiera puede descargar CoA.
- **Fix:** Agregar `verifyToken, requirePermission('samples.view')`.

### SAMPLES-04 — updateBulkSample sin transacción [HIGH]
- **Archivo:** `backend/src/modules/samples/controller.js:392-407`
- **Descripción:** UPDATE + INSERT movements sin transacción.
- **Fix:** Envolver en transacción.

### SAMPLES-05 — deleteBulkSample sin transacción [HIGH]
- **Archivo:** `backend/src/modules/samples/controller.js:456-480`
- **Descripción:** file unlink + DELETE + INSERT movements sin transacción.
- **Fix:** Envolver queries en transacción.

### SAMPLES-06 — createBulkSample usa transacción parcial [HIGH]
- **Archivo:** `backend/src/modules/samples/controller.js:123-132`
- **Descripción:** INSERT global_samples DENTRO de transacción, INSERT movements FUERA.
- **Fix:** Incluir movements dentro del array bulkQueries.

### SAMPLES-07 — Código muerto: bloque if(req.file) [MEDIUM]
- **Archivo:** `backend/src/modules/samples/controller.js:339-341`
- **Descripción:** La ruta no tiene middleware multer, `req.file` siempre es undefined. El bloque if jamás se ejecuta.
- **Fix:** Eliminar todo el bloque (además causa el SyntaxError de SAMPLES-01).

### SAMPLES-08 — Validación de fecha débil [MEDIUM]
- **Archivo:** `backend/src/modules/samples/controller.js:33`
- **Descripción:** `new Date("not-a-date")` retorna Invalid Date, que comparado da false — pasa validación.
- **Fix:** Validar fechas con `isNaN(manDate.getTime())`.

### SAMPLES-09 — requireAdmin importado no usado [MEDIUM]
- **Archivo:** `backend/src/modules/samples/routes.js:15`
- **Descripción:** Se importa `requireAdmin` de auth pero no se usa en ninguna ruta.
- **Fix:** Eliminar de la importación.

### SAMPLES-10 — Archivo validations.js no existe [MEDIUM]
- **Descripción:** No hay `samples/validations.js`. La validación está embebida en controller.js.
- **Fix:** Extraer `validateBulkSampleData` a validations.js.

### SAMPLES-11 — downloadCoA sin protección path traversal [LOW]
- **Archivo:** `backend/src/modules/samples/controller.js:539`
- **Descripción:** `filePath` viene directo de la BD sin validar que no contenga `..`.
- **Fix:** Validar que la ruta esté dentro de un directorio permitido.

### SAMPLES-12 — validateBulkSampleData muta data por referencia [LOW]
- **Archivo:** `backend/src/modules/samples/controller.js:40-42`
- **Descripción:** `data.dimensions = legacyDimensions[data.dimensions]` — muta el objeto original.
- **Fix:** No mutar, trabajar con copia.

---

## Módulo: BACKUP

### BACKUP-01 — SQL injection en restore vía nombres de columna [CRITICAL]
- **Archivo:** `backend/src/modules/backup/controller.js:498`
- **Descripción:** `INSERT INTO ${table} (${cols.join(', ')}) VALUES (...)`. `cols` = `Object.keys(row)` del backup sin sanitizar.
- **Fix:** Validar cada columna con `^[a-z_]+$`.

### BACKUP-02 — SQL injection potencial en export [CRITICAL]
- **Archivo:** `backend/src/modules/backup/controller.js:140`
- **Descripción:** `SELECT * FROM ${table}` con interpolación directa.
- **Fix:** Usar whitelist de nombres de tabla.

### BACKUP-03 — SQL injection en TRUNCATE durante restore [CRITICAL]
- **Archivo:** `backend/src/modules/backup/controller.js:483`
- **Descripción:** `TRUNCATE TABLE ${table}` con interpolación directa.
- **Fix:** Validar contra whitelist.

### BACKUP-04 — Error swallowing en exportación de tabla [HIGH]
- **Archivo:** `backend/src/modules/backup/controller.js:142-144`
- **Descripción:** `catch (err) { data.tables[table] = []; }` — fallo de exportación se reemplaza con array vacío sin notificar.
- **Fix:** Logear error y considerar abortar backup completo.

### BACKUP-05 — Error swallowing en registro backup_created [HIGH]
- **Archivo:** `backend/src/modules/backup/controller.js:338`
- **Descripción:** INSERT en movements en catch silencioso.
- **Fix:** Al menos console.error.

### BACKUP-06 — Error swallowing en registro backup_restored [HIGH]
- **Archivo:** `backend/src/modules/backup/controller.js:517`
- **Descripción:** Mismo patrón.
- **Fix:** Igual.

### BACKUP-07 — Error swallowing en registro backup_created (import) [HIGH]
- **Archivo:** `backend/src/modules/backup/controller.js:661`
- **Descripción:** Mismo patrón.
- **Fix:** Igual.

### BACKUP-08 — Error swallowing en rotación de backups [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:99`
- **Descripción:** `try { fs.unlinkSync(...) } catch (_) {}` — error eliminando archivos antiguos se ignora.
- **Fix:** Logear error.

### BACKUP-09 — Error swallowing en actualización onedrive_path [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:841`
- **Descripción:** UPDATE a BD en catch silencioso.
- **Fix:** Logear error.

### BACKUP-10 — Error swallowing en lectura de backup_config [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:278-283`
- **Descripción:** Error al leer config se silencia, usa defaults sin notificación.
- **Fix:** Logear advertencia.

### BACKUP-11 — Valores NaN en configuración [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:280-281`
- **Descripción:** `interval_days` y `hour` sin validar tipo. Si son string, NaN se propaga.
- **Fix:** Forzar Number y validar rango.

### BACKUP-12 — exportDatabaseToJSON sin snapshot [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:111-147`
- **Descripción:** Lee tablas sin transacción ni aislamiento. Backup inconsistente si hay escrituras concurrentes.
- **Fix:** Usar `BEGIN ISOLATION LEVEL REPEATABLE READ`.

### BACKUP-13 — Cálculo frágil de hora UTC +5 [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:289`
- **Descripción:** `hour + 5` puede exceder 23 (si hour=22 → 27). Cálculo propenso a errores.
- **Fix:** Usar `(hour + 5) % 24` con ajuste de día.

### BACKUP-14 — require dentro de función restoreBackup [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:410`
- **Descripción:** `const { pool } = require('../../services/database')` dentro del cuerpo de la función.
- **Fix:** Mover al inicio del archivo.

### BACKUP-15 — Rollback sin BEGIN previo [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:525`
- **Descripción:** Si error antes de BEGIN, se intenta ROLLBACK igual. PostgreSQL logea warning.
- **Fix:** Flag `let began = false` para condicionar ROLLBACK.

### BACKUP-16 — sanitizeFilename vulnerable [MEDIUM]
- **Archivo:** `backend/src/modules/backup/controller.js:389-403`
- **Descripción:** `path.basename` no protege contra todos los casos de path traversal.
- **Fix:** Verificar también que no contenga `..` o separadores.

### BACKUP-17 — MAX_BACKUPS = 3 hardcodeado [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:18`
- **Descripción:** Solo 3 backups conservados. Puede ser insuficiente para cumplimiento normativo.
- **Fix:** Hacer configurable.

### BACKUP-18 — Indentación inconsistente [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:134-135`
- **Descripción:** Líneas 134-135 con 0 espacios de indentación.
- **Fix:** Ajustar indentación.

### BACKUP-19 — GENERATED_COLUMNS hardcodeado [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:463`
- **Descripción:** `shelves: ['total_capacity']` hardcodeado. Si schema cambia, no se actualiza.
- **Fix:** Consultar `information_schema.columns`.

### BACKUP-20 — Race condition en rotateFiles [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:89-106`
- **Descripción:** Listar, ordenar y eliminar no es atómico. Dos solicitudes concurrentes pueden eliminar archivos incorrectos.
- **Fix:** Usar lock a nivel de aplicación.

### BACKUP-21 — restoreBackup procesa todo en una transacción gigante [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:473-504`
- **Descripción:** Si el backup tiene millones de filas, la transacción puede agotar memoria.
- **Fix:** Procesar en lotes.

### BACKUP-22 — Import duplicado del mismo controller [LOW]
- **Archivo:** `backend/src/modules/backup/routes.js:8-17,22`
- **Descripción:** Dos declaraciones require separadas desde el mismo archivo.
- **Fix:** Unificar en una sola.

### BACKUP-23 — UPDATE innecesarias en syncToOneDrive [LOW]
- **Archivo:** `backend/src/modules/backup/controller.js:833-843`
- **Descripción:** UPDATE onedrive_path para archivos skipped, no solo copied.
- **Fix:** Solo actualizar copied.

---

## Módulo: DISPATCH

### DISPATCH-01 — TOCTOU race condition en despacho [HIGH]
- **Archivo:** `backend/src/modules/dispatch/controller.js:67-108`
- **Descripción:** Validaciones de status y available_units FUERA de la transacción. Dos requests concurrentes pueden sobre-despachar (available_units negativo).
- **Fix:** Mover verificaciones DENTRO de la transacción con `SELECT ... FOR UPDATE`.

### DISPATCH-02 — Falta WHERE available_units > 0 en UPDATE [HIGH]
- **Archivo:** `backend/src/modules/dispatch/controller.js:119`
- **Descripción:** `available_units = available_units - 1` sin `AND available_units > 0`. Race condition puede llevar a negativo.
- **Fix:** Agregar `AND available_units > 0` al WHERE.

### DISPATCH-03 — Parámetros limit/page no validados [MEDIUM]
- **Archivo:** `backend/src/modules/dispatch/controller.js:170-173`
- **Descripción:** `parseInt("-1")` = -1, se pasa a PostgreSQL como LIMIT -1 → error.
- **Fix:** Validar `limit > 0 && limit <= 100`, `page >= 1`.

### DISPATCH-04 — JSON.parse(details) falla silenciosamente [MEDIUM]
- **Archivo:** `backend/src/modules/dispatch/controller.js:198`
- **Descripción:** Si `details` no es JSON válido, `try { details = JSON.parse(row.details); } catch {}` traga error y usa {}.
- **Fix:** Logear advertencia cuando falle.

### DISPATCH-05 — product_name sin validación de longitud [MEDIUM]
- **Archivo:** `backend/src/modules/dispatch/controller.js:11-12`
- **Descripción:** `product_name` puede ser string de 10MB, causando DoS en ILIKE.
- **Fix:** Validar longitud máxima 255.

### DISPATCH-06 — global_sample_id puede ser NULL [MEDIUM]
- **Archivo:** `backend/src/modules/dispatch/controller.js:120`
- **Descripción:** Si `global_sample_id` es NULL, UPDATE no afecta filas pero transacción completa exitosamente.
- **Fix:** Validar que no sea null antes de UPDATE.

### DISPATCH-07 — Pattern bind LIKE sin escapar [LOW]
- **Archivo:** `backend/src/modules/dispatch/controller.js:42`
- **Descripción:** `%${product_name}%` — caracteres `%` y `_` del input se interpretan como comodines.
- **Fix:** Escapar `product_name.replace(/[%_]/g, '\\$&')`.

### DISPATCH-08 — Documentación OpenAPI desactualizada [LOW]
- **Archivo:** `backend/src/modules/dispatch/routes.js:22-24`
- **Descripción:** Documenta `product` y `market_line_id`, controller usa `product_name`.
- **Fix:** Actualizar documentación.

### DISPATCH-09 — Paginación sin ORDER BY consistente [INFORMATIONAL]
- **Archivo:** `backend/src/modules/dispatch/controller.js:170`
- **Descripción:** COUNT(*) en tabla grande puede ser lento.
- **Fix:** Considerar usar estimaciones de pg_stats.

---

## Módulo: DISPENSING

### DISPENSING-01 — Colocación en anaquel FUERA de transacción [CRITICAL]
- **Archivo:** `backend/src/modules/dispensing/controller.js:176,183-328`
- **Descripción:** COMMIT (línea 176) antes de colocar muestras en anaquel (líneas 256-260, 300-304). Si servidor falla entre COMMIT y colocación, muestras quedan huérfanas.
- **Fix:** Mover TODA la colocación DENTRO de la transacción, COMMIT al final.

### DISPENSING-02 — Sin límite superior en number_of_units [HIGH]
- **Archivo:** `backend/src/modules/dispensing/controller.js:61,101`
- **Descripción:** `number_of_units: 1000000` genera 1M de QRs, consume toda la RAM, DoS.
- **Fix:** Validar máximo 500 unidades.

### DISPENSING-03 — Race condition en verificación de re-dispensación [HIGH]
- **Archivo:** `backend/src/modules/dispensing/controller.js:82-87`
- **Descripción:** Check de re-dispensación ANTES de BEGIN. Dos requests concurrentes pueden pasar ambos.
- **Fix:** Mover check DENTRO de transacción con `SELECT ... FOR UPDATE`.

### DISPENSING-04 — Fallback de colocación individual sin transacción [HIGH]
- **Archivo:** `backend/src/modules/dispensing/controller.js:290-328`
- **Descripción:** Colocación individual usa `query()` del pool global, no `client.query()` de la transacción. Cada UPDATE es autocommit.
- **Fix:** Usar `client.query` de la transacción activa.

### DISPENSING-05 — reassignShelf sin transacción [HIGH]
- **Archivo:** `backend/src/modules/dispensing/controller.js:506-527`
- **Descripción:** Limpia ubicaciones (UPDATE...SET shelf_id=NULL) y coloca muestras una por una, todo sin transacción.
- **Fix:** Envolver en transacción.

### DISPENSING-06 — Reversión de colocación fallida fuera de transacción [HIGH]
- **Archivo:** `backend/src/modules/dispensing/controller.js:270-277`
- **Descripción:** Reversiones usan `query()` global en vez de `client.query()`.
- **Fix:** Usar `client.query` de la transacción activa.

### DISPENSING-07 — Try-catch redundante en generateUniqueQrCode [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:23-44`
- **Descripción:** `catch (err) { throw err; }` dead code.
- **Fix:** Eliminar try-catch o agregar contexto.

### DISPENSING-08 — shelf_id sin validar existencia en BD [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:60`
- **Descripción:** shelf_id se usa sin verificar que exista en shelves.
- **Fix:** Validar existencia antes de transacción.

### DISPENSING-09 — module.exports antes de declaración de reassignShelf [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:471-476,482`
- **Descripción:** `module.exports` se define antes de `reassignShelf` (función declarada en línea 482).
- **Fix:** Mover module.exports al final.

### DISPENSING-10 — INSERT con NULL en shelf_id/position [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:136`
- **Descripción:** INSERT con shelf_id=NULL, position_x/y/z=NULL. Si hay constraints NOT NULL futuras, falla.
- **Fix:** Documentar decisión o no insertar hasta tener ubicación.

### DISPENSING-11 — parseDimensions oculta errores [MEDIUM]
- **Archivo:** `backend/src/modules/warehouse/validations.js:75` (usado por dispensing)
- **Descripción:** Formato de dimensión no reconocido retorna 1x1x1 en vez de error.
- **Fix:** Lanzar error.

### DISPENSING-12 — parseFloat repetido 4 veces [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:115,141,164,346`
- **Descripción:** `parseFloat(weight_per_unit)` se ejecuta 4 veces sobre el mismo valor.
- **Fix:** Parsear una vez al inicio y reutilizar.

### DISPENSING-13 — QR code con solo 7 caracteres [MEDIUM]
- **Archivo:** `backend/src/modules/dispensing/controller.js:23-44`
- **Descripción:** Códigos QR de 7 caracteres (~36B combos). Colisiones probables a partir de ~100k muestras.
- **Fix:** Usar UUIDs completos o UNIQUE INDEX con retry.

### DISPENSING-14 — Documentación OpenAPI desactualizada [LOW]
- **Archivo:** `backend/src/modules/dispensing/routes.js:23,49,50`
- **Descripción:** Documenta `bulk_sample_id`, controller usa `global_sample_id`.
- **Fix:** Actualizar documentación.

### DISPENSING-15 — total_units = 0 no detecta muestras hijas existentes [LOW]
- **Archivo:** `backend/src/modules/dispensing/controller.js:81`
- **Descripción:** Solo verifica total_units > 0, no cuenta muestras hijas existentes.
- **Fix:** Verificar existencia de hijas con COUNT.

### DISPENSING-16 — Array en memoria para 500 inserts [LOW]
- **Archivo:** `backend/src/modules/dispensing/controller.js:97-168`
- **Descripción:** ~503 objetos en memoria para 500 unidades. Aceptable pero no escala.
- **Fix:** Usar multi-row INSERT o batches.

### DISPENSING-17 — Vecinos busca rango fijo ±4 [LOW]
- **Archivo:** `backend/src/modules/warehouse/validations.js:105-107`
- **Descripción:** Rango fijo de ±4 celdas no considera anaqueles grandes/pequeños.
- **Fix:** Hacer configurable el radio de búsqueda.

### DISPENSING-18 — Exportación antes de declaración (duplicado DISPENSING-09) [LOW]

---

## Módulo: MOVEMENTS

### MOV-01 — Falta null-check en req.user.role [HIGH]
- **Archivo:** `backend/src/modules/movements/controller.js:92-93`
- **Descripción:** `req.user.role` y `req.user.permissions` sin verificar que `req.user` exista. TypeError si verifyToken falla.
- **Fix:** Agregar `!req.user ||` al inicio.

### MOV-02 — Offset negativo en paginación [MEDIUM]
- **Archivo:** `backend/src/modules/movements/controller.js:26-28`
- **Descripción:** `?page=-1` produce OFFSET negativo → error PostgreSQL.
- **Fix:** `Math.max(1, parseInt(page, 10) || 1)`.

### MOV-03 — Doble serialización JSON en CSV [MEDIUM]
- **Archivo:** `backend/src/modules/movements/controller.js:132`
- **Descripción:** `JSON.stringify(row.details)` asume objeto. Si es string, resulta en `'"texto"'` con comillas extra.
- **Fix:** Verificar tipo antes de stringify.

### MOV-04 — COUNT sin JOINs frágil [LOW]
- **Archivo:** `backend/src/modules/movements/controller.js:169-173`
- **Descripción:** COUNT no incluye JOINs de la query principal. Si se agregan filtros joined, el conteo será incorrecto.
- **Fix:** Duplicar JOINs o usar `COUNT(*) OVER()`.

### MOV-05 — Permiso movements.export en controller en vez de ruta [LOW]
- **Archivo:** `backend/src/modules/movements/controller.js:92`
- **Descripción:** Verificación imperativa del permiso dentro del controller. Mejor en ruta como middleware.
- **Fix:** Crear ruta separada con requirePermission.

### MOV-06 — action_type sin validación de valores permitidos [LOW]
- **Archivo:** `backend/src/modules/movements/controller.js:34-37`
- **Descripción:** Cualquier string se acepta como filtro action_type. Valor inválido da 0 resultados en vez de error 400.
- **Fix:** Validar contra lista de tipos conocidos.

### MOV-07 — asyncErrorHandler inconsistente entre módulos [HIGH]
- **Archivo:** `backend/src/modules/movements/routes.js:71,85,112`
- **Descripción:** movements SI usa asyncErrorHandler, otros módulos NO. Inconsistencia arquitectónica.
- **Fix:** Estandarizar en todos los módulos.

---

## Módulo: SUPPLIERS

### SUP-01 — TOCTOU en creación de proveedor [HIGH]
- **Archivo:** `backend/src/modules/suppliers/controller.js:35-41`
- **Descripción:** SELECT check existencia + INSERT sin transacción. Race condition → unique violation → error genérico.
- **Fix:** Insertar directamente y capturar 23505.

### SUP-02 — TOCTOU en eliminación de proveedor [HIGH]
- **Archivo:** `backend/src/modules/suppliers/controller.js:81-86`
- **Descripción:** SELECT referencias + DELETE sin transacción. Race condition → foreign_key_violation.
- **Fix:** Capturar 23503 y dar mensaje adecuado.

### SUP-03 — Error fs silenciado en borrado de logo [MEDIUM]
- **Archivo:** `backend/src/modules/suppliers/controller.js:120-124`
- **Descripción:** `catch (_) {}` traga error al eliminar logo antiguo.
- **Fix:** Al menos console.error.

### SUP-04 — Error fs silenciado en cleanup archivo temporal [MEDIUM]
- **Archivo:** `backend/src/modules/suppliers/controller.js:114`
- **Descripción:** Mismo patrón.
- **Fix:** Igual.

### SUP-05 — Validación MIME falsificable [MEDIUM]
- **Archivo:** `backend/src/modules/suppliers/routes.js:31-36`
- **Descripción:** Solo verifica mimetype del cliente, no magic bytes. Se puede subir un .exe como image/png.
- **Fix:** Verificar magic bytes (PNG signature).

### SUP-06 — Error de Multer tratado como 500 [LOW]
- **Archivo:** `backend/src/modules/suppliers/routes.js:35`
- **Descripción:** `cb(new Error('Solo PNG'))` sin statusCode → errorHandler devuelve 500.
- **Fix:** Asignar statusCode: 400.

### SUP-07 — Sin trim en validación de name [LOW]
- **Archivo:** `backend/src/modules/suppliers/controller.js:33`
- **Descripción:** `if (!name)` — `"   "` es truthy. Crea proveedor con nombre invisible.
- **Fix:** `if (!name || name.trim().length === 0)`.

### SUP-08 — Inconsistencia rowCount vs RETURNING [LOW]
- **Archivo:** `backend/src/modules/suppliers/controller.js:86-87`
- **Descripción:** Usa `result.rowCount` en vez de `RETURNING *` y verificar `rows.length` como el resto.
- **Fix:** Unificar con RETURNING.

---

## Módulo: SHELF-SUPPLIERS

### SHELF-01 — throw dentro de catch sin asyncErrorHandler [CRITICAL]
- **Archivo:** `backend/src/modules/shelf-suppliers/controller.js:85-89`
- **Descripción:** `throw new AppError(...)` dentro de catch. La función es async pero NO tiene asyncErrorHandler en routes.js. UnhandledPromiseRejection → crash del proceso en Node >=15.
- **Evidencia:**
  ```js
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Este proveedor ya está vinculado a este anaquel', 409);
    }
    next(error);
  }
  ```
- **Fix:** Usar `return next(new AppError(...))` en vez de throw.

### SHELF-02 — Falta transacción en addShelfSupplier [CRITICAL]
- **Archivo:** `backend/src/modules/shelf-suppliers/controller.js:57-76`
- **Descripción:** 4 queries independientes. UPDATE marca is_primary=false en todos, luego INSERT. Si INSERT falla, no hay proveedor primario.
- **Fix:** Envolver en transacción usando `transaction()` (ya importado pero nunca usado).

### SHELF-03 — Falta transacción en updateShelfSupplier [HIGH]
- **Archivo:** `backend/src/modules/shelf-suppliers/controller.js:102-113`
- **Descripción:** SELECT + UPDATE unset primary + UPDATE set is_primary sin transacción.
- **Fix:** Envolver en transacción.

### SHELF-04 — asyncErrorHandler no importado en routes [HIGH]
- **Archivo:** `backend/src/modules/shelf-suppliers/routes.js:1-15`
- **Descripción:** Ninguna ruta usa asyncErrorHandler. Cualquier error async no capturado crashea el proceso.
- **Fix:** Importar y usar en todas las rutas.

### SHELF-05 — transaction importado pero nunca usado [MEDIUM]
- **Archivo:** `backend/src/modules/shelf-suppliers/controller.js:6`
- **Descripción:** `const { transaction } = require(...)` — dead import.
- **Fix:** Usarlo o eliminarlo.

### SHELF-06 — Verificaciones redundantes con FK [LOW]
- **Archivo:** `backend/src/modules/shelf-suppliers/controller.js:57-66`
- **Descripción:** Verificaciones de existencia de shelf y supplier redundantes si hay FKs en BD.
- **Fix:** Confiar en FK + capturar 23503.

---

## Módulo: MARKET-LINES

### ML-01 — TOCTOU en updateMarketLine [HIGH]
- **Archivo:** `backend/src/modules/market-lines/controller.js:125-138`
- **Descripción:** SELECT existencia + SELECT duplicado + UPDATE sin transacción. Dos requests pueden pasar ambos check y fallar con unique violation.
- **Fix:** Usar subquery con NOT EXISTS en el UPDATE.

### ML-02 — TOCTOU en deleteMarketLine [MEDIUM]
- **Archivo:** `backend/src/modules/market-lines/controller.js:162-179`
- **Descripción:** 3 SELECTs + DELETE sin transacción. Race condition → foreign_key_violation.
- **Fix:** Envolver en transacción o capturar 23503.

### ML-03 — TOCTOU en createMarketLine [MEDIUM]
- **Archivo:** `backend/src/modules/market-lines/controller.js:89-97`
- **Descripción:** SELECT + INSERT sin transacción.
- **Fix:** Insertar directamente y capturar 23505.

### ML-04 — Sin atomicidad SELECT+INSERT [MEDIUM]
- **Archivo:** `backend/src/modules/market-lines/controller.js:89-97`
- **Descripción:** Mismo patrón que ML-03.
- **Fix:** Igual.

### ML-05 — ID sin validación de entero positivo [LOW]
- **Archivo:** `backend/src/modules/market-lines/controller.js:46,117,159`
- **Descripción:** `req.params.id` se pasa directo a PostgreSQL. Valor no numérico causa error 22P02 → 500.
- **Fix:** Validar `isNaN(parseInt(id,10))`.

### ML-06 — asyncErrorHandler no importado [LOW]
- **Archivo:** `backend/src/modules/market-lines/routes.js:1-9`
- **Descripción:** Inconsistencia con movements.
- **Fix:** Importar y usar.

---

## Módulo: ANALYTICS

### ANALYTICS-01 — Unused import AppError [LOW]
- **Archivo:** `backend/src/modules/analytics/controller.js:2`
- **Descripción:** `AppError` importado pero nunca usado.
- **Fix:** Eliminar.

### ANALYTICS-02 — Consultas multi-query sin snapshot consistente [MEDIUM]
- **Archivo:** `backend/src/modules/analytics/controller.js:7-138`
- **Descripción:** 9 consultas SELECT sin transacción. Dashboard puede mostrar totales inconsistentes entre queries.
- **Fix:** Usar `BEGIN ISOLATION LEVEL REPEATABLE READ` para todas las consultas.

### ANALYTICS-03 — Alertas con texto vacío [MEDIUM]
- **Archivo:** `backend/src/modules/analytics/controller.js:191-202`
- **Descripción:** Solo 3 action_types tienen texto. Otros tipos (password_reset, user_created, etc.) producen `text: ''`.
- **Fix:** Agregar default con texto genérico.

### ANALYTICS-04 — Comentario stale con línea incorrecta [LOW]
- **Archivo:** `backend/src/modules/analytics/controller.js:171`
- **Descripción:** Comentario refiere línea 151 pero avgOccupancy está en línea 164.
- **Fix:** Actualizar o eliminar comentario.

### ANALYTICS-05 — Nombre de propiedad samples semánticamente incorrecto [MEDIUM]
- **Archivo:** `backend/src/modules/analytics/controller.js:183`
- **Descripción:** `samples` contiene posiciones ocupadas, no conteo de muestras reales.
- **Fix:** Renombrar a `occupiedPositions`.

### ANALYTICS-06 — LIMIT 6 sin constante [LOW]
- **Archivo:** `backend/src/modules/analytics/controller.js:137`
- **Descripción:** LIMIT fijo sin constante nombrada.
- **Fix:** Definir constante descriptiva.

### ANALYTICS-07 — verifyToken no aplicado globalmente [LOW]
- **Archivo:** `backend/src/modules/analytics/routes.js:1-22`
- **Descripción:** A diferencia de alerts, verifyToken está solo en una ruta, no a nivel de router.
- **Fix:** Aplicar `router.use(verifyToken)` globalmente.

---

## Módulo: ALERTS

### ALERTS-01 — Unused import AppError [LOW]
- **Archivo:** `backend/src/modules/alerts/controller.js:7`
- **Descripción:** AppError importado pero no usado.
- **Fix:** Eliminar.

### ALERTS-02 — SQL injection potencial en intervalo [HIGH/MEDIUM]
- **Archivo:** `backend/src/modules/alerts/controller.js:85`
- **Descripción:** `CURRENT_DATE + ($1 || ' days')::INTERVAL` — concatenación dentro de SQL. Si `$1` no es número, intervalo inválido.
- **Fix:** Usar `CURRENT_DATE + ($1 * INTERVAL '1 day')`.

### ALERTS-03 — Sin límite superior en days [MEDIUM]
- **Archivo:** `backend/src/modules/alerts/controller.js:60`
- **Descripción:** `days=9999999` causa escaneo masivo. DoS potencial.
- **Fix:** `Math.min(Math.max(days, 1), 365)`.

### ALERTS-04 — caution60 puede ser negativo [MEDIUM]
- **Archivo:** `backend/src/modules/alerts/controller.js:166`
- **Descripción:** `caution60 = warning60 - warning30` de dos queries sin transacción. Si datos cambian entre queries, resultado puede ser negativo.
- **Fix:** Usar transacción y `Math.max(0, result)`.

### ALERTS-05 — top_alerts no mezcla tipos de alerta [LOW]
- **Archivo:** `backend/src/modules/alerts/controller.js:137-161`
- **Descripción:** ORDER BY expiration_date ASC solo trae las más vencidas, excluye warning/caution.
- **Fix:** Considerar weighted ordering.

### ALERTS-06 — days sin validación de entero [LOW]
- **Archivo:** `backend/src/modules/alerts/controller.js:60`
- **Descripción:** `parseInt("30abc")` = 30 acepta basura.
- **Fix:** Validación más estricta.

---

## Módulo: SETTINGS

### SETTINGS-01 — DDL ejecutado en cada request [MEDIUM]
- **Archivo:** `backend/src/modules/settings/controller.js:14-22,26,40,54`
- **Descripción:** `CREATE TABLE IF NOT EXISTS settings` se ejecuta en cada GET/POST a settings.
- **Fix:** Mover a inicialización única.

### SETTINGS-02 — throw en try en vez de return next [LOW]
- **Archivo:** `backend/src/modules/settings/controller.js:58-59,69,77`
- **Descripción:** `throw new AppError()` dentro de try para control de flujo. Inconsistente con el resto del proyecto.
- **Fix:** Usar `return next(new AppError(...))`.

### SETTINGS-03 — JSON.stringify con referencias circulares [MEDIUM]
- **Archivo:** `backend/src/modules/settings/controller.js:81`
- **Descripción:** Si value tiene referencias circulares, `JSON.stringify` lanza TypeError.
- **Fix:** Envolver en try/catch específico.

### SETTINGS-04 — Falta endpoint DELETE [LOW]
- **Archivo:** `backend/src/modules/settings/routes.js`
- **Descripción:** No hay deleteSetting ni DELETE /:key.
- **Fix:** Agregar.

### SETTINGS-05 — Trailing comma en module.exports [LOW]
- **Archivo:** `backend/src/modules/settings/controller.js:97`
- **Descripción:** `updateSetting,` — coma final inconsistente.
- **Fix:** Eliminar.

### SETTINGS-06 — key sin sanitizar [LOW]
- **Archivo:** `backend/src/modules/settings/controller.js:41,55`
- **Descripción:** `req.params.key` sin validar formato/longitud.
- **Fix:** Validar con regex `^[a-zA-Z0-9_-]+$`.

### SETTINGS-07 — Sin auditoría en modificaciones de configuración [MEDIUM]
- **Archivo:** `backend/src/modules/settings/controller.js:52-91`
- **Descripción:** No hay registro en movements de cambios en settings sensibles (coa_base_dir, upload_dir).
- **Fix:** Agregar INSERT en movements.

---

## Módulo: SERVICES

### SVC-01 — process.exit(-1) en pool error [CRITICAL]
- **Archivo:** `backend/src/services/database.js:61`
- **Descripción:** Error de pool → `process.exit(-1)` instantáneo. Sin graceful shutdown, sin recuperación.
- **Fix:** Reemplazar por logging + reconexión.

### SVC-02 — transaction() sin timeout [HIGH]
- **Archivo:** `backend/src/services/database.js:92-117`
- **Descripción:** Si una consulta se bloquea (deadlock, lock contention), la transacción queda abierta indefinidamente.
- **Fix:** Agregar `SET statement_timeout = '30s'`.

### SVC-03 — Logger duplicado [MEDIUM]
- **Archivo:** `backend/src/services/database.js:42-52`
- **Descripción:** Crea su propia instancia winston en vez de usar la central.
- **Fix:** Usar logger central o inyección.

### SVC-04 — Pool expuesto como export público [MEDIUM]
- **Archivo:** `backend/src/services/database.js:188`
- **Descripción:** `pool` se exporta directamente. Módulos pueden esquivar query()/transaction() y causar fugas de conexión.
- **Fix:** No exportar pool directamente.

### SVC-05 — migrationRunner usa pool.connect() directo [MEDIUM]
- **Archivo:** `backend/src/services/migrationRunner.js:52`
- **Descripción:** Usa pool.connect() en vez de database.transaction().
- **Fix:** Refactorizar para usar transaction().

### SVC-06 — Transacción de migración sin timeout [HIGH]
- **Archivo:** `backend/src/services/migrationRunner.js:53-69`
- **Descripción:** Si la migración se cuelga, bloquea el arranque del servidor.
- **Fix:** Agregar statement_timeout.

### SVC-07 — Parsing incorrecto de JSONB en backupScheduler [HIGH]
- **Archivo:** `backend/src/services/backupScheduler.js:71-72`
- **Descripción:** Trata `value` como objeto directamente. Si el driver devuelve string, `value.interval_days` es undefined → NaN.
- **Fix:** Asegurar parseo explícito.

### SVC-08 — Comparación de fechas con posible desbordamiento [LOW]
- **Archivo:** `backend/src/services/backupScheduler.js:88-89`
- **Descripción:** Si `lastBackupAt` es nulo o inválido, `daysSinceLast` puede ser NaN.
- **Fix:** Validar que sea fecha válida.

### SVC-09 — ?? no protege contra NaN [MEDIUM]
- **Archivo:** `backend/src/services/backupScheduler.js:72`
- **Descripción:** `Number(val) ?? 12` — si Number retorna NaN, ?? devuelve NaN porque NaN no es nullish.
- **Fix:** `Number.isFinite(h) && h >= 0 && h <= 23`.

### SVC-10 — SSE sin autenticación [HIGH]
- **Archivo:** `backend/src/services/sseService.js:14`
- **Descripción:** Endpoint `/api/events` sin verifyToken. Cualquier cliente puede recibir eventos del sistema.
- **Fix:** Agregar autenticación JWT.

### SVC-11 — Heartbeat setInterval sin cleanup [MEDIUM]
- **Archivo:** `backend/src/services/sseService.js:84-95`
- **Descripción:** `setInterval` no se guarda, no se puede detener. Impide graceful shutdown.
- **Fix:** Guardar timer, exportar stopHeartbeat().

### SVC-12 — Doble eliminación de archivo recovery [LOW]
- **Archivo:** `backend/src/services/adminRecovery.js:100,160-165`
- **Descripción:** `admin-recovery.json` se elimina en dos lugares diferentes.
- **Fix:** Unificar en un solo punto.

### SVC-13 — Archivo recovery persiste en producción [MEDIUM]
- **Archivo:** `backend/src/services/adminRecovery.js:49-58`
- **Descripción:** Ventana de oportunidad entre detección y eliminación del archivo recovery.
- **Fix:** No crearlo en producción.

---

## Módulo: MIDDLEWARE

### MW-01 — req.cookies con null-check [MEDIUM]
- **Archivo:** `backend/src/middleware/auth.js:10`
- **Descripción:** `req.headers.authorization.startsWith('Bearer ')` sin verificar req.headers exista.
- **Fix:** Usar optional chaining.

### MW-02 — JWT no verifica existencia del usuario en BD [HIGH]
- **Archivo:** `backend/src/middleware/auth.js:22-24`
- **Descripción:** Decodifica JWT y lo acepta sin consultar BD. Usuario eliminado puede seguir accediendo hasta que token expire.
- **Fix:** Consultar BD para validar existencia y permisos actualizados.

### MW-03 — authorize no valida req.user.role exista [MEDIUM]
- **Archivo:** `backend/src/middleware/auth.js:38`
- **Descripción:** `roles.includes(req.user.role)` — si role es undefined, retorna false pero no hay validación explícita.
- **Fix:** Agregar `!req.user.role ||`.

### MW-04 — Duplicación de lógica con verifyToken [MEDIUM]
- **Archivo:** `backend/src/middleware/auth.js:5-29` vs `modules/auth/controller.js:238-248`
- **Descripción:** Dos implementaciones de auth JWT separadas. auth.js no verifica BD, verifyToken sí.
- **Fix:** Unificar en un solo middleware que siempre verifique BD.

### MW-05 — statusCode puede ser 0 [MEDIUM]
- **Archivo:** `backend/src/middleware/errorHandler.js:30`
- **Descripción:** `error.statusCode || ...` — si statusCode es 0, se cae al fallback. También no maneja status como string '404'.
- **Fix:** Usar `??` en vez de `||` y convertir string a number.

### MW-06 — error.stack.substring posible error [LOW]
- **Archivo:** `backend/src/middleware/errorHandler.js:37`
- **Descripción:** Si stack es string vacío, substring funciona pero no aporta info.
- **Fix:** Verificar `error.stack.length > 0`.

### MW-07 — res.end override sin try/catch [LOW]
- **Archivo:** `backend/src/middleware/logger.js:65-82`
- **Descripción:** Sobrescribe `res.end` sin try/catch alrededor de `res.end(chunk, encoding)`.
- **Fix:** Envolver en try/catch.

### MW-08 — Admin bypass sin log [LOW]
- **Archivo:** `backend/src/middleware/permissions.js:25-27`
- **Descripción:** Admin bypass total sin registro. Acciones de admin no son auditables.
- **Fix:** Loggear en debug cuando admin bypassa permiso granular.

---

## Módulo: UTILS

### UTIL-01 — Sin validación de coordenadas negativas [CRITICAL]
- **Archivo:** `backend/src/utils/defragmentation.js:33-61,70-90,95-110,116-172`
- **Descripción:** `position_x`, `position_y`, `position_z` nunca se validan como no-negativos. Coordenadas negativas causan acceso a `matrix[-1]` → undefined → falsos negativos en occupancy → decisiones de desfragmentación peligrosas.
- **Fix:** Validar coordenadas >= 0 al inicio de cada función.

### UTIL-02 — Acceso a array sin bounds check [HIGH]
- **Archivo:** `backend/src/utils/defragmentation.js:95-110,116-172`
- **Descripción:** `matrix[y+dy][z+dz][x+dx]` sin verificar límites. Si targetW/H/D son 0 o negativos, TypeError.
- **Fix:** Guard clause temprano si dimensiones <= 0.

### UTIL-03 — shelf.grid_width || 10 oculta error [MEDIUM]
- **Archivo:** `backend/src/utils/defragmentation.js:185-187`
- **Descripción:** `shelf.grid_width || 10` — si grid_width es 0, se usa default 10. Oculta anaquel con grid_width=0.
- **Fix:** Usar `??` y validar > 0.

### UTIL-04 — MAX_ITERATIONS = 100 arbitrario [LOW]
- **Archivo:** `backend/src/utils/defragmentation.js:214`
- **Descripción:** 100 iteraciones es poco para grids grandes (20x10x10 = 2000 celdas). Aborta desfragmentación antes de tiempo.
- **Fix:** Hacer dinámico basado en sample count.

### UTIL-05 — sanitizeHeaders no maneja arrays [LOW]
- **Archivo:** `backend/src/utils/sanitizer.js:260-271`
- **Descripción:** Headers con valores array (set-cookie múltiple, accept) se asignan directamente.
- **Fix:** Si es array, convertir con join(', ').

### UTIL-06 — ALLOWED_ROOTS incluye process.cwd() demasiado amplio [MEDIUM]
- **Archivo:** `backend/src/utils/pathSecurity.js:19`
- **Descripción:** `path.resolve(process.cwd())` permite cualquier subdirectorio del backend.
- **Fix:** Eliminar process.cwd(), solo permitir directorios específicos.

### UTIL-07 — Clases de peligro hardcodeadas con español [LOW]
- **Archivo:** `backend/src/utils/sga-compatibility.js:12-19`
- **Descripción:** Clases hardcodeadas en español sin tilde (`Toxico` vs `Tóxico`). Si muestra tiene tilde, areCompatible() retorna falso por seguridad.
- **Fix:** Normalizar cadenas (toUpperCase, eliminar acentos).

---

## Módulo: INDEX.JS

### INDEX-01 — process.exit(0) sin graceful shutdown [CRITICAL]
- **Archivo:** `backend/src/index.js:399-407`
- **Descripción:** SIGTERM/SIGINT → `process.exit(0)` inmediato. No cierra pool BD, no espera operaciones en curso, no cierra SSE.
- **Fix:** Implementar graceful shutdown: server.close() → database.close() → process.exit(0), con timeout de fuerza.

### INDEX-02 — Pool BD nunca cerrado en shutdown [HIGH]
- **Archivo:** `backend/src/index.js:401,406`
- **Descripción:** No hay llamada a `database.close()` en signal handlers.
- **Fix:** Incluir `await database.close()` en shutdown.

### INDEX-03 — Swagger require en try/catch traga errores [LOW]
- **Archivo:** `backend/src/index.js:42-47`
- **Descripción:** Error de sintaxis en swagger.js se captura y solo se loguea mensaje. En desarrollo, no se ve el error real.
- **Fix:** En development, relanzar el error.

### INDEX-04 — console.log en vez de logger central [LOW]
- **Archivo:** `backend/src/index.js:22,26,201,202,205,206,349`
- **Descripción:** Mensajes de inicialización con console.log, no pasan por winston.
- **Fix:** Reemplazar con `loggerInstance.info`.

### INDEX-05 — CORS no acepta puertos no estándar [MEDIUM]
- **Archivo:** `backend/src/index.js:174`
- **Descripción:** Regex de CORS para IPs privadas puede no aceptar ciertos puertos. No cubre IPv6 privadas.
- **Fix:** Usar `new URL(origin)` o librería cors configurada.

---

## Módulo: CONFIG

### CFG-01 — parseInt sin base numérica en configuraciones [MEDIUM]
- **Archivo:** `backend/src/config.js:93,100,119,130,135,136`
- **Descripción:** `parseInt(undefined, 10) || 5432` funciona pero `parseInt('abc', 10)` da NaN que pasa desapercibido.
- **Fix:** Validar con `Number.isFinite()`.

### CFG-02 — JWT_SECRET con baja entropía solo genera warning [MEDIUM]
- **Archivo:** `backend/src/config.js:73-79`
- **Descripción:** Secreto de 32 chars con solo 'a' y 'b' pasa longitud pero es trivial de brute-forcear.
- **Fix:** En producción, lanzar error si uniqueChars < 16.

### CFG-03 — validateEnvironment no valida PORT como número [MEDIUM]
- **Archivo:** `backend/src/config.js:8-53`
- **Descripción:** `PORT=abc` pasa validación de existencia pero `parseInt('abc')` da NaN, servidor intenta escuchar en puerto NaN.
- **Fix:** Validar rango 1-65535.

### CFG-04 — BCRYPT_ROUNDS con leading zero [LOW]
- **Archivo:** `backend/src/config.js:22,130`
- **Descripción:** `BCRYPT_ROUNDS=08` puede interpretarse como octal en algunos entornos.
- **Fix:** Usar `Number.parseInt` con base 10 explícita.

### CFG-05 — ALLOWED_ORIGINS en .env pero no leída [MEDIUM]
- **Archivo:** `backend/.env:16` vs `backend/src/index.js:168-182`
- **Descripción:** Variable ALLOWED_ORIGINS definida pero no usada en el código CORS.
- **Fix:** Eliminar variable o implementar su lectura.

### CFG-06 — Servidor OpenAPI hardcodeado a localhost:3001 [LOW]
- **Archivo:** `backend/src/swagger.js:21`
- **Descripción:** `http://localhost:3001` hardcodeado. No respeta PORT configurado.
- **Fix:** Leer de config: `config.port`.

### CFG-07 — Permisos de admin son decorativos [LOW]
- **Archivo:** `backend/src/config/permissions.js:118-126` y `middleware/permissions.js:25`
- **Descripción:** DEFAULT_PERMISSIONS genera permisos que el middleware ignora para admins (bypass total).
- **Fix:** Documentar explícitamente.

---

## Hallazgos Transversales

### CROSS-01 — Inconsistencia en uso de asyncErrorHandler [HIGH]
- **Módulos:** Todos los routes.js
- **Descripción:** movements usa asyncErrorHandler, suppliers/shelf-suppliers/market-lines NO. Misma inconsistencia con otros módulos.
- **Fix:** Estandarizar: todos los routes deben usar asyncErrorHandler en cada ruta.

### CROSS-02 — Sin logs en errores 4xx [MEDIUM]
- **Módulos:** Todos los controller.js
- **Descripción:** Errores AppError (400/404/409) se pasan a next(error) sin log. El errorHandler global solo loggea 500.
- **Fix:** Modificar errorHandler para loggear todos los errores no-500 a nivel warn.

### CROSS-03 — Formato de respuesta inconsistente [LOW]
- **Módulos:** Todos los controller.js
- **Descripción:** Algunas respuestas incluyen message, otras no. Algunas envuelven datos en `data: {}`, otras no.
- **Fix:** Definir helper de respuesta estandarizado.

### CROSS-04 — Ausencia de rate limiting [HIGH]
- **Módulos:** Todos (especialmente backup, auth, dispensing)
- **Descripción:** Endpoints sensibles sin protección contra fuerza bruta o DoS.
- **Fix:** Implementar express-rate-limit.

### CROSS-05 — Sin validación de schema (Joi/Yup) en ningún controlador [LOW]
- **Módulos:** Todos
- **Descripción:** Validación manual con if/throw, propensa a omisiones.
- **Fix:** Adoptar librería de validación de schemas.

---

# Frontend — Hallazgos

## Resumen Frontend

| Área | CRÍTICOS | HIGH | MEDIUM | LOW | Total |
|------|:--------:|:----:|:------:|:---:|:-----:|
| Componentes compartidos | 4 | 14 | 31 | 18 | 67 |
| Warehouse frontend | 3 | 8 | 12 | 9 | 32 |
| Páginas/módulos | 2 | 7 | 15 | 21 | 45 |
| Services/Stores/Hooks/Layouts | 4 | 8 | 10 | 8 | 30 |
| **TOTAL** | **13** | **37** | **68** | **56** | **174** |

---

## Top 10 Hallazgos Frontend Más Críticos

| # | ID | Severidad | Archivo:Línea | Problema |
|---|----|-----------|---------------|----------|
| 1 | FRONT-SVC-01 | 🔴 CRITICAL | `circuitBreaker.ts:46-48` | Argumentos no propagados a función envuelta — todas las llamadas API envueltas pierden sus parámetros |
| 2 | FRONT-SVC-02 | 🔴 CRITICAL | `circuitBreaker.ts:16-23` | Falta `errorFilter` — errores 4xx abren el circuito bloqueando endpoints 30s |
| 3 | FRONT-SVC-03 | 🔴 CRITICAL | `circuitBreaker.js/.ts` | Dos implementaciones duplicadas (JS y TS) con bugs distintos — resolución ambigua según bundler |
| 4 | FRONT-SVC-04 | 🔴 CRITICAL | `authStore.ts:53` | JWT en localStorage — XSS persistente roba token, contradice cookie httpOnly documentada |
| 5 | AB-01 | 🔴 CRITICAL | `AlertBanner.jsx:15-28` | Memory leak: fetchSummary sin abort controller — setState en componente desmontado |
| 6 | MD-01 | 🔴 CRITICAL | `Modal.jsx:22-28` | Mapeo sizeClasses incorrecto: `xl`→max-w-4xl en vez de max-w-xl, `lg`→max-w-2xl en vez de max-w-lg |
| 7 | UM-01 | 🔴 CRITICAL | `UserManagement.jsx:59-69` | Memory leak: loadUsers sin abort controller en useEffect |
| 8 | US-01 | 🔴 CRITICAL | `UserSettings.jsx:113` | setTimeout sin cleanup — onClose se ejecuta en componente desmontado |
| 9 | WH-FRONT-01 | 🔴 CRITICAL | `ShelfMap3D.jsx:333-354` | Stale closure en drag handler — currentOffset siempre 0, drag no funciona |
| 10 | WH-FRONT-02 | 🔴 CRITICAL | `ShelfMap3D.jsx:333-354` | Fuga de event listeners mousemove/mouseup — no se limpian en unmount durante drag |
| 11 | WH-FRONT-03 | 🔴 CRITICAL | `ShelfOverviewMap.jsx:90` | Crash si `mapData.shelf` es null — acceso directo a `.grid_height` sin optional chaining |
| 12 | FRONT-PAGE-01 | 🔴 CRITICAL | `DispatchPage.jsx:665` | `labelData.id` nunca se setea — enlace CoA siempre apunta a `/samples/undefined/coa` |
| 13 | FRONT-PAGE-02 | 🔴 CRITICAL | `SamplesPage.jsx:368-393` | Filtro client-side sobre datos paginados server-side — resultados incompletos en página 2+ |

---

## COMPONENTES COMPARTIDOS

### AlertBanner.jsx

**AB-01 — Memory leak en fetchSummary [CRITICAL]**
- Línea 15-28: `fetchSummary` async sin abort controller ni flag de mounted. Si el componente se desmonta antes de que la promesa se resuelva, React lanza advertencia de fuga.
- Fix: Usar AbortController con cleanup en useEffect.

**AB-02 — Error state no manejado [HIGH]**
- Línea 24: catch solo hace console.error. Usuario nunca ve feedback visual si API falla.
- Fix: Agregar estado `error` y renderizar mensaje.

**AB-03 — Estados loading/empty/error insuficientes [MEDIUM]**
- Línea 30: `if (loading || !summary) return null` — trata loading y !summary igual.
- Fix: Manejar loading, error, empty, success por separado.

**AB-04 — PropTypes faltantes [LOW]**

### Badge.jsx
**BD-01 — PropTypes faltantes [LOW]**
**BD-02 — badgeVariants[variant] sin validación [LOW]**

### CameraSelector.jsx
**CS-01 — Propiedad fingerprint inexistente en MediaDeviceInfo [HIGH]**
- Línea 72: `camera.fingerprint` — objetos de enumerateDevices() no tienen esa propiedad. Siempre undefined.
- Fix: Reemplazar con `camera.deviceId`.

**CS-02 — "no cameras" puede confundirse con loading [MEDIUM]**
- Línea 43-47: `cameras.length === 0` se evalúa antes de isLoading.
- Fix: Agregar estado explícito de loading.

**CS-03 — PropTypes faltantes [LOW]**

### ChangePasswordModal.jsx
**CPM-01 — PropTypes faltantes [MEDIUM]**
**CPM-02 — Validación de formulario inexistente [MEDIUM]**
- Línea 17: No hay validación local. Si el padre no valida, se envía formulario vacío.
- Fix: Agregar required y mensajes inline.

**CPM-03 — Renderizado directo de error [LOW]**

### CreateUserModal.jsx
**CUM-01 — PropTypes faltantes [MEDIUM]**
**CUM-02 — Validación de formulario inexistente [MEDIUM]**
**CUM-03 — PropTypes faltantes [LOW]**

### DataTable.jsx
**DT-01 — Renderizado [object Object] [MEDIUM]**
- Línea 69: `row[col.key]` si es objeto, renderiza `[object Object]`.
- Fix: Helper que convierta objetos a string legible.

**DT-02 — Índice como key [MEDIUM]**
- Línea 63: `key={row.id || rowIndex}` — problemas de reconciliación si datos cambian.
- Fix: Exigir id único o generar key estable.

**DT-03 — Error state no manejado [MEDIUM]**
- Línea 79-101: Tabla no recibe prop `error`. API falla → skeleton o "Sin datos".
- Fix: Agregar prop error y renderizar estado.

**DT-04 — PropTypes faltantes [LOW]**

### EmptyState.jsx
**ES-01 — PropTypes faltantes [LOW]**

### ErrorBoundary.jsx
**EB-01 — Dependencia externa react-error-boundary sin verificar [MEDIUM]**
**EB-02 — window.location.href en vez de useNavigate [MEDIUM]**
- Línea 42: Recarga completa de página perdiendo estado React.
- Fix: Usar useNavigate.

**EB-03 — onReset con recarga completa [MEDIUM]**
- Línea 71: `() => window.location.reload()` podría intentar resetear solo el boundary.
- Fix: Usar resetErrorBoundary del componente.

**EB-04 — Exposición de stack trace en desarrollo [LOW]**
**EB-05 — PropTypes faltantes [LOW]**

### LoadingSpinner.jsx
**LS-01 — PropTypes faltantes [LOW]**

### MessageBanner.jsx
**MB-01 — Shape de message no validado [MEDIUM]**
- Línea 4-6/17: Si `message` es string en vez de `{ type, text }`, `message.type` es undefined.
- Fix: Validar forma esperada.

**MB-02 — PropTypes faltantes [LOW]**

### Modal.jsx
**MD-01 — Mapeo sizeClasses incorrecto [CRITICAL]**
- Línea 22-28: `xl` → max-w-4xl (debería max-w-xl), `lg` → max-w-2xl (debería max-w-lg). Duplicados.
- Fix: Corregir mapeo según escala Tailwind.

**MD-02 — onClose no validado [HIGH]**
- Línea 37: Si onClose no se provee, TypeError al hacer clic en backdrop.
- Fix: `onClick={() => onClose?.()}`.

**MD-03 — Race condition en manejo de scroll [MEDIUM]**
- Línea 6-13: Múltiples modales simultáneos — cleanup del último restablece overflow mientras otro está abierto.
- Fix: Llevar contador de modales abiertos.

**MD-04 — PropTypes faltantes [LOW]**

### StatCard.jsx
**SC-01 — PropTypes faltantes [LOW]**

### SystemNotificationBanner.jsx
**SNB-01 — Stale closure en setInterval [MEDIUM]**
- Línea 19: Si notification cambia mientras intervalo corre, el anterior se limpia y se crea nuevo.
- Fix: Considerar useRef.

**SNB-02 — Manipulación directa del DOM [MEDIUM]**
- Línea 140: `onMouseEnter={e => e.target.style.color = '#fff'}` en vez de clases CSS.
- Fix: Usar Tailwind hover.

**SNB-03 — Emojis como iconos [LOW]**
**SNB-04 — PropTypes faltantes [LOW]**

### UserManagement.jsx
**UM-01 — Memory leak en loadUsers [CRITICAL]**
- Línea 59-69: loadUsers sin abort controller. Modal cerrado antes de respuesta → setState en componente desmontado.
- Fix: Usar flag mounted o AbortController.

**UM-02 — Race condition: loadUsers() sin await [HIGH]**
- Línea 140,156: loadUsers() sin await — puede resolverse después del setMessage de éxito.
- Fix: Usar await.

**UM-03 — Estado errors no se limpia al cerrar modal [HIGH]**
- Línea 260-278: Si usuario abre modal, recibe errores, cierra y reabre, errores anteriores siguen visibles.
- Fix: Resetear errors al cerrar.

**UM-04 — loading compartido entre operaciones [MEDIUM]**
- Línea 26: Un loading bool para crear, eliminar y cambiar contraseña.
- Fix: Usar loadings específicos.

**UM-05 — Cálculo de stats en cada render [MEDIUM]**
**UM-06 — Parámetro forceWeakPassword confuso [MEDIUM]**
**UM-07 — PropTypes faltantes [LOW]**

### UserManagementFilters.jsx
**UMF-01 — PropTypes faltantes [LOW]**

### UserManagementHeader.jsx
**UMH-01 — PropTypes faltantes [LOW]**

### UserManagementQuickActions.jsx
**UMQ-01 — Handlers undefined causan crash [HIGH]**
- Línea 45/54: Si onCreateUser/onManageUsers/onRefresh no se proveen, `onClick={undefined}` lanza TypeError.
- Fix: Validar handlers o asignar no-ops.

**UMQ-02 — Spinner en botón Refresh durante otras operaciones [MEDIUM]**
**UMQ-03 — PropTypes faltantes [LOW]**

### UserManagementSecurity.jsx — Sin hallazgos

### UserManagementStats.jsx
**UMS-01 — Acceso a stats[key] sin verificar existencia [MEDIUM]**
- Línea 23: Si stats no contiene una clave esperada, renderiza "undefined".
- Fix: `{stats[key] ?? 0}`.

**UMS-02 — PropTypes faltantes [LOW]**

### UserManagementTable.jsx
**UMT-01 — Estado muerto en PermissionsPanel [HIGH]**
- Línea 42: `useState(user.permissions)` solo usa valor inicial. Si lista se recarga, panel abierto no refleja cambios.
- Fix: Usar useEffect para sincronizar o `key={user.id}` forzar remontaje.

**UMT-02 — charCodeAt en username vacío produce NaN [MEDIUM]**
- Línea 20: `username.charCodeAt(0)` si username es '' → NaN → `colors[NaN]` = undefined.
- Fix: `(username?.charAt(0)?.charCodeAt(0) || 0) % colors.length`.

**UMT-03 — colorClass no usado visualmente [MEDIUM]**
**UMT-04 — PropTypes faltantes [LOW]**

### UserManagementTabs.jsx
**UMTB-01 — PropTypes faltantes [LOW]**

### UserSettings.jsx
**US-01 — setTimeout sin cleanup [CRITICAL]**
- Línea 113: `setTimeout(onClose, 2200)` no se limpia si componente se desmonta. onClose ejecutado en componente desmontado.
- Fix: Guardar timeout en ref y limpiar en return de useEffect.

**US-02 — setTimeout sin confirmación de éxito [MEDIUM]**
- Línea 113,149: Se cierra automáticamente a los 2.2s. Si API es rápida, usuario no lee mensaje. Si API tarda >2.2s, mensaje nunca se muestra.
- Fix: Mover timeout al bloque success.

**US-03 — Tabs solo visibles para admin [MEDIUM]**
**US-04 — Misma fuga que US-01 duplicada [MEDIUM]**
**US-05 — Validación de fuerza solo para operadores [MEDIUM]**
**US-06 — Regex de carácter especial frágil [LOW]**
**US-07 — PropTypes faltantes [LOW]**

---

## WAREHOUSE FRONTEND

### WH-FRONT-01 — Stale closure en drag handler [CRITICAL]
- Archivo: `ShelfMap3D.jsx:333-354`
- `moveHandler` captura `groupDrag.dragState.currentOffset` por closure — siempre `{dx:0, dy:0, dz:0}`.
- Fix: Usar useRef para currentOffset.

### WH-FRONT-02 — Fuga de event listeners en drag [CRITICAL]
- Archivo: `ShelfMap3D.jsx:333-354`
- `mousemove` y `mouseup` en window sin cleanup en unmount.
- Fix: Usar useEffect con cleanup.

### WH-FRONT-03 — Crash si mapData.shelf es null [CRITICAL]
- Archivo: `ShelfOverviewMap.jsx:90-92`, `ShelfMap3D.jsx:164-166`, `LevelDetailMap.jsx:79-81`
- `mapData.shelf.grid_height || 10` — TypeError si shelf es null.
- Fix: Optional chaining `mapData?.shelf?.grid_height ?? 10`.

### WH-FRONT-04 — Typo en clase CSS rompe layout [HIGH]
- Archivo: `MarketLineSelector.jsx:275`
- `lefot-1/2` → debe ser `left-1/2`.
- Fix: Corregir typo.

### WH-FRONT-05 — THREE.Vector3 creado por frame [HIGH]
- Archivo: `MarketLineSelector.jsx:25`, `Shared3DComponents.jsx:278-282`
- GC pressure por crear Vector3 cada frame en useFrame.
- Fix: Usar vector reutilizable con useRef.

### WH-FRONT-06 — setTimeout sin cleanup en ShelfManagement [HIGH]
- Archivo: `ShelfManagement.jsx:146,158`
- setTimeout para ocultar mensaje de éxito — si usuario navega antes de 3s, se ejecuta setState en componente desmontado.
- Fix: Guardar timeout con useRef y limpiar en useEffect return.

### WH-FRONT-07 — Inputs numéricos permiten strings vacíos [HIGH]
- Archivo: `ShelfManagement.jsx:438-450`
- `parseInt('') || ''` → string vacío en grid_width → backend recibe NaN.
- Fix: Usar `Math.max(1, parseInt(...) || 10)`.

### WH-FRONT-08 — XSS potencial via logo_path [HIGH]
- Archivo: `ShelfManagement.jsx:371-375`
- `/{ss.logo_path}` interpolado en src sin sanitizar.
- Fix: Filtrar caracteres peligrosos.

### WH-FRONT-09 — API sin abort controller en modales [HIGH]
- Archivo: `ShelfMap3D.jsx:83-91`, `ReplicaWarehouseModal.jsx:351-364,384-398`
- Si usuario abre/cierra modal rápido, respuestas previas hacen setState en componente desmontado.
- Fix: Agregar AbortController.

### WH-FRONT-10 — MovementModal.jsx: 728 líneas de código muerto [HIGH]
- ShelfMap3D.jsx:17 dice "MovementModal removed — all movements now use ReplicaWarehouseModal". Archivo completo es dead code.
- Fix: Eliminar MovementModal.jsx.

### WH-FRONT-11 — Ausencia total de PropTypes [HIGH]
- Ninguno de los 27 archivos del módulo define propTypes.

### WH-FRONT-12 — selectedLevel nulo sin guard [MEDIUM]
- LevelDetailMap.jsx:81
- Fix: Validar selectedLevel antes de filtrar.

### WH-FRONT-13 — rejection.type inesperado en ToastReject [MEDIUM]
- ToastReject.jsx:41
- Fix: Optional chaining en TYPE_CONFIG.

### WH-FRONT-14 — expiration_date.substring() puede fallar [MEDIUM]
- SampleDetailModal.jsx:138 — asume string. Si API devuelve Date, `.substring` no existe.
- Fix: Convertir a String primero.

### WH-FRONT-15 — err.message puede ser undefined [MEDIUM]
- DefragmentationTool.jsx:34,66, ReplicaWarehouseModal.jsx:504
- Fix: Usar `err?.message || String(err)`.

### WH-FRONT-16 — Valores sin ?? en renderizado numérico [MEDIUM]
- ShelfSelector.jsx:109,114,116
- Fix: Usar `?? 0` en vez de `|| 0`.

### WH-FRONT-17 — Scene click handler asume event.point existe [MEDIUM]
- ShelfMiniMap3D.jsx:139-149
- Fix: Validar event?.point.

### WH-FRONT-18 — colorMap limitado a 3 líneas de mercado [MEDIUM]
- MarketLineSelector.jsx:201-204, ShelfManagement.jsx:28-36
- Fix: Centralizar en constants.js.

### WH-FRONT-19 — Comparación tipo-insegura en find [MEDIUM]
- MovementModal.jsx:481-482
- Fix: Usar comparación con tipo correcto.

### WH-FRONT-20 — Filtro por nombre en vez de ID [MEDIUM]
- ShelfManagement.jsx:49-51,200
- Fix: Usar market_line_id.

### WH-FRONT-21 — Sin estado vacío en ShelfSelector [LOW]
### WH-FRONT-22 — GridLines sin useMemo ineficiente [LOW]
### WH-FRONT-23 — Prop previewCells no usada [LOW]
### WH-FRONT-24 — console.error sin feedback al usuario [LOW]
### WH-FRONT-25 — useEffect sin dependencia explícita [LOW]
### WH-FRONT-26 — useFrame sin early return [LOW]
### WH-FRONT-27 — Lógica de "Principal" rota en toggleSupplier [LOW]
### WH-FRONT-28 — formatSampleId padding solo para <10000 [LOW]
### WH-FRONT-29 — usePrefersReducedMotion sin soporte Safari <14 [LOW]
### WH-FRONT-30 — isSampleSelected acepta 3 tipos [LOW]
### WH-FRONT-31 — Variables no usadas [LOW]
### WH-FRONT-32 — selectedLevel sin validación de rango [LOW]

---

## PÁGINAS / MÓDULOS FRONTEND

### FRONT-PAGE-01 — labelData.id nunca se setea [CRITICAL]
- Archivo: `DispatchPage.jsx:665`
- Enlace CoA siempre apunta a `/samples/undefined/coa` porque `setLabelData()` no mapea `id` desde la respuesta API.
- Fix: Agregar `id: resp.data.data.id` al objeto.

### FRONT-PAGE-02 — Filtro client-side sobre datos paginados [CRITICAL]
- Archivo: `SamplesPage.jsx:368-393`
- Filtros de búsqueda se aplican client-side sobre página actual. En página 2+ los resultados son incorrectos.
- Fix: Eliminar filtro client-side, confiar en paginación server-side.

### FRONT-PAGE-03 — searchTerm vs productName inconsistente [HIGH]
- Archivo: `DispatchPage.jsx:771`
- Modal FEFO pasa `searchTerm` como productName, mientras handleConfirmDispatch usa nombre real del producto.
- Fix: Usar `pendingScanRec?.name || pendingScanRec?.product_name || searchTerm`.

### FRONT-PAGE-04 — fetchMovements sin await ni Promise.all [HIGH]
- Archivo: `MovementsPage.jsx:219-223`
- fetchMovements, fetchTypes y fetchSummary corren concurrentemente. fetchMovements controla loading, los otros no.
- Fix: Usar Promise.all.

### FRONT-PAGE-05 — Dashboard sin estado de error [HIGH]
- Archivo: `DashboardPage.jsx:46-64`
- Si API falla, solo console.error. Usuario ve dashboard con valores en 0.
- Fix: Agregar estado error y banner.

### FRONT-PAGE-06 — Samples catch silencia error [HIGH]
- Archivo: `SamplesPage.jsx:136`
- Catch resetea datos a arrays vacíos sin notificar al usuario.
- Fix: Agregar setError.

### FRONT-PAGE-07 — PICTO_FILES duplicado [MEDIUM]
- DispensingPage.jsx:12-22 y PictogramDiamond.jsx:4-14 — mismo objeto definido en dos lugares.
- Fix: Exportar desde PictogramDiamond.jsx.

### FRONT-PAGE-08 — Filtro market_line_id innecesario [MEDIUM]
- DispensingPage.jsx:78 — filter se ejecuta incluso cuando selectedMarketLineId es ''.
- Fix: Guard clause `if (!selectedMarketLineId) return true;`.

### FRONT-PAGE-09 — setTimeout sin cleanup en startScanner [MEDIUM]
- DispatchPage.jsx:131 — timeout puede ejecutar código en componente desmontado.
- Fix: Guardar timeout en ref y limpiar en useEffect return.

### FRONT-PAGE-10 — sample.name sin optional chaining [MEDIUM]
- ActiveAlertsBanners.jsx:30,76 — renderiza "undefined" si API devuelve datos parciales.
- Fix: `sample?.name ?? ''`.

### FRONT-PAGE-11 — new Date() sin validar [MEDIUM]
- ActiveAlertsBanners.jsx:92 — expiration_date null renderiza "Invalid Date".
- Fix: Validar existencia antes de new Date().

### FRONT-PAGE-12 — electronAPI sin optional chaining [MEDIUM]
- NetworkInfoWidget.jsx:8 — `window.electronAPI.getNetworkInfo()` asume método existe.
- Fix: `window.electronAPI?.getNetworkInfo?.()`.

### FRONT-PAGE-13 — Tooltip de Recharts retorna array [MEDIUM]
- OccupancyChart.jsx:55-75 — formatter retorna array `[ReactNode, '']` en vez de ReactNode.
- Fix: Retornar solo el JSX.

### FRONT-PAGE-14 — stats sin valores por defecto [MEDIUM]
- InventoryStatsWidget.jsx:15-27,47 — stats.totalPositions?.toLocaleString() crashea si es null.
- Fix: `stats?.availableSamples ?? 0`.

### FRONT-PAGE-15 — Mapeo de colores frágil [MEDIUM]
- OccupancyChart.jsx:88-96 — usa nombres CSS como claves. Si backend cambia nombres, color default sin advertencia.
- Fix: Usar claves semánticas.

### FRONT-PAGE-16 — QR code con valor undefined [MEDIUM]
- DispensingLabelLayout.jsx:203,213 — `sample.qr_code` undefined → QR renderiza "undefined".
- Fix: Validar antes de renderizar.

### FRONT-PAGE-17 — transformOrigin incorrecto en LabelPrint [MEDIUM]
- LabelPrint.jsx:315 — `center center` causa que contenido se desplace al escalar.
- Fix: Cambiar a `top left`.

### FRONT-PAGE-18 — Impresión iframe con timeout fijo [MEDIUM]
- LabelPrint.jsx:113-161, DispatchLabelPrint.jsx:150-194 — setTimeout(800ms) antes de print(). Puede ser insuficiente.
- Fix: Usar iframe.onload.

### FRONT-PAGE-19 — getLogoUrl crashea si logo_url no es string [MEDIUM]
- SuppliersPage.jsx:125-132 — `.startsWith()` en no-string lanza TypeError.
- Fix: Validar typeof string antes de startsWith.

### FRONT-PAGE-20 — interval_days string vacío [MEDIUM]
- BackupPage.jsx:565-568 — input limpio envía '' en vez de número.
- Fix: Validar en submit.

### FRONT-PAGE-21 — Evento sintético reciclado en setTimeout [MEDIUM]
- LabelPrint.jsx:49 — `e.target.classList.add()` en setTimeout.
- Fix: Usar ref o state.

### FRONT-PAGE-22 — PropTypes faltantes en todos los archivos [LOW]
### FRONT-PAGE-23 — Índice como key en RecentMovementsWidget [LOW]
### FRONT-PAGE-24 — Texto hardcodeado para tipo de movimiento [LOW]
### FRONT-PAGE-25 — status null sin chequeo [LOW]
### FRONT-PAGE-26 — Typo "handeAddEmptyPage" [LOW]
### FRONT-PAGE-27 — console.log inconsistente con comentarios [LOW]
### FRONT-PAGE-28 — Supresión demasiado amplia de errores QR [LOW]
### FRONT-PAGE-29 — Solo PNG para logos, restrictivo [LOW]
### FRONT-PAGE-30 — Sin fallback browser para SetupPage [LOW]
### FRONT-PAGE-31 — result.success sin validar result existe [LOW]
### FRONT-PAGE-32 — Acceso encadenado sin validación [LOW]
### FRONT-PAGE-33 — supplier_logo_path ruta absoluta mal manejada [LOW]
### FRONT-PAGE-34 — NetworkInfoWidget null silencioso [LOW]
### FRONT-PAGE-35 — uploadingLogo solo rastrea una subida [LOW]
### FRONT-PAGE-36 — Errores secundarios solo en consola [LOW]
### FRONT-PAGE-37 — Modal cierre durante submit [LOW]
### FRONT-PAGE-38 — loadData sin estado error [LOW]
### FRONT-PAGE-39 — ghs_danger_class inconsistente con backend [LOW]
### FRONT-PAGE-40 — Fecha null no detectada como expirada [LOW]
### FRONT-PAGE-41 — Validación fechas sin check de existencia [LOW]
### FRONT-PAGE-42 — total_units undefined → muestra invisible [LOW]
### FRONT-PAGE-43 — resp.data.message puede ser undefined [LOW]
### FRONT-PAGE-44 — Query params sin sanitizar [LOW]
### FRONT-PAGE-45 — localStorage.clear() muy agresivo [LOW]

---

## SERVICES / STORES / HOOKS / LAYOUTS

### FRONT-SVC-01 — Argumentos perdidos en circuitBreaker.ts [CRITICAL]
- Archivo: `circuitBreaker.ts:46-48`
- `executeRequest` tiene firma `(endpoint, requestFn)` y llama `requestFn()` sin args. `breaker.fire(fn, ...args)` pasa args a opossum, que los redirige a executeRequest, pero ésta los ignora.
- Fix: Cambiar firma a `(endpoint, requestFn, ...args)` y llamar `requestFn(...args)`.

### FRONT-SVC-02 — Falta errorFilter en circuitBreaker.ts [CRITICAL]
- Archivo: `circuitBreaker.ts:16-23`
- La versión JS tiene errorFilter que impide que errores 4xx abran el circuito. La versión TS NO. Errores de validación/permisos bloquean el endpoint 30s.
- Fix: Agregar errorFilter idéntico al de la versión JS.

### FRONT-SVC-03 — Dos implementaciones duplicadas de CircuitBreaker [CRITICAL]
- Archivos: `circuitBreaker.js` y `circuitBreaker.ts`
- `api.js` importa `from './circuitBreaker'` sin extensión. La resolución depende del bundler. Bugs diferentes en cada versión.
- Fix: Eliminar un archivo y corregir bugs en el que se conserve.

### FRONT-SVC-04 — JWT en localStorage: vulnerable a XSS [CRITICAL]
- Archivo: `authStore.ts:53`
- Token JWT guardado en localStorage. Contradice cookie httpOnly documentada en api.js. XSS → robo de token → suplantación permanente.
- Fix: No persistir token en localStorage. Usar solo cookie httpOnly con withCredentials.

### FRONT-SVC-05 — authStore.ts es código muerto [HIGH]
- Archivo: `stores/authStore.ts`
- `useAuthStore` nunca se importa en ningún otro archivo. Autenticación real usa AuthContext.jsx. Migración incompleta.
- Fix: Eliminar o completar migración.

### FRONT-SVC-06 — login escribe token en localStorage y bypass circuit breaker [HIGH]
- Archivo: `AuthContext.jsx:87-104`
- Login con authAPI (bien) pero escribe token en localStorage. authStore.ts usa fetch nativo bypassando axios/circuit breaker/interceptors.
- Fix: Centralizar login en AuthContext con axios. No persistir token.

### FRONT-SVC-07 — Interceptor 401 usa window.location.href [HIGH]
- Archivo: `api.js:47`
- Redirige a /login con recarga completa de página, perdiendo todo el estado React.
- Fix: Emitir evento personalizado o usar history de React Router.

### FRONT-SVC-08 — Stream de permisos no liberado [HIGH]
- Archivo: `useCameraManager.js:34`
- `getUserMedia({ video: true })` para permisos, stream nunca detenido. Cámara queda activa.
- Fix: `permStream.getTracks().forEach(t => t.stop())`.

### FRONT-SVC-09 — useEffect sin cleanup en useCameraManager [HIGH]
- Archivo: `useCameraManager.js:191-193`
- En React 18 StrictMode, efecto se ejecuta dos veces. Streams de prueba nunca liberados.
- Fix: Agregar flag cancelled.

### FRONT-SVC-10 — SSE sin heartbeat ni timeout [HIGH]
- Archivo: `useServerEvents.js:27`
- EventSource sin heartbeat. Si servidor deja de enviar datos sin cerrar TCP, conexión zombie sin reconexión.
- Fix: Implementar heartbeat con setInterval.

### FRONT-SVC-11 — Reconexión SSE puede crear múltiples conexiones [HIGH]
- Archivo: `useServerEvents.js:61-69`
- En onerror, se programa reconexión con setTimeout. Si componente se desmonta durante retry, conexiones intermedias pueden quedar abiertas.
- Fix: Usar useRef para EventSource activo y timeout.

### FRONT-SVC-12 — Inconsistencia response.data vs response.data.data [HIGH]
- warehouseStore.ts:141 espera `response.data` directo. useShelfData.js:22 espera `response.data.data.shelves`. Contrato API inconsistente.
- Fix: Unificar formato de respuesta.

### FRONT-SVC-13 — Inconsistencia occupied_cells vs occupied_count [MEDIUM]
- warehouseStore.ts:31 define `occupied_cells`. useShelfData.js:242 y componentes usan `occupied_count`. Contadores muestran 0/NaN.
- Fix: Unificar nombre del campo.

### FRONT-SVC-14 — config/circuitBreaker.js no utilizado [MEDIUM]
- Archivo completo es dead code. Ningún otro archivo lo importa.
- Fix: Eliminar o integrar.

### FRONT-SVC-15 — reset() muta objeto initialState [MEDIUM]
- warehouseStore.ts:227 — `set(initialState)` misma referencia. Mutación futura corrompe estado inicial.
- Fix: Usar `structuredClone(initialState)`.

### FRONT-SVC-16 — useFilteredShelves causa re-renderizados excesivos [MEDIUM]
- warehouseStore.ts:241-253 — usa useWarehouseStore() sin selector, subscribe a TODOS los cambios.
- Fix: Usar useShallow con selectores individuales.

### FRONT-SVC-17 — console.log con emoji en producción [MEDIUM]
- circuitBreaker.ts:37 — `🔧 Circuit Breaker initialized` en consola en producción.
- Fix: Envolver en `if (process.env.NODE_ENV !== 'production')`.

### FRONT-SVC-18 — refreshToken catch vacío [MEDIUM]
- authStore.ts:111-113 — catch sin logging. Si refresh falla, logout silencioso sin explicación.
- Fix: Al menos registrar error.

### FRONT-SVC-19 — isAuthenticated basado solo en localStorage [MEDIUM]
- authStore.ts:33 — `!!localStorage.getItem('auth_token')`. No verifica expiración.
- Fix: Inicializar como false o decodificar JWT.

### FRONT-SVC-20 — Rol 'analyst' se muestra como 'Operador' [MEDIUM]
- Header.jsx:74-76 — `user?.role === 'admin' ? 'Administrador' : 'Operador'`. analyst → Operador incorrectamente.
- Fix: Usar mapeo completo con 'Analista'.

### FRONT-SVC-21 — Condición siempre falsa en useServerEvents [MEDIUM]
- useServerEvents.js:18 — `if (!window.location) return;` siempre pasa.
- Fix: Implementar verificación real o eliminar línea.

### FRONT-SVC-22 — Dependencia selectedCameraId causa loop [MEDIUM]
- useCameraManager.js:120 — scanCameras depende de selectedCameraId. Cuando selecciona cámara por defecto, cambia selectedCameraId → recrea scanCameras → re-escaneo.
- Fix: Eliminar selectedCameraId de dependencias.

### FRONT-SVC-23 — authStore login usa fetch nativo [LOW]
### FRONT-SVC-24 — suppressWarnings sobrescribe console global [LOW]
### FRONT-SVC-25 — Map<string, any> sin tipado [LOW]
### FRONT-SVC-26 — deleteBulkSample envía data en body DELETE [LOW]
### FRONT-SVC-27 — Comentario numérico salta de 2 a 4 [LOW]
### FRONT-SVC-28 — Posible colisión de hash en fingerprint [LOW]
### FRONT-SVC-29 — Caché en Map global sin límite [LOW]
### FRONT-SVC-30 — Polling 30s innecesario [LOW]

---

## HALLAZGOS TRANSVERSALES FRONTEND

### FRONT-CROSS-01 — Arquitectura de autenticación dual [HIGH]
- Conviven `AuthContext.jsx` (usado) y `authStore.ts` (código muerto). Ambos escriben token en localStorage contradiciendo cookie httpOnly.

### FRONT-CROSS-02 — Circuit Breaker duplicado JS+TS [HIGH]
- Dos implementaciones con bugs distintos (argumentos perdidos, falta errorFilter). Resolución ambigua según bundler.

### FRONT-CROSS-03 — Contrato API inconsistente [HIGH]
- Tres interpretaciones diferentes de la respuesta: `response.data`, `response.data.data`, `response.data.data.shelves`.

### FRONT-CROSS-04 — PropTypes ausentes en todos los componentes [LOW]
- Ninguno de los ~60 componentes JSX define PropTypes. Cero validación de tipos en desarrollo.

---

# Base de Datos — Hallazgos

## Resumen DB

| Área | CRÍTICOS | HIGH | MEDIUM | LOW | Total |
|------|:--------:|:----:|:------:|:---:|:-----:|
| migration-001-init.sql | 1 | 2 | 2 | 0 | 5 |
| migration-002-enable-rls.sql | 0 | 0 | 1 | 0 | 1 |
| migration-003-add-batch-id.sql | 0 | 0 | 0 | 0 | 0 |
| migration-004-extend-action-type.sql | 0 | 0 | 0 | 0 | 0 |
| migrate.js (runner) | 1 | 0 | 1 | 0 | 2 |
| migrationRunner.js (auto-runner) | 0 | 1 | 0 | 0 | 1 |
| create_tables.js | 0 | 2 | 1 | 0 | 3 |
| **TOTAL DB** | **2** | **3** | **4** | **0** | **9** |

---

## Top Hallazgos DB

| # | ID | Severidad | Archivo:Línea | Problema |
|---|----|-----------|---------------|----------|
| 1 | DB-01 | 🔴 CRITICAL | `migration-001-init.sql:346-353` | RLS habilitado en 9 tablas sin ninguna política (`CREATE POLICY`) — acceso denegado a TODAS las filas. migration-002 lo desactiva para dev, pero en producción sin migration-002 el sistema es inoperable |
| 2 | DB-02 | 🔴 CRITICAL | `migration-001-init.sql:264` | `movements.user_id` con `ON DELETE CASCADE` — eliminar un usuario borra TODO el historial de movimientos. Datos de trazabilidad irrecuperables |
| 3 | DB-03 | 🔴 CRITICAL | `migrate.js:82-88` | `finally` block ejecuta `process.exit(0)` SIEMPRE, incluso después de `process.exit(1)` en catch. El script retorna código 0 aunque falle — CI/CD no detecta error |
| 4 | DB-04 | HIGH | `migration-001-init.sql:169` | `global_samples.supplier_id` sin `ON DELETE` — no se puede eliminar un proveedor que tenga muestras asociadas |
| 5 | DB-05 | HIGH | `create_tables.js:20-39` | Tablas `backups` y `settings` creadas fuera del sistema de migraciones — el schema está fragmentado en dos mecanismos distintos |
| 6 | DB-06 | HIGH | `create_tables.js:20-39` | `CREATE TABLE` e `INSERT` en una sola llamada `query()` sin transacción — si el INSERT falla, las tablas quedan creadas sin datos por defecto |
| 7 | DB-07 | HIGH | `migrationRunner.js:43-69` | Sin advisory lock ni fila de bloqueo — dos instancias del servidor booteando simultáneamente ejecutan la misma migración duplicada |
| 8 | DB-08 | MEDIUM | `migration-001-init.sql:437-466` | `v_shelf_occupancy` usa 3 subconsultas correlacionadas que computan `occupied_cells` y `free_cells` por separado — el cálculo de celdas ocupadas se ejecuta 2 veces |
| 9 | DB-09 | MEDIUM | `migration-001-init.sql:125` | Columna `provider` en `shelves` con comment "deprecado en favor de shelf_suppliers" pero sin plan de migración — datos duplicados |
| 10 | DB-10 | MEDIUM | `migrate.js:51` | `pool.connect()` sin timeout — si la DB no responde, el migration runner cuelga indefinidamente |
| 11 | DB-11 | MEDIUM | `migration-001.sql ↔ migration-002.sql` | RLS se activa en migration-001 y se desactiva en migration-002. Contradicción: o se usa RLS con políticas reales, o se elimina por completo |

---

## migration-001-init.sql — Schema principal

### DB-01 — RLS activado sin políticas [CRITICAL]
- Líneas 346-353: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en 9 tablas.
- PostgreSQL RLS sin `CREATE POLICY` = deny all. Ningún usuario (incluyendo admin) puede leer/escribir filas.
- migration-002.sql desactiva RLS, confirmando que es un error de diseño en lugar de una configuración intencional.
- Fix: Eliminar las sentencias `ENABLE ROW LEVEL SECURITY` de migration-001, o crear políticas reales por rol.

### DB-02 — movements.user_id ON DELETE CASCADE [CRITICAL]
- Línea 264: `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- Eliminar un usuario elimina en cascada TODO el historial de movimientos (trazabilidad).
- La tabla `movements` debería ser inmutable por diseño.
- Fix: Cambiar a `ON DELETE SET NULL` o mantener `NO ACTION` (default). El historial no debe desaparecer.

### DB-04 — supplier_id sin ON DELETE [HIGH]
- Línea 169: `supplier_id UUID NOT NULL REFERENCES suppliers(id)` — sin `ON DELETE` explícito.
- PostgreSQL default es `NO ACTION`: no permite eliminar un proveedor referenciado.
- Fix: Agregar `ON DELETE RESTRICT` (explícito) o decidir comportamiento.

### DB-08 — v_shelf_occupancy subconsultas ineficientes [MEDIUM]
- Líneas 437-466: 3 subconsultas correlacionadas para calcular `occupied_cells` y `free_cells`.
- `free_cells = total_capacity - occupied_cells` pero occupied_cells se recalcula en ambas expresiones.
- Fix: Computar `occupied_cells` una vez con CTE o función auxiliar.

### DB-09 — Columna provider deprecada sin plan [MEDIUM]
- Línea 125: `provider VARCHAR(100)` con comment "deprecado en favor de shelf_suppliers".
- Datos duplicados entre `shelves.provider` y la tabla `shelf_suppliers`.
- Fix: Agregar migración para eliminar la columna o plan de deprecación con timeline.

### DB-11 — RLS contradictorio [MEDIUM]
- migration-001 lo activa, migration-002 lo desactiva.
- El schema de producción no puede correr migration-002 (no existe en GitHub), pero migration-001 tiene RLS activo sin políticas → sistema inoperable.
- Fix: Decidir una dirección — migrar a RLS con políticas reales, o eliminar RLS del schema base.

### DB-12 — SPLIT_PART frágil en seed data [LOW]
- Línea 408: `SPLIT_PART(s.provider, ' ', 1)` para mapear proveedor en shelf_suppliers.
- Proveedores como "MIXTO #1" o "BASF & THOR" no matchean ningún supplier real — mapeo silenciosamente omitido por `ON CONFLICT DO NOTHING`.
- Fix: Usar JOIN explícito basado en shelf_suppliers seed data o usar driver script JS.

### DB-13 — global_samples.provider campo legacy sin validación [LOW]
- Línea 171: Campo legacy mantenido por compatibilidad. Sin check de consistencia con supplier_id.
- Fix: Agregar trigger CHECK o migración para eliminar.

---

## migration-002-enable-rls.sql

Sin hallazgos críticos. Ver DB-11 (contradicción con migration-001).

---

## migration-003-add-batch-id-to-movements.sql

Sin hallazgos. Usa `IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, idempotente y correcto.

---

## migration-004-extend-action-type-enum.sql

Sin hallazgos. Usa `IF NOT EXISTS` correctamente.

---

## migrate.js — Migration runner manual

### DB-03 — finally block siempre exit(0) [CRITICAL]
- Líneas 82-88:
```js
} catch (err) {
    process.exit(1);  // ← catch llama exit(1)
} finally {
    await pool.end();
    process.exit(0);  // ← finally SIEMPRE llama exit(0), SOBREESCRIBE el exit(1)
}
```
- `finally` se ejecuta incluso después de `catch`. El `process.exit(0)` en finally siempre gana.
- Fix: Eliminar `process.exit(0)` del finally. Usar `process.exitCode = 1` en catch.

### DB-10 — Sin timeout en pool.connect() [MEDIUM]
- Línea 51: `const client = await pool.connect()` — si PostgreSQL no responde (caído, firewall, etc.), el script cuelga sin timeout.
- Fix: Agregar `connectionTimeoutMillis` en la configuración del pool (config.js).

### DB-14 — Sin logging estructurado [LOW]
- Solo console.log para output. Sin soporte para JSON logging o niveles.
- Fix: Bajo prioridad.

---

## migrationRunner.js — Auto migration runner

### DB-07 — Sin advisory lock para migraciones concurrentes [HIGH]
- Líneas 43-69: Dos instancias del servidor Node.js iniciando simultáneamente (p.ej., después de crash, PM2 restart, orquestador) ejecutarían migraciones duplicadas.
- La UNIQUE constraint en `schema_migrations.name` evitaría inserción duplicada, pero la migración real se ejecuta ANTES del INSERT. La segunda instancia podría correr la misma migración (ALTER TABLE... ADD COLUMN) y fallar.
- Fix: Usar `pg_advisory_lock()` o bloqueo de fila con `SELECT ... FOR UPDATE` al inicio del proceso.

### DB-15 — throw err crashea el servidor en boot [MEDIUM]
- Línea 66: `throw err` propaga error al caller en `index.js` — el servidor no arranca si una migración falla.
- Esto es intencional (seguridad sobre disponibilidad), pero debería ser configurable.
- Fix: Agregar flag `--skip-migration-errors` o env var.

---

## create_tables.js — Tablas auxiliares

### DB-05 — Tablas fuera del sistema de migraciones [HIGH]
- `backups` y `settings` se crean con `CREATE TABLE IF NOT EXISTS` en un script aparte.
- Si se agrega una columna a `backups`, no hay migración para eso — el schema está fragmentado.
- Fix: Mover DDL de `backups` y `settings` a migration-005.sql en el sistema de migraciones.

### DB-06 — Múltiples statements sin transacción [HIGH]
- Línea 20-39: `query()` ejecuta CREATE TABLE backups, CREATE TABLE settings, e INSERT de configuración por defecto en una sola llamada.
- Si el INSERT falla (p.ej., tipo JSONB inválido), las tablas quedan creadas parcialmente sin datos por defecto — estado inconsistente.
- Fix: Envolver en transacción explícita con BEGIN/COMMIT/ROLLBACK.

### DB-16 — Default backup config sin validación [MEDIUM]
- Línea 37-39: `'{"interval_days": 20, "hour": 12}'` hardcodeado. Sin validación de rango: hour=25, interval_days=0 se insertan sin error.
- Fix: Agregar validación en aplicación y CHECK constraints en la tabla.

---

## HALLAZGOS TRANSVERSALES DB

### DB-CROSS-01 — Schema fragmentado en 3 mecanismos [HIGH]
- migration-001 → DDL principal (migraciones).
- create_tables.js → backups + settings (script aparte).
- setup/routes.js → CREATE DATABASE + JWT secret + admin user (wizard).
- Sin único source of truth para el schema completo. Para reconstruir la DB desde cero, hay que ejecutar 3 procesos distintos en orden específico.
- Fix: Unificar todo DDL en migraciones numeradas. El setup wizard solo debe correr migraciones.

### DB-CROSS-02 — seed data mezclada con schema [LOW]
- migration-001 incluye INSERTs de market_lines, suppliers, shelves, shelf_suppliers.
- Para resetear datos de prueba, hay que editar migration-001 — mezcla schema con seed data.
- Fix: Separar seeds en migration-999-seed.sql o script independiente.

---

**Fin del reporte completo — 355 hallazgos documentados (32 CRÍTICOS, 94 HIGH, 132 MEDIUM, 97 LOW).**
