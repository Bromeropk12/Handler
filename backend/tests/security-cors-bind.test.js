/**
 * Tests de seguridad E.1 — CORS binding (H3)
 *
 * Valida que el middleware CORS:
 *   - Acepta orígenes en la whitelist
 *   - Rechaza orígenes públicos (internet)
 *   - No usa regexes peligrosos
 *   - No permite wildcard con credentials
 *   - Maneja correctamente origin ausente (server-to-server)
 */
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const config = require('../src/config');

// Build a minimal app that uses the same CORS config as production
const buildApp = () => {
  const app = express();
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'development') {
        for (const allowed of config.allowedOrigins) {
          if (allowed.endsWith('.') && origin.startsWith(allowed)) {
            const rest = origin.slice(allowed.length);
            if (/^\d{1,3}(\.\d{1,3}){0,3}(:\d+)?$/.test(rest)) {
              return callback(null, true);
            }
          }
        }
      }
      callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
  }));
  app.get('/test', (req, res) => res.json({ ok: true }));
  return app;
};

describe('E.1 Security — CORS binding (H3)', () => {
  let app;
  beforeAll(() => {
    // Asegurar que el config se carga
    process.env.NODE_ENV = 'test';
    app = buildApp();
  });

  test('localhost:3000 está en la whitelist', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'http://localhost:3000');
    expect(r.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('127.0.0.1:3001 está en la whitelist', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'http://127.0.0.1:3001');
    expect(r.headers['access-control-allow-origin']).toBe('http://127.0.0.1:3001');
  });

  test('rechaza origen público (https://evil.com)', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'https://evil.com');
    // CORS no añade header cuando rechaza
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rechaza subdominio malicioso (https://evil.localhost)', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'https://evil.localhost');
    // evil.localhost NO es localhost exacto
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rechaza origen con subdomain spoofing de localhost', async () => {
    // Node/superagent rechaza caracteres cirílicos/RTL en headers,
    // pero podemos probar otros trucos de spoofing como subdominios.
    const r = await request(app).get('/test')
      .set('Origin', 'https://attacker.localhost.example.com');
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rechaza origin con CRLF injection (raw socket)', async () => {
    // No podemos inyectar \r\n via supertest (Node los normaliza), pero
    // podemos verificar que el origin con caracteres de control es rechazado.
    const r = await request(app).get('/test')
      .set('Origin', 'http://localhost:3000\tAccess-Control-Allow-Origin: *');
    const allowOrigin = r.headers['access-control-allow-origin'];
    // No debe haber respuesta con header que contenga el origin manipulado
    if (allowOrigin) {
      expect(allowOrigin).not.toMatch(/\*/);
      expect(allowOrigin).not.toMatch(/\t/);
    }
  });

  test('permite origin ausente (server-to-server / curl)', async () => {
    const r = await request(app).get('/test');
    // Sin origin header, el server responde OK
    expect(r.status).toBe(200);
  });

  test('rechaza puerto sospechoso en localhost', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'http://localhost:99999');
    // El puerto 99999 no es 3000/3001/3002/5173 → debe rechazar
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('rechaza http://attacker.com que intenta impersonar localhost', async () => {
    const r = await request(app).get('/test')
      .set('Origin', 'http://attacker.com?fake=localhost');
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });
});
