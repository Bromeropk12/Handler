# 6. SOLUCIÓN DE PROBLEMAS COMUNES

Esta sección le ayudará a resolver de forma autónoma los inconvenientes más frecuentes que pueden presentarse durante el uso cotidiano de **Handler TrackSamples**. Si el problema que experimenta no aparece en este listado, contacte al área de soporte de Tecnologías de la Información (TI) de su institución.

---

## 6.1. No puedo iniciar sesión — La aplicación rechaza mi usuario y contraseña

**¿Qué está pasando?**
El sistema no reconoce la combinación de usuario y contraseña ingresada.

**Posibles causas y soluciones:**

| Causa | Solución |
|---|---|
| La tecla **"Bloq Mayús"** está activada en su teclado | Verifique que el indicador de "Bloq Mayús" esté apagado. Presione la tecla "Bloq Mayús" para desactivarla y vuelva a intentarlo. |
| Está escribiendo el nombre de usuario o contraseña con errores tipográficos | Borre los campos completamente y vuelva a escribirlos con cuidado, respetando mayúsculas y minúsculas. |
| Su cuenta fue desactivada o su contraseña fue cambiada por el Administrador | Contacte al Administrador del sistema para que verifique el estado de su cuenta. |
| Olvidó su contraseña | No existe una recuperación automática de contraseña. El Administrador debe restablecer su contraseña desde el módulo de Gestión de Usuarios. |

---

## 6.2. La aplicación muestra un error de conexión o no carga los datos después de abierta

**¿Qué está pasando?**
La ventana de la aplicación se abre correctamente, pero al intentar iniciar sesión o navegar entre módulos, aparece un mensaje de error de red o la pantalla se queda cargando indefinidamente.

**Causa:** El servicio de base de datos PostgreSQL no está activo en su computador.

**Solución paso a paso:**
1. Presione las teclas `Ctrl + Shift + Esc` para abrir el **Administrador de tareas**.
2. Vaya a la pestaña **"Servicios"**.
3. Busque **"postgresql-x64-15"** en la lista (puede ordenarla por nombre).
4. Verifique que su estado sea **"En ejecución"**.
5. Si aparece como **"Detenido"**, haga clic derecho sobre él y seleccione **"Iniciar"**.
6. Espere 10 segundos y cierre la aplicación Handler TrackSamples (si está abierta).
7. Vuelva a abrir la aplicación desde el acceso directo del escritorio.

> 📌 **Consejo:** Si este problema ocurre con frecuencia, configure el servicio de PostgreSQL para que se inicie automáticamente con Windows. Para hacerlo, abra `services.msc` (Servicios), busque `postgresql-x64-15`, haga clic derecho → Propiedades → Tipo de inicio: Automático.

---

## 6.3. El sistema me bloqueó y no me deja guardar una muestra en un anaquel específico — Advertencia de "Incompatibilidad Química"

**¿Qué está pasando?**
Al intentar asignar una muestra a una posición específica dentro de un anaquel, el sistema muestra una alerta de incompatibilidad y no permite guardar la operación.

**Causa:** El sistema detectó que la muestra que intenta almacenar tiene una clase de peligro SGA que es incompatible con otro producto ya almacenado en ese mismo anaquel. Por ejemplo, no está permitido almacenar un producto "Inflamable" junto a un producto "Comburente" (oxidante), ya que esta combinación puede generar un riesgo real de incendio o explosión.

**Solución:**
- Esta advertencia es una **medida de protección** y no debe ser ignorada. El sistema está cumpliendo con las normas internacionales de seguridad química (SGA/GHS).
- No almacene el producto en esa ubicación. En cambio, asígnelo a un **anaquel diferente** donde no existan productos con los que sea incompatible.
- Si tiene dudas sobre dónde almacenar el producto de forma segura, consulte la **Ficha de Datos de Seguridad (FDS)** del producto o al responsable de seguridad industrial de su empresa.

