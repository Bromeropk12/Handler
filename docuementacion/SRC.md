# DOCUMENTO DE ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (SRS)

**Nombre del Proyecto:** Handler TrackSamples
**Versión del Documento:** 2.0 (Extendida y Detallada)
**Cliente:** Handler S.A.S. (Colombia)
**Líneas de Mercado:** Cosmética, Industrial y Farmacéutica.

---

## 1. INTRODUCCIÓN Y CONTEXTO

### 1.1 Propósito
El propósito de este documento es definir de manera exhaustiva los requisitos funcionales, no funcionales, arquitectónicos y de experiencia de usuario para el desarrollo del software **Handler TrackSamples**. Este sistema está diseñado para la gestión profesional de inventario de muestras químicas, mitigando riesgos operativos y estandarizando la trazabilidad bajo normas internacionales (SGA).

### 1.2 Alcance del Sistema
El sistema centralizará el ciclo de vida completo de las materias primas químicas, desde su ingreso como "Muestra Global" (Bulk), su subdivisión ("Dispensación") en muestras individuales etiquetadas con códigos QR, su almacenamiento inteligente (motores de reubicación y compatibilidad química), hasta su despacho basado en algoritmos de expiración (FEFO).

### 1.3 Definiciones, Acrónimos y Abreviaturas
* **Bulk (Muestra Global):** Materia prima original en gran volumen. Contiene metadatos base (Proveedor, Lote, SGA).
* **Muestra Dispensada (Individual):** Fracción física extraída del Bulk. Posee un QR único, trazabilidad y ubicación exacta en anaquel.
* **SGA (Sistema Globalmente Armonizado):** Estándar internacional para la clasificación de peligros químicos (Inflamable, Corrosivo, Tóxico, etc.).
* **FEFO (First Expired, First Out):** Lógica de rotación que obliga a consumir primero lo que está más próximo a vencer.
* **CoA (Certificate of Analysis):** Documento PDF emitido por el fabricante que certifica la calidad del lote.
* **JWT:** JSON Web Token, estándar para la transmisión segura de información entre partes.

---

## 2. ARQUITECTURA Y RESTRICCIONES TÉCNICAS

### 2.1 Stack Tecnológico Obligatorio
* **Frontend (Interfaz de Usuario):** React.js, Vue 3 o SvelteKit. Uso estricto de **TailwindCSS** para el diseño de UI.
* **Backend (API y Lógica):** Node.js (Express.js o Fastify).
* **Base de Datos:** **PostgreSQL**. El sistema debe estar diseñado para correr 100% en local, pero con la capacidad arquitectónica de conectarse a **Supabase** (para pruebas o escalabilidad).
* **Controlador de Base de Datos:** Uso EXCLUSIVO de la librería **`pg` (Node-Postgres)**. **ESTÁ ESTRICTAMENTE PROHIBIDO EL USO DE PRISMA ORM** u otros ORMs pesados. Todas las consultas deben ser queries SQL puros y parametrizados.
* **Seguridad:** Encriptación de contraseñas mediante `bcrypt`. Autenticación mediante `JWT`.
* **Empaquetado de Escritorio:** **Tauri** (preferido por ser ligero) o **Electron.js** para empaquetar la aplicación web como un ejecutable nativo para Windows 11.

### 2.2 Atributos de Calidad (No Funcionales)
* **UI/UX:** Diseño Ultra-Moderno, minimalista. **100% Responsive**. Tema claro/oscuro (opcional pero recomendado). Lenguaje estrictamente en Español.
* **Rendimiento:** Las consultas al inventario deben cargar en menos de 500ms. El mapa 2D debe usar renderizado optimizado (Canvas o Virtual DOM avanzado) para evitar lag al arrastrar o visualizar elementos.
* **Ejecución Local:** El sistema debe poder operar completamente offline en una intranet local (Localhost/LAN).

---

## 3. DESCRIPCIÓN DETALLADA DE MÓDULOS

### MÓDULO 0: Autenticación y Seguridad
* **UI Constraint:** La vista completa (Login y "Olvidé mi contraseña") debe ocupar exactamente el `100vh` (Viewport Height). **Cero Scroll**.
* **Login:** Campos de Usuario y Contraseña. Validación JWT.
* **Recuperación:** No depende de emails. Formulario de 4 campos: `Usuario`, `Contraseña Secreta` (llave maestra configurada al crear el usuario), `Nueva Contraseña`, `Confirmar Contraseña`.

### MÓDULO 1: Gestión de Muestras Globales (Bulk)
* **Objetivo:** Registro principal de la materia prima.
* **Campos requeridos por Bulk:**
  * Nombre del Producto.
  * Proveedor.
  * Lote (Alfanumérico).
  * Fecha de Manufactura y Fecha de Vencimiento.
  * Cantidad en gramos/mililitros (Total).
  * Clase de Peligro SGA (Ej. Corrosivo, Inflamable, Sin Riesgo).
  * Línea de Mercado (Cosmética, Industrial, Farmacéutica).
  * **Dimensiones Físicas Requeridas (Ancho x Profundidad):** Enum(`1x1`, `1x2`, `2x1`, `2x2`).
* **Regla de Negocio:** Una Muestra Global NO se ubica en el anaquel. Solo las muestras dispensadas a partir de ella se ubican físicamente.

### MÓDULO 2: Almacén y Gestión 2D (Core del Sistema)
* **Objetivo:** Visualización y gestión física interactiva.
* **Estructura:** El almacén se divide en Líneas de Mercado -> Anaqueles (Shelves) -> Cuadrícula 2D (Grid).
* **Vista 2D:** Mapa visual e interactivo donde se ven los bloques ocupados según sus dimensiones (1x1, 2x2, etc.).
* **Flujo de Dispensación (Creación de Muestras Individuales):**
  1. Seleccionar un Bulk.
  2. Indicar cantidad a dispensar (Ej. de 500g, sacar 10 tarros de 50g).
  3. El sistema genera 10 registros individuales independientes, restando 500g al Bulk.
  4. Generación automática de Código QR único por tarro (El QR contiene: ID Único).

