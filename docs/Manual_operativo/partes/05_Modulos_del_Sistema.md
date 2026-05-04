# 5. PRESENTACIÓN Y MANEJO DE LOS MÓDULOS DEL SISTEMA

Esta sección constituye el núcleo principal del manual de usuario. A continuación, se documenta de forma detallada cada módulo funcional del sistema, acompañado de su respectiva captura de pantalla real y una descripción paso a paso de las operaciones que puede realizar en él.

---

## 5.1. Inicio de Sesión (Login)

![Pantalla de Inicio de Sesión](./img/01_Login.png)

### ¿Qué es esta pantalla?
Es la puerta de entrada al sistema. **Handler TrackSamples** utiliza un sistema de acceso con usuario y contraseña para garantizar que sólo el personal autorizado pueda ver y gestionar la información del inventario. Cada usuario tiene sus propias credenciales y un perfil de permisos asignado por el Administrador.

### ¿Cómo acceder al sistema?

✅ **Paso a Paso:**
1. Ingrese su **nombre de usuario** en el primer campo de texto. Este fue proporcionado por el Administrador del sistema al momento de crear su cuenta.
2. Ingrese su **contraseña** en el segundo campo. La contraseña es sensible a mayúsculas y minúsculas; si tiene activada la tecla "Bloq Mayús", desactívela antes de escribirla.
3. Haga clic en el botón **"Iniciar Sesión"**.
4. Si las credenciales son correctas, el sistema lo llevará automáticamente al Panel de Control (Dashboard). Si son incorrectas, aparecerá un mensaje de error. Verifique sus datos e inténtelo nuevamente.

> 📌 **Nota:** La sesión tiene una duración de 8 horas. Pasado ese tiempo, el sistema le pedirá que inicie sesión nuevamente como medida de seguridad.

> 🔒 **Solo Administrador:** Si olvidó su contraseña, debe contactar al Administrador del sistema. Él tiene la capacidad de restablecer credenciales desde el módulo de Gestión de Usuarios.

---

## 5.2. Panel de Control (Dashboard)

![Panel de Control - Dashboard](./img/02_Dashboard.png)

### ¿Qué es esta pantalla?
Es la primera pantalla que ve después de iniciar sesión. Funciona como un **centro de control y alerta temprana** del almacén. Su objetivo es mostrarle de un vistazo el estado actual del inventario, priorizando la información más urgente: los productos que ya vencieron y los que están próximos a vencer.

### ¿Qué información encuentra aquí?

- **Tarjeta "Muestras Vencidas" (color rojo):** Muestra el número total de materias primas cuya fecha de vencimiento ya pasó. Estos productos no deben ser despachados ni utilizados. Haga clic en esta tarjeta para ir directamente a la lista de productos vencidos y tomar acción.
- **Tarjeta "Próximas a Vencer" (color amarillo):** Muestra los productos que vencerán en los próximos 30 días. Estos requieren atención prioritaria para ser utilizados o despachados antes de expirar.
- **Menú lateral izquierdo:** Es la barra de navegación principal del sistema. Desde aquí puede acceder a todos los módulos autorizados para su perfil de usuario.

> 📌 **Buena Práctica:** Se recomienda revisar el Dashboard cada vez que inicie su jornada laboral, antes de comenzar cualquier operación de inventario.

---

## 5.3. Inventario de Muestras Globales

![Inventario de Muestras Globales](./img/03_Muestras_Globales.png)

### ¿Qué es este módulo?
Es el registro central del almacén. Aquí se encuentra el listado de todas las **materias primas en su presentación original** (recipientes grandes, cuñetes, tambores) que han sido ingresadas al sistema. Cada fila de la tabla representa un lote específico de un producto químico, con toda su información normativa y de ubicación.

### ¿Qué información muestra la tabla?
Cada muestra registrada muestra: nombre del producto, proveedor, número de lote, fecha de fabricación, fecha de vencimiento, línea de mercado a la que pertenece, unidades disponibles, peso total en gramos, clase de peligrosidad según la norma SGA (con su color identificador), y la posición física donde está guardada en el anaquel.

### ¿Cómo registrar una nueva materia prima que llegó al almacén?

