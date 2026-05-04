# 3. MODELO DE BASE DE DATOS Y ESQUEMA SQL

## 3.1. Visión General del Esquema

La base de datos relacional de **Handler TrackSamples** está construida sobre **PostgreSQL 15** y contiene **8 tablas principales**, **5 tipos enumerados** (`ENUM`), **4 vistas SQL**, **6 triggers automáticos**, múltiples índices de rendimiento y **políticas RLS (Row Level Security)** habilitadas en todas las tablas. El esquema completo se define en el archivo `database/scripts/schema-completo-produccion.sql`.

### Diagrama Entidad-Relación (Simplificado)

```
market_lines ──< shelves ──< shelf_suppliers >── suppliers
     │                │
     │          global_samples ──< dispensed_samples
     │                │
     └────────────────┘
                       │
                    movements <── users
```

---

## 3.2. Tipos Enumerados (ENUM)

El esquema define 5 tipos ENUM que restringen los valores válidos en columnas críticas:

### `danger_class` — Clasificación de Peligro GHS
```sql
CREATE TYPE danger_class AS ENUM (
  'Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico',
  'Comburente', 'Explosivo'
);
```
Utilizado en la columna `ghs_danger_class` de la tabla `global_samples`. Define la clase primaria de peligro según la norma SGA/GHS.

### `sample_status` — Estado del Ciclo de Vida de la Muestra
```sql
CREATE TYPE sample_status AS ENUM (
  'stored',      -- Almacenada activamente en un anaquel
  'dispatched',  -- Despachada / entregada
  'expired'      -- Vencida, fuera de uso
);
```
Utilizado en `dispensed_samples.status` para gestionar el ciclo de vida de cada submuestra.

### `dimensions` — Dimensiones de Ocupación en la Grilla 3D
```sql
CREATE TYPE dimensions AS ENUM (
  '1x1x1', '1x2x1', '2x1x1', '2x2x1',
  '1x1x2', '1x2x2', '2x1x2', '2x2x2'
);
```
Define el tamaño que ocupa una muestra global en la grilla tridimensional del anaquel (Ancho × Alto × Profundidad).

### `action_type` — Tipo de Acción en el Log de Trazabilidad
```sql
CREATE TYPE action_type AS ENUM (
  'created', 'dispensed', 'stored', 'moved', 'dispatched',
  'expired', 'password_reset', 'updated', 'deleted',
  'user_created', 'user_deleted', 'admin_password_change',
  'permissions_updated', 'permissions_set',
  'backup_created', 'backup_restored'
);
```
Utilizado en la tabla `movements`. Cada tipo de acción representa un evento de negocio significativo que debe quedar registrado.

### `user_role` — Roles de Usuario
```sql
CREATE TYPE user_role AS ENUM (
  'admin',     -- Administrador total del sistema
  'operator',  -- Operario de almacén
  'analyst'    -- Analista de datos (lectura extendida)
);
```

---

## 3.3. Descripción Detallada de Tablas

