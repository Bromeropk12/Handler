/**
 * swagger.js — Generación de spec OpenAPI
 * Cargado con try/catch para evitar que un fallo de dependencia en producción
 * (ej: lru-cache incompatible con Node 18.5 embebido en pkg) derribe el servidor.
 */

let spec = {};

try {
  const swaggerJsdoc = require('swagger-jsdoc');

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Handler TrackSamples API',
        version: '1.0.0',
        description: 'API para el sistema de gestión de inventario de muestras químicas',
      },
      servers: [
        { url: 'http://localhost:3001', description: 'Servidor local' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Autenticación y usuarios' },
        { name: 'Samples', description: 'Muestras globales (bulk)' },
        { name: 'Warehouse', description: 'Anaqueles y mapa 2D' },
        { name: 'Dispensing', description: 'Dispensación de muestras' },
        { name: 'Dispatch', description: 'Despacho FEFO' },
        { name: 'Movements', description: 'Trazabilidad de movimientos' },
        { name: 'Analytics', description: 'Dashboard y analíticas' },
        { name: 'Alerts', description: 'Alertas de vencimiento' },
        { name: 'Suppliers', description: 'Proveedores' },
        { name: 'Market Lines', description: 'Líneas de mercado' },
        { name: 'Shelf Suppliers', description: 'Relación anaquel-proveedor' },
        { name: 'Backup', description: 'Respaldo y restauración' },
        { name: 'Settings', description: 'Configuración del sistema' },
      ],
    },
    apis: ['./src/modules/**/routes.js'],
  };

  spec = swaggerJsdoc(options);
  console.log('[SWAGGER] Spec OpenAPI generado correctamente.');
} catch (err) {
  console.warn('[SWAGGER] No se pudo cargar swagger-jsdoc (producción/pkg):', err.message);
  console.warn('[SWAGGER] El servidor continuará sin documentación OpenAPI.');
}

module.exports = spec;

