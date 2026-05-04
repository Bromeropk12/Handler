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
