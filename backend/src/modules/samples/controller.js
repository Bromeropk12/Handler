/**
 * Samples Controller
 * Gestión de muestras globales (bulk) con upload de CoA
 */

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Validaciones para bulk samples
const validateBulkSampleData = (data) => {
  const required = ['name', 'supplier_id', 'lot', 'expiration_date', 'manufacture_date',
                   'ghs_danger_class', 'market_line_id', 'dimensions', 'weight_per_unit_grams'];

  for (const field of required) {
    if (!data[field]) {
      throw new AppError(`Campo requerido faltante: ${field}`, 400);
    }
  }

  // Validaciones de negocio
  if (new Date(data.manufacture_date) > new Date(data.expiration_date)) {
    throw new AppError('La fecha de manufactura no puede ser posterior a la fecha de vencimiento', 400);
  }

  const validDimensions = ['1x1', '1x2', '2x1', '2x2'];
  if (!validDimensions.includes(data.dimensions)) {
    throw new AppError('Dimensiones inválidas. Deben ser: 1x1, 1x2, 2x1 o 2x2', 400);
  }

  const validDangerClasses = ['Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo'];
  if (!validDangerClasses.includes(data.ghs_danger_class)) {
    throw new AppError('Clase de peligro SGA inválida', 400);
  }
};

/**
 * Crear nueva muestra global (bulk)
 */
