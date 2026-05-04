# 5. CARACTERÍSTICAS DE LOS USUARIOS Y CONTROL DE ACCESO

## 5.1. Modelo de Control de Acceso

**Handler TrackSamples** implementa un modelo de seguridad de doble capa denominado **RBAC + Permisos Granulares JSONB**:

1. **Capa de Transporte (JWT):** Cada petición HTTP a la API debe incluir un token JWT válido en el encabezado `Authorization: Bearer <token>`. El token es firmado con la clave `JWT_SECRET` y expira en 8 horas. El middleware `auth` verifica la firma criptográfica del token antes de permitir el acceso a cualquier controlador.

2. **Capa de Base de Datos (RLS):** Independientemente de los controles de la API, PostgreSQL evalúa las **21 políticas de Row Level Security** para cada operación SQL, garantizando que incluso si la capa de aplicación fuera comprometida, los datos no serían accesibles sin el contexto de sesión correcto.

3. **Capa de Interfaz (React PermissionRoute):** El frontend intercepta las rutas de navegación usando el componente `PermissionRoute`, que verifica el objeto `permissions` JSONB del usuario antes de renderizar cualquier módulo. Si el permiso está ausente o es `false`, muestra una pantalla de "Acceso Denegado" sin redirigir, evitando bucles de navegación.

## 5.2. Roles del Sistema

El sistema define 3 roles mediante el tipo ENUM `user_role`:

### Rol `admin` — Administrador del Sistema
Perfil de máxima jerarquía. Diseñado para el coordinador técnico o responsable del área de TI.

**Acceso a Módulos (requiere ser `admin`):**
- `/backup` → Gestión completa del sistema de copias de seguridad.
- `/users` → Centro de control de usuarios: crear, editar, eliminar cuentas y asignar roles.

**Permisos Granulares del Administrador (47 permisos booleanos en JSONB):**
```json
{
  "dashboard.view": true,
  "samples.view": true, "samples.create": true, "samples.edit": true,
  "samples.delete": true, "samples.export": true, "samples.view_coa": true,
  "dispensing.view": true, "dispensing.create": true, "dispensing.reassign": true,
  "dispatch.view": true, "dispatch.execute": true, "dispatch.fefo": true,
  "warehouse.view": true, "warehouse.create_shelf": true, "warehouse.edit_shelf": true,
  "warehouse.delete_shelf": true, "warehouse.place_sample": true,
  "warehouse.move_sample": true, "warehouse.remove_sample": true,
  "warehouse.defragment": true,
  "movements.view": true, "movements.export": true,
  "suppliers.view": true, "suppliers.create": true, "suppliers.edit": true,
  "suppliers.delete": true,
  "market_lines.view": true, "market_lines.create": true,
  "market_lines.edit": true, "market_lines.delete": true,
  "alerts.view": true,
  "reports.view": true
}
```

### Rol `operator` — Operador de Almacén
Perfil operativo para el técnico de laboratorio o auxiliar de bodega.

**Restricciones técnicas por política de sistema:**
- **No puede acceder** a `/backup` ni a `/users` (bloqueado por `AdminRoute` en el router de React y validado por JWT en el backend).
- **No puede crear anaqueles** (`warehouse.create_shelf: false`), editar ni eliminar proveedores o líneas de mercado, según el JSONB de permisos asignado por el administrador.
- **No puede exportar** el log de movimientos si el administrador no habilitó `movements.export`.

### Rol `analyst` — Analista
Perfil de lectura extendida. Puede ver reportes y logs, pero no ejecutar operaciones transaccionales de escritura.

## 5.3. Sistema de Permisos Granulares

El administrador puede configurar **47 permisos individuales** para cada usuario desde el módulo de gestión de usuarios. Esta configuración se almacena en la columna `permissions JSONB` de la tabla `users`.

El frontend evalúa los permisos mediante el hook `useAuth()` y la función `hasPermission(permissionKey)`. Si el permiso no existe o es `false`, el módulo correspondiente no se renderiza y muestra la pantalla de "Acceso Denegado" con el código del permiso faltante.

## 5.4. Sistema de Doble Contraseña

Cada usuario en el sistema tiene **dos contraseñas independientes**, ambas almacenadas como hashes BCrypt:

| Campo | Uso |
|---|---|
| `password_hash` | Contraseña principal: usada en el login diario |
| `secret_password_hash` | Contraseña secreta: usada para confirmar operaciones críticas como la restauración de un backup. No puede ser la misma que la principal en un entorno de producción seguro |

> **Nota Técnica:** Durante la instalación inicial, el sistema crea un usuario `admin` con contraseña `admin123` para ambos campos. Se debe cambiar esta contraseña inmediatamente después de la primera instalación en un entorno de producción real.
