/**
 * Sanitizer Tests
 *
 * Verifica que `utils/sanitizer` redacta correctamente:
 *  - passwords (todas las variantes: currentPassword, new_password, etc.)
 *  - tokens (accessToken, refresh_token, etc.)
 *  - secrets, apiKeys, JWTs
 *  - headers sensibles (authorization, cookie)
 *  - estructuras anidadas, arrays, errores, Buffers, ciclos
 *  - modos alternativos: 'redact' | 'hash' | 'mask'
 *
 * Estos tests son la primera línea de defensa contra regresiones: si alguien
 * añade un nuevo endpoint que loguea body crudo, debe pasar por sanitize()
 * y estos tests siguen pasando.
 */

const {
  sanitize,
  sanitizeHeaders,
  sanitizeRequest,
  detectLeaks,
  isSensitiveKey,
  isSensitiveHeader,
  REDACTED,
} = require('../src/utils/sanitizer');

describe('utils/sanitizer', () => {
  // ────────────────────────────────────────────────────────────────────
  //  isSensitiveKey
  // ────────────────────────────────────────────────────────────────────
  describe('isSensitiveKey()', () => {
    test.each([
      ['password', true],
      ['Password', true],
      ['PASSWORD', true],
      ['currentPassword', true],
      ['new_password', true],
      ['secret', true],
      ['SECRET_PASSWORD', true],
      ['token', true],
      ['authToken', true],
      ['x_auth_token', true],
      ['apiKey', true],
      ['api_key', true],
      ['jwt', true],
      ['jwt_secret', true],
      ['authorization', true],
      ['cookie', true],
      ['cookies', true],
      ['signature', true],
      ['passphrase', true],
      // No sensibles
      ['username', false],
      ['email', false],
      ['name', false],
      ['id', false],
      ['role', false],
      ['lot', false],
      ['description', false],
      ['', false],
    ])('isSensitiveKey(%j) === %j', (key, expected) => {
      expect(isSensitiveKey(key)).toBe(expected);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  sanitize() - casos básicos
  // ────────────────────────────────────────────────────────────────────
  describe('sanitize() - básico', () => {
    test('redacta password de un objeto simple', () => {
      const input = { username: 'admin', password: 'super_secret_123' };
      const result = sanitize(input);
      expect(result).toEqual({
        username: 'admin',
        password: '[REDACTED]',
      });
    });

    test('no muta el objeto original', () => {
      const input = { password: 'x' };
      const result = sanitize(input);
      expect(input.password).toBe('x');
      expect(result).not.toBe(input);
    });

    test('case-insensitive en nombres de claves', () => {
      const input = { Password: 'a', PASSWORD: 'b', passWord: 'c' };
      const result = sanitize(input);
      expect(result.Password).toBe('[REDACTED]');
      expect(result.PASSWORD).toBe('[REDACTED]');
      expect(result.passWord).toBe('[REDACTED]');
    });

    test('soporta snake_case y camelCase equivalentes', () => {
      const input = {
        newPassword: 'a',
        new_password: 'b',
        accessToken: 'c',
        access_token: 'd',
      };
      const result = sanitize(input);
      expect(result.newPassword).toBe('[REDACTED]');
      expect(result.new_password).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.access_token).toBe('[REDACTED]');
    });

    test('preserva campos no sensibles intactos', () => {
      const input = {
        username: 'admin',
        email: 'admin@example.com',
        age: 30,
        active: true,
        role: 'admin',
      };
      const result = sanitize(input);
      expect(result).toEqual(input);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  sanitize() - casos avanzados
  // ────────────────────────────────────────────────────────────────────
  describe('sanitize() - avanzado', () => {
    test('redacta recursivamente en objetos anidados', () => {
      const input = {
        user: {
          username: 'admin',
          // 'credentials' NO debe ser redactado (no es sensible)
          credentials: {
            password: 'x',
            token: 'y',
          },
        },
      };
      const result = sanitize(input);
      expect(result.user.username).toBe('admin');
      // 'credentials' como KEY no es sensible → debe permanecer como objeto
      expect(result.user.credentials).toBeDefined();
      expect(result.user.credentials.password).toBe('[REDACTED]');
      expect(result.user.credentials.token).toBe('[REDACTED]');
    });

    test('sanea elementos de arrays', () => {
      const input = {
        users: [
          { username: 'a', password: 'b' },
          { username: 'c', password: 'd' },
        ],
      };
      const result = sanitize(input);
      expect(result.users[0].password).toBe('[REDACTED]');
      expect(result.users[1].password).toBe('[REDACTED]');
      expect(result.users[0].username).toBe('a');
    });

    test('maneja objetos vacíos y null sin error', () => {
      expect(sanitize(null)).toBeNull();
      expect(sanitize(undefined)).toBeUndefined();
      expect(sanitize({})).toEqual({});
      expect(sanitize([])).toEqual([]);
    });

    test('no se rompe con referencias circulares', () => {
      const obj = { name: 'safe' };
      obj.self = obj;
      const result = sanitize(obj);
      expect(result.name).toBe('safe');
      expect(result.self).toBe('[CIRCULAR]');
    });

    test('representa Buffers de forma segura', () => {
      const input = { data: Buffer.from('binary content') };
      const result = sanitize(input);
      expect(result.data).toMatch(/<Buffer length=\d+>/);
      expect(result.data).not.toContain('binary content');
    });

    test('representa Errors solo con name/message/code', () => {
      const err = new Error('boom');
      err.code = 'EACCES';
      err.internalPath = '/etc/passwd';
      const result = sanitize({ err });
      expect(result.err).toEqual({
        name: 'Error',
        message: 'boom',
        code: 'EACCES',
      });
      expect(result.err.internalPath).toBeUndefined();
    });

    test('representa Date como ISO string', () => {
      const date = new Date('2026-06-05T00:00:00.000Z');
      const result = sanitize({ createdAt: date });
      expect(result.createdAt).toBe('2026-06-05T00:00:00.000Z');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  sanitize() - modos alternativos
  // ────────────────────────────────────────────────────────────────────
  describe('sanitize() - modos', () => {
    test('modo hash: produce SHA-256 truncado para correlación forense', () => {
      const input = { password: 'super_secret_123' };
      const result = sanitize(input, { mode: 'hash' });
      expect(result.password).toMatch(/^\[REDACTED:sha256:[0-9a-f]{8}\]$/);
      // El mismo input siempre produce el mismo hash (determinístico)
      const result2 = sanitize(input, { mode: 'hash' });
      expect(result2.password).toBe(result.password);
    });

    test('modo mask: muestra primeros 2 chars + ***', () => {
      const input = { password: 'super_secret_123' };
      const result = sanitize(input, { mode: 'mask' });
      expect(result.password).toBe('su***');
    });

    test('modo mask con string corto: aplica [REDACTED]', () => {
      const input = { password: 'ab' }; // < 4 chars
      const result = sanitize(input, { mode: 'mask' });
      expect(result.password).toBe('[REDACTED]');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  sanitizeHeaders()
  // ────────────────────────────────────────────────────────────────────
  describe('sanitizeHeaders()', () => {
    test('redacta authorization, cookie y headers sensibles', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9...',
        cookie: 'auth_token=abc123; session=xyz',
        'x-api-key': 'sk_live_secret_456',
        'user-agent': 'Mozilla/5.0',
      };
      const result = sanitizeHeaders(headers);
      expect(result.authorization).toBe('[REDACTED]');
      expect(result.cookie).toBe('[REDACTED]');
      expect(result['x-api-key']).toBe('[REDACTED]');
      expect(result['content-type']).toBe('application/json');
      expect(result['user-agent']).toBe('Mozilla/5.0');
    });

    test('maneja headers case-insensitive', () => {
      const headers = {
        Authorization: 'Bearer x',
        COOKIE: 'y',
        'X-Auth-Token': 'z',
      };
      const result = sanitizeHeaders(headers);
      expect(result.Authorization).toBe('[REDACTED]');
      expect(result.COOKIE).toBe('[REDACTED]');
      expect(result['X-Auth-Token']).toBe('[REDACTED]');
    });

    test('maneja headers vacíos o inválidos', () => {
      expect(sanitizeHeaders(null)).toBeNull();
      expect(sanitizeHeaders(undefined)).toBeUndefined();
      expect(sanitizeHeaders({})).toEqual({});
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  sanitizeRequest() - helper para middleware
  // ────────────────────────────────────────────────────────────────────
  describe('sanitizeRequest()', () => {
    const mockReq = (overrides = {}) => ({
      method: 'POST',
      originalUrl: '/api/auth/login',
      url: '/api/auth/login',
      ip: '127.0.0.1',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer SECRET_TOKEN_XYZ',
        cookie: 'auth_token=secret',
        'user-agent': 'Jest/1.0',
      },
      body: { username: 'admin', password: 'super_secret_456' },
      params: {},
      query: {},
      get(name) {
        return this.headers[name.toLowerCase()];
      },
      ...overrides,
    });

    test('redacta body, params, query, headers de un req completo', () => {
      const req = mockReq();
      const result = sanitizeRequest(req);

      expect(result.method).toBe('POST');
      expect(result.url).toBe('/api/auth/login');
      expect(result.body.username).toBe('admin');
      expect(result.body.password).toBe('[REDACTED]');
      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers.cookie).toBe('[REDACTED]');
    });

    test('omite headers si includeHeaders=false', () => {
      const req = mockReq();
      const result = sanitizeRequest(req, { includeHeaders: false });
      expect(result.headers).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  detectLeaks() - auditoría
  // ────────────────────────────────────────────────────────────────────
  describe('detectLeaks()', () => {
    test('detecta secrets provistos en un texto', () => {
      const haystack = 'Log: login failed for user=admin password=MyP@ssw0rd!';
      const secrets = ['MyP@ssw0rd!', 'some_other_secret'];
      const result = detectLeaks(haystack, secrets);
      expect(result.leaked).toBe(true);
      expect(result.found).toEqual(['MyP@ssw0rd!']);
    });

    test('retorna leaked=false cuando no hay leaks', () => {
      const haystack = 'Log: ok user=admin';
      const secrets = ['MyP@ssw0rd!'];
      const result = detectLeaks(haystack, secrets);
      expect(result.leaked).toBe(false);
      expect(result.found).toEqual([]);
    });

    test('ignora secrets de < 4 chars (evitar falsos positivos)', () => {
      const haystack = 'Log: x=ab y=cd';
      const secrets = ['ab', 'cd', 'xy'];
      const result = detectLeaks(haystack, secrets);
      expect(result.found).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  isSensitiveHeader()
  // ────────────────────────────────────────────────────────────────────
  describe('isSensitiveHeader()', () => {
    test.each([
      ['authorization', true],
      ['Authorization', true],
      ['AUTHORIZATION', true],
      ['cookie', true],
      ['set-cookie', true],
      ['x-api-key', true],
      ['x-csrf-token', true],
      ['content-type', false],
      ['user-agent', false],
      ['accept', false],
    ])('isSensitiveHeader(%j) === %j', (name, expected) => {
      expect(isSensitiveHeader(name)).toBe(expected);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  //  Regresión: el caso exacto del log filtrado
  // ────────────────────────────────────────────────────────────────────
  describe('regresión: log de login fallido que contenía password', () => {
    test('sanitiza el body exacto del log de abril 2026', () => {
      // Estructura exacta del log que generó el hallazgo crítico:
      //   {"body":{"password":"password","username":"Briann"}, ...}
      const req = {
        method: 'POST',
        originalUrl: '/api/auth/login',
        ip: '127.0.0.1',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
        },
        body: { password: 'password', username: 'Briann' },
        params: {},
        query: {},
        get(name) {
          return this.headers[name.toLowerCase()];
        },
      };

      const result = sanitizeRequest(req);
      const serialized = JSON.stringify(result);

      // Lo más importante: la palabra "password" como valor no debe aparecer
      // NUNCA en el output. Solo puede aparecer como clave.
      expect(serialized).not.toContain('"password":"password"');
      expect(serialized).toContain('"password":"[REDACTED]"');
      expect(serialized).toContain('"username":"Briann"');
    });

    test('sanitiza el body exacto del log con password real', () => {
      const req = {
        method: 'POST',
        originalUrl: '/api/auth/login',
        headers: { 'content-type': 'application/json' },
        body: { password: '@Sneyder52', username: 'Briann' },
        params: {},
        query: {},
        get() { return undefined; },
      };

      const result = sanitizeRequest(req);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('@Sneyder52');
      // username "Briann" NO es sensible → debe aparecer tal cual
      expect(serialized).toContain('Briann');
    });
  });
});
