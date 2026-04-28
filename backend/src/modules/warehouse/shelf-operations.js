/**
 * Shelf Operations Module
 * Operaciones CRUD para gestión de anaqueles con soporte de proveedores múltiples
 */

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { validateShelfData } = require('./validations');

/**
 * Crear nuevo anaquel con proveedores
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

    // Verificar proveedores si se proporcionan
    const supplierIds = data.supplier_ids || [];
    if (supplierIds.length > 0) {
      const suppliers = await query('SELECT id FROM suppliers WHERE id = ANY($1)', [supplierIds]);
      if (suppliers.rows.length !== supplierIds.length) {
        throw new AppError('Uno o más proveedores no existen', 404);
      }
    }

    const txQueries = [];

    // Crear anaquel 3D
    txQueries.push({
      query: `
        INSERT INTO shelves (
          market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      params: [
        data.market_line_id,
        data.name,
        data.grid_width || 10,
        data.grid_height || 10,
        data.shelf_depth || 10,
        data.shelf_type || 'storage'
      ]
    });

    // Vincular proveedores
    if (supplierIds.length > 0) {
      const shelfIdIndex = txQueries.length; // Se resolverá después
      supplierIds.forEach((supplierId, index) => {
        txQueries.push({
          query: `
            INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
            VALUES ((SELECT id FROM shelves WHERE name = $1 AND market_line_id = $2), $3, $4)
          `,
          params: [data.name, data.market_line_id, supplierId, index === 0]
        });
      });
    }

    // Log del movimiento
    txQueries.push({
      query: `
        INSERT INTO movements (sample_id, action_type, user_id, details)
        VALUES ($1, $2, $3, $4)
      `,
      params: [
        null, // Se actualizará después
        'created',
        req.user.id,
        JSON.stringify({
          type: 'shelf_creation',
          market_line_id: data.market_line_id,
          grid_size: `${data.grid_width || 10}x${data.grid_height || 10}x${data.shelf_depth || 10}`,
          supplier_count: supplierIds.length
        })
      ]
    });

    // Ejecutar transacción
    const results = await transaction(txQueries);
    const shelf = results[0].rows[0];

    // Actualizar el movement con el shelf_id (subquery compatible con PostgreSQL)
    await query(
      `UPDATE movements SET sample_id = $1
       WHERE id = (
         SELECT id FROM movements
         WHERE sample_id IS NULL AND action_type = $2 AND user_id = $3
         ORDER BY timestamp DESC
         LIMIT 1
       )`,
      [shelf.id, 'created', req.user.id]
    );

    // Obtener proveedores vinculados
    const suppliersResult = await query(`
      SELECT ss.*, s.name as supplier_name
      FROM shelf_suppliers ss
      JOIN suppliers s ON ss.supplier_id = s.id
      WHERE ss.shelf_id = $1
      ORDER BY ss.is_primary DESC, s.name ASC
    `, [shelf.id]);

    res.status(201).json({
      success: true,
      message: 'Anaquel creado exitosamente',
      data: {
        shelf: {
          ...shelf,
          suppliers: suppliersResult.rows
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
          ds.shelf_id,
          COUNT(*) as occupied_count,
          COUNT(CASE WHEN gs.expiration_date < CURRENT_DATE THEN 1 END) as expired_count
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.status = 'stored'
        GROUP BY ds.shelf_id
      ) stats ON s.id = stats.shelf_id
      ${whereClause}
      ORDER BY ml.name, s.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Contar total (reutiliza whereClause directamente — aliases s. son válidos con FROM shelves s)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM shelves s
      ${whereClause}
    `;

    const countParams = params.slice(0, -2);
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Obtener proveedores para todos los anaqueles
    const shelfIds = result.rows.map(s => s.id);
    let shelvesWithSuppliers = result.rows;

    if (shelfIds.length > 0) {
      const suppliersResult = await query(`
        SELECT ss.shelf_id, ss.supplier_id, ss.is_primary, s.name as supplier_name, s.logo_path
        FROM shelf_suppliers ss
        JOIN suppliers s ON ss.supplier_id = s.id
        WHERE ss.shelf_id = ANY($1)
        ORDER BY ss.is_primary DESC, s.name ASC
      `, [shelfIds]);

      // Agrupar proveedores por anaquel
      const suppliersByShelf = {};
      suppliersResult.rows.forEach(row => {
        if (!suppliersByShelf[row.shelf_id]) {
          suppliersByShelf[row.shelf_id] = [];
        }
        suppliersByShelf[row.shelf_id].push({
          supplier_id: row.supplier_id,
          is_primary: row.is_primary,
          supplier_name: row.supplier_name,
          logo_path: row.logo_path
        });
      });

      // Asignar proveedores a cada anaquel
      shelvesWithSuppliers = result.rows.map(shelf => ({
        ...shelf,
        suppliers: suppliersByShelf[shelf.id] || []
      }));
    }

    res.json({
      success: true,
      data: {
        shelves: shelvesWithSuppliers,
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
          ds.shelf_id,
          COUNT(*) as occupied_count,
          COUNT(CASE WHEN gs.expiration_date < CURRENT_DATE THEN 1 END) as expired_count,
          COUNT(CASE WHEN gs.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as near_expiry_count
        FROM dispensed_samples ds
        JOIN global_samples gs ON ds.global_sample_id = gs.id
        WHERE ds.status = 'stored'
        GROUP BY ds.shelf_id
      ) stats ON s.id = stats.shelf_id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    const shelf = result.rows[0];

    // Obtener proveedores vinculados
    const suppliersResult = await query(`
      SELECT ss.*, s.name as supplier_name, s.logo_path
      FROM shelf_suppliers ss
      JOIN suppliers s ON ss.supplier_id = s.id
      WHERE ss.shelf_id = $1
      ORDER BY ss.is_primary DESC, s.name ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        shelf: {
          ...shelf,
          suppliers: suppliersResult.rows
        }
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

    // No permitir cambiar dimensiones del grid si tiene muestras colocadas
    if (data.grid_width !== undefined || data.grid_height !== undefined || data.shelf_depth !== undefined) {
      const occupiedCells = await query(
        `SELECT COUNT(*) as occupied FROM dispensed_samples WHERE shelf_id = $1 AND status = 'stored'`,
        [id]
      );
      if (parseInt(occupiedCells.rows[0].occupied) > 0) {
        throw new AppError('No se puede cambiar el tamaño del grid si el anaquel tiene muestras colocadas', 400);
      }
    }

    // Construir query de actualización
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'provider', 'grid_width', 'grid_height', 'shelf_depth', 'shelf_type'];

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

    // Sincronizar proveedores si se proporcionan
    if (data.supplier_ids !== undefined) {
      const supplierIds = data.supplier_ids || [];

      // Verificar que los proveedores existen
      if (supplierIds.length > 0) {
        const suppliers = await query('SELECT id FROM suppliers WHERE id = ANY($1)', [supplierIds]);
        if (suppliers.rows.length !== supplierIds.length) {
          throw new AppError('Uno o más proveedores no existen', 404);
        }
      }

      // Obtener proveedores actuales
      const currentSuppliers = await query(
        'SELECT id, supplier_id, is_primary FROM shelf_suppliers WHERE shelf_id = $1',
        [id]
      );
      const currentIds = currentSuppliers.rows.map(s => s.supplier_id);

      // Calcular diff: proveedores a agregar y a eliminar
      // Se usa 'suppId' para evitar shadowing del outer 'id' (shelf UUID)
      const toAdd = supplierIds.filter(suppId => !currentIds.includes(suppId));
      const toRemove = currentSuppliers.rows.filter(s => !supplierIds.includes(s.supplier_id)).map(s => s.id);

      // Eliminar proveedores que ya no están
      if (toRemove.length > 0) {
        await query(`DELETE FROM shelf_suppliers WHERE id = ANY($1)`, [toRemove]);
      }

      // Agregar nuevos proveedores
      if (toAdd.length > 0) {
        for (let i = 0; i < toAdd.length; i++) {
          const isPrimary = supplierIds.length > 0 && toAdd[i] === supplierIds[0] && toAdd.length === supplierIds.length;
          await query(
            'INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary) VALUES ($1, $2, $3)',
            [id, toAdd[i], isPrimary]
          );
        }
      }

      // Actualizar proveedor principal si hay proveedores
      if (supplierIds.length > 0) {
        const primaryId = supplierIds[0];
        await query(
          'UPDATE shelf_suppliers SET is_primary = (supplier_id = $1) WHERE shelf_id = $2',
          [primaryId, id]
        );
      } else {
        // Si no hay proveedores, desmarcar todos como principales
        await query('UPDATE shelf_suppliers SET is_primary = false WHERE shelf_id = $1', [id]);
      }
    }

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

    // Obtener proveedores vinculados
    const suppliersResult = await query(`
      SELECT ss.*, s.name as supplier_name, s.logo_path
      FROM shelf_suppliers ss
      JOIN suppliers s ON ss.supplier_id = s.id
      WHERE ss.shelf_id = $1
      ORDER BY ss.is_primary DESC, s.name ASC
    `, [id]);

    res.json({
      success: true,
      message: 'Anaquel actualizado exitosamente',
      data: {
        shelf: {
          ...updatedShelf,
          suppliers: suppliersResult.rows
        }
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