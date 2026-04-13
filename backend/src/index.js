/**
 * Handler TrackSamples Backend API
 * Sistema de gestión de inventario de muestras químicas
 *
 * @author Handler S.A.S.
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const config = require('./config');

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
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (config.nodeEnv !== 'production') {
  loggerInstance.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

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

// CORS: Permitir localhost y IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
const allowedOrigins = [
  config.frontendUrl, // localhost:3000
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Agregar IPs de red local si están configuradas
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()));
}

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si es localhost o IP de red local
    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    const isPrivateIP = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
    
    if (isLocalhost || isPrivateIP || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
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

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler(loggerInstance));

// Iniciar servidor en 0.0.0.0 para aceptar conexiones de red local
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  loggerInstance.info(`Handler TrackSamples Backend corriendo en ${HOST}:${PORT}`);
  loggerInstance.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  loggerInstance.info(`CORS: Aceptando localhost y IPs de red local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)`);
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