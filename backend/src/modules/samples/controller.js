/**
 * Samples Controller
 * Gestión de muestras globales (bulk) con pictogramas GHS y CoA
 */

const { query, transaction, pool } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const fs = require('fs').promises;
const path = require('path');

// Removed getCoaBaseDir since we no longer copy files internally

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

  // Validar fechas ISO reales
  const manDate = new Date(data.manufacture_date);
  const expDate = new Date(data.expiration_date);
  if (isNaN(manDate.getTime())) {
    throw new AppError(`Fecha de manufactura inválida: "${data.manufacture_date}". Use formato ISO (YYYY-MM-DD)`, 400);
  }
  if (isNaN(expDate.getTime())) {
    throw new AppError(`Fecha de vencimiento inválida: "${data.expiration_date}". Use formato ISO (YYYY-MM-DD)`, 400);
  }
  if (manDate > expDate) {
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

  // Validar precaution_phrases si se proporcionan
  if (data.precaution_phrases && Array.isArray(data.precaution_phrases)) {
    if (data.precaution_phrases.length > 4) {
      throw new AppError('Máximo 4 frases de precaución permitidas', 400);
    }
    for (const ph of data.precaution_phrases) {
      if (!ph.text || typeof ph.text !== 'string') {
        throw new AppError('Cada frase de precaución debe tener un campo "text" válido', 400);
      }
      if (ph.text.length > 120) {
        throw new AppError(`Frase de precaución excede 120 caracteres: "${ph.text.substring(0, 30)}..."`, 400);
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
    // Tomar la ruta ingresada por el usuario (UNC o local) sin hacer copias
    let coaFilePath = data.coa_file_path || null;

    // Parsear ghs_pictograms si viene como JSON string
    if (typeof data.ghs_pictograms === 'string') {
      try { data.ghs_pictograms = JSON.parse(data.ghs_pictograms); } catch (_) { data.ghs_pictograms = []; }
    }

    // Parsear precaution_phrases si viene como JSON string
    if (typeof data.precaution_phrases === 'string') {
      try { data.precaution_phrases = JSON.parse(data.precaution_phrases); } catch (_) { data.precaution_phrases = []; }
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

    const client = await pool.connect();
    let bulkSample;

    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO global_samples (
          name, supplier_id, lot, expiration_date, manufacture_date,
          ghs_danger_class, market_line_id, dimensions, dispensed_size,
          total_units, available_units, total_weight_grams,
          ghs_pictograms, signal_word, coa_file_path, precaution_phrases
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        data.name, data.supplier_id, data.lot, data.expiration_date, data.manufacture_date,
        data.ghs_danger_class, data.market_line_id, data.dimensions, data.dispensed_size || '1x1x1',
        0, 0,
        data.total_weight_grams,
        data.ghs_pictograms || [],
        data.signal_word || 'ATENCION',
        coaFilePath,
        JSON.stringify(data.precaution_phrases || [])
      ]);
      bulkSample = result.rows[0];

      await client.query(`
        INSERT INTO movements (sample_id, action_type, user_id, details)
        VALUES ($1, $2, $3, $4)
      `, [
        bulkSample.id, 'created', req.user.id,
        JSON.stringify({ type: 'bulk_creation', info: 'Muestra Global Creada, pendiente por dispensar.' })
      ]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json({
      success: true,
      message: 'Muestra global creada exitosamente',
      data: { bulkSample }
    });

  } catch (error) {
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
      status, // 'available', 'empty', 'all'
      sort    // 'alphabetical'
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

      // FIX #13: documentar la semántica de cada filtro y añadir alias explícito.
      //   available   → aún tiene frascos hijos disponibles (available_units > 0)
      //   empty       → todos los frascos hijos fueron consumidos (available_units = 0)
      //   pending     → aún no se ha subdividido (total_units = 0, sin hijos generados)
      //   subdivided  → ya fue subdividido (total_units > 0). Alias claro de 'dispensed'.
      //   dispensed   → alias legacy de 'subdivided' (mantener compat con frontend).
      //   expired     → fecha de expiración ya pasó
      //   warning     → expira en los próximos 30 días
      if (status === 'available') {
        whereConditions.push('gs.available_units > 0');
      } else if (status === 'empty') {
        whereConditions.push('gs.available_units = 0');
      } else if (status === 'pending') {
        whereConditions.push('gs.total_units = 0');
      } else if (status === 'subdivided' || status === 'dispensed') {
        whereConditions.push('gs.total_units > 0');
      } else if (status === 'expired') {
        whereConditions.push('gs.expiration_date < CURRENT_DATE');
      } else if (status === 'warning') {
        whereConditions.push("gs.expiration_date >= CURRENT_DATE AND gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days'");
      }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderByClause = 'ORDER BY gs.created_at DESC';
    if (sort === 'alphabetical') {
      orderByClause = 'ORDER BY gs.name ASC, gs.created_at DESC';
    }

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
      ${orderByClause}
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

    const coaFilePath = data.coa_file_path || null;

    // Parsear ghs_pictograms si viene como JSON string (común en FormData)
    if (typeof data.ghs_pictograms === 'string') {
      try { data.ghs_pictograms = JSON.parse(data.ghs_pictograms); } catch (_) {
        // Si no es JSON válido, intentar separar por comas si es string simple
        data.ghs_pictograms = data.ghs_pictograms.split(',').filter(Boolean);
      }
    }

    // Parsear precaution_phrases si viene como JSON string
    if (typeof data.precaution_phrases === 'string') {
      try { data.precaution_phrases = JSON.parse(data.precaution_phrases); } catch (_) { data.precaution_phrases = []; }
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
      'coa_file_path', 'ghs_pictograms', 'signal_word', 'precaution_phrases'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        // Stringify precaution_phrases for JSONB column
        params.push(field === 'precaution_phrases' ? JSON.stringify(data[field]) : data[field]);
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

    const client = await pool.connect();
    let updatedSample;

    try {
      await client.query('BEGIN');

      const result = await client.query(updateQuery, params);
      updatedSample = result.rows[0];

      await client.query(`
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

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Eliminar de BD (CASCADE eliminará dispensed_samples)
      await client.query('DELETE FROM global_samples WHERE id = $1', [id]);

      // Log del movimiento
      await client.query(`
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

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Eliminar archivo CoA si existe (después de COMMIT, best-effort)
    if (sample.coa_file_path) {
      try {
        await fs.unlink(path.join(config.coa.baseDir, path.basename(sample.coa_file_path)));
      } catch (fileError) {
        console.warn('Error eliminando archivo CoA:', fileError.message);
      }
    }

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

/**
 * Proxy para descargar/ver CoA desde cualquier ruta del servidor (UNC/Local)
 * Usa fs.readFile + res.send en vez de res.sendFile para compatibilidad con rutas UNC
 */
const downloadCoA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sample = await query('SELECT coa_file_path FROM global_samples WHERE id = $1', [id]);
    
    if (sample.rows.length === 0 || !sample.rows[0].coa_file_path) {
      throw new AppError('No hay CoA asociado a esta muestra', 404);
    }
    
    const filePath = sample.rows[0].coa_file_path.trim();
    const isUNC = filePath.startsWith('\\\\');

    try {
      // Leer el archivo completo en memoria (funciona con rutas UNC y locales)
      const fileBuffer = await fs.readFile(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Content-Disposition', `inline; filename="CoA_${id}.pdf"`);
      res.send(fileBuffer);
    } catch (fsError) {
      console.error(`[CoA] Error accediendo a archivo: ${filePath}`, fsError.message);
      
      let hint = '';
      if (isUNC) {
        hint = ` La ruta es de red (UNC). Verifique: 1) El servicio backend tiene permisos de red, 2) La ruta ${filePath} es accesible desde esta máquina, 3) Las credenciales de red del servicio tienen acceso al share.`;
      } else {
        hint = ' Verifique que la ruta sea accesible desde la máquina donde corre el servidor.';
      }

      throw new AppError(
        `No se pudo acceder al archivo CoA en: ${filePath}.${hint}`,
        404
      );
    }
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
  downloadCoA
};