/**
 * Settings Controller
 * CRUD genérico para la tabla `settings` (key-value JSONB)
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

const ensureSettingsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(50) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const listSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const result = await query('SELECT key, value, updated_at FROM settings ORDER BY key');
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const getSetting = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const { key } = req.params;
    const result = await query('SELECT key, value, updated_at FROM settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: { key: result.rows[0].key, value: result.rows[0].value, updatedAt: result.rows[0].updated_at } });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      throw new AppError('El valor de la configuración es requerido', 400);
    }

    const jsonValue = JSON.stringify(value);
    await query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = CURRENT_TIMESTAMP
    `, [key, jsonValue]);

    res.json({ success: true, message: `Configuración "${key}" actualizada exitosamente` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSettings,
  getSetting,
  updateSetting,
};
