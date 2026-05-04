# 10. DESINSTALACIÓN DEL SISTEMA

## 10.1. Consideraciones Previas a la Desinstalación

La desinstalación de **Handler TrackSamples** implica la remoción permanente de la aplicación de escritorio, la detención y eliminación del contenedor de base de datos PostgreSQL local (Docker) y, opcionalmente, la eliminación del volumen de datos persistente. Es fundamental considerar que **toda la información almacenada en la base de datos se perderá de forma irreversible** si el volumen de Docker es eliminado sin haber realizado previamente un backup exportado.

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

**Paso 2 — Detención y eliminación del contenedor Docker:**
El desinstalador ejecuta internamente los siguientes comandos de Docker para limpiar la infraestructura de base de datos local:
```powershell
# Detener el contenedor de PostgreSQL
docker stop handler-track-samples-db

# Eliminar el contenedor
docker rm handler-track-samples-db
```

**Paso 3 — Eliminación del volumen de datos (opcional):**
Si el usuario elige la opción "Eliminar todos los datos" en el asistente de desinstalación:
```powershell
# Eliminar el volumen de datos persistente (IRREVERSIBLE)
docker volume rm postgres_data
```
> ⚠️ **Advertencia Crítica:** La eliminación del volumen `postgres_data` destruye permanentemente toda la información de la base de datos local: inventario, movimientos, usuarios, proveedores, configuración de anaqueles y backups almacenados en la BD. Esta acción **no tiene recuperación** si no se realizó un backup previo.

**Paso 4 — Eliminación de archivos del sistema:**
El desinstalador borra el directorio de instalación completo, incluyendo:
- Binarios de Electron y Chromium.
- Frontend React compilado.
- Módulos del backend Node.js.
- Scripts SQL y recursos estáticos.
- Accesos directos del escritorio y el menú de Inicio.
- Entradas del registro de Windows asociadas a la aplicación.

**Paso 5 — Limpieza de reglas del Firewall (si aplica):**
Si el instalador original configuró reglas de entrada en el Firewall de Windows para los puertos `3000` y `3001`, el desinstalador las elimina.

## 10.4. Verificación Post-Desinstalación

Tras completar el proceso, el técnico puede verificar que no quedaron componentes residuales:

```powershell
# Verificar que el contenedor fue eliminado
docker ps -a | Select-String "handler"
# Resultado esperado: sin resultados

# Verificar que el directorio fue eliminado
Test-Path "C:\Program Files\Handler TrackSamples"
# Resultado esperado: False

# Verificar que el volumen fue eliminado (si se eligió esa opción)
docker volume ls | Select-String "postgres_data"
# Resultado esperado: sin resultados
```

## 10.5. Reinstalación

Si se desea volver a instalar el sistema después de una desinstalación completa, el proceso es idéntico al de la primera instalación descrito en la **Sección 7**. El script SQL de inicialización recreará toda la estructura de la base de datos desde cero, incluyendo los datos iniciales de líneas de mercado, proveedores y anaqueles preconfigurados.
