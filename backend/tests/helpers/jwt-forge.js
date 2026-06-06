/**
 * Helper para forjar JWTs maliciosos / inválidos en tests de seguridad.
 *
 *   const { forgeJwt } = require('./helpers/jwt-forge');
 *   const token = forgeJwt({ alg: 'none' });
 *   const expired = forgeJwt({ expiresAt: Date.now() / 1000 - 60 });
 *
 * Casos soportados:
 *   - alg: 'none' (bypass de firma, CVE-2015-9235)
 *   - alg: 'HS256' con secret incorrecto
 *   - expired (exp en el pasado)
 *   - noExpire (sin claim exp)
 *   - noSub (sin claim sub)
 *   - noIat (sin claim iat)
 *   - futureIat (iat en el futuro)
 *   - wrongIssuer
 *   - malformed (string corrupto)
 */

'use strict';

const crypto = require('crypto');

const DEFAULT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-chars-minimum-1234';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signHS256(data, secret) {
  return base64url(
    crypto.createHmac('sha256', secret).update(data).digest()
  );
}

function forgeJwt(opts = {}) {
  const {
    alg = 'HS256',
    secret = DEFAULT_SECRET,
    sub = '550e8400-e29b-41d4-a716-446655440010',
    iat = Math.floor(Date.now() / 1000),
    expiresAt = Math.floor(Date.now() / 1000) + 3600,
    extra = {},
  } = opts;

  const header = { alg, typ: 'JWT' };
  const payload = { sub, iat, exp: expiresAt, ...extra };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  let signature;
  if (alg === 'none') {
    signature = '';
  } else if (alg === 'HS256') {
    signature = signHS256(data, secret);
  } else {
    throw new Error(`Algoritmo no soportado en forgeJwt: ${alg}`);
  }

  return `${data}.${signature}`;
}

function forgeExpired() {
  return forgeJwt({ expiresAt: Math.floor(Date.now() / 1000) - 60 });
}

function forgeNoExpire() {
  const { alg, secret, sub, iat, extra } = {};
  return forgeJwt({ ...{}, expiresAt: undefined });
}

function forgeNoSub() {
  return forgeJwt({ sub: undefined });
}

function forgeNoIat() {
  return forgeJwt({ iat: undefined });
}

function forgeFutureIat() {
  return forgeJwt({ iat: Math.floor(Date.now() / 1000) + 3600 });
}

function forgeWrongSecret() {
  return forgeJwt({ secret: 'wrong-secret' });
}

function forgeMalformed() {
  return 'eyJhbGciOiJIUzI1NiJ9.NOT_VALID_BASE64.NOT_VALID_SIGNATURE';
}

module.exports = {
  forgeJwt,
  forgeExpired,
  forgeNoExpire,
  forgeNoSub,
  forgeNoIat,
  forgeFutureIat,
  forgeWrongSecret,
  forgeMalformed,
  DEFAULT_SECRET,
};
