# 3. CARACTERÍSTICAS DE LOS USUARIOS DEL SISTEMA

El sistema interactúa con el usuario desde una perspectiva puramente técnica a nivel de roles y permisos, controlados tanto por JWT en la API como por las políticas RLS en PostgreSQL.

### 3.1. Rol Administrador (Admin)
Usuario técnico o coordinador operativo principal.
*   **Permisos de Base de Datos:** Acceso de lectura y escritura (`INSERT`, `UPDATE`, `DELETE`) en todas las tablas bajo políticas de RLS.
*   **Responsabilidades en el Sistema:** Creación de nuevos usuarios, gestión de líneas de mercado, edición de las propiedades físicas de los anaqueles y generación de copias de seguridad (Backups) del clúster de datos.
*   **Restricciones:** Sus acciones quedan inmutables en la tabla de `movements` (Trazabilidad).

### 3.2. Rol Operador (Operator)
Usuario logístico o técnico de laboratorio encargado del día a día.
*   **Permisos de Base de Datos:** Permisos restringidos. Puede ejecutar `SELECT` en las tablas de configuración global, pero su capacidad de `INSERT` está limitada a la recepción de muestras y el proceso de dispensación de envases hijos.
*   **Responsabilidades en el Sistema:** Operación del almacén, consulta de compatibilidad SGA, asignación de ubicaciones, despachos (FEFO).
*   **Restricciones:** No puede eliminar usuarios, no puede crear anaqueles ni alterar las dimensiones físicas del almacén, tampoco tiene acceso al módulo de Backups de la base de datos.
