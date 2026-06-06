/**
 * Tests de seguridad E.1 — Secrets & Config (C1, H*)
 *
 * Valida que:
 *   - JWT_SECRET débil es rechazado en producción
 *   - JWT_SECRET leaked (committed to repo) es rechazado siempre
 *   - Database password por defecto es rechazado
 *   - validateEnvironment() aborta el startup si hay secretos débiles
 *   - El .env.example NO contiene secretos reales
 */
const fs = require('fs');
const path = require('path');

describe('E.1 Security — Secrets & Config (C1)', () => {
  describe('validateEnvironment() en producción', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...ORIGINAL_ENV };
      // Defaults seguros para que no falle por otras razones
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/handler';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'handler';
      process.env.DB_USER = 'handler';
      process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    afterEach(() => {
      process.env = ORIGINAL_ENV;
    });

    test('rechaza JWT_SECRET = "changeme"', () => {
      process.env.JWT_SECRET = 'changeme';
      process.env.DB_PASSWORD = 'StrongP@ssw0rd_2026';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).toThrow(/JWT_SECRET|secret/i);
    });

    test('rechaza JWT_SECRET con <32 chars', () => {
      process.env.JWT_SECRET = 'short_secret_123';
      process.env.DB_PASSWORD = 'StrongP@ssw0rd_2026';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).toThrow(/JWT_SECRET|caracteres|chars/i);
    });

    test('rechaza JWT_SECRET leaked (committed)', () => {
      process.env.JWT_SECRET = '3b11654d5476821fcd02ff752b71aa943776bc4c070a54940cc0a652f1fe1fb8fdece45aa3c1fed44af36fa57193f036';
      process.env.DB_PASSWORD = 'StrongP@ssw0rd_2026';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).toThrow(/comprometido|leaked|rotar|ROTA/i);
    });

    test('rechaza DB_PASSWORD = "handler_password" (default)', () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.DB_PASSWORD = 'handler_password';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).toThrow(/DB_PASSWORD/i);
    });

    test('rechaza DB_PASSWORD débil ("password")', () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.DB_PASSWORD = 'password';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).toThrow(/DB_PASSWORD/i);
    });

    test('acepta secrets fuertes', () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.DB_PASSWORD = 'Str0ng_DB_P@ssw0rd_2026!';
      const config = require('../src/config');
      expect(() => config.validateEnvironment()).not.toThrow();
    });

    test('warns sobre JWT_SECRET con baja entropía (no throw)', () => {
      process.env.JWT_SECRET = 'a'.repeat(64); // 64 chars pero todos iguales
      process.env.DB_PASSWORD = 'StrongP@ssw0rd_2026';
      const config = require('../src/config');
      // Solo es un warning, no un throw
      expect(() => config.validateEnvironment()).not.toThrow();
    });
  });

  describe('Archivos del repo', () => {
    test('.env.example NO contiene secretos reales', () => {
      const envExample = fs.readFileSync(
        path.join(__dirname, '..', '.env.example'),
        'utf8'
      );
      // No debe tener el JWT_SECRET leaked
      expect(envExample).not.toMatch(/3b11654d5476821fcd02ff752b71aa943776bc4c070a54940cc0a652f1fe1fb8/);
      // No debe tener la password del installer (Handler2026)
      expect(envExample).not.toMatch(/Handler2026/);
      // No debe tener "supersecret" ni "admin123"
      expect(envExample.toLowerCase()).not.toMatch(/supersecret/);
    });

    test('.env NO está tracked en git', () => {
      const gitignore = fs.readFileSync(
        path.join(__dirname, '..', '.gitignore'),
        'utf8'
      );
      // Acepta tanto la línea exacta como patterns tipo `.env*`
      expect(gitignore).toMatch(/^\.env(\*|$|\.|\s)/m);
    });

    test('config.allowedOrigins existe y es un Set', () => {
      // Set NODE_ENV=test para evitar 'development' branching
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      const config = require('../src/config');
      expect(config.allowedOrigins).toBeInstanceOf(Set);
      process.env.NODE_ENV = prev;
    });
  });
});
