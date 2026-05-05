# 🚀 Handler TrackSamples (Warehouse Management System)

Sistema experto de gestión de inventario de muestras químicas con **Trazabilidad Integral**, validación automatizada mediante normativas **SGA/GHS (Sistema Globalmente Armonizado)**, y visualización táctica mediante un **Gemelo Digital 3D**.

Desarrollado como solución tecnológica para la optimización logística e industrial.

---

## 📊 Estado del Proyecto
- ✅ **100% Completado** - Sistema completamente funcional e integrado como Aplicación de Escritorio nativa.
- 🔒 **Seguro** - Autenticación JWT, políticas de seguridad a nivel de fila (RLS) y encriptación de credenciales.
- 🎨 **Interfaz Industrial** - UI/UX premium diseñada específicamente para la reducción de fatiga visual en entornos de bodega (Industrial Dark Theme).
- 🏗️ **Arquitectura Autónoma** - Cliente-Servidor local sin dependencia de internet, garantizando máxima resiliencia.

## 🎯 Características Diferenciadoras

### 🧪 Motor de Compatibilidad Química (GHS)
El corazón de la seguridad industrial de Handler. Un algoritmo en tiempo real que cruza matrices de compatibilidad química antes de permitir el almacenamiento. Previene proactivamente reacciones químicas peligrosas, bloqueando ubicaciones de estantes si se detectan incompatibilidades entre reactivos (Ej. Inflamables vs Comburentes).

### 🧊 Gemelo Digital 3D (Digital Twin)
Visualización espacial exacta de los estantes y niveles del almacén renderizada mediante aceleración de hardware (WebGL/Three.js).
- **Cálculo Volumétrico Real:** Muestra visualmente el porcentaje de ocupación en $m^3$.
- **Semaforización:** Códigos de color automáticos para identificar muestras próximas a caducar o niveles con alertas de incompatibilidad.

### 📦 Gestión de Inventario Avanzada
- **Global a Dispensado:** Capacidad de registrar tanques maestros (Muestras Globales) y subdividirlos en recipientes menores (Muestras Dispensadas/Hijas) preservando el Certificado de Análisis (CoA).
- **Códigos QR Universales:** Etiquetado automatizado y rastreo mediante lectores de código de barras/QR en terminales de bodega.

---

## 🏗️ Arquitectura del Sistema

El sistema opera bajo un modelo **Cliente-Servidor de Escritorio** completamente aislado y autónomo.

### 🖥️ Capa de Presentación y Empaquetado (Electron + React)
- Aplicación de escritorio nativa compilada con **Electron**.
- Interfaz dinámica construida con **React.js 18** y estilizada con **TailwindCSS**.
- Motor de renderizado espacial basado en **Three.js**.

### ⚙️ Capa Lógica (Node.js + Express)
- Servidor RESTful local operando en segundo plano.
- Tareas programadas (Cron Jobs) internas para respaldos automatizados.
- Controladores de validación matemática (capacidades métricas) y matriz GHS.

### 🗄️ Capa de Datos (Docker + PostgreSQL)
- Contenedor aislado de base de datos relacional.
- Cumplimiento estricto con **Row Level Security (RLS)** y políticas de acceso.
- Estructura normalizada sin inyecciones SQL.

---

##  Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Empaquetado** | Electron.js | Aplicación de escritorio nativa (Windows) |
| **Frontend** | React + TailwindCSS | UI/UX Dinámica y Responsiva |
| **Gráficos 3D** | Three.js | Gemelo Digital y Renderizado WebGL |
| **Backend** | Node.js + Express | Lógica de Negocio y API RESTful local |
| **Base de Datos** | PostgreSQL 15+ | Almacenamiento Relacional Seguro |
| **Orquestación** | Docker + Compose | Aislamiento y Portabilidad de BD |

---

## 🚀 Guía de Inicio y Despliegue Local

Al ser una aplicación diseñada para operar de forma autónoma en una terminal de bodega, el despliegue es "Plug and Play".

### 1. Iniciar la Base de Datos (Docker)
Asegúrate de tener Docker Engine ejecutándose.
```bash
# Entra a la carpeta de la base de datos y levanta el contenedor
cd database
docker-compose up -d
```

### 2. Iniciar el Sistema (Modo Desarrollo)
Si cuentas con el entorno de desarrollo preparado:
```bash
# Ejecuta el script automatizado en la raíz del proyecto
iniciar-sistema.bat
```
Este comando levantará los servidores backend y el entorno de React simultáneamente.

### 3. Credenciales de Administrador por Defecto
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 🔒 Auditoría y Seguridad
- **Políticas RLS:** Más de 21 políticas de seguridad implementadas nativamente en la base de datos.
- **Trazabilidad Absoluta:** La tabla `movements` registra irrevocablemente quién, cuándo y dónde movió cada muestra química.
- **Respaldos (Backups):** Módulo de respaldo automatizado capaz de generar *snapshots* JSON del inventario y restaurar el sistema en caso de catástrofes.

---

## 👨‍💻 Acerca del Desarrollo
Este sistema fue desarrollado integralmente para satisfacer las altas exigencias de control y seguridad requeridas en almacenes de compuestos químicos logísticos, aplicando las mejores prácticas de **Ingeniería de Software**, metodologías ágiles (Scrum) y principios de diseño modular (Domain-Driven Design).