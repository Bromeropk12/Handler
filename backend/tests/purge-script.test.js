/**
 * Tests E2E del script de purga de logs sensibles.
 *
 * Ejecuta el script real (backend/scripts/purge-sensitive-logs.js) en un
 * subproceso contra archivos de log temporales, valida que las credenciales
 * conocidas NO aparezcan en el output, y verifica el modo --strict
 * (circuit breaker).
 *
 * Estos tests son críticos: son la red de seguridad contra los 2 bugs
 * que tuvo v1.0 del script:
 *   - Bug #1: callback no expandía $1 → quedaba "$1" literal en logs
 *   - Bug #2: Rule 6 matcheaba JSON keys → dejaba values sin redactar
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SCRIPT_PATH = path.resolve(__dirname, '..', 'scripts', 'purge-sensitive-logs.js');

// ────────────────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────────────────

/**
 * Crea un directorio temporal con archivos de log que simulan los formatos
 * que el script debe manejar: body como objeto JSON nativo, body como string
 * con JSON escapado, y palabras sueltas en mensajes.
 */
function createTestLogsDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-test-'));
  const logFile = path.join(tmpDir, 'combined.log');

  // 5 líneas de log con diferentes formatos de leak
  const lines = [
    // 1. Body como objeto JSON nativo (línea "error")
    `{"body":{"password":"admin123","username":"admin"},"level":"error","message":"login failed","timestamp":"2026-06-05T10:00:00.000Z"}`,

    // 2. Body como string con JSON escapado (línea "info")
    `{"body":"{\\"username\\":\\"Briann\\",\\"password\\":\\"@Sneyder52\\"}","level":"info","message":"Request entrante","timestamp":"2026-06-05T10:01:00.000Z"}`,

    // 3. Typo en password
    `{"body":"{\\"username\\":\\"Dannacifu\\",\\"password\\":\\"passeord\\"}","level":"info","message":"Request entrante","timestamp":"2026-06-05T10:02:00.000Z"}`,

    // 4. Campo currentPassword (cambio de username)
    `{"body":"{\\"currentPassword\\":\\"oldSecret\\",\\"newUsername\\":\\"danna\\"}","level":"info","message":"Request entrante","timestamp":"2026-06-05T10:03:00.000Z"}`,

    // 5. Password suelto en mensaje humano (no en JSON body)
    `{"body":{},"level":"error","message":"la autentificacion password fallo para el usuario handle_user","timestamp":"2026-06-05T10:04:00.000Z"}`,

    // 6. Línea sin secretos (debe quedar intacta)
    `{"body":{"orderId":12345},"level":"info","message":"Order created","timestamp":"2026-06-05T10:05:00.000Z"}`,
  ];

  fs.writeFileSync(logFile, lines.join('\n') + '\n', 'utf8');
  return { tmpDir, logFile };
}

function createSecretsFile(tmpDir, secrets) {
  const secretsFile = path.join(tmpDir, 'secrets.txt');
  fs.writeFileSync(secretsFile, secrets.join('\n'), 'utf8');
  return secretsFile;
}

function runScript(args, env = {}) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function cleanup(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
}

// ────────────────────────────────────────────────────────────────────────
//  TESTS
// ────────────────────────────────────────────────────────────────────────

