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
