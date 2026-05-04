# 4. INSTALACIÓN, EJECUCIÓN, REINICIO Y DESINSTALACIÓN

## 4.1. Instalación del Sistema

El sistema **Handler TrackSamples** se instala en su computador con Windows 10 o Windows 11 mediante un único archivo de instalación ejecutable. Este proceso fue diseñado para ser lo más sencillo posible y no requiere conocimientos técnicos avanzados, aunque se recomienda que la primera instalación sea realizada o supervisada por el personal del área de Tecnologías de la Información (TI).

> ⚠️ **Atención:** Antes de iniciar la instalación, verifique que **Docker Desktop** esté instalado y corriendo en su computador (debe ver el ícono de la ballena blanca cerca del reloj de Windows). Si no lo tiene, solicítelo al área de TI.

### ✅ Paso a Paso para la Instalación

**Paso 1 — Obtener el instalador:**
Solicite al administrador de sistemas o al área de TI el archivo `Handler_TrackSamples_Setup.exe`. Guárdelo en un lugar de fácil acceso (por ejemplo, el escritorio o la carpeta de Descargas).

**Paso 2 — Ejecutar el instalador:**
Haga doble clic sobre el archivo `Handler_TrackSamples_Setup.exe`. Windows puede mostrar una ventana de aviso de seguridad preguntando si desea permitir que la aplicación realice cambios en el equipo. Haga clic en **"Sí"** para continuar.

**Paso 3 — Seguir el asistente de instalación:**
El programa mostrará una serie de pantallas guiadas. En cada una, revise la información y haga clic en **"Siguiente"** o **"Instalar"**. Las opciones más importantes son:
- **Directorio de instalación:** Por defecto es `C:\Program Files\Handler TrackSamples\`. Se recomienda no cambiar esta ubicación.
- **Acceso directo en el escritorio:** Asegúrese de que esta casilla esté marcada. Así tendrá el ícono de Handler TrackSamples directamente en su escritorio.

**Paso 4 — Esperar la instalación automática:**
Durante este paso, el instalador realiza de forma automática y transparente varias acciones en segundo plano: descarga e instala la base de datos local (PostgreSQL dentro de Docker), prepara todos los datos iniciales del sistema (proveedores, anaqueles, líneas de mercado) y configura los permisos necesarios. Este proceso puede tardar entre **2 y 5 minutos** dependiendo de la velocidad del computador.

**Paso 5 — Finalizar:**
Cuando aparezca la pantalla de "Instalación completada", el sistema está listo para usarse. Puede hacer clic en "Finalizar". Si la casilla "Iniciar Handler TrackSamples ahora" está marcada, la aplicación se abrirá automáticamente.

---

## 4.2. Cómo Abrir (Ejecutar) el Sistema

Una vez instalado, para abrir la aplicación en cualquier momento:

1. Busque el ícono de **"Handler TrackSamples"** en su escritorio de Windows.
2. Haga **doble clic** sobre él.
3. La ventana principal de la aplicación se abrirá mostrando la pantalla de inicio de sesión.

> 📌 **Nota:** Antes de abrir la aplicación, asegúrese de que el ícono de Docker Desktop (la ballena blanca) esté visible y activo en la bandeja del sistema de Windows (esquina inferior derecha, cerca del reloj). Si Docker no está activo, la aplicación mostrará un error al intentar cargar los datos.

**Credenciales de acceso inicial (proporcionadas por su administrador):**
- Las credenciales de usuario (nombre de usuario y contraseña) son asignadas por el Administrador del sistema. Contacte al administrador de TI si es su primera vez usando el sistema.

---

## 4.3. Cómo Reiniciar el Sistema

Si la aplicación se congela, responde muy lentamente, o la vista del Almacén 3D deja de funcionar correctamente, siga este procedimiento de reinicio:

### ✅ Reinicio Normal

1. Haga clic en la **"X"** roja en la esquina superior derecha de la ventana de Handler TrackSamples para cerrar la aplicación.
2. Espere 5 segundos para que todos los procesos internos terminen correctamente.
3. Haga doble clic nuevamente en el ícono del escritorio para abrir la aplicación.

### Reinicio Forzado (si la aplicación no responde)

Si la ventana está completamente bloqueada y no responde al clic en la "X":
1. Presione las teclas `Ctrl + Alt + Supr` en su teclado.
2. Seleccione **"Administrador de tareas"**.
3. Busque "Handler TrackSamples" en la lista de procesos, haga clic derecho y seleccione **"Finalizar tarea"**.
4. Espere 10 segundos y vuelva a abrir la aplicación desde el escritorio.

---

## 4.4. Cómo Desinstalar el Sistema

> ⚠️ **Atención Importante:** Antes de desinstalar el sistema, asegúrese de haber realizado un backup de toda la información. Una desinstalación completa eliminará permanentemente todos los datos del inventario almacenados en el computador. Esta acción es **irreversible**.

### ✅ Paso a Paso para Desinstalar

**Opción A — Desde la Configuración de Windows:**
1. Abra el menú de **Inicio de Windows**.
2. Vaya a `Configuración (ícono de engranaje) → Aplicaciones → Aplicaciones y características`.
3. En el cuadro de búsqueda, escriba "Handler TrackSamples".
4. Haga clic sobre el resultado y luego en el botón **"Desinstalar"**.
5. Confirme la acción cuando Windows lo solicite.

**Opción B — Desde el directorio de instalación:**
1. Navegue a `C:\Program Files\Handler TrackSamples\` en el Explorador de archivos.
2. Haga doble clic en el archivo `uninstall.exe`.
3. Siga las instrucciones del asistente.

El proceso de desinstalación elimina automáticamente el programa y detiene la base de datos local. Si el asistente ofrece la opción "Eliminar todos los datos", **sólo márquela si está completamente seguro** de que no necesitará recuperar la información.
