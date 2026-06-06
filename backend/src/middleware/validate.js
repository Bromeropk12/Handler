/**
 * Middleware de validación con Joi (H7).
 *
 * Uso:
 *   const { validate, schemas } = require('../../middleware/validate');
 *   router.post('/login', validate(schemas.authLogin), controller.login);
 *
 * El middleware:
 *   1. Valida req.body (por defecto) o req.query / req.params (opcional).
 *   2. Reemplaza la fuente validada con el resultado saneado
 *      (campos extra se descartan, valores se coercinan, defaults se aplican).
 *   3. Devuelve 400 con detalle de campos inválidos en caso de fallo.
 */
const { AppError } = require('./errorHandler');

const validate = (schema, source = 'body') => (req, res, next) => {
  if (!schema) return next();

  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(new AppError(
      `Datos de entrada inválidos: ${details.map(d => d.field).join(', ')}`,
      400
    ));
  }

  // Reemplazar con la versión saneada/coercionada
  req[source] = value;
  next();
};

// ─────────────────────────────────────────
//  Schemas reutilizables
// ─────────────────────────────────────────
const Joi = require('joi');

const schemas = {
  // POST /api/auth/login
  authLogin: Joi.object({
    username: Joi.string().trim().min(3).max(50).required(),
    password: Joi.string().min(1).max(200).required(),
  }),

  // POST /api/auth/reset-password (username + secret_password)
  authResetPassword: Joi.object({
    username: Joi.string().trim().min(3).max(50).required(),
    secret_password: Joi.string().min(1).max(200).required(),
    new_password: Joi.string()
      .min(8).max(200)
      .pattern(/[A-Z]/, 'uppercase')
      .pattern(/[a-z]/, 'lowercase')
      .pattern(/[0-9]/, 'digit')
      .required(),
  }),

  // POST /api/samples (campos mínimos; se permite flexibilidad para el resto)
  samplesCreate: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    supplier: Joi.string().trim().min(1).max(200).required(),
    market_line: Joi.string().trim().min(1).max(200).required(),
    arrival_date: Joi.date().iso().required(),
    expiration_date: Joi.date().iso().min(Joi.ref('arrival_date')).required(),
    quantity: Joi.number().integer().min(1).required(),
    unit: Joi.string().trim().min(1).max(20).required(),
    location: Joi.string().trim().min(1).max(100).required(),
    notes: Joi.string().trim().max(2000).allow('').optional(),
    client: Joi.string().trim().max(200).allow('').optional(),
    properties: Joi.object().pattern(
      Joi.string().max(50),
      Joi.string().max(500)
    ).max(50).optional(),
  }),

  // POST /api/dispensing/subdivide
  dispensingSubdivide: Joi.object({
    parent_qr_code: Joi.string().trim().min(1).max(100).required(),
    subdivisions: Joi.array().items(
      Joi.object({
        quantity: Joi.number().positive().precision(4).required(),
        unit: Joi.string().trim().min(1).max(20).required(),
        destination: Joi.string().trim().min(1).max(200).required(),
      })
    ).min(1).max(50).required(),
  }),
};

module.exports = { validate, schemas };
