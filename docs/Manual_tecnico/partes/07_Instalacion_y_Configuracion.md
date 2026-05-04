# 7. INSTALACIÓN, CONFIGURACIÓN Y EJECUCIÓN

## 7.1. Prerrequisitos Obligatorios

Antes de iniciar el proceso de instalación, el técnico responsable debe verificar que la estación de trabajo cumple con los siguientes prerrequisitos. El incumplimiento de cualquiera de ellos impedirá la correcta inicialización del sistema.

**Lista de verificación previa a la instalación:**

- [ ] Sistema operativo: Windows 10 (Build 19041+) o Windows 11 — 64-bit.
- [ ] Docker Desktop instalado (versión 4.0 o superior) y en estado de ejecución activo.
- [ ] WSL2 habilitado en Windows (verificar en: Panel de control → Programas → Activar o desactivar características de Windows → Subsistema de Windows para Linux).
- [ ] Puertos `3000`, `3001` y `5432` libres (sin conflictos con otros servicios).
- [ ] Al menos 10 GB de espacio libre en disco SSD.
- [ ] El usuario de Windows tiene privilegios de Administrador local.

### Verificación del Estado de Docker Desktop

Antes de ejecutar el instalador, confirmar que el icono de Docker Desktop (ballena blanca) aparece en la bandeja del sistema de Windows con estado "Running". Si no está activo, iniciarlo manualmente:

```
Menú Inicio de Windows → Buscar "Docker Desktop" → Abrir → 
Esperar hasta que el icono deje de animar y muestre "Docker is running"
```

## 7.2. Proceso de Instalación del Ejecutable `.exe`

El sistema se distribuye como un único archivo instalador de Windows denominado `Handler_TrackSamples_Setup.exe`, generado mediante el compilador **electron-builder** con el instalador **NSIS** configurado con los siguientes parámetros:

```json
{
  "appId": "com.handler.tracksamples",
  "productName": "Handler TrackSamples",
  "copyright": "Copyright © 2026 Handler Colombia",
  "win": { "target": "nsis", "arch": ["x64"] },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Handler TrackSamples"
  }
}
```

**Procedimiento paso a paso:**

**Paso 1 — Ejecutar el instalador:**
Hacer doble clic sobre `Handler_TrackSamples_Setup.exe`. El sistema operativo Windows solicitará elevación de privilegios mediante el control de cuentas de usuario (UAC). Hacer clic en "Sí" para conceder permisos de Administrador.

**Paso 2 — Asistente de instalación:**
El asistente NSIS presentará las siguientes pantallas secuenciales:
- Pantalla de bienvenida y licencia de uso.
- Selección del directorio de instalación (por defecto: `C:\Program Files\Handler TrackSamples\`).
- Confirmación de creación de acceso directo en el escritorio y en el menú de Inicio.

**Paso 3 — Extracción y despliegue de archivos:**
El instalador extrae todos los binarios de la aplicación Electron, los archivos estáticos del frontend React compilado (`build/`), los scripts SQL de inicialización de la base de datos, y los recursos multimedia (logos de proveedores en `recursos/proveedores/`).

**Paso 4 — Aprovisionamiento automático de la Base de Datos:**
Durante la fase de instalación, el setup ejecuta de forma transparente los comandos Docker necesarios para:
1. Descargar la imagen `postgres:15-alpine` (si no está disponible localmente).
2. Crear el contenedor `handler-track-samples-db` con el volumen persistente `postgres_data`.
3. Ejecutar el script SQL de inicialización completo (`schema-completo-produccion.sql`) que crea todas las tablas, tipos ENUM, vistas, triggers, índices y el usuario administrador por defecto.
4. Habilitar las políticas de Row Level Security (RLS) en las 8 tablas.

**Paso 5 — Configuración de variables de entorno:**
El instalador genera automáticamente el archivo `.env` en el directorio de instalación con los valores correctos para el entorno local, incluyendo la cadena de conexión a PostgreSQL en `localhost:5432`.

**Paso 6 — Finalización:**
Al completarse, el asistente muestra la pantalla de éxito. El acceso directo "Handler TrackSamples" es creado en el escritorio y en el Menú de Inicio de Windows. Opcionalmente, el usuario puede ejecutar la aplicación de inmediato marcando la casilla "Iniciar Handler TrackSamples ahora".

## 7.3. Estructura de Directorios Post-Instalación

Tras la instalación, el directorio raíz del sistema tiene la siguiente estructura:

```
C:\Program Files\Handler TrackSamples\
├── Handler TrackSamples.exe          ← Ejecutable principal (Electron)
├── resources\
│   ├── app\
│   │   ├── build\                    ← Frontend React compilado (HTML/CSS/JS)
│   │   ├── backend\                  ← API Node.js/Express
│   │   │   ├── src\
│   │   │   │   ├── modules\          ← 12 módulos de la API
│   │   │   │   ├── services\         ← database.js, backupScheduler.js
│   │   │   │   └── index.js          ← Punto de entrada del servidor
│   │   │   └── .env                  ← Variables de entorno locales
│   │   ├── database\
│   │   │   └── scripts\              ← schema-completo-produccion.sql
│   │   └── recursos\
│   │       └── proveedores\          ← Logos de los 7 proveedores preconfigurados
│   └── electron.js                   ← Proceso principal de Electron
├── backups\                           ← [Creada automáticamente] Carpeta interna de backups
└── uninstall.exe                      ← Desinstalador oficial del sistema
```

> **Nota Técnica:** La carpeta `backups\` es creada automáticamente por el sistema la primera vez que se ejecuta un backup. Los archivos `.json` de respaldo se almacenan en esta ubicación interna, completamente local a la instalación del software, sin requerir transmisión a servicios externos.

## 7.4. Verificación Post-Instalación

Tras la instalación, el técnico debe verificar que todos los componentes están operativos:

**1. Verificar el contenedor de base de datos:**
```powershell
# En PowerShell con Docker Desktop activo:
docker ps

# Resultado esperado:
# CONTAINER ID   IMAGE                PORTS                    NAMES
# xxxxxxxxxxxx   postgres:15-alpine   0.0.0.0:5432->5432/tcp   handler-track-samples-db
```

**2. Verificar el health check de la API:**
Abrir un navegador web y navegar a:
```
http://localhost:3001/health
```
Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2026-05-04T...",
  "service": "Handler TrackSamples Backend",
  "version": "1.0.0"
}
```

**3. Verificar la interfaz de usuario:**
Navegar a `http://localhost:3000` o abrir la aplicación desde el acceso directo del escritorio. Debe aparecer la pantalla de inicio de sesión.

**Credenciales de primer acceso (cambiar inmediatamente en producción):**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 7.5. Ejecución Cotidiana del Sistema

Una vez instalado, el sistema se inicia con un doble clic en el acceso directo "Handler TrackSamples" del escritorio. Electron levanta internamente el proceso Node.js del backend y renderiza la interfaz React en la ventana Chromium. No se requiere ninguna acción adicional del usuario.

> **Prerequisito cotidiano:** Docker Desktop debe estar activo antes de abrir la aplicación. Si Docker no está corriendo, la aplicación mostrará errores de conexión a la base de datos en la pantalla de login. El icono de Docker (ballena) debe aparecer en la bandeja del sistema antes de iniciar Handler TrackSamples.