✅ **Paso a Paso:**
1. Haga clic en el botón **"Nueva Muestra"** (generalmente en la esquina superior derecha de la pantalla).
2. Complete el formulario con todos los datos del producto:
   - **Nombre:** Nombre técnico o comercial de la materia prima.
   - **Proveedor:** Seleccione de la lista el proveedor que la suministró (BASF, JRS, THOR, JRF, SUDEEP, GIVAUDAN, MEGGLE, u otro registrado).
   - **Lote:** Número de lote del recipiente, tal como aparece en la etiqueta física.
   - **Fecha de Fabricación y Vencimiento:** Ingrese las fechas exactas según el certificado del proveedor. La fecha de fabricación no puede ser posterior a la de vencimiento.
   - **Línea de Mercado:** Seleccione la categoría comercial correspondiente (Cosmética, Farmacéutica, Industrial).
   - **Clase de Peligro SGA:** Seleccione la clasificación correcta (Sin Riesgo, Inflamable, Corrosivo, Tóxico, Comburente, Explosivo). Esta información está en la ficha de datos de seguridad (FDS) del producto.
   - **Pictogramas GHS:** Marque todos los pictogramas de advertencia que aparecen en el envase del producto.
   - **Peso total (gramos):** Peso total del recipiente en gramos.
   - **Unidades:** Número de recipientes de este lote que ingresaron.
   - **CoA (Certificado de Análisis):** Si tiene el documento PDF del certificado de análisis, puede adjuntarlo aquí para que quede vinculado al registro.
3. Haga clic en **"Guardar"** o **"Crear Muestra"**.
4. El sistema verificará que los datos son correctos y, si todo está bien, la nueva muestra aparecerá en la tabla del inventario.

### ¿Cómo buscar un producto específico?
Utilice la **barra de búsqueda** en la parte superior de la tabla. Puede buscar por nombre del producto, número de lote o proveedor. Los resultados se filtran en tiempo real mientras escribe.

> ⚠️ **Atención SGA:** Si el sistema muestra un mensaje de advertencia al guardar, es porque detectó que el producto que intenta almacenar en una ubicación específica del anaquel es **químicamente incompatible** con otro producto ya almacenado allí. En ese caso, asigne el producto a un anaquel diferente, alejado de los productos con los que es incompatible.

---

## 5.4. Dispensación de Muestras

![Dispensación de Muestras](./img/04_Dispensacion.png)

### ¿Qué es este módulo?
La **Dispensación** es el proceso de tomar un recipiente grande (la muestra global, como un cuñete de 25 kg) y dividirlo en **varios frascos más pequeños** que serán entregados a los departamentos de producción, clientes o laboratorios. Cada frasco pequeño generado recibe automáticamente un **código QR único** que puede imprimirse y pegarse en el recipiente físico para su identificación.

### ¿Cómo realizar una dispensación?

✅ **Paso a Paso:**
1. En el menú lateral, haga clic en **"Dispensación"**.
2. **Seleccione la Línea de Mercado** del producto que desea dispensar (Cosmética, Farmacéutica o Industrial). Esto filtra el inventario para mostrar sólo los productos de esa categoría.
3. En la lista de productos, identifique la muestra global de la que tomará el material y haga clic en ella.
4. En el panel **"Configurar Frascos Hijos"**:
   - **Número de frascos:** Cuántos recipientes pequeños va a llenar.
   - **Peso por frasco (gramos):** Cuántos gramos contendrá cada frasco pequeño.
5. El sistema calculará automáticamente si el peso total de los frascos hijos es compatible con el peso disponible en la muestra global. Si no hay suficiente material, mostrará un error.
6. Haga clic en **"Ejecutar Dispensación"**.
7. El sistema registrará los nuevos frascos, descontará el peso del recipiente original y generará los códigos QR para cada frasco hijo.
8. Imprima los códigos QR y péguelos en los recipientes físicos correspondientes.

> 📌 **Nota:** Cada frasco hijo hereda automáticamente toda la información del producto padre: lote, fecha de vencimiento, datos del proveedor y certificado de análisis. No es necesario ingresar esta información nuevamente.

---

## 5.5. Despachos (Algoritmo FEFO)

