# FACULTAD DE INGENIERÍA DE SISTEMAS
## Unidad para el Desarrollo de la Ciencia, la Investigación y la Innovación — UDCII

---

&nbsp;

&nbsp;

# MANUAL TÉCNICO DEL SISTEMA
# Handler TrackSamples

&nbsp;

**Sistema Integral de Gestión de Inventario de Muestras Químicas**
**con Trazabilidad SGA y Visualización Tridimensional**

&nbsp;

---

| Campo | Detalle |
|---|---|
| **Código del Documento** | FIS – UDCII – G05 |
| **Tipo de Documento** | Manual Técnico del Sistema |
| **Nombre del Sistema** | Handler TrackSamples |
| **Versión del Software** | v1.0.0 |
| **Versión del Documento** | 1.0 |
| **Fecha de Elaboración** | Mayo de 2026 |
| **Estado** | Versión Final — Entrega de Grado |

---

| Rol | Nombre |
|---|---|
| **Elaborado por** | Equipo de Desarrollo — Handler S.A.S. |
| **Revisado por** | Director del Proyecto de Grado |
| **Presentado a** | Facultad de Ingeniería de Sistemas — UDCII |

---

&nbsp;

> *Este documento ha sido elaborado como entregable formal del proyecto de grado. Contiene información técnica confidencial de la arquitectura, base de datos, módulos de API y procedimientos de despliegue del sistema Handler TrackSamples. Su reproducción parcial o total sin autorización escrita está prohibida.*

&nbsp;

---

&nbsp;

## CONTROL DE VERSIONES DEL DOCUMENTO

| Versión | Fecha | Descripción del Cambio | Responsable |
|---|---|---|---|
| 0.1 | Abril 2026 | Borrador inicial — análisis arquitectónico | Equipo de Desarrollo |
| 0.5 | Abril 2026 | Incorporación de esquema SQL y módulos API | Equipo de Desarrollo |
| 1.0 | Mayo 2026 | Versión final para entrega de grado | Equipo de Desarrollo |

&nbsp;

---

&nbsp;
# MANUAL TÉCNICO DEL SISTEMA
# Handler TrackSamples v1.0.0

---

**Documento:** FIS – UDCII – G05  
**Tipo:** Manual Técnico del Sistema  
**Versión del Software:** 1.0.0  
**Fecha de Elaboración:** Mayo de 2026  
**Elaborado por:** Equipo de Desarrollo — Handler S.A.S.  
**Presentado a:** Unidad para el Desarrollo de la Ciencia, la Investigación y la Innovación (UDCII)

---

## TABLA DE CONTENIDO

1. [Introducción](./01_Introduccion.md)
2. [Descripción General del Sistema](./02_Descripcion_General.md)
3. [Modelo de Base de Datos y Esquema SQL](./03_Base_de_Datos.md)
4. [Arquitectura de Módulos y API REST](./04_Arquitectura_Modulos.md)
5. [Características de los Usuarios y Control de Acceso](./05_Usuarios_y_Control_Acceso.md)
6. [Requisitos de Hardware y Software](./06_Requisitos_Sistema.md)
7. [Instalación, Configuración y Ejecución](./07_Instalacion_y_Configuracion.md)
8. [Interfaz de Usuario — Módulos del Sistema](./08_Interfaz_Modulos.md)
9. [Sistema de Backups y Recuperación de Datos](./09_Backups_y_Recuperacion.md)
10. [Desinstalación del Sistema](./10_Desinstalacion.md)
11. [Solución de Problemas](./11_Solucion_Problemas.md)


---

# 1. INTRODUCCIÓN

## 1.1. Propósito del Documento

El presente **Manual Técnico del Sistema** constituye el documento normativo e instructivo oficial del proyecto de grado denominado **Handler TrackSamples**, desarrollado para la Facultad de Ingeniería de Sistemas de la institución, en el marco del proceso de evaluación de la Unidad para el Desarrollo de la Ciencia, la Investigación y la Innovación (UDCII).

Este manual está dirigido exclusivamente al personal técnico especializado: ingenieros de software, administradores de bases de datos relacionales, profesionales de infraestructura y soporte de Tecnologías de la Información (TI). Su contenido presupone un conocimiento previo en arquitecturas de software Cliente-Servidor, lenguaje SQL, ecosistemas Node.js, Docker, y programación orientada a componentes con React.

El objetivo primordial de este documento es proporcionar al equipo técnico un conocimiento exhaustivo de:
- La arquitectura de software interna del aplicativo y sus tres capas fundamentales.
- El esquema relacional completo de la base de datos PostgreSQL, incluyendo tipos enumerados, triggers, vistas, índices y políticas de seguridad RLS.
- Los doce (12) módulos del backend (API REST) y sus responsabilidades funcionales.
- Los procedimientos detallados de instalación, configuración de variables de entorno, despliegue y verificación del sistema.
- Los mecanismos de protección de datos, incluyendo el sistema de backups automáticos y manuales.
- Las estrategias de diagnóstico y resolución de fallos técnicos.

## 1.2. Alcance del Sistema

**Handler TrackSamples** es un sistema de información empresarial concebido para resolver la problemática de la gestión logística, el control de inventario y el aseguramiento normativo del almacén de muestras químicas bajo los lineamientos del **Sistema Globalmente Armonizado (SGA)** de clasificación y etiquetado de productos químicos (GHS por sus siglas en inglés).

El sistema cubre de manera integral los siguientes procesos institucionales:

| Proceso | Descripción |
|---|---|
| Registro de Inventario | Ingreso de materias primas (bulk) con metadatos GHS completos, CoA y posicionamiento físico en la grilla 3D del anaquel |
| Validación Normativa SGA | Verificación algorítmica de compatibilidad química entre productos en un mismo espacio de almacenamiento |
| Dispensación Logística | Fraccionamiento controlado de muestras bulk en unidades hijas con generación de códigos QR únicos |
| Despacho FEFO | Algoritmo de salida de inventario que prioriza los lotes de mayor riesgo de expiración |
| Trazabilidad Inmutable | Log perpetuo de toda operación ejecutada en el sistema, asociada al usuario y con contexto JSON |
| Visualización Espacial 3D | Renderizado WebGL interactivo de la topología real del almacén usando React Three Fiber y Three.js |
| Administración de Acceso | Control de roles y permisos granulares con autenticación JWT y seguridad RLS en base de datos |
| Salvaguarda de Información | Sistema de copias de seguridad (backups) manuales y automáticos almacenados en la base de datos local |

## 1.3. Convenciones de Nomenclatura

A lo largo de este manual se utilizan las siguientes convenciones:

- `código_fuente` → Fragmentos de código, rutas de archivo, comandos de terminal, nombres de tablas SQL.
- **Negrita** → Términos técnicos de alta relevancia en su primera aparición.
- *Cursiva* → Nombres de módulos o interfaces del sistema.
- > **Nota Técnica:** → Aclaraciones importantes para el personal de TI.


---

# 2. DESCRIPCIÓN GENERAL DEL SISTEMA

## 2.1. Paradigma de Distribución

**Handler TrackSamples** ha sido concebido y desarrollado bajo el paradigma de **Aplicación de Escritorio Nativa para Windows** (Native Desktop Application), utilizando el framework **Electron v41** como contenedor de distribución. Esto significa que el sistema completo se empaqueta y se instala en la máquina del usuario a través de un único instalador ejecutable (`Handler_TrackSamples_Setup.exe`), compilado mediante el instalador NSIS (Nullsoft Scriptable Install System).

El sistema opera de forma **totalmente local y autónoma**. Toda la infraestructura de datos (motor PostgreSQL 15), la lógica de negocio (API Node.js/Express) y la interfaz de usuario (React 18/TailwindCSS/Three.js) se ejecutan íntegramente en la máquina anfitriona del usuario, sin requerir conectividad a internet ni dependencias de servicios en la nube para su funcionamiento cotidiano.

