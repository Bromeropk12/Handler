# 7. INSTALACIÓN, CONFIGURACIÓN Y EJECUCIÓN

## 7.1. Prerrequisitos Obligatorios

Antes de iniciar el proceso de instalación, el técnico responsable debe verificar que la estación de trabajo cumple con los siguientes prerrequisitos:

**Lista de verificación previa a la instalación:**

- [ ] Sistema operativo: Windows 10 (Build 19041+) o Windows 11 — 64-bit.
- [ ] Puertos `3001` y `5432` libres (sin conflictos con otros servicios).
- [ ] Al menos 10 GB de espacio libre en disco (SSD recomendado).
- [ ] El usuario de Windows tiene privilegios de Administrador local (requerido para instalar servicios).
- [ ] Conexión a internet disponible para la descarga de PostgreSQL vía winget (solo si no está preinstalado).
- [ ] *No requiere* Docker Desktop, WSL2, ni ningún software de virtualización.

> **Nota Técnica:** El instalador es autocontenido. Cualquier dependencia faltante (PostgreSQL) es detectada y gestionada automáticamente durante la instalación.

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
El instalador extrae todos los binarios de la aplicación Electron, el frontend React compilado (`resources/app/`), el backend compilado (`resources/backend/backend.exe`), el gestor de servicios NSSM (`resources/backend/nssm.exe`), los scripts SQL de inicialización de la base de datos, y los recursos multimedia (logos de proveedores en `recursos/proveedores/`).

**Paso 4 — Aprovisionamiento automático de PostgreSQL:**
Durante la fase de instalación, el instalador ejecuta de forma transparente las siguientes acciones:

1. **Detección:** Verifica si PostgreSQL está instalado mediante `Get-Service postgresql*`.
2. **Instalación** (si no está presente): Ejecuta `winget install --id PostgreSQL.PostgreSQL` con los parámetros:
   - Puerto: `5432`
   - Contraseña del superusuario `postgres`: `!Handler2026`
   - Instalación silenciosa (sin intervención del usuario)
3. **Espera de servicio:** Espera hasta 90 segundos a que el servicio `postgresql-x64-15` entre en estado "Running".
4. Si PostgreSQL ya está instalado, omite este paso completamente.

**Paso 5 — Configuración del Servicio de Windows para el Backend:**
El instalador utiliza **NSSM** (Non-Sucking Service Manager) para crear un servicio de Windows:

```powershell
# Instalar el servicio HandlerTrackSamples
nssm install HandlerTrackSamples "$INSTDIR\resources\backend\backend.exe"

# Configurar directorio de trabajo
nssm set HandlerTrackSamples AppDirectory "$INSTDIR\resources\backend"

# Configurar variables de entorno
nssm set HandlerTrackSamples AppEnvironmentExtra "NODE_ENV=production" "PORT=3001"

# Configurar inicio automático con Windows
nssm set HandlerTrackSamples Start SERVICE_AUTO_START

# Iniciar el servicio
nssm start HandlerTrackSamples
```

**Paso 6 — Configuración del Firewall de Windows:**
El instalador crea una regla de entrada en el Firewall de Windows para permitir el acceso al puerto `3001`:

```powershell
netsh advfirewall firewall add rule name="HandlerTrackSamples" `
  dir=in action=allow protocol=TCP localport=3001 profile=private,public
```

**Paso 7 — Finalización:**
Al completarse, el asistente muestra la pantalla de éxito. El acceso directo "Handler TrackSamples" es creado en el escritorio y en el Menú de Inicio de Windows. Opcionalmente, el usuario puede ejecutar la aplicación de inmediato marcando la casilla "Iniciar Handler TrackSamples ahora".

## 7.3. Configuración de Variables de Entorno

El archivo de configuración `.env` se almacena en `C:\ProgramData\HandlerTrackSamples\.env` y es generado automáticamente por el **Asistente de Configuración Inicial** (Setup Web Wizard) que se ejecuta en el primer arranque.

### 7.3.1. Setup Web Wizard (Primer Arranque)

Cuando el sistema se inicia por primera vez y no encuentra un `.env` configurado, el backend entra en **SETUP_MODE** y redirige automáticamente al usuario a un asistente web en `http://localhost:3001/setup`.

