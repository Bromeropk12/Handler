#!/usr/bin/env node
/**
 * Purge Sensitive Logs (one-shot script)
 *
 * Escanea los archivos de log del backend y reemplaza credenciales filtradas
 * conocidas por la cadena `[REDACTED-HISTORICAL]`. NO borra logs: los sanea
 * para que no contengan passwords, tokens ni otros secretos que pudieron
 * haberse escrito antes de que se aplicara el fix de sanitización.
 *
 * USO:
 *   node scripts/purge-sensitive-logs.js                       # dry-run, no modifica
 *   node scripts/purge-sensitive-logs.js --apply               # modifica in-place
 *   node scripts/purge-sensitive-logs.js --apply --backup      # crea .bak antes
 *   node scripts/purge-sensitive-logs.js --apply --verbose     # muestra antes/después
 *   node scripts/purge-sensitive-logs.js --paths custom.log,other.log
 *   node scripts/purge-sensitive-logs.js --secrets-file lista.txt
 *   node scripts/purge-sensitive-logs.js --strict             # aborta si quedan leaks
 *
 * Por defecto escanea:
 *   - backend/logs/*.log
 *   - backend/logs/*.log.* (logs rotados)
 *   - backend-dist/logs/*.log
 *
 * IMPORTANTE: este script está pensado para ejecutarse UNA SOLA VEZ después
 * de desplegar el fix de sanitización. Es opt-in y seguro (no destructivo
 * por defecto, hace backup si se le pide).
 *
 * ─── HISTORIAL DE BUGS (lecciones aprendidas, no repetir) ────────────────
 * v1.0 (2026-06-05): Versión inicial con bug crítico:
 *   - Rule 1/2/3 usaban callback que devolvía string con $1 literal →
 *     el campo "$1" aparecía en los logs en lugar del campo original.
 *   - Rule 6 (common-bad-passwords) matcheaba la KEY "password" en JSON
 *     y dejaba el VALUE intacto, por lo que los passwords seguían
 *     visibles en claro.
 * v1.1 (2026-06-05): Fix:
 *   - Reemplazo pasa de callback a string directo, contando matches
 *     por separado (JS expande $1 correctamente).
 *   - Rule 6 añade negative lookahead `(?!")` para NO matchear cuando
 *     la palabra va seguida de `"` (es decir, es un JSON key).
 *   - Modo --verbose muestra hasta 3 muestras antes/después por regla.
 *   - Modo --strict corre post-purga: si algún secret conocido aún
 *     aparece, aborta con error (circuit breaker).
 *   - --secrets-file permite pasar lista custom de secrets a verificar.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_LOG_PATHS = [
  path.join(PROJECT_ROOT, 'backend', 'logs'),
  path.join(PROJECT_ROOT, 'backend-dist', 'logs'),
];

// ────────────────────────────────────────────────────────────────────────────
//  REGLAS DE REDACCIÓN
// ────────────────────────────────────────────────────────────────────────────

/**
 * Patrones regex con nombre humano. Cada match se reemplaza por la cadena
 * de reemplazo correspondiente. La idea es cubrir todas las formas en que
 * un secreto pudo haberse filtrado en los logs.
 *
 * El orden importa: las reglas más específicas van primero.
 *
 * IMPORTANTE: el `replace` se pasa DIRECTAMENTE a String.replace() (sin
 * callback), por lo que JavaScript SÍ expande $1, $2, etc. Esto fue el
 * bug de v1.0 — usar callback hacía que $1 se quedara literal.
 */
