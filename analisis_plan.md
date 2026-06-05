# Plan de Implementación: Transición a Servidor LAN Headless (Windows Service)

Este plan detalla los pasos para transformar **Handler TrackSamples** de una aplicación de escritorio monopuesto a un **servidor LAN headless robusto que corre como un servicio de Windows**, accesible por cualquier dispositivo de la red local.

---

## 1. Parches de Seguridad y Ajustes Críticos (Fase 1)

### Mitigación de SQL Injection en el Instalador
En `frontend/public/electron.js`, sanitizaremos el nombre de la base de datos ingresado por el usuario y parametrizaremos la consulta con `pg` para evitar cualquier inyección de código SQL malicioso.

#### Archivo: [electron.js](file:///c:/Users/Briann/Downloads/Handler/frontend/public/electron.js#L168)
* **Validación**: Se agregará una expresión regular que limite el nombre a caracteres alfanuméricos y guiones bajos: `/^[a-zA-Z0-9_]+$/`.
* **Consulta parametrizada**: Se cambiará la verificación a:
  ```javascript
  const res = await client.query('SELECT datname FROM pg_catalog.pg_database WHERE datname = $1', [dbName]);
  ```

### Activación de ASAR en el empaquetado de Electron
Para proteger el código fuente del frontend, habilitaremos `asar` en la configuración de `electron-builder` en `frontend/package.json`. Como `process.resourcesPath` apunta a una ruta física externa al archivo ASAR comprimido, la resolución del backend externo no se verá afectada.

#### Archivo: [package.json](file:///c:/Users/Briann/Downloads/Handler/frontend/package.json#L27)
* Cambiar `"asar": false` a `"asar": true`.

### Limpieza de extraResources
Retiraremos el código fuente de desarrollo del backend de la distribución comercial. Ya no empaquetaremos `backend/src` en el instalador, ya que `pkg` genera un ejecutable `.exe` cerrado y compilado con todo el código fuente adentro.

#### Archivo: [package.json](file:///c:/Users/Briann/Downloads/Handler/frontend/package.json#L45-L48)
* Eliminar el bloque que copia `../backend/src` hacia `backend/src`.

---

## 2. Configuración Relativa del Frontend y Desbloqueo LAN (Fase 2)

Para permitir que cualquier PC de la red acceda al servidor sin intentar conectarse a su propio `localhost`, migraremos las URLs absolutas a direccionamiento relativo y simplificaremos las políticas de seguridad (CSPs) basándonos en el mismo origen.