const createBulkSample = async (req, res, next) => {
  try {
    const data = req.body;
    let coaFilePath = null;

    // Manejar upload de CoA si existe
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
         throw new AppError('El archivo CoA debe ser un PDF', 400);
      }
      const coaDir = path.join(process.cwd(), 'uploads', 'coa');
      await fs.mkdir(coaDir, { recursive: true });
      const fileName = `${data.lot}_${Date.now()}.pdf`;
      const fullPath = path.join(coaDir, fileName);
      await fs.rename(req.file.path, fullPath);
      coaFilePath = path.relative(process.cwd(), fullPath);
    }

    validateBulkSampleData(data);

    // Verificar línea de mercado
    const marketLine = await query('SELECT id FROM market_lines WHERE id = $1', [data.market_line_id]);
    if (marketLine.rows.length === 0) {
      throw new AppError('Línea de mercado no encontrada', 404);
    }

    // Verificar lote único
    const existing = await query('SELECT id FROM global_samples WHERE lot = $1', [data.lot]);
    if (existing.rows.length > 0) {
      throw new AppError('Ya existe una muestra global con este lote', 409);
    }

    // Verificar proveedor
    const supplier = await query('SELECT id FROM suppliers WHERE id = $1', [data.supplier_id]);
    if (supplier.rows.length === 0) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    // Iniciar transacción para crear Bulk (El contenedor Padre). Sus hijos se crearán al Dispensar.
    const bulkQueries = [{
      query: `
        INSERT INTO global_samples (
          name, supplier_id, lot, expiration_date, manufacture_date,
          ghs_danger_class, market_line_id, dimensions,
          total_units, available_units, weight_per_unit_grams, coa_file_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)
        RETURNING *
      `,
      params: [
        data.name, data.supplier_id, data.lot, data.expiration_date, data.manufacture_date,
        data.ghs_danger_class, data.market_line_id, data.dimensions,
        0, 0, // Inician en 0 hasta que sean Dispensados (subdivididos)
        data.weight_per_unit_grams, coaFilePath
      ]
    }];

    const txResult = await transaction(bulkQueries);
    const bulkSample = txResult[0].rows[0];

    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      bulkSample.id, 'created', req.user.id,
      JSON.stringify({ type: 'bulk_creation', info: 'Muestra Global Creada, pendiente por dispensar.' })
    ]);

    res.status(201).json({
      success: true,
      message: 'Muestra global e hijos creados exitosamente',
      data: { bulkSample }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

/**
 * Listar muestras globales con filtros
 */
const getBulkSamples = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      market_line_id,
      status // 'available', 'empty', 'all'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Filtro de búsqueda
    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR provider ILIKE $${paramIndex} OR lot ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por línea de mercado
    if (market_line_id) {
      whereConditions.push(`market_line_id = $${paramIndex}`);
      params.push(market_line_id);
      paramIndex++;
    }

    // Filtro por estado
    if (status === 'available') {
      whereConditions.push('available_units > 0');
    } else if (status === 'empty') {
      whereConditions.push('available_units = 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Consulta principal
    const queryText = `
      SELECT
        gs.*,
        ml.name as market_line_name,
        sup.name as supplier_name,
        CASE
          WHEN gs.available_units = 0 THEN 'empty'
          WHEN gs.expiration_date < CURRENT_DATE THEN 'expired'
          ELSE 'available'
        END as status
      FROM global_samples gs
      JOIN market_lines ml ON gs.market_line_id = ml.id
      JOIN suppliers sup ON gs.supplier_id = sup.id
      ${whereClause}
      ORDER BY gs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM global_samples gs
      ${whereClause.replace(/gs\./g, '')}
    `;

    const countParams = params.slice(0, -2); // Remover limit y offset
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        bulkSamples: result.rows,
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
 * Obtener muestra global por ID
 */
const getBulkSampleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        gs.*,
        ml.name as market_line_name,
        sup.name as supplier_name,
        CASE
          WHEN gs.available_units = 0 THEN 'empty'
          WHEN gs.expiration_date < CURRENT_DATE THEN 'expired'
          ELSE 'available'
        END as status
      FROM global_samples gs
      JOIN market_lines ml ON gs.market_line_id = ml.id
      JOIN suppliers sup ON gs.supplier_id = sup.id
      WHERE gs.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Muestra global no encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        bulkSample: result.rows[0]
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar muestra global
 */
const updateBulkSample = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Verificar que existe
    const existing = await query('SELECT * FROM global_samples WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Muestra global no encontrada', 404);
    }

    const currentSample = existing.rows[0];

    // No permitir actualizar si ya se ha dispensado
    if (currentSample.current_weight_grams < currentSample.total_weight_grams) {
      throw new AppError('No se puede actualizar una muestra que ya ha sido dispensada', 400);
    }

    // Validar datos si se proporcionan
    if (Object.keys(data).length > 0) {
      validateBulkSampleData({ ...currentSample, ...data });
    }

    // Construir query de actualización
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'provider', 'expiration_date', 'manufacture_date',
                          'ghs_danger_class', 'market_line_id', 'dimensions'];

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
      UPDATE global_samples
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    params.push(id);

    const result = await query(updateQuery, params);
    const updatedSample = result.rows[0];

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      id,
      'updated',
      req.user.id,
      JSON.stringify({
        type: 'bulk_update',
        changes: Object.keys(data)
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra global actualizada exitosamente',
      data: {
        bulkSample: updatedSample
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar muestra global (solo si no ha sido dispensada)
 */
const deleteBulkSample = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que existe y no ha sido dispensada
    const existing = await query(`
      SELECT gs.*, 
             (SELECT COUNT(*) FROM child_samples WHERE global_sample_id = $1 AND status != 'available') as dispensed_count
      FROM global_samples gs
      WHERE gs.id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Muestra global no encontrada', 404);
    }

    const sample = existing.rows[0];

    if (sample.dispensed_count > 0) {
      throw new AppError('No se puede eliminar porque ya se despacharon unidades', 400);
    }

    // Eliminar archivo CoA si existe
    if (sample.coa_file_path) {
      try {
        await fs.unlink(path.join(process.cwd(), sample.coa_file_path));
      } catch (fileError) {
        // Log pero no fallar
        console.warn('Error eliminando archivo CoA:', fileError.message);
      }
    }

    // Eliminar de BD
    await query('DELETE FROM global_samples WHERE id = $1', [id]);

    // Log del movimiento
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      id,
      'deleted',
      req.user.id,
      JSON.stringify({
        type: 'bulk_deletion',
        weight_grams: sample.total_weight_grams
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra global eliminada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener líneas de mercado disponibles
 */
const getMarketLines = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM market_lines ORDER BY name');

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

module.exports = {
  createBulkSample,
  getBulkSamples,
  getBulkSampleById,
  updateBulkSample,
  deleteBulkSample,
  getMarketLines,
};