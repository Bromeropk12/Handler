# 11. SOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

Esta sección documenta las incidencias técnicas más frecuentes en el ciclo de vida del sistema, con su diagnóstico de causa raíz y el procedimiento de resolución paso a paso para el equipo de Tecnologías de la Información.

---

## 11.1. Error de Conexión a la Base de Datos (ECONNREFUSED en puerto 5432)

**Síntoma:** La aplicación inicia correctamente (ventana Electron visible), pero la pantalla de login muestra un error de conexión o la pantalla queda en estado de carga indefinida. En los logs del backend se observa:
```
Error en query: connect ECONNREFUSED 127.0.0.1:5432
```

**Causa Raíz:** El contenedor Docker `handler-track-samples-db` con PostgreSQL no está en ejecución. Esto ocurre si:
- Docker Desktop fue cerrado o no se inició con Windows.
- El contenedor quedó en estado `Exited` por una terminación abrupta del sistema.
- WSL2 experimentó un fallo y el motor de Docker no pudo inicializarse.

**Procedimiento de Resolución:**
```powershell
# Paso 1: Verificar estado del demonio Docker
docker info
# Si falla: Abrir Docker Desktop y esperar estado "Running"

# Paso 2: Verificar estado del contenedor
docker ps -a | Select-String "handler"

# Paso 3a: Si el contenedor existe pero está detenido (Exited):
docker start handler-track-samples-db

# Paso 3b: Si el contenedor no existe (fue eliminado):
# Volver a ejecutar Handler_TrackSamples_Setup.exe en modo "Reparar"
# o ejecutar manualmente:
docker run -d `
  --name handler-track-samples-db `
  -e POSTGRES_USER=handler_user `
  -e POSTGRES_PASSWORD=handler_password `
  -e POSTGRES_DB=handler_track_samples `
  -p 5432:5432 `
  -v postgres_data:/var/lib/postgresql/data `
  postgres:15-alpine

# Paso 4: Verificar conectividad
docker exec -it handler-track-samples-db psql -U handler_user -d handler_track_samples -c "SELECT version();"
```

---

## 11.2. Colisión de Puertos Locales (EADDRINUSE)

**Síntoma:** El proceso de backend de Electron falla silenciosamente al arrancar. En los logs internos:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```

**Causa Raíz:** Otro proceso en Windows ya está escuchando en el puerto `3001` (API) o `3000` (frontend). Puede ser una instancia anterior del sistema que quedó en segundo plano, o un servicio de terceros con el mismo puerto.

**Procedimiento de Resolución:**
```powershell
# Identificar el proceso que ocupa el puerto 3001
netstat -ano | Select-String ":3001"
# Anotar el PID de la última columna

# Terminar el proceso por PID
taskkill /PID [NUMERO_PID] /F

# Repetir para el puerto 3000 si también hay conflicto
netstat -ano | Select-String ":3000"
taskkill /PID [NUMERO_PID] /F

# Reiniciar la aplicación Handler TrackSamples
```

---

## 11.3. Fallo de Renderizado WebGL — Módulo Almacén 3D (Pantalla Negra)

**Síntoma:** Al navegar al módulo de Almacén, el canvas 3D aparece completamente negro o con artefactos gráficos. La consola del Inspector de Electron muestra:
```
WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost
```
o
```
THREE.WebGLRenderer: A WebGL context could not be created.
```

**Causa Raíz:** 
- Los controladores (drivers) de la tarjeta de video están desactualizados.
- El proceso de Chromium de Electron agotó la memoria de video disponible (VRAM).
- El sistema está corriendo en una sesión de Escritorio Remoto (RDP), que no transmite aceleración 3D de hardware.

**Procedimiento de Resolución:**
1. Actualizar los controladores de video desde el sitio oficial del fabricante (Intel, NVIDIA o AMD).
2. Cerrar completamente la aplicación y reabrirla para liberar el contexto WebGL agotado.
3. Si el problema persiste en RDP, agregar el flag de Chromium al proceso de Electron:
   - En el directorio de instalación, editar `electron.js` y agregar `app.commandLine.appendSwitch('disable-gpu')` como medida temporal. Esto deshabilita la aceleración 3D pero estabiliza el renderizado.