#### Algoritmos Inteligentes del Almacén:
1. **Motor Organizador Automático (SGA):**
   * *Entrada:* Cola de muestras dispensadas sin ubicar.
   * *Proceso:* Lee el riesgo SGA del producto. Escanea los anaqueles disponibles. Si el producto es "Corrosivo", busca un anaquel donde NO haya "Inflamables" en radios cercanos (Matriz de Compatibilidad).
   * *Salida:* Asigna coordenadas `(x, y)` seguras en el anaquel correspondiente a su línea de mercado.
2. **Algoritmo de Reubicación Mínima (Desfragmentación):**
   * *Trigger:* Cuando un usuario o el sistema intenta ingresar un producto grande (ej. `2x2`) y no hay espacio contiguo, pero sí hay celdas vacías dispersas.
   * *Proceso:* El algoritmo calcula qué productos mover (mínimo de movimientos, ej. mover solo 2 productos pequeños) para agrupar los espacios vacíos y formar un bloque `2x2`.
   * *Salida:* Sugerencia visual de movimientos para el operario.

### MÓDULO 3: Despachos (Stepper de 4 Pasos)
* **Paso 1: Búsqueda y Algoritmo FEFO.** El usuario busca "Vitamina C". El sistema localiza todas las muestras dispensadas de Vitamina C y resalta en **VERDE** la que tiene la fecha de vencimiento más próxima.
* **Paso 2: Validación Física.** El operario toma el tarro físico, escanea el QR con un lector o digita el código. El sistema verifica: `QR Escaneado == Código de Muestra Sugerida`. Si es correcto, avanza.
* **Paso 3: Confirmación.** Vista resumen del lote, peso, proveedor y ubicación desde donde se extrajo. Botón "Confirmar Despacho".
* **Paso 4: Documentación y CoA.**
  * El sistema emite la orden de impresión de la etiqueta final (Nombre, Lote, Vencimiento).
  * **Integración OS:** El sistema lee un directorio local de Windows (Ej. `C:\Handler\CoA\`) buscando un archivo PDF cuyo nombre coincida con el Lote despachado. Si lo encuentra, permite visualizarlo o imprimirlo directamente.

### MÓDULO 4: Movimientos y Trazabilidad
* Un log inmutable. Cada vez que se crea un Bulk, se dispensa, se reubica en el mapa 2D o se despacha, se inserta una fila con: `Fecha/Hora`, `Usuario`, `Acción`, `ID Producto`, `Lote`.

### MÓDULO 5: Alertas, Análisis y Dashboard
* Gráficas circulares o de barras de ocupación por Línea de Mercado.
* Alertas rojas para productos vencidos y amarillas para productos a 30/60 días de vencer.
* Productos con stock "Bulk" inferior a un límite establecido.

---

## 4. CASOS DE USO (USE CASES - UC)

### UC-01: Dispensación de Muestra Global
* **Actor Principal:** Operario de Bodega / Analista.
* **Precondición:** El usuario está logueado y existe al menos una Muestra Global (Bulk) con stock suficiente.
* **Flujo Principal:**
  1. El usuario navega al Módulo Almacén.
  2. Selecciona "Nueva Dispensación".
  3. Busca y selecciona el Bulk deseado.
  4. Ingresa el número de subdivisiones y el peso por subdivisión.
  5. El sistema valida que `(Subdivisiones * Peso) <= Stock del Bulk`.
  6. El sistema crea las muestras individuales y genera los códigos QR en memoria.
  7. El sistema envía las muestras a la "Cola de Organización".
* **Postcondición:** El stock del Bulk se reduce. Existen nuevas muestras individuales listas para ser organizadas en el Mapa 2D.

### UC-02: Organización Automática con Motor SGA
* **Actor Principal:** Sistema (Automático) / Operario (Confirmación).
* **Precondición:** Hay muestras individuales en la "Cola de Organización".
* **Flujo Principal:**
  1. El usuario hace clic en "Organizar Pendientes".
  2. El sistema toma la primera muestra, identifica su riesgo SGA.
  3. El sistema escanea el Mapa 2D de la Línea de Mercado correspondiente.
  4. Valida espacios vacíos que cumplan con la dimensión requerida (ej. 1x2).
  5. Valida vecinos contiguos usando la matriz SGA (Ej. No poner un Tóxico al lado de un Comburente).
  6. Asigna coordenadas y muestra al usuario dónde debe colocarlo físicamente.
* **Excepciones:** Si no hay espacio, activa el *Algoritmo de Reubicación Mínima*. Si aun así no hay, lanza alerta de "Anaquel Lleno".

### UC-03: Despacho Validado por QR
* **Actor Principal:** Operario de Despachos.
* **Precondición:** Existen muestras en el almacén.
* **Flujo Principal:**
  1. Inicia el Stepper. Busca producto por nombre.
  2. El sistema muestra la lista ordenada por FEFO, marcando la ideal a retirar.
  3. El usuario ubica el producto físico, escanea el QR con la pistola láser.
  4. El sistema valida que el QR pertenece a ese producto exacto.
  5. Confirma el despacho, actualizando el estado de la muestra a "Despachada".
  6. El sistema busca en el disco duro el archivo `[LOTE].pdf` y lo abre.
* **Excepciones:** Si el QR no coincide, muestra alerta de "Producto Incorrecto".