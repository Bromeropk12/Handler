# 4. INSTALACIÓN, EJECUCIÓN, REINICIO Y DESINSTALACIÓN

## 4.1. Instalación del Sistema

Handler TrackSamples se instala con un único archivo ejecutable. El instalador gestiona **todo automáticamente**: instala la base de datos PostgreSQL, configura el servicio del backend, abre los puertos necesarios en el Firewall de Windows, y prepara la aplicación para su uso inmediato.

> ⚠️ **Atención:** Asegúrese de tener privilegios de Administrador en su computador Windows antes de iniciar la instalación. El instalador los necesita para instalar servicios y configurar el firewall.

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
Durante este paso, el instalador realiza de forma automática y transparente varias acciones en segundo plano, **sin necesidad de que usted haga nada**:

1. **Instala PostgreSQL 15** (si no está instalado en su computador) mediante el gestor de paquetes de Windows (winget).
2. **Configura el servicio del backend** como un servicio de Windows que se inicia automáticamente con el equipo.
3. **Abre el puerto 3001** en el Firewall de Windows para permitir el acceso desde otros equipos de la red local.
4. **Inicia el servicio** automáticamente.

Este proceso puede tardar entre **3 y 8 minutos** dependiendo de la velocidad de su computador y de su conexión a internet (si necesita descargar PostgreSQL).

**Paso 5 — Finalizar:**
Cuando aparezca la pantalla de "Instalación completada", el sistema está listo para usarse. Puede hacer clic en "Finalizar". Si la casilla **"Iniciar Handler TrackSamples ahora"** está marcada, la aplicación se abrirá automáticamente.

### Configuración Inicial (Primer Arranque)

La primera vez que abra el sistema después de instalarlo, verá un **Asistente de Configuración Inicial** en su navegador web. Este asistente le guiará para:

1. **Configurar la conexión a la base de datos** (generalmente solo necesita hacer clic en "Siguiente" aceptando los valores por defecto).
2. **Crear su cuenta de administrador** (elija un nombre de usuario y una contraseña segura).
3. **Finalizar la configuración** — el sistema preparará automáticamente la base de datos con los datos iniciales.

> 📌 **Nota:** Este asistente solo aparece la primera vez. Una vez completado, el sistema arrancará directamente en la pantalla de inicio de sesión.

---

## 4.2. Cómo Abrir (Ejecutar) el Sistema

Una vez instalado y configurado, para abrir la aplicación en cualquier momento:

1. Busque el ícono de **"Handler TrackSamples"** en su escritorio de Windows.
2. Haga **doble clic** sobre él.
3. La ventana principal de la aplicación se abrirá mostrando la pantalla de inicio de sesión.

> 📌 **Nota:** Los servicios necesarios (base de datos y backend) se inician automáticamente con Windows. No necesita verificar nada manualmente.

**Credenciales de acceso inicial:**
- Las credenciales de usuario (nombre de usuario y contraseña) son las que usted configuró durante el asistente de configuración inicial.
- Si su cuenta fue creada por el Administrador del sistema, contacte a él para obtener sus credenciales.

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

El proceso de desinstalación elimina automáticamente el programa, detiene y remueve el servicio del backend, y elimina las reglas del Firewall. Si el asistente ofrece la opción **"Eliminar todos los datos"**, **sólo márquela si está completamente seguro** de que no necesitará recuperar la información.

> 📌 **Nota sobre PostgreSQL:** El desinstalador **no elimina PostgreSQL** automáticamente, ya que puede estar siendo usado por otras aplicaciones. Si desea eliminar PostgreSQL, debe hacerlo manualmente desde "Programas y características" en el Panel de Control de Windows.