---

## 11.4. JWT Expirado — Sesión Invalidada Inesperadamente

**Síntoma:** El usuario estaba trabajando y de repente la aplicación lo redirige a la pantalla de login mostrando "Sesión expirada".

**Causa Raíz:** El token JWT tiene una expiración configurable de 8 horas (`JWT_EXPIRES_IN=8h` en el `.env`). Si la sesión del usuario supera ese tiempo sin actividad (o con actividad pero sin renovación del token), el backend rechaza todas las peticiones con `401 Unauthorized`.

**Procedimiento de Resolución:** Esto es comportamiento esperado y correcto por diseño de seguridad. El usuario debe iniciar sesión nuevamente. Para ajustar la duración de la sesión en instalaciones donde se requiera mayor persistencia, modificar la variable `JWT_EXPIRES_IN` en el archivo `.env`:
```env
# Opciones válidas: '8h', '12h', '24h', '7d'
JWT_EXPIRES_IN=24h
```
Luego reiniciar la aplicación para que el cambio surta efecto.

---

## 11.5. Error en la Restauración de Backup — ROLLBACK Automático

**Síntoma:** Al intentar restaurar un backup, el sistema devuelve un error y no se producen cambios en la base de datos.

**Causa Raíz posible A:** La contraseña del administrador proporcionada no coincide con el `password_hash` almacenado en la tabla `users`. El sistema cancela la restauración por seguridad con error `401`.

**Causa Raíz posible B:** El archivo JSON del backup está corrompido o tiene una versión de esquema incompatible con la actual estructura de las tablas.

**Causa Raíz posible C:** Una restricción de clave foránea o una restricción `CHECK` impide la inserción de alguna fila. El sistema hace `ROLLBACK` automático completo.

**Procedimiento de Resolución:**
1. Verificar que la contraseña ingresada es la correcta para el usuario administrador.
2. Revisar los logs de Winston en el directorio de instalación para obtener el detalle del error SQL específico.
3. Si el backup está corrompido, seleccionar un backup anterior disponible en el listado.

---

## 11.6. Columna `total_capacity` — Error al Insertar en `shelves`

**Síntoma:** Al intentar insertar datos directamente en la tabla `shelves` mediante SQL externo, se produce el error:
```
ERROR: column "total_capacity" is a generated column
```

**Causa Raíz:** `total_capacity` es una **columna GENERATED** (`GENERATED ALWAYS AS (grid_width * grid_height * shelf_depth) STORED`). PostgreSQL no permite insertar valores en columnas generadas manualmente.

**Procedimiento de Resolución:** Excluir explícitamente la columna `total_capacity` de cualquier sentencia `INSERT` o `UPDATE` manual. El valor es calculado y actualizado automáticamente por el motor de PostgreSQL. Esta exclusión ya está implementada en el sistema de restauración de backups (`GENERATED_COLUMNS = { shelves: ['total_capacity'] }`).

---

## 11.7. Tabla de Errores HTTP Frecuentes

| Código HTTP | Error | Causa Probable |
|---|---|---|
| `400 Bad Request` | Campos requeridos faltantes o formato inválido | Validación Joi fallida en el payload de la petición |
| `401 Unauthorized` | Token JWT inválido o expirado | Sesión vencida o contraseña incorrecta |
| `403 Forbidden` | Permiso JSONB insuficiente | El usuario no tiene el permiso granular requerido para la operación |
| `404 Not Found` | Recurso no encontrado en la BD | ID inexistente o registro ya eliminado |
| `409 Conflict` | Duplicado: `UNIQUE constraint` violado | Username, QR code o nombre de anaquel ya existe |
| `429 Too Many Requests` | Rate limit excedido | Más de 5000 peticiones en 15 minutos desde la misma IP |
| `500 Internal Server Error` | Error inesperado en el controlador | Revisar logs de Winston; usualmente es un error de conexión a PostgreSQL |
