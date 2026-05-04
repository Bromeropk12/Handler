# 3. REQUISITOS DE HARDWARE Y SOFTWARE

## 3.1. Sistema Operativo Compatible

**Handler TrackSamples** está diseñado, desarrollado y soportado **exclusivamente** para los sistemas operativos **Microsoft Windows 10** y **Microsoft Windows 11**, en su versión de 64 bits. No existe versión para macOS, Linux, tablets, teléfonos celulares ni versiones anteriores de Windows (7, 8, XP).

El software puede utilizarse de dos maneras:
1. **Como aplicación de escritorio nativa:** Haciendo doble clic en el ícono de acceso directo del escritorio. Esta es la forma de uso recomendada y principal.
2. **Desde un navegador web:** Accediendo a `http://localhost:3000` en los navegadores **Google Chrome** o **Microsoft Edge** instalados en la misma máquina donde se instaló el sistema.

> ⚠️ **Atención:** Intentar acceder desde otro computador de la red o desde un celular puede funcionar de manera limitada, pero no está oficialmente soportado ni es el uso esperado del sistema.

## 3.2. Requisitos Mínimos de Hardware

El sistema requiere un mínimo de recursos del computador debido a que ejecuta tres componentes simultáneamente en segundo plano: la base de datos local PostgreSQL (dentro de Docker), el servidor de la aplicación (Node.js), y la interfaz gráfica con vista tridimensional del almacén (motor WebGL).

| Componente | Especificación Mínima Requerida |
|---|---|
| **Procesador** | Intel Core i3 (8.ª generación o más reciente) o AMD Ryzen 3. De 64 bits. |
| **Memoria RAM** | 8 GB como mínimo absoluto. Con menos de 8 GB el sistema presentará lentitud severa. |
| **Disco Duro / Almacenamiento** | Al menos 10 GB de espacio libre disponible. Se requiere un SSD (Disco de Estado Sólido), no un disco duro mecánico tradicional. |
| **Tarjeta de Video** | Compatible con WebGL (cualquier tarjeta integrada Intel UHD o posterior). Los controladores deben estar actualizados. |
| **Pantalla** | Resolución mínima de 1366 × 768 píxeles. |

## 3.3. Requisitos Recomendados para Mejor Desempeño

Si el computador cumple las siguientes especificaciones, el sistema funcionará de manera óptima, especialmente en el módulo de visualización tridimensional del almacén:

| Componente | Especificación Recomendada |
|---|---|
| **Procesador** | Intel Core i5 (10.ª generación o más reciente) o AMD Ryzen 5 |
| **Memoria RAM** | 16 GB DDR4 |
| **Disco Duro / Almacenamiento** | SSD NVMe de alta velocidad |
| **Tarjeta de Video** | GPU dedicada NVIDIA o AMD con soporte WebGL 2.0 |
| **Pantalla** | Resolución Full HD: 1920 × 1080 píxeles |

## 3.4. Software Previo Necesario

Además de Windows 10 o 11, el computador donde se instale el sistema debe tener previamente instalado el siguiente software gratuito:

| Software | Para qué sirve | Dónde obtenerlo |
|---|---|---|
| **Docker Desktop** | Es el programa que gestiona la base de datos local del sistema. Sin él, el sistema no puede guardar ni leer información. | `https://www.docker.com/products/docker-desktop/` |

> 📌 **Nota:** El equipo de TI de su institución puede encargarse de instalar Docker Desktop antes de proceder con la instalación de Handler TrackSamples. Si ya tiene Docker Desktop instalado y ve el ícono de una ballena blanca cerca del reloj de su pantalla, este requisito ya está cumplido.