**Pantallas del asistente:**

1. **Conexión a Base de Datos:** El usuario ingresa:
   - Host (por defecto: `localhost`)
   - Puerto (por defecto: `5432`)
   - Usuario de PostgreSQL
   - Contraseña de PostgreSQL
   - Nombre de base de datos (por defecto: `handler_track_samples`)

2. **Verificación de Conexión:** El sistema prueba la conexión y, si es exitosa, crea la base de datos si no existe.

3. **Configuración de Administrador:** El usuario establece:
   - Nombre de usuario para el admin
   - Contraseña para el admin (debe cumplir requisitos de seguridad)
   - Contraseña secreta de recuperación

4. **Generación de JWT_SECRET:** El sistema genera un secreto criptográficamente aleatorio de 64 caracteres.

5. **Finalización:** El asistente:
   - Escribe el archivo `.env` en `C:\ProgramData\HandlerTrackSamples\.env`
   - Ejecuta todas las migraciones SQL (`migration-001-init.sql`, `migration-002-enable-rls.sql`, `migration-003-add-batch-id-to-movements.sql`)
   - Crea las tablas auxiliares (`backups`, `settings`)
   - Crea el usuario administrador con contraseñas hasheadas (BCrypt 12 rondas)
   - Inserta datos iniciales: 3 líneas de mercado, 7 proveedores, 14 anaqueles
   - Reinicia automáticamente el servicio HandlerTrackSamples

### 7.3.2. Configuración Manual del `.env`

Si se requiere configurar manualmente, el archivo `.env` debe tener el siguiente contenido mínimo:

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
JWT_SECRET=<clave_aleatoria_de_64_caracteres>
DATABASE_URL=postgresql://handler_user:handler_password@localhost:5432/handler_track_samples
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=5000
COA_BASE_DIR=C:\ProgramData\HandlerTrackSamples\uploads\coa
MAX_FILE_SIZE=10485760
```

## 7.4. Estructura de Directorios Post-Instalación

### Directorio de Instalación de la Aplicación

```
C:\Program Files\Handler TrackSamples\
├── Handler TrackSamples.exe          ← Ejecutable principal (Electron)
├── uninstall.exe                     ← Desinstalador oficial del sistema
├── resources\
│   ├── app\                          ← Frontend React compilado (HTML/CSS/JS)
│   │   ├── index.html                ← Punto de entrada SPA
│   │   ├── static\                   ← Assets compilados (JS, CSS)
│   │   ├── electron.js               ← Proceso principal de Electron
│   │   ├── preload.js                ← Bridge de seguridad (contextBridge)
│   │   ├── admin_panel.html          ← Panel de control admin (standalone)
│   │   ├── installer.nsh             ← Script NSIS custom (solo build)
│   │   └── recursos\                 ← Imágenes, iconos
│   └── backend\                      ← Backend compilado
│       ├── backend.exe               ← Express API compilada (pkg)
│       ├── create_tables.exe         ← Utilidad de creación de tablas
│       └── nssm.exe                  ← Non-Sucking Service Manager
```

### Directorio de Datos Persistentes

```
C:\ProgramData\HandlerTrackSamples\   ← Datos persistentes (NO se pierden al actualizar)
├── .env                              ← Variables de entorno del sistema
├── logs\                             ← Logs del backend con rotación diaria
│   ├── combined-YYYY-MM-DD.log       ← Log general
│   ├── error.log                     ← Solo errores
│   └── database.log                  ← Consultas a la base de datos
├── uploads\                          ← Archivos subidos por el usuario
│   ├── coa\                          ← PDFs de Certificados de Análisis
│   └── ...                           ← Otros archivos subidos
└── backups\                          ← Backups exportados a archivo JSON
    └── backup_handler_*.json
