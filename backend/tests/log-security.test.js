/**
 * Log Security Tests (E2E-style)
 *
 * Verifica end-to-end que el sistema NUNCA escribe un password, token o
 * secreto en los logs. Estos tests son el "circuit breaker" mencionado en
 * el análisis de seguridad: si alguien añade código que loguea un body
 * crudo, estos tests fallan en CI.
 *
 * Estrategia:
 *  1. Crear un buffer Winston en memoria.
 *  2. Crear un mini-Express app que use los middlewares reales:
 *     - `middleware/logger.js` (request logger)
 *     - `middleware/errorHandler.js` (error handler)
 *  3. Hacer un POST con credenciales secretas.
 *  4. Inyectar un error para disparar el errorHandler.
 *  5. Serializar todos los logs y verificar que ningún secreto aparece.
 *
 * Si este test pasa, los logs están limpios.
 */

const express = require('express');
const request = require('supertest');
const winston = require('winston');
const { Writable } = require('stream');

// ─── Mocks para evitar carga de config.js (que valida JWT_SECRET estricto) ───
jest.mock('../src/config', () => ({
  port: 3001,
  logging: { level: 'debug' },
  rateLimit: { windowMs: 900000, max: 5000 },
  validateEnvironment: jest.fn(),
}));

const { logger: requestLogger } = require('../src/middleware/logger');
const { errorHandler, AppError } = require('../src/middleware/errorHandler');
const { detectLeaks } = require('../src/utils/sanitizer');

// ─── Secretos que NUNCA deben aparecer en los logs ─────────────────────
const SECRETS = [
  'super_secret_password_xyz_2026',
  'Bearer.token.secreto.jwt.eyJhbGciOiJIUzI1NiJ9',
  'admin_secret_recovery_key_abcd1234',
  'csrf_token_secreto_para_test_9999',
];

