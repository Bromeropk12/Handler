/**
 * Handler TrackSamples Backend API
 * Sistema de gestión de inventario de muestras químicas
 *
 * @author Handler S.A.S.
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar .env desde el directorio de datos de la aplicación en AppData (para Producción)
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const prodEnvPath = path.join(appDataPath, 'HandlerTrackSamples', '.env');

if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
  console.log(`[INIT] Variables de entorno cargadas desde AppData: ${prodEnvPath}`);
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

// Swagger/OpenAPI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

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

// Importar middlewares
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./middleware/logger');

// Configurar logger
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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3001", "http://127.0.0.1:3001"],
      connectSrc: ["'self'", "http://localhost:3001", "http://127.0.0.1:3001"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS: Permitir localhost y IPs locales
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Dominios adicionales desde variable de entorno
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()));
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    const isPrivateIP = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);

    if (isLocalhost || isPrivateIP || allowedOrigins.includes(origin)) {
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
const path = require('path');
const recursosPath = path.resolve(__dirname, '../../recursos');
console.log(`[DEBUG] Sirviendo recursos desde: ${recursosPath}`);
console.log(`[DEBUG] Directorio CoA: ${path.resolve(config.coa.baseDir)}`);

// CoA directory configurable via DB settings (panel admin) or COA_BASE_DIR env var
app.get('/uploads/coa/:filename', async (req, res, next) => {
  try {
    const { query } = require('./services/database');
    const result = await query("SELECT value FROM settings WHERE key = 'coa_base_dir'");
    const coaDir = result.rows.length > 0
      ? result.rows[0].value
      : path.resolve(config.coa.baseDir);
    res.sendFile(path.join(coaDir, req.params.filename), (err) => {
      if (err) next();
    });
  } catch {
    next();
  }
});
app.use('/uploads/coa', express.static(path.resolve(config.coa.baseDir)));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/recursos', express.static(recursosPath));

// Middleware de logging
app.use(logger(loggerInstance));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Handler TrackSamples Backend',
    version: '1.0.0'
  });
});

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Handler TrackSamples API Docs',
}));

// Rutas de la API
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

// Servir Frontend (React) en Producción
if (process.env.NODE_ENV === 'production') {
  // La ruta del build de React al estar desempaquetado sin asar
  const frontendPath = path.join(__dirname, '../../../app/build');
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

// Iniciar servidor en 0.0.0.0 para aceptar conexiones de red local
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, async () => {
  loggerInstance.info(`Handler TrackSamples Backend corriendo en ${HOST}:${PORT}`);
  loggerInstance.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  loggerInstance.info(`CORS: Aceptando localhost y IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)`);

  // Iniciar recovery de admin si existe el archivo
  await runAdminRecovery();

  // Iniciar scheduler de backups automáticos
  startBackupScheduler();
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