---

## 6.4. El mapa del Almacén 3D aparece en negro o no se visualiza correctamente

**¿Qué está pasando?**
Al acceder al módulo de Almacén, el espacio donde debería verse la bodega tridimensional aparece completamente negro, o los objetos se ven distorsionados.

**Causa:** El motor de gráficos 3D (WebGL) perdió su contexto de memoria de video, generalmente por falta temporal de recursos en la tarjeta gráfica del computador.

**Solución:**
1. No se alarme. Esta situación **no afecta los datos** almacenados en el sistema.
2. Haga clic en la **"X"** roja de la ventana de Handler TrackSamples para cerrar la aplicación completamente.
3. Espere 10 segundos.
4. Vuelva a abrir la aplicación desde el ícono del escritorio.
5. Al recargar, el mapa 3D debería visualizarse correctamente.

Si el problema persiste sistemáticamente, informe al área de TI. Puede estar relacionado con controladores (drivers) de la tarjeta de video que necesitan actualización, o con que el computador no cumple con los requisitos mínimos de hardware para el módulo 3D.

---

## 6.5. Cometí un error en el sistema — Registré información incorrecta

**¿Qué está pasando?**
Ingresó datos incorrectos en el sistema (por ejemplo, un peso equivocado, una fecha de vencimiento errónea, o realizó un despacho de un frasco que no debía).

**Qué hacer:**
1. **Mantenga la calma.** El sistema mantiene un registro de todas las operaciones en el Historial de Movimientos. Su error ha quedado documentado y puede ser rastreado.
2. **No intente "arreglar" el error realizando más operaciones** que podrían complicar la situación.
3. Diríjase al módulo de **Inventario de Muestras** y, si tiene los permisos correspondientes, edite el registro con la información correcta. El sistema registrará automáticamente la corrección en el historial.
4. Si el error fue más grave (como un despacho incorrecto que no puede revertirse fácilmente), **notifique inmediatamente al Administrador del sistema**. El Administrador puede restaurar un backup del día anterior si dispone de uno actualizado.

> 📌 **Lección importante:** Este es el motivo principal por el que se recomienda que el Administrador cree backups de forma periódica. Un backup reciente permite restaurar el sistema a un estado anterior y deshacer errores graves.

---

## 6.6. Mi sesión se cerró sola en medio del trabajo

**¿Qué está pasando?**
El sistema lo redirigió a la pantalla de inicio de sesión sin que usted lo haya solicitado.

**Causa:** Las sesiones de usuario tienen una duración máxima de **8 horas** como medida de seguridad. Pasado ese tiempo, el sistema cierra la sesión automáticamente para proteger la información en caso de que el computador quede desatendido.

**Solución:** Inicie sesión nuevamente con sus credenciales. Si estaba en medio de un formulario, es posible que deba ingresar la información nuevamente.

> 📌 **Consejo:** Si trabaja en turnos largos y este problema es recurrente, solicite al Administrador que ajuste la duración de la sesión en la configuración del sistema.

---

## 6.7. El sistema tarda mucho en cargar o responde lentamente

**Posibles causas y soluciones:**

| Causa | Solución |
|---|---|
| El computador tiene poca memoria RAM disponible | Cierre los programas que no esté usando (navegadores con muchas pestañas, reproductores de video, etc.) para liberar memoria. |
| El servicio PostgreSQL se reinició mal o está consumiendo muchos recursos | Reinicie el servicio: abra `services.msc`, busque `postgresql-x64-15`, haga clic derecho → **"Reiniciar"** |
| El disco duro está casi lleno | Verifique que tenga al menos 5 GB libres en el disco donde está instalado el sistema. |
| La aplicación lleva mucho tiempo abierta sin reiniciarse | Cierre y vuelva a abrir la aplicación para liberar la memoria acumulada (Reinicio normal del punto 4.3). |