describe('Log Security (E2E)', () => {
  let inMemoryLogger;
  let capturedLogs;
  let captureStream;

  // ─── Helper: crea un stream Writable en memoria y un logger Winston ──
  const createInMemoryLogger = () => {
    capturedLogs = [];
    captureStream = new Writable({
      write(chunk, _encoding, callback) {
        capturedLogs.push(chunk.toString('utf8'));
        callback();
      },
    });
    return winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Stream({ stream: captureStream }),
      ],
    });
  };

  // ─── Helper: crea una app Express con los middlewares reales ──────
  const createTestApp = (loggerInstance) => {
    const app = express();
    app.use(express.json());
    app.use(requestLogger(loggerInstance));

    // Endpoint que loguea el body crudo (regresión: NO debe pasar sanitización)
    app.post('/test/echo', (req, res) => {
      res.json({ received: req.body });
    });

    // Endpoint que dispara un error 500
    app.post('/test/error', (_req, _res, next) => {
      next(new AppError('Error de prueba', 500));
    });

    // Endpoint que dispara un error 400
    app.post('/test/bad-request', (_req, _res, next) => {
      next(new AppError('Bad request de prueba', 400));
    });

    app.use(errorHandler(loggerInstance));
    return app;
  };

  beforeEach(() => {
    inMemoryLogger = createInMemoryLogger();
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 1: login con password en body
  // ─────────────────────────────────────────────────────────────────
  test('POST /test/echo con password NO filtra el secreto en logs', async () => {
    const app = createTestApp(inMemoryLogger);

    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/json')
      .send({
        username: 'admin',
        password: SECRETS[0],
      })
      .expect(200);

    // Serializar todos los logs
    const allLogsText = capturedLogs.join('\n');

    // El username puede aparecer; el password NO
    const detection = detectLeaks(allLogsText, [SECRETS[0]]);
    expect(detection.leaked).toBe(false);
    expect(detection.found).toEqual([]);

    // El password debe aparecer redactado a '[REDACTED]'
    expect(allLogsText).toContain('[REDACTED]');
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 2: error 500 con body sensible
  // ─────────────────────────────────────────────────────────────────
  test('POST /test/error con body sensible NO filtra secretos en error log', async () => {
    const app = createTestApp(inMemoryLogger);

    await request(app)
      .post('/test/error')
      .set('Content-Type', 'application/json')
      .set('Authorization', SECRETS[1])
      .send({
        username: 'admin',
        password: SECRETS[0],
        token: SECRETS[1],
        csrf: SECRETS[3],
      })
      .expect(500);

    const allLogsText = capturedLogs.join('\n');
    const detection = detectLeaks(allLogsText, SECRETS);

    expect(detection.leaked).toBe(false);
    expect(detection.found).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 3: error 400 con body sensible
  // ─────────────────────────────────────────────────────────────────
  test('POST /test/bad-request NO filtra secretos en log de 400', async () => {
    const app = createTestApp(inMemoryLogger);

    // Spy en console.error porque el 400 va por ahí, no por winston
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await request(app)
      .post('/test/bad-request')
      .set('Content-Type', 'application/json')
      .send({
        username: 'admin',
        password: SECRETS[0],
      })
      .expect(400);

    // Combinar logs de winston + console
    const consoleText = consoleSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    const allLogsText = capturedLogs.join('\n') + '\n' + consoleText;

    const detection = detectLeaks(allLogsText, [SECRETS[0]]);
    expect(detection.leaked).toBe(false);
    expect(detection.found).toEqual([]);

    consoleSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 4: header Authorization NO debe aparecer en logs
  // ─────────────────────────────────────────────────────────────────
  test('Authorization header NO aparece en logs', async () => {
    const app = createTestApp(inMemoryLogger);

    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${SECRETS[1]}`)
      .send({ username: 'admin' })
      .expect(200);

    const allLogsText = capturedLogs.join('\n');
    const detection = detectLeaks(allLogsText, [SECRETS[1]]);
    expect(detection.leaked).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 5: cookie header NO debe aparecer en logs
  // ─────────────────────────────────────────────────────────────────
  test('Cookie header NO aparece en logs', async () => {
    const app = createTestApp(inMemoryLogger);

    const cookieValue = `auth_token=${SECRETS[1]}; session=xyz`;
    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookieValue)
      .send({})
      .expect(200);

    const allLogsText = capturedLogs.join('\n');
    // El valor exacto del JWT NO debe estar en logs
    const detection = detectLeaks(allLogsText, [SECRETS[1]]);
    expect(detection.leaked).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 6: passwords en múltiples formatos (camelCase, snake_case)
  // ─────────────────────────────────────────────────────────────────
  test('variantes de naming (camelCase/snake_case) son redactadas', async () => {
    const app = createTestApp(inMemoryLogger);

    const allVariants = SECRETS[0];
    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/json')
      .send({
        password: allVariants,
        currentPassword: allVariants,
        new_password: allVariants,
        OLD_PASSWORD: allVariants,
        userPassword: allVariants,
      })
      .expect(200);

    const allLogsText = capturedLogs.join('\n');
    const detection = detectLeaks(allLogsText, [allVariants]);
    expect(detection.leaked).toBe(false);
    expect(detection.found).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 7: caso real del log histórico (regresión específica)
  // ─────────────────────────────────────────────────────────────────
  test('regresión: log exacto de abril 2026 ahora se redacta', async () => {
    const app = createTestApp(inMemoryLogger);

    const historicalPassword = 'password'; // uno de los passwords reales del log filtrado
    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/json')
      .send({ username: 'Briann', password: historicalPassword })
      .expect(200);

    const allLogsText = capturedLogs.join('\n');

    // La cadena '"password":"password"' NO debe existir
    expect(allLogsText).not.toContain('"password":"password"');
    // Pero 'Briann' (username) SÍ puede aparecer
    expect(allLogsText).toContain('Briann');
    // Y debe haber al menos un [REDACTED]
    expect(allLogsText).toContain('[REDACTED]');
  });

  // ─────────────────────────────────────────────────────────────────
  //  Caso 8: body binario (multipart) NO debe loguearse
  // ─────────────────────────────────────────────────────────────────
  test('body con Content-Type no-JSON NO se loguea', async () => {
    const app = createTestApp(inMemoryLogger);

    await request(app)
      .post('/test/echo')
      .set('Content-Type', 'application/pdf')
      .set('Authorization', `Bearer ${SECRETS[1]}`)
      .send(Buffer.from('%PDF-1.4 fake pdf content with secret: ' + SECRETS[0]))
      .expect(200);

    const allLogsText = capturedLogs.join('\n');
    const detection = detectLeaks(allLogsText, [SECRETS[0], SECRETS[1]]);
    expect(detection.leaked).toBe(false);
  });
});
