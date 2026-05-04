# 9. SISTEMA DE BACKUPS Y RECUPERACIÓN DE DATOS

## 9.1. Arquitectura del Sistema de Backup

El sistema de copias de seguridad de **Handler TrackSamples** está diseñado con un enfoque de **alta disponibilidad local y zero-dependencia externa**. Los backups se generan, almacenan y restauran íntegramente dentro de la infraestructura local del sistema, sin transmitir ningún dato a servicios de terceros o redes externas.

**Principios de diseño del sistema de backup:**
1. **Localidad total:** El respaldo se almacena en la propia base de datos PostgreSQL local, dentro de la tabla `backups`. Adicionalmente, el archivo de estado del programador se escribe en `backend/backup_scheduler_state.json`, dentro del directorio de instalación.
2. **Integridad transaccional:** Toda restauración se ejecuta dentro de una transacción SQL (`BEGIN/COMMIT/ROLLBACK`). Si cualquier tabla falla durante la restauración, se aplica un `ROLLBACK` completo, garantizando que la base de datos no quede en estado inconsistente.
3. **Rotación automática:** El sistema mantiene un máximo de **3 backups** (constante `MAX_BACKUPS = 3`). Al crear un nuevo backup que supere este límite, el sistema elimina automáticamente el más antiguo. Esto asegura un histórico de aproximadamente 60 días sin saturar el almacenamiento.
4. **Segundo factor de autenticación:** La operación de restauración requiere la contraseña del administrador, verificada mediante `bcrypt.compare()`, como capa adicional de seguridad para prevenir restauraciones accidentales.

## 9.2. Formato del Archivo de Backup

Los backups se almacenan en formato **JSON estructurado** dentro del campo `data` (tipo `JSONB`) de la tabla `backups`. El esquema del objeto de backup es el siguiente:

```json
{
  "version": "2.0",
  "generatedAt": "2026-05-04T17:00:00.000Z",
  "timezone": "America/Bogota",
  "createdBy": "admin",
  "manual": true,
  "metadata": {
    "generatedBy": "Handler TrackSamples Backup System",
    "description": "Backup completo de la base de datos"
  },
  "tables": {
    "users": [ { "id": "...", "username": "...", ... } ],
    "global_samples": [ { "id": "...", "name": "...", ... } ],
    "dispensed_samples": [ { "id": "...", "qr_code": "...", ... } ],
    "shelves": [ { "id": "...", "name": "...", ... } ],
    "shelf_suppliers": [ { "id": "...", ... } ],
    "suppliers": [ { "id": "...", "name": "...", ... } ],
    "market_lines": [ { "id": "...", "name": "...", ... } ],
    "movements": [ { "id": "...", "action_type": "...", ... } ]
  }
}
```

El nombre del archivo de backup sigue el formato: `backup_handler_YYYY-MM-DDTHH-MM-SS.json`, con el timestamp en hora local de Bogotá (UTC-5).

## 9.3. Backup Manual (Desde la Interfaz)

El administrador puede crear un backup bajo demanda desde el módulo `/backup` de la interfaz.

**Flujo técnico del proceso:**

```
[Admin pulsa "Crear Backup Ahora"]
    ↓
POST /api/backup/create (requiere JWT Admin válido)
    ↓
[Controlador] exportDatabaseToJSON()
    → Ejecuta SELECT * FROM [tabla] ORDER BY created_at para las 8 tablas
    → Construye el objeto JSON con estructura v2.0
    ↓
Buffer.byteLength(jsonStr, 'utf8') → Calcula tamaño en bytes
    ↓
INSERT INTO backups (filename, size_bytes, data, created_by, manual)
    ↓
[Rotación]: Si COUNT(backups) > 3 → DELETE oldest
    ↓
INSERT INTO movements (action_type: 'backup_created', details: {filename, sizeMB, deletedOldBackups, ip})
    ↓
Respuesta JSON con {filename, sizeMB, createdAt}
```

## 9.4. Backup Automático (Programador)

El archivo `backend/src/services/backupScheduler.js` implementa un programador de verificación horaria:

- **Frecuencia de verificación:** Cada 1 hora (constante `CHECK_INTERVAL_MS = 60 * 60 * 1000`).
- **Condición de ejecución:** Se ejecuta si la hora actual en Bogotá (UTC-5) corresponde a `BACKUP_HOUR_BOGOTA` (12:00 PM) **Y** han transcurrido al menos el intervalo configurado de días desde el último backup (por defecto 20 días).
- **Estado persistente:** El timestamp del último backup automático se escribe en `backup_scheduler_state.json` dentro del directorio de instalación, permitiendo que el programador recuerde el estado entre reinicios del sistema.

**Configuración del intervalo de backup (desde la interfaz Admin):**
El administrador puede modificar los parámetros del programador desde el Panel de Backups:
- `interval_days`: Cada cuántos días ejecutar el backup automático (mínimo: 1).
- `hour`: Hora del día en Bogotá para el backup (0–23).

Esta configuración se persiste en la tabla `settings` (clave `backup_config`, valor JSONB).

## 9.5. Procedimiento de Restauración de Backup

> ⚠️ **Advertencia Técnica:** La restauración de un backup **destruye y reemplaza íntegramente** el contenido de las 8 tablas. Esta acción es **irreversible**. Se recomienda crear un backup del estado actual antes de proceder con una restauración.

**Flujo técnico del proceso de restauración:**

```
[Admin selecciona backup y proporciona contraseña]
    ↓
POST /api/backup/restore { filename, password }
    ↓
[Verificación BCrypt]: bcrypt.compare(password, password_hash) 
    → Contraseña incorrecta → Error 401 → ABORT
    ↓
SELECT data FROM backups WHERE filename = ? → Recuperar datos
    ↓
BEGIN (transacción SQL)
    ↓
Para cada tabla en orden de dependencias FK:
  users → market_lines → suppliers → shelves → shelf_suppliers
        → global_samples → dispensed_samples → movements
    ↓
  TRUNCATE TABLE [tabla] RESTART IDENTITY CASCADE
    ↓
  INSERT INTO [tabla] (...cols...) VALUES (...) ON CONFLICT DO NOTHING
    ↓
COMMIT (si todo exitoso) / ROLLBACK (si cualquier tabla falla)
    ↓
INSERT INTO movements (action_type: 'backup_restored', details: {filename, stats, ip})
```

**Notas técnicas de la restauración:**
- La columna `total_capacity` de `shelves` es una columna GENERATED y es automáticamente excluida de los inserts de restauración.
- Se mantiene retrocompatibilidad: si el backup es anterior a la migración que renombró `samples` a `global_samples`, el sistema lo detecta y realiza la adaptación automáticamente.

## 9.6. Listado de Backups Disponibles

**Endpoint:** `GET /api/backup/list`

Retorna la lista de los últimos 10 backups (ordenados por fecha descendente) con:
- `filename`: Nombre del archivo con timestamp.
- `sizeMB`: Tamaño del backup en megabytes.
- `createdAt`: Fecha y hora de creación (UTC).
- `createdBy`: Usuario o sistema que lo creó (`admin` o `vercel-cron`).
- `manual`: `true` si fue creado manualmente, `false` si fue automático.
- `nextBackupScheduled`: Fecha/hora calculada del próximo backup automático.