> **Plataforma Exclusiva:** El aplicativo está diseñado, compilado, probado y soportado **únicamente para los sistemas operativos Microsoft Windows 10 (Build 19041 o superior) y Windows 11**. No se soporta la ejecución nativa en macOS, Linux ni versiones anteriores de Windows. Alternativamente, puede consumirse a través del navegador Google Chrome o Microsoft Edge en la misma máquina, accediendo a `http://localhost:3000`.

## 2.2. Arquitectura de Software en Tres Capas

El sistema implementa una arquitectura desacoplada de tres capas verticales claramente definidas:

```
┌────────────────────────────────────────────────────────┐
│          CAPA DE PRESENTACIÓN (Frontend)               │
│   React 18 + TailwindCSS 3 + Three.js (WebGL)         │
│   Electron v41 → Ejecutable .exe nativo Windows        │
│   Puerto: localhost:3000                               │
├────────────────────────────────────────────────────────┤
│          CAPA DE LÓGICA DE NEGOCIO (Backend API)       │
│   Node.js v18+ + Express.js 4.18                       │
│   12 módulos REST + Middleware de seguridad JWT         │
│   Puerto: localhost:3001                               │
├────────────────────────────────────────────────────────┤
│          CAPA DE PERSISTENCIA (Base de Datos Local)    │
│   PostgreSQL 15 en contenedor Docker                   │
│   8 tablas relacionales + 4 vistas SQL + 21 políticas  │
│   Puerto: localhost:5432                               │
└────────────────────────────────────────────────────────┘
```

### 2.2.1. Capa de Presentación — Frontend

| Componente | Tecnología | Versión | Rol |
|---|---|---|---|
| Biblioteca UI | React | 18.2.0 | Motor de componentes declarativos y renderizado virtual |
| Framework CSS | TailwindCSS | 3.3.6 | Sistema de diseño utilitario con temas personalizados |
| Motor 3D | Three.js + React Three Fiber | 0.150 / 8.15.12 | Renderizado WebGL de la bodega tridimensional |
| Utilidades 3D | @react-three/drei | 9.96.1 | Helpers para cámaras, controles y materiales 3D |
| Estado Global | Zustand | 4.5.0 | Gestión ligera del estado de la aplicación |
| Enrutamiento | React Router DOM | 6.30.3 | Navegación declarativa SPA sin recarga de página |
| Cliente HTTP | Axios | 1.6.0 | Comunicación con la API REST local |
| Gráficos 2D | Recharts | 3.8.1 | Paneles analíticos del Dashboard |
| Íconos | Heroicons + Lucide React | 2.0.18 / 1.7.0 | Biblioteca de íconos SVG optimizados |
| QR Reader | html5-qrcode | 2.3.8 | Escáner de códigos QR desde cámara web |
| QR Generator | qrcode.react | 4.2.0 | Generación de imágenes QR en componentes React |
| Resiliencia | react-error-boundary | 4.0.13 | Captura de errores en árbol de componentes |
| Desktop | Electron | 41.1.1 | Empaquetado y distribución como aplicación Windows |

### 2.2.2. Capa de Lógica de Negocio — Backend API

El backend expone **12 módulos REST** accesibles bajo el prefijo `/api/`. Cada módulo posee su propio router, controlador y responsabilidades de validación.

| Módulo | Ruta Base | Descripción |
|---|---|---|
| Autenticación | `/api/auth` | Login JWT, recuperación de contraseña con clave secreta |
| Muestras Globales | `/api/samples` | CRUD completo de materias primas bulk con metadatos GHS |
| Almacén (Warehouse) | `/api/warehouse` | Gestión de anaqueles, asignación de posiciones 3D |
| Dispensación | `/api/dispensing` | Fraccionamiento bulk → submuestras con QR único |
| Despachos | `/api/dispatch` | Salida FEFO y cambio de estado a `dispatched` |
| Movimientos | `/api/movements` | Consulta y exportación del log de trazabilidad |
| Analítica | `/api/analytics` | Indicadores KPI para el Dashboard |
| Proveedores | `/api/suppliers` | CRUD de proveedores con logo |
| Alertas | `/api/alerts` | Consulta de muestras vencidas y próximas a vencer |
| Líneas de Mercado | `/api/market-lines` | CRUD de categorías de negocio |
| Anaquel-Proveedor | `/api/shelf-suppliers` | Relación muchos-a-muchos entre anaqueles y proveedores |
| Backup | `/api/backup` | Creación, listado, restauración y eliminación de backups |

**Librerías clave del backend:**

| Librería | Versión | Función |
|---|---|---|
| `express` | 4.18.2 | Framework HTTP principal |
| `jsonwebtoken` | 9.0.2 | Generación y validación de tokens JWT (expiración: 8h) |
| `bcryptjs` | 2.4.3 | Hash de contraseñas con salt (12 rondas BCrypt) |
| `helmet` | 7.1.0 | Cabeceras HTTP de seguridad (CSP, CORP, XSS, etc.) |
| `express-rate-limit` | 7.1.5 | Limitador de peticiones: 5000 req/15 min por IP |
| `joi` | 17.11.0 | Validación y sanitización de esquemas de entrada |
| `pg` | 8.11.3 | Driver nativo PostgreSQL con pool de conexiones (máx. 20) |
| `multer` | 2.1.1 | Manejo de uploads de archivos (CoA PDFs, tamaño máx. 10MB) |
| `qrcode` | 1.5.4 | Generación de imágenes QR en el backend |
| `uuid` | 9.0.1 | Generación de UUID v4 para identificadores únicos |
| `winston` | 3.11.0 | Logging estructurado en formato JSON con timestamps |
| `cookie-parser` | 1.4.7 | Parseo de cookies HTTP |
| `cors` | 2.8.5 | Control CORS (localhost + IPs de red local 192.168.x.x) |
| `dotenv` | 16.3.1 | Gestión de variables de entorno desde archivo `.env` |

### 2.2.3. Capa de Persistencia — Base de Datos Local (PostgreSQL + Docker)

La base de datos relacional es el componente central de la arquitectura. Se ejecuta en un contenedor **Docker** usando la imagen oficial `postgres:15-alpine`, la cual se levanta de forma completamente automática durante la instalación del sistema mediante el instalador `.exe`.

**Características del motor de persistencia:**

- **Motor:** PostgreSQL 15 (imagen Alpine, optimizada para contenedores)
- **Nombre de la Base de Datos:** `handler_track_samples`
- **Usuario de Servicio:** `handler_user`
- **Puerto Expuesto Localmente:** `5432`
- **Persistencia de Datos:** Volumen Docker nombrado (`postgres_data`) que sobrevive reinicios
- **Seguridad a Nivel de Base de Datos:** Row Level Security (RLS) habilitada en 8 tablas con 21 políticas granulares
- **Conección del Backend:** Pool de hasta 20 conexiones simultáneas con timeout de 10 segundos

## 2.3. Flujo de Comunicación entre Capas

```
[Usuario → Electron/Chrome]
       ↕ React App (localhost:3000)
       ↕ Axios HTTP requests
[API REST → Node.js/Express (localhost:3001)]
       ↕ Middleware: JWT Auth → Validación Joi → Controlador
       ↕ Driver pg (Pool de conexiones)
[PostgreSQL 15 → Docker (localhost:5432)]
       ↕ Sentencias SQL parametrizadas
       ↕ Políticas RLS
[Tablas relacionales + Vistas SQL + Triggers]
```


---

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


---

# 4. ARQUITECTURA DE MÓDULOS Y API REST

## 4.1. Punto de Entrada del Backend

El servidor se inicializa en el archivo `backend/src/index.js`. La secuencia de arranque es la siguiente:

1. Carga de variables de entorno desde `.env` mediante `dotenv`.
2. Validación de variables obligatorias (`NODE_ENV`, `PORT`, `JWT_SECRET`, `DATABASE_URL`).
3. Instanciación de la aplicación Express con todos los middlewares de seguridad.
4. Registro de los 12 routers de módulo bajo el prefijo `/api/`.
5. Inicio del servidor en el puerto `3001`, escuchando en `0.0.0.0` (acepta conexiones de red local).
6. Activación del programador automático de backups (`backupScheduler`).

**Variables de entorno requeridas (`.env`):**

| Variable | Valor por Defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `3001` | Puerto del servidor API |
| `JWT_SECRET` | *(clave larga)* | Secreto criptográfico para firmar tokens JWT |
| `DATABASE_URL` | `postgresql://...@localhost:5432/handler_track_samples` | Cadena de conexión PostgreSQL |
| `JWT_EXPIRES_IN` | `8h` | Tiempo de expiración de las sesiones |
| `BCRYPT_ROUNDS` | `12` | Rondas de hashing para contraseñas |
| `RATE_LIMIT_WINDOW` | `15` | Ventana de tiempo para rate limiting (minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | `5000` | Máximo de peticiones por IP en la ventana |
| `COA_BASE_DIR` | `C:/Handler/CoA` | Directorio local donde se almacenan los PDFs de CoA |
| `MAX_FILE_SIZE` | `10485760` | Tamaño máximo de archivos subidos (10 MB) |

## 4.2. Middlewares de Seguridad

La capa de seguridad se aplica globalmente a todas las rutas antes de llegar a los controladores:

```
Petición HTTP
    ↓
[helmet]          → Cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS, etc.)
    ↓
[cors]            → Filtro de orígenes permitidos (localhost + 192.168.x.x / 10.x.x.x)
    ↓
[express-rate-limit] → Limitador: máx. 5000 req / 15 min por IP
    ↓
[express.json]    → Parser de body JSON (límite: 10 MB)
    ↓
[cookie-parser]   → Parser de cookies
    ↓
[logger]          → Registro Winston de todas las peticiones
                    └─ [SANITIZER] → Redacta passwords, tokens, cookies antes de loguear
    ↓
[auth middleware] → Verificación JWT (en rutas protegidas)
    ↓
[Controlador]     → Lógica de negocio + consultas SQL
```

### 4.2.1. Sanitización de Logs (Defensa contra Fuga de Credenciales)

**Módulo:** `backend/src/utils/sanitizer.js`
**Tests:** `backend/tests/sanitizer.test.js` (62 tests) + `backend/tests/log-security.test.js` (8 tests E2E)

Toda información sensible es redactada automáticamente antes de escribirse a los logs del sistema (rotación diaria en `backend/logs/combined-YYYY-MM-DD.log` y `backend/logs/error.log`).

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

1. ✅ **Sanitización en request logger** (`middleware/logger.js`): el body se sanitiza ANTES de serializarse. Solo se loguea el body si `Content-Type: application/json`.
2. ✅ **Sanitización en error handler** (`middleware/errorHandler.js`): 500 + 400 sanitizan body, params, query, headers. Stack truncado a 2000 chars.
3. ✅ **Protección contra ciclos**: referencias circulares → `[CIRCULAR]`.
4. ✅ **Tipos especiales**: `Buffer` → `<Buffer length=N>`, `Error` → solo name/message/code, `Date` → ISO string, `RegExp` → source.
5. ✅ **Headers sensibles**: `authorization`, `cookie`, etc. → `[REDACTED]`.
6. ✅ **NO mutación**: el objeto original no se modifica; `sanitize()` retorna una copia.

**Garantía verificada por tests E2E** (`tests/log-security.test.js`):

El test monta una app Express real con los middlewares reales, hace un `POST /api/auth/login` con un password secreto, captura todos los logs Winston, y verifica que el password NO aparece en ningún log. **8 escenarios de regresión pasan**, incluyendo el caso exacto de los logs históricos de abril-mayo 2026.

#### Saneamiento de logs históricos

Para los archivos de log generados ANTES del despliegue de este fix, ejecute el script de purga **una sola vez**:

```bash
cd backend
# Modo dry-run (recomendado primero)
node scripts/purge-sensitive-logs.js

# Aplicar cambios (con backup automático)
node scripts/purge-sensitive-logs.js --apply --backup
```

El script busca y reemplaza por `[REDACTED-HISTORICAL]`:
- Campos JSON `password`, `token`, `apiKey`, etc. con su valor.
- Headers `Authorization: Bearer <jwt>`.
- Cookies con valores sensibles.
- Passwords comunes (`password`, `admin123`, etc.) que aparecieron en logs.

**NO es destructivo por defecto**: requiere `--apply` explícito. Con `--backup` crea `.bak` antes de cada cambio.

#### Modo `--strict` (circuit breaker post-purga)

Desde v1.1 del script, el flag `--strict` activa una verificación de seguridad que escanea el resultado de la purga buscando una lista de **secrets conocidos** (los que aparecieron en los logs históricos de abril-mayo 2026: `@Sneyder52`, `admin123`, `paswword`, `passowrd`, `passeord`, `passeors`). Si alguno persiste, el script aborta con exit code 2 y un mensaje indicando el archivo y el secret filtrado.

```bash
# Modo seguro de producción: dry-run primero, luego apply con strict
node scripts/purge-sensitive-logs.js --paths backend/logs
node scripts/purge-sensitive-logs.js --apply --strict --verbose
```

Opcionalmente, una lista custom de secrets puede pasarse con `--secrets-file <ruta>` (un secret por línea, líneas con `#` son comentarios).

### 4.2.2. Lecciones aprendidas — Script de purga (v1.0 → v1.1)

**Contexto:** durante la primera ejecución del script de purga (v1.0, 2026-06-05) se detectaron dos bugs críticos que dejaron los logs en un estado **peor que el original**. Ambos fueron arreglados en v1.1 y validados con 15 tests E2E en `tests/purge-script.test.js`.

#### Bug #1: Backreferences `$1` no se expandían (callback devolvía string literal)

**Síntoma:** tras la purga, líneas de log quedaron con `"$1":"[REDACTED-HISTORICAL]"` — el campo de password se perdió y el reemplazo contenía el placeholder literal.

**Causa raíz:** la regla usaba un callback de `String.replace()` para contar matches Y aplicar el reemplazo en el mismo paso:

```js
// v1.0 — INCORRECTO
sanitized = sanitized.replace(rule.regex, (match, ...args) => {
  count++;
  return rule.replace;   // ← devuelve STRING con "$1" literal
});
```

En JavaScript, `String.replace()` expande `$1`, `$2` en el replacement **solo cuando se le pasa un string directo**. Cuando se pasa una función callback, **el valor de retorno se inserta tal cual** — sin expandir los backreferences. El `$1` queda como texto literal.

**Fix v1.1:** contar matches por separado (con `String.match()`, no destructivo) y aplicar el reemplazo pasando el string directo a `String.replace()`:

```js
// v1.1 — CORRECTO
const matches = sanitized.match(rule.regex);
const count = matches ? matches.length : 0;
if (count > 0) {
  sanitized = sanitized.replace(rule.regex, rule.replace);  // string → $1 se expande
}
```

En modo `--verbose` (donde se necesita un callback para capturar contexto antes/después), se expande manualmente con `expandBackreferences(template, match, capturedGroups)`.

**Lección:** cuando un regex tiene grupos de captura, **nunca devolver un string con `$1` desde un callback** de `String.replace()`. La expansión solo ocurre con string directo. Documentado en el bloque de cabecera del script y cubierto por el test de regresión `Bug #1 fixed: $1 is expanded to the field name, not left literal`.

#### Bug #2: Rule 6 matcheaba JSON keys en lugar de values

**Síntoma:** la regla `common-bad-passwords` (que buscaba la palabra `password` suelta) matcheaba la KEY `"password"` en JSON y dejaba el VALUE intacto. Resultado: líneas con `"password":"@Sneyder52"` se convertían en `"[REDACTED-HISTORICAL]":"@Sneyder52"` — el campo se renombraba pero el password seguía visible.

**Causa raíz:** el patrón `\bpassword\b(?!")` intentaba excluir JSON keys con un negative lookahead, pero en los logs reales, el body se serializa a string con JSON escapado:

```
"body":"{\"username\":\"admin\",\"password\":\"@Sneyder52\"}"
         ↑                ↑       ↑
    \" literal      \" literal  \" literal
```

Después de `password` viene `\` (no `"`), así que `(?!")` no excluía el match.

**Fix v1.1:** reemplazar el negative lookahead por un **negative lookbehind** en la posición de la KEY, asumiendo que la palabra está precedida de `"` (con o sin escape) cuando es una JSON key:

```js
// v1.1 — CORRECTO
regex: /(?<!")\b(password|...)\b/g
```

Lookbehind de ancho fijo (1 char) funciona en todos los motores JS modernos sin flag `u`.

**Lección:** la diferencia entre un JSON body nativo y un JSON body escapado dentro de un string es sutil pero crítica. En `winston`, los body de request se serializan a JSON-string cuando la línea es `info`, pero se mantienen como objeto cuando es `error`. Cualquier regex que procese logs DEBE soportar AMBOS formatos. Cubierto por el test de regresión `Bug #2 fixed: Rule 6 does NOT match JSON keys (only standalone words)`.

#### Bug #3 (descubierto durante testing): Circuit breaker solo revisaba archivos modificados

**Síntoma:** el modo `--strict` no detectaba leaks en archivos que las reglas NO modificaban (porque no había match para ninguna regla, pero el secret seguía ahí).

**Causa raíz:** el loop del circuit breaker tenía `if (!result.changed) continue;` — solo verificaba archivos donde la purga había hecho cambios.

**Fix v1.1:** remover el filtro y verificar TODOS los archivos procesados, marcando los no modificados como `✓ (sin cambios)` para distinguirlos de los modificados. El circuit breaker es comprehensivo: un secret conocido en un archivo sin modificar sigue siendo un leak, e indica un bug en las reglas.

**Lección:** un circuit breaker no debe ser condicional. Si su propósito es detectar fallos, debe revisar todo el universo de archivos, no solo los que cambiaron. Cubierto por el test `FAILS (exit 2) when known secret remains after purge`.

#### Formato de log: nativos vs escapados

Otro hallazgo crítico de esta sesión: en los logs de Winston, las líneas `info` tienen el body como STRING con JSON escapado (porque winston serializa el request body a JSON-string), mientras que las líneas `error` tienen el body como OBJETO JSON nativo (porque el error handler lo serializa distinto). Las reglas 1, 2, 3 del script de purga soportan AMBOS formatos usando el cuantificador `\\?"` (0 o 1 backslash antes de cada `"`):

```js
// Captura: "password":"value"   Y   \"password\":\"value\"
regex: /(\\?")(password|...)(\\?")\s*:\s*(\\?")([^"\\]*(?:\\.[^"\\]*)*)(\\?")/g
```

El replacement preserva el formato original con `$1$2$3:$4[REDACTED-HISTORICAL]$6`.

#### Métricas de la purga final (2026-06-05)

| Métrica | Valor |
|---------|-------|
| Archivos escaneados | 7 (combined.log, error.log, database.log en backend y backend-dist) |
| Archivos saneados | 5 |
| Total hits de redacción | 643 |
| Leak rule #1 (json-password-field) | 562 |
| Leak rule #3 (json-credential-key, currentPassword) | 2 |
| Leak rule #6 (common-bad-passwords, palabras sueltas) | 79 |
| Leaks post-purga (verificado con grep + --strict) | 0 |
| Líneas corruptas con `"$1"` literal (bug v1.0) | 0 |
| Exit code | 0 |

#### Prácticas para futuras purgas

