const { query, pool } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

/**
 * Endpoint de Recomendación FEFO
 * Busca muestras dispensadas por nombre y recomienda las que están más cerca del vencimiento.
 * Incluye el nombre real del anaquel donde está almacenada cada muestra.
 */
const getFefoRecommendation = async (req, res, next) => {
  try {
    const { product_name } = req.query;
    if (!product_name) throw new AppError('El nombre del producto es requerido', 400);

    const result = await query(`
      SELECT 
        ds.id as dispensed_id,
        ds.qr_code,
        ds.status,
        ds.weight_grams,
        ds.weight_grams as weight_per_unit_grams,
        ds.position_y as level,
        ds.position_x as column_x,
        ds.position_z as depth_z,
        gs.id as global_sample_id,
        gs.name,
        gs.lot,
        gs.expiration_date,
        gs.manufacture_date,
        gs.coa_file_path,
        COALESCE(sh.name, 'Sin asignar') as shelf_name,
        COALESCE(sh.id, NULL) as shelf_id,
        COALESCE(ml.name, 'Sin línea') as market_line_name,
        -- Días restantes hasta vencimiento (negativo = ya venció)
        (gs.expiration_date::date - CURRENT_DATE) as days_until_expiry
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      LEFT JOIN market_lines ml ON sh.market_line_id = ml.id
      WHERE gs.name ILIKE $1 AND ds.status = 'stored'
      ORDER BY gs.expiration_date ASC
      LIMIT 20
    `, [`%${product_name}%`]);

    res.json({
      success: true,
      data: {
        product_name,
        total_found: result.rows.length,
        recommendations: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirmar Despacho
 * Valida la regla FEFO, ejecuta el despacho en transacción atómica
 * y registra el movimiento con trazabilidad completa.
 */
const executeDispatch = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { qr_code, expected_product_name } = req.body;
    if (!qr_code) throw new AppError('El código QR es requerido', 400);

    // Buscar muestra dispensada con todos sus datos relacionados
    const sampleCheck = await query(`
      SELECT 
        ds.*,
        gs.id as global_sample_id,
        gs.available_units,
        gs.coa_file_path,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        gs.market_line_id,
        COALESCE(sh.name, 'Sin asignar') as shelf_name,
        COALESCE(sh.id, NULL) as shelf_id
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      LEFT JOIN shelves sh ON ds.shelf_id = sh.id
      WHERE ds.qr_code = $1
    `, [qr_code]);

    if (sampleCheck.rows.length === 0) {
      throw new AppError('Código de muestra escaneado no encontrado en la base de datos', 404);
    }

    const sample = sampleCheck.rows[0];

    // REGLA DE NEGOCIO: Validar nombre del producto si se proporcionó
    if (expected_product_name) {
      if (sample.product_name.toLowerCase() !== expected_product_name.toLowerCase()) {
        throw new AppError(
          `Bloqueo de Seguridad: Escaneaste [${sample.product_name}], pero intentabas despachar [${expected_product_name}].`,
          403
        );
      }
    }

    if (sample.status !== 'stored') {
      throw new AppError('La muestra ya fue despachada o no está disponible', 400);
    }

    // Transacción atómica con FOR UPDATE (TOCTOU fix + DISPATCH-02)
    await client.query('BEGIN');

    // Lock the global_samples row inside the transaction
    const lockResult = await client.query(
      'SELECT available_units FROM global_samples WHERE id = $1 FOR UPDATE',
      [sample.global_sample_id]
    );
    if (!lockResult.rows[0] || lockResult.rows[0].available_units <= 0) {
      throw new AppError('No hay unidades disponibles en el stock global', 400);
    }

    // 1. Marcar la muestra dispensada como despachada
    await client.query(
      `UPDATE dispensed_samples SET status = 'dispatched', dispatched_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [sample.id]
    );

    // 2. Reducir contador con WHERE available_units > 0 (DISPATCH-02)
    const updateResult = await client.query(
      `UPDATE global_samples SET available_units = available_units - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND available_units > 0`,
      [sample.global_sample_id]
    );
    if (updateResult.rowCount === 0) {
      throw new AppError('No hay unidades disponibles en el stock global', 400);
    }

    // 3. Registrar movimiento con trazabilidad completa
    await client.query(
      `INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)`,
      [
        sample.global_sample_id,
        'dispatched',
        req.user.id,
        JSON.stringify({
          type: 'dispatch',
          dispensed_sample_id: sample.id,
          qr_code: sample.qr_code,
          shelf_name: sample.shelf_name,
          lot: sample.lot,
          expiration_date: sample.expiration_date,
          dispatched_by: req.user.username
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Muestra despachada exitosamente desde ${sample.shelf_name}`,
      data: {
        product_name: sample.product_name,
        lot: sample.lot,
        expiration_date: sample.expiration_date,
        shelf_name: sample.shelf_name,
        qr_code: sample.qr_code,
        coa_file_path: sample.coa_file_path,
        dispatched_by: req.user.username,
        dispatched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) { console.error('[DISPATCH] Error en rollback:', e.message); }
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Historial de Despachos
 * Retorna los últimos N despachos registrados en movements.
 */
const getDispatchHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit) || 20;
    const pageNum  = parseInt(page)  || 1;
    const offset   = (pageNum - 1) * limitNum;

    const result = await query(`
      SELECT
        m.id,
        m.timestamp as created_at,
        m.details,
        gs.name as product_name,
        gs.lot,
        gs.expiration_date,
        u.username as dispatched_by
      FROM movements m
      LEFT JOIN global_samples gs ON m.sample_id = gs.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.action_type = 'dispatched'
      ORDER BY m.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limitNum, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM movements WHERE action_type = 'dispatched'
    `);

    const history = result.rows.map(row => {
      let details = {};
      try { details = JSON.parse(row.details); } catch {}
      return {
        id: row.id,
        product_name: row.product_name || details.product_name || 'Desconocido',
        lot: row.lot || details.lot || 'Desconocido',
        expiration_date: row.expiration_date || details.expiration_date || null,
        qr_code: details.qr_code || 'N/A',
        shelf_name: details.shelf_name || 'Sin asignar',
        dispatched_by: row.dispatched_by || details.dispatched_by || 'Sistema',
        dispatched_at: row.created_at
      };
    });

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFefoRecommendation,
  executeDispatch,
  getDispatchHistory
};
