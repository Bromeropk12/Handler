# 11. SOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

Esta sección documenta las incidencias técnicas más frecuentes en el ciclo de vida del sistema, con su diagnóstico de causa raíz y el procedimiento de resolución paso a paso para el equipo de Tecnologías de la Información.

---

## 11.1. Error de Conexión a la Base de Datos (ECONNREFUSED en puerto 5432)

**Síntoma:** La aplicación inicia correctamente (ventana Electron visible), pero la pantalla de login muestra un error de conexión o la pantalla queda en estado de carga indefinida. En los logs del backend se observa:
```
Error en query: connect ECONNREFUSED 127.0.0.1:5432
```

**Causa Raíz:** El servicio de Windows `postgresql-x64-15` no está en ejecución. Esto ocurre si:
- PostgreSQL fue detenido manualmente.
- El servicio no se inició correctamente al encender el equipo.
- PostgreSQL se desinstaló o corrompió.
- Un reinicio del sistema dejó el servicio en estado "Stopped".

**Procedimiento de Resolución:**
```powershell
# Paso 1: Verificar el estado del servicio PostgreSQL
Get-Service postgresql*

# Paso 2: Si aparece como "Stopped", iniciar el servicio
Start-Service postgresql-x64-15

# Paso 3: Verificar que el puerto 5432 está escuchando
netstat -ano | Select-String ":5432"

# Paso 4: Una vez el servicio esté Running, reiniciar el backend
nssm restart HandlerTrackSamples

# Paso 5: Verificar el health check
Invoke-RestMethod -Uri http://localhost:3001/health
```

**Si el servicio no existe (PostgreSQL no instalado):**
```powershell
# Reinstalar PostgreSQL
winget install --id PostgreSQL.PostgreSQL --silent --accept-source-agreements --accept-package-agreements
```

**Si el servicio se niega a iniciar (error 1068 o 1053):**
```powershell
# Revisar el log de eventos de Windows
Get-WinEvent -LogName Application | Where-Object { $_.ProviderName -like "*PostgreSQL*" } | Format-Table TimeCreated, Message -Wrap

# Reconstruir la configuración del servicio PostgreSQL
# (Contactar al administrador de sistemas o reinstalar PostgreSQL)
```

---

## 11.2. El Servicio HandlerTrackSamples no Arranca (Error 1053 o Timeout)

**Síntoma:** Al ejecutar `nssm start HandlerTrackSamples` o al iniciar Windows, el servicio no arranca y se muestra el error "El servicio no respondió a tiempo" (Error 1053).

**Causa Raíz:** El backend no puede conectarse a PostgreSQL porque el servicio de base de datos aún no está listo. El backend intenta migrar la base de datos al arrancar y falla si PostgreSQL no está disponible.

**Procedimiento de Resolución:**
```powershell
# Paso 1: Verificar que PostgreSQL esté en Running
Get-Service postgresql-x64-15

# Paso 2: Si está Stopped, iniciarlo y esperar 10 segundos
Start-Service postgresql-x64-15
Start-Sleep -Seconds 10

# Paso 3: Ahora iniciar el servicio HandlerTrackSamples
nssm start HandlerTrackSamples

# Paso 4: Verificar logs del backend
Get-Content "C:\ProgramData\HandlerTrackSamples\logs\combined-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 20
```

---

## 11.3. Colisión de Puertos Locales (EADDRINUSE)

**Síntoma:** El servicio `HandlerTrackSamples` falla al arrancar. En los logs:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```

**Causa Raíz:** Otro proceso en Windows ya está escuchando en el puerto `3001` (API). Puede ser una instancia anterior del sistema que quedó en segundo plano, o un servicio de terceros.

**Procedimiento de Resolución:**
```powershell
# Identificar el proceso que ocupa el puerto 3001
netstat -ano | Select-String ":3001"
# Anotar el PID de la última columna

# Terminar el proceso por PID
taskkill /PID [NUMERO_PID] /F

# Reiniciar el servicio
nssm restart HandlerTrackSamples
```

---

## 11.4. Fallo de Renderizado WebGL — Módulo Almacén 3D (Pantalla Negra)

**Síntoma:** Al navegar al módulo de Almacén, el canvas 3D aparece completamente negro o con artefactos gráficos. La consola del Inspector de Electron muestra:
```
WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost
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

## 11.5. JWT Expirado — Sesión Invalidada Inesperadamente

**Síntoma:** El usuario estaba trabajando y de repente la aplicación lo redirige a la pantalla de login mostrando "Sesión expirada".

**Causa Raíz:** El token JWT tiene una expiración configurable de 8 horas (`JWT_EXPIRES_IN=8h` en el `.env`). Si la sesión del usuario supera ese tiempo sin actividad, el backend rechaza todas las peticiones con `401 Unauthorized`.