![Módulo de Despachos](./img/05_Despachos.png)

### ¿Qué es este módulo?
El módulo de **Despachos** gestiona la salida de productos del almacén cuando alguien los solicita (un departamento de producción, un cliente, un laboratorio). Su característica más importante es que implementa el criterio **FEFO** (del inglés *First-Expired, First-Out*: "Primero en Vencer, Primero en Salir"), lo que significa que el sistema le indica automáticamente **cuál frasco específico debe entregar primero**, sin dejarle esa decisión al criterio del operario.

Esto evita el error muy común de despachar frascos "al azar" mientras otros con fecha de vencimiento más próxima quedan en el fondo del estante y terminan venciéndose sin usarse.

### ¿Cómo realizar un despacho?

✅ **Paso a Paso:**
1. En el menú lateral, haga clic en **"Despachos"**.
2. En el campo de búsqueda, escriba el **nombre del producto** que le están solicitando.
3. Haga clic en el botón **"Buscar"**.
4. El sistema mostrará una lista de todos los frascos disponibles de ese producto, ordenados por urgencia de vencimiento. El frasco que aparece primero (resaltado) es **el que DEBE entregar primero** según la norma FEFO.
5. La tarjeta del frasco recomendado muestra:
   - Su **código QR** (para localizarlo físicamente en el estante).
   - La **ubicación exacta** en el almacén: nombre del anaquel, columna (X), nivel (Y) y profundidad (Z).
   - Los **días restantes** de vida útil.
6. Retire físicamente ese frasco del estante según las coordenadas indicadas.
7. Haga clic en **"Confirmar Despacho"** para registrar la salida en el sistema.

> ⚠️ **Atención:** Una vez confirmado el despacho, el sistema registra la salida de ese frasco y actualiza el inventario. Esta acción no puede deshacerse fácilmente. Asegúrese de haber retirado el frasco correcto antes de confirmar.

---

## 5.6. Almacén — Visualización Tridimensional

![Almacén 3D](./img/06_Almacen.png)

### ¿Qué es este módulo?
Es el **mapa interactivo en tres dimensiones** de su bodega de almacenamiento. Permite ver de forma visual e intuitiva cómo están distribuidos los anaqueles, qué tan llenos están y dónde está ubicado cada producto, sin necesidad de caminar físicamente por el almacén.

### ¿Cómo navegar en el mapa 3D?
- **Rotar la vista:** Mantenga presionado el botón izquierdo del ratón y mueva el ratón en cualquier dirección para girar la cámara alrededor del almacén.
- **Hacer zoom:** Use la rueda de desplazamiento del ratón (scroll) para acercarse o alejarse.
- **Desplazarse lateralmente:** Mantenga presionado el botón derecho del ratón y mueva el ratón.
- **Hacer clic en una celda ocupada:** Si hace clic en un bloque de color dentro del anaquel, aparecerá un panel lateral con la información del producto almacenado en esa posición (nombre, lote, vencimiento, proveedor).

### ¿Qué significan los colores?
- **Verde:** El frasco está almacenado correctamente y su fecha de vencimiento está lejana.
- **Amarillo/Naranja:** El frasco está próximo a vencer (menos de 30 días).
- **Rojo:** El frasco ya está vencido.
- **Gris (celda vacía):** Espacio disponible en el anaquel.

---

## 5.7. Gestión de Anaqueles

![Gestión de Anaqueles](./img/07_Anaqueles.png)

### ¿Qué es este módulo?
Permite **registrar y configurar los muebles de almacenamiento físico** (estanterías, racks, anaqueles) que existen en la bodega. Cada anaquel registrado aquí aparece luego en el mapa 3D del almacén. El sistema viene preconfigurado con 14 anaqueles físicos distribuidos en las 3 líneas de mercado.

### ¿Cómo ver el estado de un anaquel?
Cada tarjeta de anaquel muestra su nombre, la línea de mercado a la que pertenece, sus dimensiones en la cuadrícula 3D (columnas × niveles × profundidad) y el **porcentaje de ocupación** actual calculado automáticamente por el sistema.

### ¿Cómo crear un nuevo anaquel?