describe('purge-sensitive-logs script (E2E)', () => {
  describe('Redaction core', () => {
    let tmpDir;
    let logFile;
    let result;

    beforeAll(() => {
      ({ tmpDir, logFile } = createTestLogsDir());
      result = runScript(['--apply', '--paths', logFile]);
    });

    afterAll(() => cleanup(tmpDir));

    test('exit code is 0 on success', () => {
      expect(result.status).toBe(0);
    });

    test('redacts "password":"admin123" in native JSON body', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).not.toContain('admin123');
      expect(content).toContain('[REDACTED-HISTORICAL]');
    });

    test('redacts "password":"@Sneyder52" in escaped JSON body', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).not.toContain('@Sneyder52');
    });

    test('redacts typo password "passeord"', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).not.toContain('passeord');
    });

    test('redacts "currentPassword":"oldSecret" (json-credential-key rule)', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).not.toContain('oldSecret');
    });

    test('redacts "password" word in human messages', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      // El mensaje "la autentificacion password fallo" debe tener "password" redactado
      expect(content).toMatch(/autentificacion\s+\[REDACTED-HISTORICAL\]\s+fallo/);
    });

    test('preserves the "password" key in JSON (only value is redacted)', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      // El campo "password" debe seguir presente (como KEY)
      expect(content).toMatch(/"password"\s*:\s*"\[REDACTED-HISTORICAL\]"/);
      // Y NO debe haber "$1" literal (bug v1.0)
      expect(content).not.toContain('"$1"');
    });

    test('preserves lines without secrets intact', () => {
      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).toContain('"orderId":12345');
      expect(content).toContain('"message":"Order created"');
    });
  });

  describe('--strict mode (circuit breaker)', () => {
    test('passes when all known secrets are purged', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-strict-ok-'));
      const logFile = path.join(tmpDir, 'test.log');
      const secretsFile = createSecretsFile(tmpDir, ['@Sneyder52', 'admin123']);

      fs.writeFileSync(
        logFile,
        `{"body":{"password":"@Sneyder52"},"level":"info"}\n` +
        `{"body":{"password":"admin123"},"level":"info"}\n`,
        'utf8'
      );

      const result = runScript(['--apply', '--strict', '--paths', logFile, '--secrets-file', secretsFile]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('STRICT MODE');
      expect(result.stdout).toContain('todos los secrets conocidos fueron purgados');

      cleanup(tmpDir);
    });

    test('FAILS (exit 2) when known secret remains after purge', () => {
      // Simulamos un bug en el script: si por alguna razón la regla no captura
      // un secret, el modo --strict debe detectarlo y abortar.
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-strict-fail-'));
      const logFile = path.join(tmpDir, 'test.log');
      const secretsFile = createSecretsFile(tmpDir, ['SECRETO_FALSO_QUE_NO_EXISTE_EN_REGLAS']);

      // Log con un secret en formato NO cubierto por las reglas
      fs.writeFileSync(
        logFile,
        `{"body":{"someCustomField":"SECRETO_FALSO_QUE_NO_EXISTE_EN_REGLAS"},"level":"info"}\n`,
        'utf8'
      );

      const result = runScript(['--apply', '--strict', '--paths', logFile, '--secrets-file', secretsFile]);

      // El script debe abortar con exit 2 porque el secret conocido no fue purgado
      expect(result.status).toBe(2);
      expect(result.stdout).toContain('STRICT MODE');
      expect(result.stdout).toContain('leaks detectados');

      cleanup(tmpDir);
    });
  });

  describe('Dry-run mode', () => {
    test('does NOT modify the file in dry-run', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-dry-'));
      const logFile = path.join(tmpDir, 'test.log');
      const originalContent = `{"body":{"password":"admin123"},"level":"info"}\n`;
      fs.writeFileSync(logFile, originalContent, 'utf8');

      const result = runScript(['--paths', logFile]); // sin --apply
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('DRY-RUN');
      expect(result.stdout).toContain('no se modificó ningún archivo');

      // El archivo debe quedar IDÉNTICO
      const after = fs.readFileSync(logFile, 'utf8');
      expect(after).toBe(originalContent);

      cleanup(tmpDir);
    });
  });

  describe('Bug regression tests (v1.0 → v1.1)', () => {
    test('Bug #1 fixed: $1 is expanded to the field name, not left literal', () => {
      // v1.0: línea quedaba como {"$1":"[REDACTED-HISTORICAL]"}
      // v1.1: línea queda como {"password":"[REDACTED-HISTORICAL]"}
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-bug1-'));
      const logFile = path.join(tmpDir, 'test.log');
      fs.writeFileSync(
        logFile,
        `{"body":{"password":"miSecret"},"level":"info"}\n`,
        'utf8'
      );

      const result = runScript(['--apply', '--paths', logFile]);
      expect(result.status).toBe(0);

      const content = fs.readFileSync(logFile, 'utf8');
      expect(content).not.toContain('"$1"');           // bug v1.0 eradicated
      expect(content).toContain('"password":"[REDACTED-HISTORICAL]"');  // v1.1 ok
      expect(content).not.toContain('miSecret');       // value purged

      cleanup(tmpDir);
    });

    test('Bug #2 fixed: Rule 6 does NOT match JSON keys (only standalone words)', () => {
      // v1.0: \bpassword\b(?!") matcheaba la KEY "password" en JSON
      //       y dejaba el VALUE intacto
      // v1.1: (?<!")\bpassword\b EXCLUYE la posición de JSON key
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-bug2-'));
      const logFile = path.join(tmpDir, 'test.log');
      // Caso difícil: password como KEY, y como VALUE suelto
      fs.writeFileSync(
        logFile,
        // KEY "password" + VALUE "admin123" (cubierto por regla 1)
        `{"body":{"password":"admin123"},"level":"info"}\n` +
        // KEY "password" + VALUE "@Sneyder52" (cubierto por regla 1)
        `{"body":"{\\"password\\":\\"@Sneyder52\\"}","level":"info"}\n` +
        // Mensaje humano con "password" suelto (cubierto por regla 6)
        `{"message":"autenticacion password fallida","level":"error"}\n`,
        'utf8'
      );

      const result = runScript(['--apply', '--paths', logFile]);
      expect(result.status).toBe(0);

      const content = fs.readFileSync(logFile, 'utf8');
      // Ningún password conocido debe quedar
      expect(content).not.toContain('admin123');
      expect(content).not.toContain('@Sneyder52');
      // La palabra "password" solo debe aparecer como KEY (en JSON) o como "[REDACTED-HISTORICAL]"
      // Si quedó en algún otro contexto, es un leak
      const remainingPasswordRefs = (content.match(/password/g) || []).length;
      const keyRefs = (content.match(/"password"/g) || []).length;
      const escapedKeyRefs = (content.match(/\\"password\\"/g) || []).length;
      // Solo se permiten las KEY references (con o sin escape)
      expect(remainingPasswordRefs).toBe(keyRefs + escapedKeyRefs);

      cleanup(tmpDir);
    });
  });

  describe('Edge cases', () => {
    test('handles empty file gracefully', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-empty-'));
      const logFile = path.join(tmpDir, 'empty.log');
      fs.writeFileSync(logFile, '', 'utf8');

      const result = runScript(['--apply', '--paths', logFile]);
      expect(result.status).toBe(0);

      cleanup(tmpDir);
    });

    test('handles non-existent path gracefully', () => {
      const result = runScript(['--paths', '/nonexistent/file.log']);
      // No debe crashear; debe reportar 0 archivos
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/No se encontraron archivos/);
    });
  });
});