### Tabla `users` — Usuarios del Sistema
```sql
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username              VARCHAR(50)  UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,        -- Hash BCrypt 12 rondas
  secret_password_hash  VARCHAR(255) NOT NULL,        -- Segunda clave de recuperación
  role                  user_role    NOT NULL DEFAULT 'operator',
  permissions           JSONB        NOT NULL DEFAULT '{}',  -- 47 permisos granulares
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
**Características notables:**
- Doble sistema de contraseñas: contraseña principal (login diario) + contraseña secreta (recuperación de cuenta y confirmación de operaciones críticas como la restauración de backups).
- El campo `permissions` es un objeto **JSONB** con hasta 47 permisos booleanos granulares (ej. `"samples.create": true`, `"backup.view": false`). Tiene un **índice GIN** para búsquedas eficientes.
- Los hashes se generan con **BCrypt a 12 rondas** (`bcryptjs`).

### Tabla `market_lines` — Líneas de Mercado
```sql
CREATE TABLE market_lines (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  ...
);
```
Categorías de negocio que agrupan anaqueles y muestras. El sistema viene preconfigurado con 3 líneas: `Cosmética`, `Farmacéutica` e `Industrial`.

### Tabla `suppliers` — Proveedores
```sql
CREATE TABLE suppliers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) UNIQUE NOT NULL,
  market_lines TEXT[],          -- Array de líneas que abastece
  phone        VARCHAR(50),
  email        VARCHAR(255),
  address      TEXT,
  logo_path    VARCHAR(500),    -- Ruta al logo en recursos/proveedores/
  ...
);
```
El sistema viene preconfigurado con 7 proveedores reales: `BASF`, `JRS`, `THOR`, `JRF`, `SUDEEP`, `GIVAUDAN`, `MEGGLE`.

### Tabla `shelves` — Anaqueles Físicos
```sql
CREATE TABLE shelves (
  id             UUID PRIMARY KEY,
  market_line_id UUID NOT NULL REFERENCES market_lines(id),
  name           VARCHAR(100) NOT NULL,
  grid_width     INTEGER NOT NULL DEFAULT 10,   -- Eje X: Columnas (máx. 50)
  grid_height    INTEGER NOT NULL DEFAULT 10,   -- Eje Y: Niveles  (máx. 50)
  shelf_depth    INTEGER NOT NULL DEFAULT 10,   -- Eje Z: Profundidad (máx. 50)
  shelf_type     VARCHAR(50) DEFAULT 'storage', -- 'storage' | 'bulk_temporary'
  total_capacity INTEGER GENERATED ALWAYS AS    -- Columna calculada automáticamente
                 (grid_width * grid_height * shelf_depth) STORED,
  ...
);
```
**Características notables:**
- `total_capacity` es una **columna generada** (`GENERATED ALWAYS AS ... STORED`): PostgreSQL la recalcula automáticamente cuando cambian las dimensiones. No se puede insertar manualmente.
- Cada anaquel pertenece a una única línea de mercado.
- El sistema viene preconfigurado con **14 anaqueles físicos**: 5 para Cosmética, 3 para Industrial y 6 para Farmacéutica.

### Tabla `shelf_suppliers` — Relación Anaquel-Proveedor (M:N)
```sql
CREATE TABLE shelf_suppliers (
  shelf_id    UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (shelf_id, supplier_id)
);
```
Define qué proveedores están autorizados para cada anaquel. Un anaquel puede tener múltiples proveedores y un proveedor puede estar en múltiples anaqueles.

### Tabla `global_samples` — Muestras Globales (Bulk)
Es la tabla central y más compleja del esquema. Almacena los recipientes originales de materia prima.

```sql
CREATE TABLE global_samples (
  id                UUID PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  lot               VARCHAR(100) NOT NULL,
  expiration_date   DATE NOT NULL,
  manufacture_date  DATE NOT NULL,
  ghs_danger_class  danger_class NOT NULL,
  ghs_pictograms    TEXT[] NOT NULL DEFAULT '{}',  -- Ej: ['GHS01','GHS02']
  signal_word       VARCHAR(20) DEFAULT 'ATENCION', -- 'PELIGRO' | 'ATENCION'
  market_line_id    UUID NOT NULL REFERENCES market_lines(id),
  dimensions        dimensions NOT NULL,            -- Tamaño en grilla 3D
  total_units       INTEGER DEFAULT 0,
  available_units   INTEGER DEFAULT 0,
  total_weight_grams DECIMAL(10,2) NOT NULL,
  shelf_id          UUID REFERENCES shelves(id),    -- Ubicación física
  position_x        INTEGER,                        -- Columna en la grilla
  position_y        INTEGER,                        -- Nivel en la grilla
  position_z        INTEGER DEFAULT 0,              -- Profundidad en la grilla
  width, height, depth  INTEGER DEFAULT 1,          -- Ocupación volumétrica
  dispensed_size    VARCHAR(20) DEFAULT '1x1x1',   -- Tamaño de frascos hijos
  coa_file_path     VARCHAR(500),                  -- Ruta al PDF del Certificado de Análisis
  ...
);
```
**Restricciones de integridad:**
- `CHECK (manufacture_date <= expiration_date)` — La fecha de fabricación no puede ser posterior a la de expiración.
- `CHECK (available_units <= total_units)` — Las unidades disponibles no pueden superar el total.

### Tabla `dispensed_samples` — Submuestras Dispensadas
Registra cada frasco individual generado por el proceso de dispensación.

```sql
CREATE TABLE dispensed_samples (
  id               UUID PRIMARY KEY,
  global_sample_id UUID NOT NULL REFERENCES global_samples(id) ON DELETE CASCADE,
  qr_code          VARCHAR(500) UNIQUE NOT NULL,  -- Código QR único de identificación
  qr_data          JSONB,   -- {id, lot, name, subsample_number, weight_grams}
  weight_grams     DECIMAL(8,2) NOT NULL,
  status           sample_status NOT NULL DEFAULT 'stored',
  shelf_id         UUID REFERENCES shelves(id),
  position_x, position_y, position_z  INTEGER,
  width, height, depth  INTEGER DEFAULT 1 CHECK (... BETWEEN 1 AND 2),
  child_dimensions VARCHAR(10) DEFAULT '1x1x1',
  dispatched_at    TIMESTAMP WITH TIME ZONE   -- Fecha/hora del despacho
);
```

### Tabla `movements` — Log de Trazabilidad (Inmutable)
```sql
CREATE TABLE movements (
  id          UUID PRIMARY KEY,
  sample_id   UUID,           -- Referencia polimórfica: global o dispensed
  action_type action_type NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id),
  details     JSONB,          -- Contexto libre: IP, datos antes/después, cantidades
  timestamp   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
