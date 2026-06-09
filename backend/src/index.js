/**
 * Handler TrackSamples Backend API
 * Sistema de gestión de inventario de muestras químicas
 *
 * @author Handler S.A.S.
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar .env desde las rutas de producción (ProgramData > AppData)
const programDataPath = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples');
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');

const prodEnvPath = fs.existsSync(path.join(programDataPath, '.env'))
  ? path.join(programDataPath, '.env')
  : path.join(appDataPath, 'HandlerTrackSamples', '.env');

if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
  console.log(`[INIT] Variables de entorno cargadas desde: ${prodEnvPath}`);
} else {
  // Fallback a .env local (para Desarrollo)
  require('dotenv').config();
  console.log('[INIT] Variables de entorno cargadas desde directorio local');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const config = require('./config');

// Validar variables de entorno requeridas al arrancar
config.validateEnvironment();

// Swagger/OpenAPI — carga lazy para compatibilidad con pkg/Node18
let swaggerUi = null;
let swaggerSpec = null;
try {
  swaggerUi = require('swagger-ui-express');
  swaggerSpec = require('./swagger');
} catch (err) {
  console.warn('[SWAGGER] No se pudo cargar swagger-ui-express:', err.message);
}

// Importar módulos
const authRoutes = require('./modules/auth/routes');
const samplesRoutes = require('./modules/samples/routes');
const warehouseRoutes = require('./modules/warehouse/routes');
const dispensingRoutes = require('./modules/dispensing/routes');
const dispatchRoutes = require('./modules/dispatch/routes');
const movementsRoutes = require('./modules/movements/routes');
const analyticsRoutes = require('./modules/analytics/routes');
const suppliersRoutes = require('./modules/suppliers/routes');
const alertsRoutes = require('./modules/alerts/routes');
const marketLinesRoutes = require('./modules/market-lines/routes');
const shelfSuppliersRoutes = require('./modules/shelf-suppliers/routes');
const backupRoutes = require('./modules/backup/routes');
const settingsRoutes = require('./modules/settings/routes');
const { startBackupScheduler } = require('./services/backupScheduler');
const { runAdminRecovery } = require('./services/adminRecovery');
const setupRoutes = require('./modules/setup/routes');
const sseService = require('./services/sseService');
const adminRoutes = require('./modules/admin/routes');

// Importar middlewares
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./middleware/logger');

// Configurar logger con rotación diaria de logs
const DailyRotateFile = require('winston-daily-rotate-file');
const isProd = process.env.NODE_ENV === 'production';
const baseDataDir = isProd ? path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples') : process.cwd();
const logsDir = path.join(baseDataDir, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isSetupMode = process.env.SETUP_MODE === 'true';
// HTTPS deshabilitado en LAN — los certs autofirmados bloquean los navegadores
// sin aportar seguridad real (la red es privada).
const useHttps = false;


const loggerInstance = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'handler-track-samples-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ],
});

// Crear aplicación Express
const app = express();
const PORT = config.port;

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de seguridad y configuración
app.use(helmet({
  // Si estamos en HTTP (como en Setup), enviamos maxAge: 0 para borrar el HSTS en caché del browser
  hsts: useHttps ? { maxAge: 31536000, includeSubDomains: true } : { maxAge: 0 },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' solo en styles es necesario para React/CSS-in-JS.
      // Si rompe algo en producción, mover a nonces/hashes.
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      // 'unsafe-eval' eliminado en prod: previene ejecución de eval()/new Function() vía XSS.
      // 'unsafe-inline' solo se permite en development (para HMR de webpack); en prod se omite.
      // blob: necesario para algunos modulos del frontend React (descarga de archivos, etc.)
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'", "blob:"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      scriptSrcAttr: ["'none'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  // Desactivar COOP: en HTTP LAN (ip:3001) provoca warnings y bloqueos del navegador
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Permissions-Policy: deshabilita features del navegador que la app no necesita.
// Reduce superficie de ataque si se inyecta código malicioso vía XSS.
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), usb=(), payment=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()'
  );
  next();
});


// CORS permisivo para LAN: acepta localhost, 127.0.0.1, y todas las IPs
// privadas (10.x, 172.16-31.x, 192.168.x.x) en cualquier puerto.
// Bloquea orígenes de internet público.
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      /^http:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origen bloqueado: ${origin}`);
    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());

// Servir archivos estáticos (CoA PDFs, uploads, recursos)
const recursosPath = path.resolve(__dirname, '../../recursos');

// Rutas de producción globales en ProgramData para evitar pérdida de datos en actualizaciones
const uploadsDir = path.join(baseDataDir, 'uploads');
const coaDir = path.join(uploadsDir, 'coa');
const backupsDir = path.join(baseDataDir, 'backups');

// Asegurar existencia de carpetas para evitar errores de escritura
[uploadsDir, coaDir, logsDir, backupsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[INIT] Directorio creado para datos persistentes: ${dir}`);
  }
});

console.log(`[DEBUG] Sirviendo recursos desde: ${recursosPath}`);
console.log(`[DEBUG] Directorio CoA: ${coaDir}`);

// CoA directory configurable via DB settings (panel admin) or COA_BASE_DIR env var
app.get('/uploads/coa/:filename', async (req, res, next) => {
  try {
    const { query } = require('./services/database');
    const { resolveSafeFilePath, resolveSafePath } = require('./utils/pathSecurity');
    const result = await query("SELECT value FROM settings WHERE key = 'coa_base_dir'");
    let activeCoaDir = coaDir;
    if (result.rows.length > 0) {
      try {
        activeCoaDir = resolveSafePath(result.rows[0].value);
      } catch (err) {
        console.warn(`[security] coa_base_dir en BD es inseguro: ${err.message}`);
        return res.status(403).json({ success: false, error: 'Configuración de directorio CoA inválida' });
      }
    }
    // FIX #11: defensa en profundidad — el filename no debe escapar del directorio base
    let safeFilePath;
    try {
      safeFilePath = resolveSafeFilePath(activeCoaDir, req.params.filename);
    } catch (err) {
      return res.status(403).json({ success: false, error: 'Nombre de archivo inválido' });
    }
    res.sendFile(safeFilePath, (err) => {
      if (err) next();
    });
  } catch {
    next();
  }
});
app.use('/uploads/coa', express.static(coaDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/recursos', express.static(recursosPath));

// Middleware de logging
app.use(logger(loggerInstance));

// Health check
app.get('/health', async (req, res) => {
  let dbConnected = false;
  if (process.env.SETUP_MODE !== 'true') {
    try {
      const database = require('./services/database');
      dbConnected = await database.testConnectionQuick(3000);
    } catch (_) { /* si database module falla, dbConnected=false */ }
  }
  res.status(200).json({
    status: process.env.SETUP_MODE === 'true' ? 'SETUP_REQUIRED' : 'OK',
    timestamp: new Date().toISOString(),
    service: 'Handler TrackSamples Backend',
    version: '1.0.0',
    setupMode: process.env.SETUP_MODE === 'true',
    dbConnected
  });
});

