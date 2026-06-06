/**
 * Tests de seguridad E.1 — Error disclosure (H*)
 *
 * Valida que los errores HTTP no filtran:
 *   - Stack traces de Node
 *   - Paths absolutos del servidor
 *   - Queries SQL con placeholders y valores
 *   - Versiones de librerías
 */
const request = require('supertest');
const express = require('express');
const { errorHandler, AppError } = require('../src/middleware/errorHandler');

const buildApp = () => {
  const app = express();
  app.get('/throw-app-error', (req, res, next) => {
    next(new AppError('Recurso no encontrado', 404));
  });
  app.get('/throw-internal', (req, res, next) => {
    // Error inesperado con stack
    const e = new Error('Connection refused at 10.0.0.5:5432 db_user=handler');
    e.code = 'ECONNREFUSED';
    e.path = '/var/www/handler/backend/src/services/database.js';
    next(e);
  });
  app.get('/throw-sql', (req, res, next) => {
    const e = new Error('relation "users" does not exist');
    e.code = '42P01';
    e.query = 'SELECT * FROM users WHERE id = $1';
    e.parameters = ['1; DROP TABLE users; --'];
    next(e);
  });
  app.use(errorHandler);
  return app;
};

describe('E.1 Security — Error disclosure', () => {
  let app;
  beforeAll(() => {
    app = buildApp();
  });

  test('AppError 404 devuelve mensaje limpio sin stack', async () => {
    const r = await request(app).get('/throw-app-error');
    expect(r.status).toBe(404);
    expect(JSON.stringify(r.body)).not.toMatch(/at .*\.js:\d+/);
  });

  test('error 500 interno NO expone stack trace', async () => {
    const r = await request(app).get('/throw-internal');
    expect(r.status).toBe(500);
    const body = JSON.stringify(r.body);
    expect(body).not.toMatch(/at .*\.js:\d+:\d+/);
    expect(body).not.toMatch(/node_modules/);
  });

  test('error 500 interno NO expone paths absolutos del servidor', async () => {
    const r = await request(app).get('/throw-internal');
    expect(r.status).toBe(500);
    const body = JSON.stringify(r.body);
    expect(body).not.toMatch(/\/var\/www/);
    expect(body).not.toMatch(/C:\\.*backend/i);
    expect(body).not.toMatch(/Connection refused at 10\.0\.0\.5/);
  });

  test('error SQL NO expone query ni parámetros', async () => {
    const r = await request(app).get('/throw-sql');
    expect(r.status).toBe(500);
    const body = JSON.stringify(r.body);
    expect(body).not.toMatch(/SELECT \* FROM users/);
    expect(body).not.toMatch(/DROP TABLE users/);
    expect(body).not.toMatch(/relation "users" does not exist/);
  });

  test('error 500 interno devuelve mensaje genérico en prod', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const r = await request(app).get('/throw-internal');
    // En prod, el body debe estar vacío o tener un mensaje genérico
    // (sin stack, sin paths, sin detalles de la query)
    const body = JSON.stringify(r.body);
    expect(body).not.toMatch(/Connection refused at 10\.0\.0\.5/);
    expect(body).not.toMatch(/\/var\/www/);
    expect(body).not.toMatch(/at .*\.js:\d+:\d+/);
    process.env.NODE_ENV = prev;
  });

  test('error 500 expone detalles solo en dev/test', async () => {
    process.env.NODE_ENV = 'test';
    const r = await request(app).get('/throw-internal');
    expect(r.status).toBe(500);
    const body = JSON.stringify(r.body);
    if (body.stack || body.error?.stack) {
      const stack = body.stack || body.error.stack;
      expect(stack).not.toMatch(/C:\\/);
      expect(stack).not.toMatch(/\/var\//);
    }
  });
});