> 🔒 **Solo Administrador:** Esta acción requiere el permiso `warehouse.create_shelf`.

✅ **Paso a Paso:**
1. Haga clic en el botón **"Nuevo Anaquel"**.
2. Complete el formulario:
   - **Nombre:** Nombre identificador del anaquel (Ej: "BASF #4", "MIXTO #2").
   - **Línea de Mercado:** A qué categoría pertenece este mueble.
   - **Tipo:** "Almacenamiento normal" o "Zona temporal para muestras bulk".
   - **Dimensiones:** Número de columnas (ancho), niveles (alto) y profundidad. Estos valores definen el tamaño de la cuadrícula 3D del anaquel.
3. Haga clic en **"Guardar"**. El nuevo anaquel aparecerá en el mapa 3D.

---

## 5.8. Historial de Movimientos

![Historial de Movimientos](./img/08_Movimientos.png)

### ¿Qué es este módulo?
Es el **libro de registro inmutable** del sistema. Aquí queda guardado un historial detallado y permanente de cada acción realizada en el sistema por cualquier usuario: quién inició sesión, quién ingresó una muestra nueva, quién hizo un despacho, quién realizó cambios en la configuración, y cuándo ocurrió cada acción.

Este registro **no puede ser editado ni eliminado** por ningún usuario, ni siquiera el Administrador, lo que lo convierte en una herramienta confiable para auditorías de calidad y control interno.

### ¿Cómo usar el historial?
- La tabla muestra los eventos en orden cronológico descendente (el más reciente primero).
- Cada fila muestra: fecha y hora exacta, tipo de acción, nombre del usuario que la realizó, y el producto afectado (si aplica).
- Puede usar los **filtros** para buscar eventos por tipo de acción, usuario o rango de fechas.

### ¿Cómo exportar el historial?
1. Aplique los filtros que desee (o déjelos en blanco para exportar todo).
2. Haga clic en el botón **"Exportar CSV"**.
3. Se descargará un archivo `.csv` que puede abrir en Microsoft Excel para análisis o presentación a entes de control.

---

## 5.9. Directorio de Proveedores

![Directorio de Proveedores](./img/09_Proveedores.png)

### ¿Qué es este módulo?
Es la agenda de contactos de los **proveedores de materias primas** con los que trabaja la empresa. El sistema viene preconfigurado con los 7 proveedores reales de la operación: **BASF, JRS, THOR, JRF, SUDEEP, GIVAUDAN y MEGGLE**. Cada proveedor está vinculado a las líneas de mercado que abastece.

### ¿Cómo agregar un nuevo proveedor?

> 🔒 **Solo Administrador:** Requiere permiso `suppliers.create`.

1. Haga clic en el botón **"Nuevo Proveedor"**.
2. Complete el formulario con el nombre, teléfono, correo electrónico, dirección y las líneas de mercado que abastece.
3. Opcionalmente, puede subir el **logotipo** del proveedor en formato imagen (PNG o JPG) para que aparezca en su tarjeta de presentación dentro del sistema.
4. Haga clic en **"Guardar"**.

---

## 5.10. Líneas de Mercado

![Líneas de Mercado](./img/10_Lineas_Mercado.png)

### ¿Qué es este módulo?
Las Líneas de Mercado son las **categorías principales** que organizan todo el inventario del almacén. El sistema viene preconfigurado con tres: **Cosmética, Farmacéutica e Industrial**. Cada anaquel y cada muestra química pertenecen a una línea de mercado.

### ¿Cómo crear una nueva línea de mercado?

> 🔒 **Solo Administrador:** Requiere permiso `market_lines.create`.

1. Haga clic en **"Nueva Línea"**.
2. Ingrese el nombre de la nueva categoría de negocio.
3. Haga clic en **"Guardar"**.

> ⚠️ **Atención:** Eliminar una línea de mercado que tenga anaqueles y muestras asociadas **eliminará en cascada todos esos datos**. Solo realice esta acción si está completamente seguro.

---

## 5.11. Sistema de Copias de Seguridad (Backups)

![Sistema de Backups](./img/11_Backups.png)

### ¿Qué es este módulo?