// Setup Routes — API endpoint (POST /api/setup) para el wizard React
app.use('/api/setup', setupRoutes);

// En setup mode: servir la app React (ella detecta setupMode vía /health)
// y muestra el componente SetupPage.jsx automáticamente
if (process.env.SETUP_MODE === 'true') {
  app.use('*', (req, res, next) => {
    const p = req.path;
    // Pasar directamente: API, health, y raíz (ahí se sirve la React app)
    if (p === '/' || p.startsWith('/api/') || p.startsWith('/health') || p.startsWith('/static/')) {
      return next();
    }
    // Redirigir todo lo demás a la raíz
    res.redirect('/');
  });
}

// Documentación Swagger — solo en development (expone estructura interna)
if (swaggerUi && swaggerSpec && process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Handler TrackSamples API Docs',
  }));
} else {
  app.get('/api-docs', (_req, res) => res.status(404).send('Not Found'));
}

// Rutas de la API (solo en modo normal, no durante setup inicial)
if (process.env.SETUP_MODE !== 'true') {
  app.use('/api/auth', authRoutes);
  app.use('/api/samples', samplesRoutes);
  app.use('/api/warehouse', warehouseRoutes);
  app.use('/api/dispensing', dispensingRoutes);
  app.use('/api/dispatch', dispatchRoutes);
  app.use('/api/movements', movementsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/alerts', alertsRoutes);
  app.use('/api/market-lines', marketLinesRoutes);
  app.use('/api/shelf-suppliers', shelfSuppliersRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/settings', settingsRoutes);

  // Rutas de administración interna (solo localhost)
  app.use('/api/admin', adminRoutes);

  // Canal SSE para notificaciones en tiempo real (actualizaciones, reinicios)
  app.get('/api/events', (req, res) => sseService.subscribe(req, res));

  // Iniciar heartbeat SSE (evita que los proxies/firewalls cierren conexiones inactivas)
  sseService.startHeartbeat(25000);
}

// Servir Frontend (React) en Producción
if (process.env.NODE_ENV === 'production') {
  // En el .exe compilado:
  //   process.execPath = C:\...\resources\backend\backend.exe
  //   path.dirname    = C:\...\resources\backend
  //   ../app          = C:\...\resources\app  (React build vía extraResources)
  const frontendPath = path.join(path.dirname(process.execPath), '..', 'app');
  console.log(`[DEBUG] Servidor Frontend desde: ${frontendPath}`);

  app.use(express.static(frontendPath));

  // Fallback para react-router: cualquier ruta que no sea API, cargar index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/recursos/')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler(loggerInstance));

// ─── Inicio del Servidor ──────────────────────────────────────────────────────
// Servidor HTTP simple. HTTPS deshabilitado en LAN.
// (Los certs autofirmados bloquean los navegadores sin aportar seguridad real
//  en una red privada. Para HTTPS en producción, integrar Let's Encrypt o un cert válido.)
// ─────────────────────────────────────────────────────────────────────────────
const HOST = process.env.HOST || '0.0.0.0';

const http = require('http');
const server = http.createServer(app);


server.listen(PORT, HOST, async () => {
  loggerInstance.info(`Handler TrackSamples Backend corriendo en http://${HOST}:${PORT}`);
  loggerInstance.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  loggerInstance.info(`CORS: Aceptando localhost y IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)`);

  // Iniciar recovery de admin y backups automáticos solo si el sistema ya está configurado
  if (process.env.SETUP_MODE !== 'true') {
    try {
      const { runMigrationsSilent } = require('./services/migrationRunner');
      await runMigrationsSilent();
    } catch (migErr) {
      loggerInstance.error(`❌ [BOOT] Error al ejecutar migraciones automáticas: ${migErr.message}`);
    }

    await runAdminRecovery();
    startBackupScheduler();
  } else {
    loggerInstance.info('⚠️ [SETUP] Servidor iniciado en Modo Setup. Pendiente configuración inicial de BD.');
  }
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  loggerInstance.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  loggerInstance.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;