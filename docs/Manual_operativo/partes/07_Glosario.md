# 7. GLOSARIO DE TÉRMINOS

Este glosario define los términos técnicos, normativos y operativos utilizados a lo largo del presente Manual de Usuario y en la interfaz del sistema **Handler TrackSamples**. Su propósito es estandarizar el lenguaje entre el personal operativo, administrativo y de TI.

---

**Algoritmo FEFO (First-Expired, First-Out)**
Regla logística que ordena que el producto con la fecha de vencimiento más próxima debe ser el primero en salir del almacén. En Handler TrackSamples, este algoritmo está implementado en el módulo de Despachos y determina automáticamente qué frasco debe ser entregado primero, sin depender del criterio subjetivo del operario.

---

**Anaquel**
Representación digital de un mueble físico de almacenamiento (estantería, rack o armario de laboratorio) dentro del sistema. Cada anaquel está definido por sus dimensiones en una cuadrícula tridimensional: número de columnas (ancho), número de niveles (alto) y profundidad. Pertenece a una sola Línea de Mercado.

---

**Backup (Copia de Seguridad)**
Imagen completa del estado de la base de datos en un momento específico del tiempo. Contiene toda la información del inventario: muestras, anaqueles, usuarios, movimientos, proveedores y configuraciones. En Handler TrackSamples, los backups se almacenan localmente en la base de datos del sistema, sin enviar datos a internet. El sistema guarda un máximo de 3 backups simultáneos.

---

**Certificado de Análisis (CoA — Certificate of Analysis)**
Documento oficial emitido por el fabricante o proveedor de una materia prima que certifica los resultados de las pruebas de calidad y pureza realizadas sobre ese lote específico. En el sistema, puede adjuntarse como archivo PDF al registro de cada muestra global.

---

**Clase de Peligro SGA (GHS Hazard Class)**
Categoría de riesgo asignada a una sustancia química según el Sistema Globalmente Armonizado (SGA). Las clases disponibles en el sistema son: Sin Riesgo, Inflamable, Corrosivo, Tóxico, Comburente y Explosivo. Esta clasificación determina las restricciones de almacenamiento y compatibilidad entre productos.

---

**Código QR**
Imagen en forma de cuadrícula de puntos negros y blancos que codifica la información de identificación de un frasco dispensado. Cada frasco hijo generado por el sistema recibe un código QR único que contiene: ID interno, número de lote, nombre del producto, número de submuestra y peso en gramos. Puede imprimirse y pegarse en el recipiente físico para su identificación rápida mediante un escáner o la cámara de un celular.

---

**Despacho**
Proceso de sacar un producto del almacén y registrar su entrega a un solicitante (departamento de producción, cliente, laboratorio). En el sistema, un despacho cambia el estado del frasco dispensado de "Almacenado" a "Despachado" y registra la fecha y hora exacta de la salida.

---

**Dispensación**
Proceso de fraccionar el contenido de una muestra global (recipiente grande de materia prima) en múltiples submuestras más pequeñas (frascos hijos) para uso o distribución. El sistema calcula automáticamente el balance de pesos y genera un código QR único para cada frasco hijo resultante.

---

**GHS (Globally Harmonized System)**
Nombre en inglés del Sistema Globalmente Armonizado de clasificación y etiquetado de productos químicos. Es una norma de las Naciones Unidas adoptada mundialmente para estandarizar la comunicación de los peligros de los productos químicos mediante pictogramas, palabras de señal y etiquetas de advertencia uniformes.

---

**Línea de Mercado**
Categoría o segmento de negocio que agrupa los productos del almacén según su uso o destino comercial. El sistema viene preconfigurado con tres líneas: Cosmética, Farmacéutica e Industrial. Cada anaquel y cada muestra pertenecen a una línea de mercado.

---

**Lote (Lot Number)**
Código alfanumérico asignado por el fabricante a un conjunto de unidades producidas bajo las mismas condiciones y en el mismo período. Es el identificador clave para la trazabilidad y el retiro de productos en caso de defectos de calidad.

---

**Muestra Global (Bulk Sample)**
El recipiente original y completo de una materia prima tal como llega del proveedor (cuñete, tambor, saco, botella de gran tamaño). Es el objeto central del inventario maestro del sistema. De una muestra global pueden derivarse múltiples submuestras (frascos hijos) mediante el proceso de Dispensación.

---

**Operador**
Rol de usuario del sistema asignado al personal de almacén que realiza las operaciones cotidianas: registrar muestras entrantes, realizar dispensaciones, ejecutar despachos y consultar el inventario. Tiene permisos más restringidos que el Administrador.

---

**Administrador (Admin)**
Rol de mayor jerarquía en el sistema. El usuario Administrador tiene acceso a todas las funciones, incluyendo la creación y gestión de otros usuarios, la configuración de anaqueles, líneas de mercado y proveedores, y el manejo del sistema de backups. Cada instalación debe tener al menos un Administrador.

---

**Pictograma GHS**
Símbolo visual estandarizado dentro de un rombo rojo (o negro sobre fondo blanco en etiquetas) que comunica el tipo de peligro de una sustancia química. Ejemplos: llama (inflamable), calavera (tóxico agudo), rombo de peligro (explosivo). El sistema permite registrar múltiples pictogramas por cada muestra.

---

**PostgreSQL**
Motor de base de datos relacional de código abierto que utiliza Handler TrackSamples para almacenar toda la información del inventario. Se instala automáticamente en Windows durante la instalación del sistema y funciona como un servicio más del computador, al igual que otros servicios del sistema. No requiere conexión a internet ni ninguna capa de virtualización.

---

**RLS (Row Level Security)**
Mecanismo de seguridad de PostgreSQL que controla el acceso a las filas individuales de una tabla según el usuario o rol que realiza la consulta. En Handler TrackSamples, RLS está habilitado en las 8 tablas principales para garantizar que incluso a nivel de base de datos, los usuarios solo puedan acceder a la información que les corresponde según sus permisos.

---

**Sesión / Token JWT**
Período de tiempo durante el cual un usuario está autenticado en el sistema después de iniciar sesión. En Handler TrackSamples, cada sesión tiene una duración de 8 horas. Al iniciar sesión, el sistema genera un "token" digital (JWT — JSON Web Token) que actúa como pase de acceso temporal para todas las operaciones durante ese período.

---

**SGA (Sistema Globalmente Armonizado)**
Versión en español del GHS (Globally Harmonized System). Sistema de la Organización de las Naciones Unidas para la clasificación y etiquetado de productos químicos peligrosos, adoptado internacionalmente para garantizar la comunicación coherente de los riesgos químicos en todo el mundo.

---

**Trazabilidad**
Capacidad de rastrear y reconstruir el historial completo de un producto a lo largo de toda su vida dentro del almacén: desde cuándo ingresó, qué usuario lo registró, si fue dispensado, cuántas subdivisiones se hicieron, y cuándo y a quién fue despachado. En Handler TrackSamples, la trazabilidad queda garantizada por el Historial de Movimientos, que es inmutable.

---

**WebGL**
Tecnología estándar de los navegadores web que permite renderizar gráficos tridimensionales acelerados por hardware de la tarjeta de video del computador. Handler TrackSamples utiliza WebGL para proyectar el mapa interactivo 3D del almacén directamente en la ventana de la aplicación.
