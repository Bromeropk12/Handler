# 10. DESINSTALACIÓN DEL SISTEMA

## 10.1. Consideraciones Previas a la Desinstalación

La desinstalación de **Handler TrackSamples** implica la remoción permanente de la aplicación de escritorio, la detención y eliminación del servicio de Windows del backend, y, opcionalmente, la eliminación de la base de datos PostgreSQL. Es fundamental considerar que **toda la información almacenada en la base de datos se perderá de forma irreversible** si PostgreSQL es desinstalado sin haber realizado previamente un backup exportado.

**Lista de verificación pre-desinstalación:**

- [ ] Crear un backup manual desde el panel de administración y exportar el archivo `.json` resultante a un directorio externo al sistema.
- [ ] Exportar el historial de movimientos a CSV si se requiere auditoría posterior.
- [ ] Cerrar completamente la aplicación Handler TrackSamples (cerrar la ventana Electron).
- [ ] Confirmar con todos los usuarios activos que ninguna sesión está en curso.

## 10.2. Proceso de Desinstalación mediante `uninstall.exe`

El instalador NSIS genera automáticamente un desinstalador oficial `uninstall.exe` ubicado en el directorio raíz de instalación: `C:\Program Files\Handler TrackSamples\uninstall.exe`.

**Métodos de acceso al desinstalador:**

**Método A — Desde Aplicaciones de Windows:**
1. Abrir el menú de Inicio de Windows.
2. Ir a `Configuración → Aplicaciones → Aplicaciones y características`.
3. Buscar "Handler TrackSamples" en la lista.
4. Hacer clic en el nombre de la aplicación y seleccionar el botón "Desinstalar".
5. Confirmar la acción en el cuadro de diálogo del UAC de Windows.

**Método B — Directamente desde el directorio:**
1. Navegar a `C:\Program Files\Handler TrackSamples\` en el Explorador de archivos.
2. Ejecutar `uninstall.exe` con doble clic.
3. Confirmar elevación de privilegios (UAC).

## 10.3. Secuencia de Acciones del Desinstalador

El proceso de desinstalación ejecuta las siguientes acciones en orden:

**Paso 1 — Detención de la aplicación:**
El desinstalador verifica si el proceso `Handler TrackSamples.exe` está activo y lo cierra forzosamente si es necesario.

**Paso 2 — Detención y eliminación del servicio de Windows del backend:**
El desinstalador utiliza **NSSM** para detener y remover el servicio:

```powershell
# Detener el servicio HandlerTrackSamples
nssm stop HandlerTrackSamples

# Remover el servicio del sistema
nssm remove HandlerTrackSamples confirm
```

**Paso 3 — Eliminación de reglas del Firewall:**
El desinstalador remueve la regla de entrada creada durante la instalación:

```powershell
netsh advfirewall firewall delete rule name="HandlerTrackSamples"
```

**Paso 4 — Eliminación de archivos del sistema:**
El desinstalador borra el directorio de instalación completo, incluyendo:
- Binarios de Electron y Chromium.
- Frontend React compilado.
- Backend compilado (`backend.exe`, `nssm.exe`).
- Scripts SQL y recursos estáticos.
- Accesos directos del escritorio y el menú de Inicio.
- Entradas del registro de Windows asociadas a la aplicación.

**Paso 5 — Eliminación de datos persistentes (opcional):**
Si el usuario elige la opción "Eliminar todos los datos" en el asistente de desinstalación, se elimina el directorio `C:\ProgramData\HandlerTrackSamples\` que contiene:
- Archivo `.env` con la configuración del sistema.
- Logs del backend.
- Archivos subidos (Certificados de Análisis PDF).
- Backups exportados a archivo JSON.

> ⚠️ **Advertencia Crítica:** La eliminación del directorio `C:\ProgramData\HandlerTrackSamples\` destruye permanentemente toda la configuración, logs y archivos subidos. Realice un backup externo antes de proceder.

**Paso 6 — Desinstalación de PostgreSQL (NO automática):**
El desinstalador **no elimina PostgreSQL** automáticamente, ya que este motor puede estar siendo utilizado por otras aplicaciones en el sistema. Si se desea eliminar PostgreSQL por completo, debe hacerse manualmente:

```powershell
# Desinstalar PostgreSQL mediante winget
winget uninstall --id PostgreSQL.PostgreSQL --silent

# Alternativa: desde Panel de Control de Windows
# Programas y características → PostgreSQL 15 → Desinstalar
```

> ⚠️ **Advertencia Crítica:** La desinstalación de PostgreSQL destruye permanentemente toda la base de datos: inventario, movimientos, usuarios, proveedores, configuración de anaqueles y backups almacenados dentro de la BD. Esta acción **no tiene recuperación** si no se realizó un backup previo exportado a un archivo `.json` externo.

## 10.4. Verificación Post-Desinstalación

Tras completar el proceso, el técnico puede verificar que no quedaron componentes residuales:

```powershell
# Verificar que el servicio fue eliminado
Get-Service HandlerTrackSamples -ErrorAction SilentlyContinue
# Resultado esperado: Get-Service : Cannot find any service with service name 'HandlerTrackSamples'

# Verificar que el directorio fue eliminado
Test-Path "C:\Program Files\Handler TrackSamples"
# Resultado esperado: False

# Verificar que la regla de firewall fue eliminada
netsh advfirewall firewall show rule name="HandlerTrackSamples"
# Resultado esperado: No rules match the specified criteria.

# Verificar que el directorio de datos fue eliminado (si se eligió esa opción)
Test-Path "C:\ProgramData\HandlerTrackSamples"
# Resultado esperado: False
```

## 10.5. Reinstalación

Si se desea volver a instalar el sistema después de una desinstalación completa, el proceso es idéntico al de la primera instalación descrito en la **Sección 7**. Si PostgreSQL fue desinstalado, el instalador lo reinstalará automáticamente mediante winget. El script SQL de inicialización recreará toda la estructura de la base de datos desde cero, incluyendo los datos iniciales de líneas de mercado, proveedores y anaqueles preconfigurados.

## 10.6. Actualización del Sistema (Upgrade)

Para actualizar el sistema a una nueva versión, simplemente ejecute el nuevo instalador `Handler_TrackSamples_Setup.exe` sobre la instalación existente. El instalador:

1. Detecta la instalación previa.
2. Actualiza los archivos de la aplicación (Electron, frontend, backend).
3. **NO modifica** el directorio de datos persistentes (`C:\ProgramData\HandlerTrackSamples\`).
4. **NO modifica** los servicios de Windows (los reinicia si es necesario).
5. **NO modifica** PostgreSQL ni la base de datos.

No es necesario desinstalar la versión anterior antes de instalar una nueva.
