/**
 * Samples Controller
 * Gestión de muestras globales (bulk) con pictogramas GHS y CoA
 */

const { query, transaction } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Pictogramas GHS válidos (los 9 del sistema SGA)
const VALID_PICTOGRAMS = [
  'Explosivo', 'Inflamable', 'Comburente', 'Gas Bajo Presión',
  'Corrosivo', 'Toxicidad Aguda', 'Irritante', 'Toxicidad Crónica',
  'Tóxico para Medio Ambiente'
];

// Validaciones para bulk samples
const validateBulkSampleData = (data) => {
  const required = ['name', 'supplier_id', 'lot', 'expiration_date', 'manufacture_date',
    'ghs_danger_class', 'market_line_id', 'dimensions', 'total_weight_grams'];

  for (const field of required) {
    if (!data[field]) {
      throw new AppError(`Campo requerido faltante: ${field}`, 400);
    }
  }

  // Validaciones de negocio
  if (new Date(data.manufacture_date) > new Date(data.expiration_date)) {
    throw new AppError('La fecha de manufactura no puede ser posterior a la fecha de vencimiento', 400);
  }

  // Dimensiones válidas en formato 3D (Ancho×Alto×Profundidad)
  const validDimensions = ['1x1x1', '1x2x1', '2x1x1', '2x2x1', '1x1x2', '1x2x2', '2x1x2', '2x2x2'];
  const legacyDimensions = { '1x1': '1x1x1', '1x2': '1x2x1', '2x1': '2x1x1', '2x2': '2x2x1' };
  if (legacyDimensions[data.dimensions]) {
    data.dimensions = legacyDimensions[data.dimensions];
  }
  if (!validDimensions.includes(data.dimensions)) {
    throw new AppError('Dimensiones inválidas. Seleccione un tamaño válido', 400);
  }

  const validDangerClasses = ['Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo'];
  if (!validDangerClasses.includes(data.ghs_danger_class)) {
    throw new AppError('Clase de peligro SGA inválida', 400);
  }

  // Validar signal_word si se proporciona
  if (data.signal_word && !['PELIGRO', 'ATENCION'].includes(data.signal_word)) {
    throw new AppError('Palabra de señal inválida. Use PELIGRO o ATENCION', 400);
  }

  // Validar pictogramas si se proporcionan
  if (data.ghs_pictograms && Array.isArray(data.ghs_pictograms)) {
    for (const p of data.ghs_pictograms) {
      if (!VALID_PICTOGRAMS.includes(p)) {
        throw new AppError(`Pictograma GHS inválido: ${p}`, 400);
      }
    }
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
      coaFilePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
    }

    // Parsear ghs_pictograms si viene como JSON string
    if (typeof data.ghs_pictograms === 'string') {
      try { data.ghs_pictograms = JSON.parse(data.ghs_pictograms); } catch (_) { data.ghs_pictograms = []; }
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

    const bulkQueries = [{
      query: `
        INSERT INTO global_samples (
          name, supplier_id, lot, expiration_date, manufacture_date,
          ghs_danger_class, market_line_id, dimensions, dispensed_size,
          total_units, available_units, total_weight_grams,
          ghs_pictograms, signal_word, coa_file_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `,
      params: [
        data.name, data.supplier_id, data.lot, data.expiration_date, data.manufacture_date,
        data.ghs_danger_class, data.market_line_id, data.dimensions, data.dispensed_size || '1x1x1',
        0, 0, // total_units, available_units - Inician en 0 hasta dispensar
        data.total_weight_grams,
        data.ghs_pictograms || [],
        data.signal_word || 'ATENCION',
        coaFilePath
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
      message: 'Muestra global creada exitosamente',
      data: { bulkSample }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      try { await fs.unlink(req.file.path); } catch (e) { }
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

    // Validar y convertir parámetros
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    // Validar rangos
    if (pageNum < 1) {
      throw new AppError('El número de página debe ser mayor o igual a 1', 400);
    }
    if (limitNum < 1 || limitNum > 1000) {
      throw new AppError('El límite debe estar entre 1 y 1000', 400);
    }

    const offset = (pageNum - 1) * limitNum;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(gs.name ILIKE $${paramIndex} OR sup.name ILIKE $${paramIndex} OR gs.lot ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (market_line_id) {
      whereConditions.push(`gs.market_line_id = $${paramIndex}`);
      params.push(market_line_id);
      paramIndex++;
    }

      if (status === 'available') {
        whereConditions.push('gs.available_units > 0');
      } else if (status === 'empty') {
        whereConditions.push('gs.available_units = 0');
      } else if (status === 'pending') {
        whereConditions.push('gs.total_units = 0');
      } else if (status === 'dispensed') {
        whereConditions.push('gs.total_units > 0');
      } else if (status === 'expired') {
        whereConditions.push('gs.expiration_date < CURRENT_DATE');
      } else if (status === 'warning') {
        whereConditions.push("gs.expiration_date >= CURRENT_DATE AND gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days'");
      }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const queryText = `
      SELECT
        gs.*,
        ml.name as market_line_name,
        sup.name as supplier_name,
        sup.logo_path as supplier_logo_path,
        CASE
          WHEN gs.total_units = 0 THEN 'pending'
          WHEN gs.available_units = 0 AND gs.total_units > 0 THEN 'empty'
          WHEN gs.expiration_date < CURRENT_DATE THEN 'expired'
          ELSE 'available'
        END as status
      FROM global_samples gs
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      ${whereClause}
      ORDER BY gs.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);
    const result = await query(queryText, params);

    // Contar total
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) as total
      FROM global_samples gs
      LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        bulkSamples: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener muestra global por ID con conteo de hijas
 */
const getBulkSampleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        gs.*,
        ml.name as market_line_name,
        sup.name as supplier_name,
        sup.logo_path as supplier_logo_path,
        CASE
          WHEN gs.total_units = 0 THEN 'pending'
          WHEN gs.available_units = 0 AND gs.total_units > 0 THEN 'empty'
          WHEN gs.expiration_date < CURRENT_DATE THEN 'expired'
          ELSE 'available'
        END as status
      FROM global_samples gs
      JOIN market_lines ml ON gs.market_line_id = ml.id
      LEFT JOIN suppliers sup ON gs.supplier_id = sup.id
      WHERE gs.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Muestra global no encontrada', 404);
    }

    // Obtener conteo de hijas por estado
    const childCounts = await query(`
      SELECT status, COUNT(*) as count
      FROM dispensed_samples
      WHERE global_sample_id = $1
      GROUP BY status
    `, [id]);

    const bulkSample = result.rows[0];
    bulkSample.child_counts = {};
    childCounts.rows.forEach(r => { bulkSample.child_counts[r.status] = parseInt(r.count); });

    res.json({
      success: true,
      data: { bulkSample }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar muestra global
 * Permite editar TODOS los campos excepto total_units y available_units
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

    // Manejar upload de nuevo CoA si existe
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        throw new AppError('El archivo CoA debe ser un PDF', 400);
      }

      // Borrar CoA anterior si existía
      if (currentSample.coa_file_path) {
        try {
          await fs.unlink(path.join(process.cwd(), currentSample.coa_file_path));
        } catch (e) { console.warn('No se pudo borrar el CoA anterior:', e.message); }
      }

      const coaDir = path.join(process.cwd(), 'uploads', 'coa');
      await fs.mkdir(coaDir, { recursive: true });
      const fileName = `${data.lot || currentSample.lot}_${Date.now()}.pdf`;
      const fullPath = path.join(coaDir, fileName);
      await fs.rename(req.file.path, fullPath);
      data.coa_file_path = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
    }

    // Parsear ghs_pictograms si viene como JSON string (común en FormData)
    if (typeof data.ghs_pictograms === 'string') {
      try { data.ghs_pictograms = JSON.parse(data.ghs_pictograms); } catch (_) {
        // Si no es JSON válido, intentar separar por comas si es string simple
        data.ghs_pictograms = data.ghs_pictograms.split(',').filter(Boolean);
      }
    }

    // Validar datos si se proporcionan
    if (Object.keys(data).length > 0) {
      validateBulkSampleData({ ...currentSample, ...data });
    }

    // Construir query de actualización dinámico
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    // Campos permitidos para edición (TODOS excepto total_units/available_units)
    const allowedFields = [
      'name', 'supplier_id', 'lot', 'expiration_date', 'manufacture_date',
      'ghs_danger_class', 'market_line_id', 'dimensions', 'dispensed_size', 'total_weight_grams',
      'coa_file_path', 'ghs_pictograms', 'signal_word'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(data[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0 && !req.file) {
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
        changes: Object.keys(data).filter(k => allowedFields.includes(k))
      })
    ]);

    res.json({
      success: true,
      message: 'Muestra global actualizada exitosamente',
      data: { bulkSample: updatedSample }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar muestra global (permitido siempre, con advertencia si tiene hijas)
 */
const deleteBulkSample = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirm_delete } = req.body;

    const existing = await query(`
      SELECT gs.*,
             (SELECT COUNT(*) FROM dispensed_samples WHERE global_sample_id = $1) as child_count,
             (SELECT COUNT(*) FROM dispensed_samples WHERE global_sample_id = $1 AND status = 'dispatched') as dispatched_count
      FROM global_samples gs
      WHERE gs.id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      throw new AppError('Muestra global no encontrada', 404);
    }

    const sample = existing.rows[0];

    // Si tiene hijas, requerir confirmación explícita
    if (parseInt(sample.child_count) > 0 && !confirm_delete) {
      return res.status(409).json({
        success: false,
        requires_confirmation: true,
        message: `Esta muestra tiene ${sample.child_count} muestra(s) hija(s) (${sample.dispatched_count} despachadas). Eliminarla borrará TODAS las hijas y sus posiciones en anaqueles. ¿Confirmar eliminación?`,
        data: {
          child_count: parseInt(sample.child_count),
          dispatched_count: parseInt(sample.dispatched_count)
        }
      });
    }

    // Eliminar archivo CoA si existe
    if (sample.coa_file_path) {
      try {
        await fs.unlink(path.join(process.cwd(), sample.coa_file_path));
      } catch (fileError) {
        console.warn('Error eliminando archivo CoA:', fileError.message);
      }
    }

    // Eliminar de BD (CASCADE eliminará dispensed_samples)
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
        child_count: parseInt(sample.child_count),
        total_weight: sample.total_weight_grams
      })
    ]);

    res.json({
      success: true,
      message: `Muestra global eliminada exitosamente${parseInt(sample.child_count) > 0 ? ` (${sample.child_count} hijas eliminadas)` : ''}`
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
      data: { marketLines: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener proveedores disponibles
 */
const getSuppliers = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM global_samples gs WHERE gs.supplier_id = s.id) as sample_count
      FROM suppliers s 
      ORDER BY s.name ASC
    `);
    res.json({
      success: true,
      data: { suppliers: result.rows }
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
  getSuppliers,
};