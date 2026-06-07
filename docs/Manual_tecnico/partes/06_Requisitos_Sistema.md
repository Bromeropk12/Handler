# 6. REQUISITOS DE HARDWARE Y SOFTWARE

## 6.1. Plataforma Soportada

**Handler TrackSamples v1.0.0** está desarrollado, compilado, probado y soportado exclusivamente para los siguientes sistemas operativos:

| Sistema Operativo | Versión Mínima | Arquitectura |
|---|---|---|
| Microsoft Windows 10 | Build 19041 (versión 20H1) o superior | 64-bit (x64) únicamente |
| Microsoft Windows 11 | Cualquier versión estable | 64-bit (x64) únicamente |

> **Advertencia:** No se soporta la ejecución en Windows 7, Windows 8, Windows Server, macOS, distribuciones Linux, ni arquitecturas ARM. El empaquetado Electron genera exclusivamente binarios `win-x64`.

## 6.2. Software del Sistema Anfitrión

El instalador `Handler_TrackSamples_Setup.exe` es **autocontenido** y gestiona automáticamente todas las dependencias de software necesarias. **No se requiere instalar ningún componente manualmente** previo a la instalación.

| Software | Propósito | Gestionado por |
|---|---|---|
| PostgreSQL 15 | Motor de base de datos relacional | Instalado automáticamente por el instalador vía winget si no está presente |
| Node.js 18+ | Entorno de ejecución del backend (Express) | Compilado dentro de `backend.exe` mediante pkg — no requiere instalación |
| Chromium | Motor de renderizado de Electron | Empaquetado dentro del instalador `.exe` |

> **Nota Técnica:** El instalador verifica la presencia de PostgreSQL mediante `Get-Service postgresql*`. Si no encuentra el servicio, ejecuta `winget install --id PostgreSQL.PostgreSQL` para instalarlo de forma silenciosa con puerto `5432` y configura el servicio para inicio automático. Todo este proceso es transparente para el usuario.

## 6.3. Puertos de Red Requeridos

| Puerto | Servicio | Propósito |
|---|---|---|
| `3001` | Backend API (HandlerTrackSamples) | API REST, frontend React, health check |
| `5432` | PostgreSQL | Conexión a la base de datos local |

> El instalador configura automáticamente una regla de entrada en el Firewall de Windows para el puerto `3001` (perfiles privado y público) para permitir el acceso desde otros dispositivos en la red local.

## 6.4. Requisitos de Hardware — Mínimos

Las siguientes especificaciones representan el **umbral mínimo absoluto** para que el sistema pueda arrancar y operar con funcionalidad básica. Por debajo de estos valores, se producirán bloqueos, tiempos de carga inaceptables o fallos del motor WebGL.

La razón principal del requerimiento de RAM es la ejecución simultánea de: el servicio PostgreSQL, el proceso del backend API (`backend.exe`), y el motor de renderizado Chromium de Electron con gráficos WebGL activos para el módulo de Almacén 3D.

| Componente | Especificación Mínima |
|---|---|
| **Procesador (CPU)** | Intel Core i3 de 8.ª generación / AMD Ryzen 3 3000 series — Quad-Core a 2.0 GHz mínimo — Arquitectura x64 |
| **Memoria RAM** | 6 GB DDR4 |
| **Almacenamiento** | 10 GB de espacio libre — SSD recomendado |
| **Gráficos** | Tarjeta de video con soporte WebGL 1.0 (Intel UHD 620 o equivalente). Los controladores deben estar actualizados |
| **Resolución de Pantalla** | 1366 × 768 px mínimo |
| **Puertos de Red Locales** | Puertos `3001` y `5432` deben estar disponibles (no usados por otro proceso) |

## 6.5. Requisitos de Hardware — Recomendados para Producción

Para garantizar una experiencia de usuario fluida, especialmente durante el renderizado de la bodega tridimensional con múltiples anaqueles y el procesamiento concurrente de múltiples peticiones a la API, se recomiendan las siguientes especificaciones:

| Componente | Especificación Recomendada |
|---|---|
| **Procesador (CPU)** | Intel Core i5 de 10.ª gen. o superior / AMD Ryzen 5 5000 series — 6 núcleos o más |
| **Memoria RAM** | 12 GB DDR4 o superior |
| **Almacenamiento** | 30+ GB en SSD NVMe M.2 (velocidad de escritura > 1500 MB/s) |
| **Gráficos** | GPU dedicada NVIDIA GTX 1650 / AMD RX 5500M o superior, con soporte completo WebGL 2.0 y OpenGL 4.5 |
| **Resolución de Pantalla** | 1920 × 1080 px (Full HD) o superior |
