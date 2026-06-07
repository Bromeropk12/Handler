# 12. EVALUACIÓN DE SEGURIDAD DEL SISTEMA

## 12.1. Resumen de Controles Implementados

**Handler TrackSamples** implementa un modelo de seguridad en múltiples capas que abarca desde el transporte HTTP hasta el nivel de filas en la base de datos. A continuación se documentan todos los controles de seguridad presentes en el sistema.

| Control | Estado | Ubicación | Descripción |
|---|---|---|---|
| Autenticación JWT | ✅ Implementado | `middleware/auth.js` | Tokens firmados con JWT_SECRET, expiración configurable (defecto: 8h) |
| Hash de contraseñas | ✅ BCrypt 12 rondas | `bcryptjs` | password_hash y secret_password_hash independientes |
| Helmet (seguridad HTTP) | ✅ Implementado | `index.js:125` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| CORS restringido | ✅ Solo LAN | `index.js:167` | Solo localhost, 192.168.x.x, 10.x.x.x, 172.16-31.x.x |
| Rate Limiting | ✅ 5000 req/15min | `index.js:116` | Por IP, con mensaje personalizado |
| Permissions-Policy | ✅ Restrictivo | `index.js:155` | Solo camera, microphone; bloquea geolocation, usb, payment |
| Row Level Security | ✅ 21 políticas | `migration-001-init.sql` | En 8 tablas, controla acceso a nivel de fila en PostgreSQL |
| Sanitización de Logs | ✅ Automática | `utils/sanitizer.js` | Redacta passwords, tokens, cookies antes de loguear |
| Validación de entrada | ✅ Joi schemas | Cada módulo | En todos los endpoints de la API |
| Path Traversal Protection | ✅ Implementado | `utils/pathSecurity.js` | Previene escape de directorio en descarga de archivos |
| Doble factor en backup | ✅ Contraseña admin | `backup/controller.js` | Requiere verificación BCrypt para restaurar backups |
| CSP sin unsafe-eval | ✅ En producción | `index.js:138` | `scriptSrc: ["'self'"]` en producción; deshabilita eval() |
| SQL Injection | ✅ Prevenido | `pg` driver + parametrización | Todas las consultas usan parámetros, no concatenación |

## 12.2. Arquitectura de Seguridad en Capas

```
[Internet Público] → BLOQUEADO por CORS (solo LAN)
       ↓
[Firewall de Windows] → Puerto 3001 abierto solo en perfiles privado/público
       ↓
[Helmet] → Cabeceras HTTP de seguridad (CSP, HSTS, XSS)
       ↓
[CORS] → Solo orígenes de red local (192.168.x.x, 10.x.x.x)
       ↓
[Rate Limiter] → Máx. 5000 req/15 min por IP
       ↓
[Permissions-Policy] → Solo features esenciales
       ↓
[Logger + Sanitizer] → Logs sin datos sensibles
       ↓
[JWT Auth Middleware] → Verificación de token en rutas protegidas
       ↓
[Joi Validation] → Validación y sanitización de payload
       ↓
[Controlador] → Lógica de negocio con SQL parametrizado
       ↓
[PostgreSQL RLS] → 21 políticas de seguridad a nivel de fila
       ↓
[Tablas + Vistas SQL]
```

## 12.3. Política de Seguridad de Contenido (CSP)

```http
Content-Security-Policy:
  default-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  script-src 'self';  # ← Sin 'unsafe-eval' en producción
  script-src-attr 'none';
  img-src 'self' data: blob:;
  connect-src 'self' ws: wss:;
  form-action 'self';
```

## 12.4. Gestión de Contraseñas

| Aspecto | Implementación |
|---|---|
| Algoritmo de hash | BCrypt con 12 rondas de sal (`bcryptjs`) |
| Contraseña principal | `password_hash` — usada en el login diario |
| Contraseña secreta | `secret_password_hash` — usada para operaciones críticas (restauración de backup) |
| Longitud mínima | 8 caracteres (validado en el frontend) |
| Complejidad sugerida | Mayúsculas, minúsculas, números, caracteres especiales |
| Almacenamiento | Nunca en texto plano; solo hashes en la tabla `users` |
| Recuperación | No existe autogestión — el Administrador restablece desde el panel de usuarios |

