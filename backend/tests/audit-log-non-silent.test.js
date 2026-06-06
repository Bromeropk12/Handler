/**
 * Tests E.2 — B2: audit log nunca es silencioso
 *
 * Valida que cuando el INSERT al audit log falla, el error se loggea a
 * console.error (no se traga con `catch (_) {}`). El cambio de permisos
 * ya se hizo en BD, así que el cliente recibe 200 OK, pero el operador
 * puede investigar el fallo de auditoría desde los logs del server.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('E.2 Race & Error — B2: audit log no silencioso', () => {
  test('los `catch (_) {}` mudos solo se permiten con comentario "log no crítico"', () => {
    const authCode = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'modules', 'auth', 'controller.js'),
      'utf8'
    );
    // Encontrar todos los `catch (_) { ... }` (con cuerpo opcional)
    const catches = authCode.matchAll(/catch\s*\(_\)\s*\{([^}]*)\}/gs);
    const violations = [];
    for (const c of catches) {
      const body = c[1];
      // Permitir el caso documentado: `/* log no crítico */` o `// log no crítico`
      const isDocumented = /\/\*.*log no crítico.*\*\/|\/\/.*log no crítico/.test(body);
      if (!isDocumented && body.trim().length === 0) {
        violations.push(body);
      }
    }
    // Los catches permitidos son los documentados; los mudos sin documentar son
    // un bug. Si aparecen nuevos, se deben documentar o fixear.
    expect(violations).toEqual([]);
  });

  test('el catch del audit log permissions_updated NO es silencioso (B2)', () => {
    const authCode = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'modules', 'auth', 'controller.js'),
      'utf8'
    );
    // El bloque permissions_updated debe loggear explícitamente el error
    const block = authCode.match(/permissions_updated[\s\S]{0,800}/);
    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/console\.error|logger\.|auditErr/);
  });
});