**Procedimiento de Resolución:** Esto es comportamiento esperado y correcto por diseño de seguridad. El usuario debe iniciar sesión nuevamente. Para ajustar la duración de la sesión, modificar la variable `JWT_EXPIRES_IN` en el archivo `.env` ubicado en `C:\ProgramData\HandlerTrackSamples\.env`:
```env
# Opciones válidas: '8h', '12h', '24h', '7d'
JWT_EXPIRES_IN=24h
```
Luego reiniciar el servicio HandlerTrackSamples para que el cambio surta efecto:
```powershell
nssm restart HandlerTrackSamples
```

---

## 11.6. Error en la Restauración de Backup — ROLLBACK Automático

**Síntoma:** Al intentar restaurar un backup, el sistema devuelve un error y no se producen cambios en la base de datos.

**Causa Raíz posible A:** La contraseña del administrador proporcionada no coincide con el `password_hash` almacenado en la tabla `users`. El sistema cancela la restauración por seguridad con error `401`.

**Causa Raíz posible B:** El archivo JSON del backup está corrompido o tiene una versión de esquema incompatible con la actual estructura de las tablas.

**Causa Raíz posible C:** Una restricción de clave foránea o una restricción `CHECK` impide la inserción de alguna fila. El sistema hace `ROLLBACK` automático completo.

**Procedimiento de Resolución:**
1. Verificar que la contraseña ingresada es la correcta para el usuario administrador.
2. Revisar los logs de Winston en `C:\ProgramData\HandlerTrackSamples\logs\` para obtener el detalle del error SQL específico.
3. Si el backup está corrompido, seleccionar un backup anterior disponible en el listado.

---

## 11.7. Error al Actualizar el Sistema

**Síntoma:** Al ejecutar un nuevo instalador sobre una instalación existente, aparecen errores o la aplicación no funciona correctamente después de la actualización.

**Causa Raíz:** El archivo `.env` o los datos persistentes no son compatibles con la nueva versión, o el nuevo instalador no pudo reemplazar archivos en uso.

**Procedimiento de Resolución:**
1. Cerrar la aplicación Handler TrackSamples completamente.
2. Detener el servicio HandlerTrackSamples: `nssm stop HandlerTrackSamples`
3. Ejecutar nuevamente el instalador de actualización.
4. Si persiste, realizar una desinstalación completa (conservando datos) y reinstalar.

---

## 11.8. La Aplicación Electron se Abre en Pantalla en Blanco

**Síntoma:** Al hacer clic en el acceso directo, la ventana de Electron se abre pero la pantalla se queda en blanco o muestra "Error de conexión".

**Causa Raíz:** El frontend React no puede comunicarse con el backend API porque el servicio `HandlerTrackSamples` no está corriendo.

**Procedimiento de Resolución:**
```powershell
# Verificar que el servicio está activo
Get-Service HandlerTrackSamples

# Si está detenido, iniciarlo
nssm start HandlerTrackSamples

# Verificar conectividad
Invoke-RestMethod -Uri http://localhost:3001/health

# Cerrar y volver a abrir la aplicación Electron
```

---

## 11.9. Tabla de Errores HTTP Frecuentes

| Código HTTP | Error | Causa Probable |
|---|---|---|
| `400 Bad Request` | Campos requeridos faltantes o formato inválido | Validación Joi fallida en el payload de la petición |
| `401 Unauthorized` | Token JWT inválido o expirado | Sesión vencida o contraseña incorrecta |
| `403 Forbidden` | Permiso JSONB insuficiente | El usuario no tiene el permiso granular requerido para la operación |
| `404 Not Found` | Recurso no encontrado en la BD | ID inexistente o registro ya eliminado |
| `409 Conflict` | Duplicado: `UNIQUE constraint` violado | Username, QR code o nombre de anaquel ya existe |
| `429 Too Many Requests` | Rate limit excedido | Más de 5000 peticiones en 15 minutos desde la misma IP |
| `500 Internal Server Error` | Error inesperado en el controlador | Revisar logs de Winston en `C:\ProgramData\HandlerTrackSamples\logs\` |

---

## 11.10. Comandos de Diagnóstico Rápido

```powershell
# 1. Estado de todos los servicios del sistema
Get-Service postgresql*, HandlerTrackSamples

# 2. Heath check de la API
curl http://localhost:3001/health

# 3. Últimas líneas del log general
Get-Content "C:\ProgramData\HandlerTrackSamples\logs\combined-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 30

# 4. Últimas líneas del log de errores
Get-Content "C:\ProgramData\HandlerTrackSamples\logs\error.log" -Tail 30

# 5. Estado de los puertos
netstat -ano | Select-String ":3001|:5432"

# 6. Espacio en disco
Get-PSDrive C | Select-Object Used, Free
```