```

> **Nota Técnica:** El directorio `C:\ProgramData\HandlerTrackSamples\` se utiliza para datos persistentes porque no se elimina durante las actualizaciones del software. Esto garantiza que los logs, uploads y backups sobrevivan a reinstalaciones.

## 7.5. Verificación Post-Instalación

Tras la instalación, el técnico debe verificar que todos los componentes están operativos:

**1. Verificar el servicio de la base de datos PostgreSQL:**
```powershell
Get-Service postgresql* | Format-List Name, Status, StartType
# Resultado esperado:
# Name      : postgresql-x64-15
# Status    : Running
# StartType : Automatic
```

**2. Verificar el servicio de la aplicación:**
```powershell
Get-Service HandlerTrackSamples | Format-List Name, Status, StartType
# Resultado esperado:
# Name      : HandlerTrackSamples
# Status    : Running
# StartType : Automatic
```

**3. Verificar el health check de la API:**
```powershell
# Con PowerShell (Invoke-WebRequest)
Invoke-RestMethod -Uri http://localhost:3001/health
# Resultado esperado:
# status    : OK
# timestamp : 2026-06-07T...
# service   : Handler TrackSamples Backend
# version   : 1.0.0
```

**4. Verificar la interfaz de usuario:**
Abrir la aplicación desde el acceso directo del escritorio o navegar a `http://localhost:3001`. Debe aparecer la pantalla de inicio de sesión (si el setup wizard ya fue completado) o el asistente de configuración inicial (si es el primer arranque).

**Credenciales de primer acceso (configuradas durante el setup wizard):**
- Las credenciales son las que fueron establecidas durante el asistente de configuración inicial.
- Por defecto, si no se ejecutó el setup wizard, el usuario es `admin` y la contraseña se configura en el primer arranque.

## 7.6. Ejecución Cotidiana del Sistema

Una vez instalado y configurado, el sistema funciona de la siguiente manera:

1. **Servicios de fondo:** Al encender el computador, los servicios `postgresql-x64-15` y `HandlerTrackSamples` se inician automáticamente con Windows (configurados como `SERVICE_AUTO_START`).
2. **Inicio de la aplicación:** El usuario hace doble clic en el acceso directo "Handler TrackSamples" del escritorio. Electron se conecta al backend en `localhost:3001` y renderiza la interfaz React.
3. **Cierre de la aplicación:** Al cerrar la ventana de Electron, solo se cierra la interfaz de usuario. Los servicios de fondo continúan ejecutándose, permitiendo un inicio más rápido la próxima vez.

> **Nota Técnica:** A diferencia de las versiones anteriores basadas en Docker, el sistema actual no requiere ningún paso de verificación manual antes de iniciar la aplicación. Los servicios se inician automáticamente con Windows y están listos para usar.

## 7.7. Gestión de Servicios (IT)

El personal de TI puede gestionar los servicios del sistema mediante los siguientes comandos:

### Servicio HandlerTrackSamples (Backend API)

```powershell
# Verificar estado
nssm status HandlerTrackSamples

# Verificar estado (alternativa PowerShell)
Get-Service HandlerTrackSamples

# Reiniciar el servicio
nssm restart HandlerTrackSamples
# o
Restart-Service HandlerTrackSamples

# Detener el servicio
nssm stop HandlerTrackSamples

# Iniciar el servicio
nssm start HandlerTrackSamples

# Ver logs del servicio en tiempo real
Get-Content "C:\ProgramData\HandlerTrackSamples\logs\combined-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 50 -Wait
```

### Servicio PostgreSQL

```powershell
# Verificar estado
Get-Service postgresql*

# Reiniciar PostgreSQL
Restart-Service postgresql-x64-15

# Verificar puerto de escucha
netstat -ano | Select-String ":5432"
```
