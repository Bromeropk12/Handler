/**
 * Shelf Operations Module
 * Operaciones CRUD para gestión de anaqueles
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { validateShelfData } = require('./validations');

/**
 * Crear nuevo anaquel
 */
const createShelf = async (req, res, next) => {
  try {
    const data = req.body;
    validateShelfData(data);

    // Verificar que el market_line_id existe
    const marketLine = await query('SELECT id FROM market_lines WHERE id = $1', [data.market_line_id]);
    if (marketLine.rows.length === 0) {
      throw new AppError('Línea de mercado no encontrada', 404);
    }

    // Verificar que no exista un anaquel con el mismo nombre en la línea
    const existing = await query(
      'SELECT id FROM shelves WHERE market_line_id = $1 AND name = $2',
      [data.market_line_id, data.name]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Ya existe un anaquel con este nombre en la línea de mercado', 409);
    }

    // Crear anaquel
    const result = await query(`
      INSERT INTO shelves (
        market_line_id, name, provider, grid_width, grid_height
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      data.market_line_id,
      data.name,
      data.provider || null,
      data.grid_width || 10,
      data.grid_height || 10
    ]);

    const shelf = result.rows[0];

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      shelf.id,
      'created',
      req.user.id,
      JSON.stringify({
        type: 'shelf_creation',
        market_line_id: data.market_line_id,
        grid_size: `${shelf.grid_width}x${shelf.grid_height}`
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Anaquel creado exitosamente',
      data: {
        shelf: {
          id: shelf.id,
          market_line_id: shelf.market_line_id,
          name: shelf.name,
          provider: shelf.provider,
          grid_width: shelf.grid_width,
          grid_height: shelf.grid_height,
          total_capacity: shelf.total_capacity,
          created_at: shelf.created_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Listar anaqueles con filtros y estadísticas
 */
const getShelves = async (req, res, next) => {
  try {
    const {
      market_line_id,
      provider,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Filtro por línea de mercado
    if (market_line_id) {
      whereConditions.push(`s.market_line_id = $${paramIndex}`);
      params.push(market_line_id);
      paramIndex++;
    }

    // Filtro por proveedor
    if (provider) {
      whereConditions.push(`s.provider ILIKE $${paramIndex}`);
      params.push(`%${provider}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Consulta principal con estadísticas
    const queryText = `
      SELECT
        s.*,
        ml.name as market_line_name,
        COALESCE(stats.occupied_count, 0) as occupied_count,
        COALESCE(stats.expired_count, 0) as expired_count,
        ROUND(
          COALESCE(stats.occupied_count, 0)::numeric /
          NULLIF(s.total_capacity, 0) * 100, 1
        ) as occupancy_percentage
      FROM shelves s
      JOIN market_lines ml ON s.market_line_id = ml.id
      LEFT JOIN (
        SELECT
          shelf_id,
          COUNT(*) as occupied_count,
          COUNT(CASE WHEN expiration_date < CURRENT_DATE THEN 1 END) as expired_count
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.status = 'stored'
        GROUP BY shelf_id
      ) stats ON s.id = stats.shelf_id
      ${whereClause}
      ORDER BY ml.name, s.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM shelves s
      ${whereClause.replace(/s\./g, '')}
    `;

    const countParams = params.slice(0, -2); // Remover limit y offset
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        shelves: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener anaquel por ID con estadísticas completas
 */
const getShelfById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        s.*,
        ml.name as market_line_name,
        COALESCE(stats.occupied_count, 0) as occupied_count,
        COALESCE(stats.expired_count, 0) as expired_count,
        COALESCE(stats.near_expiry_count, 0) as near_expiry_count,
        ROUND(
          COALESCE(stats.occupied_count, 0)::numeric /
          NULLIF(s.total_capacity, 0) * 100, 1
        ) as occupancy_percentage
      FROM shelves s
      JOIN market_lines ml ON s.market_line_id = ml.id
      LEFT JOIN (
        SELECT
          shelf_id,
          COUNT(*) as occupied_count,
          COUNT(CASE WHEN expiration_date < CURRENT_DATE THEN 1 END) as expired_count,
          COUNT(CASE WHEN expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as near_expiry_count
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.status = 'stored'
        GROUP BY shelf_id
      ) stats ON s.id = stats.shelf_id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        shelf: result.rows[0]
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar anaquel
 */
const updateShelf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Verificar que existe
    const existing = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // No permitir cambiar grid si tiene muestras colocadas
    if ((data.grid_width || data.grid_height) && existing.rows[0].total_capacity > 0) {
      const occupiedCells = await query(`
        SELECT COUNT(*) as occupied
        FROM dispensed_samples
        WHERE shelf_id = $1 AND status = 'stored'
      `, [id]);

      if (occupiedCells.rows[0].occupied > 0) {
        throw new AppError('No se puede cambiar el tamaño del grid si el anaquel tiene muestras colocadas', 400);
      }
    }

    // Construir query de actualización
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'provider', 'grid_width', 'grid_height'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(data[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new AppError('No se proporcionaron campos para actualizar', 400);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE shelves
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    params.push(id);

    const result = await query(updateQuery, params);
    const updatedShelf = result.rows[0];

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      id,
      'updated',
      req.user.id,
      JSON.stringify({
        type: 'shelf_update',
        changes: Object.keys(data)
      })
    ]);

    res.json({
      success: true,
      message: 'Anaquel actualizado exitosamente',
      data: {
        shelf: updatedShelf
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar anaquel (solo si está vacío)
 */
const deleteShelf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que existe y está vacío
    const existing = await query(`
      SELECT s.*, COUNT(ds.id) as sample_count
      FROM shelves s
      LEFT JOIN dispensed_samples ds ON s.id = ds.shelf_id AND ds.status = 'stored'
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    const shelf = existing.rows[0];

    if (shelf.sample_count > 0) {
      throw new AppError('No se puede eliminar un anaquel que contiene muestras', 400);
    }

    // Eliminar anaquel
    await query('DELETE FROM shelves WHERE id = $1', [id]);

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      id,
      'deleted',
      req.user.id,
      JSON.stringify({
        type: 'shelf_deletion',
        market_line_id: shelf.market_line_id
      })
    ]);

    res.json({
      success: true,
      message: 'Anaquel eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf
};