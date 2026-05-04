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
