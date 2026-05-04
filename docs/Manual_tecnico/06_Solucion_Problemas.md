# 6. SOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

Esta sección aborda los inconvenientes técnicos más frecuentes que el personal de TI podría enfrentar al mantener o ejecutar la plataforma Handler TrackSamples.

### 6.1. Fallo al Iniciar el Sistema (Problemas de Puertos)
**Síntoma:** El comando `iniciar-sistema.bat` se detiene o arroja el error `EADDRINUSE`.
**Causa:** Los puertos 3000 (React), 3001 (Node API) o 5432 (Postgres) están ocupados por otros procesos del sistema operativo.
**Solución Técnica:**
1.  En Windows, abrir un CMD como administrador y ejecutar `netstat -ano | findstr :3000` (o el puerto respectivo).
2.  Anotar el PID del proceso al final de la línea.
3.  Ejecutar `taskkill /PID [NUMERO_PID] /F`.
4.  Reiniciar la aplicación.

### 6.2. La Base de Datos no acepta conexiones (Errores de RLS o Docker)
**Síntoma:** El frontend carga, pero no es posible hacer login y los logs del backend muestran "ECONNREFUSED".
**Causa:** El contenedor `postgres:15-alpine` no logró iniciar, o las políticas RLS no se aplicaron correctamente tras la creación del volumen.
**Solución Técnica:**
1.  Verificar en Docker Desktop que el contenedor `handler-track-samples-db` esté en estado "Running".
2.  Si hubo una desincronización de esquemas RLS, ejecutar el script preparado para reparación ubicado en `database/scripts/apply-rls.bat`.
3.  Si la BD está corrupta (solo aplicable en pruebas), utilizar el comando de purga profunda (`reiniciar-db.bat`) en la raíz del proyecto, el cual borra el volumen y lo reconstruye ejecutando las migraciones SQL desde cero.

### 6.3. Problemas Visuales en el Almacén 3D (WebGL)
**Síntoma:** La pantalla principal se ve, pero el módulo "Almacén" se muestra en negro o genera un error de "Context Lost".
**Causa:** El equipo cliente no cuenta con aceleración de hardware habilitada o los drivers gráficos están desactualizados.
**Solución Técnica:**
*   Verificar que la tarjeta gráfica (integrada o dedicada) posea los controladores recientes.
*   En entornos web (Chrome/Edge), asegurarse de tener habilitada la "Aceleración por Hardware" en la configuración del navegador.
*   En la versión empaquetada (Desktop/Electron), la aceleración se incluye por defecto, pero sistemas virtualizados o por RDP (Escritorio Remoto) pueden tener fallos al renderizar Three.js; se recomienda el uso físico de la estación de trabajo.