1. **Siempre ejecutar `--strict`** en purgas reales. Sin strict, el script no valida nada y puede dejar leaks silenciosamente.
2. **Siempre restaurar desde un backup antes de re-purga** si la purga anterior falló. Los `.bak` de v1.0 tienen passwords en claro; moverlos a un stash seguro fuera del repo (`%TEMP%\pre-purge-stash-<fecha>\`) y borrarlos después de validar.
3. **Validar con grep manual** post-purga además del circuit breaker. El circuit breaker solo verifica una lista hardcoded de secrets; un grep exhaustivo con patrones amplios (JWT, API key, base64) detecta formatos nuevos.
4. **Documentar la rotación de credenciales comprometidas** como acción operacional separada del fix técnico. Las passwords filtradas en logs SIGUEN SIENDO COMPROMETIDAS aunque el log se sanee — el atacante que tuvo acceso al log antes de la purga ya tiene los secrets.

## 4.3. Módulo de Autenticación (`/api/auth`)

Gestiona el ciclo de vida de la sesión de usuario.

**Endpoints:**
- `POST /api/auth/login` → Valida `username` + `password` contra hash BCrypt en la tabla `users`. Si es correcto, emite un JWT firmado con expiración de 8 horas. Registra el evento en `movements`.
- `POST /api/auth/logout` → Invalida la sesión del lado del cliente.
- `POST /api/auth/recover` → Recuperación de contraseña usando la `secret_password_hash` como segundo factor de autenticación.
- `GET /api/auth/profile` → Retorna el perfil y los permisos JSONB del usuario autenticado.

## 4.4. Módulo de Muestras (`/api/samples`)

CRUD completo para las materias primas bulk.

**Endpoints clave:**
- `GET /api/samples` → Lista todas las muestras globales con información del proveedor, línea de mercado y estado de vencimiento.
- `POST /api/samples` → Registra una nueva muestra. Valida: fecha de fabricación ≤ fecha de expiración, unidades > 0, peso > 0, clase GHS válida.
- `PUT /api/samples/:id` → Actualiza campos editables. Registra el cambio en `movements` con `action_type: 'updated'`.
- `DELETE /api/samples/:id` → Elimina la muestra si no tiene submuestras activas. Registra en `movements`.
- `POST /api/samples/:id/upload-coa` → Recibe el PDF del Certificado de Análisis vía `multer` y almacena la ruta en `coa_file_path`.

## 4.5. Módulo de Almacén (`/api/warehouse`)

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

## 4.6. Módulo de Dispensación (`/api/dispensing`)

Ejecuta el fraccionamiento de muestras bulk en submuestras individuales con QR.

**Lógica de negocio del endpoint `POST /api/dispensing/dispense`:**
1. Recibe: `global_sample_id`, cantidad de frascos hijos (`count`), peso por frasco (`weight_grams`), anaquel de destino.
2. Verifica que `count × weight_grams ≤ available_units × total_weight_grams`.
3. Ejecuta una **transacción SQL atómica** (`BEGIN → INSERT × N → UPDATE → COMMIT`):
   - Inserta `N` registros en `dispensed_samples` con UUID único y `qr_code` generado.
   - Decrementa `available_units` en `global_samples`.
4. Genera los datos JSON del QR: `{id, lot, name, subsample_number, weight_grams}`.
5. Registra el evento en `movements` con `action_type: 'dispensed'`.

## 4.7. Módulo de Despachos (`/api/dispatch`)

Implementa el algoritmo **FEFO** (First-Expired-First-Out) para la salida de inventario.

- `GET /api/dispatch/suggest/:name` → Busca todas las submuestras almacenadas del producto indicado y devuelve la lista ordenada por `expiration_date ASC`, destacando la de mayor urgencia.
- `POST /api/dispatch/execute` → Marca la submuestra como `dispatched`, registra la `dispatched_at` y crea el evento en `movements`.

## 4.8. Módulo de Backups (`/api/backup`)

Gestiona la copia de seguridad de la base de datos. Los backups se almacenan directamente **dentro de la propia base de datos** en la tabla `backups` (en formato JSONB), garantizando que el respaldo sea completamente local y no dependa de sistemas de archivos externos.

**Lógica del sistema de backup:**
- `POST /api/backup/create` → Exporta el contenido íntegro de las 8 tablas en un objeto JSON. Lo inserta en la tabla `backups` con el tamaño en bytes y el nombre de archivo con timestamp (zona horaria Bogotá).
- **Rotación automática:** El sistema mantiene un máximo de **3 backups** simultáneos. Al crear uno nuevo que supere ese límite, elimina el más antiguo.
- `POST /api/backup/restore` → Restaura la base de datos a un punto anterior. Requiere la contraseña del administrador como segundo factor de seguridad. Ejecuta `TRUNCATE + INSERT` dentro de una transacción con `ROLLBACK` en caso de error.
- `GET /api/backup/status` → Retorna el estado del sistema de backups: último backup, días transcurridos, próximo backup programado.
- **Programador Automático:** El `backupScheduler.js` verifica cada hora si han transcurrido el intervalo configurado (por defecto 20 días) y ejecuta un backup automático a las 12:00 PM hora Bogotá (UTC-5).


---

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


---

# 6. REQUISITOS DE HARDWARE Y SOFTWARE

## 6.1. Plataforma Soportada

**Handler TrackSamples v1.0.0** está desarrollado, compilado, probado y soportado exclusivamente para los siguientes sistemas operativos:

| Sistema Operativo | Versión Mínima | Arquitectura |
|---|---|---|
| Microsoft Windows 10 | Build 19041 (versión 20H1) o superior | 64-bit (x64) únicamente |
| Microsoft Windows 11 | Cualquier versión estable | 64-bit (x64) únicamente |

> **Advertencia:** No se soporta la ejecución en Windows 7, Windows 8, Windows Server, macOS, distribuciones Linux, ni arquitecturas ARM. El empaquetado Electron genera exclusivamente binarios `win-x64`.

## 6.2. Requisitos de Software del Sistema Anfitrión

Antes de ejecutar el instalador, la estación de trabajo debe contar con el siguiente software instalado y operativo:

| Software | Versión Mínima Requerida | Propósito |
|---|---|---|
| **Docker Desktop for Windows** | 4.0 o superior | Orquestación del contenedor PostgreSQL local |
| WSL2 (Windows Subsystem for Linux 2) | Kernel 5.10+ | Requerido internamente por Docker Desktop en Windows |

> **Nota Técnica:** El instalador `.exe` verificará la presencia de Docker Desktop en el sistema antes de proceder. Si Docker Desktop no está instalado, el asistente de instalación mostrará una advertencia y detendrá el proceso hasta que la dependencia sea satisfecha. Docker Desktop puede descargarse gratuitamente desde `https://www.docker.com/products/docker-desktop/`.

## 6.3. Requisitos de Hardware — Mínimos

Las siguientes especificaciones representan el **umbral mínimo absoluto** para que el sistema pueda arrancar y operar con funcionalidad básica. Por debajo de estos valores, se producirán bloqueos, tiempos de carga inaceptables o fallos del motor WebGL.

La razón del alto requerimiento de RAM radica en la carga simultánea de: el demonio de Docker Desktop (que reserva recursos para el contenedor PostgreSQL), el proceso Node.js del backend API (ejecutado internamente por Electron), y el motor de renderizado Chromium de Electron con gráficos WebGL activos para el módulo de Almacén 3D.

| Componente | Especificación Mínima |
|---|---|
| **Procesador (CPU)** | Intel Core i3 de 8.ª generación / AMD Ryzen 3 3000 series — Quad-Core a 2.0 GHz mínimo — Arquitectura x64 |
| **Memoria RAM** | 8 GB DDR4 |
| **Almacenamiento** | 10 GB de espacio libre — SSD obligatorio (los discos duros mecánicos HDD producen retardos severos de I/O en Docker) |
| **Gráficos** | Tarjeta de video con soporte WebGL 1.0 (Intel UHD 620 o equivalente). Los controladores deben estar actualizados |
| **Resolución de Pantalla** | 1366 × 768 px mínimo |
| **Puertos de Red Locales** | Puertos `3000`, `3001` y `5432` deben estar disponibles (no usados por otro proceso) |

## 6.4. Requisitos de Hardware — Recomendados para Producción

Para garantizar una experiencia de usuario fluida, especialmente durante el renderizado de la bodega tridimensional con múltiples anaqueles y el procesamiento concurrente de múltiples peticiones a la API, se recomiendan las siguientes especificaciones:

| Componente | Especificación Recomendada |
|---|---|
| **Procesador (CPU)** | Intel Core i5 de 10.ª gen. o superior / AMD Ryzen 5 5000 series — 6 núcleos o más |
| **Memoria RAM** | 16 GB DDR4 o superior |
| **Almacenamiento** | 30+ GB en SSD NVMe M.2 (velocidad de escritura > 1500 MB/s) |
| **Gráficos** | GPU dedicada NVIDIA GTX 1650 / AMD RX 5500M o superior, con soporte completo WebGL 2.0 y OpenGL 4.5 |
| **Resolución de Pantalla** | 1920 × 1080 px (Full HD) o superior |

## 6.5. Configuración de Docker Desktop Recomendada

Para maximizar el rendimiento del contenedor PostgreSQL local, se recomienda ajustar los recursos asignados a Docker Desktop desde su interfaz de configuración (Configuración → Recursos):

| Recurso | Valor Recomendado |
|---|---|
| CPUs | 2 núcleos mínimo |
| Memoria RAM | 3 GB mínimo asignados al demonio Docker |
| Swap | 1 GB |
| Integración WSL2 | Habilitada |


---

# 7. INSTALACIÓN, CONFIGURACIÓN Y EJECUCIÓN

## 7.1. Prerrequisitos Obligatorios

Antes de iniciar el proceso de instalación, el técnico responsable debe verificar que la estación de trabajo cumple con los siguientes prerrequisitos. El incumplimiento de cualquiera de ellos impedirá la correcta inicialización del sistema.

**Lista de verificación previa a la instalación:**

- [ ] Sistema operativo: Windows 10 (Build 19041+) o Windows 11 — 64-bit.
- [ ] Docker Desktop instalado (versión 4.0 o superior) y en estado de ejecución activo.
- [ ] WSL2 habilitado en Windows (verificar en: Panel de control → Programas → Activar o desactivar características de Windows → Subsistema de Windows para Linux).
- [ ] Puertos `3000`, `3001` y `5432` libres (sin conflictos con otros servicios).
- [ ] Al menos 10 GB de espacio libre en disco SSD.
- [ ] El usuario de Windows tiene privilegios de Administrador local.

### Verificación del Estado de Docker Desktop

Antes de ejecutar el instalador, confirmar que el icono de Docker Desktop (ballena blanca) aparece en la bandeja del sistema de Windows con estado "Running". Si no está activo, iniciarlo manualmente:

```
Menú Inicio de Windows → Buscar "Docker Desktop" → Abrir → 
Esperar hasta que el icono deje de animar y muestre "Docker is running"
```

## 7.2. Proceso de Instalación del Ejecutable `.exe`

El sistema se distribuye como un único archivo instalador de Windows denominado `Handler_TrackSamples_Setup.exe`, generado mediante el compilador **electron-builder** con el instalador **NSIS** configurado con los siguientes parámetros:

```json
{
  "appId": "com.handler.tracksamples",
  "productName": "Handler TrackSamples",
  "copyright": "Copyright © 2026 Handler Colombia",
  "win": { "target": "nsis", "arch": ["x64"] },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Handler TrackSamples"
  }
}
```

**Procedimiento paso a paso:**

**Paso 1 — Ejecutar el instalador:**
Hacer doble clic sobre `Handler_TrackSamples_Setup.exe`. El sistema operativo Windows solicitará elevación de privilegios mediante el control de cuentas de usuario (UAC). Hacer clic en "Sí" para conceder permisos de Administrador.

**Paso 2 — Asistente de instalación:**
El asistente NSIS presentará las siguientes pantallas secuenciales:
- Pantalla de bienvenida y licencia de uso.
- Selección del directorio de instalación (por defecto: `C:\Program Files\Handler TrackSamples\`).
- Confirmación de creación de acceso directo en el escritorio y en el menú de Inicio.

**Paso 3 — Extracción y despliegue de archivos:**
El instalador extrae todos los binarios de la aplicación Electron, los archivos estáticos del frontend React compilado (`build/`), los scripts SQL de inicialización de la base de datos, y los recursos multimedia (logos de proveedores en `recursos/proveedores/`).

**Paso 4 — Aprovisionamiento automático de la Base de Datos:**
Durante la fase de instalación, el setup ejecuta de forma transparente los comandos Docker necesarios para:
1. Descargar la imagen `postgres:15-alpine` (si no está disponible localmente).
2. Crear el contenedor `handler-track-samples-db` con el volumen persistente `postgres_data`.
3. Ejecutar el script SQL de inicialización completo (`schema-completo-produccion.sql`) que crea todas las tablas, tipos ENUM, vistas, triggers, índices y el usuario administrador por defecto.
4. Habilitar las políticas de Row Level Security (RLS) en las 8 tablas.

**Paso 5 — Configuración de variables de entorno:**
El instalador genera automáticamente el archivo `.env` en el directorio de instalación con los valores correctos para el entorno local, incluyendo la cadena de conexión a PostgreSQL en `localhost:5432`.

**Paso 6 — Finalización:**
Al completarse, el asistente muestra la pantalla de éxito. El acceso directo "Handler TrackSamples" es creado en el escritorio y en el Menú de Inicio de Windows. Opcionalmente, el usuario puede ejecutar la aplicación de inmediato marcando la casilla "Iniciar Handler TrackSamples ahora".

## 7.3. Estructura de Directorios Post-Instalación

Tras la instalación, el directorio raíz del sistema tiene la siguiente estructura:

```
C:\Program Files\Handler TrackSamples\
├── Handler TrackSamples.exe          ← Ejecutable principal (Electron)
├── resources\
│   ├── app\
│   │   ├── build\                    ← Frontend React compilado (HTML/CSS/JS)
│   │   ├── backend\                  ← API Node.js/Express
│   │   │   ├── src\
│   │   │   │   ├── modules\          ← 12 módulos de la API
│   │   │   │   ├── services\         ← database.js, backupScheduler.js
│   │   │   │   └── index.js          ← Punto de entrada del servidor
│   │   │   └── .env                  ← Variables de entorno locales
│   │   ├── database\
│   │   │   └── scripts\              ← schema-completo-produccion.sql
│   │   └── recursos\
│   │       └── proveedores\          ← Logos de los 7 proveedores preconfigurados
│   └── electron.js                   ← Proceso principal de Electron
├── backups\                           ← [Creada automáticamente] Carpeta interna de backups
└── uninstall.exe                      ← Desinstalador oficial del sistema
```

> **Nota Técnica:** La carpeta `backups\` es creada automáticamente por el sistema la primera vez que se ejecuta un backup. Los archivos `.json` de respaldo se almacenan en esta ubicación interna, completamente local a la instalación del software, sin requerir transmisión a servicios externos.

## 7.4. Verificación Post-Instalación

Tras la instalación, el técnico debe verificar que todos los componentes están operativos:

**1. Verificar el contenedor de base de datos:**
```powershell
# En PowerShell con Docker Desktop activo:
docker ps

# Resultado esperado:
# CONTAINER ID   IMAGE                PORTS                    NAMES
# xxxxxxxxxxxx   postgres:15-alpine   0.0.0.0:5432->5432/tcp   handler-track-samples-db
```

**2. Verificar el health check de la API:**
Abrir un navegador web y navegar a:
```
http://localhost:3001/health
```
Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2026-05-04T...",
  "service": "Handler TrackSamples Backend",
  "version": "1.0.0"
}
```

**3. Verificar la interfaz de usuario:**
Navegar a `http://localhost:3000` o abrir la aplicación desde el acceso directo del escritorio. Debe aparecer la pantalla de inicio de sesión.

**Credenciales de primer acceso (cambiar inmediatamente en producción):**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 7.5. Ejecución Cotidiana del Sistema

Una vez instalado, el sistema se inicia con un doble clic en el acceso directo "Handler TrackSamples" del escritorio. Electron levanta internamente el proceso Node.js del backend y renderiza la interfaz React en la ventana Chromium. No se requiere ninguna acción adicional del usuario.

> **Prerequisito cotidiano:** Docker Desktop debe estar activo antes de abrir la aplicación. Si Docker no está corriendo, la aplicación mostrará errores de conexión a la base de datos en la pantalla de login. El icono de Docker (ballena) debe aparecer en la bandeja del sistema antes de iniciar Handler TrackSamples.


---

# 8. INTERFAZ DE USUARIO — MÓDULOS DEL SISTEMA

Esta sección documenta la arquitectura y el propósito técnico de cada módulo de la interfaz de usuario, evidenciado con las capturas de pantalla oficiales del sistema en producción.

---

## 8.1. Módulo de Autenticación — Login

![Pantalla de Login](./img/01_Login.png)

**Ruta de Acceso:** `/login`  
**Componente React:** `frontend/src/modules/auth/LoginPage.jsx`  
**Endpoint de API consumido:** `POST /api/auth/login`

**Funcionamiento técnico:**
La pantalla envía las credenciales al endpoint de autenticación. La API valida el `username` en la tabla `users`, compara el `password` contra el `password_hash` usando `bcrypt.compare()` con 12 rondas. En caso de éxito, genera y retorna un JWT firmado con el `JWT_SECRET` configurado en `.env`, con un tiempo de expiración de 8 horas. El token es almacenado en el estado global de Zustand y enviado como cabecera `Authorization: Bearer` en todas las peticiones subsiguientes.

**Interacciones disponibles:**
- Campo "Usuario": Entrada de texto con validación de presencia.
- Campo "Contraseña": Entrada tipo password con opción de visibilidad.
- Botón "Iniciar Sesión": Despacha la petición de autenticación.

---

## 8.2. Dashboard — Panel de Telemetría

![Dashboard](./img/02_Dashboard.png)

**Ruta de Acceso:** `/`  
**Componente React:** `frontend/src/modules/dashboard/DashboardPage.jsx`  
**Permiso requerido:** `dashboard.view`  
**Endpoints de API consumidos:** `GET /api/alerts`, `GET /api/analytics`

**Funcionamiento técnico:**
Realiza peticiones paralelas al módulo de alertas y analítica. El módulo `alerts` ejecuta consultas contra la vista SQL `v_expiring_samples`, que filtra muestras con `expiration_date <= CURRENT_DATE + 30`. Los resultados se clasifican en tres categorías: **VENCIDA** (fecha ya pasada), **CRÍTICA** (vence en ≤ 7 días) y **PRÓXIMA** (vence en ≤ 30 días). Los paneles de analítica consumen la vista `v_inventory_summary` para mostrar KPIs agregados por línea de mercado.

**Interacciones disponibles:**
- Tarjetas de alerta: "Muestras Vencidas" y "Próximas a Vencer" con acceso directo a la vista filtrada.
- Menú lateral de navegación hacia todos los módulos autorizados según permisos del usuario.

---

## 8.3. Inventario Maestro — Muestras Globales

![Muestras Globales](./img/03_Muestras_Globales.png)

**Ruta de Acceso:** `/samples`  
**Componente React:** `frontend/src/modules/samples/SamplesPage.jsx` (41 KB — el componente más extenso del proyecto)  
**Permiso requerido:** `samples.view`  
**Endpoints de API consumidos:** `GET /api/samples`, `POST /api/samples`, `PUT /api/samples/:id`, `DELETE /api/samples/:id`, `POST /api/samples/:id/upload-coa`

**Funcionamiento técnico:**
Componente de máxima complejidad en el frontend. Renderiza la tabla paginada de todas las muestras globales con información cruzada de proveedores y líneas de mercado. Los pictogramas GHS se representan visualmente a partir del array `ghs_pictograms` de cada muestra. El formulario de creación/edición incluye un uploader de archivos PDF para el Certificado de Análisis (CoA), enviado al endpoint `upload-coa` mediante `multipart/form-data`. El archivo se almacena en el directorio configurado en `COA_BASE_DIR` (por defecto `C:/Handler/CoA`).

**Interacciones disponibles:**
- Botón "Nueva Muestra": Abre el formulario modal de creación con validación de todos los campos GHS.
- Barra de búsqueda: Filtrado en tiempo real por nombre, lote o proveedor.
- Filtros SGA: Filtrado por clase de peligro y pictogramas.
- Acciones por fila: Ver CoA, editar, dispensar, posicionar en anaquel, eliminar.

---

## 8.4. Dispensación — Motor de Fraccionamiento

![Dispensación](./img/04_Dispensacion.png)

**Ruta de Acceso:** `/dispensing`  
**Componente React:** `frontend/src/modules/dispensing/DispensingPage.jsx`  
**Permiso requerido:** `dispensing.view`  
**Endpoint de API consumido:** `POST /api/dispensing/dispense`

**Funcionamiento técnico:**
El módulo ejecuta la transacción atómica de fraccionamiento. El usuario selecciona primero la Línea de Mercado, que filtra las muestras disponibles. Luego configura el número de frascos hijos y el peso por frasco. El backend verifica que `count × weight_grams ≤ (available_units × peso_unitario)`, ejecuta los inserts en `dispensed_samples`, genera los códigos QR únicos con el formato `{id, lot, name, subsample_N, weight_grams}`, y decrementa `available_units` en la tabla `global_samples`. Todo dentro de una única transacción SQL con `BEGIN/COMMIT/ROLLBACK`.

**Interacciones disponibles:**
- Selector de Línea de Mercado: Precondición obligatoria que filtra el inventario.
- Lista de muestras disponibles: Ordenadas alfabéticamente, con disponibilidad de unidades.
- Panel "Configurar Frascos Hijos": Cantidad de frascos y peso por frasco en gramos.
- Botón "Ejecutar Dispensación": Confirma y ejecuta la transacción atómica.

---

## 8.5. Despachos — Algoritmo FEFO

![Despachos](./img/05_Despachos.png)

**Ruta de Acceso:** `/dispatch`  
**Componente React:** `frontend/src/modules/dispatch/DispatchPage.jsx`  
**Permiso requerido:** `dispatch.view`  
**Endpoints de API consumidos:** `GET /api/dispatch/suggest/:name`, `POST /api/dispatch/execute`

**Funcionamiento técnico:**
El motor de búsqueda consulta todas las `dispensed_samples` con `status = 'stored'` del producto indicado. Las ordena por `expiration_date ASC` (de la muestra global padre), implementando el algoritmo First-Expired-First-Out. El sistema resalta visualmente la submuestra que debe ser extraída primero, mostrando su código QR, ubicación en el anaquel (posición X/Y/Z) y días restantes de vida útil. Al ejecutar el despacho, actualiza `status` a `'dispatched'`, registra `dispatched_at` y crea el evento en `movements`.

**Interacciones disponibles:**
- Campo de búsqueda: Nombre del producto a despachar.
- Botón "Buscar": Activa el algoritmo FEFO y renderiza los resultados ordenados.
- Tarjeta de resultado FEFO: Muestra el frasco recomendado con su QR y ubicación física exacta.
- Botón "Confirmar Despacho": Cierra el ciclo de vida de esa submuestra.

---

## 8.6. Almacén — Visualización Tridimensional

![Almacén 3D](./img/06_Almacen.png)

**Ruta de Acceso:** `/warehouse`  
**Componente React:** `frontend/src/modules/warehouse/WarehousePage.jsx`  
**Permiso requerido:** `warehouse.view`  
**Endpoint de API consumido:** `GET /api/warehouse/shelves`

**Funcionamiento técnico:**
Es el módulo de mayor carga computacional del sistema. Utiliza **React Three Fiber** para renderizar en un `<Canvas>` WebGL una representación tridimensional de todos los anaqueles del almacén. Cada anaquel es un mesh 3D calculado a partir de sus dimensiones `grid_width × grid_height × shelf_depth` recuperadas de la API. Las celdas ocupadas se colorean según el estado de las muestras (verde = OK, amarillo = próxima a vencer, rojo = vencida). La cámara es controlable mediante `OrbitControls` de Drei, permitiendo rotación libre, zoom y paneo. Los controles de cámara son persistentes mediante `localStorage` (preferencia del usuario).

**Interacciones disponibles:**
- Canvas 3D interactivo: Rotación, zoom y paneo libre con el ratón.
- Clic sobre una celda ocupada: Abre un panel lateral con los datos de la muestra almacenada.
- Botón de defragmentación (sólo Admin): Optimiza la distribución de muestras en el anaquel.

---

## 8.7. Gestión de Anaqueles

![Anaqueles](./img/07_Anaqueles.png)

**Ruta de Acceso:** `/shelves`  
**Componente React:** `frontend/src/modules/warehouse/ShelfManagement.jsx`  
**Permiso requerido:** `warehouse.view`  
**Endpoints de API consumidos:** `GET /api/warehouse/shelves`, `POST`, `PUT`, `DELETE`

**Funcionamiento técnico:**
Interfaz de administración de la tabla `shelves`. Muestra tarjetas para cada anaquel con su nombre, línea de mercado asociada, tipo (`storage` o `bulk_temporary`), dimensiones 3D configuradas y porcentaje de ocupación calculado mediante la vista `v_shelf_occupancy`. El formulario de creación/edición permite definir `grid_width`, `grid_height` y `shelf_depth` (valores entre 1 y 50 en cada eje). La columna `total_capacity` es calculada automáticamente por PostgreSQL como columna GENERATED.

**Interacciones disponibles:**
- Botón "Nuevo Anaquel": Formulario de creación con dimensiones 3D.
- Edición en línea: Modificar dimensiones de un anaquel existente (requiere permiso `warehouse.edit_shelf`).
- Eliminación: Solo disponible si el anaquel está completamente vacío.

---

## 8.8. Historial de Movimientos — Log de Trazabilidad

![Movimientos](./img/08_Movimientos.png)

**Ruta de Acceso:** `/movements`  
**Componente React:** `frontend/src/modules/movements/MovementsPage.jsx`  
**Permiso requerido:** `movements.view`  
**Endpoints de API consumidos:** `GET /api/movements`, `GET /api/movements/export`

**Funcionamiento técnico:**
Consume la vista SQL `v_movements_detail` que une la tabla `movements` con `users` para mostrar el nombre de usuario y rol. Cada fila representa un evento inmutable con: timestamp, tipo de acción (`action_type`), usuario responsable, ID de la muestra afectada (si aplica) y el objeto `details` JSON con contexto completo de la operación (valores previos, valores nuevos, dirección IP, razón del cambio). La función de exportación genera un archivo CSV con todos los registros filtrados.

**Interacciones disponibles:**
- Tabla cronológica descendente de todos los eventos del sistema.
- Filtros por tipo de acción, usuario y rango de fechas.
- Botón "Exportar CSV": Descarga el log completo en formato tabular.

---

## 8.9. Directorio de Proveedores

![Proveedores](./img/09_Proveedores.png)

**Ruta de Acceso:** `/suppliers`  
**Componente React:** `frontend/src/modules/suppliers/SuppliersPage.jsx`  
**Permiso requerido:** `suppliers.view`

**Funcionamiento técnico:**
CRUD completo sobre la tabla `suppliers`. Los logos de los proveedores se sirven como archivos estáticos desde el directorio `recursos/proveedores/`, expuesto por el backend en la ruta `/recursos`. El sistema viene preconfigurado con 7 proveedores reales: BASF, JRS, THOR, JRF, SUDEEP, GIVAUDAN y MEGGLE. Cada proveedor tiene asociada una lista de líneas de mercado que abastece (campo `market_lines TEXT[]`).

---

## 8.10. Líneas de Mercado

![Líneas de Mercado](./img/10_Lineas_Mercado.png)

**Ruta de Acceso:** `/market-lines`  
**Permiso requerido:** `market_lines.view`

**Funcionamiento técnico:**
Parametrización de la tabla `market_lines`. Las 3 líneas iniciales del sistema (`Cosmética`, `Farmacéutica`, `Industrial`) son configuradas por el script de inicialización SQL. Cada línea tiene asociados sus anaqueles y las muestras almacenadas en ellos. La eliminación de una línea de mercado activa un `ON DELETE CASCADE` que elimina todos los anaqueles y muestras asociados.

---

## 8.11. Sistema de Backups

![Backups](./img/11_Backups.png)

**Ruta de Acceso:** `/backup`  
**Acceso restringido:** Solo rol `admin` (verificado por `AdminRoute` en React y por el middleware JWT en la API)

**Funcionamiento técnico:**
Interfaz de administración de las copias de seguridad. Los backups se almacenan en la tabla `backups` de la misma base de datos PostgreSQL local, en formato JSONB, con un máximo de 3 backups simultáneos (el más antiguo se elimina automáticamente). El panel muestra el historial de backups con nombre de archivo (con timestamp de Bogotá UTC-5), tamaño en MB, usuario que lo creó y fecha. También muestra el próximo backup programado según el intervalo configurado (por defecto: cada 20 días a las 12:00 PM hora Bogotá). La restauración requiere la contraseña del administrador como segundo factor de seguridad.

---

## 8.12. Configuración de Cuenta y Gestión de Usuarios

![Configuraciones](./img/12_Configuraciones.png)
![Gestión de Usuarios](./img/13_Gestion_Usuarios.png)

**Ruta de Acceso:** Configuración personal desde menú de perfil; `/users` para gestión administrativa.  
**Acceso a `/users`:** Solo rol `admin`.

**Funcionamiento técnico:**
El módulo de configuración personal permite cambiar la contraseña de acceso. La petición envía la contraseña actual para verificación contra el `password_hash` en la BD, y si es válida, genera un nuevo hash BCrypt y actualiza el registro. El módulo de gestión de usuarios (AdminRoute) permite al administrador crear nuevas cuentas, asignar roles y configurar individualmente los 47 permisos JSONB granulares de cada operador mediante una interfaz de toggles interactivos.


---

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
- `createdBy`: Usuario o sistema que lo creó (`admin` o `local-cron`).
- `manual`: `true` si fue creado manualmente, `false` si fue automático.
- `nextBackupScheduled`: Fecha/hora calculada del próximo backup automático.


---

# 10. DESINSTALACIÓN DEL SISTEMA

## 10.1. Consideraciones Previas a la Desinstalación

La desinstalación de **Handler TrackSamples** implica la remoción permanente de la aplicación de escritorio, la detención y eliminación del contenedor de base de datos PostgreSQL local (Docker) y, opcionalmente, la eliminación del volumen de datos persistente. Es fundamental considerar que **toda la información almacenada en la base de datos se perderá de forma irreversible** si el volumen de Docker es eliminado sin haber realizado previamente un backup exportado.

**Lista de verificación pre-desinstalación:**

- [ ] Crear un backup manual desde el panel de administración y exportar el archivo `.json` resultante a un directorio externo al sistema.
- [ ] Exportar el historial de movimientos a CSV si se requiere auditoría posterior.
- [ ] Cerrar completamente la aplicación Handler TrackSamples (cerrar la ventana Electron).
- [ ] Confirmar con todos los usuarios activos que ninguna sesión está en curso.

## 10.2. Proceso de Desinstalación mediante `uninstall.exe`

El instalador NSIS genera automáticamente un desinstalador oficial `uninstall.exe` ubicado en el directorio raíz de instalación: `C:\Program Files\Handler TrackSamples\uninstall.exe`.

**Métodos de acceso al desinstalador:**

**Método A — Desde Aplicaciones de Windows:**
1. Abrir el menú de Inicio de Windows.
2. Ir a `Configuración → Aplicaciones → Aplicaciones y características`.
3. Buscar "Handler TrackSamples" en la lista.
4. Hacer clic en el nombre de la aplicación y seleccionar el botón "Desinstalar".
5. Confirmar la acción en el cuadro de diálogo del UAC de Windows.

**Método B — Directamente desde el directorio:**
1. Navegar a `C:\Program Files\Handler TrackSamples\` en el Explorador de archivos.
2. Ejecutar `uninstall.exe` con doble clic.
3. Confirmar elevación de privilegios (UAC).

## 10.3. Secuencia de Acciones del Desinstalador

El proceso de desinstalación ejecuta las siguientes acciones en orden:

**Paso 1 — Detención de la aplicación:**
El desinstalador verifica si el proceso `Handler TrackSamples.exe` está activo y lo cierra forzosamente si es necesario.

**Paso 2 — Detención y eliminación del contenedor Docker:**
El desinstalador ejecuta internamente los siguientes comandos de Docker para limpiar la infraestructura de base de datos local:
```powershell
# Detener el contenedor de PostgreSQL
docker stop handler-track-samples-db

# Eliminar el contenedor
docker rm handler-track-samples-db
```

**Paso 3 — Eliminación del volumen de datos (opcional):**
Si el usuario elige la opción "Eliminar todos los datos" en el asistente de desinstalación:
```powershell
# Eliminar el volumen de datos persistente (IRREVERSIBLE)
docker volume rm postgres_data
```
> ⚠️ **Advertencia Crítica:** La eliminación del volumen `postgres_data` destruye permanentemente toda la información de la base de datos local: inventario, movimientos, usuarios, proveedores, configuración de anaqueles y backups almacenados en la BD. Esta acción **no tiene recuperación** si no se realizó un backup previo.

**Paso 4 — Eliminación de archivos del sistema:**
El desinstalador borra el directorio de instalación completo, incluyendo:
- Binarios de Electron y Chromium.
- Frontend React compilado.
- Módulos del backend Node.js.
- Scripts SQL y recursos estáticos.
- Accesos directos del escritorio y el menú de Inicio.
- Entradas del registro de Windows asociadas a la aplicación.

**Paso 5 — Limpieza de reglas del Firewall (si aplica):**
Si el instalador original configuró reglas de entrada en el Firewall de Windows para los puertos `3000` y `3001`, el desinstalador las elimina.

## 10.4. Verificación Post-Desinstalación

Tras completar el proceso, el técnico puede verificar que no quedaron componentes residuales:

```powershell
# Verificar que el contenedor fue eliminado
docker ps -a | Select-String "handler"
# Resultado esperado: sin resultados

# Verificar que el directorio fue eliminado
Test-Path "C:\Program Files\Handler TrackSamples"
# Resultado esperado: False

# Verificar que el volumen fue eliminado (si se eligió esa opción)
docker volume ls | Select-String "postgres_data"
# Resultado esperado: sin resultados
```

## 10.5. Reinstalación

Si se desea volver a instalar el sistema después de una desinstalación completa, el proceso es idéntico al de la primera instalación descrito en la **Sección 7**. El script SQL de inicialización recreará toda la estructura de la base de datos desde cero, incluyendo los datos iniciales de líneas de mercado, proveedores y anaqueles preconfigurados.


---

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


---

