/**
 * Tests E.2 — B3: cache no silencioso
 *
 * Valida que el cache de CoA base dir en samples/controller.js no se traga
 * errores silenciosamente con `catch {}`. Si la query a BD falla, el
 * operador debe ver el motivo en el log.
 */
const fs = require('fs');
const path = require('path');

describe('E.2 Race & Error — B3: cache no silencioso', () => {
  test('samples/controller.js NO tiene `catch {}` (block vacío)', () => {
    const code = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'modules', 'samples', 'controller.js'),
      'utf8'
    );
    const silent = code.match(/catch\s*\{\s*\}/g);
    expect(silent).toBeNull();
  });

  test('getCoaBaseDir tiene fallback explícito a config por defecto', () => {
    const code = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'modules', 'samples', 'controller.js'),
      'utf8'
    );
    expect(code).toMatch(/getCoaBaseDir/);
    expect(code).toMatch(/config\.coa\.baseDir/);
  });
});
