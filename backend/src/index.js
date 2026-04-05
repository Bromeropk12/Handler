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
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

app.use(cors({
  origin: config.frontendUrl, // Should match frontend localhost:3000
  credentials: true, // IMPORTANT for cookies
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());

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

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler(loggerInstance));

// Iniciar servidor
app.listen(PORT, () => {
  loggerInstance.info(`Handler TrackSamples Backend corriendo en puerto ${PORT}`);
  loggerInstance.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
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