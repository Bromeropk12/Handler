# 4. REQUISITOS DE HARDWARE Y DE SOFTWARE

Para asegurar la estabilidad, fluidez gráfica (por el renderizado 3D) y eficiencia transaccional, el sistema de **Handler TrackSamples** debe ser desplegado en entornos que cumplan o superen los siguientes parámetros:

### 4.1. Requisitos Mínimos (Entornos Básicos / Pruebas)

Este hardware asegura que el demonio de Docker (Base de Datos SQL) y la Interfaz Electrón (`.exe`) puedan correr de forma fluida y totalmente local en una misma máquina.

*   **Sistemas Operativos:** Windows 10/11 (64-bit), Ubuntu Linux 20.04 LTS+, macOS 12+.
*   **Procesador (CPU):** Intel Core i3 / AMD Ryzen 3 (Quad-Core, 2.0 GHz) o equivalente.
*   **Memoria RAM:** 8 GB.
*   **Espacio en Disco:** 10 GB de espacio libre (Se recomienda encarecidamente unidades SSD para evitar retardos de I/O en Docker).
*   **Software Adicional Requerido:**
    *   Docker Desktop for Windows (necesario para orquestar la Base de Datos local).

### 4.2. Requisitos Recomendados (Producción / Alta Demanda)

Si el sistema se despliega en una arquitectura distribuida (Servidor para BD y API, y Clientes ligeros para la interfaz), el servidor requerirá:

*   **Sistemas Operativos:** Servidor Dedicado Linux (Ubuntu 22.04 LTS o Debian 11). Clientes en Windows 10/11 Pro.
*   **Procesador (CPU):** Intel Core i5 / AMD Ryzen 5 o equivalente en servidor (Seis núcleos o más).
*   **Memoria RAM:** 16 GB o más (La holgura de memoria es crítica para procesar el caché de PostgreSQL y el renderizado fluido de bodegas masivas en 3D en el lado del cliente).
*   **Espacio en Disco:** 30+ GB en SSD NVMe (La velocidad I/O es crítica para el registro de logs transaccionales inmutables y las operaciones SQL concurrentes).
*   **Software Adicional Requerido:**
    *   Docker Desktop for Windows con asignación de recursos optimizada.
    *   Volúmenes persistentes explícitos para PostgreSQL configurados por el instalador.
