/**
 * Market Lines Controller
 * CRUD completo para líneas de negocio/mercado
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * GET /api/market-lines
 * Listar todas las líneas de mercado con estadísticas
 */
const getMarketLines = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        ml.*,
        COUNT(DISTINCT sh.id) as shelf_count,
        COUNT(DISTINCT gs.id) as bulk_count,
        COUNT(DISTINCT ds.id) as dispensed_count
      FROM market_lines ml
      LEFT JOIN shelves sh ON sh.market_line_id = ml.id
      LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
      LEFT JOIN dispensed_samples ds ON ds.global_sample_id = gs.id AND ds.status = 'stored'
      GROUP BY ml.id
      ORDER BY ml.name ASC
    `);

    res.json({
      success: true,
      data: {
        marketLines: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/market-lines/:id
 * Obtener línea de mercado por ID con detalles
 */
const getMarketLineById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        ml.*,
        COUNT(DISTINCT sh.id) as shelf_count,
        COUNT(DISTINCT gs.id) as bulk_count,
        COUNT(DISTINCT ds.id) as dispensed_count
      FROM market_lines ml
      LEFT JOIN shelves sh ON sh.market_line_id = ml.id
      LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
      LEFT JOIN dispensed_samples ds ON ds.global_sample_id = gs.id AND ds.status = 'stored'
      WHERE ml.id = $1
      GROUP BY ml.id
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Línea de mercado no encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        marketLine: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/market-lines
 * Crear nueva línea de mercado
 */
const createMarketLine = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('El nombre es requerido', 400);
    }

    // Verificar que no exista
    const existing = await query('SELECT id FROM market_lines WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) {
      throw new AppError('Ya existe una línea de mercado con este nombre', 409);
    }

    const result = await query(
      'INSERT INTO market_lines (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Línea de mercado creada exitosamente',
      data: {
        marketLine: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/market-lines/:id
 * Actualizar línea de mercado
 */
const updateMarketLine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('El nombre es requerido', 400);
    }

    // Verificar que existe
    const existing = await query('SELECT id FROM market_lines WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Línea de mercado no encontrada', 404);
    }

    // Verificar que el nuevo nombre no exista en otra línea
    const duplicate = await query('SELECT id FROM market_lines WHERE name = $1 AND id != $2', [name.trim(), id]);
    if (duplicate.rows.length > 0) {
      throw new AppError('Ya existe una línea de mercado con este nombre', 409);
    }

    const result = await query(
      'UPDATE market_lines SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );

    res.json({
      success: true,
      message: 'Línea de mercado actualizada exitosamente',
      data: {
        marketLine: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/market-lines/:id
 * Eliminar línea de mercado (solo si no tiene anaqueles ni muestras)
 */
const deleteMarketLine = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const existing = await query('SELECT id FROM market_lines WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Línea de mercado no encontrada', 404);
    }

    // Verificar que no tiene anaqueles
    const shelves = await query('SELECT COUNT(*) as count FROM shelves WHERE market_line_id = $1', [id]);
    if (parseInt(shelves.rows[0].count) > 0) {
      throw new AppError('No se puede eliminar porque tiene anaqueles asociados', 400);
    }

    // Verificar que no tiene muestras bulk
    const bulks = await query('SELECT COUNT(*) as count FROM global_samples WHERE market_line_id = $1', [id]);
    if (parseInt(bulks.rows[0].count) > 0) {
      throw new AppError('No se puede eliminar porque tiene muestras bulk asociadas', 400);
    }

    await query('DELETE FROM market_lines WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Línea de mercado eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarketLines,
  getMarketLineById,
  createMarketLine,
  updateMarketLine,
  deleteMarketLine
};