### Direccionamiento Relativo de la API en el Frontend
* **Archivo de Entorno**: En [frontend/.env.production](file:///c:/Users/Briann/Downloads/Handler/frontend/.env.production#L5), configuraremos `REACT_APP_API_URL=/api` en lugar de la URL absoluta con localhost.
* **Axios Base URL**: En [frontend/src/services/api.js](file:///c:/Users/Briann/Downloads/Handler/frontend/src/services/api.js#L5), aseguramos que use el valor del entorno: `baseURL: process.env.REACT_APP_API_URL || '/api'`.
* **Módulos de Frontend (Dispatch, Dispensing, Samples)**:
  Modificaremos las páginas para que cuando `REACT_APP_API_URL` sea relativo (p. ej., `/api`), `API_BASE` se resuelva dinámicamente usando `window.location.origin` o un string vacío `""` en lugar de forzar `http://localhost:3001`.

### Ajuste de la CSP de Helmet en el Backend (Solución de Mismo Origen)
Dado que el servidor sirve tanto la API `/api` como el React build estático bajo el **mismo origen** (ej. `http://192.168.1.50:3001`), la política `'self'` cubre de forma nativa e impecable el acceso de red local sin importar qué IP tenga el servidor, eliminando wildcards inválidos en la especificación CSP.

#### Archivo: [backend/src/index.js](file:///c:/Users/Briann/Downloads/Handler/backend/src/index.js#L90-L101)
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"], // 'self' permite la API, uploads y recursos desde cualquier IP en el mismo puerto
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

---

## 3. Nueva Estrategia de Persistencia de Datos (Fase 3)

Centralizaremos la persistencia de todos los datos mutables del sistema en **`C:\ProgramData\HandlerTrackSamples`** (`process.env.ALLUSERSPROFILE`). Esto garantiza que los CoA PDFs, backups, logs y configuración `.env` sobrevivan a las actualizaciones y sean legibles por el servicio headless de Windows.

### Configuración del Backend en Producción
Modificaremos la resolución de directorios del backend para apuntar de forma persistente a la carpeta global de datos en producción.

#### Archivo: [index.js](file:///c:/Users/Briann/Downloads/Handler/backend/src/index.js)
* **Variables de entorno**: Cargar `.env` desde `C:\ProgramData\HandlerTrackSamples\.env`.
* **Directorios Estáticos de Uploads**:
  ```javascript
  const programDataPath = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples');
  const uploadsPath = path.join(programDataPath, 'uploads');
  const coaPath = path.join(uploadsPath, 'coa');
  const backupsPath = path.join(programDataPath, 'backups');
  const logsPath = path.join(programDataPath, 'logs');
  ```
* **Servir archivos de React**: Express servirá la SPA de React directamente desde la carpeta `build/` compilada.

---

## 4. Servidor como Windows Service con NSSM e Instalador Elevado (Fase 4)

### Permisos de Administración en el Instalador (NSIS)
Para poder instalar el servicio de Windows (`NSSM`) y abrir el firewall (`netsh`), el instalador **necesita privilegios elevados de administrador** y aplicarse a nivel de máquina.

#### Archivo: [frontend/package.json](file:///c:/Users/Briann/Downloads/Handler/frontend/package.json#L68-L77)
Modificaremos el bloque `"nsis"` en `package.json` para requerir elevación de privilegios:
```json
"nsis": {
  "oneClick": false,
  "perMachine": true,
  "allowElevation": true,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "Handler TrackSamples"
}
```

### Scripts de Registro y Configuración del Servicio (NSSM)
Empaquetaremos la versión ligera de **NSSM** en el instalador y lo configuraremos con privilegios y entorno de producción:
```nsis
ExecWait '"$INSTDIR\resources\backend\nssm.exe" install HandlerTrackSamples "$INSTDIR\resources\backend\backend.exe"'
ExecWait '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples AppDirectory "$INSTDIR\resources\backend"'
ExecWait '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples AppEnvironmentExtra "NODE_ENV=production" "PORT=3001"'
ExecWait '"$INSTDIR\resources\backend\nssm.exe" set HandlerTrackSamples Start SERVICE_AUTO_START'
ExecWait '"$INSTDIR\resources\backend\nssm.exe" start HandlerTrackSamples'
```
*Las credenciales confidenciales de la base de datos y la clave JWT se seguirán leyendo de forma segura desde `C:\ProgramData\HandlerTrackSamples\.env` en el arranque del ejecutable.*

### Desinstalación Limpia (NSIS Section "Uninstall")
Detendremos y removeremos el servicio de Windows de forma ordenada al desinstalar, evitando que queden servicios huérfanos que bloqueen puertos o futuras reinstalaciones.
```nsis
Section "Uninstall"
  ExecWait '"$INSTDIR\resources\backend\nssm.exe" stop HandlerTrackSamples'
  ExecWait '"$INSTDIR\resources\backend\nssm.exe" remove HandlerTrackSamples confirm'
  ExecWait 'netsh advfirewall firewall delete rule name="HandlerTrackSamples"'
  
  ; A continuación borrar archivos y carpetas del directorio de instalación
SectionEnd
```

---

## 5. Configuración Automática del Firewall e IP LAN (Fase 5)

### Apertura del Puerto en el Instalador
El instalador NSIS registrará de forma automática una regla de entrada en el Firewall de Windows:
```nsis
ExecWait 'netsh advfirewall firewall add rule name="HandlerTrackSamples" dir=in action=allow protocol=TCP localport=3001 profile=private,public'
```

### Mostrar IP de Red Local en el Panel Administrativo
En el panel del administrador, consultaremos las interfaces de red de la máquina servidor usando el módulo `os` de Node.js y filtraremos las IPs privadas IPv4 (`192.168.x.x`, `10.x.x.x`, etc.) para renderizar un mensaje claro: **"Comparte esta URL con los usuarios de tu red: http://<IP_LOCAL>:3001"**.

---

## 6. Rotación de Logs en la Carpeta Global (Fase 6)

Migraremos el middleware de log actual de Winston para usar `winston-daily-rotate-file`, escribiendo en `C:\ProgramData\HandlerTrackSamples\logs\` con una retención máxima de 14 días con compresión zip.

---

## 7. Scripts de Compilación con `@yao-pkg/pkg` (Fase 7)

1. Reemplazaremos `pkg` por `@yao-pkg/pkg` (compatibilidad con Node 18+).
2. **Módulos JS Puros**: Como hemos verificado que tanto `pg` (cliente Postgres) como `bcryptjs` corren sobre JS puro (sin bindings nativos de C++), la compilación del `.exe` es limpia y sumamente portable.

---

## 8. Panel de Administración de Electron Re-definido (Fase 8)

La interfaz de Electron se convertirá en un **Panel de Control de IT y Administración** que permitirá:
* Ver el estado del servicio de Windows (`Corriendo` / `Detenido`).
* Ver la dirección IP y el puerto de red para compartir con los usuarios.
* Botones para `Iniciar`, `Detener` y `Reiniciar` el servicio.
* Visor de logs en tiempo real leyendo desde `C:\ProgramData\HandlerTrackSamples\logs\`.
* Acceso rápido en el explorador a la carpeta global de respaldos (`backups/`).

---

## Plan de Verificación

### Pruebas Automatizadas
1. Validar que la consulta de base de datos en `electron.js` rechace caracteres especiales con la expresión regular.
2. Ejecutar la compilación del backend mediante `@yao-pkg/pkg` y probar que el binario `backend.exe` inicie adecuadamente y detecte las variables de entorno de `C:\ProgramData`.

### Pruebas Manuales
1. Instalar la aplicación en una máquina de prueba de Windows, verificar que la carpeta `C:\ProgramData\HandlerTrackSamples` se genere con las subcarpetas correctas.
2. Comprobar que el servicio de Windows "HandlerTrackSamples" se registre y arranque automáticamente al encender la PC.
3. Conectarse al servidor desde otro dispositivo móvil o laptop en la misma red local a través del puerto `3001` y validar que el frontend cargue y funcione fluidamente.