> **Nota Técnica:** Esta tabla es **de sólo inserción** desde la perspectiva de la lógica de negocio. Las políticas RLS impiden `UPDATE` y `DELETE`. Todo evento significativo del sistema genera automáticamente un registro aquí.

---

## 3.4. Vistas SQL

El esquema define 4 vistas optimizadas para consultas frecuentes del sistema:

| Vista | Descripción |
|---|---|
| `v_inventory_summary` | Resumen de inventario agrupado por línea de mercado con conteos de muestras vencidas y próximas a vencer |
| `v_shelf_occupancy` | Ocupación real de cada anaquel: celdas totales (3D), celdas ocupadas y celdas libres |
| `v_expiring_samples` | Muestras cuya fecha de expiración es ≤ CURRENT_DATE + 30 días, con nivel de alerta: VENCIDA / CRÍTICA / PRÓXIMA / OK |
| `v_movements_detail` | Log de movimientos enriquecido con nombre de usuario y rol |

---

## 3.5. Triggers Automáticos

Se define una función `trigger_set_updated_at()` en PL/pgSQL que se ejecuta automáticamente **antes de cada UPDATE** en 6 tablas, actualizando el campo `updated_at` al timestamp actual:

```sql
-- Aplica a: users, market_lines, suppliers, shelves,
--           global_samples, dispensed_samples
CREATE TRIGGER trg_[tabla]_updated_at
  BEFORE UPDATE ON [tabla]
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

---

## 3.6. Índices de Rendimiento

El esquema define **18 índices** estratégicos para garantizar consultas < 500ms incluso con volúmenes de datos elevados:

- **`global_samples`:** Índices en `market_line_id`, `lot`, `supplier_id`, `shelf_id`, posición 3D compuesta `(shelf_id, position_x, position_y, position_z)`, y un índice **GIN** en `ghs_pictograms` para búsquedas en arrays.
- **`dispensed_samples`:** Índices en `global_sample_id`, `qr_code` (único), `shelf_id`, `status`, y posición 3D compuesta.
- **`shelves`:** Índices en `market_line_id` y `provider`.
- **`movements`:** Índices en `sample_id`, `timestamp`, `user_id` y `action_type`.
- **`users`:** Índice GIN en `permissions` para evaluación eficiente de permisos JSONB.