> 🔒 **Solo Administrador:** Este módulo sólo es visible y accesible para usuarios con rol de Administrador.

Es el **sistema de respaldo y recuperación** de toda la información del sistema. Permite crear copias de seguridad de la base de datos local (inventario completo, movimientos, usuarios, configuración de anaqueles) y, en caso de emergencia o pérdida de datos, restaurar el sistema a un punto anterior.

Las copias de seguridad se guardan directamente dentro de la base de datos local del sistema, en la misma infraestructura del software instalado en su computador Windows, sin enviar ningún dato a internet ni a servidores externos.

### ¿Cómo crear un backup manual?

✅ **Paso a Paso:**
1. En el menú lateral, haga clic en **"Backups"**.
2. En el panel principal, haga clic en el botón **"Crear Backup Ahora"**.
3. El sistema exportará automáticamente toda la base de datos y guardará la copia con un nombre que incluye la fecha y hora actual (Ej: `backup_handler_2026-05-04T12-00-00.json`).
4. Tras unos segundos, el nuevo backup aparecerá en la lista de backups disponibles con su tamaño en MB.

> 📌 **Nota:** El sistema mantiene un máximo de **3 backups** almacenados. Cuando se crea un cuarto backup, el más antiguo se elimina automáticamente. Se recomienda exportar y guardar en una unidad externa los backups más importantes si desea conservarlos por más tiempo.

> 📌 **Backup Automático:** El sistema también realiza copias de seguridad automáticas cada 20 días a las 12:00 PM. Puede modificar este intervalo desde el mismo panel de Backups.

### ¿Cómo restaurar un backup?

> ⚠️ **Atención Crítica:** Restaurar un backup **reemplaza toda la información actual** de la base de datos con los datos del punto de restauración seleccionado. La información registrada después de ese backup se perderá permanentemente. Cree siempre un backup del estado actual antes de restaurar.

1. En la lista de backups disponibles, identifique el backup al cual desea volver.
2. Haga clic en **"Restaurar"** junto a ese backup.
3. El sistema le pedirá que ingrese su **contraseña de administrador** como confirmación de seguridad.
4. Ingrese la contraseña correcta y confirme la acción.
5. El sistema restaurará la base de datos. Este proceso puede tardar uno o dos minutos.

---

## 5.12. Gestión de Usuarios y Configuración Personal

![Gestión de Usuarios](./img/13_Gestion_Usuarios.png)

### Cambio de Contraseña Personal (Todos los usuarios)
Cualquier usuario puede cambiar su propia contraseña de acceso desde el menú de perfil:
1. Haga clic en su nombre de usuario en la esquina superior de la interfaz.
2. Seleccione **"Configuración"** o **"Cambiar contraseña"**.
3. Ingrese su contraseña actual para verificar su identidad.
4. Ingrese la nueva contraseña dos veces para confirmarla.
5. Haga clic en **"Guardar cambios"**.

> 📌 **Recomendación de Seguridad:** Use una contraseña de al menos 8 caracteres que combine letras mayúsculas, minúsculas, números y caracteres especiales. Cámbiela periódicamente.

### Administración de Usuarios

> 🔒 **Solo Administrador:** El módulo `/users` sólo es accesible para el Administrador.

![Gestión de Usuarios Admin](./img/12_Configuraciones.png)

Desde este módulo, el Administrador puede:

**Crear un nuevo usuario:**
1. Haga clic en el botón **"Crear Usuario"**.
2. Ingrese el nombre de usuario, la contraseña inicial y seleccione el rol (`admin`, `operator` o `analyst`).
3. Configure los permisos individuales del usuario mediante los toggles de la lista de permisos.
4. Haga clic en **"Guardar"**.

**Editar permisos de un usuario existente:**
1. Haga clic sobre la tarjeta del usuario que desea modificar.
2. Ajuste los toggles de permisos según las responsabilidades del empleado.
3. Guarde los cambios.

**Eliminar un usuario:**
1. Haga clic en el botón de eliminar junto al usuario (ícono de papelera o cruz).
2. Confirme la acción.

> ⚠️ **Atención:** El Administrador no puede eliminar su propia cuenta de usuario para evitar dejar el sistema sin acceso administrativo.