## 12.5. Seguridad en la Comunicación entre Capas

**Frontend → Backend (localhost:3001):**
- Comunicación HTTP (sin HTTPS por decisión de diseño documentada).
- Cada petición incluye el JWT en el header `Authorization: Bearer <token>`.
- El frontend almacena el token en memoria (Zustand state), no en `localStorage` ni cookies.

**Backend → PostgreSQL (localhost:5432):**
- Conexión local (loopback), sin exposición a la red.
- Pool de conexiones con autenticación por usuario/contraseña.
- RLS habilitado en todas las tablas.

## 12.6. Riesgos Conocidos y Mitigaciones

| Riesgo | Nivel | Descripción | Mitigación |
|---|---|---|---|
| HTTP sin TLS en LAN | ⚠️ Medio | El tráfico entre el frontend y el backend viaja en texto plano | Aceptado por diseño: la red es privada y local. Los certificados autofirmados causan más problemas de los que resuelven en este contexto |
| Contraseña hardcodeada en el instalador | ⚠️ Medio | `installer.nsh` contiene `!Handler2026` como contraseña de PostgreSQL | Solo se usa durante la instalación inicial. Se puede cambiar posteriormente. Es la contraseña del superusuario `postgres`, no del sistema |
| Admin Recovery JSON | ⚠️ Bajo | Un archivo `admin-recovery.json` en el directorio raíz permite recuperar acceso | Se autodestruye después de leerlo. Bloqueado en producción a menos que `ALLOW_ADMIN_RECOVERY=true` |
| Swagger UI en desarrollo | ⚠️ Bajo | Expone la estructura completa de la API si se habilita | Deshabilitado en producción (`NODE_ENV !== 'production'`) |
| Acceso desde cualquier IP en la LAN | ⚠️ Bajo | El backend escucha en `0.0.0.0:3001` | Mitigado por CORS que restringe orígenes a IPs privadas; el firewall permite el puerto 3001 |
| Sesión JWT de 8h | ℹ️ Normal | La sesión expira a las 8 horas sin posibilidad de renovación automática | Decisión de seguridad: minimiza ventana de exposición si un token es robado |

## 12.7. Prácticas Recomendadas de Seguridad para Producción

1. **Cambiar la contraseña de PostgreSQL:** Después de la instalación, cambiar la contraseña del superusuario `postgres` desde pgAdmin o línea de comandos.
2. **Actualizar el JWT_SECRET:** Si se usó el generado automáticamente por el setup wizard, considerar regenerarlo periódicamente.
3. **Configurar expiración de sesión:** Ajustar `JWT_EXPIRES_IN` según la política de seguridad de la organización (valor recomendado: 8h).
4. **Monitoreo de logs:** Revisar periódicamente los logs en `C:\ProgramData\HandlerTrackSamples\logs\` para detectar intentos de acceso no autorizados.
5. **Backups externos:** Además de los backups automáticos almacenados en la BD, exportar backups a medios externos (USB, NAS, nube corporativa).
6. **Actualizaciones:** Mantener PostgreSQL actualizado con los últimos parches de seguridad publicados por el proyecto PostgreSQL.
7. **Firewall:** Si no se necesita acceso desde otros equipos de la red, eliminar la regla de firewall del puerto 3001 para restringir el acceso solo a `localhost`.

## 12.8. Registro de Incidentes de Seguridad

| Fecha | Incidente | Acción Tomada | Estado |
|---|---|---|---|
| 2026-06-05 | Filtración de contraseñas en logs históricos | Desarrollo e implementación del script `purge-sensitive-logs.js` (v1.1) con circuit breaker y 15 tests E2E | ✅ Resuelto |
| 2026-06-05 | Bug en regla de purga: backreferences no expandidas | Fix v1.1: separación de conteo y reemplazo en `String.replace()` | ✅ Resuelto |
| 2026-06-05 | Bug en regla de purga: rule 6 matcheaba JSON keys | Fix v1.1: negative lookbehind para excluir keys | ✅ Resuelto |