const REDACTION_RULES = [
  // 1. Campo JSON "password":"<valor>" (con o sin escape JSON) → "[REDACTED-HISTORICAL]"
  //    En los logs hay DOS formatos de body:
  //      a) Body como objeto JSON nativo:   "body":{"password":"admin123", ...}
  //         (típico en líneas "error")
  //      b) Body como STRING con JSON escapado: "body":"{\"password\":\"admin123\"}"
  //         (típico en líneas "info" — winston serializa el body a string)
  //    La regex usa `\\?"` (cero o un backslash antes de `"`) para capturar
  //    AMBOS formatos preservando el estilo original en el replacement.
  {
    name: 'json-password-field',
    regex: /(\\?")(password|currentPassword|newPassword|confirmPassword|secretPassword|adminPassword|oldPassword|userPassword|rawPassword|plainPassword|hashPassword)(\\?")\s*:\s*(\\?")([^"\\]*(?:\\.[^"\\]*)*)(\\?")/g,
    replace: '$1$2$3:$4[REDACTED-HISTORICAL]$6',
  },

  // 2. Campo JSON token/apiKey/secret (con o sin escape). Misma técnica.
  {
    name: 'json-token-field',
    regex: /(\\?")(token|authToken|accessToken|refreshToken|idToken|jwtToken|apiKey|api_key|clientSecret|jwtSecret|jwt_secret|secret|csrfToken|csrf_token|sessionToken|passphrase|signature|privateKey|publicKey)(\\?")\s*:\s*(\\?")([^"\\]*(?:\\.[^"\\]*)*)(\\?")/g,
    replace: '$1$2$3:$4[REDACTED-HISTORICAL]$6',
  },

  // 3. Campo JSON con palabras sensibles en keys menos comunes (con o sin escape).
  //    Heurística amplia: cualquier key que contenga password/passwd/secret/
  //    token/credential/apiKey/api_key/privateKey (case-insensitive).
  {
    name: 'json-credential-key',
    regex: /(\\?")([a-zA-Z_][a-zA-Z0-9_]*(?:password|passwd|secret|token|credential|apiKey|api_key|privateKey)[a-zA-Z0-9_]*)(\\?")\s*:\s*(\\?")([^"\\]*(?:\\.[^"\\]*)*)(\\?")/gi,
    replace: '$1$2$3:$4[REDACTED-HISTORICAL]$6',
  },

  // 4. Header Authorization: Bearer <jwt>
  {
    name: 'bearer-header',
    regex: /(Bearer\s+)([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)/g,
    replace: '$1[REDACTED-HISTORICAL-JWT]',
  },

  // 5. Cookie: nombre=valor con palabras sensibles
  {
    name: 'cookie-secrets',
    regex: /(Cookie:\s*[^;]*?(?:auth_token|session|csrf|token|jwt)=)([^;]+)/gi,
    replace: '$1[REDACTED-HISTORICAL]',
  },

  // 6. Passwords comunes sueltos (los que aparecieron en logs reales).
  //    ⚠️ FIX v1.1: negative lookbehind `(?<!")` evita matchear JSON keys
  //    (en JSON, "password" va precedido de `"`). Sin este lookbehind, el
  //    bug de v1.0 dejaba los VALORES de password intactos porque solo
  //    se reemplazaba la KEY. Ahora la regla 1 (`json-password-field`)
  //    maneja `"password":"valor"` con su valor, y la regla 6 solo
  //    captura la palabra suelta en mensajes humanos (ej. "La password
  //    no es válida" → "La [REDACTED-HISTORICAL] no es válida").
  {
    name: 'common-bad-passwords',
    regex: /(?<!")\b(password|paswword|passowrd|passeord|passeors|123456|admin123|admin1234|qwerty)\b/g,
    replace: '[REDACTED-HISTORICAL]',
  },

  // 7. Patrones de query string con password embebido
  {
    name: 'password-in-query',
    regex: /(password=)([^&\s"']+)/gi,
    replace: '$1[REDACTED-HISTORICAL]',
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  SECRETS CONOCIDOS (para circuit breaker post-purga)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Lista por defecto de secrets conocidos que aparecieron en logs históricos.
 * El modo --strict verifica que NINGUNO de estos persista después de la purga.
 *
 * Estos son los passwords reales que se filtraron en abril-mayo 2026
 * (extraídos del análisis del log).
 */
const DEFAULT_KNOWN_SECRETS = [
  '@Sneyder52',         // password real usada en intentos de login
  'paswword',           // typo de un usuario
  'passowrd',           // typo
  'passeord',           // typo
  'passeors',           // typo
  'admin123',           // default del sistema (ya cambiada en prod)
];

/**
 * Carga lista custom de secrets desde un archivo de texto (uno por línea).
 */
const loadSecretsFile = (filepath) => {
  if (!fs.existsSync(filepath)) {
    console.error(`⚠️  Archivo de secrets no encontrado: ${filepath}`);
    return [];
  }
  return fs
    .readFileSync(filepath, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && !s.startsWith('#'));
};

// ────────────────────────────────────────────────────────────────────────────
//  UTILIDADES
// ────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FLAGS = {
  apply: args.includes('--apply'),
  backup: args.includes('--backup'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  strict: args.includes('--strict'),
  paths: (() => {
    const idx = args.indexOf('--paths');
    if (idx === -1) return null;
    return args[idx + 1]
      ? args[idx + 1].split(',').map((p) => path.resolve(p.trim()))
      : null;
  })(),
  secretsFile: (() => {
    const idx = args.indexOf('--secrets-file');
    return idx === -1 ? null : args[idx + 1] ? path.resolve(args[idx + 1]) : null;
  })(),
  help: args.includes('--help') || args.includes('-h'),
};

function printHelp() {
  console.log(`
Purge Sensitive Logs — Handler TrackSamples

Sanea archivos de log reemplazando credenciales filtradas por la cadena
"[REDACTED-HISTORICAL]". Por defecto corre en modo dry-run (no modifica
archivos). Use --apply para escribir los cambios.

USO:
  node scripts/purge-sensitive-logs.js                       # dry-run
  node scripts/purge-sensitive-logs.js --apply               # modifica in-place
  node scripts/purge-sensitive-logs.js --apply --backup      # crea .bak antes
  node scripts/purge-sensitive-logs.js --apply --verbose     # muestra antes/después
  node scripts/purge-sensitive-logs.js --strict             # aborta si quedan leaks
  node scripts/purge-sensitive-logs.js --paths a.log,b.log
  node scripts/purge-sensitive-logs.js --secrets-file lista.txt
  node scripts/purge-sensitive-logs.js --help

OPCIONES:
  --apply               Escribir los cambios (sin esto, solo reporta)
  --backup              Crear copia .bak antes de modificar
  --verbose, -v         Mostrar muestras antes/después por regla
  --strict              Circuit breaker: aborta si quedan secrets conocidos
  --paths <lista>       Lista separada por comas de archivos a procesar
  --secrets-file <ruta> Archivo de texto con lista custom de secrets a verificar
  --help, -h            Mostrar esta ayuda

ARCHIVOS POR DEFECTO:
  ${DEFAULT_LOG_PATHS.map((p) => `  - ${p}`).join('\n  ')}
`);
}

function findLogFiles() {
  const files = [];

  if (FLAGS.paths) {
    for (const p of FLAGS.paths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        files.push(p);
      } else if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        for (const f of fs.readdirSync(p)) {
          if (f.endsWith('.log') || /\.log\.\d+/.test(f)) {
            files.push(path.join(p, f));
          }
        }
      }
    }
    return files;
  }

  for (const dir of DEFAULT_LOG_PATHS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.log') || /\.log\.\d+/.test(f)) {
        files.push(path.join(dir, f));
      }
    }
  }
  return files;
}

/**
 * Aplica todas las reglas de redacción a un string.
 *
 * v1.1 FIX: cuenta matches con `String.match()` (no destructivo), luego
 * aplica el reemplazo pasando el string directamente a `String.replace()`
 * (no callback) para que JavaScript expanda $1, $2, etc. correctamente.
 *
 * @returns {{ sanitized: string, hitsPorRegla: object, samples: object }}
 */
function applyRules(text) {
  let sanitized = text;
  const hitsPorRegla = {};
  const samples = {};

  for (const rule of REDACTION_RULES) {
    // 1) Contar matches sin modificar el texto
    const matches = sanitized.match(rule.regex);
    const count = matches ? matches.length : 0;

    if (count > 0) {
      // 2) Para verbose mode, capturar hasta 3 muestras ANTES del reemplazo.
      //    Esto requiere un callback, pero el callback DEBE devolver el
      //    string YA expandido (no dejar $1 literal).
      if (FLAGS.verbose) {
        const ruleSamples = [];
        sanitized = sanitized.replace(rule.regex, (match, ...args) => {
          if (ruleSamples.length < 3) {
            const offset = args[args.length - 2]; // penúltimo arg = offset
            const contextStart = Math.max(0, offset - 30);
            const contextEnd = Math.min(sanitized.length, offset + match.length + 30);
            const contextBefore = sanitized.substring(contextStart, offset);
            const contextAfter = sanitized.substring(offset + match.length, contextEnd);

            ruleSamples.push({
              before: (contextBefore + '⟨' + match + '⟩' + contextAfter).substring(0, 200),
            });
          }
          // Expandir manualmente $1, $2, ... en el replacement string
          return expandBackreferences(rule.replace, match, args);
        });
        samples[rule.name] = ruleSamples;
      } else {
        // Modo no-verbose: aplicar directamente (JS expande $1 automáticamente)
        sanitized = sanitized.replace(rule.regex, rule.replace);
      }

      hitsPorRegla[rule.name] = count;
    }
  }

  return { sanitized, hitsPorRegla, samples };
}

/**
 * Expande manualmente los backreferences ($1, $2, ...) en un string de reemplazo.
 * Necesario cuando usamos un callback de String.replace() (en verbose mode).
 *
 * @param {string} template - String con placeholders $1, $2, ...
 * @param {string} match - Match completo (no se usa, presente por compat)
 * @param {string[]} capturedGroups - Grupos capturados (args[0] es $1, etc.)
 * @returns {string}
 */
function expandBackreferences(template, match, capturedGroups) {
  return template.replace(/\$(\d+)/g, (m, idx) => {
    const i = parseInt(idx, 10) - 1;
    return capturedGroups[i] !== undefined ? capturedGroups[i] : '';
  });
}

/**
 * Verifica que un texto no contenga secrets conocidos.
 * Usado por --strict (circuit breaker).
 *
 * @param {string} text
 * @param {string[]} secrets
 * @returns {{ leaked: boolean, found: Array<{secret: string, count: number, firstMatch: number}> }}
 */
function detectLeaks(text, secrets) {
  const found = [];
  for (const secret of secrets) {
    if (typeof secret !== 'string' || secret.length < 4) continue;
    // Escapar caracteres regex especiales
    const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      found.push({
        secret: secret.substring(0, 6) + '***', // no loguear el secret completo
        count: matches.length,
      });
    }
  }
  return { leaked: found.length > 0, found };
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────────────────────────────────────

async function processFile(filepath) {
  const original = fs.readFileSync(filepath, 'utf8');
  const originalSize = original.length;

  const { sanitized, hitsPorRegla, samples } = applyRules(original);

  const totalHits = Object.values(hitsPorRegla).reduce((s, n) => s + n, 0);
  const changed = sanitized !== original;

  if (!changed) {
    return { filepath, changed: false, totalHits, hitsPorRegla, originalSize, newSize: originalSize };
  }

  // Mostrar muestras en verbose mode
  if (FLAGS.verbose && Object.keys(samples).length > 0) {
    console.log(`\n    ┌─ Muestras (verbose):`);
    for (const [ruleName, ruleSamples] of Object.entries(samples)) {
      console.log(`    │ [${ruleName}]`);
      for (const sample of ruleSamples) {
        console.log(`    │   ${sample.before}`);
      }
    }
    console.log(`    └─`);
  }

  if (FLAGS.apply) {
    if (FLAGS.backup) {
      const backupPath = `${filepath}.bak`;
      fs.writeFileSync(backupPath, original, 'utf8');
      console.log(`  [backup] ${backupPath}`);
    }
    fs.writeFileSync(filepath, sanitized, 'utf8');
  }

  return {
    filepath,
    changed: true,
    totalHits,
    hitsPorRegla,
    originalSize,
    newSize: sanitized.length,
  };
}

async function main() {
  if (FLAGS.help) {
    printHelp();
    process.exit(0);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Purge Sensitive Logs — Handler TrackSamples  (v1.1)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Modo: ${FLAGS.apply ? '🔴 APPLY (escribirá cambios)' : '🟢 DRY-RUN (no modifica)'}`);
  if (FLAGS.apply && FLAGS.backup) {
    console.log('Backup: activado (.bak antes de cada cambio)');
  }
  if (FLAGS.verbose) {
    console.log('Verbose: activado (mostrará muestras antes/después)');
  }
  if (FLAGS.strict) {
    console.log('Strict: activado (circuit breaker — aborta si quedan leaks)');
  }
  console.log('');

  const files = findLogFiles();

  if (files.length === 0) {
    console.log('⚠️  No se encontraron archivos .log en las rutas esperadas.');
    console.log('   Rutas buscadas:');
    DEFAULT_LOG_PATHS.forEach((p) => console.log(`     - ${p}`));
    process.exit(0);
  }

  console.log(`Archivos a escanear: ${files.length}\n`);

  const results = [];
  for (const filepath of files) {
    process.stdout.write(`  Procesando: ${path.relative(PROJECT_ROOT, filepath)} ... `);
    try {
      const result = await processFile(filepath);
      results.push(result);
      if (!result.changed) {
        console.log('✓ limpio');
      } else {
        console.log(
          `🔧 ${result.totalHits} hit(s) [${Object.entries(result.hitsPorRegla)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}]`
        );
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      results.push({ filepath, error: err.message });
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('RESUMEN');
  console.log('─────────────────────────────────────────────────────────────');

  const totalHits = results.reduce((s, r) => s + (r.totalHits || 0), 0);
  const changedFiles = results.filter((r) => r.changed).length;
  const erroredFiles = results.filter((r) => r.error).length;

  console.log(`  Archivos escaneados:  ${files.length}`);
  console.log(`  Archivos modificados: ${changedFiles}`);
  console.log(`  Archivos con error:   ${erroredFiles}`);
  console.log(`  Total hits de redacción: ${totalHits}`);

  // ── Circuit breaker: --strict ─────────────────────────────────────
  let strictFailed = false;
  if (FLAGS.strict && FLAGS.apply) {
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('CIRCUIT BREAKER (--strict)');
    console.log('─────────────────────────────────────────────────────────────');

    // Cargar secrets custom si se pasó --secrets-file
    let secrets = DEFAULT_KNOWN_SECRETS;
    if (FLAGS.secretsFile) {
      const customSecrets = loadSecretsFile(FLAGS.secretsFile);
      if (customSecrets.length > 0) {
        secrets = customSecrets;
        console.log(`  Cargados ${customSecrets.length} secrets custom desde: ${FLAGS.secretsFile}`);
      }
    } else {
      console.log(`  Verificando ${secrets.length} secrets conocidos por defecto.`);
    }

    let totalLeaks = 0;
    // El circuit breaker revisa TODOS los archivos procesados (no solo los
    // modificados). Si un secret conocido está en un archivo que las reglas
    // no tocaron, sigue siendo un leak. Esto detecta bugs en las reglas
    // (p.ej. una regex que no captura el formato esperado).
    for (const result of results) {
      if (result.error) continue;
      const filepath = result.filepath;
      const content = fs.readFileSync(filepath, 'utf8');
      const detection = detectLeaks(content, secrets);

      if (detection.leaked) {
        console.log(`  ❌ ${path.relative(PROJECT_ROOT, filepath)}: aún contiene:`);
        for (const f of detection.found) {
          console.log(`     - ${f.secret} × ${f.count}`);
        }
        totalLeaks += detection.found.reduce((s, f) => s + f.count, 0);
      } else {
        const mark = result.changed ? '✓' : '✓ (sin cambios)';
        console.log(`  ${mark} ${path.relative(PROJECT_ROOT, filepath)}: limpio`);
      }
    }

    if (totalLeaks > 0) {
      console.log(`\n  ❌ STRICT MODE: ${totalLeaks} leaks detectados después de la purga.`);
      console.log('     Esto indica un BUG en el script. Revisar reglas y re-ejecutar.');
      strictFailed = true;
    } else {
      console.log('\n  ✅ STRICT MODE: todos los secrets conocidos fueron purgados.');
    }
  }

  if (totalHits === 0 && !strictFailed) {
    console.log('\n✅ No se encontraron credenciales en los logs. Nada que sanear.\n');
    process.exit(0);
  }

  if (strictFailed) {
    process.exit(2);
  }

  if (!FLAGS.apply) {
    console.log('\n⚠️  DRY-RUN: no se modificó ningún archivo.');
    console.log('   Para aplicar los cambios, ejecuta:');
    console.log('   node scripts/purge-sensitive-logs.js --apply --backup --strict\n');
  } else {
    console.log('\n✅ Archivos saneados exitosamente.');
    if (FLAGS.backup) {
      console.log('   Copias de seguridad creadas con extensión .bak');
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
